# 用量监测（dsh-deepseek-usage）— 整合包内功能说明

## 功能描述

**一句话定位**：DeepSeek API 用量监测插件——右侧悬浮球实时显示充值余额与涨价倍率，展开面板展示开放平台真实余额、累计消费、今日消费、API 请求次数、Tokens、分模型用量与模型用量趋势图。全部数据来自 DeepSeek 开放平台私有 API（与官方用量页同源），**不使用本地价格表、不估算消费**。

### 核心功能清单

- **悬浮球**：默认停靠右侧，可按住上下拖动，松手时按指针所在半屏自动吸附左/右侧；实时显示余额与当前用量最多的模型今日 R0 倍率徽标。
- **用量面板**：点击悬浮球从右侧滑出（宽 320–900px 可拖拽调整），展示充值余额、赠金余额、累计消费、累计 Tokens、累计请求数（平台 2026-08-01 起保留）、今日消费 / 请求次数 / Tokens / 模型数、分模型今日用量表（模型 / 请求 / Tokens / 消费）。
- **R0 涨价倍率**：实时计算 `A2 / A1`，A1 为 2026-08-17 前每 Token 平均消费（无历史时用默认值），A2 为 8/17 起每 Token 平均消费；面板展示「累计 R0」「今日 R0」，悬浮球展示今日 R0，逐模型可切换查看。
- **峰谷时刻提示**：悬浮球图标与面板徽标显示「峰 / 谷」——高峰时段为北京时间 9:00–12:00、14:00–18:00，空闲时段半价，周末全天按低谷价。
- **登录机制**：未配置 userToken 时，点面板底部「登录」会打开本地 Chrome / Edge / Brave / Chromium 等 Chromium 内核浏览器登录开放平台，经 CDP 读取并自动保存登录态；登录中每 2s 轮询状态。
- **退出登录**：一键清除本机保存的登录态并复位为未登录状态，便于切换账号。
- **模型用量趋势页**：按小时 / 按天粒度的分模型 Tokens 折线图，支持当天 / 昨天 / 近7天 / 近一个月 / 本周 / 本月范围；数据来源开放平台（总览页）与本地会话日志聚合（趋势页流式加载），缺失桶自动补零保证整段显示。
- **截图**：用 html2canvas-pro 将当前页面（总览 / 趋势）整面板渲染为 PNG 写入剪贴板。
- **会话缓存命中率（v4 补丁）**：host 按每个会话事件 usage 的真实 token 分量计算命中率（两位小数），client 读取官方统计行的「输入 N tok + 缓存命中 P%」，与 host 列表按 (取整命中率, 压缩后 tok) 配对后注入真值，配不上就保留官方原值——消除「恒 .00」伪精度。
- **Ventus 整合包更新管理**：设置页右上角更新徽标（本地版本 vs GitHub 远程版本对比）→ 顶层模态多选安装 / 更新子插件，仅对勾选项执行，未勾选的保持本机旧版。
- **Ventus 设置卡**：Ventus 设置页内一张卡片，提供 4 个偏好开关（启用用量监测、缓存命中两位小数、对话横向宽度不限制、输入框贴底）。
- **DSH 版本号注入**：只要装了本插件，侧边栏 brand 下方自动显示一行 `DSH x.y.z`（数据来自 `/api/deepseek-usage/meta`）。
- **语言修复**：官方 index.html 声明 `lang="en"` 导致 Edge 每次提示翻译，插件 apply 时运行时改回 `zh-CN`。

## 兼容与依赖

### package.json 关键声明

- **peerDependencies**（均为 `^0.1.0-rc.6`）：
  - `@deepseek-ai/cordis` `^4.0.1`
  - `@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-credentials`、`@deepseek-ai/dsh-host-webserver`、`@deepseek-ai/dsh-llm`
- **dependencies**：仅 `html2canvas-pro ^2.3.9`（client 截图用，构建时 onlyBundle 进 bundle）。
- **exports**：`.`（host 入口 `lib/index.js`）、`./client`（浏览器端 `lib/client.js`）、`./cordis.patch.yml`、`./package.json`。

### host / client 双半身形态

- **host 半身**（`src/index.ts`）：插件名 `name = 'deepseek-usage'`（与 patch insert id 对应）；`inject = ['webServer', 'sessions', 'sessionPersistence']`，通过 `ctx.webServer.register(route)` 挂载全部 HTTP 路由。
- **client 半身**（`src/client/index.ts`）：`dsh.client.platform = 'web'`，`dsh.client.inject` 声明 `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-slots`；client 侧 `inject = ['slots']`，用 `ctx.slots.inject(...)` 注册 UI 座席。

### 注册点（slot / 路由 / 服务）

