# 科研工作流（dsh-ventus-research）— 整合包内功能说明

## 功能描述

### 一句话定位

把科研循环建模成 **claim 生命周期**（推导 → 验证 → 证据 → 裁决 → 成稿），
全部沉淀进 `.rb-state.json`（唯一可信源），以 `rb_verify` 硬闸门 +
signature token 人工裁决保证「任何结论一键追溯、AI 无法绕过人工签字」。

### 核心功能清单（7 个工具）

全部工具经 `ctx.tools.register(defineTool(...))` 注册，输入输出符合
output.schema 的结构化对象，`execute` 返回即可直接渲染给模型。

| 工具 | 输入 | 输出 / 行为 |
|---|---|---|
| `rb_open` | `topic` | 科研工作流立项/上下文重建。给定课题名，从 `.rb-state.json` 三源重建 ≤30 行 briefing；state 缺失时建立目录契约并标 `trust: low`，否则 `trust: high`。设置「当前课题」根目录（模块级内存态 `currentRoot`），后续工具都以此根定位状态文件。 |
| `rb_derive` | `claim_id, text?, convention_id?, expression` | 为 claim 写推导文件 `notes/derivations/<claim>.md`（含表达式与声明文本），版本 +1，登记 derivation 资产。claim 不存在则新建（新建必填 `text`）；已存在则 version+1 并重置状态为 derived（旧验证作废）。指定未声明的 `convention_id` 返回 `CONVENTION_UNKNOWN`；frozen（已裁决/已发布）的 claim 拒绝修改。 |
| `rb_verify` | `claim_id, script, tol_class?` | 数值交叉验证（硬闸门）。**不自行执行 verifier 脚本**，要求先用 `run_code` 生成 `data/verify_<claim_id>.json`，本工具只读该 JSON 做纯函数判定。误差解析支持 `{err}`、`{relative_error}`、`{result,expected}`、`{results:[],expected:[]}` 四种形态；`err<=pass→PASS`、`err<=warn→WARN`、否则 FAIL。PASS→`verified`、WARN→`needs-review`、FAIL→`mismatch`。`script` 参数登记为 verifier 资产（已有 .py 路径直接登记，否则写入 `sim/py_<claim>.py`）。 |
| `rb_evidence` | `claim_id, source, year?, ref?, stance?, relation?, link?` | 为 `verified` 的 claim 建证据条目并追加 `notes/evidence_ledger.md` 台账，claim 进入 `evidenced`。`stance` 只接受 `support/limit/counter`，缺省 `pending`（待人工确认），确认前不可裁决。登记 evidence-card 资产（台账文件本身）。 |
| `rb_adjudicate` | `claim_id, verdict, note?, signature_token` | 观点—证据—裁决（**人工裁决点**）。校验一次性 signature token（从 `POST /research-bench/sign` 获取，5 分钟有效、单次使用）；无令牌返回 `NEEDS_HUMAN_SIGNATURE`，AI 技术上无法绕过。`verdict` 限 `accepted/limited/rejected`。成功则 claim 进入 `adjudicated` 并冻结（`frozen=true`），写入 `adjudications[]` 记录。前置：claim 需 `evidenced` 且全部证据 stance 已人工确认。 |
| `rb_paper` | `claim_ids[], page_budget?, title?` | LaTeX 成稿。逐 claim 过硬闸门 `gateNoVerify`（无 verify_ref 或未裁决 → `GATE_NO_VERIFY` 拒绝整批），全部通过才生成 `notes/sec_<topic>.tex` 骨架与 `main.tex`（`\input` 引用），并尝试 xelatex 两遍编译写入 `build_log[]`。已裁决 claim 的 `texRef` 更新；MVP 写 tex 后不自动转 `published`（published 需人工定稿签字，属后续 finalize 流程）。 |
| `rb_memory_sync` | `facts[], project_scope?` | 长期记忆暂存。把待写事实暂存到 `.rb-state.json` 的 `pendingMemory[]`，由人类在记忆面板确认后再写入 dsh-memory；MVP 不直接写 dsh-memory（避免依赖未定契约）。`project_scope` 缺省 true（项目级）。 |

### 闸门与状态机（纯函数，无 IO，可独立单测）

- `verdict(err, band)`：三向分流。`err<=pass→PASS`，`err<=warn→WARN`，否则 FAIL。
  负数按 0（完美匹配）处理；NaN/Infinity 保守归 FAIL。
- `gateNoVerify(claim)`：硬闸门。必须存在非空 `verifyRef` **且** 状态为 `adjudicated` 才 PASS，
  否则 `GATE_NO_VERIFY`（写 tex 前必须过）。
- `gateConvention(a, b)`：口径拒绝。两侧 `convention_id` 不一致或任一侧未声明 → `CONVENTION_MISMATCH`（跨口径比较直接拒绝）。
- `transition(from, action)`：claim 状态机合法迁移表，非法动作返回 null（调用方据此拒绝并报错）。

claim 9 态生命周期：

```
draft → derived → verified → evidenced → adjudicated → published → superseded
           ↘ WARN → needs-review ↗        (人工)       (人工)      (人工)
           ↘ FAIL → mismatch ↗
```

