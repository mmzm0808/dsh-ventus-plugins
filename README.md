# 🚀 dsh-ventus-plugins

[English](README_EN.md) | 中文

## Ventus 插件全家桶 —— 单一插件整合包

把 **11 个自装 DSH 插件**整合为**一个插件**，功能与设置与多插件时代**完全一致**。
插件列表只显示一个入口，侧边栏、悬浮球、主题、搜索、桌宠、技能、用量统计全部保留。

> **整合动机**：插件列表越滚越长、每次升级要逐个同步。整合后：
> - 插件管理面板只出现 `dsh-ventus-plugins` 一个条目；
> - 所有子插件共享同一个生命周期（host 聚合挂载 + client 单一 bundle）；
> - 升级只需替换一个包。

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="version" src="https://img.shields.io/badge/version-v0.2.0-blueviolet">
  <img alt="plugins" src="https://img.shields.io/badge/plugins-11%20in%201-4d6bfe">
  <img alt="runtime" src="https://img.shields.io/badge/runtime-dsh%20web-4d6bfe">
  <img alt="stars" src="https://img.shields.io/github/stars/mmzm0808/dsh-ventus-plugins">
  <img alt="last-commit" src="https://img.shields.io/github/last-commit/mmzm0808/dsh-ventus-plugins">
</p>

## ✨ 功能总览

<table>
  <thead>
    <tr><th width="19%">分类</th><th width="22%">子插件</th><th>说明</th></tr>
  </thead>
  <tbody>
    <tr><td>🎨 主题</td><td><code>dsh-theme-endfield</code></td><td>终末地工业编辑部风格主题：米纸底、墨字、信号黄强调、直角。等高线背景、ENDFIELD 水印、玻璃/纯色侧边栏表面（主题设置下拉框）、hero 贴底（可开关）</td></tr>
    <tr><td>📊 用量监测</td><td><code>dsh-deepseek-usage</code></td><td>右侧悬浮球：实时余额、今日 R0 涨价倍率、模型命中率徽标；展开面板：累计/今日消费、请求数、Tokens、分模型用量、趋势图、登录/退出、截图</td></tr>
    <tr><td>📈 用量与技能</td><td><code>dsh-usage-skill</code></td><td>Token 用量热力图（日/月/年）、多 Provider 余额卡、技能包管理面板（侧边栏入口已禁用，仅保留组件导出与字典）</td></tr>
    <tr><td>📁 右侧重栏</td><td><code>dsh-better-sidebar</code></td><td>VSCode 式右侧栏：文件树 / 编辑器（CodeMirror 多语言高亮）/ 终端 / Git / 浏览器，按会话隔离；文本编辑器底部信息栏（总字数 + 选中字数）</td></tr>
    <tr><td>🔍 搜索</td><td><code>dsh-ventus-search</code></td><td>Bing / 360 / Bilibili 多引擎搜索 + Readability 正文抓取，注册为 DSH 搜索 provider，带设置卡与总开关</td></tr>
    <tr><td>🐋 桌宠</td><td><code>dsh-ventus-whale</code></td><td>3D 虎鲸桌宠浮窗：拖拽 / 旋转 / 右键菜单，设置页配置大小、灵敏度、显示文字</td></tr>
    <tr><td>📶 子代理进度</td><td><code>dsh-ventus-progress</code></td><td>解析子代理输出的 `progress-json` 进度模型，子代理条目悬停显示分段进度条与当前任务文字；自带 skill 引导 AI 输出进度模型</td></tr>
    <tr><td>🛠️ 工具链</td><td><code>@dsh-external/dsh-webui</code></td><td>视图图块 / 消息导航 / 工具调用聚合 / Markdown 渲染 / 模型推理等级同步 / AnySearch；**悬浮侧边栏**（含三点菜单浮窗不收起修复）与提示词优化浮窗</td></tr>
    <tr><td>🧩 模组注入</td><td><code>@dsh-external/dsh-super-injector</code></td><td>运行时注入任意本地 DSH 插件包（junction + loader.create，不重启），热重载 + 插件管理 UI</td></tr>
    <tr><td>👁️ 可视化</td><td><code>@dsh-external/dsh-visualize</code></td><td>`visualize` 工具 + 配套 skill：模型渲染交互式 HTML 片段为沙箱卡片（Codex `/visualize` 语义）</td></tr>
    <tr><td>⚖️ 权限策略</td><td><code>@nanmicoder/dsh-auto-mode</code></td><td>沙箱优先的自动权限策略：工作区写 + 语义审查 + 一次性宽授权（**Auto 权限项**，已并入本包 patch）</td></tr>
    <tr><td>🌐 UA 中继</td><td><code>dsh-ua-relay</code></td><td>B.AI（bankofai.io）UA 重写反代：绕过网关 UA 拦截，配置目标 `https://api.bankofai.io`</td></tr>
  </tbody>
