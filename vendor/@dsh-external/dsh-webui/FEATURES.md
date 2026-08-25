# WebUI 工具链（@dsh-external/dsh-webui）— 整合包内功能说明

## 一、功能描述

**一句话定位**：一个把视图切换、消息导航、供应商管理、辅助视觉、生图生视频、记忆引擎、AI 浏览器、文件浏览器、Markdown 渲染、工具调用聚合、网页搜索、提示音、会话增强、中文思考、网络代理等能力揉成一体的 DSH 会话增强「全家桶」插件，纯插件实现，不改动 DSH 宿主源码。

**核心功能清单**（均可在源码 `src/` 找到对应实现）：

- **会话视图与消息导航**（`src/client/Webui.tsx`）：会话头部右上角「对话/轨迹」双视图图块、消息计数角标、弹层消息列表、右侧竖向消息条面板；列表按 5+5 滚动窗口化渲染，跳转消息带闪烁高亮。
- **供应商管理**（`src/provider-hub.ts` + `src/client/provider-hub/`）：设置页集中管理对话、视觉、生图、生视频四类供应商，含用量工作台、PerfBench 压测、能力探测。
- **辅助视觉 / 生图 / 生视频**（`src/vision-helper.ts`）：工具 `vision_describe`、`generate_image`（1-4 张）、`generate_video`；走 OpenAI 兼容接口；模型路由由 `model-router.json` 解析（`visionActive/vision[]`、`imageActive/image[]`、`videoActive/video[]`、`capabilities`）；非多模态模型收到图片时经 `llm/stream` 事件瀑布回退为视觉描述。
- **记忆引擎**（`src/memory/`）：工具 `memory_search`、`memory_remember`、`memory_pin`、`memory_tag`、`memory_forget`；回合自动抽取（turn/importance）、跨会话自动整理（compile）、每日汇总（daily）；`agent/pre-step` 前置注入记忆，token 预算可配。
- **AI 浏览器**（`src/browser/`）：16 个工具——`browser_start`、`browser_navigate`、`browser_snapshot`、`browser_click`、`browser_type`、`browser_select`、`browser_hover`、`browser_press`、`browser_scroll`、`browser_back`、`browser_forward`、`browser_evaluate`、`browser_see`、`browser_screenshot`、`browser_stop`、`browser_status`；基于 Node 原生 WebSocket 连 CDP 驱动无头 Chrome，专用 user-data-dir 隔离 profile；`tools/pre-execute` 做 allow 门控。
- **文件浏览器**（`src/file-explorer.ts` + `src/client/file-explorer/`）：工作区浏览/列表/读/写/二进制/系统资源管理器打开，工作区包含约束 + 回环地址限定。
- **高级 Markdown 渲染**（`src/client/markdown/`）：markdown-it + shiki 代码高亮 + mermaid 图表 + katex 公式 + markstream-react 流式渲染，含思考 chip、自定义代码块/图片/行内代码/链接节点，作用域 `dsh-better-markdown`。
- **工具调用聚合**（`src/client/tool-summary/`）：`conversation.chat.node` 的 `tool-call` 槽折叠工具调用为 shadow 节点，配活动抽屉（活动列表）。
- **网页搜索**（`src/client/AnySearchCard.tsx`）：AnySearch 网页搜索设置卡，API Key 走 DSH 凭据引用（默认凭据名 `ANYSEARCH_API_KEY`）。
- **任务完成提示音与完成药丸**（`src/task-done-sound.ts` + `src/done-pill.ts`）：任务完成响提示音；底部「完成药丸」弹窗统计最近完成的非子代理回合（最多 50 条）。
- **会话增强**：消息截图（`src/screenshot.ts`，无头 Chrome 渲染 PNG）、消息回溯 rewind（`src/rewind.ts`，快照对比/恢复，每会话最多 20 份）、Ctrl+Enter 换行、会话切换动画、会话固定、标题重命名、左侧悬浮侧边栏（`src/sidebar-float.ts`）。
- **中文思考 / 网络代理 / 提示词优化 / 推理等级同步**：`src/zh-thinking.ts`（systemPrompt 注入开关）、`src/proxy.ts`（undici 代理，all/selected 模式）、`src/prompt-optimize.ts`（SSE 流式优化草稿）、`webui_sync_reasoning` 工具（按 sensenova/agnes/rhythm/bai/pl 等推理档位模板补齐设置）。
- **用量工作台与技能开关**（`src/usage-host.ts` + `src/skill-toggles.ts`）：运行时动态 `import('dsh-usage-skill')` 承接用量统计；技能开关直接改写 SKILL.md frontmatter（`user-invocable`、`disable-model-invocation`）。
- **模块开关体系**（`src/modules.ts`）：32 个功能模块键，缺省全部启用，仅显式 `false` 才关闭。

