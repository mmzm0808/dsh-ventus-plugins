# 模组注入（@dsh-external/dsh-super-injector）— 整合包内功能说明

## 功能描述

**一句话定位**：DSH 生态的 BepInEx 式运行时模组注入入口——把任意本地插件包免重启注入运行中的 web（host 工具 + client UI 完整生效），并附带热重载、侧挂开发、一键卸载、路由自愈的全套运行时管理能力。

**核心能力清单**（全部从源码与 README 提炼）：

### 1. 运行时注入（dev_inject_plugin）
- 将任意本地插件包（含 package.json + lib/ 构建产物）注入运行中的 DSH web 进程，不碰 cordis.patch.yml、不改 profile package.json、不重启进程
- 机制：`junction 链接` 到 profile node_modules（loader 标准解析路径）→ `ctx.loader.create({ name, config })` 运行时装配
- `hasActiveEntry` 权威防重（同名已有 active fiber 则跳过）
- 注入前 client 骨架校验：检查 `lib/client.js` 的 inject 声明、构建产物新鲜度（src 比产物新则审计警告，缺 client bundle 则阻断）
- 注入即完整生效：host 工具 + client UI 同时可用，返回值含 `host ✓ / client ✓` 双验证

### 2. 一键卸载（dev_uninject_plugin）
- 按包名子串匹配，卸载 loader entry（fiber dispose 全清理：工具/监听/路由/client 表）→ 清注入清单 → 删 junction
- profile patch 写 disabled 条目（阻断 bundle 插件在 include.refresh 时自装配加回）
- client 模块表移除（client-modules 只订阅增事件，卸载不自动清，需手动 removeClientRow）
- 拒绝卸载注入器自身（match 含 `super-injector` 直接返回 ERROR）

### 3. 整包热重载（dev_reload_package）
- 确定性整包重载：清缓存（purgeCache）→ 重新 import → registry 重建 fiber → 失败回滚保留旧代
- 无参数时返回当下已装配插件清单（id/name/fiber 状态/入口 URL）
- 带参数时输出重载前后 fiber 状态对比（`before: [active]` / `after: [active]`）
- 回滚机制：新 fiber 加载失败 → 删除新 fiber → 重建旧 fiber（用旧 _config 保留配置）

### 4. 自动轮询 watch（无需手动触发）
- 注入即自动监听插件目录的 `lib/` 下 `.js` 文件指纹（mtime + size）变化
- 构建产物变化 → 约 1.5 秒（config.intervalMs 可配）自动整包重载
- 预检机制：重载前先临时 import 新代码验证可加载，失败则跳过（保持旧代码运行 + 审计留痕）
- 防自毁：watch 自动重载永不触发注入器自重载（显式匹配 `dsh-super-injector` 跳过）
- 生命周期跟随 registry：注入清单中的条目自动加入 watch 列表，自重载后不丢失

### 5. 开发侧挂区（staging）
- 5 个 `dev_stage_*` 工具组成完整侧挂工作流：
  - `dev_stage_add`：测试工具挂"后侧"（不进 tools schema，不污染缓存前缀）
  - `dev_stage_call`：按名调用侧挂工具测试
  - `dev_stage_list`：列出侧挂工具（含转正状态）
  - `dev_stage_promote`：一键转正（正式 tools.register，唯一一次缓存刷新）
  - `dev_stage_demote`：撤回/注销侧挂或已转正工具
- 侧挂落盘持久化：自重载/重启后转正工具自动恢复

### 6. 双路径热装配（dev_install_package）
- 同时修改 profile package.json（dependencies 加 `link:` + bundles 数组加包名）和建 node_modules junction
- `ctx.loader.create` 动态加载（免重启生效）
- 幂等：已存在的依赖项、bundles 条目、node_modules link、loader entry 自动跳过
- 重启后由 bundles 列表正常装配（双路径一致，patch 层配置重启后接管）

### 7. 路由自愈（dev_clear_routes）
- 直捣 webServer 内部路由表：按 path 前缀删除 `exact` / `prefixes` / `upgrades` 表中的匹配条目
- 热重载残留的孤儿路由免重启清除

### 8. 插件生产线（dev_scaffold_plugin / dev_build_plugin / dev_release_plugin）
- `dev_scaffold_plugin`：生成四种形态的插件骨架——toolkit（工具包）、daemon-loop（守护循环，timer+LLM 自主 agent loop）、ui-panel（UI 面板）、hybrid（混合），含 package.json（peerDeps 范围声明）、tsconfig、build.sh（DSH_CHECKOUT 自动探测）、形态源码（资源挂 ctx.effect 规范）、可选 client 骨架
- `dev_build_plugin`：一键构建打包（探测 DSH_CHECKOUT → tsc host → tsdown client → npm pack → tgz）
- `dev_release_plugin`：gh release create + 上传 tgz

### 9. 故障自愈（dev_heal_links / dev_fix_patch）
- `dev_heal_links`：扫描 profile package.json 全部 `link:` 依赖，悬空/缺失的 node_modules junction 重建
- `dev_fix_patch`：扫描 cordis.patch.yml 按 entry id 去重（同 id 保留最后一条），修复 "duplicate loader entry id" 启动崩溃；备份原文件；`--check` 只查不写