</table>

> `@nanmicoder/dsh-agent-teams`（多代理团队协作）保持**禁用**：
> 其 activity scanner 在历史日志异常后会反复全局扫描导致 UI 假死；
> host 不挂载、client 不内嵌，行为与多插件时代完全一致。

## 🧩 功能开关结构

整合包对外是一个插件，内部保留 11 个子插件各自的设置与开关。开关分两层：

**第一层 · 子插件级**（设置 → Ventus 插件 / 对应设置卡）

| 子插件 | 开关位置 | 关掉后的效果 |
|---|---|---|
| `dsh-theme-endfield` | 主题设置卡「启用主题」 | 恢复官方外观，等高线/水印/雷霆大字一并停用 |
| `dsh-deepseek-usage` | Ventus 设置卡「启用用量监测」 | 悬浮球与用量面板隐藏，停止后台轮询 |
| `dsh-ventus-search` | Ventus 搜索卡总开关 | 搜索与抓取 provider 立即不可用 |
| `dsh-ventus-whale` | 桌宠设置卡 | 3D 桌宠不挂载 |
| `dsh-ventus-progress` | 进度设置卡 | 子代理进度条不渲染 |
| `dsh-better-sidebar` | 右侧栏设置卡 | 右侧重栏（文件/终端/Git/浏览器）不挂载 |
| `@dsh-external/dsh-webui` | 见第二层 | 逐项裁剪工具链功能 |

**第二层 · webui 工具链细分**（缺省启用，显式关闭才停用；host 与 client 同一份语义）

| 分组 | 可关闭的功能 |
|---|---|
| 对话体验 | 消息宽度、完成提示音、完成胶囊、审批提醒、Ctrl+Enter、会话切换过渡、置顶归档、标题点击重命名、对话退回、消息截图、提示词优化、中文思考、峰谷卡片、统计条、工具聚合 |
| 模型与供应商 | 推理等级同步、模型座位、供应商管理、辅助视觉/生图、AnySearch、邮箱验证码 |
| 技能与浏览器 | 技能导航、AI 浏览器 |
| 自动化与记忆 | 自动化任务、PlanWeave、记忆引擎 |
| 用量与文件 | 用量工作台、文件浏览器、目录选择器 |
| 外观与系统 | 玻璃质感、悬浮侧边栏、壳更新、网络代理 |

> 单独安装某个子插件时，它自己的开关照旧可用；整合安装则统一从上面两层入口管理。

### 各功能能力明细

**🗨️ 对话体验**

| 功能 | 能力 |
|---|---|
| 完成胶囊 donePill | 回合结束悬浮胶囊 + 记录面板：完成记录分组叠瓦、一键清空、展开/收起、健康提醒（凌晨/休息时段，可点击收起当天）；平时轮播开心话术 / 凝聚态物理小知识 |
| 完成提示音 doneSound | 回合结束提示音 + 完成卡片 |
| 消息截图 screenshot | 单条消息渲染截图（Markdown → 卡片图）、会话长图导出 |
| 对话退回 rewind | 消息文件快照、上下文分支回退 |
| 置顶 / 归档 sessionPin | 会话置顶（折叠窗口补行）、一键归档、右键菜单（置顶/重命名/分叉/归档）、**已归档区域**（工作区同构，可收起展开，还原按钮） |
| 标题重命名 titleRename | 对话区标题点击即全选重命名（Enter 提交 / Esc 取消） |
| 工具聚合 tool-summary | 工具调用聚合 chip + 活动抽屉（思考过程 / 调用详情） |
| 提示词优化 | 输入框图标一键优化草稿（长度档位、设定目标、浏览器验证、**注入记忆开关**） |
| 其他小项 | 中文思考、峰谷卡片、统计条、审批提醒、Ctrl+Enter 换行、会话切换过渡、消息宽度 |

