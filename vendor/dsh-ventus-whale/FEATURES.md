# 虎鲸桌宠（dsh-ventus-whale）— 整合包内功能说明

## 功能描述

**一句话定位**：一只由 DeepSeek 虎鲸 logo 轮廓 swept 重建的可交互 3D 桌宠，以透明背景浮窗形式悬浮在 DSH Web GUI 上，支持旋转查看、拖拽定位、喷爱心、翻跟头等互动，并自带设置页。

**核心功能清单**（均从 `src/` 与 README 提炼）：

1. **3D 模型**（`src/client/whale-model.ts`）
   - 由 DeepSeek 虎鲸 logo 轮廓 swept 重建，含尾鳍 / 背鳍 / 胸鳍；着色器实现 logo 眼斑图案
   - 眨眼动画：`BLINK_INTERVAL=3.4s`、`BLINK_DURATION=0.2s`，按时间周期缩放眼睑
   - 透明背景（`renderer.setClearColor(0x000000, 0)`），无 OrbitControls，自研旋转/姿态逻辑
   - 空闲摇摆（idle sway：pitch / body / roll 三轴）、呼吸、尾鳍/胸鳍摆动
   - 几何精简：默认尺寸下约 1728 个三角形，肉眼无差

2. **交互**（`src/client/WhalePet.tsx`）
   - 左键拖拽旋转：水平拖 = yaw、垂直拖 = pitch，带惯性动量；灵敏度系数 0.0033 / 0.0027，默认 sensitivity=1.0 体感适中
   - 右键拖拽或悬停工具栏「拖动」按钮：自由定位（持久化为 x/y，钳制在视口内）
   - 单击：头顶喷 3–5 个 sprite 爱心（跟随虎鲸旋转）；右键点击也补一次喷发
   - 双击：虎鲸弹跳（受重力模拟）
   - 悬停工具栏两行：改名 / 重置 / 拖动 · 爱心开关 / 转圈；触屏（`hover: none`）改为点按切换面板显隐
   - 移动模式：拖到视口外自动钳制，松手持久化，Esc 或点击面板外退出

3. **翻跟头**（360° 前空翻）
   - 发送消息自动触发：Enter 且不带 Shift、非 IME 组合（`isComposing` 跳过）、非自动重复、焦点在 INPUT/TEXTAREA 内、且不在桌宠自身窗口内时触发
   - 受 `flipOnSend` 门控；悬停工具栏「转圈」按钮可手动触发
   - 翻跟头在世界 X 轴上旋转（始终面向相机），不与拖拽动量/空闲摇摆冲突

4. **设置**（`src/client/WhaleSettingsCard.tsx`）
   - 启用开关、发送时翻跟头、大小（0.2×–3×）、灵敏度（0.2×–5×）、显示文字（≤80 字符）
   - 草稿式「保存 / 取消」：所有控件只写本地草稿并广播 `WHALE_PREVIEW_EVENT` 实时预览，点「保存」才一次性提交 host API；「取消」丢弃草稿还原
   - 虎鲸自身交互（拖拽定位、悬停改名）仍即时持久化，不受保存语义影响

5. **轻量化**（README + 源码）
   - three.js 内联进 client bundle（gzip ≈124KB）
   - 空闲降帧：每 3 帧才绘制一次 WebGL（`t11`），悬停/拖拽/粒子/跳跃/翻转期间恢复全帧率
   - 停用时暂停渲染循环（`scene.pause()`），隐藏时零渲染；场景只创建一次，启用/停用只切换 `display`，召唤即时出现
   - 悬停射线命中按帧节流，pointermove 不再逐事件全模型相交测试

6. **Ventus 系列共享 UI 偏好**（`src/client/ventus-prefs.ts`）
   - 缓存命中两位小数：把输入框下方「缓存命中 x%」重写为两位小数
   - 对话横向宽度不限制：把 `--dsh-chat-content-width` 改为 100%，不再固定 748px

## 兼容与依赖

