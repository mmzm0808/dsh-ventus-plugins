# 用量热力图（dsh-usage-skill）— 整合包内功能说明

> 版本依据：`vendor/dsh-usage-skill/package.json`（v0.3.0）与同目录 `lib/` 运行时。
> 上游仓库：`github:statem-li/Kr-DSH` 的 `dsh-usage-skill` 子目录（MIT）。
> 注：源码仓以 `lib/` 作为发布形态（`main: lib/index.js`），本文所有事实均从 `lib/`、`package.json`、`README.md`、`cordis.patch.yml`、`scripts/install.mjs` 提炼，未包含任何凭据与本地绝对路径。

## 功能描述

### 一句话定位
为 DeepSeek Harness 网页端（`dsh web`）提供**多供应商账户监测、Token 用量热力图分析与技能（Skill）包管理**的一体化面板插件：侧边栏底部「用量」入口一张卡片管账户与用量，侧边栏「技能」入口管技能包安装归组。

### 核心功能清单

1. **Token 用量热力图（日/月/年）**
   - 服务端从每个会话的 `assistant/chunk`（`data.chunk.type === "usage"`）或 `assistant/message`（`data.usage`）中提取 **provider 上报的真实 usage**，不做本地估算；相同 `(turn, step)` 的后续样本**替换**旧样本（防重复计数），并按 `provider/model` 归集（如 `deepseek-official · deepseek-chat` 与 `ark · deepseek-chat` 分开统计）。
   - 聚合口径：输入 / 输出 / cacheRead / cacheWrite 四类 Token 分桶；按天（本地日历 `YYYY-MM-DD`）+ 按模型拆分；每桶给出 `tokens` 合计与**缓存命中率**（`cacheRead / (input + cacheRead + cacheWrite)`，百分位 0–100 一位小数，无 prompt token 时为 null）。
   - 界面呈现：月历热图（`MonthHeatmap`）+ 年热图（`YearHeatmap`）；`‹`/`›` 切换月份；点击热图某天看当天的 provider/model 明细（`DayDetail`）；今日 / 本月 / 累计 / 最近 14 天（按本地日历，只显示窗口内有用量的日期，未来时间戳不计入）。
   - 数据来源端点：`GET /api/usage-stats/usage`。

2. **统一账户卡片（一次只显示一个 provider）**
   - 侧边栏「用量/余额」面板顶部「当前供应商」切换；余额型显示余额（含 granted / toppedUp 拆分），Token Plan 型显示分窗口额度（session / weekly / monthly / billing 窗口 + 重置时间）。
   - 支持的供应商与模式（内置默认，无需额外配置即自动发现）：
     | Provider / adapter | 模式 | 默认凭据引用 | 上游接口 |
     | --- | --- | --- | --- |
     | DeepSeek | 余额 | provider `apiKeyEnv`（默认 `DEEPSEEK_API_KEY`） | `/user/balance` |
     | OpenRouter | 余额 | `OPENROUTER_MANAGEMENT_KEY` | `/api/v1/credits` |
     | Moonshot / Kimi API | 余额 | provider `apiKeyEnv` | `/v1/users/me/balance` |
     | OpenCode Go | 订阅 | `OPENCODE_GO_API_KEY` 或本地 `auth.json` | `/zen/go/v1/usage` |
     | Z.ai / 智谱 | 订阅 | `ZAI_API_KEY`（可选 `ZAI_API_REGION`） | Coding Plan quota/subscription |
     | Kimi For Coding | 订阅 | `KIMI_API_KEY` | `/coding/v1/usages` |
     | MiniMax Coding Plan | 订阅 | `MINIMAX_API_KEY`（可选 `MINIMAX_API_REGION`） | `/v1/token_plan/remains` |
     | New API | 余额 | provider 推理 Token | `/api/usage/token/` |
     | Sub2API / Passion | 自动判别 | provider `apiKeyEnv` | `/v1/usage` |
     | General / Declarative | 余额或订阅 | 配置中的 credential ref | 受限 GET + JSON Pointer |
   - 没有公开账户接口的供应商（Volcano Ark、OpenAI、Anthropic 等）仍正常统计 Token，账户卡片明确显示「不支持」，不猜余额。
   - 阈值预警：余额绝对值可用 `warning.warnBelow / criticalBelow`；有总额度的余额与 Token Plan 自动产出 `normal / warning / critical` 剩余比例状态（默认 30% / 10%）。
   - 数据来源端点：`GET /api/usage-stats/account?provider=<id>[&refresh=1]`（`refresh=1` 强制上游刷新），兼容 `GET /api/usage-stats/balance?provider=<id>` 与 `GET /api/usage-stats/subscriptions`。