**🔧 模型与供应商**

| 功能 | 能力 |
|---|---|
| 供应商管理 providerHub | 对话 / 视觉 / 生图 / **生视频**统一设置页、模型列表编辑器、供应商标识与能力区块、**性能基准弹窗**（/api/perf-bench） |
| 模型座位 modelSeats | 模型选择接管 + 推理等级滑动弹出 |
| 推理等级同步 | `webui_sync_reasoning` 工具按供应商模板自动补全推理等级 |
| 辅助视觉 / 生图 vision | `vision_describe` / `generate_image`、非多模态主模型的图片降级描述、图片缓存 |
| AnySearch | 多引擎网页搜索设置卡（与 ventus-search 并列可用） |

**📁 侧边栏与文件**

| 功能 | 能力 |
|---|---|
| 右侧重栏 better-sidebar | VSCode 式文件树 / 编辑器 / 终端 / Git / 浏览器，按会话隔离；**外部链接与产物点击弹双按钮**（新标签页/侧边栏、侧边栏编辑器/系统打开） |
| 悬浮侧边栏 sidebarFloat | 侧边栏可悬浮为独立窗口（设置项持久化） |
| 文件浏览器 / 目录选择器 | 工作区文件树弹窗、目录选择器 |

**📊 用量与进度**

| 功能 | 能力 |
|---|---|
| 用量悬浮球 deepseek-usage | 余额 / R0 / 命中率悬浮球、开放平台数据轮询；**缓存命中率按会话真实两位小数**（杜绝恒 .00）；**设置页更新入口**（安装确认 → 顶层多选安装/更新弹窗，仅更新勾选项） |
| 用量工作台 usage | 用量趋势 / 热力图 / 账户总览 |
| 子代理进度 ventus-progress | 子代理任务分段进度条（`progress-json` 协议 + skill 引导） |

**🤖 自动化与记忆**

| 功能 | 能力 |
|---|---|
| 自动化 automation | 定时自动化任务（cron/at/every） |
| PlanWeave | 计划项目工作台 |
| 记忆引擎 memory | 侧边栏记忆面板、注入开关、Memory Dream（合并/精炼/剪枝） |

**🎨 主题与系统**

| 功能 | 能力 |
|---|---|
| 终末地主题 | 等高线背景、ENDFIELD 水印、玻璃/纯色侧边栏、hero 贴底、雷霆大字（任务开始/完成） |
| 玻璃质感 / 壳更新 / 网络代理 | 外观增强、DSH 壳更新管理、网络代理设置 |
| 3D 虎鲸桌宠 | 右下角拖拽桌宠，右键菜单配置 |

**🧩 其它子插件**：多引擎搜索 ventus-search（Bing/360/Bilibili + Readability 抓取）、模组注入 super-injector（运行时热加载插件）、HTML 可视化 visualize、Auto 权限策略 auto-mode、B.AI UA 中继 ua-relay、邮箱验证码 mail、技能导航 skills、AI 浏览器 browser

## 🚀 安装

### ⚡ 最小安装（推荐）

只含**用量监测**（悬浮球 / 消费 / Tokens / 命中率），体积小、依赖少，其余子插件按需补装：

```sh
dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins#min
```

**补装引导**（最小包安装后升级为完整整合包）：

1. 安装后**重启 dsh**；
2. 打开 **设置 → 插件 → dsh-ventus-plugins**（Ventus 设置页）；
3. 点击右上角**更新按钮**，确认后打开安装窗口；
4. 勾选要安装的子插件（主题 / 侧边栏 / 桌宠 / 搜索 / WebUI 工具链等），点「更新选中项」；
5. 更新完成后**重启 dsh** 生效。

只对勾选项执行安装，未勾选的保持不装；已装插件在有新版时标记「可更新」，同样按勾选更新。

### 完整安装

全部 11 个子插件一次装齐：

