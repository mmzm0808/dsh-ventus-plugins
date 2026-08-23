/**
 * repair-session-log.mjs — 会话日志修复（seq gap / tool source / surface 引用）
 *
 * 原理：官方 scanLog 要求事件 seq 从 0 严格连续；损坏行（重复写入或
 * 跳号）会导致 "seq gap in committed region"。重编号后事件内部的
 * seq 引用（surfaceOp.replace.start/end、sourceEventSeqs）会失效，
 * 官方 foldSurface 折叠校验抛 "surface replace: start seq X not found
 * in surface"。本脚本一次性处理全部三层：
 *   1. scanZstdFrames + decompressZstdFrame 解出全部 JSONL 明文；
 *   2. 逐行 decodeStorageRecord 展开事件；
 *   3. 按出现顺序重编号 seq，同步重写事件内 seq 引用（旧→新映射）；
 *   4. tool/result 的 source.callId 为空补合成 callId；
 *   5. eventLines(events, packChunks) 重新编码事件行；
 *   6. header 一帧 + 事件体一帧重新压缩写到 --out（默认 .repaired.zstd，
 *      不覆盖原文件；确认无误后由调用方手动替换）；
 *   7. 解压验证 scanLog + foldSurface 双通过。
 *
 * 用法：node scripts/repair-session-log.mjs <session.jsonl.zstd 路径> [--out <path>]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..')
// 官方子模块（相对路径 require；monorepo 内包未提升到根 node_modules）
const require = createRequire(import.meta.url)
const jsonl = require(join(REPO, 'packages/session/session-persistence-jsonl/lib/types/zstd.js'))
const format = require(join(REPO, 'packages/session/session-persistence-jsonl/lib/types/format.js'))
const session = require(join(REPO, 'packages/core/session/lib/index.js'))

const args = process.argv.slice(2)
const outFlag = args.indexOf('--out')
const target = args[0]
const outPath = outFlag >= 0 ? args[outFlag + 1] : target + '.repaired.zstd'
if (!target) { console.error('usage: node scripts/repair-session-log.mjs <path> [--out <path>]'); process.exit(1) }
console.log(`[repair] output -> ${outPath}（原文件不覆盖；确认无误后手动替换）`)

const { scanZstdFrames, decompressZstdFrame, compressZstdFrame } = jsonl
const { eventLines, scanLog } = format
const { decodeStorageRecord, foldSurface } = session

const raw = readFileSync(target)
console.log(`[repair] reading ${target} (${raw.length} bytes)`)

const frames = scanZstdFrames(raw)
console.log(`[repair] zstd frames: ${frames.frames.length}${frames.tornStart !== undefined ? ` (torn tail at ${frames.tornStart})` : ''}`)

const parts = []
for (const f of frames.frames) {
  const plain = await decompressZstdFrame(raw.subarray(f.start, f.end))
  parts.push(plain.toString('utf8'))
}
const plaintext = parts.join('')
const lines = plaintext.split('\n')
console.log(`[repair] plaintext lines: ${lines.length} (${plaintext.length} chars)`)

// 第一行 header（原样保留；跨帧拼接时可能被截断，必须 JSON 校验）
const header = lines[0]
try {
  JSON.parse(header)
} catch (e) {
  console.error(`[repair] header line is not complete JSON (${header.length} chars): ${header.slice(0, 160)}...`)
  process.exit(2)
}
console.log(`[repair] header OK (${header.length} chars): ${header.slice(0, 100)}...`)

// 事件行解码
const events = []
let badLine = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (line.trim() === '') continue
  try {
    events.push(...decodeStorageRecord(JSON.parse(line)))
  } catch (e) {
    console.log(`[repair] line ${i + 1}: unparsable storage record: ${String(e).slice(0, 120)}`)
    badLine++
  }
}
console.log(`[repair] decoded events: ${events.length}, bad lines: ${badLine}`)

// token meter step 匹配修复：assistant/message 必须匹配当前 step/start
// （多实例交替写入——end-seed 后另一实例继续写入——会缺失 step/start，
// 官方 token-meter 折叠抛 "assistant/message has no matching step/start"）。
// 在缺失处补合成 step/start（turn/step 复制自 message；time 取前一事件）。
let stepFixes = 0
{
  let stepStart = undefined
  const out = []
  for (const ev of events) {
    if (ev.type === 'step/start') stepStart = ev.data
    else if (ev.type === 'step/end') stepStart = undefined
    else if (ev.type === 'assistant/message') {
      if (stepStart === undefined || stepStart.turn !== ev.data?.turn || stepStart.step !== ev.data?.step) {
        const prev = out.length > 0 ? out[out.length - 1] : undefined
        out.push({
          type: 'step/start',
          seq: ev.seq,
          time: prev !== undefined && typeof prev.time === 'number' ? prev.time : ev.time,
          data: { turn: ev.data.turn, step: ev.data.step },
        })
        stepStart = ev.data
        stepFixes++
      }
    }
    out.push(ev)
  }
  events.length = 0
  events.push(...out)
}
if (stepFixes > 0) console.log(`[repair] token-meter step/start fixes: ${stepFixes}`)

// 重编号 seq + 建立旧→新映射 + 重写事件内 seq 引用
let gaps = 0
const oldSeqToNew = new Map()
for (let i = 0; i < events.length; i++) {
  if (events[i].seq !== i) gaps++
  oldSeqToNew.set(events[i].seq, i)
  events[i].seq = i
}
console.log(`[repair] seq rewrites needed: ${gaps}`)

let refRewrites = 0
for (const ev of events) {
  const op = ev.surfaceOp
  if (op !== null && typeof op === 'object' && !Array.isArray(op) && op.op === 'replace') {
    if (typeof op.start === 'number' && oldSeqToNew.has(op.start)) { op.start = oldSeqToNew.get(op.start); refRewrites++ }
    if (typeof op.end === 'number' && oldSeqToNew.has(op.end)) { op.end = oldSeqToNew.get(op.end); refRewrites++ }
  }
  if (Array.isArray(ev.sourceEventSeqs)) {
    for (let k = 0; k < ev.sourceEventSeqs.length; k++) {
      if (oldSeqToNew.has(ev.sourceEventSeqs[k])) { ev.sourceEventSeqs[k] = oldSeqToNew.get(ev.sourceEventSeqs[k]); refRewrites++ }
    }
  }
}
if (refRewrites > 0) console.log(`[repair] seq reference rewrites: ${refRewrites}`)

// tool/result 的 source.callId 为空 → 读取层校验抛 "message must have tool
// source"（历史版本 DSH 在「未知工具」失败时写过空 callId）。补合成 callId。
let fixedSource = 0
for (const ev of events) {
  if (ev.type !== 'tool/result') continue
  const src = ev.data?.message?.source
  if (!src || src.kind !== 'tool') continue
  if (typeof src.callId === 'string' && src.callId !== '') continue
  src.callId = 'call-' + ev.seq
  const c = ev.data.message.content?.[0]
  if (c && typeof c.toolCallId === 'string' && c.toolCallId === '') c.toolCallId = src.callId
  fixedSource++
}
if (fixedSource > 0) console.log(`[repair] tool/result source.callId patched: ${fixedSource}`)

// token 表面 shadow-price 协议修复：compaction/summary|prune 的
// shadowedRange（武装 claim）必须与紧随其后的 surface replace 的
// op.start/end 完全一致（官方 foldSurfaceProjection 校验）。历史损坏
// 日志（seq gap 写入错乱）里这对引用可能差 1——以 replace 为准修正。
let tokenFixes = 0
for (let i = 0; i < events.length; i++) {
  const ev = events[i]
  if (ev.type !== 'compaction/summary' && ev.type !== 'compaction/prune') continue
  const next = events[i + 1]
  if (!next || !next.surfaceOp || typeof next.surfaceOp !== 'object' || next.surfaceOp.op !== 'replace') continue
  const range = ev.data?.shadowedRange
  if (!range || typeof range.start !== 'number' || typeof range.end !== 'number') continue
  if (range.start !== next.surfaceOp.start || range.end !== next.surfaceOp.end) {
    range.start = next.surfaceOp.start
    range.end = next.surfaceOp.end
    tokenFixes++
  }
}
if (tokenFixes > 0) console.log(`[repair] token-surface claim fixes: ${tokenFixes}`)

// 重新编码事件行（保留 chunk 打包，与官方写入一致）+ 写回
const body = eventLines(events, true)
const headerFrame = await compressZstdFrame(header + '\n')
const eventFrame = await compressZstdFrame(body + '\n')
writeFileSync(outPath, Buffer.concat([headerFrame, eventFrame]))
console.log(`[repair] wrote ${headerFrame.length + eventFrame.length} bytes (was ${raw.length})`)

// 验证：解压 → scanLog + foldSurface（与官方读取路径一致）
const repaired = readFileSync(outPath)
try {
  const vframes = scanZstdFrames(repaired)
  const vparts = []
  for (const f of vframes.frames) {
    vparts.push((await decompressZstdFrame(repaired.subarray(f.start, f.end))).toString('utf8'))
  }
  const vtext = Buffer.from(vparts.join(''), 'utf8')
  const result = scanLog(vtext)
  console.log(`[repair] VERIFY scanLog OK: header id=${result.meta?.id}, events=${result.events.length}, committedBytes=${result.committedBytes}`)
  const fold = foldSurface(result.events)
  console.log(`[repair] VERIFY foldSurface OK: surface nodes=${fold.nodes.length}, replacements=${fold.replacements.length}`)
  // token 表面折叠验证（shadow-price 协议）：与官方读取路径一致
  let claim = undefined
  let tokenEvents = 0
  for (const ev of result.events) {
    if (ev.type === 'compaction/summary' || ev.type === 'compaction/prune') {
      const { shadowedRange, shadowedTokenCount } = ev.data
      claim = { start: shadowedRange.start, end: shadowedRange.end, tokens: shadowedTokenCount }
      continue
    }
    if (!ev.surfaceOp) { claim = undefined; continue }
    if (ev.surfaceOp === 'append') { claim = undefined; continue }
    if (claim !== undefined && (claim.start !== ev.surfaceOp.start || claim.end !== ev.surfaceOp.end)) {
      throw new Error(`token surface mismatch at seq ${ev.seq}: claim ${claim.start}-${claim.end} vs replace ${ev.surfaceOp.start}-${ev.surfaceOp.end}`)
    }
    claim = undefined
    tokenEvents++
  }
  console.log(`[repair] VERIFY token surface OK: ${tokenEvents} replacements replayed`)
  // token meter step 匹配验证（与官方读取路径一致）
  let stepStart = undefined
  for (const ev of result.events) {
    if (ev.type === 'step/start') stepStart = ev.data
    else if (ev.type === 'step/end') stepStart = undefined
    else if (ev.type === 'assistant/message') {
      if (stepStart === undefined || stepStart.turn !== ev.data?.turn || stepStart.step !== ev.data?.step) {
        throw new Error(`token meter step mismatch at seq ${ev.seq}: turn ${ev.data?.turn}/step ${ev.data?.step} without matching step/start`)
      }
    }
  }
  console.log(`[repair] VERIFY token meter steps OK`)
} catch (e) {
  console.error(`[repair] VERIFY FAILED: ${e.message}`)
  process.exit(1)
}
