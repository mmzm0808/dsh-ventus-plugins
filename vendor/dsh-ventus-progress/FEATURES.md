# 子代理进度（dsh-ventus-progress）— 整合包内功能说明

> 本文件面向整合包（dsh-ventus-plugins）使用者与后续 DSH 升级迭代者，内容全部提炼自
> 插件源码（src/）、README、package.json、schema 与 skill，无任何编造。

## 功能描述

**一句话定位**：解析子代理会话中 AI 输出的 `progress-json` 进度模型，在 Web 客户端子代理
下拉列表条目上以悬停浮窗方式展示分段进度条、总百分比与当前任务文字（专为视频生成、
TTS 等多阶段任务设计）。

**核心功能清单**（对应源码各模块）：

1. **progress-json 协议解析**（`src/host/parser.ts`）
   - 用围栏正则 `/```progress-json ... ```/g` 从 assistant 文本中提取进度模型；
   - 对每个围栏块做 JSON 解析 + 结构校验，取第一个合法块，非法 JSON 块自动跳过继续找；
   - 归一化（`normalizeProgress` / `normalizeStages`）：`taskId` 必须为非空字符串，`stages`
     必须非空；`taskName` 截断到 40 字符、`currentText` 截断到 80 字符、阶段 `label` 截断到
     12 字符；`percent`/`subPercent` 收敛到 0–100、`weight` 收敛到 1–100；阶段最多取 12 个；
     `status` 只认 `pending/running/completed/failed`，非法值回退为 `pending`；
   - `extractFromMessage` 从消息 content 数组中只拼合 `type === 'text'` 块。

2. **按子代理存储进度**（`src/host/store.ts`，`ProgressStore`）
   - 以 `subagentId` 为键的内存 Map，`set()` 覆盖最新上报，保留 `parseErrors` 计数；
   - `markParseError()` 在解析失败时累计错误数并刷新时间戳（仅对已存在条目生效）；
   - `list()` 输出「未过期条目」：`finished` 的条目永久保留，未完成的仅保留在
     `fallbackTimeoutMs` 之内，按 `updatedAt` 倒序返回；
   - `expire()` 周期性清理超时未更新的非完成条目；`clear()` 作为 HMR/重启兜底全清。

3. **HTTP 查询接口**（host 通过 `ctx.webServer.register` 注册）
   - `GET /api/ventus-progress/list`：返回 `{ ok: true, entries: [...] }`，`entries` 为
     `ProgressListEntry[]`（含 `subagentId/taskId/taskName/percent/currentText/finished/
     stages/updatedAt`）；非 GET 返回 405；响应带 `cache-control: no-store`。

4. **子代理消息监听**（host `apply`）
   - 监听 `session/event`，仅处理 `event.type === 'assistant/message'` 且
     `session.header?.origin === 'subagent'` 的子代理会话消息，主会话不参与；
   - 解析成功则 `store.set()`，失败则 `store.markParseError()`。

5. **自动 skill 安装**（host `installSkill`）
   - 首次启动把自带 `skills/ventus-progress/SKILL.md` 复制到
     `$DSH_HOME/skills/ventus-progress/`（`DSH_HOME` 缺失时回退到用户目录下 `.dsh`）；
   - 幂等：目标文件已存在则跳过，不覆盖用户修改过的版本；
   - skill 内容：定义输出时机（任务开始、每阶段状态变化、或无法精确判断时每 10–20 秒估算
     一次）、字段说明、约束（不虚构阶段、label 要短、percent 连续变化）与视频生成示例
     （分句/TTS/视频生成/合成四阶段）。

6. **客户端悬停浮窗**（`src/client/hover.ts`，`mountProgressHover`）
   - 纯 DOM 实现，挂在 `document` 上的 `mouseover/mouseout` 事件委托（捕获阶段）；
   - 只认「子代理目录树」：`[role="treeitem"]` 且其祖先 `[role="tree"]` 的 `aria-label`
     包含「子代理」或 `subagent`（即 SubagentCatalogAction 的下拉树），避免浮窗散落到左侧
     会话树；
   - 悬停 200ms 后显示 `vp-hover` 浮窗（`position:fixed; z-index:6000`），右侧贴条目显示，
     越界自动换到左侧；`pointer-events:none` 不挡鼠标；
   - 有进度渲染分段条 + 完成标记，无进度显示「当前子代理尚无进度任务」；
   - 模糊匹配：以 treeitem 的 `aria-label` 与 `taskName`/`currentText` 互相包含为准；
   - 每 2 秒轮询一次 `/api/ventus-progress/list`。