3. **技能包（Bundle）管理**
   - 侧边栏「技能」入口（`SkillManagerPanel`）：新建 / 重命名 / 删除技能包、拖拽安装 Skill（zip 归档或文件夹文件列表）、散装技能列表、把散装技能归入 Bundle、删除技能、技能文件查看器（读取任意技能文件并预览）。
   - 安装的 zip 校验：必须有 `SKILL.md`，压缩方法限 store/deflate，≤2000 个条目、总量 ≤200 MiB，自动解压写入；技能名限小写字母数字连字符（`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`），最长 64 字符。
   - 技能来源目录：`DSH_AGENTS_HOME`（默认 `~/.agents`）`/skills` 与 `DSH_HOME`（默认 `~/.dsh`）`/skills` 两个根都扫描；Bundle 账本存在前者下的 `.bundles.json`（version 1）。
   - 数据来源端点：`/api/skill-manager/*`（见下）。

4. **后台监测**
   - 服务端启动即刷新一次，之后每 **5 分钟**（`ACCOUNT_REFRESH_MS = 300000`）后台刷新全部已配置账户 + 本地 Token 聚合，与面板是否打开无关；浏览器只请求当前选中的 provider。手动刷新会更新用量、供应商列表并强制刷新当前账户，不会批量强制请求其他供应商。
   - 账户服务带**单供应商 single-flight** 与内存缓存（`configKey` 变化或超龄才回源），临时故障时保留上次成功数据并标记 `stale: true`。

5. **本机安全边界**
   - 五个 `/api/usage-stats/*` 端点 + 全部 `/api/skill-manager/*` 端点仅接受**回环请求**（校验 peer socket 地址，IPv4-mapped IPv6 归一化；Host 头仅作附加校验），非回环一律 `403`，非 GET 一律 `405`，响应均带 `Cache-Control: no-cache`。
   - 凭据只在服务端解析，不进入浏览器响应 / 插件缓存 / 日志；发给上游前校验域名的全部 IPv4/IPv6 解析结果并**固定连接地址**（防 DNS rebinding 绕过私网限制），body 上限 1 MiB，手动处理 redirect。
   - 技能包端点（`/api/skill-manager`）另有请求体上限 4 MiB、路径穿越防护（`resolveSkillFile` 阻止 `..` 逃逸）。

6. **增量聚合引擎**（`lib/usage.js` + `lib/index.js` 的 `collectUsage`）
   - 每个会话的 per-day/per-model 折叠状态缓存在内存并持久化到 `<DSH_HOME>/storages/usage-stats-cache.json`（`CACHE_VERSION = 3`）；每次只处理上次折叠后**新追加**的事件，稳态成本 O(新事件)。
   - 活跃会话只处理追加事件；持久化会话用后端不透明 revision（`sessionPersistence.listSnapshots`）避免重复读日志；seq 缺口 / 日志重写 / live↔persisted 切换时对该会话**完整重折叠**。
   - 聚合采用 single-flight（`withLock`），缓存原子写（temp + rename）且写在同一临界区内。
   - 开发校验：`npm run validate:live` 逐会话比对 raw artifact、`session.history`、插件端点与官方 token projection，缺文件或不一致返回非零。

## 兼容与依赖

### package.json 关键字段
- `name: dsh-usage-skill`，`version: 0.3.0`，`private: true`，`license: MIT`，`type: module`。
- `main: lib/index.js`；`exports` 暴露 `"."`、`"./client"`（`lib/client.js`）、`"./usage"`（`lib/usage.js` 纯聚合逻辑，供离线测试/校验）与 `"./package.json"`。
- `bin`：`dsh-usage-skill-install` → `scripts/install.mjs`（兼容安装器，`npx` 路径）。
- `dependencies` / `peerDependencies`：**均为空**。服务端零第三方运行时依赖（只用 Node 内置 `http/https/dns/fs/zlib` 等）；客户端在 `devDependencies` 里声明 `react ^18.2.0` / `react-dom ^18.2.0`（构建期用）。运行时通过 DSH 平台注入 `@deepseek-ai/dsh-client-*` 模块。
- `dsh.client.platform = "web"`；`dsh.client.inject` 声明三个客户端模块：
  - `@deepseek-ai/dsh-client-locale`（字典注册）
  - `@deepseek-ai/dsh-client-runtime`
  - `@deepseek-ai/dsh-client-ui-primitives`
