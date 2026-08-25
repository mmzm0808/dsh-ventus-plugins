# 上下文洞察（dsh-context）— 整合包内功能说明

## 功能描述

- **一句话定位**：一个 DSH 插件，用于 Agent 上下文的洞察与管理——在会话内提供「上下文」标签页和 `/context` 命令，让用户看清当前上下文由什么构成、如何随每次请求演变。version 0.31.1，作者 bowenliang123，Apache-2.0。

- **核心功能清单**（全部来自源码与官方 README）：
  1. **Context 标签页**（`conversation.view` 插槽，id=`context`，order=20，排在 Chat 与 Trajectory 之后）：在任意会话内新增「上下文」视图，一次展示五个区块——上下文统计、当前构成、上下文趋势、上下文事件、模型可见消息列表，外加「上下文浏览器」。
  2. **`/context` 斜杠命令**：在会话内唤起居中弹窗，显示**当前构成**卡片和**上下文浏览器**，不离开聊天即可查看任意一次请求的组成。命令是纯客户端实现，不向 host 分发、不写会话日志、不进入模型视野。
  3. **上下文统计（stats board）**：轮次、步数、注入数、压缩数、剪枝数、当前上下文内的工具调用数、图片数、缓存命中率（读官方 `tokenUsage` 投影）以及整场会话的**累计费用估算**（按 DeepSeek 官方刊例价，区分缓存命中/未命中、高峰/空闲半价时段，价格写死在代码里，仅供参考）。
  4. **当前构成（current composition）**：六色堆叠条（系统提示词 / 工具定义 / 用户消息 / 注入内容 / 助手消息 / 工具结果），按模型完整上下文窗口缩放，灰色轨道为剩余空间；另列出 Top-5 最贵的工具 schema。头部占用率与构成读数直接复用官方 token 表盘（`contextPressure` / `contextBreakdown` 投影），与聊天气泡上下文圆环点开面板的数字完全一致。
  5. **上下文趋势（trend chart）**：每个模型请求一根堆叠条（比逐消息更细）。支持 Step / Turn 粒度切换、Total（累计构成）/ Delta（每次请求的符号变化量）模式切换、横向滚动整场会话、悬停即时提示、点击固定完整分类拆解、✂ 标记压缩/剪枝落地位置、与上下文浏览器联动预览。**Step 摘要（step brief）**用三行自然语言说明每一步「是什么」：User（本轮开场消息）、In（本步新进入上下文的内容）、Response（模型的文本回复和/或工具调用），点击任意一行即可在浏览器中定位到该消息。
  6. **上下文事件（events）**：每次压缩、工具输出剪枝、skill/插件上下文注入、模型切换、计划模式开关均记录一条事件，带生产者来源（指令文件路径、插件 id、skill 名）、token 增减（压缩/剪枝为净回收量）、轮次/步骤定位与时间戳；可按类别（Inject / Compact / Prune / Switch / Mode）过滤。
  7. **消息构成（messages）**：当前模型实际可见的消息列表，最新在前，每条带 token 估算成本。
  8. **上下文浏览器（context browser）**：可挑选「当前（下一次请求）」或任意保留步骤，展开看该请求实际由什么组装而成：六个可折叠分类（系统提示词 / 工具 schema / 用户消息 / 注入内容 / 助手消息 / 工具结果）逐元素列出（各带 token 价格），再展开能看到完整内容——系统提示词全文、每个工具的 description 与 JSON schema、消息文本、思考、工具调用参数、工具输出。工具结果显示调用名/参数与 OK/error 状态、结果行数与 Raw/Markdown 切换、图片载荷渲染为缩略卡片。**与上一轮末步对比**（vs previous turn）给每个分类加带符号的 delta 徽标（`+N` 项、`+Nk` tokens）。压缩前的步骤由「已移除消息归档」重建并标注为近似构成；超出已加载窗口的元素会自动翻页更早历史补齐；AGENTS.md、会话开始上下文等实时注入始终列出。
  9. **多模态（DeepSeek Harness 0.1.1+）**：完整适配 0.1.1 多模态管线与 DeepSeek-V4-Flash-Vision-Exp 视觉能力。带图片的用户消息展开为图文卡片布局（文本卡 + 等宽两列图片缩略图网格），每张图片显示名称、归一化后尺寸（0.1.1 缩小管线发生降采样时还显示归一化前尺寸）、存储字节数、**估算 token 成本**（按 DeepSeek 官方图片尺寸→token 换算，单图 117–384 tokens）；助手消息与工具结果里的图片块也能渲染，不再被静默丢弃。图片经 harness 自身的会话授权加载器加载（与聊天历史同一套），加载器不可用时退化为仅元数据卡片。