7. **React 组件**（`src/client/components/`，随 client bundle 内嵌，供浮窗复用渲染）
   - `SegmentedBar`：分段条，每段宽度 = `weight/总权重`，`role="progressbar"`，状态颜色
     通过 `vp-seg-{status}` 类区分，悬停 title 显示「label · status · subPercent%」；
   - `ProgressPanel`：条目列表，空态显示「暂无子代理进度」，每项含任务名（缺省回退到
     `subagentId`）、四舍五入百分比、完成徽标「完成」、分段条与当前任务文字；
   - `useProgress`：每 2 秒轮询接口的 React hook，带 `inflight` 防重入。

8. **客户端样式注入**（`src/client/index.ts`，`injectStyles`）
   - 以 `id='ventus-progress-styles'` 幂等注入 `<style>`，`dataset.plugin` 标记为
     `@dsh-external/dsh-ventus-progress`；
   - 样式全部走 DSH 设计令牌（`--dsw-alias-state-business-primary` 完成/蓝、
     `--dsw-alias-state-danger` 失败/红、`--dsw-alias-state-success` 完成徽标/绿、
     `--dsw-alias-bg-module-hover` pending、`--dsw-alias-label-*` 文字层级等）；
   - running 段有 1.6s 的 `vp-pulse` 呼吸闪烁动画，便于识别进行中阶段。

## 兼容与依赖

### package.json 关键依赖（peerDependencies，版本均 `^0.1.0-rc.6`）
- `@deepseek-ai/dsh-client-runtime`
- `@deepseek-ai/dsh-client-ui-slots`
- `@deepseek-ai/dsh-host-webserver`（host 侧注入的 webServer 服务来源）
- `react` / `react-dom`（`^18.2.0`，客户端组件用）
- `schemastery`（`^3.18.0`，配置 schema 用）

### 运行时环境
- `engines.node: ^22.19.0 || >=24.0.0`；`type: module`（ESM）；`packageManager: pnpm@11.7.0`
- 插件版本 `0.1.0`，MIT 协议

### host / client 形态
- **host 半身**：`exports["."]` → `lib/index.js`（`name = 'dsh-ventus-progress'`，
  `inject = ['webServer']`，通过 `apply(ctx, config)` 挂载，无独立 `ctx.slots.inject`）；
- **client 半身**：`exports["./client"]` → `lib/client.js`（`platform: "web"`，
  client 侧 `inject: string[] = []`，不注入任何服务，纯 `apply(ctx)` + `ctx.effect`）；
- `dsh.bundle.patch` → `cordis.patch.yml`：向 bundle 插入 `id: dsh-ventus-progress`、
  `name: 'dsh-ventus-progress'` 条目，随整合包 bundle 打包。

### 注册点汇总（从 src 提炼的真实注册点）
| 类型 | 名称 |
| --- | --- |
| 插件名 | `dsh-ventus-progress` |
| 事件监听 | `ctx.on('session/event')`（过滤 `assistant/message` + `origin === 'subagent'`） |
| HTTP 路由 | `GET /api/ventus-progress/list`（`ctx.webServer.register`，`kind: 'exact'`） |
| 定时任务 | `setInterval(store.expire, cleanupIntervalMs)`，effect 清理 `ventus-progress: cleanup timer` |
| skill 安装 | `$DSH_HOME/skills/ventus-progress/SKILL.md`（回退 `~/.dsh/skills/...`） |
| 客户端 effect | `ventus-progress: hover`（样式注入 + 悬停浮窗挂载） |
| 协议 prompt 常量 | `PROGRESS_PROTOCOL_PROMPT`（定义于 `src/host/prompt.ts`，与 SKILL.md 同源） |

### 需要的 DSH 服务与版本要求
- host 侧强依赖 **webServer** 服务（`@deepseek-ai/dsh-host-webserver`，`^0.1.0-rc.6`），
  无则无法注册 `/api/ventus-progress/list`；
- client 侧依赖 **dsh-client-runtime / dsh-client-ui-slots**（`^0.1.0-rc.6`）与 React 18；
- `session/event`、`assistant/message`、`session.header.origin === 'subagent'` 均为 DSH
  宿主运行时语义，需对应版本支持。

### 与整合包其它子插件的关系
- **独立插件**：不依赖整合包内其它任何子插件，无共享状态；host 由整合包 `lib/index.js`
  通过 `ctx.plugin(require('../vendor/dsh-ventus-progress/lib/index.js'))` 动态挂载；
- **client 独立打包**：client 半身并入整合包 `lib/client.js`（build-client.mjs 聚合），
  与其它子插件 client 同包但互不影响；
- 整合包为其保留空配置（`subConfigs` 无 ventus-progress 条目），走默认配置；
- 与 `dsh-ventus-research` 等科研工作流插件同属整合包但无调用关系；其 skill 目录
  （`ventus-progress`）与其它插件的 skill 并存于 `$DSH_HOME/skills/`。

## 功能适配细节

