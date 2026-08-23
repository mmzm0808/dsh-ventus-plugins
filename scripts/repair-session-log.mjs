/**
 * repair-session-log.mjs — 会话日志 seq gap 修复（诊断 + 重打包）
 *
 * 原理：官方 scanLog 要求事件 seq 从 0 严格连续；损坏行（重复写入或
 * 跳号）会导致 "seq gap in committed region"。本脚本：
 *   1. scanZstdFrames + decompressZstdFrame 解出全部 JSONL 明文；
 *   2. 逐行 decodeStorageRecord 展开事件，按出现顺序重新编号 seq；
 *   3. eventLines(events, packChunks) 重新编码事件行；
 *   4. header 一帧 + 事件体一帧重新压缩写回（先备份 .bak）。
 *
 * 用法：node --experimental-strip-types scripts/repair-session-log.mjs <session.jsonl.zstd 路径>
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..')
// 官方子模块（直接相对路径 require；monorepo 内包未提升到根 node_modules）
const require = createRequire(import.meta.url)
const jsonl = require(join(REPO, 'packages/session/session-persistence-jsonl/lib/types/zstd.js'))
const format = require(join(REPO, 'packages/session/session-persistence-jsonl/lib/types/format.js'))
const session = require(join(REPO, 'packages/core/session/lib/index.js'))

const args = process.argv.slice(2)
const outFlag = args.indexOf('--out')
const target = outFlag >= 0 ? args[0] : args[0]
const outPath = outFlag >= 0 ? args[outFlag + 1] : target + '.repaired.zstd'
if (!target) { console.error('usage: node scripts/repair-session-log.mjs <path> [--out <path>]'); process.exit(1) }
console.log(`[repair] output -> ${outPath}（原文件不覆盖；确认无误后手动替换）`)

const raw = readFileSync(target)
console.log(`[repair] reading ${target} (${raw.length} bytes)`)

const { scanZstdFrames, decompressZstdFrame, compressZstdFrame } = jsonl

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

// 第一行 header（原样保留；JSON 完整性校验——跨帧拼接时 header 行可能被
// 截断，截断的 header 会污染整份修复文件）
const header = lines[0]
try {
  JSON.parse(header)
} catch (e) {
  console.error(`[repair] header line is not complete JSON (${header.length} chars): ${header.slice(0, 160)}...`)
  console.error(`[repair] 原文件帧结构异常（header 跨帧）。请检查输入文件；不写入任何输出。`)
  process.exit(2)
}
console.log(`[repair] header OK (${header.length} chars): ${header.slice(0, 100)}...`)

// 事件行解码（decodeStorageRecord 来自 @deepseek-ai/dsh-session）
const { decodeStorageRecord, packChunkRuns } = session
const events = []
const seen = new Set()
let badLine = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (line.trim() === '') continue
  let decoded
  try {
    decoded = decodeStorageRecord(JSON.parse(line))
  } catch (e) {
    console.log(`[repair] line ${i + 1}: unparsable storage record: ${String(e).slice(0, 120)}`)
    badLine++
    continue
  }
  for (const ev of decoded) {
    events.push(ev)
  }
}
console.log(`[repair] decoded events: ${events.length}, bad lines: ${badLine}`)

// 重编号 seq（按出现顺序连续），同时检查原有断点
let gaps = 0
for (let i = 0; i < events.length; i++) {
  if (events[i].seq !== i) gaps++
  events[i].seq = i
}
console.log(`[repair] seq rewrites needed: ${gaps}`)

// tool/result 的 source.callId 为空 → 读取层校验抛 "message must have tool
// source"（历史版本 DSH 在「未知工具」失败时写过空 callId）。补合成 callId
// 使校验通过；内容不变（仍是 Error: unknown tool 原文）。
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

// 重新编码事件行（保留 chunk 打包，与官方写入一致）
const { eventLines } = format
const body = eventLines(events, true)

// 写回：header 一帧 + 事件一帧
// 默认不覆盖原文件：先写出 .repaired 副本供验证，人工确认后再替换。
// （备份与替换由调用方显式执行；本脚本对原文件只读。）

const headerFrame = await compressZstdFrame(header + '\n')
const eventFrame = await compressZstdFrame(body + '\n')
writeFileSync(outPath, Buffer.concat([headerFrame, eventFrame]))
console.log(`[repair] wrote ${headerFrame.length + eventFrame.length} bytes (was ${raw.length})`)

// 验证：scanLog 应无 issue
const repaired = readFileSync(target)
try {
  const result = format.scanLog(repaired)
  console.log(`[repair] VERIFY OK: header id=${result.meta?.id}, events=${result.events.length}, committedBytes=${result.committedBytes}`)
} catch (e) {
  console.error(`[repair] VERIFY FAILED: ${e.message}`)
  process.exit(1)
}
