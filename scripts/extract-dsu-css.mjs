// extract-dsu-css.mjs — 从 usage client bundle 提取完整 CSS 常量并展开 NS 插值
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const t = readFileSync('vendor/dsh-deepseek-usage/lib/client.js', 'utf8')
const marker = 'const CSS = `'
const start = t.indexOf(marker)
const end = t.indexOf('`;', start)
const css = t.slice(start + marker.length, end) // marker 不含反引号，+length 正好跳过反引号
const expanded = css.split('${NS}').join('dsu')
console.log('CSS chars:', expanded.length)
console.log('has dsu-ball rule:', expanded.includes('.dsu-ball{'))
console.log('has position:fixed:', expanded.includes('position:fixed'))
writeFileSync(join(tmpdir(), 'dsu-full-css.css'), expanded)
console.log('written temp dsu-full-css.css')
