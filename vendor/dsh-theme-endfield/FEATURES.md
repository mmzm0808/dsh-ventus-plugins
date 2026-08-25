# 终末地主题（dsh-theme-endfield）— 整合包内功能说明

> 版本 1.0.0 · 本文档由源码（`package.json` / `README.md` / `client.js` / `index.js` / `cordis.patch.yml`）提炼。

## 功能描述

### 一句话定位

参考《明日方舟：终末地》（Arknights: Endfield）官网（endfield.hypergryph.com）「工业编辑风」视觉的 DSH Web 主题插件：米色纸底、墨色文字、信号黄强调、全 UI 直角化，并附带等高线背景、ENDFIELD 水印、启动加载屏、雷霆大字等装饰性动效。**纯 Client 半部插件**——所有效果都在浏览器端完成，Host 半部为空实现。

### 核心功能清单

**主题基础**
- 主题令牌覆盖：`theme.overrideTokens('edge-intelligence-theme', …)` 覆盖 13 个 DSW 令牌，亮/暗双色映射终末地色板（`--dsw-alias-bg-base`、`--dsw-alias-bg-layer-1/2`、`--dsw-alias-bg-overlay`、`--dsw-alias-border-l1/l2`、`--dsw-alias-brand-primary`、`--dsw-alias-label-primary/secondary`、`--dsw-alias-state-error/success/warn-primary`、`--dsw-specific-sidebar-fill`）。
- 全局样式注入：字体栈（Arial / Helvetica Neue / PingFang SC / Microsoft YaHei，`tnum` 等宽数字）、信号黄强调、直角化、去蓝（中和 DSH 内部 DeepSeek 品牌蓝）、hover 反色、表格/按钮/徽章/头部动作着色等。
- **双强调色配色**：谷地黄 `#fff500`（默认）/ 武陵青 `#14d0d0`，设置页一键切换。切换只是 `<body>` 上一个 class（`theme-endfield-wuling`），令牌值写成 `var(--edge-accent)` 随之自动重解析，**不重新注册令牌层、无 JS 重绘**。
- **全局直角化**：按钮、输入框、卡片、菜单、标签、气泡一律 `border-radius: 0`；状态圆点/头像/加载圈/滚动条保留圆形。设置页提供「圆角模式」可整体恢复应用原生圆角。
- 强调色交互：`::selection`、光标、焦点环、滚动条、表格行、按钮、激活项、Markdown 标记。
- 新会话页背景光晕改强调色（应用原本以 SVG 属性写死的 `#6187D8`，不走 token；亮 8% / 暗 5% 按亮度实测对齐）。
- hover 文字反色；表格行悬停实心强调底黑字；新建会话按钮强调底黑字；Cordis 操作按钮（run/stop/approve）着色；会话头部动作（agent preset 徽标/子代理/任务）着色；Cordis 审批按钮图标（强调底黑勾 / 红底白叉）。
- 对话区横向滚动归零：capture 阶段滚动监听把内层容器异常的 `scrollLeft` 清零（排除输入框、代码块与浮窗容器），修 PgUp/PgDn 在输入框有文字时的整体左移。

**等高线背景（娱乐/装饰动效）**
- 整屏强调色细线地形（跟随当前配色），参考等高线地形图。图层挂进**应用外框内部**（外框 `position:relative` 且不产生层叠上下文，`inset:0; z-index:0` 的子元素正好落在底色之上、正文之下），关闭时零逐帧开销。
- **动态等高线**：场缓慢流动变形（约 24fps），尊重 `prefers-reduced-motion`（图案保留、变形停止，设置行会说明是系统偏好生效）。
- 实现：标量场（高斯凸起之和 + 三道长波正弦）→ marching squares 在 21 个等间距高度取等值线 → 边 ID 缝合 + 二次曲线绘制（消除折线棱角）。有界散射、分层采样 + 校验、非纯随机种子等均为实测迭代结论。

**背景水印**
- 背景 ENDFIELD 水印（hero 页跟随标题居中，`pointer-events: none`，纯装饰不入无障碍树）。
- 「水印保持显示」：非新建会话页面（对话/设置等）也在正文之下显示水印，挂在会话列内部。
- 防浏览器误翻译：字形由 CSS `content` 绘制（无任何 DOM 文本节点）+ `translate="no"` / `class="notranslate"` / `lang="en"` 双保险。

