# 右侧重栏（dsh-better-sidebar）— 整合包内功能说明

## 功能描述

dsh-better-sidebar 是一个服务化的双工作台框架（右侧栏 + 底部面板），为 DSH 网页端提供 VSCode 风格的文件管理、编辑器、终端、Git 面板、内嵌浏览器和后台任务视图，并通过 `ctx.betterSidebar` 服务开放给所有插件，让第三方插件能注册新的侧边栏页面和文件预览器。

### 核心功能清单

- **文件工作台（编辑器 Tab）**：资源管理器（懒加载目录树，软链接按目标类型展示——目录软链接可展开、失效链接标红）+ CodeMirror 编辑器（多语言语法高亮：JS/TS/Python/Rust/Go/C++/Java/C#/Kotlin/Swift/HTML/CSS/Markdown/SQL/XML/YAML/PHP 等）。图片/Markdown（含 Mermaid 图表 strict 安全渲染 + 点击放大弹窗）/HTML/PDF/Office 内联预览。文件 tab 支持路径输入框头部 + 可开关的右侧停靠文件树（每 tab 记忆展开/宽度，全局文件名搜索走 host `fs.search` 路由）。
- **内嵌浏览器 Tab**：多开网页 tab，后退/前进/刷新；内容运行在沙箱 iframe（不透明源，无 `allow-same-origin`）。外链默认按协议分流——HTTP 在侧边栏打开、HTTPS 走系统浏览器，可在设置页分别调整。地址栏拒绝 `javascript:`/`data:`/`file:` 与 localhost 等本机地址。
- **真实终端 Tab**：xterm.js + node-pty 真实 shell，断线重连回放（30 秒重连宽限期）。每会话最多 3 个 UI 终端（可配置）。支持通过设置页配置 Shell 路径和参数（`terminalShell`/`terminalShellArgs`）。可选为模型注入 `terminal_*` 工具（`agentTerminalTools` 开关，默认关闭）。
- **Git 面板 Tab**：真 diff + VSCode 式 diff tab、提交历史、右键暂存/提交/还原/丢弃。支持 `git.status` / `git.diff` / `git.stage` / `git.unstage` / `git.commit` / `git.branch` / `git.checkout` / `git.log` / `git.commit-diff` / `git.discard` / `git.revert` / `git.cherry-pick` / `git.show`。只调 CLI、绝不设置身份。
- **后台任务页（Subagent Tab）**：subagent 拓扑 + 后台任务视图（退出码/实时输出/强制终止）。通过 `jobs.output` 和 `jobs.kill` 路由读取模型已读过的任务输出（不消耗模型的 `job_output` 游标）。
- **双工作台**：右侧栏 + 底部面板；拖 Tab 拆分/合并分栏（可跨面板），移动端（<768px）自动合并全宽抽屉。
- **会话隔离**：布局/Tab/面板按会话持久化到 localStorage（键 `dsh-sidebar:v1:<sessionId>`），陈旧状态自动净化。
- **声明式设置**：DSH 设置页「侧边卡片」专项设置面板，逐项独立开关，二级设置经齿轮弹窗。
- **按需加载**：启动只拉 ~325KB 核心，终端/编辑器/Mermaid 图表等重依赖用到才按需拉取（通过 `/sidebar/bundle` chunk 路由分发 `lib/client-<name>.js`）。
- **多语言**：界面文案跟随 DSH 语言（zh/en）实时切换。
- **IME 防劫持**：注册全局 IME 组合键守卫，防止中文输入法候选箭头被第三方 UI 劫持。

## 兼容与依赖

### peerDependencies（关键）