- `dsh.bundle.patch = ./cordis.patch.yml`（作为 profile bundle 注册时启用服务端插件的 insert 行）。

### host / client 形态
- **host 半身（服务端 Cordis 插件）**：`lib/index.js` 是主插件（`export { name, inject, Config, apply }`），`name = "usage-stats"`，`inject = ["webServer", "credentials", "sessions", "sessionPersistence", "settings", "llm"]`；另把 `lib/skills-host.js`（合并自 `dsh-skill-manager`，`name = "skill-manager"`，`inject = ["webServer"]`）通过 `applySkills(ctx)` 一并挂载。
- **client bundle**：`lib/client.js` 是 web 平台客户端，内含 `UsageStatsPanel`（用量+余额面板）与 `SkillManagerPanel`（技能面板）两个 React 组件 + 中英文字典。
- **无独立 platform 服务端注册**——server 半身按标准 Cordis 插件语义被 DSH 加载。

### 注册点（从 `lib/` 提炼的真实注册点）
- **HTTP 路由**（`ctx.webServer.register`）：
  - `kind: "exact"`（精确路由，可压过 connection 插件的 `/api` 前缀处理）：
    - `GET /api/usage-stats/usage`
    - `GET /api/usage-stats/providers`
    - `GET /api/usage-stats/account`（query：`provider`，可带 `refresh=1`）
    - `GET /api/usage-stats/balance`（0.1.x 兼容）
    - `GET /api/usage-stats/subscriptions`（0.1.x 兼容）
  - `kind: "prefix"`：`/api/skill-manager` 路由表：
    - `GET /api/skill-manager/list` — 全部技能（bundles + loose 快照）
    - `POST /api/skill-manager/bundles` — 新建 Bundle
    - `PATCH /api/skill-manager/bundles/:id` — 重命名 Bundle
    - `DELETE /api/skill-manager/bundles/:id` — 删除 Bundle（技能转散装）
    - `PUT /api/skill-manager/bundles/:id/skills` — 整组替换 Bundle 内技能
    - `POST /api/skill-manager/skills` — 安装技能（zip base64 归档或文件列表）
    - `DELETE /api/skill-manager/skills/:name` — 删除技能（递归删目录）
    - `GET /api/skill-manager/skills/:name/files/:path` — 读取技能内文件内容
- **服务端 slot**：无（面板不占用 slot，纯路由提供数据）。
- **客户端 slot**：`ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({ name: "sidebar.footer.action", id: "usage-stats", locale: "usageStats", order: 10 }, UsageStatsPanel))` —— 侧边栏底部「用量」+「技能」两个入口共用这一个 action 注册。
- **客户端字典**：`ctx.locale.register("usageStats", { zh, en })`（NS = `usageStats`）。
- **后台任务**：`startBackgroundRefresh` 每 5 分钟跑 `accounts.refreshAll()` + `collectUsage(ctx)`（timer `unref()`，`stop.refreshNow()` 支持立即触发）。
- **Config 校验**：`Config["~standard"]`（version 1，vendor `dsh-usage-skill`）→ `validateAccountConfig`，路由与 timer 注册前先 `await accounts.validate()` 校验 provider id。

### 需要的 DSH 服务与版本
- 版本要求：`@deepseek-ai/dsh >= 0.1.0-rc.6`（web profile）；客户端模块走 `rc.6` 线。
- 依赖的 DSH 服务（host inject）：`webServer`（路由）、`credentials`（凭据 seam，`credentials.resolve(ref)`）、`sessions`（活跃会话）、`sessionPersistence`（持久化会话 + `listSnapshots` revision）、`settings`（`llm-deepseek` / `llm-pi-ai` 命名空间读 provider 配置）、`llm`。
- 客户端依赖（`exports.inject`）：`slots`、`locale`；bundle 层面还 import `@deepseek-ai/dsh-client-runtime` / `dsh-client-ui-primitives`。