- 旁路：`needs-review` / `mismatch` 均可经 `review-fix` 复位回 `derived`，或经 `verify-pass` 直通 `verified`。
- 状态动作全集：`derive / verify-pass / verify-warn / verify-fail / review-fix / evidence / adjudicate / publish / supersede`。
- 唯一可信源 schema：`rb/1`。结构校验 `isRbState`：必须 `schema==='rb/1'` 且 topic/root 为字符串、
  八个关键数组（conventions/claims/assets/evidence/adjudications/buildLog/opsLog/pendingMemory）齐全。

## 兼容与依赖

### package.json 依赖

- **peerDependencies**：
  - `@deepseek-ai/cordis` ≥4（宿主框架）
  - `@deepseek-ai/dsh-host-webserver` ≥0.1.0-rc.6（sign 路由 HTTP 服务）
  - `@deepseek-ai/dsh-tools` ≥0.1.0-rc.6（工具注册 defineTool）
- **dependencies**：`schemastery` ^3.18.0（Config schema 声明）
- **devDependencies**：`@types/node` ^22.20.0、`typescript` ~5.7.2（构建期，运行时不需要）
- 包形态：`type: module`（ESM），`main`/`types` 指向 `lib/` 构建产物；`exports` 另暴露 `./cordis.patch.yml`。

### host / client 形态

- **纯 host 侧插件**：入口 `src/index.ts` 导出 `name` / `Config` / `apply`，无 client bundle、无前端、
  无 localStorage 键。所有逻辑跑在 DSH 宿主进程。
- 挂载方式为 **独立 bundle 行**：package.json 的 `dsh.bundle.patch` 指向 `cordis.patch.yml`，
  由 patch 文件把 `ventus-research` 行插入宿主插件列表（见下）。

### 注册点（从 src 提炼）

- **插件名**：`export const name = 'dsh-ventus-research'`（稳定 cordis 插件名，匹配 cordis.patch.yml 的 insert id）。
- **服务注入**：`export const inject = ['tools']` —— tools 是必需服务。
- **7 个工具注册**：`ctx.tools.register(defineTool(...))`，经 `ctx.effect(...)` 包裹，卸载/HMR 自动清理。
  工具名：`rb_open / rb_derive / rb_verify / rb_evidence / rb_adjudicate / rb_paper / rb_memory_sync`。
- **HTTP 路由**：`ctx.webServer.register({ kind: 'exact', path: '/research-bench/sign', handler })`，
  同样经 `ctx.effect` 包裹。handler 是 node 原生 `(req, res)`，`readJsonBody` 上限 16KB。
- **配置 schema**：`export const Config = z.object({ tolClasses: z.dict(...).default({}) })`。
- **工作区定位**：课题根取自 `exec.agent.session.header.cwd`（`cwdOf`），即
  `join(cwd, 'LaTeXDoc', topic)`；`rb_open` 建立的内存态 `currentRoot` 提供 `setCurrentBenchRoot` / `getCurrentBenchRoot`。

### 需要的 DSH 服务与版本要求

- 必需：`tools` 服务（`@deepseek-ai/dsh-tools`，注入声明 `inject: ['tools']`）。
- 可选：`webServer` 服务（`@deepseek-ai/dsh-host-webserver`）。`apply` 里用
  `ctx.get('webServer') !== undefined` 判断——无 webServer 的 profile（如 headless）会**跳过**
  sign 路由，7 个工具照常可用，不拖垮宿主组合。
- 框架版本下限：cordis ≥4、dsh-host-webserver ≥0.1.0-rc.6、dsh-tools ≥0.1.0-rc.6。

### 与整合包其它子插件的关系

- **完全独立**：不依赖整合包其它子插件（dsh-ventus-search / dsh-ventus-whale / dsh-ventus-progress 等），
  也不成为任何插件的依赖。以独立 fiber 加载——失败/禁用只影响本 fiber。
- 与聚合行（ventus-plugins）**并列挂载**：删除 `cordis.patch.yml` 里的 `ventus-research` 行即完全退场。

## 功能适配细节

### 在整合包里的集成方式

- 由 `cordis.patch.yml` 的 insert 行挂载：`{ id: ventus-research, name: dsh-ventus-research, config: {} }`，
  与整合包聚合行并列，作为独立 fiber 加载。
- 安装：在整合包仓库根执行 `dsh plugin --profile web add "<仓库>/dsh-ventus-research"`；
  本地开发可 `cd dsh-ventus-research && DSH_CHECKOUT=<harness> bash scripts/build.sh`。
- 安装后**重启 DSH** 生效；验证：`dsh --profile web --dump-config` 应出现 `ventus-research` 层。
- 构建：`scripts/build.sh` 用 DSH checkout 的 tsc 把 `src/` 编译到 `lib/`；依赖以 junction/符号链接
  挂到 DSH checkout（cordis → vendor/cordis、dsh-tools → packages/core/tools 等），
  Windows 下用 junction。`npm test` 跑 `lib/gates.spec.js`（纯函数单测）。

