# Auto 权限（@nanmicoder/dsh-auto-mode）— 整合包内功能说明

## 功能描述

**一句话定位**：基于沙箱的自动权限策略插件，为 DeepSeek Harness 的 tool pipeline 提供两层权限判定——第一层确定性规则（硬拒绝 + 白名单放行），第二层用 LLM 对边界案例做语义审查，实现"日常操作免打扰、危险操作不放过"的自动权限管理。

**核心功能清单**（具体能力，逐项从源码提炼）：

1. **权限预设注册** — 在 DSH 权限选择器中注册 `Auto` 预设项（对应 preset key `auto`），sandbox=workspace-write，approval=ask。用户可在会话中随时切换至 Auto 模式。
2. **确定性硬拒绝（Hard-Deny）** — 对以下高危操作直接在工具执行前拦截，不经 LLM 审查：
   - 特权升级（`sudo`、`doas`、`su`）
   - 系统安全策略变更（`set-executionpolicy`、`bcdedit`、`disable-windowsdefender`）
   - 凭据/私钥材料的网络外传（`curl`/`wget` 等含敏感标记）
   - 动态删除指向用户家目录（`$HOME` 动态展开 + `rm` 组合）
   - 写操作指向系统根目录、DSH_HOME 路径、凭据关键路径（`.ssh`、`.aws`、`.kube` 等）
   - Windows 保留设备路径（CON、NUL、COM1 等）
   - Windows 设备/NT 对象命名空间（`\\.\`、`\\?\`、`\??\`）
   - 工具参数含凭据/私钥材料
3. **确定性允许（Deterministic Allow）** — 对以下场景直接放行，不经 LLM 审查：
   - 只读工具（`read`、`read_image`、`grep`、`glob`、`lsp`）且在 workspace 内，或非敏感路径
   - 工作区内常规文件编辑（`write`、`edit`、`str_replace_editor` create/str_replace/insert）
   - 会话状态工具（`ask_user_question`、`todo_write`、`get_goal`、`skill`、`report` 等）
   - 只读 Harness 操作（`job_output`、`session_search`、`session_trace`、`cordis_inspect_*` 等）
   - AgentTeams 协调操作（`agent_teams_create`、`agent_teams_send_message` 等）
   - 所有者作用域生命周期控制（`job_kill`、`terminal_signal`、`terminal_close`）
   - 外部信息查找（`web_search`、`web_fetch`、`time`、`weather`）
   - 编排调用（`subagent`、`workflow`、`spawn_agent`、`send_message` 等）
   - 沙箱内不可识别 shell 语法（未知命令仍运行在 workspace-write 沙箱内）
   - 只读 shell 命令（`ls`、`cat`、`head`、`grep`、`pwd`、`echo` 等 60+ 种）
   - 构建/测试/版本探测命令（`pnpm build`、`npm test`、`tsc`、`vitest` 等）
   - 只读 Git 操作（`git status`、`git diff`、`git log` 等）
   - 工作区内文件创建/拷贝/移动（`mkdir`、`touch`、`cp`、`mv`）
   - 常规内联代码执行（`python -c`、`node -e` 等，但嵌套删除除外）
   - 只读网络检索（`curl`/`wget` 不带写操作参数）
4. **LLM 语义审查（Classifier）** — 对第一层无法确定（decision=ask）且 classifierEligible 的工具调用，提交给 LLM 做二次语义判断，输出 `allow`/`ask`/`deny`。支持两种 classifier 后端：
   - **原生 DSH Classifier**（默认）：复用当前会话的 `ctx.llm` 路由，不额外消耗 API key
   - **HTTP Classifier**（可选）：通过 `classifierEndpoint` 配置独立 OpenAI 兼容 API（如 `deepseek-chat`），环境变量 `DEEPSEEK_API_KEY` 或自定义 env 读取
5. **沙箱升级（Sandbox Escalation）** — 当模型在 `arguments` 中传入 `sandbox_permissions` + `justification` 时，可申请一次性的 `danger-full-access` 提权，由 classifier 做语义审查；通过后自动注入 `approval/request` 钩子，实现免弹窗一键批准。
6. **子代理权限继承** — 自动沿 `parentSession` 链向上追溯，子代理继承父代理的 Auto 模式；同时阻止子代理自行提权（"subagent cannot widen the parent workspace sandbox"）。
7. **Agent 系统提示注入** — 当 Auto 模式激活时，自动向 Agent 的 systemPrompt 注入 `AUTO_MODE_AGENT_GUIDANCE`（含沙箱工作范围、删除规则、提权规则等指引），优先级 order=111。
8. **会话产物追踪（Artifact Registry）** — 跟踪当前会话中由工具调用创建的文件，对同一会话创建的文件允许自动清理删除（`rm` 指向 exact session-created artifact 时放行），防止误删已有数据。
9. **Shell 命令行解析器** — 内置 Bash 和 PowerShell 命令解析器，可静态分解复合命令（`|`、`&&`、`;`）、识别重定向、检测动态展开/通配符、区分只读/破坏性命令，覆盖 `find -exec`、`xargs`、`sed -n`、`git 变体`、`npx`/`pnpm dlx` 等 40+ 种命令模式。
10. **凭据/敏感内容检测** — 参数序列化后正则匹配私钥（`BEGIN PRIVATE KEY`）、token 模式（`sk-`、`ghp_`、`xoxb-`、`Bearer` 等）、Shell 敏感读操作（`env`、`printenv`、`Get-ChildItem Env:`、`.env` 文件等）。
11. **安全性分类器输入净化** — 传送给外部 classifier 前自动截断、脱敏 API key/secret/token/password，移除 bulk content（只保留长度标记），限制递归深度和数组长度。
12. **浏览器端 UI 增强** — Client bundle 注入防盾图标（SVG mask）标记 Auto 权限行和触发按钮；首次选中 Auto 时弹出风险确认对话框（中英文，需勾选 "我已了解风险" 后才可确认）；通过 `MutationObserver` 监控 DOM 变化自动应用图标装饰。

## 兼容与依赖

### package.json 关键依赖

| 类型 | 包名 | 版本 | 说明 |
|------|------|------|------|
| runtime | `@deepseek-ai/schemastery` | ^3.18.1 | 配置 schema 校验 |
| peer | `@deepseek-ai/cordis` | ^4.0.1 | 插件框架核心（可选） |
| peer | `@deepseek-ai/dsh-llm` | ^0.1.0-rc.6 | LLM 服务（可选，用于原生 classifier） |
| peer | `@deepseek-ai/dsh-permission-presets` | ^0.1.0-rc.6 | 权限预设读取（可选） |
| peer | `@deepseek-ai/dsh-tools` | ^0.1.0-rc.6 | 工具管道（可选） |
| peer | `@deepseek-ai/dsh-user-approval` | ^0.1.0-rc.6 | 用户审批钩子（可选） |

所有 peerDependencies 均为 optional，允许插件在半独立环境下使用核心 API。

### Host / Client 形态

- **Host 端**：`./lib/index.js` — 主逻辑，注册 `name = 'auto-permission-mode'`，注入 `['tools', 'llm']` 服务
- **Client 端**：`./client` 导出 — 浏览器端 UI 兼容层，通过 `./lib/client.js`（bundle 打包入口）提供，零外部依赖（仅 `document` API）
- **Platform**：`web`（`dsh.client.platform = "web"`）

### 注册点（从源码提炼）

| 注册点 | 具体行为 | 源码位置 |
|--------|----------|----------|
| `ctx.inject` | 声明依赖 `['tools', 'llm']` | `lib/index.js` 第 17 行 |
| `ctx.slots.inject` | 不直接注册 slot；通过 `systemPrompt` 服务注入 Agent 引导文本 | `lib/index.js` 第 159-167 行 |
| `ctx.tools.guard` | 注册单调工具守卫，对所有工具调用执行硬拒绝检查 | `lib/index.js` 第 168 行 |
| `ctx.on('tools/pre-execute')` | 工具执行前钩子：硬拒绝 → 确定性评估 → 沙箱提权 → 分类器审查 → 返回 allow/deny/ask | `lib/index.js` 第 169-253 行 |
| `ctx.on('approval/request')` | 审批请求钩子：消费沙箱提权的 AutoApprovalGrants，以 `prepend: true` 优先处理 | `lib/index.js` 第 254-257 行 |
| `ctx.on('tools/result')` | 工具结果钩子：清理过期 grant、结算 ArtifactRegistry | `lib/index.js` 第 258-265 行 |
| Client `ctx.effect` | 安装 `installAutoPermissionIcon`，注入 SVG 图标 CSS 和风险确认对话框 | `lib/client/index.js` 第 6 行 |

### 需要的 DSH 服务

- `tools` — 工具管道（注册 guard 和 pre-execute/result 事件）
- `llm` — 原生分类器用（`createDshClassifier` 复用 `ctx.llm.stream()`）
- `systemPrompt` — Agent 系统提示注入（`AUTO_MODE_AGENT_GUIDANCE`）
- `agents` — 子代理权限追溯（`ctx.get('agents')?.get(sessionId)`）
- `approval` — 用户审批钩子（可选，沙箱提权时使用）

### 与整合包其它子插件的关系

- 在 ventus-plugins 聚合包中通过 `ctx.plugin(require('@nanmicoder/dsh-auto-mode'))` 挂载，配置为空对象 `{}`
- 与其它子插件（better-sidebar、deepseek-usage、theme-endfield 等）**无直接依赖**，相互独立
- 仅通过 DSH 共享服务（tools、systemPrompt 等）间接交互
- 权限预设段（`permission.presets`）由聚合包的 `cordis.patch.yml` 统一提供，包含 read-only / workspace-write / auto / danger-full-access 四项，auto 为扩展项

## 功能适配细节

### 整合包集成方式

- **Host 聚合挂载**：`lib/index.js` 的 `subConfigs['@nanmicoder/dsh-auto-mode'] = {}`（空配置，使用全部默认值）
- **Client bundle 内嵌**：client 逻辑已打包进 `lib/client.js`，随聚合包一起加载
- **权限预设**：`cordis.patch.yml` 的 `permission.presets` 段包含 auto 项，确保权限选择器中出现 Auto 选项
- **非可选**：auto-mode 在聚合包中为必装（非 conditional），随 ventus-plugins 启用即加载

### 配置项与键名

以下配置项由 `Config` schema 定义（`@deepseek-ai/schemastery`），完整列表：

| 配置键 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `presetName` | `string` | `'auto'` | 触发的权限预设名 |
| `workspaceRoot` | `string` | — | 工作区根目录覆盖 |
| `dshHome` | `string` | — | DSH_HOME 路径覆盖 |
| `tempRoots` | `string[]` | os.tmpdir() | 临时目录列表 |
| `classifierEndpoint` | `string` | — | HTTP 分类器端点（空则用原生 DSH classifier） |
| `classifierProvider` | `string` | — | 分类器 provider（与 model 必须同时设置） |
| `classifierModel` | `string` | — | 分类器模型名（如 `'deepseek-chat'`） |
| `classifierApiKeyEnv` | `string` | `'DEEPSEEK_API_KEY'` | 从环境变量读取 API key 的变量名 |
| `classifierTimeoutMs` | `number` | `30000` | 分类器超时（100-60000ms） |
| `classifierMaxOutputTokens` | `number` | `1024` | 分类器最大输出 token（64-4096） |

**无 localStorage 键**：本插件不读写 localStorage，配置完全通过 Cordis 配置系统注入。

### 已知限制、注意事项与踩坑记录

1. **Windows 文件沙箱边界是 partial** — `AUTO_MODE_AGENT_GUIDANCE` 和风险确认对话框均明确说明 Windows 的文件系统沙箱边界是部分性的（"Windows enforcement is partial"），在 Win32 上 classifier 对宽泛提权请求应尤其严格（源码 classifier.js 的 system prompt 第 5 条）。
2. **子代理不可提权** — 子代理的 `sandbox_permissions` 请求会被硬拒绝（"subagent cannot widen the parent workspace sandbox"），需要子代理向父代理报告阻塞操作。
3. **shell 解析器限制** — 遇以下结构返回 `opaque`（无法静态分解）：命令替换（`$(...)`、反引号）、here-document（`<<`）、shell 分组/大括号展开（`(){}`）、未配对的引号、PowerShell cmd 变量（`%VAR%`）。opaque 命令仍可在沙箱内运行，但破坏性操作会被拒绝（需重写为可见字面量目标）。
4. **全局路径解析** — `normalizePath` 在 Windows 上会将路径转为小写并去除尾部空格点，在 macOS 上将 `/tmp`/`/var`/`/etc` 规范化为 `/private` 前缀。跨平台路径风格自动检测。
5. **分类器故障容错** — 每个会话连续 3 次 classifier 失败后降级为 `ask`（弹窗询问用户），而非继续 deny。单次失败直接 deny。
6. **分类器输入净化** — 工具参数传递给外部 classifier 前会经过 `sanitizeClassifierArguments`：脱敏密钥字段、移除 bulk content（替换为 `[redacted-key:N-chars]`）、限制数组 25 项、递归深度 3 层。`trustedUserMessages` 只取最近 4 条用户消息，每条截断 1000 字符。
7. **ArtifactRegistry 依赖于文件系统 inode** — 通过 `dev:ino:birthtimeMs:kind` 四元组识别文件，跨重命名/移动后 identity 变化，不再被视为同一产物。对大规模目录扫描限制 50000 条路径。
8. **权限预设继承** — 若用户切换至其他预设（如 read-only），Auto 策略自动失效（`isAutoPermissionExecution` 检查 `effectivePermissionPreset(events)`）。切回 auto 后恢复。
9. **DSH 版本升级关注点**：依赖 `@deepseek-ai/dsh-permission-presets` 的 `effectivePermissionPreset` 函数签名、`@deepseek-ai/dsh-tools` 的 `ToolExecution` 类型、`@deepseek-ai/dsh-user-approval` 的 `ApprovalRequest` 接口。若 DSH 重构 tool pipeline 的 pre-execute 钩子回调签名或 approval 流程，auto-mode 的 `tools/pre-execute` 和 `approval/request` 监听器需同步更新。
10. **`cordis.patch.yml` 的 presets 段必须完整重述** — 官方默认 3 项（read-only / workspace-write / danger-full-access）必须与 auto 扩展项一起打包，否则选择器只显示 auto 一项。整合包已处理此问题。