**启动加载动画（默认关闭）**
- 参考终末地官方主视觉：整屏黑底，左边缘 10px 强调色进度轨自上而下填充（跟随配色），刻度 + 百分比 + 状态行跟随填充端下移（下边界钳制）。END / FIELD 双行堆叠字标、品牌块居右（锚右边距）。
- 时序：进度（约 1.75s `easeOutCubic`）→ 强调色向右铺满整屏（520ms）→ 整屏淡出（620ms）移除。设置页提供「预览」按钮重播。进度由墙钟时间推导、双时钟驱动（rAF + setInterval 兜底）+ 独立保险丝定时器，`prefers-reduced-motion` 下直接跳过。

**雷霆大字（娱乐模式，默认关闭）**
- 任务开始/结束时屏幕中央显示「任务开始」/「任务完成」白色粗体大字，3 秒后自动消失，点击任意处立即关闭。
- 信号源：读取 `ctx.get('sessions')` 的 `ConversationSnapshot.running`（只报边沿，首次读数作基线不发声，避免切入已运行会话误报）。
- 「大字入场动画」子开关（默认关闭）：关闭时大字直接出现/消失，不做缩放与淡入淡出。

**侧边栏表面**
- 三种表面：`glass`（玻璃，半透明基底 + 背景模糊，等高线花纹柔化透出）、`transparent`（完全透明，花纹直接贯穿）、`solid`（自定义纯色，调色盘选色）。
- `solid` 模式下出现「应用到对话区」子开关：对话区（含标题栏）用同一底色但多一层半透明（约 68%）铺底，花纹仍可透过。

**已修复的可见性/对比度缺陷（由测试固化）**
- 强调色底上的白字：设置 › 模型「编辑」等 6 处（含 3 个检查面板按钮与附件轮播箭头），暗色谷地黄下 1.05:1 → 16.50:1。
- 亮色模式「移除」按钮红字：3.16:1 → 5.16:1。
- 回合状态标签「Deep diving...」改强调色/深色：渐变文字（`background-clip: text` 镂空），改色只能改渐变本身，每色标对两种底色都达 AA。
- 提问卡片「推荐」徽标与选项编号可见性（原先字画在自己的底色上）。
- 主题滚动条失效（`--edge-line` 等声明在 `:root` 引用 body 行内令牌导致计算值为空）。

## 兼容与依赖

### package.json 关键声明

- `peerDependencies`：`@deepseek-ai/cordis: ^4.0.1`（标注 optional）。
- 无运行时 `dependencies`（纯样式插件）。
- `exports`：`.` → `./index.js`（host 半部）、`./client` → `./client.js`（client bundle）、`./package.json`。
- `dsh.client.inject`（client 运行时依赖清单）：`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-settings`、`@deepseek-ai/dsh-client-ui-theme`；`platform: "web"`。
- `dsh.bundle.patch`：`cordis.patch.yml`（一个 `insert`，插件行 id `theme-endfield`）。
- `engines.node >= 18`。
- 额外用到的客户端库/令牌：`@deepseek-ai/dsh-client-ui-conversation`（回合状态标签）、`@deepseek-ai/dsh-client-ui-user-questions`（提问卡片）。

### host / client 形态

- **Host 半部**（`index.js`）：`name` + 空 `apply()`，刻意 no-op——主题纯浏览器端生效，host 侧无事可做。
- **Client 半部**（`client.js`）：单文件浏览器 bundle，**无编译步骤**，`exports.name` = `dsh-theme-endfield`、`exports.apply(ctx)`。改完刷新即生效。
- 加载方式：安装为独立 bundle 时通过 `dsh.bundle.patch` 挂进 bundle 栈，client bundle 由 web 模块半部扫描登记；动态环境可用 `cordis_define` / `cordis_run` 以 Client 代码加载。

### 注册点（从 client.js 提炼）

- **Slots**：
  - `ctx.get('slots')` → `slots.inject('settings.section', …)` 注入设置分区；
  - `slots.register({ name: 'settings.section', id: 'theme-endfield', order: 35, label: '终末地主题设置' }, …)` 注册设置卡。
- **服务**（均 `ctx.get`，非 `inject`）：
  - `ctx.get('theme')` → `theme.overrideTokens('edge-intelligence-theme', { 13 个令牌，light/dark })`；
  - `ctx.get('slots')`（可能缺失，缺失则跳过设置卡）；
  - `ctx.get('sessions')`（**延迟解析**：theme 不声明 `inject`，避免加载顺序竞态把整个主题拖入 pending 态；会话服务缺失时雷霆大字静默停用，不影响主题）。