| 依赖 | 版本要求 | 说明 |
|---|---|---|
| `@deepseek-ai/cordis` | ^4.0.1 | DSH 容器框架 |
| `@deepseek-ai/dsh-agent` | ^0.1.0-rc.8 | Agent 终端工具依赖 |
| `@deepseek-ai/dsh-client-runtime` | ^0.1.0-rc.8 | 客户端运行时 |
| `@deepseek-ai/dsh-client-locale` | ^0.1.0-rc.8 | 国际化服务 |
| `@deepseek-ai/dsh-client-ui-conversation` | ^0.1.0-rc.8 | 会话 UI 基座 |
| `@deepseek-ai/dsh-client-ui-primitives` | ^0.1.0-rc.8 | 原语组件（图标等） |
| `@deepseek-ai/dsh-client-ui-slots` | ^0.1.0-rc.8 | 插槽系统 |
| `@deepseek-ai/dsh-host-webserver` | ^0.1.0-rc.8 | 宿主 HTTP/WebSocket 路由 |
| `@deepseek-ai/dsh-session` | ^0.1.0-rc.8 | 会话存储 |
| `@deepseek-ai/dsh-settings` | ^0.1.0-rc.8 | 设置服务 |
| `@deepseek-ai/dsh-tools` | ^0.1.0-rc.8 | 工具注册 |
| `@deepseek-ai/dsh-invariants` | ^0.1.0-rc.8 | 常量约束 |
| `@deepseek-ai/dsh-llm` | ^0.1.0-rc.8 | LLM 类型定义 |
| `react` / `react-dom` | ^18.2.0 | UI 渲染 |

### 宿主（host）/ 客户端（client）双半结构

- **host 半**（`src/index.ts` → `lib/index.js`）：Node.js 端，挂载 HTTP 路由与 WebSocket。注入服务：`['webServer', 'sessions', 'webRuntime', 'tools']`。导出 `ctx.betterSidebar` 服务类型声明（通过 `context-types.ts` 的 `declare module 'cordis'` 合并）。
- **client 半**（`src/client/index.tsx` → `lib/client.js`）：浏览器端，挂载 React 侧边栏 portal。注入服务：`['slots', 'sessions', 'connection', 'workspaces', 'locale', 'modules']`。通过 `ctx.provide('betterSidebar', service)` 发布服务实例。
- **client bundle 内嵌产物**：`lib/client-registry.js`（注册表）、`lib/client-terminal.js`（终端懒加载）、`lib/client-editor.js`（编辑器懒加载）、`lib/client-mermaid.js`（Mermaid 图表懒加载）。
- **platform**：`web`（`package.json` `dsh.client.platform`）。

### 注册的 slot / 工具 / HTTP 路由 / 服务

#### Slots（客户端）

- `ctx.slots.inject('settings.section', ...)`：注册 `id: 'better-sidebar'` 的设置面板分区，在 DSH 设置页渲染「侧边卡片」配置区。

#### 工具（host 端，通过 `ctx.tools.register`）

在 `agentTerminalTools` 开关开启时，向模型注入 8 个终端工具（通过 `tools.ts` 注册）：

| 工具名 | 功能 |
|---|---|
| `terminal_create` | 创建持久化终端，返回 uuid 句柄 |
| `terminal_list` | 列出当前 agent 在本会话的所有终端 |
| `terminal_send` | 发送文本（支持 `submit=true` 追加回车） |
| `terminal_read` | 读取终端留存输出（分页，上限 256KB/次） |
| `terminal_wait_for` | 阻塞等待子串出现或超时 |
| `terminal_resize` | 调整终端尺寸 |
| `terminal_signal` | 发送 POSIX 信号（SIGINT/SIGTERM/SIGKILL/SIGHUP/SIGTSTP） |
| `terminal_close` | 关闭终端，释放进程 |

#### HTTP 路由（host 端，通过 `ctx.webServer.register`）

| 路径 | 方法 | 功能 |
|---|---|---|
| `/sidebar/api/*` | POST | JSON API 分发（见下方 API 方法表） |
| `/sidebar/file` | GET | 媒体文件路由（图片/PDF/HTML，受会话 cwd 与信任围栏保护） |
| `/sidebar/html` | GET | HTML 预览路由（路径编码，CSP sandbox 防御性头部） |
| `/sidebar/bundle` | GET | 懒加载 chunk 路由（`lib/client-<name>.js`） |

