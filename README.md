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
    <tr><th style="width:48%">分类</th><th style="width:22%">子插件</th><th>说明</th></tr>
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

## 🧩 功能模块 key 一览

> 参考 [statem-li/dsh-webui](https://github.com/statem-li/dsh-webui) 的模块开关体系——**代码中真实存在**：
> `src/modules.ts` 的 `WEBUI_MODULE_KEYS` 定义全部 key，host/client 两端按同一份语义裁剪
> （`isModuleEnabled`：缺省 = 启用，只有显式 `false` 才关闭）。本整合包沿用同一约定。

<table>
  <thead>
    <tr><th style="width:40%">分组</th><th style="width:22%">key</th><th>控制的功能</th></tr>
  </thead>
  <tbody>
    <tr><td>对话体验</td><td><code>messageWidth</code></td><td>消息气泡宽度设置</td></tr>
    <tr><td></td><td><code>doneSound</code></td><td>回合结束提示音 + 完成卡片</td></tr>
    <tr><td></td><td><code>donePill</code></td><td>对话完成胶囊 + 记录面板</td></tr>
    <tr><td></td><td><code>approvalNotify</code></td><td>审批等待 toast 提醒</td></tr>
    <tr><td></td><td><code>ctrlEnter</code></td><td>输入框 Ctrl+Enter 换行</td></tr>
    <tr><td></td><td><code>sessionMotion</code></td><td>会话切换柔和过渡</td></tr>
    <tr><td></td><td><code>sessionPin</code></td><td>会话置顶 / 归档 / 右键菜单</td></tr>
    <tr><td></td><td><code>rewind</code></td><td>对话退回（文件回退 + 上下文分支）</td></tr>
    <tr><td></td><td><code>screenshot</code></td><td>单条消息截图 / 会话长图</td></tr>
    <tr><td></td><td><code>promptOptimize</code></td><td>提示词优化图标</td></tr>
    <tr><td></td><td><code>zhThinking</code></td><td>中文思考开关</td></tr>
    <tr><td></td><td><code>peakValley</code></td><td>DeepSeek 峰谷时刻卡片</td></tr>
    <tr><td></td><td><code>chatStats</code></td><td>会话统计条</td></tr>
    <tr><td></td><td><code>toolSummary</code></td><td>工具调用聚合 + 活动抽屉</td></tr>
    <tr><td>模型与供应商</td><td><code>reasoningSync</code></td><td>`webui_sync_reasoning` 推理等级补全工具</td></tr>
    <tr><td></td><td><code>modelSeats</code></td><td>模型座位接管 + 推理等级弹出</td></tr>
    <tr><td></td><td><code>providerHub</code></td><td>供应商管理设置页</td></tr>
    <tr><td></td><td><code>vision</code></td><td>辅助视觉 + 生图 + 生视频 + 生图画廊</td></tr>
    <tr><td></td><td><code>webSearch</code></td><td>AnySearch 网页搜索</td></tr>
    <tr><td></td><td><code>mail</code></td><td>邮箱验证码</td></tr>
    <tr><td>技能</td><td><code>skills</code></td><td>技能 slash 两级导航源 + 技能开关路由</td></tr>
    <tr><td>AI 浏览器</td><td><code>browser</code></td><td>浏览器工具 + dock UI + 设置开关</td></tr>
    <tr><td>自动化与计划</td><td><code>automation</code></td><td>自动化任务 + 真实执行引擎</td></tr>
    <tr><td></td><td><code>planweave</code></td><td>PlanWeave 计划项目</td></tr>
    <tr><td>记忆</td><td><code>memory</code></td><td>记忆引擎 + Memory Dream</td></tr>
    <tr><td>用量与统计</td><td><code>usage</code></td><td>用量工作台</td></tr>
    <tr><td>文件与工作区</td><td><code>fileExplorer</code></td><td>文件浏览器</td></tr>
    <tr><td></td><td><code>dirPicker</code></td><td>工作区目录选择器</td></tr>
    <tr><td>外观与壳</td><td><code>appearance</code></td><td>玻璃质感主题</td></tr>
    <tr><td></td><td><code>sidebarFloat</code></td><td>悬浮侧边栏</td></tr>
    <tr><td></td><td><code>updater</code></td><td>壳管理更新</td></tr>
    <tr><td></td><td><code>proxy</code></td><td>网络代理</td></tr>
  </tbody>
</table>

### 各功能能力明细

| 功能 | 能力 |
|---|---|
| **usage 用量工作台** | 余额/消费/请求数/Tokens 总览、分模型用量与 R0 倍率、命中率徽标、趋势图、登录/退出、截图 |
| **screenshot 消息截图** | 单条消息渲染截图（Markdown → 卡片图）、会话长图导出（`/api/webui-screenshot`） |
| **rewind 对话退回** | 消息文件快照、上下文分支回退（`/api/webui-rewind` 路由） |
| **sessionMotion** | 会话切换时的柔和过渡动画（opacity/transform 过渡，reduced-motion 降级） |
| **sessionPin** | 会话置顶 / 归档 / 右键上下文菜单（持久化存储） |
| **donePill 完成胶囊** | 回合结束「对话完成」胶囊 + 记录面板（`/api/webui-done-pill`） |
| **memory 记忆引擎** | 侧边栏记忆面板、注入开关、Memory Dream（模型整理：合并/精炼/剪枝/提升长期） |
| **tool-summary** | 工具调用聚合 chip + 活动抽屉（点击展开完整调用列表） |
| **ventus-progress** | 子代理任务分段进度条（`progress-json` 协议 + skill 引导） |
| **theme-endfield** | 终末地主题：等高线背景、ENDFIELD 水印、玻璃/纯色表面、hero 贴底、雷霆大字（任务开始/完成大字 + 入场动画） |
| **deepseek-usage** | 悬浮球余额 / R0 / 命中率、开放平台数据轮询 |
| **better-sidebar** | 右侧 VSCode 式重栏：文件树/编辑器/终端/Git/浏览器 |
| **ventus-search** | 多引擎搜索 + Readability 抓取 |
| **ventus-whale** | 3D 虎鲸桌宠 |
| **super-injector** | 运行时插件注入 + 热重载 |
| **visualize** | HTML 片段沙箱渲染 |
| **auto-mode** | Auto 权限策略（沙箱优先自动审查） |
| **ua-relay** | B.AI UA 重写反代 |

## 🚀 安装

### Git 安装

```sh
dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins
```

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
    <tr><th style="width:64%">功能</th><th>入口</th></tr>
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

### client 合并（lib/client.js + scripts/build-client.mjs）

DSH 按包加载 `/plugins/<id>/client.js`，bundle 契约是 `window.__ModuleLoader__.load({ id, factory })`。
合并策略（不解析 / 不重写压缩代码）：

1. 把每个子 bundle 的 `load` 调用**原样内嵌**进聚合 factory——执行时子 factory 注册进 loader（与多插件时代等价）；
2. 聚合 `apply` 用 loader 的 `require(id)` 按子 id materialize，依次调用其 `apply`。

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

## 📜 License

MIT
