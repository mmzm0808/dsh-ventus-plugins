/**
 * dsh-ventus-plugins — 整合后的单一插件 host 入口。
 *
 * 整合范围（12 个子插件，全部 vendor 在 ../vendor/ 下，自包含无外部插件
 * 依赖）：better-sidebar / deepseek-usage / theme-endfield / ua-relay /
 * ventus-progress / ventus-search / ventus-whale / super-injector /
 * visualize / webui / agent-teams(用户禁用，保持不挂载) / auto-mode。
 *
 * 挂载方式：逐个 ctx.plugin() 动态挂载——cordis 按子插件自身 name 注入
 * 默认配置；用户级配置（patch.yml 或插件自有持久化）与多插件时代完全
 * 一致，功能与设置零变化。
 *
 * 容错加载：子插件产物缺失（最小安装 / 选择性更新只装了一部分）时跳过
 * 并打印 warning，其余照常挂载——包形态可以从「最小」平滑升级到「完整」。
 *
 * agent-teams 说明：用户在 profile 的 cordis.patch.yml 中显式禁用了
 * Agent Teams（activity scanner 导致 UI 假死），整合后保持禁用状态，
 * 不挂载。
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 子插件 host 模块（vendor 内嵌；CJS 包经 require 加载，.mjs 为原生 ESM）。
 * 逐个解析：产物缺失时返回 null（选择性安装/最小包场景），不再整体崩溃。
 */
const SUB_ENTRIES = [
  ['dsh-better-sidebar', 'dsh-better-sidebar/lib/index.js'],
  ['dsh-deepseek-usage', 'dsh-deepseek-usage/lib/index.js'],
  ['dsh-theme-endfield', 'dsh-theme-endfield/index.js'],
  ['dsh-ua-relay', 'dsh-ua-relay/lib/index.mjs'],
  ['dsh-ventus-progress', 'dsh-ventus-progress/lib/index.js'],
  ['dsh-ventus-search', 'dsh-ventus-search/lib/index.js'],
  ['dsh-ventus-whale', 'dsh-ventus-whale/lib/index.js'],
  ['@dsh-external/dsh-super-injector', '@dsh-external/dsh-super-injector/lib/index.js'],
  ['@dsh-external/dsh-visualize', '@dsh-external/dsh-visualize/lib/index.js'],
  ['@dsh-external/dsh-webui', '@dsh-external/dsh-webui/lib/index.js'],
  ['@nanmicoder/dsh-auto-mode', '@nanmicoder/dsh-auto-mode/lib/index.js'],
  // 文档解析（MinerU：PDF/扫描件解析，@huanlin/dsh-plugin-mineru）
  ['@huanlin/dsh-plugin-mineru', '@huanlin/dsh-plugin-mineru/lib/index.js'],
  // 上下文洞察（context dashboard + /context 命令，bowenliang123/dsh-context）
  ['dsh-context', 'dsh-context/lib/index.js'],
  // 科研工作流（可选）：产物缺失（min 分支 / 未勾选安装）时跳过，勾选安装后挂载。
  ['dsh-ventus-research', 'dsh-ventus-research/lib/index.js'],
]

function loadSubPlugins() {
  const loaded = {}
  for (const [id, entry] of SUB_ENTRIES) {
    try {
      if (!existsSync(join(ROOT, 'vendor', entry))) {
        console.warn(`[dsh-ventus-plugins] 子插件产物缺失，跳过: ${id} (${entry})`)
        continue
      }
      loaded[id] = require(`../vendor/${entry}`)
    } catch (error) {
      console.error(`[dsh-ventus-plugins] 子插件加载失败，跳过: ${id}`, error)
    }
  }
  return loaded
}

/** 子插件挂载配置（从各插件 cordis.patch.yml 的 config 迁移，保持原值）。 */
const subConfigs = {
  'dsh-ua-relay': { targets: { bai: 'https://api.bankofai.io' } },
  '@dsh-external/dsh-super-injector': {},
  '@nanmicoder/dsh-auto-mode': {},
}

/** cordis 插件名（对应用户可查的插件 id）。 */
export const name = 'dsh-ventus-plugins'

/** 依赖的服务由子插件各自声明（ctx.plugin 挂载时解析）。 */
export const inject = []

/** 挂载全部已加载的子插件。 */
export function apply(ctx) {
  const subPlugins = loadSubPlugins()
  for (const [id, plugin] of Object.entries(subPlugins)) {
    try {
      ctx.plugin(plugin, subConfigs[id])
    } catch (error) {
      console.error(`[dsh-ventus-plugins] 子插件挂载失败: ${id}`, error)
    }
  }
}