#### WebSocket 升级（host 端，通过 `ctx.webServer.registerUpgrade`）

| 路径 | 功能 |
|---|---|
| `/sidebar/ws/terminal` | 终端 WebSocket（`?tab=...&sessionId=...` 挂 UI 终端；`?uuid=...` 挂 agent 终端） |
| `/sidebar/ws/agent-terminals` | Agent 终端列表推送 WebSocket（`?sessionId=...`） |

#### JSON API 方法（`/sidebar/api/<method>`）

| 方法 | 功能 |
|---|---|
| `session.cwd` | 获取会话工作目录 |
| `fs.tree` | 列出目录内容（懒加载，上限 1000 条/层） |
| `fs.search` | 全局文件名搜索（预算封顶，跳过 `.git`/符号链接目录） |
| `fs.read` | 读取文件（文本上限 512KB，二进制 NUL 探针 + 前 4KB head） |
| `fs.write` | 原子写入文件（先写临时文件再 rename） |
| `git.status` / `git.diff` / `git.stage` / `git.unstage` / `git.commit` / `git.branch` / `git.checkout` / `git.log` / `git.commit-diff` / `git.discard` / `git.revert` / `git.cherry-pick` / `git.show` | Git 操作 |
| `pty.close` | 释放 UI 终端（WebSocket 关闭之外的兜底） |
| `agent-pty.close` | 释放 agent 终端 |
| `terminal.deps` | 查询 node-pty 依赖状态（含修复命令） |
| `jobs.output` / `jobs.kill` | 后台任务输出/终止 |
| `shell.get` | 获取当前 shell 路径与显示名称 |
| `settings.get` / `settings.update` | 读写侧边栏用户偏好设置（修订号守卫） |
| `browser.probe` | HTTP HEAD 探测 URL 响应头（X-Frame-Options/CSP frame-ancestors） |

#### 服务（`ctx.betterSidebar`，通过 `ctx.provide` 发布）

| 方法 | 功能 |
|---|---|
| `registerTab` | 注册侧边栏页面类型（返回 disposer） |
| `registerFileViewer` | 注册文件预览器类型（返回 disposer） |
| `getTabs` / `getFileViewers` / `getTab` | 查询已注册的 descriptor |
| `isTabEnabled` / `isViewerEnabled` | 查询设置开关 |
| `matchFileViewer` | 按路径/head 字节匹配文件预览器 |
| `openTab` / `closeTab` / `activateTab` | 打开/关闭/激活 tab |
| `updateTab` | 更新已打开 tab 的标题/路径/meta |
| `openFile` | 在侧边栏编辑器中打开文件 |
| `getSnapshot` / `subscribeState` | 状态快照与订阅 |
| `subscribe` | 注册表变化订阅 |
| `version` / `features` | 版本号与能力列表 |

#### 自定义事件（浏览器 `window`）

- `dsh-better-sidebar:open-file`：其他插件（如 webui 的 fileMention）dispatch 此 CustomEvent 即可在侧边栏编辑器打开文件。

### 需要的 DSH 服务与版本要求

- DSH `^0.1.0-rc.8`（本插件 v0.14.0 适配）。rc.7 及更早环境无法解析本版依赖。
- 宿主端需要 `@deepseek-ai/dsh-host-webserver` 提供 HTTP/WebSocket 路由能力。
- 客户端需要 `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-slots` 等客户端服务。
- 所有 HTTP 路由受信任围栏（`/api` 同源策略）保护，依赖 `webRuntime.trustedHosts`。

### 与整合包其它子插件的关系

