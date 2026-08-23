---
name: ventus-progress
description: 子代理任务进度显示。当任务可拆分为多个可观察阶段时，按约定输出进度模型 JSON，供前端分段进度条渲染。触发词：「输出进度」「进度模型」「多阶段任务」「阶段判断」。
metadata:
  trigger: 输出进度模型 / 多阶段任务执行
---

# 子代理任务进度显示协议

当用户给出的任务可以拆分为多个可观察阶段，并且你正在作为子代理执行该任务时，
请按以下规则输出一个「进度模型」，供前端进度条渲染。

## 输出时机

- 任务开始时输出一次完整进度模型；
- 之后每个阶段状态变化时，输出一次更新；
- 无法精确判断阶段时，可每 10–20 秒输出一次估算更新。

## 输出格式

输出一段 JSON，包裹在标记 ```` ```progress-json ... ``` ```` 中，不要输出其他解释文字。

## 字段说明

- `taskId`：本次子代理任务的稳定 ID；
- `taskName`：任务短名称；
- `percent`：0–100 的总进度；
- `stages`：阶段数组，每个阶段包含：
  - `id`：阶段 ID；
  - `label`：显示名称，≤6 个汉字或 ≤12 个英文字符；
  - `weight`：权重，全部阶段权重之和为 100；
  - `status`：`pending` / `running` / `completed` / `failed`；
  - `subPercent`：当前阶段内部 0–100 的子进度；
  - `runningCondition`：用自然语言描述「判定为运行中」的条件；
  - `doneCondition`：用自然语言描述「判定为完成」的条件；
- `currentText`：当前正在执行的任务文字，例如「正在执行：TTS 第 3/10 句」；
- `finished`：是否全部结束。

## 约束

- 不要为了显示进度而虚构阶段；任务不适合拆分时不要输出任何 `progress-json`。
- `label` 必须短，避免 UI 拥挤。
- `percent` 应尽量准连续变化，避免长时间跳变。

## 示例（视频生成流）

```progress-json
{
  "taskId": "video-3-4",
  "taskName": "3.4 视频生成",
  "percent": 62,
  "currentText": "正在执行：TTS 第 3/10 句",
  "finished": false,
  "stages": [
    { "id": "split", "label": "分句", "weight": 10, "status": "completed", "subPercent": 100 },
    { "id": "tts", "label": "TTS", "weight": 50, "status": "running", "subPercent": 30 },
    { "id": "render", "label": "视频生成", "weight": 30, "status": "pending", "subPercent": 0 },
    { "id": "mux", "label": "合成", "weight": 10, "status": "pending", "subPercent": 0 }
  ]
}
```

## 阶段内部子进度参考

- TTS：`subPercent = 已完成句子数 / 总句子数 × 100`
- 视频渲染：`subPercent = 已生成帧数 / 预计总帧数 × 100`
- 合成：`subPercent = 已处理时长 / 总时长 × 100`
- 总进度：`percent = Σ(completed 阶段 weight) + running 阶段 weight × subPercent/100`
