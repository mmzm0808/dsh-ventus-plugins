/**
 * 把当前 HEAD 提交 sha 写进聚合 bundle，供更新检查徽标比对。
 * 在 build-client.mjs 之后执行：向 bundle 追加一段初始化代码，
 * 页面加载时写入 localStorage（dsh.ventus.localSha）。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'lib', 'client.js')
const sha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim()

const bundle = readFileSync(OUT, 'utf8')
const marker = '/* dsh-ventus-plugins: local commit stamp */'
const stamp = `${marker}
try { localStorage.setItem('dsh.ventus.localSha', ${JSON.stringify(sha)}) } catch {}
`
const cleaned = bundle.includes(marker)
  ? bundle.replace(new RegExp(`${marker.replace(/[*/]/g, '\$&')}[\s\S]*?\n\n`), '')
  : bundle
writeFileSync(OUT, `${stamp}
${cleaned}`)
console.log(`[stamp-commit] localSha = ${sha.slice(0, 12)}`)