- **独立**：不依赖整合包内其他子插件，自身即可独立安装运行。
- **被依赖**：`dsh-git-remotes`、`dsh-sidebar-qa` 等推荐插件是 `dsh-better-sidebar` 的消费者，依赖 `ctx.betterSidebar` 服务注册自己的 tab/viewer。
- **互斥**：与 `dsh-web-ui` 家族（`aionui-panel`）的右侧面板互斥——通过 `aionui-panel` 设置命名空间的 `rightPanel` 值判断，当选择「使用 aionui-panel」时插件的整个侧边栏（右侧栏/底部面板/浮动入口/各类接管）不再挂载。
- **共享 node-pty**：与 DSH 核心共享同一 `node-pty@^1.1.0`，修复后两者同步恢复。

## 功能适配细节

### 在整合包里的集成方式

- **host 聚合挂载**：在整合包 `dsh-ventus-plugins` 中，`vendor/dsh-better-sidebar/` 目录存放本插件的 package.json 与构建产物（`lib/`）。整合包的 `lib/index.js` 在宿主端通过 `ctx.plugin()` 挂载本插件。整合包作为单一 bundle 挂载入 profile（`cordis.patch.yml` 的 `insert: ventus-plugins`）。
- **client bundle 内嵌**：整合包的 `lib/client.js` 内嵌了本插件的客户端代码，无需额外加载。
- **双挂载自动退让**：本插件自带的 `cordis.patch.yml` 含守卫表达式（`disabled` 字段），当检测到已有启用中的同包名挂载（如整合包以不同 id 挂载本插件）时，自动禁用自身的 bundle patch 行，避免重复注册 `/sidebar/api` 导致插件树启动失败。要求整合包的 bundle 顺序在本插件之前。
- **配置项**：插件的配置由整合包的 `lib/index.js` 在 `ctx.plugin()` 调用时传入。终端 shell 等配置也可通过 DSH 设置页「侧边卡片」实时调整，无需重启 DSH。

### 配置项与 localStorage 键

#### 插件配置（`cordis.patch.yml` / `ctx.plugin` 传入）

| 键名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `readLimit` | number | 524288 (512KB) | 单文件读取上限（字节），超限截断 |
| `mediaLimit` | number | 20971520 (20MB) | 媒体路由文件上限（字节），超限拒绝 |
| `listLimit` | number | 1000 | 目录列表每层最大条目数 |
| `terminalsPerSession` | number | 3 | 每会话 UI 终端上限 |
| `reconnectGraceMs` | number | 30000 | 断线终端重连宽限期（毫秒） |
| `shell` | string | '' | 终端 shell 路径（空=自动解析） |
| `shellArgs` | string[] | [] | 终端 shell 参数（非空时替换默认 `-l`） |

#### 用户偏好设置（Settings 命名空间 `dsh-better-sidebar`，存于 DSH settings document）

| 键名 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `openByDefault` | boolean | false | 新会话默认打开侧边栏 |
| `defaultWidthPercent` | number | 35 | 面板默认宽度百分比（20-60） |
| `autoOpenSubagent` | boolean | true | 子 agent 出现时自动打开侧边栏并展开子 agent 页 |
| `autoOpenJobs` | boolean | true | 后台任务出现时自动打开侧边栏并展开任务页 |
| `agentTerminalTools` | boolean | false | 是否向模型注入 8 个 terminal_* 工具 |
| `bottomPanelAutoTerminal` | boolean | true | 首次展开底部面板时自动打开终端 |
| `terminalFontFamily` | string | '' | 终端字体（空=跟随主题） |
| `terminalFontSize` | number | 13 | 终端字号（9-32 px） |
| `interceptOpenPath` | boolean | true | 聊天侧文件打开是否拦截到侧边栏编辑器 |
| `editorExplorer` | boolean | false | 编辑器合并模式（true=合并，false=独立，已改为 select 类型） |
| `terminalShell` | string | '' | 终端 shell 路径（设置页覆盖 yaml 配置） |
| `terminalShellArgs` | string | '' | 终端 shell 参数（空格分隔） |
| `titleBarCompat` | boolean | false | Windows 标题栏兼容模式 |
| `titleBarStripPx` | number | 40 | 标题栏保留高度（0-120 px） |
| `htmlViewerNoSandbox` | boolean | false | HTML 预览取消沙箱 |
| `htmlViewerDefaultUnsafe` | boolean | false | HTML 预览默认以非沙箱状态打开 |
| `browserNoSandbox` | boolean | false | 浏览器 tab 取消沙箱 |
| `browserInterceptLinks` | boolean | true | 主开关：外部链接是否拦截到侧边栏 |
| `browserInterceptHttp` | boolean | true | 拦截 http 协议链接 |
| `browserInterceptHttps` | boolean | false | 拦截 https 协议链接 |
| `tabsEnabled` | dict | {} | 按 tab id 的启用开关（缺省=启用） |
| `viewersEnabled` | dict | {} | 按 viewer id 的启用开关（缺省=启用） |
| `pluginSettings` | dict | {} | 第三方插件自有设置 blob |

