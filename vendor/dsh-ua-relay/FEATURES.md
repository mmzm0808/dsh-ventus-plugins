# UA 中继（dsh-ua-relay）— 整合包内功能说明

> 本文件基于插件实际源码（`lib/index.mjs`）、`package.json`、`cordis.patch.yml`
> 及整合包 `dsh-ventus-plugins` 的挂载方式整理，全部信息来自真实实现，无虚构。

## 功能描述

### 一句话定位
UA 重写反向中继：DSH 里所有 provider 请求都被适配器强制加上 `deepseek-harness/…`
归因 User-Agent，部分网关（如 B.AI / api.bankofai.io）会拒绝该 UA 导致
"API key is invalid / Connection error"；本插件在 DSH 自带的 web 服务器上开放一条
反代路由，把每个 provider 的流量转发到其目标 baseURL，并在转发时改写为浏览器 UA，
从而绕开网关的 UA 拦截。

### 核心功能清单
- **HTTP 反代路由**：在 DSH web 服务器注册前缀路由 `/api/ua-relay/<key>/<rest>`，
  按配置 `targets[<key>]` 将请求透明转发到目标网关（`targets[<key>] + /<rest>`）。
- **UA 重写**：转发时强制把 `User-Agent` 头替换为默认浏览器 UA
  （`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36`），
  也可通过配置项 `userAgent` 覆盖。
- **多目标映射**：`targets` 是一个 `{ <key>: 'https://base-url' }` 对象，可同时
  给多个被 UA 拦截的服务商开中继，每个服务商一个独立 key。
- **请求透传**：保留原始 HTTP 方法、路径、查询串、`Authorization` 等请求头，
  请求体原样流转（`req.pipe(forward)`），因此普通请求与流式（SSE）都能工作。
- **Header 修正**：转发时剔除 `host` 与 `connection`，`host` 改写为上游目标主机，
  避免反代常见的 Host 头污染；`connection` 交给 `node:https` 重新管理。
- **错误处理**：未知 provider key 返回 `404`（文本提示 unknown provider key）；
  上游连接失败返回 `502`（上游响应已开始则直接中断连接）；每个请求都打印一行
  `[ua-relay]` 访问日志，其中 `Authorization` 头会被打码（只显示前 7 位 + `…` + 后 4 位）。
- **零外部依赖**：只使用 Node 内置 `node:https`，没有运行时 npm 依赖，没有需要
  安装的客户端资源。

## 兼容与依赖

### package.json 依赖
- `peerDependencies`: `@deepseek-ai/cordis >= 4`（DSH 插件运行时框架）。
- `dependencies`: **无**（唯一的导入是 Node 内置 `node:https`）。
- `dsh.bundle.patch`: `./cordis.patch.yml` —— 独立安装该插件时向 profile 注入
  `id: ua-relay` 的配置（整合包内不使用这段 patch，见下文）。

### host / client 形态
- **host 半身**：有。插件主体是 host 侧模块，`export function apply(ctx, config)`。
- **client bundle**：无。`package.json` 的 `exports` 只有 `.` 和 `./package.json`，
  没有 `./client` 出口，`dsh.client` 段也不存在 —— 纯服务端插件，无浏览器端资源。
- **platform**: 无（不需要 web 平台专用入口）。

### 注册点（从源码提炼）
- 插件名（cordis 注入的 id）: `ua-relay`。
- 依赖注入声明: `export const inject = ['webServer']` —— 需要 DSH 的 `webServer`
  服务（由 `@deepseek-ai/dsh-host-webserver` 提供）。
- 路由注册: 在 `ctx.effect()` 内调用
  `ctx.webServer.register({ kind: 'prefix', path: '/api/ua-relay', handler(req, res) })`，
  即**注册 HTTP 前缀路由**，非精确路径匹配。
- 导出的常量: `RELAY_PREFIX = '/api/ua-relay'`。
- 未注册的内容：不注册 `ctx.slots.inject`、不注册 `ctx.tools.register`、不注册
  host 侧 command、无 `export const inject` 之外的服务暴露 —— 它只贡献一条 HTTP 路由。

### 需要的 DSH 服务与版本要求
- 运行时：`@deepseek-ai/cordis >= 4`（peer 要求）。
- 服务：`webServer`（DSH web 服务器，默认监听本机，使用示例端口 `3080`）。
- 在整合包内由根包 `dsh-ventus-plugins` 的 peer 依赖间接保证
  `@deepseek-ai/dsh-host-webserver` 与 `@deepseek-ai/cordis` 存在。

### 与整合包其它子插件的关系
- **独立**：不依赖任何兄弟子插件，不共享状态、不读写公共配置、无耦合；
  唯一外部依赖是 DSH 自带的 `webServer` 服务。