### 配置项

- 唯一配置：`tolClasses`（`Record<string, { pass: number; warn: number }>`）——
  自定义误差档位覆盖。缺省三档：`A {pass:1e-3, warn:1e-2}`、`B {pass:1e-2, warn:5e-2}`、
  `C {pass:1e-1, warn:5e-1}`，`rb_verify` 缺省按 claim 的 `tolClass`（默认 B）。
- **无 localStorage 键**（纯 host 侧、无前端）。
- 内部内存态：`currentRoot`（当前课题根，模块级单例），`signatureTokens`（进程级 TokenStore 单例）。

### 目录契约（`LaTeXDoc/<Topic>/`）

```
LaTeXDoc/<Topic>/
├── .rb-state.json          # 唯一可信源（schema rb/1）
├── sim/                    # verifier 脚本（py_<claim>.py，由 rb_verify 写入）
├── data/                   # verify_<claim>.json（由模型 run_code 生成，rb_verify 只读）
├── figs/
├── notes/
│   ├── derivations/<claim>.md   # 推导文件（rb_derive 写）
│   └── evidence_ledger.md       # 证据台账（rb_evidence 追加）
└── main.tex               # rb_paper 生成的论文主文件
```

- 目录常量：`TOPIC_DIRS = ['sim','data','figs','notes']`，`NOTES_SUBDIRS = ['derivations']`。
- 写盘为**原子发布**：同目录 tmp + fsync + rename（0600 权限），读改写在同一同步块内，
  node 单线程下天然串行，避免并发交错覆盖。
- 编号规则：claim `C-001…`（nextClaimId）、证据 `E-001…`（nextEvidenceId）、
  资产 `asset-<kind>-001…`（kind ∈ derivation/verifier/evidence-card）。
- 资产登记带 SHA-256 hash；`scanAssets` 在 rb_open 时扫描未登记资产
  （`sim/py_*.py`→verifier、`notes/derivations/*.md`→derivation、`notes/evidence_*.md`→evidence-card），hash 去重，纳入 briefing 展示。
- `.rb-state.json` 顶层字段：schema/topic/root/conventions/claims/assets/evidence/adjudications/
  buildLog/opsLog/lastOpened/briefingCache/pendingMemory。

### 已知限制、注意事项、踩坑记录（供升级迭代参考）

- **currentRoot 是模块级内存态**：DSH 重启后需重新 `rb_open`；`/research-bench/sign` 也依赖它
  （校验 claim 存在与版本匹配）。状态文件本身持久，重启不丢，但「当前课题」指针会重置。
- **沙箱边界（有意设计）**：`rb_verify` 不执行 verifier 脚本、`rb_paper` 不执行任意代码，
  避免绕过 DSH 的 run_code 沙箱。流程必须是：模型 `run_code` 跑脚本生成
  `data/verify_<claim>.json` → 调 `rb_verify` 做纯函数判定。
- **signature token 语义**：5 分钟有效（`SIGNATURE_TTL_MS = 300_000`）、单次使用
  （`consume` 无论成败都删除）；claim_id + revision 需匹配（先 `rb_open` 才能签）。
  token 表在 host 进程内，DSH 单实例即可，多实例/重启后 token 失效属正常。
- **frozen 保护**：`rb_adjudicate` 成功后 claim `frozen=true`，`rb_derive` / `rb_verify` 对 frozen claim 拒绝修改。
- **旧验证作废**：`rb_derive` 对已有 claim 做新版本推导后状态重置为 `derived`，原 verify_ref 随之作废，
  需重新验证与裁决才能再进 `rb_paper` 闸门。
- **rb_paper 依赖探测式弱依赖**：xelatex 未安装或编译失败时 `build_status` 为 `no_latex` /
  `compile_failed`，但 tex 骨架仍生成；MVP 不自动转 `published`（published 需人工定稿签字，后续 finalize 流程）。
- **rb_memory_sync 只暂存**：不直接写 dsh-memory（避免依赖未定契约），需人工在记忆面板确认。
- **rb_evidence 的 stance 确认**：`pending`（缺省）时 `verifiedBy` 置 `pending-confirm`，确认前不可进裁决。
- **口径纪律**：未声明 `convention_id` 时 `rb_derive` 报 `CONVENTION_UNKNOWN`；跨口径比较被 `gateConvention` 拒绝。
- **verify JSON 解析失败/无法提取误差** 时工具报错并给出支持格式提示（err / relative_error /
  result+expected / results+expected 四选一）。
- 工具间的顺序约束严格：draft→(rb_derive)→derived→(rb_verify)→verified→(rb_evidence)→evidenced→
  (rb_adjudicate)→adjudicated→(rb_paper)。非法迁移被状态机拒绝并返回具体错误。
- 升级 DSH 版本时关注：`@deepseek-ai/dsh-tools` 的 `defineTool` / output.schema 约定、
  `@deepseek-ai/dsh-host-webserver` 的 `webServer.register` 签名（`kind: 'exact'`）、
  cordis ≥4 的 `ctx.effect` / `ctx.get` 语义——这些是本插件对接宿主的关键 API 面。