### 10. 自重载（注入器自身热重载）
- 注入器支持自身热重载：dispose 自身 → 全局定时器重建
- 节流保护：最小间隔 10 秒（SELF_RELOAD_MIN_INTERVAL_MS），超出时间窗口的连环自杀被拒绝
- 节流状态持久化到 `self-reload.json`（跨 fiber 实例不归零）
- 故障审计日志 `self-heal.log` 落盘（1MB 轮转，保留 2 代），失败根因可复盘

### 11. 重启自动恢复
- 注入清单持久化到 `~/.dsh/super-injector/registry.json`（原子写：tmp → rename）
- 重启后自动恢复注入（config.autoRestore 默认 true）
- 恢复前 client 骨架校验：坏 client 的插件跳过恢复 + 审计（保留 registry，修复后下次启动恢复）
- 操作统计（opStats）跨重启累计：inject ✓/✗、reload ✓、uninject ✓/✗、install ✓、selfHeal ✓

### 12. 插件管理 UI（设置页）
- 注册 slot `settings.section`，ID `super-injector-plugins`，order 50，label `插件`
- 功能：已注入插件列表（名称/目录/运行状态）+ 一键卸载 + 添加（路径输入 + 拖放提示）
- 三种操作：直接注入（目录已是插件包）、内化（AI 造插件，新建 agent 会话）
- 60 秒轮询刷新
- 通信：同源 fetch → host webServer API `/super-injector/api`

### 13. 仲裁幽灵（arbitrateOfficial）
- 每次装配后自动检测并清理：幽灵 entry 运行中但官方 entry 被 disabled 的场景
- 清理幽灵 → 恢复官方 entry（清 disabled + 清 disposed fiber + refresh）

### 14. 获取能力提示注入
- 通过 `systemPrompt.context` 注册（order -90，静态常量文本）
- 引导 agent 认知：dev_* 工具功能、插件形态无上限、自我优化闭环、资源复用原则
- 容忍重复注册（自重载 rebuild 时旧 entry 的 context 可能残留，跳过不影响新实例运行）

### 15. 操作互斥锁
- 注入/卸载/重载/安装全部串行执行（withOpLock），多会话并发调用时排队等待
- 避免同一插件被并发重载/卸载的竞态

### 16. 一站式自检（dev_self_test）
- 一键回归注入器全链路，共 8 项（含自检工具自身）：
  1. 生成最小测试插件 → 构建
  2. 注入 → host ✓ 验证
  3. 热重载 → fiber uid 变化验证
  4. 自重载节流拒绝（<10s 内拒绝再次触发）
  5. 预检拦截（临时破坏 lib → 拒绝自杀 → 恢复）
  6. 卸载即净（entry/junction/registry 全清理验证）
  7. patch 写入合法性验证
  8. 全部自恢复、不留下污染
- 输出 PASS/FAIL 清单

## 兼容与依赖

### package.json 关键声明
- **peerDependencies**：
  - `@deepseek-ai/dsh-tools`: `>=0.0.1-rc <2`（范围声明，不硬编码版本）
  - `cordis`: `>=4.0.0-rc <5`（范围声明）
  - `schemastery`: `^3.18.0`
- **无运行时 dependencies**（零运行时依赖注入）
- 已适配 DSH 服务改名：`webServer`（原 httpServer）、`compaction`（原 compact）

### 形态
- **host 侧**：标准 DSH 插件（`lib/index.js`），通过 cordis.patch.yml 的 `- insert:` 装配
- **client 侧**：`lib/client.js`（tsdown 单独构建），注入 `['slots']` 服务
- **platform**: `web`（`package.json` 的 `dsh.client.platform` 声明）

### 注册的 slot / 工具 / 路由 / 服务
- **注入的服务**：`['loader', 'timer', 'tools', 'systemPrompt', 'webServer']`
- **注册的 DSH 工具**（18 个，均以 `dev_` 前缀命名）：
  - `dev_inject_plugin` / `dev_uninject_plugin` / `dev_injected_list`
  - `dev_install_package` / `dev_reload_package` / `dev_plugin_status`
  - `dev_clear_routes` / `dev_heal_links` / `dev_fix_patch`
  - `dev_stage_add` / `dev_stage_call` / `dev_stage_list` / `dev_stage_promote` / `dev_stage_demote`
  - `dev_scaffold_plugin` / `dev_build_plugin` / `dev_release_plugin`
  - `dev_self_test`
- **HTTP 路由**：`prefix /super-injector/api`，包含 4 个端点：
  - `GET /list`：返回注入清单（entries + 状态 + 操作统计 + client 声明状态）
  - `POST /uninstall`：body `{ match }`，按包名子串卸载
  - `POST /inject`：body `{ dir }`，注入本地插件包
  - `POST /ingest`：body `{ dir, title }`，新建 agent 会话内化插件
- **Client slot**：`settings.section`（ID `super-injector-plugins`, order 50, label `插件`）
- **systemPrompt 上下文**：`systemPrompt.context`（name `dsh-super-injector`, order `-90`）

