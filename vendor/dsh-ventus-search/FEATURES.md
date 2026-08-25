# 多引擎搜索（dsh-ventus-search）— 整合包内功能说明

## 功能描述

dsh-ventus-search 是 Ventus 系列的搜索插件，向 DSH web profile 注册多引擎搜索与正文抓取两大 provider。搜索端并发调用 Bing、360 搜索、Bilibili 官方 API，经命中评分、URL 去重、跳转链接解码、超时兜底后返回结构化结果；抓取端对任意 URL 做广告域名拦截、类 Readability 正文抽取、镜像域名回退。附带 Ventus 系列设置卡，支持总开关、每引擎独立开关、健康状态监控与一键测试搜索。

### 核心功能清单

1. **多引擎并发搜索**
   - Bing 搜索：HTML 解析，自动识别中文查询走 `zh-CN` 市场、英文查询走 `en-US` 市场；支持 `news:` 前缀触发新闻搜索。
   - 360 搜索（so.com）：HTML 解析，双入口变体冗余（`?q=` 与 `?ie=utf-8&q=`），主入口失败自动切换。
   - Bilibili 搜索：调用 `api.bilibili.com/x/web-interface/search/all/v2` JSON API，仅返回 `result_type=video` 的视频结果，含视频标题、描述、作者、发布时间（Unix 时间戳转 ISO）。
   - 各引擎运行时可通过设置卡独立启用/禁用。

2. **结果质量优化**
   - 标题命中 ×3 + 摘要命中 ×2 − 排名权重 ×1.5 的评分公式。
   - URL 规范化去重：Bing/360 跳转包装解码（`/ck/a?a...&u=`、`/link?url=`、`a1://` base64url 形式）；降级 host、去默认端口、剥离 `utm_*` 及 50+ 跟踪参数（`spm`、`from`、`bd_vid` 等）、去 fragment。
   - 单域名最多保留 `maxDomainResults` 条结果（默认 2），防单一来源淹没结果集。
   - 查询级 LRU 缓存，容量 100，TTL 300 秒（5 分钟），命中直接返回不必重搜。

3. **容错与兜底**
   - 单引擎失败隔离，不影响其他引擎（引擎级 try-catch）。
   - 备用查询重试：首轮结果不足 3 个不同 URL 时，自动生成去掉引号和填充词的变体查询重试。
   - 429/5xx/超时自动重试（`retryCount` 默认 1 次，退避间隔 250ms × 尝试次数）。
   - 整体超时（`overallTimeoutMs` 默认 15 秒）到点返回已有部分结果，不阻塞。
   - `gracefulDegradation: true`（默认）时全部引擎失败返回空结果 + 提示文案而非抛错；关闭时抛出 `WEB_PROVIDER_ERROR`。
   - 全程响应外部 `AbortSignal`，客户端 fiber dispose 时自动中止进行中的搜索。

4. **正文抓取（ventus-fetch provider）**
   - 广告/追踪域名黑名单拦截（默认 `doubleclick.net`、`googleadservices.com`、`googlesyndication.com`，含子域名匹配）。
   - 类 Readability 正文抽取：优先 `<article>` / `<main>` / `role=main` / 内容类（`article`、`post`、`entry`、`content`、`main`、`story`、`readable`、`blog`）容器，回退到整页纯文本。
   - 镜像域名回退表（`mirrorDomains` 配置），主站请求失败后按 host 逐条尝试镜像。
   - 响应体流式上限 2MB 字节，解码后上限 200,000 字符，超出即截断标记 `truncated: true`。
   - 非 2xx 状态码返回空 body 不抛错（`statusCode` 保留）。
   - charset 自动识别（从 `Content-Type` 头提取），未知编码回退 UTF-8。
   - 非 HTML 响应返回整页纯文本。

5. **Ventus 系列设置卡**
   - 接入 slot `ventus.settings.item`，排序权重 `order: 30`。
   - 总开关（`enabled`）checkbox：关闭后搜索与抓取 provider 的 `available()` 同时返回 false。
   - 每引擎独立开关 + 健康状态显示（状态圆点：绿=正常 / 红=失败 / 灰=未测）+ 上次成功时间 / 失败原因。
   - 一键测试搜索：输入框（默认查询 "DeepSeek Harness 最新动态"，≤200 字符），点「测试搜索」发起真实搜索，展示耗时、来源数与结果列表（标题可点击、摘要、URL）。
   - 10 秒自动轮询 `/api/ventus-search/state` 刷新状态。
   - 所有 fetch 请求挂载 `AbortController`，组件卸载时自动清理。

6. **状态持久化**
   - 状态文件 `~/.dsh/plugins/ventus-search/state.json`（路径可配），原子写入（临时文件 + fsync + rename）。
   - 存储内容：master 开关、每引擎的 `enabled / health / lastOkAt / lastError`、`updatedAt` 时间戳。
   - 旧版扁平字符串格式自动迁移到对象格式（`parseEngineState` 兼容处理）。
   - 文件损坏时自动回退到出厂默认值，不阻塞插件启动。

## 兼容与依赖

### 依赖关系