**host 侧路由**（`makeUsageRoutes`，全部 loopback-only + `Cache-Control: no-store`）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/deepseek-usage/state` | 当前快照（余额 / 今日 / R0 / 累计 / error / fetched_at） |
| POST | `/api/deepseek-usage/refresh` | 强制刷新并返回新快照 |
| POST | `/api/deepseek-usage/login/start` | 打开登录浏览器 |
| GET | `/api/deepseek-usage/login/status` | 查询登录态是否产出 userToken |
| POST | `/api/deepseek-usage/logout` | 清除保存的登录态 |
| GET | `/api/deepseek-usage/model-usage` | 本地会话日志聚合的模型用量序列（`start`/`end` 必须 `YYYY-MM-DD`，`granularity=hour|day`，上限 31 天） |
| GET | `/api/deepseek-usage/model-usage/stream` | 同上，NDJSON 流式（`type: snapshot|done|error`），边扫边渐进渲染 |
| GET | `/api/deepseek-usage/model-usage/platform` | 总览页范围数据，走开放平台（与官方看板同源），非本地 session 统计 |
| GET | `/api/deepseek-usage/meta` | 插件元信息（当前 DSH 应用版本 `dshVersion`） |
| GET | `/api/deepseek-usage/session-hits` | 每活跃会话自算缓存命中率（`hit` 真两位小数 + `promptTok` + 官方取整值 `officialPct` + 最新活跃会话值） |
| GET | `/api/deepseek-usage/ventus-update/list` | 整合包更新检查列表（远程提交 / 版本号 / 本地已装子插件清单） |
| POST | `/api/deepseek-usage/ventus-update/apply` | 按勾选执行整合包子插件选择性更新 / 安装（body `{ selected: string[] }`，上限 16KB） |

loopback 校验：远端地址必须是 `127.0.0.1` / `::1`，Host 必须是 `127.0.0.1` / `localhost` / `[::1]`，`sec-fetch-site` 非 cross-site，且 Origin 与 Host 同源。

**client 侧 slot 注册**：

- `ctx.slots.inject('shell.overlay', ...)` → 注册 `shell.overlay`，id `dsh-deepseek-usage`，order 100（悬浮球/面板宿主）。
- `ctx.slots.inject('ventus.settings.item', ...)` → 注册 `ventus.settings.item` 设置卡，order 20。
- 兜底：800ms 后若快照里没有 `ventus.settings.item`（其它 Ventus 插件未提供），自动注入 `settings.section`（id `ventus`，label「Ventus」，children 挂 `ventus.settings.item`）并把 `VentusSettingsPage` 挂进去。

**依赖服务**：`webServer`（路由挂载）、`sessions` + `sessionPersistence`（会话日志聚合与趋势页）、client 侧 `slots`；登录浏览器经 CDP（端口 9333）读写页面 localStorage。

### 与整合包其它子插件的关系

- **dsh-ventus-whale**：共享 `ventus-prefs` 模块（同一模块在两个插件中镜像，任一都能提供行为与设置入口）；whale 的设置卡是 usage 设置卡的样式参照。
- **dsh-theme-endfield**：主题提供 `--edge-accent` / `--edge-radius` 变量，usage 用作强调色与圆角回退（官方主题回落官方 token）。
- **dsh-usage-skill**：同属「用量」分类但分工不同——usage 是实时悬浮球 / 面板监测，usage-skill 是日/月/年热力图与多 Provider 余额卡，两者独立并行。
- **Ventus 设置页**：由先挂载的 Ventus 插件自动创建 `VentusSettingsPage`，后挂载的插件只把设置卡合并进 `ventus.settings.item`；更新徽标（VentusUpdateBadge）挂在设置页右上角。
- **dsh-ventus-plugins 聚合层**：本插件作为 12 个子插件之一被 host 聚合挂载 + client 内嵌进聚合 bundle；其 `ventus-update.ts` 内的 `SUB_PLUGINS` 清单同时驱动聚合包的「选择性安装 / 更新」能力（对其它子插件可见但无硬依赖，`requires` 均空）。

## 功能适配细节

### 整合包内集成方式

- **host 聚合挂载**：`vendor/dsh-deepseek-usage/lib/index.js` 由聚合包 `lib/index.js` 用 `ctx.plugin(plugin, subConfig)` 逐个挂载；子插件自带 name/inject/Config，语义与独立安装一致。
- **client bundle 内嵌**：`vendor/dsh-deepseek-usage/lib/client.js` 被 `scripts/build-client.mjs` 原样内嵌进聚合 `lib/client.js`（子 factory 注册进 `__ModuleLoader__`，聚合 apply 用 `require(id)` materialize 后调用各子 `apply`）。
- **空 patch**：本插件 `cordis.patch.yml` 为空数组，只靠聚合包的 bundles 列表 + insert 行加载，不在包内重复 insert。
- **独立形态**：亦可单独安装（host + client 自带），此时无整合包更新功能（`ventus-update/list` 返回 `bundled: false`）。

### 配置项与 localStorage 键

**host 配置**（`Config`，schemastery 校验）：

| 键 | 默认 | 说明 |
|---|---|---|
| `refreshIntervalMs` | `10000` | 余额/用量刷新间隔，最小 5000ms |
| `platformUserToken` | `''` | 开放平台登录态；仅配置项，绝不写入插件代码 |

userToken 解析优先级：`config.platformUserToken` → 环境变量 `DEEPSEEK_PLATFORM_USER_TOKEN` → profile 的 `cordis.patch.yml` 中 `platformUserToken:` 行 → 数据目录下 `dsh-deepseek-usage/config.json`。登录成功后自动持久化到数据目录 `dsh-deepseek-usage/config.json`（临时文件 + fsync + rename 原子写）。

**client localStorage 键**：

| 键 | 说明 |
|---|---|
| `dsh.ventus.preferences` | Ventus 系列共享偏好（JSON）：`usageEnabled` / `cacheHit2Decimals` / `fluidConversationWidth` / `heroDockBottom` |
| `ventus:prefs` | 偏好变更广播事件（CustomEvent），同 storage 事件双路监听 |
| `dsh-deepseek-usage:panelWidth` | 面板宽度（320–900，读时 clamp） |
| `dsh-deepseek-usage:ballTop` | 悬浮球纵向位置 |
| `dsh-deepseek-usage:ballSide` | 悬浮球吸附侧（`left` / `right`） |
| `dsh.ventus.updateCheck` | 更新检查结果缓存（30 分钟 TTL，避免每次进设置页打 GitHub） |
| `dsh.ventus.localSha` | 本地聚合 bundle 的提交 sha（版本号读不到时兜底对比；更新成功后写远程 sha） |

**环境变量**：`DSH_DEEPSEEK_LOGIN_BROWSER`（指定登录浏览器可执行文件路径）、`DEEPSEEK_PLATFORM_USER_TOKEN`（手动注入登录态）、`DSH_HOME` / `DSH_VERSION`（数据目录与应用版本来源）。

### 数据与安全

- 数据全部来自开放平台私有 API：`/api/v0/users/get_user_summary`、`/api/v0/usage/by_api_key/amount`、`/api/v0/usage/by_api_key/cost`；登录态只保存在本机用户配置目录，不进插件源码或 Git 仓库。
- 登录浏览器使用临时 profile（`--remote-debugging-port=9333` + `--user-data-dir=<临时目录>`），读 token 后即关闭并清理临时目录。
- 所有路由仅本机可访问，响应统一 `Cache-Control: no-store`、`referrer-policy: no-referrer`。

### 已知限制、注意事项、踩坑记录

- **主题清理误删样式**（实测事故）：theme 的幂等清理曾用泛化 `style[data-plugin=...]` 选择器误删 usage 的 `data-dsu-css` style，悬浮球变纯文本。修复：usage 的 `<style>` 显式带 `data-plugin=dsh-deepseek-usage`，任何按插件 id 的清理都不触碰它。
- **Edge 提示翻译**：官方 index.html 声明 `lang="en"`，usage apply 时改回 `zh-CN`（DOM 属性即可，无需改官方源码）。
- **命中率伪精度**：v1–v3 方案（全部同值 / 标题匹配 / 区间反解）均被弃用；v4 必须 host 按会话真实 token 分量计算 + client 官方文本配对，配不上保留官方原值，绝不顶替。client 侧禁止监听 `characterData` mutation（重写文本会自触发死循环、点会话卡死）。
- **平台数据保留期**：开放平台仅保留 2026-08-01 起的用量历史；「累计 Tokens / 请求数」即 8/1 起累计。R0 计算以 2026-08-17 为 cutoff（8/17 起价格调整），无历史时用默认 A1。
- **日期范围上限 31 天**：`model-usage` 系列接口拒绝超过 31 天的范围；hour 粒度按天逐日查询（平台只在单日查询时返回小时桶），多天并发；总览页范围数据必须走开放平台同源接口，不走本地 session 统计，避免与官方看板不一致。
- **模型自动纳入**：分模型选择器与 R0 列表动态从平台返回的用量数据收集（初始种子 `deepseek-v4-flash` / `deepseek-v4-pro`），开放平台新增模型（如视觉模型）无需改代码即自动出现；视觉源 `vision-toolkit-X` / `modlens-X` 归一化为基础 provider 显示。
- **登录浏览器不可用**：找不到 Chromium 内核浏览器时抛错，可设置 `DSH_DEEPSEEK_LOGIN_BROWSER` 显式指定；登录浏览器启动 20s 超时、CDP 读取 10s 超时，均有兜底清理。
- **聚合层注意事项**：聚合 bundle 的 `exports.inject` 用短服务名并集（写包名会永久 pending，留空则子 apply 缺属性注入报错）；各子 bundle 独立 factory 作用域隔离；重建聚合 bundle 用 `STAMP_SHA` 传远程 sha，使更新检查在刷新后自动归零为「已是最新」。