#### localStorage 键

| 键 | 格式 | 说明 |
|---|---|---|
| `dsh-sidebar:v1:<sessionId>` | JSON | 按会话持久化的侧边栏状态（布局、打开的 tab、展开目录等） |

### 已知限制、注意事项、踩坑记录

1. **Git 无 push/pull/fetch**：Git 面板仅提供本地操作（status/diff/stage/commit/checkout/log/revert/cherry-pick），不包含远程推送。需要远程 Git 操作的可安装推荐插件 `dsh-git-remotes`。
2. **无文件 watcher**：文件系统变化需手动刷新（资源管理器无自动监听）。
3. **终端 Tab 拖到另一分栏会重挂载**：shell 进程会重开（断线重连宽限期仅适用于同一分栏）。
4. **Office 预览已移出内置**：`.docx`/`.xlsx`/`.pptx` 预览移至推荐插件（Office 预览插件），未安装时此类文件走代码/下载兜底。
5. **浏览器沙箱限制**：无登录态、第三方 Cookie 受限；部分站点（如 arxiv.org）被 `X-Frame-Options`/`frame-ancestors` 拒绝嵌入，显示原因面板（含「在浏览器中打开」按钮）；iframe 内部跳转不进后退栈。
6. **HTML 预览渲染的是已保存文件**：不反映未保存草稿。
7. **移动端无底部面板**（<768px）：进入窄屏时底部面板标签页一次性并入右侧栏；回桌面仍保留在右侧栏；底部面板只在宽视口下可用。
8. **node-pty 加载失败不拖垮 server**（v0.13.0+）：node-pty 缺失时插件照常挂载，终端以修复提示横幅呈现，agent 终端工具自动跳过（不注册）。修复命令：`pnpm approve-builds --all && pnpm rebuild node-pty`。
9. **双挂载风险**：聚合包（如 `dsh-ventus-plugins`）以不同 id 挂载本插件时，本插件自带的 `cordis.patch.yml` 守卫表达式会自动退让。但若聚合包 bundle 顺序在本插件之后，守卫无法看到后续条目，可能导致双挂载。确保聚合包 bundle 在 `dsh-better-sidebar` 之前。
10. **DSH 升级兼容性**：每次 DSH 大版本升级（如 rc.8→rc.9）需同步升级本插件 peerDependencies 中的 `@deepseek-ai/*` 包版本。`window.__DSH_MODULES__` 在 rc.8 已移除，改为 `ctx.modules` 服务——旧版 chunk 加载器依赖页面全局变量，需同步升级。
11. **设置页 revision 守卫**：`settings.update` 使用修订号守卫防止并发覆盖，但客户端 2 秒超时兜底，极端网络下可能落到不同修订。
12. **桌面端标题栏兼容**：Windows `win32` 高级标题栏模式下，需手动开启 `titleBarCompat` 并调整 `titleBarStripPx` 以避让 32px 标题栏区域。