### 与整合包其它子插件的关系
- **自包含独立**：`vendor/` 内嵌完整运行时，无外部插件依赖；被 `dsh-ventus-plugins` host 聚合。
- **与 `dsh-deepseek-usage` 功能重叠**：两者都做用量/余额监测。整合包以 `dsh-deepseek-usage`（悬浮球，已挂载）为主入口；`dsh-usage-skill` 的侧边栏入口在整合包内**被禁用**（见「功能适配细节」），其热力图面板在整合包 UI 中不可达。
- **服务端当前不挂载**：整合包 host（`dsh-ventus-plugins/lib/index.js`）的 `SUB_ENTRIES` 列表**不包含** `dsh-usage-skill`，因此 `dsh-usage-skill` 的服务端路由（`/api/usage-stats/*`、`/api/skill-manager/*`）在整合包形态下**未注册、不生效**。
- **client 已内嵌但入口关闭**：整合包合并 bundle（`lib/client.js`）内嵌了 `dsh-usage-skill` 的 client 入口（id `dsh-usage-skill`），其 `apply()` 只执行字典注册；`sidebar.footer.action` 的 slot 注入被 `if (false)` 关闭。
- **与官方「技能」按钮的关系**：插件原生注册的 `sidebar.footer.action` 会渲染「用量/余额」与「技能」两个按钮，与官方侧边栏「技能」按钮功能重复——这是整合时禁用该 slot 的直接原因（用户要求侧边栏只保留官方的工作台/技能/记忆三按钮）。

## 功能适配细节

### 整合包内的集成方式
- **vendor 形态**：`vendor/dsh-usage-skill/` 含 `package.json` + `lib/`（完整运行时）+ `cordis.patch.yml`（`- insert: - id: usage-skill / name: dsh-usage-skill`）。服务端由 host 按需 `ctx.plugin` 挂载——当前 host 未挂载，属「可选/暂存」集成；若将来启用，把 `lib/index.js` 加入 host 的 `SUB_ENTRIES` 并保证 `inject` 服务（webServer/credentials/sessions/sessionPersistence/settings/llm）存在即可。
- **client 内嵌定制**：vendor 的 `lib/client.js` 与上游源码**唯一差异**是 slot 注册被 `if (false)` 包裹并附注释（字典保留、组件保留导出、不挂载入口），由整合包的 `scripts/build-client.mjs` 原样内嵌进合并 bundle。
- **独立安装路径**（非整合包）仍可用：`dsh plugin --profile web add "github:statem-li/Kr-DSH/tree/main/dsh-usage-skill"`，或 `npx --yes github:statem-li/Kr-DSH/tree/main/dsh-usage-skill`（含 `--check` / `--dry-run` / `--no-enable` 参数）。

### 配置项（Cordis config → `validateAccountConfig`）
配置挂在既有 `dsh-usage-skill` Cordis entry 的 `config` 下（**不要追加第二个插件 entry**），结构为：

```yaml
config:
  monitors:
    <harness-provider-id>:        # 必须是 Harness 真实存在的 provider id
      adapter: <adapter-id>       # 见下方列表
      credentialRef: <YAML 键名>   # 可选，覆盖默认凭据引用
      usageBaseURL: <https URL>   # 可选，覆盖 provider baseURL；禁含内嵌账号密码
      allowInsecure: false        # 可选，允许 http（默认必须 HTTPS）
      allowCrossOrigin: false     # 可选，允许跨源
      allowPrivateNetwork: false  # 可选，允许解析到私网（默认拒绝）
      warning: { warnBelow: 5, criticalBelow: 1 }
      fallbackCredentialRef: ...  # 仅 New API 旧实例 /api/user/self 回退用
      fallbackUserIdRef: ...      # 可选，New API 旧实例 User ID
      region: ...                 # Token Plan 供应商区域覆盖
      request: { path, method: GET, auth: { type, credentialRef }, headers }
      extract: { root, valid, remaining, used, total, currency, ... }  # 仅 declarative
```

- **adapter 完整列表（12 个）**：`deepseek-balance`、`openrouter-balance`、`moonshot-balance`、`zai-balance`、`general`、`new-api`、`sub2api`、`opencode-go`、`zai-token-plan`、`kimi-token-plan`、`minimax-token-plan`、`declarative`。未知 provider / adapter / 非法映射会在路由和 timer 注册前阻止插件启动。
- **凭据引用（`.credentials.yaml` 键名，服务端解析，不外传）**：`DEEPSEEK_API_KEY`、`OPENROUTER_MANAGEMENT_KEY`（余额必须用管理 Key，非推理 Key）、`OPENCODE_GO_API_KEY` / `OPENCODE_GO_AUTH_COOKIE` / `OPENCODE_GO_WORKSPACE_ID`、`ZAI_API_KEY` / `ZAI_API_REGION`（中国区 `bigmodel-cn`）、`KIMI_API_KEY`、`MINIMAX_API_KEY` / `MINIMAX_API_REGION`（中国区 `cn`）。
- **持久化键/文件**：
  - 用量缓存：`<DSH_HOME>/storages/usage-stats-cache.json`（只存聚合 Token、会话 id、不透明 revision、折叠游标；不存提示词/回复/文件路径）。
  - 技能目录：`~/.agents/skills`（managed root，`DSH_AGENTS_HOME` 可覆盖）与 `~/.dsh/skills`（`DSH_HOME` 可覆盖）；Bundle 账本 `.bundles.json`。