**package.json 关键声明**：
- `peerDependencies`（都要求 `^0.1.0-rc.6` 版本族）：
  - `@deepseek-ai/dsh-client-runtime`
  - `@deepseek-ai/dsh-client-ui-settings`
  - `@deepseek-ai/dsh-client-ui-slots`
  - `@deepseek-ai/dsh-host-webserver`
  - `@deepseek-ai/dsh-settings`
  - `react` / `react-dom`（`^18.2.0`）
- `devDependencies` 中另有 `@deepseek-ai/cordis` `^4.0.1`、`schemastery`、`three@0.147.0`（运行时依赖内联进 client bundle）
- `engines.node`: `^22.19.0 || >=24.0.0`；`packageManager`: `pnpm@11.7.0`

**host / client 形态**：
- **host 半身**：`src/index.ts` + `src/host.ts` + `src/routes.ts`，Cordis 插件 `name = 'ventus-whale'`，`inject = ['webServer']`，负责挂路由和设置 section
- **client 半身**：`src/client/index.tsx`（入口，`inject = ['slots']`）+ 各组件，运行在 DSH Web GUI 里
- `dsh.client.inject` 声明了 client 运行时代码需要注入的 `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-settings`、`@deepseek-ai/dsh-client-ui-slots`；`dsh.client.platform = 'web'`
- **bundle 层**：`cordis.patch.yml` 在启动时向 bundle 层插入 `dsh-ventus-whale` 条目

**注册点**（从 `src/` 提炼的真实注册）：
- HTTP 路由（`ctx.webServer.register`，`WebRoute kind:'exact'`，全部 loopback-only 守卫）：
  - `GET  /api/ventus-whale/state` —— 读当前配置
  - `POST /api/ventus-whale/update` —— 合并 patch 写配置（JSON body 上限 16KB）
  - `POST /api/ventus-whale/reset` —— 重置为默认配置
- 设置 section：`installSettingsSection(ctx, settingsNamespace('ventus-whale'), WHALE_SETTINGS_SCHEMA, base, ...)`，schema 字段 `enabled / flipOnSend / scale / sensitivity / caption`
- client slot 注册（`ctx.slots.inject` + `ctx.slots.register`）：
  - `settings.section`，id `ventus`，order 60，label `Ventus`，children 声明 `ventus.settings.item`（仅当 800ms 延迟后检测到其它 Ventus 插件没有先注册时才建页，否则合并）
  - `ventus.settings.item`，id `ventus-whale`，order 10（`WhaleSettingsCard`）
- body portal：`document.body.appendChild` + `createRoot` 挂载 `<WhalePet />`
- **注意**：曾注册过 `sidebar.footer.action` 召唤按钮（`WhaleSidebarEntry`），已于 2026-08-20 commit `e4ae09b` 移除，当前源码不再注册任何侧边栏入口
- 没有注册工具（tool）、没有注册服务到 `ctx` 上；`export const inject` 在 host 半身为 `['webServer']`、client 半身为 `['slots']`

**需要的 DSH 服务与版本**：`webServer`（host）、`settings`（host，缺失时降级为无设置卡但仍可用）、`slots` / `settingsScope`（client）。对 `0.1.0-rc.6` 系列的 API 形态有依赖（`installSettingsSection`、`settingsNamespace`、`WebRoute`、`slots.register`、`ctx.settingsScope`）。

**与整合包其它子插件的关系**：
- 与 dsh-deepseek-usage、dsh-ventus-search、dsh-ventus-progress、dsh-ventus-research 等同属 Ventus 系列，共享同一个「Ventus」设置页（`ventus.settings.item` slot 合并）；多个 Ventus 插件共存时只创建一个 `settings.section`
- `ventus-prefs.ts` 与 dsh-deepseek-usage 镜像同一模块，任一插件提供行为与设置面皆可
- 插件自身独立运行，不依赖整合包其它子插件；与 `dsh-better-sidebar`、`dsh-webui` 等仅共用 GUI 布局，无数据耦合

## 功能适配细节