| 包名 | 范围 | 用途 |
|---|---|---|
| `@deepseek-ai/cordis ^4.0.1` | peer | 插件框架核心 |
| `@deepseek-ai/dsh-web ^0.1.0-rc.7` | peer | `WebSearchProvider` / `WebFetchProvider` 类型、`WebError`、`ctx.web.registerSearchProvider` / `registerFetchProvider` 接口 |
| `@deepseek-ai/dsh-host-webserver ^0.1.0-rc.6` | peer | `WebRoute` 类型、`ctx.webServer.register` 路由注册 |
| `@deepseek-ai/dsh-client-ui-slots ^0.1.0-rc.6` | peer | client 端 `ctx.slots.inject` / `register` 设置卡插槽 |
| `schemastery ^3.18.0` | dev | 配置 schema 定义（`z.object` 等） |

### host / client 形态

- **host 半身**：`src/index.ts` → `lib/index.js`。插件名 `ventus-search`。`inject: ['web', 'webServer']`。通过 `ctx.effect` 注册两条路由 + 两个 provider，卸载时自动清理。
- **client bundle**：`src/client/index.ts` → `lib/client.js`（tsdown 构建，CJS 格式，内嵌 `__ModuleLoader__.load` 包装）。`inject: ['slots']`。通过 `ctx.slots.inject` 注入 Ventus 设置卡。随 fiber dispose 清理轮询/测试请求。
- **platform**：`web`（仅 web profile 可用）。
- 整合包内：host 聚合在 `lib/index.js` 统一挂载，client 内嵌在 `lib/client.js`。

### 注册的 slot / 工具 / HTTP 路由 / 服务

| 注册点 | 真实标识 | 来源 |
|---|---|---|
| `ctx.web.registerSearchProvider` | id `ventus-search` | `src/index.ts:299` |
| `ctx.web.registerFetchProvider` | id `ventus-fetch` | `src/index.ts:300` |
| `ctx.webServer.register` | `GET /api/ventus-search/state` | `src/index.ts:194` |
| `ctx.webServer.register` | `PATCH /api/ventus-search/state` | `src/index.ts:194` |
| `ctx.webServer.register` | `POST /api/ventus-search/test` | `src/index.ts:242` |
| `ctx.slots.inject` | slot `ventus.settings.item` | `src/client/index.ts:690` |
| `ctx.slots.register` | id `dsh-ventus-search`, order `30` | `src/client/index.ts:691` |

**未注册**：`ctx.tools.register`、`ctx.web.register`（非 WebSocket 端点）、`ctx.command`、`ctx.proxy`。搜索和抓取通过 `WebSearchProvider` / `WebFetchProvider` 接口暴露，而非注册为 DSH Tool。

### 需要的 DSH 服务与版本

- `@deepseek-ai/cordis ^4.0.1` — 插件装载器
- `@deepseek-ai/dsh-web ^0.1.0-rc.7` — web provider 注册接口
- `@deepseek-ai/dsh-host-webserver ^0.1.0-rc.6` — HTTP 路由
- `@deepseek-ai/dsh-client-ui-slots ^0.1.0-rc.6` — 设置卡 slot
- 运行环境：DSH web profile（`cordis.patch.yml` 的 `insert` 段指定 `id: dsh-ventus-search`）

### 与整合包其它子插件的关系

- **独立**：不依赖其他 Ventus 插件，不与其他插件共享状态文件或配置。
- **与 dsh-ventus-research**：无直接依赖，但同属 Ventus 系列，共享设置卡 slot `ventus.settings.item` 下的显示位置（排序由 `order` 控制，本插件为 30）。
- **与 dsh-ventus-whale / dsh-deepseek-usage**：无功能交集，仅 UI 同属 Ventus 设置分类。
- **整合包聚合**：`cordis.patch.yml` 的 `insert` 段只写入一根 `id: ventus-plugins`，搜索插件通过 `lib/index.js` 的 host 聚合代码 `ctx.plugin(require('dsh-ventus-search'))` 挂载，不单独出现在插件列表。

## 功能适配细节

### 整合包内的集成方式

- **host 聚合挂载**：搜索插件的 host 入口被整合包 `lib/index.js` 以 `ctx.plugin(require('dsh-ventus-search'))` 加载。配置在聚合入口内保持原值传递。
- **client bundle 内嵌**：搜索插件的 client 产物 (`lib/client.js`) 通过 `__ModuleLoader__.load` 合并进 `lib/client.js` 的单一 bundle，加载时自动注册设置卡。
- **可选安装**：在 vendor 目录 `dsh-ventus-search/` 下保留完整插件副本，可单独通过 `dsh plugin add github:mmzm0808/dsh-ventus-search` 安装。
- **cordis.patch.yml**：仅当单独安装时，`cordis.patch.yml` 的 `insert` 段生效（写入 `id: dsh-ventus-search` 到 profile）。整合包已统一处理，vendor 目录下的 `cordis.patch.yml` 不会重复触发。

### 配置项

全部配置项通过 schemastery schema 定义，支持原生 DSH 配置面板渲染。默认值如下：

