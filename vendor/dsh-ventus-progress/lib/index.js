import { copyFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import "@deepseek-ai/dsh-host-webserver";
//#region src/host/store.ts
var ProgressStore = class {
	fallbackTimeoutMs;
	bySubagent = /* @__PURE__ */ new Map();
	constructor(fallbackTimeoutMs) {
		this.fallbackTimeoutMs = fallbackTimeoutMs;
	}
	/** 记录一次上报（覆盖该子代理的最新进度）。 */
	set(subagentId, model, now = Date.now()) {
		const existing = this.bySubagent.get(subagentId);
		this.bySubagent.set(subagentId, {
			subagentId,
			model,
			updatedAt: now,
			parseErrors: existing?.parseErrors ?? 0
		});
	}
	/** 记录一次解析错误（保留上次快照）。 */
	markParseError(subagentId, now = Date.now()) {
		const existing = this.bySubagent.get(subagentId);
		if (existing === void 0) return;
		this.bySubagent.set(subagentId, {
			...existing,
			parseErrors: existing.parseErrors + 1,
			updatedAt: now
		});
	}
	get(subagentId) {
		return this.bySubagent.get(subagentId);
	}
	/** 所有未过期进度（客户端列表用）。 */
	list(now = Date.now()) {
		const out = [];
		for (const snapshot of this.bySubagent.values()) {
			if (snapshot.model.finished) {
				out.push(toEntry(snapshot));
				continue;
			}
			if (now - snapshot.updatedAt <= this.fallbackTimeoutMs) out.push(toEntry(snapshot));
		}
		return out.sort((a, b) => b.updatedAt - a.updatedAt);
	}
	/** 移除指定子代理的进度（子代理结束/清理）。 */
	remove(subagentId) {
		this.bySubagent.delete(subagentId);
	}
	/** 清理超时未更新的非完成进度。 */
	expire(now = Date.now()) {
		for (const [id, snapshot] of this.bySubagent) if (!snapshot.model.finished && now - snapshot.updatedAt > this.fallbackTimeoutMs) this.bySubagent.delete(id);
	}
	/** 全部清空（HMR/重启兜底）。 */
	clear() {
		this.bySubagent.clear();
	}
};
function toEntry(snapshot) {
	return {
		subagentId: snapshot.subagentId,
		taskId: snapshot.model.taskId,
		taskName: snapshot.model.taskName,
		percent: snapshot.model.percent,
		currentText: snapshot.model.currentText,
		finished: snapshot.model.finished,
		stages: snapshot.model.stages,
		updatedAt: snapshot.updatedAt
	};
}
//#endregion
//#region src/host/parser.ts
/** progress-json 围栏正则（兼容带/不带语言标记）。 */
const FENCE = /```progress-json\s*([\s\S]*?)```/g;
/** 提取文本中第一个合法的 progress-json 块；无则返回 null。 */
function extractProgressJson(text) {
	FENCE.lastIndex = 0;
	for (let match = FENCE.exec(text); match !== null; match = FENCE.exec(text)) {
		const raw = match[1]?.trim();
		if (raw === void 0 || raw === "") continue;
		try {
			const model = normalizeProgress(JSON.parse(raw));
			if (model !== null) return model;
		} catch {}
	}
	return null;
}
const STAGE_STATUSES = [
	"pending",
	"running",
	"completed",
	"failed"
];
/** 校验并归一化进度模型；非法返回 null。 */
function normalizeProgress(value) {
	if (value === null || typeof value !== "object") return null;
	const record = value;
	const taskId = typeof record.taskId === "string" ? record.taskId.trim() : "";
	if (taskId === "") return null;
	const taskName = typeof record.taskName === "string" ? record.taskName.trim().slice(0, 40) : "";
	const percent = clampNumber(record.percent, 0, 100, 0);
	const currentText = typeof record.currentText === "string" ? record.currentText.slice(0, 80) : "";
	const finished = record.finished === true;
	const stages = normalizeStages(record.stages);
	if (stages.length === 0) return null;
	return {
		taskId,
		taskName,
		percent,
		currentText,
		finished,
		stages
	};
}
function normalizeStages(value) {
	if (!Array.isArray(value)) return [];
	const stages = [];
	for (const raw of value.slice(0, 12)) {
		if (raw === null || typeof raw !== "object") continue;
		const record = raw;
		const id = typeof record.id === "string" ? record.id.trim() : "";
		if (id === "") continue;
		const label = typeof record.label === "string" ? record.label.trim().slice(0, 12) : id;
		const status = STAGE_STATUSES.includes(record.status) ? record.status : "pending";
		stages.push({
			id,
			label,
			weight: clampNumber(record.weight, 1, 100, 1),
			status,
			subPercent: clampNumber(record.subPercent, 0, 100, 0),
			runningCondition: typeof record.runningCondition === "string" ? record.runningCondition : void 0,
			doneCondition: typeof record.doneCondition === "string" ? record.doneCondition : void 0
		});
	}
	return stages;
}
function clampNumber(value, min, max, fallback) {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}
//#endregion
//#region src/index.ts
/**
* dsh-ventus-progress — 子代理任务进度显示插件（host 半身）。
*
* 监听 `session/event`，从子代理的 assistant 文本中提取 `progress-json` 块，
* 按 subagentId 存储；提供 GET /api/ventus-progress/list 供 client 轮询。
* 首次启动时把自带 skill 复制到 $DSH_HOME/skills/ventus-progress/（幂等）。
*/
const name = "dsh-ventus-progress";
const inject = ["webServer"];
/** 从 assistant 消息的文本块中提取进度模型（纯函数，便于测试）。 */
function extractFromMessage(content) {
	if (Array.isArray(content)) return content.filter((block) => block !== null && typeof block === "object" && block.type === "text").map((block) => typeof block.text === "string" ? block.text : "").join("\n");
	return "";
}
function apply(ctx, config = {}) {
	const cfg = {
		fallbackTimeoutMs: config.fallbackTimeoutMs ?? 3e4,
		cleanupIntervalMs: config.cleanupIntervalMs ?? 1e4
	};
	const store = new ProgressStore(cfg.fallbackTimeoutMs);
	ctx.on("session/event", (session, event) => {
		if (event?.type !== "assistant/message") return;
		if (session.header?.origin !== "subagent") return;
		const message = event.message;
		if (message === void 0 || message === null) return;
		const content = message.content;
		if (content === void 0) return;
		const model = extractProgressJson(extractFromMessage(content));
		if (model === null) {
			store.markParseError(session.id);
			return;
		}
		store.set(session.id, model);
	});
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: "/api/ventus-progress/list",
		handler: (req, res) => {
			if (req.method !== "GET") {
				res.writeHead(405, { "content-type": "application/json" });
				res.end(JSON.stringify({
					ok: false,
					error: "GET required"
				}));
				return;
			}
			const entries = store.list();
			res.writeHead(200, {
				"content-type": "application/json",
				"cache-control": "no-store"
			});
			res.end(JSON.stringify({
				ok: true,
				entries
			}));
		}
	}));
	const timer = setInterval(() => store.expire(), cfg.cleanupIntervalMs);
	ctx.effect(() => () => clearInterval(timer), "ventus-progress: cleanup timer");
	installSkill(ctx).catch((error) => {
		ctx.logger?.warn?.(`[ventus-progress] skill install failed: ${String(error)}`);
	});
}
/** 复制 skills/ventus-progress/SKILL.md 到 DSH_HOME/skills/ventus-progress/。 */
async function installSkill(ctx) {
	const targetDir = join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "skills", "ventus-progress");
	await mkdir(targetDir, { recursive: true });
	const sourceDir = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "ventus-progress");
	const files = await readdir(sourceDir).catch(() => []);
	for (const file of files) {
		const target = join(targetDir, file);
		if (existsSync(target)) continue;
		await copyFile(join(sourceDir, file), target);
	}
}
//#endregion
export { apply, inject, name };