```sh
dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins
```

> 两种形态是**同一个插件**（包名均为 `dsh-ventus-plugins`）。最小包补装后即变为完整整合包，之后继续用设置页的更新按钮增量更新。

### 本地开发安装

```sh
dsh plugin --profile web add "<本仓库本地绝对路径>"
```

- 仓库已提交完整 `lib/` 构建产物与 `vendor/` 依赖，安装**无需执行构建脚本**（pnpm ≥10 的 allowBuilds 门禁不影响本插件）
- 安装后**重启 dsh**（新 bundle 层在启动时加载；client 改动经 HMR 即时生效）
- 插件列表 / 设置入口 / 主题选择器均显示为 `dsh-ventus-plugins`

## 📖 使用

<table>
  <thead>
    <tr><th width="16%">功能</th><th>入口</th></tr>
  </thead>
  <tbody>
    <tr><td>用量悬浮球</td><td>右侧悬浮球：拖动可上下移动，左半屏自动吸附；点击展开面板</td></tr>
    <tr><td>用量面板</td><td>悬浮球点击 → 余额 / 消费 / Tokens / 分模型用量 / R0 / 趋势 / 登录 / 截图</td></tr>
    <tr><td>终末地主题</td><td>设置 → 外观 → 主题 → <code>dsh-theme-endfield</code>；主题设置卡内：等高线开关、水印开关、侧边栏表面（透明/玻璃/纯色+调色盘）、圆角/直角、hero 贴底</td></tr>
    <tr><td>右侧重栏</td><td>对话区右上角面板按钮：文件 / 终端 / Git / 浏览器标签</td></tr>
    <tr><td>搜索</td><td>输入框 <code>@</code> 或斜杠命令触发 ventus-search provider</td></tr>
    <tr><td>桌宠</td><td>右下角虎鲸；右键菜单配置</td></tr>
    <tr><td>子代理进度</td><td>发起可多阶段拆分的子代理任务（AI 按 skill 约定输出 <code>progress-json</code>），悬停对话底部子代理条目查看分段进度条</td></tr>
    <tr><td>模组注入</td><td>设置 → <code>dsh-ventus-plugins</code> → 注入管理：拖入本地插件包即热加载</td></tr>
  </tbody>
</table>

## 🔑 配置

所有子插件设置集中在 **设置 → 插件 → dsh-ventus-plugins**（原各插件设置卡全部保留）。
常用持久化键（`localStorage`）：

| 键 | 默认 | 说明 |
|---|---|---|
| `dsh-theme-endfield-enabled` | `1` | 主题总开关 |
| `dsh-theme-endfield-contour` | `0` | 等高线背景 |
| `dsh-theme-endfield-watermark` | `1` | ENDFIELD 水印（hero 页） |
| `dsh-theme-endfield-watermark-persist` | `0` | 水印在非 hero 页也显示 |
| `dsh-theme-endfield-sidebar-surface` | `glass` | 侧边栏表面：`glass` / `solid` / 自定义 |
| `dsh-theme-endfield-hero-dock` | `1` | hero 贴底（usage 插件设置项） |
| `dsh-theme-endfield-radius` | `square` | 圆角/直角 |
| `dsh-theme-endfield-sidebar-solid-color` | — | 纯色表面自定义颜色 |

## 🏗️ 架构（工程化说明）

整合包由四层组成：

```
dsh-ventus-plugins/
├── package.json            # 单一包名；dsh.client.platform=web；34 个第三方依赖并集
├── cordis.patch.yml        # bundle patch：permission presets（auto 权限项）+ insert 行
├── lib/
│   ├── index.js            # host 聚合：逐个 ctx.plugin 挂载 10 个子插件（agent-teams 除外）
│   └── client.js           # client 合并 bundle（build-client.mjs 生成，勿手改）
├── vendor/                 # 11 个子插件的运行时产物（自包含，无外部插件依赖）
│   └── node_modules/       # junction 依赖链：第三方 → profile node_modules
└── scripts/
    ├── build-client.mjs    # client 合并构建脚本
    ├── cdp.mjs             # CDP 调试工具（开发用）
    └── extract-dsu-css.mjs # CSS 常量提取（调试用）
```

