# 可视化（@dsh-external/dsh-visualize）— 整合包内功能说明

> 本文件为整合包（dsh-ventus-plugins）内子插件 `@dsh-external/dsh-visualize`（v0.1.2）的功能说明，信息提炼自插件源码（`src/`）、README 与 package.json。本插件在 DSH 对话中把模型生成的交互式 HTML 渲染成沙箱卡片。

## 功能描述

一句话定位：让 DSH 不只回复文字——模型调用 `visualize` 工具后，Web UI 会把模型写好的 HTML 片段渲染为对话内的一张可交互沙箱卡片（Codex 桌面端 `/visualize` 的语义）。

核心功能清单：

- **`visualize` 工具**（注册名 `visualize`，即 `VISUALIZE_TOOL_NAME`）：模型把一段"内联 HTML 片段"作为参数直接传入（不是文件路径），工具校验后写入会话工作区并产出持久化元数据，支持浏览器端把卡片渲染进对话。
  - 参数：`action`（`create` 默认 / `update`）、`fragment`（create 必填，内联 HTML 正文，无文档骨架）、`title`（卡片标题，create 默认 `Visualization`，update 必填）、`mode`（`inline` 默认 / `wide` 并排宽卡）、`path`（update 必填，待修补卡片的工作区路径）、`old_str` / `new_str`（update 必填，精确替换）。
  - 两种动作：`create` 整段渲染；`update` 只对已渲染卡片做一处 `old_str → new_str` 精确替换（技能引导：修正涉及少于 20 行、少于 5 处、每轮最多 4 次；结构性改动应重建整卡）。
- **内置 `visualize` skill**（provider 名 `dsh-visualize`，candidate 名 `visualize`，`modelInvocable` + `userInvocable`，`source: 'bundled'`）：模型首次调用 `visualize` 前加载的"片段写作契约"，正文打包在 `assets/visualize-skill.md`，资源基目录为包内 `assets/`。契约内容涵盖：何时该用/不该用卡片、`references/charts.md`（Chart.js 优先的图表规则）、`references/design.md`（审美/主题令牌/基础类）、两个示例 `examples/interactive-simulator.html` 与 `examples/comparison-chart.html`、修补规则、片段合法性与 CDN 白名单。
- **片段校验**（`validateFragment`）：空片段拒绝；超字节上限拒绝（`maxFragmentBytes`，默认 `1_000_000` 字节，报错并引导先压缩内联数据）；含文档骨架标签（`<!doctype`、`<html>`、`<head>`、`<body>`，正则 `SKELETON_TAG`）拒绝——卡片自己提供文档骨架，片段自带骨架会嵌套文档。
- **工作区导出**：create 把成品片段写入会话工作区 `viz/<slug>-<hash>.html`（slug 取标题小写 ASCII 化、截断 48 字符，空则用 `visualization`；hash 为 FNV-1a 8 位十六进制内容哈希，内容寻址、字节相同复用同名文件）；模型侧结果只回一行确认文案，不重复回显整段标记。
- **精确补丁**（`applyFragmentPatch`）：`old_str` 必须逐字节匹配且仅出现一处；未命中时报出卡片该位置真实内容作为纠错锚点（前缀长度 ≥ 12 字符才给提示，否则建议整卡重建）；多处命中时报出现次数并提示扩展匹配文本。空 `new_str` 表示删除命中区域。
- **持久化重放**：渲染所需的完整信息（`kind: 'visualize'` + `fragment` + `title` + `mode` + `path`）写入持久化 `tool/result` 元数据（`presentationMeta`），会话重放时从日志恢复卡片，原始 fragment 文件不在了也能逐字节复现。
- **流式实时预览**（client）：模型还在生成 `visualize` 调用时，输入坞下方的预览槽位从会话快照的 `partial` 块中解析 `"fragment"` 参数前缀，实时渲染进同一套沙箱框架；150ms 节流推送、增量 DOM 同步、新增元素带入场动画；脚本在半成品阶段保持惰性，只有落定的卡片才执行脚本。
- **主题桥接**：卡片读取 DSH 宿主 `--dsw-alias-*` 设计令牌（含鲸鱼蓝强调色），以 `--dsh-viz-*` 变量注入卡片框架；跟随宿主明暗主题，主题切换（body 属性 / 根元素属性 / 系统外观）时实时重新解析。
- **沙箱与 CSP**：卡片跑在 `<iframe sandbox="allow-scripts">`（不透明源，无法接触宿主页面），框架文档自带 CSP，禁网络请求、禁嵌套页面、禁表单提交，仅放行固定 CDN 白名单的静态资源。