| 配置键 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enabled` | boolean | `true` | 总开关，持久化到状态文件，设置卡可改写 |
| `stateFilePath` | string | `~/.dsh/plugins/ventus-search/state.json` | 状态文件路径，`~` 展开为 homedir |
| `engines.bing` | boolean | `true` | 启用 Bing 搜索 |
| `engines.so360` | boolean | `true` | 启用 360 搜索 |
| `engines.bilibili` | boolean | `true` | 启用 Bilibili 搜索 |
| `engines.bilibiliCookie` | string | `''` | Bilibili API 请求 Cookie，空值用内置默认 `buvid3=ventus-search-default-2026` |
| `maxResults` | number [1-50] | `8` | 返回来源数上限（seam 还会再截断） |
| `maxDomainResults` | number [1-20] | `2` | 单域名最多保留的结果数 |
| `requestTimeoutMs` | number [≥100] | `8000` | 单引擎单次请求超时（毫秒） |
| `overallTimeoutMs` | number [≥1000] | `15000` | 整次搜索整体超时，到点返回已有部分结果 |
| `maxConcurrency` | number [1-16] | `4` | 引擎并发数 |
| `retryCount` | number [0-5] | `1` | 429/5xx/超时重试次数 |
| `gracefulDegradation` | boolean | `true` | 全部引擎失败时返回空结果而非抛错 |
| `cache.enabled` | boolean | `true` | 查询级 LRU 缓存开关 |
| `fetch.enabled` | boolean | `true` | 抓取 provider 开关 |
| `fetch.blockedDomains` | string[] | `['doubleclick.net','googleadservices.com','googlesyndication.com']` | 广告/追踪域名黑名单 |
| `fetch.mirrorDomains` | Record<string,string[]> | `{}` | 主站失败时按 host 尝试的镜像域名表 |

**引擎实际启用逻辑**：配置 `engines.<id>`（硬默认）AND 状态文件 `engines.<id>.enabled`（运行时覆盖）同时为 true 才启用。

### localStorage 键

本插件不读/写任何 `localStorage` 键。状态全部通过 HTTP PATCH 回写 host 端的文件系统。

### 状态文件格式

`state.json` 内容示例：
```json
{
  "enabled": true,
  "engines": {
    "bing": { "enabled": true, "health": "ok", "lastOkAt": "2026-08-25T10:30:00.000Z", "lastError": null },
    "so360": { "enabled": true, "health": "fail", "lastOkAt": null, "lastError": "HTTP 503 for https://..." },
    "bilibili": { "enabled": false, "health": "untested", "lastOkAt": null, "lastError": null }
  },
  "updatedAt": "2026-08-25T10:30:00.000Z"
}
```

### 已知限制、注意事项、踩坑记录

1. **HTML 解析依赖 DOM 结构**：Bing 和 360 搜索结果通过正则解析 HTML（`<li class="b_algo">`、`<li class="res-...">`），搜索引擎改版可能导致解析失效。Bilibili 使用官方 JSON API 相对稳定。
2. **Bilibili Cookie 有效期**：默认 `buvid3` 为通用标识，高频请求可能被限流。建议通过配置 `engines.bilibiliCookie` 传入真实登录后的 Cookie 以获得更高配额。
3. **loopback-only 安全限制**：状态路由严格限制为只允许本机（`127.0.0.1`、`::1`、`localhost`）访问，并检查 `sec-fetch-site` 和 `origin` 头防止 CSRF。远程调试或反向代理时需注意此约束。
4. **状态文件并发写入**：`StateStore` 使用内存快照 + 同步原子写入，单次操作是安全的，但高频连续 PATCH（如反复快速点击开关）可能导致中间状态丢失。Client 端通过 `AbortController` 取消了前一个请求，避免竞态。
5. **缓存粒度**：LRU 缓存 key 为去空格后的查询字符串（区分大小写）。不同大小写同一查询词不会命中缓存。
6. **抓取 provider id 冲突**：`ventus-fetch` 显式避开了 DSH 官方内置的 `http` fetch provider id，两者可共存。但若其他插件也注册了 `ventus-fetch` 会冲突——目前整合包内无此情况。
7. **整合包 bundle 与独立安装的 patch 区别**：vendor 目录下的 `cordis.patch.yml` 在被整合包加载时不会触发（整合包只读自己的 `cordis.patch.yml`），单独安装时才会生效。升级整合包时要注意 vendor 内的插件版本是否已过时。
8. **构建依赖**：`build` 需要 `scripts/build.sh`（link junction + tsc），`build:client` 需要 `tsdown`。vendor 目录已提交 `lib/` 构建产物，安装无需执行构建脚本。
9. **Bing 新闻搜索**：通过 `news:` 前缀触发，但新闻结果的 HTML 结构与普通搜索不同，解析覆盖可能不够全面。
10. **360 双入口冗余**：两个入口按顺序尝试，只要任一入口解析出非空结果即返回，请求级失败（网络错误、非 2xx）和空结果都会落到下一入口；两入口均失败才抛错。注意：`so360Search` 不会把两个入口的结果合并，而是取第一个有结果的入口。