## 二、兼容与依赖

### 依赖关系（package.json）
- **peerDependencies**：`cordis >=4.0.0-rc <5`、`react >=18`，以及 DSH 宿主服务 `@deepseek-ai/dsh-agent`、`dsh-llm`、`dsh-tools`、`dsh-web`、`dsh-settings`、`dsh-credentials`、`dsh-launch-environment`。
- **dependencies**：`markdown-it`、`katex`、`mermaid`、`shiki`、`markstream-react`、`stream-markdown`。
- **运行时动态依赖**：`dsh-usage-skill`（非静态依赖，`import()` 按需加载；未安装时仅用量/技能路由不可用，插件本身可启动）。

### host / client 双形态
- **Host 半身**（`src/index.ts`，Node/cordis）：`export const inject = ['settings', 'tools', 'web', 'systemPrompt', 'webServer', 'sandboxPolicy', 'fs', 'workspaceRegistry', 'credentials', 'sessions', 'sessionPersistence', 'llm', 'shell']`。
- **Client 半身**（`src/client/index.ts`，web bundle）：`export const inject = ['slots', 'settingsScope', 'connection', 'conversationEvents', 'locale', 'remote', 'layout']`；`dsh.client.platform = "web"`，向 10 个 `@deepseek-ai/dsh-client-*` 包注入能力。
- **集成形态**：整合包 vendor 目录聚合挂载（`cordis.patch.yml` 声明 bundle 挂载）+ 客户端 bundle 注入，纯插件无宿主源码改动。

### 注册的工具清单（`ctx.tools.register`）
`webui_sync_reasoning`、`vision_describe`、`generate_image`、`generate_video`、16 个 `browser_*`、5 个 `memory_*`（共 24 个）。

### 注册的 HTTP 路由（`ctx.webServer.register`，共约 40 个端点）
- 模块/开关：`/api/webui-modules`（GET 全表 / POST 覆盖）、`/api/skill-toggles`（GET `/status`、PUT `/skills/:name`、PUT `/bundles/:id`）。
- 用量（dsh-usage-skill）：`/api/usage-stats/*`（usage、providers、balance、subscriptions、account、deepseek-billing、credentials）、`/api/skill-manager/*`。
- 视觉/生图/生视频：`/api/vision-helper/{snapshot,providers,config}`、`/api/image-gen/{snapshot,config}`、`/api/video-gen/{snapshot,config}`、`/api/model-capabilities`、`/api/test-capability`、`/api/test-reasoning`。
- 浏览器：`/api/dsh-browser/{status,screenshot,allow}`。
- 记忆：`/api/dsh-memory/*`（list、projects、tags、changes、summary、inject-state、pin、update、consolidate、consolidate-undo、move、delete、delete-project、meta、remember）。
- 会话增强：`/api/webui-rewind/{check,diff,restore}`、`/api/webui-screenshot` + `/api/webui-screenshot/image`、`/api/webui-done-pill?since=N`、`/api/webui-prompt-optimize`（POST，SSE 增量）。
- 设置/系统：`/api/dsh-proxy/{state,providers,set}`、`/api/zh-thinking`、`/api/sidebar-float`、`/api/file-explorer`（GET `/workspaces`、`/list`、`/read`、`/raw`、`/bin`；PUT `/write`）、`/api/file-explorer/open-in-explorer`、`/api/perf-bench`、`/api/detect-capability`。
- 安全限定：含敏感数据/写操作的端点默认仅回环地址（127.0.0.1 / localhost / ::1）可访问；写文件路由使用 danger-full-access 写策略并做工作区包含校验。

