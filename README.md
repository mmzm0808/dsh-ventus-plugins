# 🪶 dsh-ventus-plugins-min

[dsh-ventus-plugins](https://github.com/mmzm0808/dsh-ventus-plugins)（Ventus 插件全家桶）的**最小安装形态**：
同一插件的精简包，只含**用量监测**（`dsh-deepseek-usage`：悬浮球余额 / 消费 / Tokens / 命中率）。

体积小、依赖少，安装后即可用用量统计，其余子插件按需补装。

## 安装

```sh
dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins-min
```

## 补装其余子插件（升级到完整整合包）

1. 安装后**重启 dsh**；
2. 打开 **设置 → 插件 → dsh-ventus-plugins**（Ventus 设置页）；
3. 点击右上角**更新按钮**，确认后打开安装窗口；
4. 勾选要安装的子插件（主题 / 侧边栏 / 桌宠 / 搜索 / WebUI 工具链等），点「更新选中项」；
5. 更新完成后**重启 dsh** 生效。

只对勾选项执行安装，未勾选的保持不装；已装插件在有新版时也会在列表中标记「可更新」，同样按勾选更新。

> 也可直接安装完整整合包（含全部 11 个子插件）：
> `dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins`

## 包含内容

| 项 | 说明 |
|---|---|
| 聚合 host | `lib/index.js`：容错动态加载（缺哪个子插件就跳过哪个） |
| 用量监测 | `vendor/dsh-deepseek-usage/`：悬浮球 + 用量面板 + Ventus 设置页 |
| 构建脚本 | `scripts/build-client.mjs`：选择性安装后重建聚合 bundle 用 |

## 升级机制

min 包与完整包是**同一个插件**（包名均为 `dsh-ventus-plugins`）的两种形态。补装由 Ventus 设置页的更新入口执行：从整合包仓库拉取最新子插件产物覆盖到本机 `vendor/` 并重建聚合 bundle，无需重新安装插件。

## License

MIT