- **localStorage 键**：**无**。客户端不写任何 localStorage / sessionStorage，面板状态（当前 provider、月份、明细）均为内存态，每次打开/切换都从服务端接口实时拉取（并带请求序号竞态保护，`createLoader` + `isCurrent(seq)`）。

### 已知限制、注意事项、踩坑记录（供升级迭代参考）
1. **回环唯一性**：所有端点严格回环（peer socket + Host 双重校验）。本机反向代理会让插件看到代理自身的回环地址；不要经反向代理暴露到局域网/公网，确需代理须在代理层加认证。
2. **OpenRouter 例外**：余额要 `OPENROUTER_MANAGEMENT_KEY`，普通推理 Key 的 `/api/v1/key` 只描述单个 Key 的 spending limit，不会被当作账户余额；未配置时显示「未配置」，不会拿推理 Key 试探。
3. **OpenCode Go 不稳**：Bearer usage endpoint 目前不是公开 API，可能随上游变化；Cookie 等同登录凭据，不应进日志或 issue。凭据尝试顺序：Harness credential → `~/.local/share/opencode/auth.json` → 显式 Cookie + workspace 回退。
4. **New API 回退**：只有 `/api/usage/token/` 返回 404/405 且配置了独立管理 PAT 才 fallback 到 `/api/user/self`；推理 Token 不会被当管理凭据。`/api/status` 的 `quota_per_unit` 用于把额度换算成余额，旧实例缺字段时按 500000 回退。
5. **Sub2API 自动判别**：provider id 为 `passion` 或域名为 `*.passionapi.com` 自动识别；钱包响应显示余额，`quota_limited` 或含 `subscription` 的响应自动切换为额度窗口。
6. **Declarative 受限能力**：只支持受限 GET + JSON Pointer（RFC 6901），**不执行 JavaScript**；request.path 必须 `/` 开头的相对路径；敏感 header（authorization/api-key/cookie/host 等）禁止在配置中覆盖。
7. **版本不一致**：`package.json` 已是 `0.3.0`，但 README「兼容性与致谢」章节仍写「当前版本为 0.2.0」——查版本以 `package.json` 为准。
8. **Cordis entry id 两处不一致**：仓库 `cordis.patch.yml` 的 insert id 是 `usage-skill`，而 `scripts/install.mjs` 写入的 patchBlock 是 `id: usage-stats`；README 的 monitor 配置示例也用 `id: usage-stats`。手工合并配置时确认实际 entry id，避免与既有 entry 重复。
9. **整合包专属踩坑**：
   - `sidebar.footer.action` 与官方「技能」按钮重复 → 已在 vendor client 中 `if (false)` 禁用（字典保留，组件导出保留）。
   - 主题插件（`dsh-theme-endfield`）幂等清理曾用 `style[data-plugin=...]` 泛化选择器误删本插件样式（`data-dsu-css`）；本插件运行时 style 一律带 `data-plugin=dsh-usage-skill` 标记。
   - 若未来把服务端挂回 host，需同时确认 `dsh-deepseek-usage` 的用量轮询与本插件的 `/api/usage-stats` 后台刷新不会重复打官方接口（两者都做后台轮询）。
10. **升级注意**：插件依赖 Harness 客户端模块加载器、Cordis 服务与 session persistence；Harness 预发布接口（`sessionPersistence.listSnapshots`、settings 命名空间结构、client inject 模块）变化时需同步适配。测试全离线（`npm test`），真实数据校验跑 `npm run validate:live` 与 `node scripts/check-balance.mjs`（后者会打印真实余额，勿外发）。
11. **安全边界细节**：自定义 monitor 默认要求 HTTPS、同源相对路径、手动 redirect、JSON 响应、body ≤1 MiB；`usageBaseURL` 禁止内嵌 username/password，`Authorization` 等 header 必须由 credential ref 注入；发凭据前校验域名全部 IPv4/IPv6 解析结果并固定连接地址（防 DNS rebinding 私网绕过）；支持 IPv4、IPv4-mapped IPv6 与 `[::1]:port`。