### 在整合包里的集成方式
- **host 聚合挂载**：`vendor/dsh-ventus-progress/lib/index.js` 由整合包 host 入口逐个
  `ctx.plugin()` 挂载；产物缺失时跳过并打 warning，不拖垮整体（最小安装/选择性更新场景）；
- **client bundle 内嵌**：client 半身经整合包 `lib/client.js` 一并下发，无需单独安装；
- **skill 自动安装**：首次启动复制自带 `SKILL.md` 到 `$DSH_HOME/skills/ventus-progress/`，
  让 AI 按协议主动输出 `progress-json`；skill 缺失会导致 AI 不再自发上报进度（见踩坑记录）；
- 也可按 `README` 方式单独安装：`dsh plugin --profile web add github:mmzm0808/dsh-ventus-progress`。

### 配置项（真实键名与默认值）
| 配置项 | 默认值 | 含义 |
| --- | --- | --- |
| `fallbackTimeoutMs` | `30000`（30 秒） | 非完成进度超过此时长未更新视为过期，进入清理与不返回给 list |
| `cleanupIntervalMs` | `10000`（10 秒） | 周期清理定时器间隔 |

- 配置经整合包 `ctx.plugin(plugin, config)` 注入，缺省用默认值；
- **localStorage 键：无**。客户端不写任何 localStorage，进度数据全部保存在 host 内存的
  `ProgressStore`（Map）中，客户端靠每 2 秒轮询 `/api/ventus-progress/list` 拉取。

### 已知限制与注意事项
1. **内存态、重启即失**：进度存在 host 进程内存中，DSH 重启或 HMR 会清空（`clear()` 即
   为重启兜底）；长任务跨重启无法恢复进度显示。
2. **只跟踪子代理会话**：`origin !== 'subagent'` 的主对话消息一律忽略；且只有
   `assistant/message` 事件，工具调用中间过程本身不产生进度。
3. **README 与源码描述不一致**：README「使用」一节仍写「顶栏『进度』按钮」，但当前 client
   源码注释明确「不再占用顶栏按钮」，改为直接在子代理下拉树条目上悬停浮窗展示。以源码为准。
4. **PROGRESS_PROTOCOL_PROMPT 未被注入**：`src/host/prompt.ts` 导出的协议提示词常量在
   host `apply` 中仅导入未使用（构建产物中已被摇树移除），AI 侧协议引导实际依赖自动安装的
   `SKILL.md`。若 DSH 升级后 skill 不再生效，需回到注入 prompt 的路线。
5. **校验严苛导致不上报**：`taskId` 为空或 `stages` 为空数组时整条进度被丢弃并计入
   `parseErrors`；阶段超过 12 个、label/文字超长会被截断；AI 若只输出裸 JSON 而不带
   `progress-json` 围栏则完全解析不到。
6. **超时即从列表消失**：未完成条目超过 `fallbackTimeoutMs`（默认 30 秒）无更新即被
   `expire()` 清理并从列表消失；长静默阶段的子代理（如长时间无文本输出的渲染等待）需要
   AI 每 10–20 秒补一次估算上报才可保持显示。
7. **悬停交互有严格目标限定**：浮窗只出现在 aria-label 含「子代理」/`subagent` 的
   `[role="tree"]` 下的 `treeitem`；且事件走 `document` 级捕获委托，若未来 DSH 重构目录树
   DOM 结构（role/aria-label 变化），需同步 `inCatalogTree` / `matchEntry` 判定逻辑。
8. **每 2 秒轮询**：hook 与浮窗各持一套 2 秒轮询，多个 client 场景会放大请求频率；接口带
   `no-store`，不适合高并发部署形态。

### 踩坑记录（整合包迭代参考）
- **skill 未安装问题**：整合 vendor 曾缺 `skills` 目录 + `DSH_HOME` 未注入，导致 AI 不按
  协议输出进度。已在两处修复：① vendor 补齐 `skills/ventus-progress/`；② `installSkill`
  增加 `~/.dsh` 回退路径（`process.env.DSH_HOME ?? ~/.dsh`）。
- **顶栏按钮方案已废弃**：早期版本在顶栏放「进度」按钮 + 面板，因占用 UI 空间改为主面板
  子代理下拉树悬停浮窗；升级迭代时勿再回退到顶栏按钮渲染路径。
- **解析容错设计**：解析器按「取第一个合法块、跳过非法块」设计，升级 parser 时保持
  `FENCE.lastIndex` 重置与逐块 try/catch，避免正则全局状态污染。
- **配置默认值兜底**：`apply` 内部用 `config.fallbackTimeoutMs ?? 30000` 等兜底，若整合包
  传入显式 undefined 不会踩默认值问题，但不要传字符串型配置（配置表为数字，且无 schema
  强校验）。
