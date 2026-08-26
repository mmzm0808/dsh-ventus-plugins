import z from "schemastery";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { tmpdir, homedir } from "node:os";
import { readFileSync, mkdtempSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
//#region src/client.ts
/**
* client.ts — MinerU HTTP client.
*
* Minimal fetch-based client for the MinerU FastAPI server (v3.4.4, protocol v2).
* Endpoints: GET /health, POST /tasks, GET /tasks/{id}, GET /tasks/{id}/result.
*
* Auth is optional: MinerU's open-source server has no built-in auth. When an
* API key is resolved (via the credential store or env var), it is sent as
* `Authorization: Bearer <key>`. Credential-bearing requests reject redirects.
*/
var MinerUError = class extends Error {
	status;
	body;
	constructor(message, status, body) {
		super(message);
		this.status = status;
		this.body = body;
		this.name = "MinerUError";
	}
};

function encryptApiKey(plaintext) {
	if (!plaintext) return '';
	const ps = spawnSync('powershell', ['-NoProfile', '-Command',
			"Add-Type -AssemblyName System.Security; $b = [System.Text.Encoding]::UTF8.GetBytes('" + plaintext.replace(/'/g, "''") + "'); $e = [System.Security.Cryptography.ProtectedData]::Protect($b, $null, 'CurrentUser'); [Convert]::ToBase64String($e)"]);
	if (ps.status !== 0) throw new Error('MinerU API Key 加密失败: ' + (ps.stderr?.toString() || ''));
	return ps.stdout.toString().trim();
}
function decryptApiKey(ciphertext) {
	if (!ciphertext) return '';
	const ps = spawnSync('powershell', ['-NoProfile', '-Command',
			"Add-Type -AssemblyName System.Security; $d = [Convert]::FromBase64String('" + ciphertext + "'); $r = [System.Security.Cryptography.ProtectedData]::Unprotect($d, $null, 'CurrentUser'); [System.Text.Encoding]::UTF8.GetString($r)"]);
	if (ps.status !== 0) throw new Error('MinerU API Key 解密失败: ' + (ps.stderr?.toString() || ''));
	return ps.stdout.toString().trim();
}
const MIME_BY_EXT = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".bmp": "image/bmp",
	".tiff": "image/tiff",
	".tif": "image/tiff",
	".webp": "image/webp",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};
function mimeTypeForExt(ext) {
	return MIME_BY_EXT[ext.toLowerCase()] ?? "application/octet-stream";
}
function sleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			const err = /* @__PURE__ */ new Error("Aborted");
			err.name = "AbortError";
			reject(err);
			return;
		}
		const timer = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => {
			clearTimeout(timer);
			const err = /* @__PURE__ */ new Error("Aborted");
			err.name = "AbortError";
			reject(err);
		}, { once: true });
	});
}
async function buildFormData(filePath, params) {
	const buffer = await readFile(filePath);
	const fileName = basename(filePath);
	const mime = mimeTypeForExt(extname(fileName));
	const blob = new Blob([buffer], { type: mime });
	const form = new FormData();
	form.append("files", blob, fileName);
	const appendBool = (key, val) => {
		if (val !== void 0) form.append(key, String(val));
	};
	const appendStr = (key, val) => {
		if (val !== void 0) form.append(key, val);
	};
	const appendInt = (key, val) => {
		if (val !== void 0) form.append(key, String(val));
	};
	appendStr("backend", params.backend);
	appendStr("parse_method", params.parse_method);
	appendStr("effort", params.effort);
	appendStr("server_url", params.server_url);
	appendBool("formula_enable", params.formula_enable);
	appendBool("table_enable", params.table_enable);
	appendBool("image_analysis", params.image_analysis);
	appendBool("return_md", params.return_md);
	appendBool("return_middle_json", params.return_middle_json);
	appendBool("return_model_output", params.return_model_output);
	appendBool("return_content_list", params.return_content_list);
	appendBool("return_images", params.return_images);
	appendBool("response_format_zip", params.response_format_zip);
	appendBool("return_original_file", params.return_original_file);
	appendInt("start_page_id", params.start_page_id);
	appendInt("end_page_id", params.end_page_id);
	if (params.lang_list !== void 0) for (const lang of params.lang_list) form.append("lang_list", lang);
	return form;
}
var MinerUClient = class {
	baseURL;
	timeoutMs;
	apiKeyResolver;
	constructor(opts) {
		this.mode = opts.mode ?? "local";
		this.baseURL = opts.baseURL.replace(/\/+$/, "");
		this.timeoutMs = opts.timeoutMs;
		this.cloudModelVersion = opts.cloudModelVersion ?? "vlm";
		this.apiKeyResolver = opts.apiKeyResolver;
	}
	async health(signal) {
		if (this.mode === "cloud") {
			// 云端无 /health；校验 baseURL 可达 + token（GET 根路径，401=token 无效，200=可达）。
			const controller = new AbortController();
			const onAbort = () => controller.abort();
			signal.addEventListener("abort", onAbort, { once: true });
			try {
				const apiKey = this.apiKeyResolver ? await this.apiKeyResolver() : void 0;
				const headers = {};
				if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
				const resp = await fetch(this.baseURL + "/api/v4/extract/task/health", { method: "GET", headers, signal: controller.signal });
				if (resp.status === 401 || resp.status === 403) return { status: "unhealthy", version: "cloud", queued_tasks: 0, processing_tasks: 0, completed_tasks: 0, failed_tasks: 0, max_concurrent_requests: 0, error: `云端 token 无效 (HTTP ${resp.status})` };
				return { status: "healthy", version: "cloud", queued_tasks: 0, processing_tasks: 0, completed_tasks: 0, failed_tasks: 0, max_concurrent_requests: 0 };
			} finally {
				signal.removeEventListener("abort", onAbort);
			}
		}
		return this.request("GET", "/health", void 0, signal, [200]);
	}
	async submitTask(filePath, params, signal) {
		if (this.mode === "cloud") return this.submitCloud(filePath, params, signal);
		const form = await buildFormData(filePath, params);
		return this.request("POST", "/tasks", form, signal, [202]);
	}
	async submitCloud(filePath, params, signal) {
		const buffer = await readFile(filePath);
		const fileName = basename(filePath);
		const body = JSON.stringify({ files: [{ name: fileName }], model_version: this.cloudModelVersion });
		const resp = await this.request("POST", "/api/v4/file-urls/batch", body, signal, [200]);
		const data = resp?.data ?? resp;
		if (!data || !data.file_urls || data.file_urls.length === 0) throw new MinerUError("云端未返回上传链接", 500, data);
		const uploadUrl = data.file_urls[0];
		const up = await fetch(uploadUrl, { method: "PUT", body: buffer, signal });
		if (up.status >= 300) throw new MinerUError(`云端文件上传失败: HTTP ${up.status}`, up.status);
		return { task_id: String(data.batch_id ?? resp?.data?.batch_id ?? ""), status: "pending" };
	}
	async getTaskStatus(taskId, signal) {
		if (this.mode === "cloud") {
			const resp = await this.request("GET", `/api/v4/extract-results/batch/${encodeURIComponent(taskId)}`, void 0, signal, [200]);
			return this.cloudStatus(resp);
		}
		return this.request("GET", `/tasks/${encodeURIComponent(taskId)}`, void 0, signal, [200]);
	}
	cloudStatus(resp) {
		const items = resp?.data?.extract_result ?? [];
		if (!Array.isArray(items) || items.length === 0)
			return { task_id: resp?.data?.batch_id ?? "", status: "pending" };
		const states = new Set(items.map(r => r.state ?? "pending"));
		let status = "pending";
		if (states.has("failed")) status = "failed";
		else if (states.has("running") || states.has("converting")) status = "processing";
		else if (states.has("done"))
			status = states.size === 1 && states.has("done") ? "completed" : "processing";
		const out = { task_id: resp?.data?.batch_id ?? "", status };
		const first = items[0];
		if (first?.file_name) out.file_names = [first.file_name];
		if (first?.err_msg) out.error = first.err_msg;
		return out;
	}
	async getTaskResult(taskId, signal) {
		if (this.mode === "cloud") {
			const resp = await this.request("GET", `/api/v4/extract-results/batch/${encodeURIComponent(taskId)}`, void 0, signal, [200]);
			return this.cloudResult(resp, taskId, signal);
		}
		return this.request("GET", `/tasks/${encodeURIComponent(taskId)}/result`, void 0, signal, [200]);
	}
	async cloudResult(resp, taskId, signal) {
			const items = resp?.data?.extract_result ?? [];
			if (!Array.isArray(items) || items.length === 0)
				throw new MinerUError("云端无结果数据", 404, resp);
			const r = items[0];
		const zipUrl = r.full_zip_url;
		if (!zipUrl) throw new MinerUError("云端任务未完成或无结果链接", 404, r);
		const zres = await fetch(zipUrl, { signal });
		if (zres.status >= 300) throw new MinerUError(`云端结果下载失败: HTTP ${zres.status}`, zres.status);
		const buf = Buffer.from(await zres.arrayBuffer());
		const dir = mkdtempSync(join(tmpdir(), "mineru-cloud-"));
		const zipPath = join(dir, "result.zip");
		await writeFile(zipPath, buf);
		let md;
		try {
			const tar = spawnSync("tar", ["-xf", zipPath, "-C", dir]);
			if (tar.status !== 0) {
				spawnSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -Path '${zipPath}' -DestinationPath '${dir}' -Force`]);
			}
			md = readFileSync(join(dir, "full.md"), "utf8");
		} catch (e) {
			throw new MinerUError(`云端结果解压失败: ${e?.message ?? e}`, 500);
		}
		const stem = r.file_name ? String(r.file_name).replace(/\.[^.]+$/, "") : "document";
		return { task_id: taskId, results: { [stem]: { md_content: md } } };
	}
	async request(method, path, body, parentSignal, acceptedStatuses) {
		parentSignal.throwIfAborted();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
		const onParentAbort = () => controller.abort();
		parentSignal.addEventListener("abort", onParentAbort, { once: true });
		try {
			const apiKey = this.apiKeyResolver ? await this.apiKeyResolver() : void 0;
			parentSignal.throwIfAborted();
			const headers = {};
			if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
			if (typeof body === "string") headers["content-type"] = "application/json";
			const response = await fetch(`${this.baseURL}${path}`, {
				method,
				headers,
				body,
				signal: controller.signal,
				redirect: apiKey ? "error" : "follow"
			});
			const status = response.status;
			if (!acceptedStatuses.includes(status)) {
				let errorBody;
				try {
					errorBody = await response.json();
				} catch {
					try {
						errorBody = await response.text();
					} catch {
						errorBody = null;
					}
				}
				throw new MinerUError(`MinerU ${method} ${path} returned ${status}`, status, errorBody);
			}
			const contentType = response.headers.get("content-type") ?? "";
			if (!contentType.includes("application/json")) throw new MinerUError(`MinerU ${method} ${path} returned non-JSON content-type: ${contentType}`, status, null);
			return await response.json();
		} finally {
			clearTimeout(timeoutId);
			parentSignal.removeEventListener("abort", onParentAbort);
		}
	}
};
async function pollUntilDone(client, taskId, opts) {
	const deadline = Date.now() + opts.timeoutMs;
	for (;;) {
		opts.signal.throwIfAborted();
		const status = await client.getTaskStatus(taskId, opts.signal);
		if (status.status === "completed" || status.status === "failed") return status;
		if (Date.now() >= deadline) throw new MinerUError(`Polling timed out after ${opts.timeoutMs}ms for task ${taskId}`, 408, status);
		await sleep(opts.intervalMs, opts.signal);
	}
}
//#endregion
//#region src/tools.ts
/**
* tools.ts — 5 model-facing MinerU tools.
*
* Tools:
*   mineru_health             — GET /health (capacity preflight)
*   mineru_submit_parse_job   — POST /tasks (async submit, returns task_id)
*   mineru_get_parse_status   — GET /tasks/{id} (poll status)
*   mineru_get_parse_result   — GET /tasks/{id}/result (fetch completed result)
*   mineru_parse_document     — high-level folded flow: submit → poll → result
*
* Conventions (per plugin-development-guide.md §3):
*   C4 — execute returns a canonical JSON value; render is a separate pure projection.
*   C6 — exec.signal is honored at every await point.
*   C10 — no UI-specific formats in the canonical value.
*/
const MINERU_BACKENDS = [
	"pipeline",
	"vlm-engine",
	"hybrid-engine",
	"vlm-http-client",
	"hybrid-http-client"
];
const MINERU_PARSE_METHODS = [
	"auto",
	"txt",
	"ocr"
];
function textRender(fn) {
	return (_args, value) => [{
		type: "text",
		text: fn(value)
	}];
}
function toParseParams(args, config) {
	return {
		backend: args.backend ?? config.defaultBackend,
		parse_method: args.parse_method ?? config.defaultParseMethod,
		lang_list: args.lang_list ?? [config.defaultLang],
		formula_enable: args.formula_enable ?? true,
		table_enable: args.table_enable ?? true,
		return_md: true,
		return_middle_json: args.return_middle_json ?? false,
		return_content_list: args.return_content_list ?? false,
		return_images: args.return_images ?? false,
		start_page_id: args.start_page_id ?? 0,
		end_page_id: args.end_page_id ?? 99999
	};
}
async function maybeTruncateMd(md, maxChars, taskId) {
	if (md.length <= maxChars) return {
		content: md,
		truncated: false
	};
	const fullMdPath = join(tmpdir(), `mineru-${taskId}.md`);
	await writeFile(fullMdPath, md, "utf8");
	return {
		content: md.slice(0, maxChars) + `\n\n... [truncated; full content saved to ${fullMdPath}]`,
		truncated: true,
		fullMdPath
	};
}
function renderHealthOutput(value) {
	const lines = [`MinerU server: ${value.status}`];
	if (value.version) lines.push(`Version: ${value.version}`);
	if (value.queued_tasks !== void 0) lines.push(`Queue: ${value.queued_tasks} queued, ${value.processing_tasks ?? 0} processing, ${value.completed_tasks ?? 0} completed, ${value.failed_tasks ?? 0} failed`);
	if (value.max_concurrent_requests !== void 0) lines.push(`Capacity: ${value.max_concurrent_requests} max concurrent`);
	return lines.join("\n");
}
function renderSubmitOutput(value) {
	const lines = [`MinerU task submitted: ${value.task_id}`, `Status: ${value.status}`];
	if (value.queued_ahead !== void 0) lines.push(`Queued ahead: ${value.queued_ahead}`);
	if (value.status_url) lines.push(`Status URL: ${value.status_url}`);
	if (value.result_url) lines.push(`Result URL: ${value.result_url}`);
	lines.push("");
	lines.push("Poll with mineru_get_parse_status, then fetch with mineru_get_parse_result.");
	return lines.join("\n");
}
function renderStatusOutput(value) {
	const lines = [`Task ${value.task_id}: ${value.status}`];
	if (value.file_names && value.file_names.length > 0) lines.push(`Files: ${value.file_names.join(", ")}`);
	if (value.queued_ahead !== void 0) lines.push(`Queued ahead: ${value.queued_ahead}`);
	if (value.created_at) lines.push(`Created: ${value.created_at}`);
	if (value.completed_at) lines.push(`Completed: ${value.completed_at}`);
	if (value.error) lines.push(`Error: ${value.error}`);
	return lines.join("\n");
}
function renderResultOutput(value) {
	const lines = [`MinerU result for task ${value.task_id}`];
	if (value.backend) lines.push(`Backend: ${value.backend} (v${value.version ?? "?"})`);
	if (value.file_stems && value.file_stems.length > 0) lines.push(`Files: ${value.file_stems.join(", ")}`);
	if (value.raw_result_path) lines.push(`Full result JSON: ${value.raw_result_path}`);
	if (value.md_truncated && value.full_md_path) lines.push(`Full markdown: ${value.full_md_path}`);
	if (value.md_content) {
		lines.push("");
		lines.push(value.md_content);
	}
	return lines.join("\n");
}
function renderParseDocOutput(value) {
	const lines = [`MinerU parse ${value.status} (task: ${value.task_id})`];
	if (value.backend) lines.push(`Backend: ${value.backend} (v${value.version ?? "?"})`);
	if (value.file_stems && value.file_stems.length > 0) lines.push(`Files: ${value.file_stems.join(", ")}`);
	if (value.error) lines.push(`Error: ${value.error}`);
	else if (value.md_content) {
		if (value.md_truncated && value.full_md_path) lines.push(`[Markdown truncated; full content at ${value.full_md_path}]`);
		lines.push("");
		lines.push(value.md_content);
	}
	return lines.join("\n");
}
function toHealthOutput(h) {
	return {
		status: h.status,
		version: h.version,
		queued_tasks: h.queued_tasks,
		processing_tasks: h.processing_tasks,
		completed_tasks: h.completed_tasks,
		failed_tasks: h.failed_tasks,
		max_concurrent_requests: h.max_concurrent_requests
	};
}
function toSubmitOutput(s) {
	const out = {
		task_id: s.task_id,
		status: s.status
	};
	if (s.status_url) out.status_url = s.status_url;
	if (s.result_url) out.result_url = s.result_url;
	if (s.queued_ahead !== void 0) out.queued_ahead = s.queued_ahead;
	return out;
}
function toStatusOutput(s) {
	const out = {
		task_id: s.task_id,
		status: s.status
	};
	if (s.file_names && s.file_names.length > 0) out.file_names = s.file_names;
	if (s.created_at) out.created_at = s.created_at;
	if (s.started_at) out.started_at = s.started_at;
	if (s.completed_at) out.completed_at = s.completed_at;
	if (s.error) out.error = s.error;
	if (s.queued_ahead !== void 0) out.queued_ahead = s.queued_ahead;
	return out;
}
function registerTools(ctx, getClient, getConfig) {
	const client = () => getClient();
	const config = () => getConfig();
	ctx.tools.register(defineTool({
		name: "mineru_health",
		description: "Check MinerU server health and capacity. Returns server status, version, queue depth (queued/processing/completed/failed task counts), and max concurrency. Useful before submitting large batch jobs to check available capacity. No parameters required.",
		parameters: {},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					status: {
						type: "string",
						required: true,
						description: "Server health status: \"healthy\" or \"unhealthy\"."
					},
					version: {
						type: "string",
						description: "MinerU server version."
					},
					queued_tasks: {
						type: "integer",
						description: "Number of tasks waiting in queue."
					},
					processing_tasks: {
						type: "integer",
						description: "Number of tasks currently being processed."
					},
					completed_tasks: {
						type: "integer",
						description: "Number of completed tasks (retained 24h)."
					},
					failed_tasks: {
						type: "integer",
						description: "Number of failed tasks."
					},
					max_concurrent_requests: {
						type: "integer",
						description: "Maximum concurrent processing requests."
					}
				}
			},
			render: textRender(renderHealthOutput)
		},
		execute: async (_args, exec) => {
			exec.signal.throwIfAborted();
			return toHealthOutput(await client().health(exec.signal));
		}
	}));
	ctx.tools.register(defineTool({
		name: "mineru_submit_parse_job",
		description: "Submit a document to MinerU for asynchronous parsing and return immediately with a task_id. Poll the task status with mineru_get_parse_status, then fetch results with mineru_get_parse_result. Use this for large documents that may take minutes to parse, or when submitting multiple jobs in parallel. The file must be a local filesystem path; if you only have a URL, download it first (e.g., via bash curl). Default backend is 'pipeline' (hallucination-free, supports all languages).",
		parameters: {
			file_path: {
				type: "string",
				required: true,
				description: "Local filesystem path to the document (PDF, PNG, JPG, DOCX, PPTX, or XLSX)."
			},
			backend: {
				type: "string",
				enum: MINERU_BACKENDS,
				description: "Parsing backend. 'pipeline': hallucination-free, multi-language. 'hybrid-engine': MinerU default, requires VLM. 'vlm-engine': VLM only."
			},
			parse_method: {
				type: "string",
				enum: MINERU_PARSE_METHODS,
				description: "Parse method (pipeline/hybrid only). 'auto': auto-detect. 'txt': text only (fast). 'ocr': force OCR."
			},
			lang_list: {
				type: "array",
				items: { type: "string" },
				description: "Language codes for pipeline backend (e.g., 'ch' for Chinese/English/Japanese). Defaults to ['ch']."
			},
			formula_enable: {
				type: "boolean",
				description: "Enable formula parsing. Default: true."
			},
			table_enable: {
				type: "boolean",
				description: "Enable table parsing. Default: true."
			},
			start_page_id: {
				type: "integer",
				description: "PDF page range start (0-indexed). Default: 0."
			},
			end_page_id: {
				type: "integer",
				description: "PDF page range end (0-indexed, inclusive). Default: 99999 (all pages)."
			},
			return_middle_json: {
				type: "boolean",
				description: "Include middle JSON (intermediate parsing structure). Default: false."
			},
			return_content_list: {
				type: "boolean",
				description: "Include content list JSON (structured content blocks). Default: false."
			},
			return_images: {
				type: "boolean",
				description: "Include extracted images (base64 data URLs). Can be large. Default: false."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					task_id: {
						type: "string",
						required: true,
						description: "MinerU task ID. Use with mineru_get_parse_status and mineru_get_parse_result."
					},
					status: {
						type: "string",
						required: true,
						description: "Initial task status (typically \"pending\")."
					},
					status_url: {
						type: "string",
						description: "URL to poll task status."
					},
					result_url: {
						type: "string",
						description: "URL to fetch task result."
					},
					queued_ahead: {
						type: "integer",
						description: "Number of tasks ahead in queue."
					}
				}
			},
			render: textRender(renderSubmitOutput)
		},
		timeoutMs: 12e4,
		execute: async (args, exec) => {
			const a = args;
			exec.signal.throwIfAborted();
			return toSubmitOutput(await client().submitTask(a.file_path, toParseParams(a, config()), exec.signal));
		}
	}));
	ctx.tools.register(defineTool({
		name: "mineru_get_parse_status",
		description: "Check the status of an asynchronous MinerU parsing task. Returns: \"pending\" (in queue), \"processing\" (being parsed), \"completed\" (done — fetch with mineru_get_parse_result), or \"failed\" (error occurred). Poll every few seconds; a 1-page PDF takes ~1-2s, large documents can take minutes.",
		parameters: { task_id: {
			type: "string",
			required: true,
			description: "Task ID returned by mineru_submit_parse_job."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					task_id: {
						type: "string",
						required: true
					},
					status: {
						type: "string",
						description: "Task status: \"pending\", \"processing\", \"completed\", or \"failed\".",
						required: true
					},
					file_names: {
						type: "array",
						items: { type: "string" },
						description: "Normalized file stems being parsed."
					},
					created_at: {
						type: "string",
						description: "ISO-8601 timestamp."
					},
					started_at: {
						type: "string",
						description: "ISO-8601 timestamp."
					},
					completed_at: {
						type: "string",
						description: "ISO-8601 timestamp."
					},
					error: {
						type: "string",
						description: "Error message if status is \"failed\"."
					},
					queued_ahead: {
						type: "integer",
						description: "Tasks ahead in queue (only while pending)."
					}
				}
			},
			render: textRender(renderStatusOutput)
		},
		execute: async (args, exec) => {
			const a = args;
			exec.signal.throwIfAborted();
			return toStatusOutput(await client().getTaskStatus(a.task_id, exec.signal));
		}
	}));
	ctx.tools.register(defineTool({
		name: "mineru_get_parse_result",
		description: "Fetch the parsing result for a completed MinerU task. The task must have status \"completed\" (check with mineru_get_parse_status first). Returns the parsed markdown content inline (truncated if very large; full content saved to a file). The full structured JSON result (including middle_json, content_list, and images if requested at submit time) is always saved to raw_result_path for inspection with file-reading tools.",
		parameters: { task_id: {
			type: "string",
			required: true,
			description: "Task ID of a completed parsing job."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					task_id: {
						type: "string",
						required: true
					},
					backend: { type: "string" },
					version: { type: "string" },
					file_stems: {
						type: "array",
						items: { type: "string" }
					},
					md_content: {
						type: "string",
						description: "Parsed markdown of the first file (truncated if exceeds maxMdOutputChars)."
					},
					md_truncated: {
						type: "boolean",
						description: "Whether md_content was truncated."
					},
					full_md_path: {
						type: "string",
						description: "Path to full markdown file if truncated."
					},
					raw_result_path: {
						type: "string",
						description: "Path to a JSON file with the full structured result (all files, all formats)."
					}
				}
			},
			render: textRender(renderResultOutput)
		},
		timeoutMs: 12e4,
		execute: async (args, exec) => {
			const a = args;
			exec.signal.throwIfAborted();
			const result = await client().getTaskResult(a.task_id, exec.signal);
			const fileStems = Object.keys(result.results);
			const firstStem = fileStems[0];
			const mdContent = (firstStem !== void 0 ? result.results[firstStem] : void 0)?.md_content ?? "";
			const rawResultPath = join(tmpdir(), `mineru-result-${a.task_id}.json`);
			await writeFile(rawResultPath, JSON.stringify(result, null, 2), "utf8");
			const { content, truncated, fullMdPath } = await maybeTruncateMd(mdContent, config().maxMdOutputChars, a.task_id);
			const out = {
				task_id: a.task_id,
				raw_result_path: rawResultPath
			};
			if (result.backend) out.backend = result.backend;
			if (result.version) out.version = result.version;
			if (fileStems.length > 0) out.file_stems = fileStems;
			if (content) out.md_content = content;
			if (truncated) out.md_truncated = truncated;
			if (fullMdPath) out.full_md_path = fullMdPath;
			return out;
		}
	}));
	ctx.tools.register(defineTool({
		name: "mineru_parse_document",
		description: "Parse a local document (PDF, image, DOCX, PPTX, or XLSX) via MinerU and return the extracted markdown. This is the recommended high-level tool: it submits the file, polls until parsing completes (up to poll_timeout_ms), and returns the markdown content inline. For large documents or when you need to interleave other work, use mineru_submit_parse_job + mineru_get_parse_status + mineru_get_parse_result instead. The file must be a local filesystem path; if you only have a URL, download it first (e.g., via bash curl). Default backend is 'pipeline' (hallucination-free, supports all languages).",
		parameters: {
			file_path: {
				type: "string",
				required: true,
				description: "Local filesystem path to the document (PDF, PNG, JPG, DOCX, PPTX, or XLSX)."
			},
			backend: {
				type: "string",
				enum: MINERU_BACKENDS,
				description: "Parsing backend. 'pipeline': hallucination-free, multi-language. 'hybrid-engine': requires VLM model. Default: 'pipeline'."
			},
			parse_method: {
				type: "string",
				enum: MINERU_PARSE_METHODS,
				description: "Parse method (pipeline/hybrid only). 'auto': auto-detect. 'txt': text only (fast). 'ocr': force OCR."
			},
			lang_list: {
				type: "array",
				items: { type: "string" },
				description: "Language codes for pipeline backend (e.g., 'ch'). Defaults to ['ch']."
			},
			formula_enable: {
				type: "boolean",
				description: "Enable formula parsing. Default: true."
			},
			table_enable: {
				type: "boolean",
				description: "Enable table parsing. Default: true."
			},
			start_page_id: {
				type: "integer",
				description: "PDF page range start (0-indexed). Default: 0."
			},
			end_page_id: {
				type: "integer",
				description: "PDF page range end (0-indexed, inclusive). Default: 99999 (all pages)."
			},
			return_middle_json: {
				type: "boolean",
				description: "Include middle JSON in the saved result file. Default: false."
			},
			return_content_list: {
				type: "boolean",
				description: "Include content list JSON in the saved result file. Default: false."
			},
			return_images: {
				type: "boolean",
				description: "Include extracted images in the saved result file. Default: false."
			},
			poll_timeout_ms: {
				type: "number",
				description: "Maximum time (ms) to wait for parsing before timing out. Default: 600000 (10 min)."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					task_id: {
						type: "string",
						required: true
					},
					status: {
						type: "string",
						description: "Parse status: \"completed\" or \"failed\".",
						required: true
					},
					backend: { type: "string" },
					version: { type: "string" },
					file_stems: {
						type: "array",
						items: { type: "string" }
					},
					md_content: {
						type: "string",
						description: "Parsed markdown content (truncated if very large)."
					},
					md_truncated: { type: "boolean" },
					full_md_path: {
						type: "string",
						description: "Path to full markdown if truncated."
					},
					error: {
						type: "string",
						description: "Error message if status is \"failed\"."
					}
				}
			},
			render: textRender(renderParseDocOutput)
		},
		timeoutMs: 9e5,
		execute: async (args, exec) => {
			const a = args;
			exec.signal.throwIfAborted();
			const cfg = config();
			const c = client();
			const submit = await c.submitTask(a.file_path, toParseParams(a, cfg), exec.signal);
			const pollTimeoutMs = a.poll_timeout_ms ?? cfg.pollTimeoutMs;
			const finalStatus = await pollUntilDone(c, submit.task_id, {
				intervalMs: cfg.pollIntervalMs,
				timeoutMs: pollTimeoutMs,
				signal: exec.signal
			});
			if (finalStatus.status === "failed") return {
				task_id: submit.task_id,
				status: "failed",
				error: finalStatus.error ?? "Task failed without error message"
			};
			const result = await c.getTaskResult(submit.task_id, exec.signal);
			const fileStems = Object.keys(result.results);
			const firstStem = fileStems[0];
			const { content, truncated, fullMdPath } = await maybeTruncateMd((firstStem !== void 0 ? result.results[firstStem] : void 0)?.md_content ?? "", cfg.maxMdOutputChars, submit.task_id);
			const out = {
				task_id: submit.task_id,
				status: "completed"
			};
			if (result.backend) out.backend = result.backend;
			if (result.version) out.version = result.version;
			if (fileStems.length > 0) out.file_stems = fileStems;
			if (content) out.md_content = content;
			if (truncated) out.md_truncated = truncated;
			if (fullMdPath) out.full_md_path = fullMdPath;
			return out;
		}
	}));
}
//#endregion
//#region src/rpc.ts
function ok(value) {
	return {
		ok: true,
		value
	};
}
function fail(message) {
	return {
		ok: false,
		error: {
			code: "internal",
			message,
			details: {}
		}
	};
}
function toRuntimeConfig(resolved) {
	return {
		mode: resolved.mode,
		cloudModelVersion: resolved.cloudModelVersion,
		baseURL: resolved.baseURL,
		apiKeyCipher: resolved.apiKeyCipher,
		defaultBackend: resolved.defaultBackend,
		defaultParseMethod: resolved.defaultParseMethod,
		defaultLang: resolved.defaultLang,
		pollIntervalMs: resolved.pollIntervalMs,
		pollTimeoutMs: resolved.pollTimeoutMs,
		requestTimeoutMs: resolved.requestTimeoutMs,
		maxMdOutputChars: resolved.maxMdOutputChars
	};
}
function registerRpc(ctx, deps) {
	ctx.logger.info("dsh-mineru: registering RPC channel /mineru-api");
	ctx.connection.rpc.handle("/mineru-api", async (endpoint, payload) => {
		switch (endpoint) {
			case "mineru/config.get": { const cfg = toRuntimeConfig(deps.getResolved()); return ok({ config: { ...cfg, apiKeyCipher: "", apiKeyConfigured: !!cfg.apiKeyCipher } }); }
			case "mineru/config.set": {
				const p = payload;
				if (p === void 0 || typeof p !== "object" || p === null) return fail("payload must be { config: Partial<MineruRuntimeConfig> }");
				const patch = p.config;
				if (patch === void 0 || typeof patch !== "object") return fail("payload.config must be an object");
				if (patch.baseURL !== void 0 && (typeof patch.baseURL !== "string" || patch.baseURL === "")) return fail("baseURL must be a non-empty string");
				const current = deps.getResolved();
				const next = {
					mode: patch.mode ?? current.mode ?? "local",
					cloudModelVersion: patch.cloudModelVersion ?? current.cloudModelVersion ?? "vlm",
					baseURL: patch.baseURL ?? current.baseURL,
					apiKeyCipher: (typeof patch.apiKey === "string" && patch.apiKey.length > 0) ? encryptApiKey(patch.apiKey) : current.apiKeyCipher ?? "",
					defaultBackend: patch.defaultBackend ?? current.defaultBackend,
					defaultParseMethod: patch.defaultParseMethod ?? current.defaultParseMethod,
					defaultLang: patch.defaultLang ?? current.defaultLang,
					pollIntervalMs: patch.pollIntervalMs ?? current.pollIntervalMs,
					pollTimeoutMs: patch.pollTimeoutMs ?? current.pollTimeoutMs,
					requestTimeoutMs: patch.requestTimeoutMs ?? current.requestTimeoutMs,
					maxMdOutputChars: patch.maxMdOutputChars ?? current.maxMdOutputChars
				};
				deps.onConfigChanged(next);
				return ok({ config: toRuntimeConfig(next) });
			}
			case "mineru/health": try {
				const draft = (typeof payload?.config === "object" && payload.config !== null) ? payload.config : {};
				const client = Object.keys(draft).length > 0
					? makeClient(ctx, resolveConfig({ ...deps.getResolved(), ...draft }))
					: deps.getClient();
				if (typeof draft?.apiKey === "string" && draft.apiKey.length > 0) {
					const tok = draft.apiKey;
					client.apiKeyResolver = async () => tok;
				}
				const h = await client.health(new AbortController().signal);
				return ok({
					status: h.status,
					version: h.version,
					queued_tasks: h.queued_tasks,
					processing_tasks: h.processing_tasks,
					completed_tasks: h.completed_tasks,
					failed_tasks: h.failed_tasks,
					max_concurrent_requests: h.max_concurrent_requests
				});
			} catch (err) {
				return fail(err instanceof Error ? err.message : String(err));
			}
			default: return fail(`unknown endpoint: ${endpoint}`);
		}
	}, { authority: "trusted-host" });
}
//#endregion
//#region src/index.ts
/**
* index.ts — dsh-mineru cordis plugin entry (host half).
*
* Dual-entry bundle: this is the host half (exports `.`). The browser half
* ships via `./client` (see `src/client/index.ts`).
*
* Architecture:
*   - 5 model-facing tools (health, submit, status, result, parse_document)
*     registered once at load; each tool reads the live client/config via
*     getters, so RPC config mutations hot-reload without re-registration.
*   - Settings namespace `mineru` persists user edits to `$DSH_HOME/settings.yaml`;
*     cordis.yml `config:` is the composition base (first-boot seed).
*   - RPC on `/api` channel: `mineru/config.get`/`.set`/`.health` for the
*     browser settings page (bypasses the `WEB_SETTINGS_NAMESPACES` wire
*     allowlist — same pattern as yet-another-subagent).
*/
const name = "dsh-mineru";
const inject = ["tools", "connection", "settings"];
const KEY_FILE = join(homedir(), '.dsh', 'plugin-data', 'dsh-mineru-key.json');
const Config = z.object({
	mode: z.union(["local", "cloud"]).default("local").description("解析服务器类型：local=自托管 MinerU 服务器（/tasks 接口），cloud=mineru.net 云端 API（/api/v4 接口）。"),
	baseURL: z.string().default("http://127.0.0.1:18000").description("MinerU API base URL. 本地填自托管地址（如 http://127.0.0.1:18000）；云端填 https://mineru.net。"),
	apiKeyCipher: z.string().default(""),
	defaultBackend: z.union([
		"pipeline",
		"vlm-engine",
		"hybrid-engine",
		"vlm-http-client",
		"hybrid-http-client"
	]).default("hybrid-engine"),
	cloudModelVersion: z.union(["pipeline", "vlm", "MinerU-HTML"]).default("vlm").description("云端模型版本：pipeline / vlm / MinerU-HTML。"),
	defaultParseMethod: z.union([
		"auto",
		"txt",
		"ocr"
	]).default("auto"),
	defaultLang: z.string().default("ch"),
	pollIntervalMs: z.number().default(2e3),
	pollTimeoutMs: z.number().default(6e5),
	requestTimeoutMs: z.number().default(6e4),
	maxMdOutputChars: z.number().default(2e5)
});
function resolveConfig(config) {
	const mode = config.mode ?? "local";
	const baseURL = typeof config.baseURL === "string" && config.baseURL !== ""
		? config.baseURL
		: (mode === "cloud" ? "https://mineru.net" : "");
	if (baseURL === "") throw new Error("dsh-mineru: config \"baseURL\" is required. Set it in the DSH GUI settings or cordis.patch.yml.");
	return {
		mode,
		baseURL,
		apiKeyCipher: config.apiKeyCipher ?? "",
		defaultBackend: config.defaultBackend ?? "hybrid-engine",
		cloudModelVersion: config.cloudModelVersion ?? "vlm",
		defaultParseMethod: config.defaultParseMethod ?? "auto",
		defaultLang: config.defaultLang ?? "ch",
		pollIntervalMs: config.pollIntervalMs ?? 2e3,
		pollTimeoutMs: config.pollTimeoutMs ?? 6e5,
		requestTimeoutMs: config.requestTimeoutMs ?? 6e4,
		maxMdOutputChars: config.maxMdOutputChars ?? 2e5
	};
}
function makeClient(ctx, resolved) {
	return new MinerUClient({
		mode: resolved.mode,
		baseURL: resolved.baseURL,
		timeoutMs: resolved.requestTimeoutMs,
		cloudModelVersion: resolved.cloudModelVersion,
		apiKeyResolver: async () => {
			const cipher = (resolved.apiKeyCipher ?? "").trim();
			if (cipher) {
				try { const decrypted = decryptApiKey(cipher); if (decrypted) return decrypted; } catch {}
			}
			return void 0;
		}
	});
}
function apply(ctx, config = {}) {
	let resolved = resolveConfig(config);
	let client = makeClient(ctx, resolved);
	const getResolved = () => resolved;
	const getClient = () => client;
	let persistConfig = () => {};
	const persistKeyFile = (next) => {
		void (async () => {
			try {
				await writeFile(KEY_FILE, JSON.stringify({
					mode: next.mode,
					baseURL: next.baseURL,
					cloudModelVersion: next.cloudModelVersion,
					apiKeyCipher: next.apiKeyCipher,
					defaultBackend: next.defaultBackend,
					defaultParseMethod: next.defaultParseMethod,
					defaultLang: next.defaultLang
				}));
			} catch (e) {
				ctx.logger.warn(`dsh-mineru: persist sidecar failed: ${e?.message ?? e}`);
			}
		})();
	};
	ctx.inject(["settings"], (sctx) => {
		const ns = settingsNamespace("mineru");
		try { sctx.settings.register(ns, Config); } catch (e) { /* 命名空间可能已注册 */ }
		try {
			const desc = sctx.settings.describe({ redactSecrets: false }).find((candidate) => candidate.ns === ns);
			if (desc?.value) {
				const saved = desc.value;
				resolved = resolveConfig({
					...resolved,
					...saved,
					apiKeyCipher: resolved.apiKeyCipher !== "" ? resolved.apiKeyCipher : (saved.apiKeyCipher ?? "")
				});
				client = makeClient(ctx, resolved);
				ctx.logger.info(`dsh-mineru: restored saved config baseURL=${resolved.baseURL}`);
			}
		} catch (e) {
			ctx.logger.warn(`dsh-mineru: read saved config failed: ${e?.message ?? e}`);
		}
		if ((resolved.apiKeyCipher ?? "") === "") {
			try {
				const raw = readFileSync(KEY_FILE, "utf8");
				const saved = JSON.parse(raw);
				if (saved && typeof saved === "object" && (saved.apiKeyCipher ?? "") !== "") {
					resolved = resolveConfig({ ...resolved, ...saved });
					client = makeClient(ctx, resolved);
					ctx.logger.info("dsh-mineru: restored saved config from sidecar");
				}
			} catch (e) {
				ctx.logger.debug(`dsh-mineru: read sidecar failed: ${e?.message ?? e}`);
			}
		}
		persistConfig = (next) => {
			void (async () => {
				try {
					const desc = sctx.settings.describe({ redactSecrets: false }).find((candidate) => candidate.ns === ns);
					await sctx.settings.update(ns, next, desc?.revision);
					persistKeyFile(next);
				} catch (e) {
					ctx.logger.warn(`dsh-mineru: persist config failed: ${e?.message ?? e}`);
				}
			})();
		};
	});
	const onConfigChanged = (next) => {
		resolved = next;
		client = makeClient(ctx, resolved);
		ctx.logger.info(`dsh-mineru: config updated, baseURL=${resolved.baseURL}`);
		persistConfig(next);
	};
	registerTools(ctx, getClient, getResolved);
	registerRpc(ctx, {
		getResolved,
		getClient,
		onConfigChanged
	});
}
//#endregion
export { Config, apply, inject, name };