### 需要的 DSH 服务
- `@deepseek-ai/dsh-tools`（工具注册）
- `@deepseek-ai/dsh-system-prompt`（获取能力提示注入）
- `@deepseek-ai/dsh-client-ui-slots`（client 侧设置页 slot 注册）
- `@deepseek-ai/cordis-plugin-loader`（loader 运行时装配）
- `@deepseek-ai/dsh-client-runtime`（client 运行时）
- `@deepseek-ai/dsh-client-modules`（client 模块表管理，用于 processOne / pkgMeta 自愈）
- DSH 版本要求：0.1.0-rc.6 兼容（peerDeps 范围声明实证）

### 与整合包其它子插件的关系
- **独立**：不依赖整合包内其他任何插件即可运行全部功能
- 可与 `dsh-evolve`（创造模式，单文件热挂载）互补使用：evolve 是"agent 现场长出单文件"，注入器是"注入预构建完整插件包"
- 提供 `dsh.client.inject` 声明（`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-slots`），client bundle 在整合包构建时自动内嵌

## 功能适配细节

### 整合包里的集成方式
- **host 聚合挂载**：通过 `cordis.patch.yml` 的 `- insert:` 条目装配引导器
- **client bundle 内嵌**：`package.json` 的 `dsh.client.inject` 声明确保 client 模块被整合包构建系统打包
- **可选安装**：注入器本身是唯一需要官方装配的插件；其注入的超级模组全部走运行时注入，无需碰官方配置

### 配置项
- `registryFile`：注入清单文件路径（默认 `~/.dsh/super-injector/registry.json`）
- `profileNodeModules`：junction 链接目标目录（默认 `~/.dsh/profiles/web/node_modules`）
- `autoRestore`：启动时自动恢复清单中的注入（默认 `true`）
- `intervalMs`：轮询间隔（ms，默认 `1500`）
- `watches`：监听目录列表 `Array<{ dir: string; match: string }>`（默认 `[]`，注入清单自动追加）

### 持久化文件
- `~/.dsh/super-injector/registry.json`：注入清单（原子写，tmp → rename）
- `~/.dsh/super-injector/self-reload.json`：自重载节流状态（跨 fiber 实例持久）
- `~/.dsh/super-injector/self-heal.log`：故障审计日志（1MB 轮转，保留 2 代）
- `~/.dsh/super-injector/selftest-runner/`：自检测试插件临时目录

### 已知限制、注意事项与踩坑记录

1. **插件包必须自带依赖链接**：`lib/` 里 `import '@deepseek-ai/dsh-tools'` 等从包自身 `node_modules` 解析——照 build.sh 建 junction 到 checkout 包

2. **client bundle 需单独构建**：host 侧 `bash scripts/build.sh`（tsc），client 侧 `npm run build:client`（tsdown，产物 `lib/client.js`）——注入插件要出 UI 必须两步都构建

3. **失败 import 会毒化重试**：loadCache 残留残缺 job 导致同名重载复用失败态——注入前 `purgeCache` 清理

4. **资源注册必须挂 `ctx.effect`**：裸注册在 fiber 卸载时（自重载 dispose / 卸载）不注销 → 残留工具闭包捕获旧 fiber 状态 → 新实例注册撞 duplicate 被跳过。这是注入器自己踩过的坑（lock 永久卡死、新代码永不生效的根因）

5. **client 操作必须用完整包名**：`client-modules.processOne` 对 `entry.options.name` 精确匹配，传短名会静默注册失败

6. **注入的插件不进 loader 配置持久化**：重启后由注入器自动恢复（引导器常驻）；注入清单只是运行时恢复缓存，不是第二安装数据库

7. **DSH_HOME 优先于 homedir**：部署的 web 进程 homedir 可能与 DSH_HOME 指向不同用户（如服务账户），junction 会建到错误 profile、loader 找不到包

8. **悬空 junction 必须重建**：目标目录被删后 `existsSync` 返回 false（跟随链接检查目标），判断链接存在必须用 `lstatSync`

9. **patch 文件格式陷阱**：官方 patch 初始是顶层 `[]`（空数组），盲 append `- id:` 会产生两个顶层 YAML 值 → 解析必炸。`writePatch` 函数会移除此空数组再追加

10. **自重载误报修复**：重载后 loader 可能替换/重建 entry 对象——旧 entry 引用指向已 dispose 的旧 fiber，必须重新 `findEntry` 拿最新 entry 再查状态

11. **client-modules pkgMeta 缓存死锁**：bundle 装配的插件在 client-modules 首次扫描时 junction 可能未建 → resolvePkgJson 抛 → pkgMeta 缓存 null（进程级永久，无官方清缓存 API）→ client 永不注册。注入器启动时自动清除自身缓存并重解析

12. **自重载节流状态必须落盘**：重启器重建 = 新 fiber = 新闭包，内存变量会归零（实测连续三次自重载都没被拦），文件状态跨实例持久才有效

13. **watch 自动重载永不触发注入器自重载**：改注入器代码 → build → 自动自杀无人兜底，watch 轮询显式匹配 `dsh-super-injector` 跳过