### 注册的客户端槽位（`ctx.slots`）
- `conversation.session.header.utilities`（id `webui`）：视图图块 + 消息入口。
- `conversation.input.right`：`webui-provider` 供应商标签、模型选择（model-seats）、提示词优化入口。
- `conversation.input.left`：记忆面板开关。
- `conversation.input.model`：推理等级滑动式弹出（model-selection）。
- `conversation.chat.node`：`tool-call`（工具聚合，priority -100）、`assistant-step`（markstream 渲染，priority -100）、rewind 回溯按钮、生图画廊卡片。
- `conversation.chat.assistant-actions`：消息截图按钮。
- `conversation.chat.turnTail`：任务完成提示音。
- `settings.section` / `settings.general.item` / `settings.plugin.item`：供应商管理页、浏览器/代理/中文思考/侧边栏/提示音/完成药丸开关、AnySearch 网页搜索卡。
- `shell.overlay`：完成药丸、批准通知、文件浏览器抽屉。
- `sidebar.footer.action`：记忆面板、用量工作台、用量卡入口。

### 提供的服务与消费的事件
- `ctx.provide('vision-describe', ...)`：向 DSH 宿主暴露「看图描述」能力供其它组件复用。
- 消费事件：`session/event`（记忆回合捕获、rewind 快照、done-pill 计数）、`agent/pre-step`（记忆注入，prepend）、`llm/stream`（视觉回退瀑布，全局）、`fs/write-intent`、`fs/edit-intent`（rewind 记录被改写文件）、`tools/pre-execute`（浏览器 allow 门控）。

### 需要的 DSH 服务与版本要求
- 需要宿主已装配：`@deepseek-ai/dsh-agent`、`dsh-llm`、`dsh-tools`、`dsh-web`、`dsh-settings`、`dsh-credentials`、`dsh-launch-environment`；cordis 4.0.0-rc 及以上、react 18 及以上。
- 客户端侧要求宿主提供 `@deepseek-ai/dsh-client-*` 10 件套（runtime、ui-conversation、ui-tool、ui-model-selection 等）以及 `settingsScope`/`conversationEvents` 等 ClientContext 能力。

### 与整合包内其它子插件的关系
- 强依赖：`dsh-usage-skill`（运行时动态 import，提供 `/api/usage-stats/*` 与 `/api/skill-manager/*` 的实现，整合包内已含则开箱即用）。
- 能力重叠/替代：本插件是历史多个单体插件（provider-hub、vision-helper、image-gen、image-gallery、memory、browser、file-explorer、better-markdown、tool-summary、web-search-anysearch、usage-skill、zh-thinking、task-done-sound、updater、proxy）的合并全栈；整合包若同时装有对应单体插件，需注意功能重复与槽位冲突。

## 三、功能适配细节

### 集成方式
- **host 聚合挂载 + 客户端 bundle 注入**：宿主经 cordis 插件清单加载 `src/index.ts`；客户端经 `dsh.bundle.patch`（`cordis.patch.yml`）挂载 bundle，`src/client/index.ts` 装配 client 能力。
- **模块门控**：`webui-modules` 设置命名空间 + `/api/webui-modules` API + localStorage `dsh-webui.modules` 三级配置。语义为**缺省 = 启用**（`isModuleEnabled` 仅当显式为 `false` 才关闭）；POST 覆盖后需**重启 DSH 生效**。
- **服务端配置优先级**：启动时读 localStorage 立即生效，后台拉取 `/api/webui-modules` 服务端配置校正。

### 配置项（设置命名空间）
- `webui-modules`：模块开关表（见下）。
- `network-proxy`：`enabled`（默认 false）、`url`（默认 `http://127.0.0.1:10808`）、`mode`（all/selected）、`providers[]`（仅选中的供应商走代理）。
- `zh-thinking`：`enabled`（默认 true），经 systemPrompt section（name `zh-thinking`，order -50）注入。
- `sidebar-float`：`fixed`（默认 true）。
- 消费的既有命名空间：`web-search-anysearch`（`apiKey` 凭据引用 / `baseURL` / `maxResults`）、`llm-pi-ai`（供应商表只读/补全，推理等级同步用）。
- 浏览器允许开关：`plugin-data/dsh-browser/prefs.json` 的 `allowBrowser`（默认 true），供 `tools/pre-execute` 门控。
- 视觉/生图默认值：timeoutMs 150000、maxTokens 2048、fallbackCacheSize 256、textModelImageFallback true；默认视觉模型走 sensenova 系。