## 兼容与依赖

### package.json 关键依赖

- **peerDependencies**（声明式，`^` 语义）：
  - `@deepseek-ai/cordis` `^4.0.1`（插件框架）
  - `@deepseek-ai/dsh-fs` `^0.1.0-rc.6`（工作区文件读写，注入 `fs`）
  - `@deepseek-ai/dsh-llm` `^0.1.0-rc.6`
  - `@deepseek-ai/dsh-sandbox-policy` `^0.1.0-rc.6`（会话级沙箱策略解析，注入 `sandboxPolicy`）
  - `@deepseek-ai/dsh-session` `^0.1.0-rc.6`
  - `@deepseek-ai/dsh-skill` `^0.1.0-rc.6`（skill 注册表，注入 `skills`）
  - `@deepseek-ai/dsh-tools` `^0.1.0-rc.6`（工具注册表，注入 `tools`）
  - `@deepseek-ai/schemastery` `^3.18.1`（配置模式校验）
  - `react` `^18.2.0`（client 渲染）
- **dependencies**：无运行时直接依赖（构建时全部由 peer + bundle 承担）。
- 所有 `@deepseek-ai` 包在 node 半身均为 type-only import（构建擦除），schemastery 与 cordis 保持不打进 bundle（Loader 校验 `Config` 需用自身实例）。

### host / client 形态

- **双半身结构**：node 半身（`src/index.ts` → `lib/index.js`）+ 浏览器半身（`src/client/` → `lib/client.js`，供 harness 在 `/plugins/<id>/client.js` 提供）。
- `dsh.client` 声明：`inject: ['@deepseek-ai/dsh-client-runtime']`，`platform: 'web'`——client 只挂 web 端。
- `dsh.bundle`：`patch: './cordis.patch.yml'`（单插件形态下把自身插入 profile 层栈；整合包内由聚合 patch 替代，见"功能适配细节"）。
- **浏览器半身缺失时的降级**：没有 client bundle 的表面（TUI、headless）走工具通用结果文本，功能不崩溃——这是文档明确的渲染意图降级设计。

### 注册的 slot / 工具 / 服务（从源码提炼的真实注册点）

node 半身（`src/index.ts`，`inject: ['tools', 'skills', 'fs']`）：

- `ctx.tools.register(visualizeTool(ctx, maxFragmentBytes))` —— 注册工具 `visualize`。
- `ctx.skills.registerProvider(() => visualizeSkillProvider)` —— 注册内置 skill provider `dsh-visualize`。
- 工具内部经 `ctx.get('sandboxPolicy')?.resolve(...)` 解析会话级沙箱策略得到工作区根，并依赖 `ctx.fs.resolve / readText / writeText` 读写工作区文件（对齐官方 fs 工具用法）。
- `presentCall`：`{ card: 'generic', title: 'Visualize', kind: 'other' }`。
- `presentResult`：从持久化元数据取标题，卡片标题呈现为 `Visualization · <title>`；无元数据则回退通用展示。
- 并发安全声明：`isConcurrencySafe` 仅 `create` 为真（内容寻址文件名天然无冲突）；`update` 为假（并行补丁会互相覆盖基底）。
- **无 HTTP 路由、无 webServer 注册、无自有服务**：本插件不注册任何 HTTP 路由 / 服务端口。

client 半身（`src/client/index.tsx`，`inject: ['slots']`）：

- `ctx.slots.inject('tool.call.toolview', …)` 注册 keyed toolview `{ name: 'tool.call.toolview', key: 'visualize' }` → `VisualizeCard` 组件。
- `ctx.slots.inject('conversation.input.dock', …)` 注册输入坞条目 `{ name: 'conversation.input.dock', id: 'visualize-stream', order: 30 }` → `StreamingPreview` 组件。
- 注册前等待对应 hole 声明就绪（`slots.inject` 包一层），避免加载顺序竞态。

框架↔卡片消息（`src/shell.ts` 定义的 wire type）：

- `HEIGHT_MESSAGE_TYPE = 'dsh-visualize:height'`：框架向宿主上报滚动高度（携带关联标识，生产环境即工具调用 id），宿主据此撑起 iframe 高度。
- `STREAM_MESSAGE_TYPE = 'dsh-visualize:stream'`：宿主向持久化预览框架推送片段增量（预览专用关联标识 `streaming-preview`）。

