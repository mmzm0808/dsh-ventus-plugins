# dsh-ventus-research — 科研工作流插件

把科研循环建模成 **claim 生命周期**：推导 → 验证 → 证据 → 裁决 → 成稿，
全部沉淀进 `.rb-state.json`（唯一可信源），`rb_verify` 硬闸门 +
signature token 人工裁决，任何结论一键追溯。

## 形态与隔离

- **独立 bundle 行**（`cordis.patch.yml` 的 `ventus-research` 行），与整合包聚合行并列挂载。
- 失败/禁用只影响本 fiber，**不影响** dsh-ventus-plugins 其它子插件；删除 patch 行即完全退场。
- 不成为任何插件的依赖；本包不依赖整合包其它子插件。

## 安装

```sh
# 从本仓库目录（整合包仓库内）安装
dsh plugin --profile web add "<本仓库绝对路径>/dsh-ventus-research"
# 或本地开发
cd dsh-ventus-research && DSH_CHECKOUT=<harness> bash scripts/build.sh
```

安装后**重启 DSH** 生效。验证：`dsh --profile web --dump-config` 应出现 `ventus-research` 层。

## 七个工具

| 工具 | 输入 | 输出 / 行为 |
|---|---|---|
| `rb_open` | `topic` | 三源重建 briefing（≤30 行）；state 缺失建目录契约标 `trust: low` |
| `rb_derive` | `claim_id, text?, convention_id?, expression` | 写 `notes/derivations/<claim>.md`，version+1，登记 derivation 资产；口径未声明 → `CONVENTION_UNKNOWN` |
| `rb_verify` | `claim_id, script, tol_class?` | 读 `data/verify_<claim>.json` 纯函数判定；PASS→verified / WARN→needs-review / FAIL→mismatch；登记 verifier 资产 |
| `rb_evidence` | `claim_id, source, year?, ref?, stance?` | 建证据条目 + 追加 `notes/evidence_ledger.md`；stance 待人工确认 |
| `rb_adjudicate` | `claim_id, verdict, note?, signature_token` | 校验一次性签字令牌；失败 → `NEEDS_HUMAN_SIGNATURE` |
| `rb_paper` | `claim_ids[], page_budget?, title?` | 硬闸门 `gateNoVerify` 全过才写 `notes/sec_<name>.tex` + `main.tex`，xelatex 两遍编译 → `build_log[]` |
| `rb_memory_sync` | `facts[], project_scope?` | 暂存 `pendingMemory[]`，人工确认后写入 dsh-memory |

## 闸门与状态机

- `verdict(err, band)`：`err<=pass → PASS`，`err<=warn → WARN`，否则 FAIL。
- `gateNoVerify(claim)`：无 `verify_ref` 或未裁决 → `GATE_NO_VERIFY`（写 tex 前必须过）。
- `gateConvention(a, b)`：convention_id 不一致或未声明 → `CONVENTION_MISMATCH`。

```
draft →derived →verified →evidenced →adjudicated →published →superseded
           ↘WARN→needs-review↗   (人工)     (人工)      (人工)
           ↘FAIL→mismatch↗
```

## 人工裁决（signature token）

AI 调用 `rb_adjudicate` 前，人类需向 DSH 获取一次性令牌（5 分钟有效、单次使用）：

```
POST /research-bench/sign
body: { claim_id: "C-014", revision: 2 }
→ { ok: true, token: "...", expires: ... }
```

获取后把 `token` 传给 `rb_adjudicate` 的 `signature_token` 参数。无令牌时工具返回
`NEEDS_HUMAN_SIGNATURE`，AI 无法绕过。

## 目录契约

```
LaTeXDoc/<Topic>/
├── .rb-state.json          # 唯一可信源
├── sim/                    # verifier 脚本（py_<claim>.py）
├── data/                   # verify_<claim>.json
├── figs/
├── notes/
│   ├── derivations/<claim>.md
│   └── evidence_ledger.md
└── main.tex
```

## 开发

```sh
npm run build       # scripts/build.sh：junction 依赖 + tsc 编译到 lib/
npm run typecheck   # tsc --noEmit
npm test            # node --test lib/gates.spec.js
```

> 沙箱边界：`rb_verify` 不自行执行 verifier 脚本（不绕过 DSH 的 run_code 沙箱）。
> 流程是：模型用 `run_code` 执行脚本生成 `data/verify_<claim>.json` → 调 `rb_verify` 做纯函数判定。