### 客户端 localStorage 键（真实键名）
`dsh-webui.modules`、`dsh.donePill.read`、`dsh.donePill.pos`、`dsh.donePill.enabled`、`dsh.donePill.reminderDismissed`、`dsh.sidebarFloat.fixed`、`dsh.sidebarFloat.width`、`dsh.taskDoneSound.played`、`dsh-memory:read`、`dsh-webui.pinned.sessions`、`dsh.webui.archive-height`、`dsh-webui.consolidate-model`、`dsh-webui.consolidate-compact`、`dsh-webui.appearance.glass`、`dsh.conversationWidth`。

### 数据落盘位置（相对 DSH 用户数据目录，无绝对路径）
记忆：`memories/dsh-memory`；截图：`storages/webui-screenshot`；rewind 快照：`storages/webui-rewind`。敏感凭证一律走 DSH 凭据体系（`dsh-credentials` / 设置页凭据引用），插件不落盘明文密钥。

### 模块键（32 个，`src/modules.ts`）
`messageWidth`、`doneSound`、`donePill`、`approvalNotify`、`ctrlEnter`、`sessionMotion`、`sessionPin`、`titleRename`、`rewind`、`screenshot`、`promptOptimize`、`zhThinking`、`peakValley`、`chatStats`、`toolSummary`、`reasoningSync`、`modelSeats`、`providerHub`、`vision`、`webSearch`、`mail`、`skills`、`browser`、`automation`、`planweave`、`memory`、`usage`、`fileExplorer`、`dirPicker`、`appearance`、`sidebarFloat`、`updater`、`proxy`。

### 已知限制与升级踩坑
1. **模块开关非全量生效**：键表 32 个，但本 0.4.0 裁剪版只装配了部分——host 侧仅 `fileExplorer`/`screenshot`/`rewind`/`donePill`/`vision` 走门控，其余（含 memory、browser、proxy、zh-thinking、usage）为常装；`chatStats`、`automation`、`planweave`、`dirPicker`、`updater`、`mail`、`peakValley`、`approvalNotify` 等键已声明但未在装配入口接线（源码目录残留 `peak-valley/`、`updater.tsx`、`mail/MailCard.tsx`、`approval-notify/` 等未导入文件），别指望这些开关生效。
2. **`dsh-usage-skill` 为动态 import**：未安装对应包时用量/技能路由静默降级，插件仍可启动；集成包打包时需确认包含该依赖。
3. **客户端注入的 10 件 `@deepseek-ai/dsh-client-*` 需与宿主版本匹配**：升级 DSH 宿主后，槽位契约（`conversation.chat.node` 的 `tool-call`/`assistant-step` 键）、`llm/stream` 瀑布事件结构、`settingsScope` 接口可能变动，需要同步适配。
4. **markstream 组件作用域冲突**：自定义组件挂在 `dsh-better-markdown` 作用域，与其它改写 markstream 的插件共存时按组件名覆盖、卸载时统一清理；多个 markdown 插件同时开可能互相覆盖渲染节点。
5. **视觉回退依赖全局 `llm/stream` 事件**：任何改动流事件结构的第三方插件都会破坏「非多模态图片回退」链路。
6. **rewind/done-pill 有数量上限**：rewind 每会话 20 份快照；done-pill 只统计非子代理回合、最多 50 条，压测场景注意截断。
7. **代理仅拦截走 undici 全局 dispatcher 的请求**：未通过 `Symbol.for('undici.globalDispatcher.1')` 的直连请求不受代理设置影响，排查「某供应商不走代理」先看是否绕过 dispatcher。
8. **敏感路由回环限定**：`/api/file-explorer` 写操作、prompt-optimize 等仅回环可达；反向代理/远程访问场景会失效属预期行为。浏览器 `allowBrowser` 默认放行，安全敏感环境记得在 `prefs.json` 关掉。
9. **浏览器/截图依赖本机无头 Chrome 与 Node 24 WebSocket**：无 Chrome 或旧版 Node 时 browser 工具与 `/api/webui-screenshot` 不可用，属环境依赖而非插件缺陷。
10. **中文思考经 systemPrompt 注入（order -50）**：与其它同样注入 systemPrompt 的插件存在顺序竞争，期望文案被覆盖时先检查 section 顺序。