- **工具 / HTTP 路由 / webServer 服务**：**无**。不注册 `ctx.tools`、`ctx.webServer`、host 服务。
- **DOM 挂点**：注入 `<style>`（幂等，带专属标记 `data-endfield-css`，重复 apply 只保留一份）；`<body>` 上维护若干 class（`theme-endfield-wuling` / `theme-endfield-round` / `theme-endfield-surface-glass` / `-solid` / `-transparent` / `-conv` / `theme-endfield-hero-dock`）；等高线画布挂应用外框内部；`MutationObserver` 监听 `<body>` class/属性（配色切换、水印联动、等高线重绘）+ `ResizeObserver` 跟随窗口尺寸。
- **生命周期**：`ctx.effect()` 卸载钩子统一拆除令牌层、样式、rAF/interval/timeout、画布、观察器、设置卡与 DOM 节点（含动画播放中途卸载）。

### 需要的 DSH 服务与版本

- 依赖 DSH Web（client）运行时提供的 `theme`、`slots` 服务与 `styles` 内建（或安装态 bundle 的 `<style>` 注入路径）。
- 主题针对官方 DSH 升级版本做过适配（适配要点：令牌写到 `<body>` 行内、CSS-module 类名拼接、`data-phase`/`data-chat-flow` 等 data 属性挂点）。
- 兼容浏览器自动化验证环境：测试用 CDP（DevTools 协议）驱动真实浏览器、`--force-prefers-reduced-motion` 等在页面层施加系统偏好。

### 与整合包其它子插件的关系

- 在 `dsh-ventus-plugins` 中作为 **vendored 子插件**：`lib/index.js` 以 `['dsh-theme-endfield', 'dsh-theme-endfield/index.js']` 聚合挂载，client 半部内嵌进整合包 `lib/client.js`（以 `/plugins/theme-endfield/client.js` 形式加载）。
- **与 dsh-deepseek-usage 联动**：hero 贴底（`body.theme-endfield-hero-dock`，key `dsh-theme-endfield-hero-dock`）由 usage 插件的设置项切换，theme 样式表提供该 class 的 CSS 规则。
- 依赖 `dsh-client-modules`（模块加载器）把 client 代码以插件页脚形式加载。
- 无共享数据通道，与其余子插件相互独立。

## 功能适配细节

### 在整合包里的集成方式

Host 聚合挂载 + client bundle 内嵌：独立安装/卸载命令同官方 CLI（`dsh plugin --profile web add/rm`）；在整合包内由 `lib/index.js` 挂 host、`lib/client.js` 内嵌 client，随整合包单一 bundle 生效。设置卡出现在 DSH 设置 → 主题分区，id `theme-endfield`。

### 配置项与 localStorage 键（全部真实键名，均在浏览器 `localStorage`）

| 键 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dsh-theme-endfield-enabled` | `'1'` / `'0'` | 开 | 主题总开关（`!== '0'` 视为开） |
| `dsh-theme-endfield-palette` | `valley` / `wuling` | `valley` | 配色；仅精确值 `wuling` 选武陵青，其余回落谷地黄 |
| `dsh-theme-endfield-radius` | `square` / `round` | `square` | 直角 / 圆角 |
| `dsh-theme-endfield-contour` | `'1'` / `'0'` | 关 | 等高线背景（`=== '1'` 才开） |
| `dsh-theme-endfield-contour-anim` | `'1'` / `'0'` | 开 | 动态等高线（`!== '0'` 视为开） |
| `dsh-theme-endfield-watermark` | `'1'` / `'0'` | 开 | 背景水印（`!== '0'` 视为开） |
| `dsh-theme-endfield-watermark-persist` | `'1'` / `'0'` | 关 | 水印保持显示（`=== '1'` 才开） |
| `dsh-theme-endfield-loader` | `'1'` / `'0'` | 关 | 启动加载动画（`=== '1'` 才开） |
| `dsh-theme-endfield-thunder` | `'1'` / `'0'` | 关 | 雷霆大字（`=== '1'` 才开） |
| `dsh-theme-endfield-thunder-anim` | `'1'` / `'0'` | 关 | 大字入场动画（`=== '1'` 才开） |
| `dsh-theme-endfield-sidebar-surface` | `glass` / `transparent` / `solid` | `glass` | 侧边栏表面 |
| `dsh-theme-endfield-sidebar-color` | `#rrggbb` | `#101110` | 纯色表面自定义颜色（正则校验，非法回落） |
| `dsh-theme-endfield-surface-conversation` | `'1'` / `'0'` | 开 | 纯色表面应用到对话区（`!== '0'` 视为开） |
| `dsh-theme-endfield-hero-dock` | `1` / `0` | 1 | hero 贴底（**usage 插件设置项**，theme 提供 CSS） |

> 设置卡行序（源码 `slots.register` 实际渲染）：主题配色 → 等高线背景 → 动态等高线（等高线关时禁用）→ 侧边栏表面（glass/透明/自定义 + 纯色时调色盘）→ 应用到对话区（仅 solid 时出现）→ 背景水印 → 水印保持显示（水印关时禁用）→ 启动加载动画（带「预览」）→ 雷霆大字（带「预览」）→ 大字入场动画（雷霆关时禁用）→ 终末地主题（总开关）→ 主题圆角。

