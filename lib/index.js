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
 * agent-teams 说明：用户在 profile 的 cordis.patch.yml 中显式禁用了
 * Agent Teams（activity scanner 导致 UI 假死），整合后保持禁用状态，
 * 不挂载。
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** 子插件 host 模块（vendor 内嵌；CJS 包经 require 加载，.mjs 为原生 ESM）。 */
const subPlugins = {
  'dsh-better-sidebar': require('../vendor/dsh-better-sidebar/lib/index.js'),
  'dsh-deepseek-usage': require('../vendor/dsh-deepseek-usage/lib/index.js'),
  'dsh-theme-endfield': require('../vendor/dsh-theme-endfield/index.js'),
  'dsh-ua-relay': require('../vendor/dsh-ua-relay/lib/index.mjs'),
  'dsh-ventus-progress': require('../vendor/dsh-ventus-progress/lib/index.js'),
  'dsh-ventus-search': require('../vendor/dsh-ventus-search/lib/index.js'),
  'dsh-ventus-whale': require('../vendor/dsh-ventus-whale/lib/index.js'),
  '@dsh-external/dsh-super-injector': require('../vendor/@dsh-external/dsh-super-injector/lib/index.js'),
  '@dsh-external/dsh-visualize': require('../vendor/@dsh-external/dsh-visualize/lib/index.js'),
  '@dsh-external/dsh-webui': require('../vendor/@dsh-external/dsh-webui/lib/index.js'),
  '@nanmicoder/dsh-auto-mode': require('../vendor/@nanmicoder/dsh-auto-mode/lib/index.js'),
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

/** 挂载全部子插件。 */
export function apply(ctx) {
  for (const [id, plugin] of Object.entries(subPlugins)) {
    try {
      ctx.plugin(plugin, subConfigs[id])
    } catch (error) {
      console.error(`[dsh-ventus-plugins] 子插件挂载失败: ${id}`, error)
    }
  }
}