- 与同源的 cc-switch 代理问题无关（cc-switch 走的是另一条 Claude Code 链路，
  本插件只服务 DSH 内部 provider 流量）。

## 功能适配细节

### 在整合包里的集成方式
- **host 聚合挂载**：源码被 vendored 到 `vendor/dsh-ua-relay/`（已核对与上游
  `lib/index.mjs` 逐字节一致）；根包 `lib/index.js` 的 `SUB_ENTRIES` 里声明
  `['dsh-ua-relay', 'dsh-ua-relay/lib/index.mjs']`（`.mjs` 原生 ESM 经
  `createRequire` 加载），由 host 聚合入口逐个 `ctx.plugin(plugin, config)` 挂载。
- **配置内联**：子插件挂载配置 `subConfigs['dsh-ua-relay'] = { targets: { bai: 'https://api.bankofai.io' } }`
  直接写在根包 `lib/index.js` 里 —— **整合后 ua-relay 的 `cordis.patch.yml` 段不进入
  根包 patch**（根包 `cordis.patch.yml` 只保留 permission presets 与
  `ventus-plugins` insert），targets 改由 `subConfigs` 维护，改配置需改根包源码。
- **容错加载**：若 `vendor/dsh-ua-relay/lib/index.mjs` 产物缺失（最小安装 /
  选择性更新），根包打印 warning 后跳过该子插件，其余子插件照常挂载。
- **可选安装**：本插件不是整合包默认必需项；不装时只少了 UA 反代能力，
  不影响用量监测、搜索、主题等其它功能。

### 配置项
配置来自 cordis 注入的 config 对象（`apply(ctx, config)`），支持的键：

| 键 | 类型 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `targets` | `{ [key]: string }` | 每个 provider key 到其目标 baseURL 的映射；空/非对象则视为 `{}`（所有 key 都会 404） | `{}` |
| `userAgent` | `string` | 转发时使用的 UA；空字符串或非字符串则回退默认值 | 默认 Chrome 126 浏览器 UA（见上） |

### 服务商接入方式（使用模板）
- 在 `targets` 里新增条目，如 `{ myprovider: 'https://gateway.example.com' }`。
- 把该 provider 的 `baseURL` 指到
  `http://127.0.0.1:3080/api/ua-relay/<key>/v1`（`3080` 为 DSH web 服务器端口，
  路径 `<key>` 换成 targets 里的键）。
- 请求到达后：`/api/ua-relay/<key>/v1/chat/completions` → 转发到
  `https://gateway.example.com/v1/chat/completions`，UA 已被改写。
- 已实测（记忆记录）：B.AI 经此中继普通与 SSE 流式均 HTTP 200。

### localStorage / 浏览器端存储
- **无**。插件没有 client 半身，不写入任何 localStorage / IndexedDB / cookie。

### 已知限制、注意事项、踩坑记录
- **仅支持 HTTPS 上游**：源码固定 `import { request as httpsRequest } from 'node:https'`，
  无论 `targets[<key>]` 是 http 还是 https 都走 HTTPS 客户端，指向 `http://` 目标的
  baseURL 会失败。若未来需要 http 目标，需改用 `node:http` 按协议分流。
- **中继路由本身无鉴权**：转发时 `Authorization` 头原样透传，但路由本身不校验
  调用方；中继只应暴露在本机 `127.0.0.1`，不要让外部可达。
- **配置无运行时 UI**：没有设置页 / 表单，改 `targets` / `userAgent` 只能改配置
  （独立安装时改 profile 的 patch 或插件配置；整合包内改根包 `subConfigs`）。
- **打码日志的边界**：`Authorization` 打码仅对长度 > 12 的串生效，短串（如 token
  很短时）会原样打印到控制台日志，注意日志脱敏边界。
- **后端实现约束**：源码刻意手写、不用 schemastery，`index.mjs` 里不能出现 TS
  `interface` 等 ESM 解析不了的类型语法（否则报 `Unexpected token 'export'`）；
  升级 DSH 版本时若 webServer 服务接口变动，需同步检查 `ctx.webServer.register`
  的 `kind: 'prefix'` 契约是否仍被支持。
- **透传行为**：请求体是纯流式管道转发，不做缓冲、不做缓存、不做限流；每个
  请求都会新建一条上游 HTTPS 连接，无连接复用池，高频小请求场景开销偏高。
- **源码目录名与包名不一致**（历史遗留的 Windows 文件锁导致）：目录名
  `dsh-bai-relay`、包名 `dsh-ua-relay`，后续维护时以 `package.json` 的 name 为准。