### host 聚合（lib/index.js）

```js
const subPlugins = {
  'dsh-better-sidebar': require('../vendor/dsh-better-sidebar/lib/index.js'),
  // ... 11 个子插件
}
export function apply(ctx) {
  for (const [id, plugin] of Object.entries(subPlugins)) {
    ctx.plugin(plugin, subConfigs[id])   // cordis 按子插件自身 name 注入默认配置
  }
}
```

- 子插件**自带 name/inject/Config**，`ctx.plugin` 挂载时按原插件语义解析——配置、服务依赖、持久化与多插件时代完全一致
- `subConfigs` 只覆盖需要显式值的插件（如 `dsh-ua-relay` 的 targets）
- **容错动态加载**：子插件产物缺失（最小安装 / 选择性更新只装了一部分）时打印 warning 并跳过，
  其余照常挂载——包形态可从「最小」平滑升级到「完整」

### client 合并（lib/client.js + scripts/build-client.mjs）

DSH 按包加载 `/plugins/<id>/client.js`，bundle 契约是 `window.__ModuleLoader__.load({ id, factory })`。
合并策略（不解析 / 不重写压缩代码）：

1. 把每个子 bundle 的 `load` 调用**原样内嵌**进聚合 factory——执行时子 factory 注册进 loader（与多插件时代等价）；
2. 聚合 `apply` 用 loader 的 `require(id)` 按子 id materialize，依次调用其 `apply`。

**选择性构建**（最小包 / 用户端更新场景）：

- `VENTUS_ENTRY_FILTER=dsh-deepseek-usage`：只内嵌白名单内的子插件（min 分支构建用）；
- 缺失产物的子插件自动跳过（用户端选择性更新后重建时本机只有部分子插件）；
- `STAMP_SHA=<sha>`：直接内嵌指定提交 sha 的版本戳（用户端更新后写入远程 sha），
  不设时取当前 git HEAD（开发构建路径，与 stamp-commit.mjs 等效）。

**关键点**（踩坑记录）：

- **服务注入用短服务名**：聚合 bundle 的 `exports.inject` 必须是子插件服务依赖的**并集**，且用**短服务名**（`slots` / `sessions` / `connection` / `workspaces` / `locale` / `modules` / `settingsScope` / `conversationEvents` / `remote` / `layout`）。写包名会永远 pending；留空则子 apply 因缺属性注入抛 "cannot get property without inject"。
- **变量作用域天然隔离**：每个子 bundle 有独立 factory 函数作用域，同名顶层 `const`（如 `NS`）互不冲突，`node --check` 可验证。
- **样式归属必须显式**：子插件手写 `<style>` 要带 `data-plugin` 标记；theme 的幂等清理只认自己的专属标记（`data-endfield-css`），否则会误删其他插件的样式（实测事故：usage 的 `data-dsu-css` style 被 theme 清理逻辑删除，悬浮球变纯文本）。

### patch 层（cordis.patch.yml）

- `permission.presets` 段：auto 权限项的定义（整段替换语义，必须完整重述官方默认 + auto 扩展）；
- `insert` 段：本插件挂载行。

### vendor 依赖链

聚合包在 `DSH_Anything` 目录，第三方依赖无法从 profile 解析，故在
`vendor/node_modules/` 建立 junction 链：第三方包 → profile `node_modules`，
`@deepseek-ai/*` → 扁平 fallback。

## 🧑‍💻 开发

```sh
# 改某个子插件源码后：
# 1. 在该子插件仓库构建（如 dsh-deepseek-usage: npm run build:client）
# 2. 同步产物到 vendor：
cp ../dsh-deepseek-usage/lib/client.js vendor/dsh-deepseek-usage/lib/client.js
# 3. 重建合并 bundle：
node scripts/build-client.mjs
# 4. 浏览器刷新即生效（client HMR）；manifest/patch 变更需重启
```

### min 分支维护

`min` 分支是同一插件的最小形态（只含用量监测），安装命令
`dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins#min`。
更新 `min` 分支内容（通常只在 usage 产物变化时）：