### 需要的 DSH 服务与版本要求

- 节点侧服务：`tools`（工具注册）、`skills`（skill 注册）、`fs`（工作区读写）、`sandboxPolicy`（会话沙箱策略，可选 get）。
- 客户端侧服务：`slots` + `@deepseek-ai/dsh-client-runtime`（client bundle 外置），并依赖 DSH web shell 冻结模块表提供 `react`、`react-dom`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-web-react` 等平台模块。
- 版本带：`cordis ^4.0.1`，DSH 系列服务 `^0.1.0-rc.6` 起（开发基准 rc.7），react `^18`；schemastery `^3.18.1`。与整合包聚合包的 peer 声明（`^0.1.0-rc.6`）一致。

### 与整合包其它子插件的关系

- **完全独立**：不依赖整合包内任何其它子插件，不共享状态；只与 DSH 核心服务（tools / skills / fs / sandboxPolicy / slots / client runtime）交互。
- 在聚合包内与 dsh-webui、dsh-super-injector、dsh-ventus-search 等并列，由 host 聚合逐个 `ctx.plugin()` 挂载；client 与其它子插件一起内嵌进聚合包单一 `lib/client.js`。
- 无资源冲突：工作区文件只落在各自会话的 `viz/` 下，卡片消息类型与其它插件无交集。

## 功能适配细节

### 整合包里的集成方式

- **host 聚合挂载**：聚合包 `lib/index.js` 的 `SUB_ENTRIES` 列表以 `['@dsh-external/dsh-visualize', '@dsh-external/dsh-visualize/lib/index.js']` 登记本插件，启动时逐个 `ctx.plugin()` 动态挂载；vendor 内产物缺失时跳过并告警，不影响其它子插件。
- **client bundle 内嵌**：聚合包自身的 `lib/client.js` 内含本插件的 client 半身（web 平台），随聚合包单一 bundle 下发；DASH web profile 安装聚合包即获得可视化功能。
- **可选安装（最小包）**：聚合包按"最小 / 完整"两种形态分发时，本插件属于可缺省的 vendor 产物——不装则跳过 host 挂载，其它功能照常。
- 聚合包 cordis.patch.yml 只插入聚合插件条目（`id: ventus-plugins`），本插件 vendor 副本里的 `cordis.patch.yml`（单插件形态的 `- insert: dsh-visualize`）在聚合语境下不生效、由 host 挂载取代。

### 配置项与存储键

- **唯一部署配置项 `maxFragmentBytes`**（`z.natural().default(1_000_000)`，schemastery 校验）：单个片段字节上限。超限的片段在 execute 时报错，并提示先压缩内联数据（少行、粗分桶、少小数位）。该值同时约束一次调用对会话日志的写入量。
- **持久化元数据键**（`tool/result` 的 presentationMeta）：`kind`（固定 `'visualize'`）、`fragment`、`title`、`mode`（`inline`/`wide`）、`path`。`visualizeMetaFrom` 做窄化校验，字段类型/枚举不符则回退通用展示，重放不抛错。
- **主题桥接令牌对**（`src/client/theme.ts` 的 `TOKEN_BRIDGE`）：宿主 `--dsw-alias-*` → 框架 `--dsh-viz-*`：
  - `foreground` ← `--dsw-alias-label-primary`
  - `card` ← `--dsw-alias-bg-layer-1`
  - `muted-foreground` ← `--dsw-alias-label-caption`
  - `border` ← `--dsw-alias-border-l2`
  - `primary` ← `--dsw-alias-brand-primary-new-colorprimary-new-color`
  - `primary-foreground` ← `--dsw-alias-label-primary-inverted`
- **框架 CSS 变量集**（`src/frame-css.ts`）：`--background`、`--foreground`、`--card`、`--card-foreground`、`--muted-foreground`、`--border`、`--primary`、`--primary-foreground`、`--viz-series-1…6`（系列色，series-1 为单度量/活动元素）、`--radius`（8px）、`--font-size-base`（14px）；每个令牌均以 `var(--dsh-viz-<name>, <fallback>)` 声明，宿主未注入时回退 `light-dark()` 配色。附送基础类：`.card`、`.btn` / `.btn-primary` / `.btn-ghost`、`.viz-grid`、`.viz-row`、`.viz-controls`、`.viz-stat` / `.viz-stat-value`、`.viz-badge`、`.form-label` / `.form-control` / `.form-select` / `.form-check`、`.text-small`、`.table-responsive`。
- **CDN 白名单**（`RESOURCE_ORIGINS`，协议常量，与 skill 正文共享）：`cdnjs.cloudflare.com`、`cdn.jsdelivr.net`、`esm.sh`、`fonts.bunny.net`、`fonts.googleapis.com`、`fonts.gstatic.com`、`unpkg.com`；另放行 `blob:`、`data:` 源。
- **高度常量**：框架最小高 48px，inline 上限 800px、wide 上限 1200px（超出在框架内滚动）；流式预览上限 300px、宽 760px，节流间隔 150ms。
- **localStorage / 用户配置**：**无**。客户端不持久化任何用户偏好，无 localStorage / sessionStorage 键；行为只由部署级 `maxFragmentBytes` 与代码内协议常量决定。

### 已知限制、注意事项、踩坑记录（供 DSH 升级时迭代参考）

- **仅 Web UI 渲染**：交互卡片只在 web 端渲染；TUI / headless 客户端显示普通工具结果文本（通用降级路径，功能不坏）。
- **卡片内按钮暂不能向主对话发送 follow-up 消息**（README 明示的限制）。
- **`update` 非并发安全**：并行 update 各自以对方已覆盖的基底打补丁，会静默丢弃非本处编辑；`isConcurrencySafe` 仅 `create` 为真。同轮多次补丁需共享同一 `path` 顺序累加。
- **update 的严格匹配**：`old_str` 必须逐字节唯一命中；差一点就整体拒绝并报锚点，不会猜改。`title` 在 update 必填（不静默回默认）。空 `new_str` = 删除命中区。
- **网络 API 全部被禁**：`fetch`、XHR、WebSocket、表单提交被 CSP 拦截且**无错误提示**（静默失败），模型必须使用固定 CDN 的白名单静态资源并固定版本。
- **片段禁止文档骨架**：带 `<!doctype>`/`<html>`/`<head>`/`<body>` 的片段被拒绝而非渲染成坏卡。
- **卡片每次改动整体重载**：模型在卡内用户操作过的状态（拖拽、滚动、输入）会随重载重置——技能要求批量合并修正而非零散打补丁。
- **流式预览不执行脚本**：半成品阶段脚本保持惰性（半段 JS 几乎必坏）；只有落定卡片跑完整脚本。若预览早退，属正常设计。
- **主题采读点在 body**：DSH 把令牌定义挂在 `body`（暗色在 `body[data-ds-dark-theme]`），自定义属性只向下层叠，因此从 `body` 读、不能从 `:root` 读；缺失令牌解析为空串，由框架 `light-dark()` 回退兜底。
- **color-scheme 禁区**：片段内禁止自己声明 `color-scheme`（技能明示），否则会把子树内所有 `light-dark()` 翻到观看者 OS 偏好，可能反转文字与背景。
- **canvas 读不到 CSS 变量**：Chart.js 等 canvas 图表需先经探针元素解析令牌（`themeColor()` 手法，见 `references/charts.md`），直接传 `'var(--…)'` 会静默画空。
- **流式片段解析**：`extractStreamingFragment` 对"可能不完整"的 JSON 参数前缀逐字符解转义，尾部半截转义 / `\uXXXX` 未满 4 位时提前返回，避免误读；`trimStreamingScripts` 会整段丢掉还没收口的 `<script>` 块。
- **注入顺序依赖**：client 注册前必须等各 hole 声明就绪（`slots.inject` 包裹），直接 register 与声明竞态会导致启动失败——改造 client 时勿去掉这层等待。
- **主题实时跟随**：卡片对根元素与 `body` 属性变化做 `MutationObserver` + `prefers-color-scheme` 监听，切主题/切系统外观会重建框架文档；高开销场景下注意这是每次刷新的设计行为。
- **安全边界**：iframe `sandbox="allow-scripts"` 不透明源 + 框架自身 CSP（`frame-src 'none'`、`object-src 'none'`、`base-uri 'none'`、`form-action 'none'`、`connect-src blob: data:`），白名单是协议常量非配置，改动需同时改 shell 与 skill 正文两处保持一致。
- **升级提醒**：peerDependencies 基线 `^0.1.0-rc.6`、开发基准 rc.7，DSH 服务大版本变更时优先核查 `dsh-tools` / `dsh-skill` / `dsh-fs` / `dsh-sandbox-policy` / `dsh-client-ui-*` 的 API 形状（register / inject / defineTool / presentCall / presentResult / SlotMap 声明）。