## 兼容与依赖

### package.json 关键依赖

- **peerDependencies**（peer 由宿主 DSH 提供，插件不打包）：
  - `@deepseek-ai/cordis` ^4.0.1（插件运行时）
  - `@deepseek-ai/dsh-session` ^0.1.0-rc.7（会话事件模型）
  - `@deepseek-ai/dsh-settings` ^0.1.0-rc.7（host 侧设置命名空间服务）
  - `@deepseek-ai/schemastery` ^3.18.1（设置 schema）
  - `zod` ^4.4.3（host 配置与投影 wire 校验）
  - `react` ^18.3.1（可选，客户端 bundle 外部化）
  - `@deepseek-ai/dsh-client-ui-primitives` ^0.1.0-rc.7（可选，事件图标）
- **devDependencies**（构建期）另含 `@deepseek-ai/dsh-session-projection` ^0.1.0-rc.7（投影定义类型）。
- 包体（files）只发布：`lib/index.js`、`lib/client.js`、`lib/index.d.ts`、`cordis.patch.yml`、README、LICENSE。

### host / client 形态

- **host 半身**（包主入口 `lib/index.js`，Cordis 普通插件模块）：自 v0.9 起是纯 session 投影单元，不再有自定义 RPC 通道。`inject = ['sessionProjections']`——`sessionProjections` 注册表是唯一必需服务，缺注册表时插件保持 PENDING 直至服务出现，注册表不存在则插件静默失效（安全）。
- **client 半身**（`./client` bundle，平台 `web`）：package.json 的 `dsh.client` 段声明注入边 `@deepseek-ai/dsh-client-connection`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-settings`。bundle 经 `window.__ModuleLoader__.load({id, factory})` 进入 web 启动交接，导出 `{ name, inject: ['slots','locale'], apply }`，样式以 `<style data-plugin="dsh-context">` 注入。
- **无 HTTP 路由 / 无 RPC 通道 / 无工具注册**：数据面全部走 harness 的 session-projection 推送管线（`session/projection` 帧），客户端通过标准座位 `useProjection(...)` 读取，无轮询、无 client 侧缓存。

### 注册点（从 src 提炼的真实注册）

**Host 半身**（`src/host/index.ts`）：
- `export const inject = ['sessionProjections']`（模块级唯一门）
- `ctx.sessionProjections.register(createContextTimelineDefinition(config))` —— 投影 key **`contextTimeline`**，`stateVersion: 9`，数据平面主体（fold 每提交一个 `session/event` 增量重放，经 `sessionProjectionCache` 持久化，推送给浏览器）。
- `ctx.sessionProjections.register(createContextHeadersDefinition())` —— 投影 key **`contextHeaders`**，`stateVersion: 1`，保留 request-header 的 CONTENT 时代（完整系统提示词 + 工具 schema），供浏览器卡片显示实际内容；头变化罕见，该值推送极少。
- `ctx.inject(['settings'])` → `sctx.settings.register(settingsNamespace('dsh-context'), SettingsSchema)`（`src/host/settings.ts`）。

**Client 半身**（`src/client/index.ts`）：
- `ctx.locale.register('dsh-context', { zh: DICT_ZH, en: DICT_EN })` + `ctx.locale.bind('dsh-context')`。
- `ctx.slots.inject('conversation.view', ...)` → `ctx.slots.register({ name:'conversation.view', id:'context', order:20, locale:'dsh-context', label:()=>t('tab') }, ContextView)`。
- `ctx.slots.inject('conversation.input.overlay', ...)` → `ctx.slots.register({ name:'conversation.input.overlay', id:'context-modal', order:10, locale, inject:(sessionId)=>({ hooks:{ contextModal: modalStoreOf(sessionId) } }) }, ContextModal)`。
- `ctx.get('inputTriggers').registerSource({ trigger:'/', name:'context', order:1, candidates, onPick, matchEnter })`（`src/client/command.ts`；软依赖，无 inputTriggers 时仅命令缺席）。
- `ctx.inject(['settingsScope'])` → `settings.attach(binder.bind({ namespace:'dsh-context' }))` + `ctx.slots.inject('settings.plugin.item', ...)` keyed **`dsh-context`**（设置卡）。
- `ctx.sessions.provide({ props:['loadOlderHistory'], resolve: binding => ({ props:{ loadOlderHistory:()=>binding.session.loadOlder() } }) })` —— 向会话组件贡献历史翻页动词，软失败。
- 读取的投影 key：插件自有的 `contextTimeline`、`contextHeaders`；官方 token 表的 `contextPressure`、`contextBreakdown`、`tokenUsage`（均可选，缺失则降级到派生估算/省略）。

### 需要的 DSH 服务与版本要求

- **必需**：`ctx.sessionProjections`（session-projection 注册表，含其持久化缓存 `sessionProjectionCache`）。
- **会话事件模型**：`@deepseek-ai/dsh-session` 的 `session/event` 事件流（含 `request/header`、`compaction/*` 等由其它插件声明的词汇，fold 用结构包络消费、不强依赖声明插件包）。
- **版本契约**：投影单元按**双契约**发布（`src/host/compat.ts`）——`{ key, schema, view }` 兼容 dsh ≤ 0.1.0-rc.8，`{ key, stateSchema, wire, stateVersion }` 兼容 dsh ≥ 0.1.1-rc.1；同一对象携带两套字段，各版本注册表只读自己认识的字段。**注意**：0.1.1-rc.1+ 注册表若无 `wire` 块会把单元视为 host-only，`contextTimeline` 永不推送到浏览器，Context 标签页会永远停在加载屏。
- **多模态**：完整图片能力需 DSH **0.1.1+**（多模态管线 + 会话授权图片加载器）；旧版本退化为无图文本展示。
- **读侧可选服务**：`ctx.settingsScope`（无则无设置卡）、`ctx.sessions.provide`（无则浏览器保留预览+提示降级）、`ctx.conversation`（图片解析，无则图片卡退化为仅元数据）、`ctx.inputTriggers`（无则 `/context` 命令缺席）、官方 `dsh-token-meter` 投影单元（无则占用/构成/命中率退化为派生值）。

### 与整合包其它子插件的关系

- **独立自包含**：dsh-context 是 `vendor/` 下的独立子插件，通过自身 `cordis.patch.yml`（`dsh.bundle.patch`）插入自己的 loader 行，客户端经自身 `dsh.client` 声明内嵌。它**不参与** `dsh-ventus-plugins` 聚合包（11 子插件的 host 聚合 + 单一 client bundle），是整合包仓库里与聚合包平级、各自独立安装的成员。
- **与其它 vendor 子插件（better-sidebar / theme-endfield / ua-relay / usage-skill / ventus-* 等）无代码级依赖**：不共享包体，生命周期互不影响。
- **共享的只是 harness 运行时接缝**：与所有子插件共用 `sessionProjections` 注册表、`slots` 插槽系统、`locale` 命名空间、`settings` 文档——因此插件列表会显示其独立条目（名字 `dsh-context`，插件信息卡展示名称/版本/GitHub），且其设置卡与聚合包设置卡同处「设置 → 插件 → 插件配置」。
- **命名空间/键的唯一性**：投影键 `contextTimeline`、`contextHeaders`、设置命名空间 `dsh-context` 为 dsh-context 独占，不与任何子插件冲突。

## 功能适配细节

### 在整合包里的集成方式

- **宿主侧**：以 `vendor/dsh-context` 作为已安装插件包整目录入驻（含构建产物 `lib/`、`package.json`、`cordis.patch.yml`、README），由各自的 `dsh.bundle.patch`（`cordis.patch.yml` 的 `- insert: - id: dsh-context`）把 loader 行并入 profile，走官方「先 `dsh plugin remove` 再 `dsh plugin add .`」的本地安装流程（见 `scripts/register.sh`）。安装无需构建、无重启约束（bundle 层启动时加载，client 改动经 HMR 即时生效）。
- **客户端**：bundle 由 `dsh.client` 声明自动内嵌进 web 启动表，零额外配置。
- **可选性**：此插件是**可选安装**——不装它不影响聚合包任何功能；装上即在会话内多出「上下文」标签页与 `/context` 命令。

### 配置项与设置键（真实键名）

**Host 部署级配置**（cordis loader 行 `config:` 块，zod `.strict()` 校验，未提供用默认值；改动只影响保留/展示切片，不触发投影 `stateVersion` 变更）：
- `maxRequestSteps`（默认 1500）：保留的逐步请求记录上限（硬步数兜底）。
- `maxKeptTurns`（默认 300）：保留的最新整轮窗口；裁剪按整轮走，绝不从一轮中间切断。
- `maxEvents`（默认 400）：保留的上下文事件条数上限（保留最新尾部）。
- `maxNodes`（默认 2000）：对外提供的实时面节点数（最新尾部 + 钉住的 live 注入节点；每个推送节点约 150B）。
- `maxArchiveNodes`（默认 400）：为逐步骤重建而保留的「已移除（被遮蔽）面节点」数。
- 附加内部常量：header 时代上限 `HEADERS_MAX = 50`。

**用户级设置**（设置命名空间 **`dsh-context`**，经 harness 设置接缝存取，host 只注册、客户端读写在卡片上）：
- `defaultGranularity`：趋势图默认粒度，`'step'` | `'turn'`，默认 `'step'`。
- `defaultTrendMode`：趋势图默认模式，`'total'` | `'delta'`，默认 `'total'`（schema 用 `.loose()`，过期残留值降级为默认而不是弄坏分区）。
- 图表内的切换按视图临时生效，不覆盖已存的偏好。
- **没有 localStorage 键**：本插件的全部偏好都走 harness 设置文档接缝（`ctx.settingsScope.bind({namespace:'dsh-context'})`），浏览器本地不落任何自定义存储键。设置卡只在 host 半身已装**且**设置文档可写时出现（远程浏览器在内存模式下设置仅进程本地，不显示卡片）。

### 已知限制、注意事项、踩坑记录（供后续 DSH 版本升级迭代参考）

- **投影状态必须保持纯 JSON**：持久化状态含 `undefined` 值属性曾违反 projection-cache 的「无损耗 JSON 可序列化」前置条件，导致**每一次**投影缓存写入都抛错（`projection checkpoint is not losslessly JSON-serializable`），连带饿死 `title` 投影行、重启后会话列表异常。该问题由 `stateVersion` 从 3 升 4 修复（去掉 undefined 属性）。升级时改动任何持久化形状都必须复查 `undefined`。
- **`stateVersion` 语义**：凡持久化状态形状或 fold 语义变化**必须** bump（缓存行作废重算）；仅配置界调整（上面的 bounds）不需要。历史 bump 轨迹：2 占用镜像移除、3 移除消息归档加入、4 去掉 undefined 属性（上述事故）、5 会话费用合计加入、6 图片按官方视觉计算器重计价、7 整会话图片数、8 图片数移到逐节点 `imgs`、9 逐请求 `cacheRead` 计费缓存读。当前 = **9**。
- **`apply` 返回同引用契约**：对不改变状态的事件必须返回同一个 state 引用（`Object.is` 门控变更推送）；任何改动返回新引用（惰性浅克隆）。
- **双契约单元**：升级 DSH 时注意投影注册表契约在两个版本段的差异（见上「版本契约」）；0.1.1-rc.1+ 缺 `wire` 块 = host-only，浏览器永远等不到 `contextTimeline`。
- **`/context` 命令纯客户端**：不走 host 分发、不写会话日志、不进入模型视野；令牌留在输入框直到弹窗关闭时按 guard（span CAS / bare-token）消费，草稿被用户改动则静默放弃。
- **令牌估算口径**：与 dsh 内置 token-meter 相同的固定密度启发式（约 4 字符 ≈ 1 token，+4 每内容块，+4 角色框架）；图片块经官方「图片 Token 计算器」移植（共享模块 `shared/imageTokens.ts`，单图 117–384 tokens，按像素尺寸），维度未知时回退到 meter 的通用 JSON 价。「实际」数字来自供应商上报用量（`prompt` / `output` / `cacheRead`）。
- **客户端防白屏**：`timelineOf` 等收窄器对损坏/过期投影值做**清洗**而非拒绝——集合兜底为空数组、`current` 重建为数值拆解、错误类型标量丢弃或归零，保证整页仍渲染出可用数据；渲染外再包 error boundary。
- **只读/缺失环境的降级链**：无 `contextHeaders`（旧 host）→ 系统/工具区仅 token 并标注；无 `contextBreakdown` / `contextPressure` → 用 fold 自算；无 `tokenUsage` → 命中率格显示破折号；无 `sessions.provide` → 浏览器展开窗口外元素时保留「预览+提示」而非翻页；无图片加载器 → 图片卡仅元数据。
- **无服务器/无账号信息**：本插件不持有任何 API key、token、凭据，费用估算用的刊例价为代码内硬编码，随 DeepSeek 官方价格变化需人工更新。