### 已知限制、注意事项、踩坑记录（供 DSH 升级时迭代参考）

**层叠 / 令牌结构**
- **调色板变量必须声明在 `<body>`，不能放 `:root`**：应用把令牌写成 `<body>` 行内样式，`:root` 里替换 `--dsw-*` 令牌是 *guaranteed-invalid*，计算值为空。曾导致主题滚动条一直失效（`scrollbar-color` 计算为 `auto`）。`check.js` 以结构化检查守住「无 `--edge-*` 在 `:root` 引用令牌」。
- 配色切换靠 class 翻转成立的前提是「令牌写成 body 行内样式」——若 DSH 某版本把令牌层改为其它机制（如写 `:root`、用 CSS 文件），`--dsw-alias-brand-primary: var(--edge-accent)` 的自动重解析会失效，切换将需要重新注册令牌层。
- 强调色统一写 hex；保留 `--edge-accent-rgb` 通道列表供约 30 处 `rgba(var(--edge-accent-rgb), α)` 半透明色块使用（`color-mix()` 序列化形式不同，改造成本高，保留）。
- 渐变文字（回合状态标签）**写 `color:` 无效**，只能改 `background-image`；且不能动共享的 `--dsw-static-deepseek-500/200`（同时支撑按钮填充、业务状态主色与气泡高亮）。

**选择器坑**
- `[class$='_inspectButton']` 匹配不到：属性后缀选择器要求整个 class 属性以该串结尾，上游会自由拼接第二个类。同类按钮改为**逐个点名**。
- `[class$='_arrow']` 会误伤轨迹/工作区同后缀元素（它们无 hover 填充），只点名真正拿强调底的附件箭头。
- 上游 CSS-module 类名拼接方式随构建工具变化（`<hash>_root` vs `_root_<hash>`），主题优先用 `data-*` 属性挂点匹配。

**等高线**
- 等高线层曾因 grid 容器内绝对定位解析异常（wrapper 实测 56px）从「应用外框内部」移到 body 首子节点；若 DSH 升级改变外框结构，挂点需复查。
- 三个元素用不透明 `--dsw-alias-bg-base` 盖住 body 级图层，图层挂载期间需把外框/对话列/详情列底色置透明（`:has()` 守卫，功能关闭时规则失效）。
- 重启动态等高线时第一帧必须按标称帧推进（`dt=0` 是空转帧）；随机种子每次加载重抽（`crypto.getRandomValues`），同一次加载内保持确定性（resize 重建时地形复现）。
- 过滤小环/画布外碎屑时，判定几何与绘制几何不同（二次曲线端点取线段中点），阈值需留余量（长度 ×1.35、环包围盒 ×1.5）。
- 稀疏图案「看起来对称」必须算零假设基线再下结论。

**渲染环境**
- headless/后台标签页 rAF 会在首帧后停摆：加载动画用双时钟 + 独立保险丝 `setTimeout`（不随 `clearLoaderTimers()` 清除），否则全屏遮罩会永久留在屏幕。
- 收尾动画必须 JS 按墙钟逐帧驱动，不能依赖 CSS transition（验证渲染器不触发 transition 事件）。
- CSS 模板字符串内**不能出现反引号与 `${…}`**（注释里也不行），注释必须成对；`node --check` 查不出这些破坏。校验脚本另检查「顶层漏进散文」。

**清理与幂等**
- 样式清理只认专属标记 `data-endfield-css`，不能用泛化选择器——曾误删其它插件（usage 的 `data-dsu-css`）样式。整合包内任何手写 `<style>` 都应带 `data-plugin` 标记，且不得依赖本主题的清理逻辑。
- apply() 幂等：`window.__dshThemeEndfieldApplied` 标记防止重复 apply 时二次 `overrideTokens` 破坏 dispose 链路。
- `sessions` 服务必须延迟解析（不可在 apply() 时缓存），否则加载顺序一变雷霆大字整季失效；但整个 theme 声明 `inject` 又会让令牌/样式挂载被拖入 pending。两者取后者延迟解析方案。

**其它**
- 「水印保持显示」开关依赖「背景水印」先开启（未开启时按钮 disabled）。
- 所有动效类功能（等高线动画、加载动画、雷霆入场动画）都尊重 `prefers-reduced-motion`；等高线静态图案不受此偏好影响。
- 圆角模式下设置卡按钮读官方 token 回退（`var(--dsw-alias-state-business-primary)`），主题关闭后样式随样式表移除、按钮回官方配色。
