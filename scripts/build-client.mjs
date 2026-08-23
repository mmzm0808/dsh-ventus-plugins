/**
 * dsh-ventus-plugins — client bundle 合并构建脚本
 *
 * DSH 的 client 模块系统按包加载 `/plugins/<id>/client.js`，bundle 契约是
 * `window.__ModuleLoader__.load({ id, factory })`，factory 为单参
 * `(require) => module.exports`。loader 的 require 能 materialize 任意已
 * 注册的 factory（按 id）。
 *
 * 整合后插件列表只保留 dsh-ventus-plugins 一个包，13 个子插件的 client
 * 代码必须并入这一个 bundle。合并策略（不解析/不重写压缩代码）：
 *   1. 把每个子 bundle 的 load 调用【原样内嵌】进聚合 factory——执行时
 *      子 factory 注册进 loader（与多插件时代各 bundle 各自注册等价）；
 *   2. 聚合 apply 用 loader 的 require 按子 id materialize 各子模块，
 *      依次调用其 apply——功能与多插件时代完全一致。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR = join(ROOT, 'vendor')
const OUT = join(ROOT, 'lib', 'client.js')

/** 各子插件 client 入口与注册 id（与包 exports["./client"] 及 dsh.client 一致）。
 *  注意：@nanmicoder/dsh-agent-teams 的用户显式禁用（host 侧不挂载），其 client
 *  若嵌入会轮询 /plugins/dsh-agent-teams/state（host 无此路由 → 404 风暴），
 *  故不列入——与 host 侧行为保持一致。 */
const CLIENT_ENTRIES = [
  ['dsh-better-sidebar', 'dsh-better-sidebar/lib/client.js'],
  ['dsh-deepseek-usage', 'dsh-deepseek-usage/lib/client.js'],
  ['dsh-theme-endfield', 'dsh-theme-endfield/client.js'],
  ['dsh-ventus-progress', 'dsh-ventus-progress/lib/client.js'],
  ['dsh-ventus-search', 'dsh-ventus-search/lib/client.js'],
  ['dsh-ventus-whale', 'dsh-ventus-whale/lib/client.js'],
  ['@dsh-external/dsh-super-injector', '@dsh-external/dsh-super-injector/lib/client.js'],
  ['@dsh-external/dsh-visualize', '@dsh-external/dsh-visualize/lib/client.js'],
  ['@dsh-external/dsh-webui', '@dsh-external/dsh-webui/lib/client.js'],
  ['@nanmicoder/dsh-auto-mode', '@nanmicoder/dsh-auto-mode/lib/client.js'],
  ['dsh-usage-skill', 'dsh-usage-skill/lib/client.js'],
]

/** 子 bundle 注册 id 列表（聚合 apply 用 require(id) materialize）。 */
const SUB_IDS = CLIENT_ENTRIES.map(([id]) => id)

/* 聚合插件声明子插件全部服务依赖的并集（短服务名——cordis 的 fiber.inject
   把声明的服务注入 ctx 属性，子插件 apply 用 ctx.slots/ctx.locale 等属性
   访问；写包名会永远 pending（服务注册表用短名），留空则子 apply 因缺
   属性注入而抛 "cannot get property without inject"）。 */
const INJECT = [
  'slots',
  'sessions',
  'connection',
  'workspaces',
  'locale',
  'modules',
  'settingsScope',
  'conversationEvents',
  'remote',
  'layout',
]

// 读取并缩进内嵌（去掉 sourceMappingURL 尾注，避免多余请求）。
function embed(text) {
  return text
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
    .replace(/\n\s*\/\/# sourceMappingURL=.*$/m, '\n')
}

const embedded = CLIENT_ENTRIES.map(([, entry]) => {
  const text = readFileSync(join(VENDOR, entry), 'utf8')
  console.log(`[build-client] embed ${entry} (${text.length} chars)`)
  return embed(text)
}).join('\n\n')

const bundle = `/**
 * dsh-ventus-plugins — 整合后的单一 client bundle（构建生成，勿手改）
 * 由 scripts/build-client.mjs 合并 ${SUB_IDS.length} 个子插件 client 生成。
 * 子 bundle 原样内嵌注册进 __ModuleLoader__，聚合 apply 按 id materialize。
 */
window.__ModuleLoader__.load({
  id: 'dsh-ventus-plugins',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

${embedded}

    exports.name = 'dsh-ventus-plugins';
    exports.inject = ${JSON.stringify(INJECT)};
    exports.apply = (ctx) => {
      const ids = ${JSON.stringify(SUB_IDS)};
      for (const id of ids) {
        try {
          const mod = require(id);
          if (mod && typeof mod.apply === 'function') mod.apply(ctx);
        } catch (error) {
          console.error('[dsh-ventus-plugins] sub-apply failed:', id, error);
        }
      }
    };
    return module.exports;
  }
});
`
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, bundle)
console.log(`[build-client] wrote ${OUT} (${bundle.length} chars, ${SUB_IDS.length} sub-bundles)`)