**整合包内集成方式**：`vendor/dsh-ventus-whale/` 直接内嵌（拷入 lib + `cordis.patch.yml`），通过 bundle 层插入加载，无需构建脚本；host 半身 + client bundle 双份加载。为可选增强型插件，缺失不影响 DSH 本体。

**配置项与存储键**（全部来自源码，无编造）：
- 持久化配置：DSH 配置主目录（`DSH_HOME`，默认 `~/.dsh`）下 `dsh-ventus-whale/config.json`，原子写入（temp + rename + fsync）
  - 键：`enabled`（默认 false）、`flipOnSend`（默认 true）、`scale`（默认 1，0.2–3）、`sensitivity`（默认 1，0.2–5）、`caption`（默认 ''，≤80）、`x` / `y`（可选，缺省 = 默认停靠：视口右侧中部，right 32px / top 38%）
  - 读取时对数值做 clamp 兜底；损坏 JSON 回退默认
- localStorage 键：
  - `dsh.ventus.preferences` —— Ventus 系列共享偏好（`cacheHit2Decimals`、`fluidConversationWidth`，默认均 true），变更广播 `ventus:prefs` 事件
  - `ventus-hearts` —— 爱心开关，值 `'on'` / `'off'`（缺省 = 开）
- 事件（`window` 上）：
  - `ventus-whale:config` —— 已接受的配置更新广播（pet 与设置卡双向同步）
  - `ventus-whale:preview` —— 设置卡草稿实时预览（只驱动渲染，不视为已保存）

**已知限制 / 注意事项 / 踩坑记录**（供后续 DSH 版本升级迭代参考）：
1. **README 与当前代码不一致**：README 仍写「点侧边栏底部 🐋 按钮召唤」，但该按钮（`WhaleSidebarEntry` / `sidebar.footer.action`）已于 2026-08-20 移除，现在虎鲸显隐**仅由 Ventus 设置卡的「启用虎鲸」开关唯一控制**。升级整合包时勿按 README 找侧边栏入口。
2. **设置首次同步必须跳过保存**：`installSettingsSection` 注册时同步触发一次 `onChange`，此时 settings resolved 落在 schema 默认值上而非文件真实值；若不跳过，每次启动都会把 config.json 重置为默认（enabled=false、x/y 丢失）。
3. **设置卡不拥有 x/y**：保存草稿时只提交 schema 字段，必须 merge 当前文件里的 x/y 再落盘，否则拖拽定位会被设置保存冲掉。
4. **路由始终挂载**：即使 `enabled=false`，`/api/ventus-whale/state|update|reset` 也常驻（召唤/设置卡依赖它们），`enabled` 只控制客户端是否显示，不控制 API 存在。
5. **缓存命中重写不能监听 characterData**：重写 stats 文本若再触发自身 observer 会无限循环（点会话卡死）；只监听 childList 并按帧合并一次。
6. **空闲降帧与暂停**：停用时 `display:none` 且 `pause()` 渲染循环，避免隐藏鲸鱼仍每帧 rAF 空转拖慢整页；场景不销毁，召唤即时显示。
7. **预取时序坑**：激活时预取的缓存可能早于侧边栏召唤/隐藏，设置卡挂载时须重新拉取实时持久化配置作基准（`t15`），否则保存会把过期 `enabled` 写回去（表现为保存后虎鲸消失）。
8. **第三方 settings namespace 不可用官方 RPC**：host 的 apiproxy settings allowlist 硬编码、web-ui bridge allowlist 不含 ventus-whale，故卡片自建 `/api/ventus-whale/state` 预取兜底（`whale-config-store.ts`）。
9. **版本升级适配点**：peerDependencies 为 `0.1.0-rc.6` 系列，若 DSH 升级改变 `installSettingsSection` / `WebRoute` / `slots.register` / `ctx.settingsScope` 签名，需同步适配；Node 要求 `^22.19.0 || >=24.0.0`。
10. **位置钳制**：x/y 范围 0–10000，patch 中非有限值清除自由定位回到默认停靠；拖拽按 wrapper 实际尺寸钳制（含悬停工具栏），拖到任何边缘整只虎鲸+工具栏都留在视口内。