```sh
git checkout min
# 同步本机 usage 产物（构建后）到 vendor/dsh-deepseek-usage/
cp -r ../dsh-deepseek-usage/lib/* vendor/dsh-deepseek-usage/lib/
# 只内嵌 usage 重建聚合 bundle（stamp 自动取 min 分支 HEAD）
VENTUS_ENTRY_FILTER=dsh-deepseek-usage node scripts/build-client.mjs
git add -A && git commit -m "sync: usage 产物" && git push origin min
git checkout master
```

### 验证矩阵

- `node --check lib/client.js`：合并 bundle 语法（多 bundle 平铺冲突检测）
- 启动后浏览器检查：插件列表只有一个 `dsh-ventus-plugins`；子插件 UI（悬浮球/侧边栏/主题）全部就位
- `dsh --profile web --dump-config`：permission presets 与 insert 行生效
- 会话日志（usage-stats 读取）无 `corrupt session log` 报错

## 🐛 已知问题与修复记录

| 问题 | 根因 | 修复 |
|---|---|---|
| usage 悬浮球变纯文本、无交互 | theme 的 insertCss 幂等清理用 `style[data-plugin=...]` 泛化选择器，误删 usage 的 `data-dsu-css` style | theme 清理改用专属标记 `data-endfield-css`；usage style 自带 `data-plugin=dsh-deepseek-usage` |
| 侧边栏多出「用量/技能」按钮 | usage-skill 注册了 `sidebar.footer.action` 与官方技能按钮重复 | 该 slot 注册被禁用（字典保留） |
| agent-teams 404 轮询风暴 | 用户禁用 agent-teams 后 client 仍被内嵌并轮询 state 路由 | 从 `CLIENT_ENTRIES` 移除 |
| auto 权限项消失 | 聚合 patch 未迁移原插件的 `permission.presets.auto` 段 | 并入 `cordis.patch.yml` |
| 三点菜单浮窗导致侧边栏收起 | pointInside 纯几何判断，portal 浮窗不在侧边栏矩形内 | `pointOverSidebarPopup`：elementFromPoint 命中 Radix popper / menu / dialog 时只保活不折叠、不展开 |
| ENDFIELD 水印在新会话页对齐整窗 | hero 水印跟随 headline 中心，headline 宿主宽度随页面变化 | 改用 centerCol（对话区）中心对齐；headline 匹配放宽（hash 漂移免疫） |
| 有历史对话页水印位置不对（fixed 浮视口） | headline 在有消息页也存在，hero 模式误判 | `data-chat-flow` 存在时强制 persist（对话区背景层，随对话区布局） |
| 会话日志 seq gap / tool source / surface 校验失败 | 历史版本写入重复 seq、空 callId、replace 引用失效 | `scripts/repair-session-log.mjs`：重编号 seq + 重写事件内 seq 引用（surfaceOp/sourceEventSeqs）+ 补 source.callId，scanLog + foldSurface 双验证 |
| tool-summary 抽屉点击后内容变纯文本 | `dsh-tool-summary-styles` 等无主 `<style>` 启动早期被按插件清理逻辑误删 | 全部运行时 style 注入批量带 `data-plugin=@dsh-external/dsh-webui`（10 处） |
| ventus-progress skill 未安装 | 整合 vendor 缺 skills 目录 + DSH_HOME 未注入 | vendor 补齐 skills；installSkill 加 `~/.dsh` fallback |
| 页面被 Edge 标记为英语 | 官方 index.html 声明 `lang="en"` | usage apply 运行时改回 `zh-CN` |
| 底栏缓存命中恒 .00 伪精度 | 由官方取整值反解区间中值，中值常落在整数 | host 按会话真实 token 分量算命中率（真两位小数），client 按官方文本配对注入（v4，配不上保留官方值） |
| 外部链接点击无反应（点不动） | 点击被静默吞进侧边栏，无任何反馈 | 链接点击弹双按钮（新标签页 / 侧边栏），产物 chips 弹「侧边栏编辑器 / 系统打开」 |
| 标题点击重命名未生效 | 官方标题是 crumbs 导航的 disabled 按钮，slot 文本节点选择器匹配不到 | 锚定 `[data-conversation-scroll]` 前兄弟 + pointerdown 矩形命中（disabled 按钮不派发 click） |

## 📜 License

MIT
