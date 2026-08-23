import { dirname, join, relative, resolve, sep } from "node:path";
import { isIP } from "node:net";
import { URL as URL$1 } from "node:url";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { inflateRawSync } from "node:zlib";
import { lookup } from "node:dns/promises";
import { request } from "node:http";
import { request as request$1 } from "node:https";
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/skills-host.js
var SKILL_FILE = "SKILL.md";
var BUNDLES_FILE = ".bundles.json";
var ROUTE_PREFIX = "/api/skill-manager";
var NAME_MAX = 64;
var NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
var ARCHIVE_MAX_ENTRIES = 2e3;
var ARCHIVE_MAX_TOTAL = 200 * 1024 * 1024;
function unzipArchive(buffer) {
	if (buffer.length < 22) throw new Error("not a zip archive");
	let eocd = -1;
	const tailStart = Math.max(0, buffer.length - 65557);
	for (let i = buffer.length - 22; i >= tailStart; i--) if (buffer.readUInt32LE(i) === 101010256) {
		eocd = i;
		break;
	}
	if (eocd < 0) throw new Error("not a zip archive");
	const totalEntries = buffer.readUInt16LE(eocd + 10);
	if (totalEntries === 0 || totalEntries > ARCHIVE_MAX_ENTRIES) throw new Error("archive has too many entries");
	const cdOffset = buffer.readUInt32LE(eocd + 16);
	const files = [];
	let pos = cdOffset;
	for (let i = 0; i < totalEntries; i++) {
		if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 33639248) break;
		const method = buffer.readUInt16LE(pos + 10);
		const compSize = buffer.readUInt32LE(pos + 20);
		const nameLen = buffer.readUInt16LE(pos + 28);
		const extraLen = buffer.readUInt16LE(pos + 30);
		const commentLen = buffer.readUInt16LE(pos + 32);
		const localOffset = buffer.readUInt32LE(pos + 42);
		const name = buffer.subarray(pos + 46, pos + 46 + nameLen).toString("utf8");
		if (!name.endsWith("/") && name !== "") {
			if (method !== 0 && method !== 8) throw new Error(`unsupported zip compression method ${String(method)}`);
			const lhNameLen = buffer.readUInt16LE(localOffset + 26);
			const lhExtraLen = buffer.readUInt16LE(localOffset + 28);
			const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
			if (dataStart + compSize > buffer.length) throw new Error("corrupt zip archive");
			const raw = buffer.subarray(dataStart, dataStart + compSize);
			const data = method === 0 ? Buffer.from(raw) : inflateRawSync(raw);
			files.push({
				name,
				data
			});
		}
		pos += 46 + nameLen + extraLen + commentLen;
	}
	if (files.length === 0) throw new Error("archive contains no files");
	let total = 0;
	for (const file of files) {
		total += file.data.length;
		if (total > ARCHIVE_MAX_TOTAL) throw new Error("archive too large");
	}
	return files;
}
function managedRoot() {
	return join(process.env.DSH_AGENTS_HOME ?? join(homedir(), ".agents"), "skills");
}
function dshRoot() {
	return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "skills");
}
function parseFrontmatter(raw) {
	const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1];
	if (block === void 0) return {};
	const fields = {};
	for (const line of block.split(/\r?\n/)) {
		const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		const key = pair?.[1];
		const valueText = pair?.[2];
		if (key === void 0 || valueText === void 0) continue;
		const value = valueText.trim();
		if (value === "true") fields[key] = true;
		else if (value === "false") fields[key] = false;
		else fields[key] = value;
	}
	return fields;
}
async function walkSkillDir(dir, prefix, out) {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	entries.sort((a, b) => a.name.localeCompare(b.name));
	for (const entry of entries) {
		const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
		if (entry.isDirectory()) await walkSkillDir(join(dir, entry.name), rel, out);
		else out.push(rel);
	}
}
async function readSkillMeta(root, dir) {
	let raw;
	try {
		raw = await readFile(join(root, dir, SKILL_FILE), "utf8");
	} catch {
		return;
	}
	const fields = parseFrontmatter(raw);
	const name2 = typeof fields.name === "string" && fields.name !== "" ? fields.name : dir;
	const files = [];
	await walkSkillDir(join(root, dir), "", files);
	return {
		name: name2,
		description: typeof fields.description === "string" ? fields.description : "",
		compatibility: typeof fields.compatibility === "string" ? fields.compatibility : "",
		fileCount: files.length,
		files: files.slice(0, 200),
		root: rootLabel(root)
	};
}
function rootLabel(root) {
	if (root === managedRoot()) return "agents";
	if (root === dshRoot()) return "dsh";
	return "other";
}
async function listRootSkills(root) {
	const views = [];
	let entries = [];
	try {
		entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
	} catch {
		return views;
	}
	for (const dir of entries) {
		const meta = await readSkillMeta(root, dir);
		if (meta !== void 0) views.push(meta);
	}
	return views;
}
async function readBundles(root) {
	try {
		const parsed = JSON.parse(await readFile(join(root, BUNDLES_FILE), "utf8"));
		if (typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.bundles)) return parsed;
	} catch {}
	return {
		version: 1,
		bundles: []
	};
}
async function writeBundles(root, file) {
	await mkdir(root, { recursive: true });
	const target = join(root, BUNDLES_FILE);
	const temp = `${target}.tmp`;
	await writeFile(temp, `${JSON.stringify(file, null, 2)}
`, "utf8");
	await rename(temp, target);
}
function checkedName(name2) {
	const trimmed = name2.trim();
	if (trimmed === "" || trimmed.length > NAME_MAX) throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
	return trimmed;
}
function resolveSkillFile(base, path) {
	if (path === "" || path.includes("\0") || path.includes("\\")) throw new Error(`unsupported skill file path: ${JSON.stringify(path)}`);
	const target = resolve(base, path);
	const within = relative(resolve(base), target);
	if (within === "" || within.startsWith("..") || within.includes(sep + "..")) throw new Error(`skill file escapes its directory: ${JSON.stringify(path)}`);
	return target;
}
async function snapshot() {
	const root = managedRoot();
	const all = [...await listRootSkills(root), ...await listRootSkills(dshRoot())];
	const byName = new Map(all.map((skill) => [skill.name, skill]));
	const ledger = await readBundles(root);
	const bundles = [];
	const assigned = /* @__PURE__ */ new Set();
	for (const record of ledger.bundles) {
		const skills = [];
		for (const name2 of record.skills) {
			const skill = byName.get(name2);
			if (skill === void 0) continue;
			skills.push(skill);
			assigned.add(name2);
		}
		bundles.push({
			id: record.id,
			name: record.name,
			skillCount: skills.length,
			skills
		});
	}
	return {
		bundles,
		loose: all.filter((skill) => !assigned.has(skill.name))
	};
}
async function createBundle(body) {
	const name2 = checkedName(typeof body.name === "string" ? body.name : "");
	const root = managedRoot();
	const ledger = await readBundles(root);
	if (ledger.bundles.some((bundle) => bundle.name === name2)) throw new Error(`bundle "${name2}" already exists`);
	const base = name2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bundle";
	let id = base;
	let suffix = 2;
	while (ledger.bundles.some((bundle) => bundle.id === id)) {
		id = `${base}-${String(suffix)}`;
		suffix += 1;
	}
	const record = {
		id,
		name: name2,
		skills: []
	};
	await writeBundles(root, {
		version: 1,
		bundles: [...ledger.bundles, record]
	});
	return {
		id,
		name: name2,
		skillCount: 0,
		skills: []
	};
}
async function renameBundle(id, body) {
	const name2 = checkedName(typeof body.name === "string" ? body.name : "");
	const root = managedRoot();
	const ledger = await readBundles(root);
	const index = ledger.bundles.findIndex((bundle) => bundle.id === id);
	const existing = index === -1 ? void 0 : ledger.bundles[index];
	if (existing === void 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
	if (ledger.bundles.some((bundle, i) => i !== index && bundle.name === name2)) throw new Error(`bundle "${name2}" already exists`);
	const record = {
		...existing,
		name: name2
	};
	const bundles = [...ledger.bundles];
	bundles[index] = record;
	await writeBundles(root, {
		version: 1,
		bundles
	});
	const all = [...await listRootSkills(root), ...await listRootSkills(dshRoot())];
	const byName = new Map(all.map((skill) => [skill.name, skill]));
	const skills = record.skills.map((skillName) => byName.get(skillName)).filter((skill) => skill !== void 0);
	return {
		id: record.id,
		name: name2,
		skillCount: skills.length,
		skills
	};
}
async function deleteBundle(id) {
	const root = managedRoot();
	const ledger = await readBundles(root);
	const bundles = ledger.bundles.filter((bundle) => bundle.id !== id);
	if (bundles.length === ledger.bundles.length) throw new Error(`bundle ${JSON.stringify(id)} not found`);
	await writeBundles(root, {
		version: 1,
		bundles
	});
}
async function setBundleSkills(id, body) {
	const root = managedRoot();
	const ledger = await readBundles(root);
	const index = ledger.bundles.findIndex((bundle) => bundle.id === id);
	const existing = index === -1 ? void 0 : ledger.bundles[index];
	if (existing === void 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
	const all = [...await listRootSkills(root), ...await listRootSkills(dshRoot())];
	const byName = new Map(all.map((skill) => [skill.name, skill]));
	const raw = Array.isArray(body.skillNames) ? body.skillNames.filter((v) => typeof v === "string") : [];
	const skills = [];
	for (const name2 of raw) {
		if (!byName.has(name2)) throw new Error(`skill ${JSON.stringify(name2)} not found`);
		if (!skills.includes(name2)) skills.push(name2);
	}
	const record = {
		...existing,
		skills
	};
	await writeBundles(root, {
		version: 1,
		bundles: ledger.bundles.map((candidate) => candidate.id === id ? record : {
			...candidate,
			skills: candidate.skills.filter((name2) => !skills.includes(name2))
		})
	});
	const views = skills.map((name2) => byName.get(name2)).filter((skill) => skill !== void 0);
	return {
		id: record.id,
		name: record.name,
		skillCount: views.length,
		skills: views
	};
}
async function assignBundle(root, skillName, bundleId) {
	if (typeof bundleId !== "string" || bundleId === "") return;
	const ledger = await readBundles(root);
	const index = ledger.bundles.findIndex((bundle) => bundle.id === bundleId);
	if (index === -1) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`);
	await writeBundles(root, {
		version: 1,
		bundles: ledger.bundles.map((candidate, i) => i === index ? {
			...candidate,
			skills: [...candidate.skills.filter((name2) => name2 !== skillName), skillName]
		} : {
			...candidate,
			skills: candidate.skills.filter((name2) => name2 !== skillName)
		})
	});
}
async function installArchive(body) {
	const root = managedRoot();
	const raw = typeof body.archive === "string" ? body.archive : "";
	if (raw === "") throw new Error("empty archive");
	const files = unzipArchive(Buffer.from(raw, "base64"));
	const skillIndex = files.findIndex((file) => file.name === SKILL_FILE || file.name.endsWith("/" + SKILL_FILE));
	const skillEntry = skillIndex === -1 ? void 0 : files[skillIndex];
	if (skillEntry === void 0) throw new Error(`archive must contain ${SKILL_FILE}`);
	const meta = parseFrontmatter(skillEntry.data.toString("utf8"));
	let skillName = typeof meta.name === "string" ? meta.name.trim() : "";
	if (!NAME_PATTERN.test(skillName)) skillName = (skillEntry.name.slice(0, skillEntry.name.length - SKILL_FILE.length).replace(/\/+$/, "").split("/").pop() ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	if (!NAME_PATTERN.test(skillName)) throw new Error("skill name must be lowercase alphanumeric/hyphen");
	if (skillName.length > NAME_MAX) throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
	const skillDir = join(root, skillName);
	const base = skillEntry.name.slice(0, skillEntry.name.length - SKILL_FILE.length).replace(/\/+$/, "");
	let hasSkillFile = false;
	for (const file of files) {
		let rel = file.name;
		if (base !== "" && rel.startsWith(base + "/")) rel = rel.slice(base.length + 1);
		if (rel === SKILL_FILE) hasSkillFile = true;
		const target = resolveSkillFile(skillDir, rel);
		await mkdir(join(target, ".."), { recursive: true });
		await writeFile(target, file.data);
	}
	if (!hasSkillFile) {
		const description = typeof body.description === "string" ? body.description.trim() : "";
		await writeFile(join(skillDir, SKILL_FILE), `---
name: ${skillName}
description: ${description || "Installed from the Skills panel."}
---

${description}`, "utf8");
	}
	await assignBundle(root, skillName, typeof body.bundleId === "string" ? body.bundleId : "");
	const finalMeta = await readSkillMeta(root, skillName);
	return {
		name: finalMeta?.name ?? skillName,
		description: finalMeta?.description ?? ""
	};
}
async function installSkill(body) {
	if (typeof body.archive === "string" && body.archive !== "") return installArchive(body);
	const skillName = checkedName(typeof body.skillName === "string" ? body.skillName : "");
	if (!NAME_PATTERN.test(skillName)) throw new Error("skill name must be lowercase alphanumeric/hyphen");
	const root = managedRoot();
	const skillDir = join(root, skillName);
	await mkdir(skillDir, { recursive: true });
	const files = Array.isArray(body.files) ? body.files : [];
	let hasSkillFile = false;
	for (const file of files) {
		if (typeof file !== "object" || file === null) continue;
		const entry = file;
		const path = typeof entry.path === "string" ? entry.path : "";
		const data = typeof entry.data === "string" ? entry.data : "";
		if (path === SKILL_FILE) hasSkillFile = true;
		const target = resolveSkillFile(skillDir, path);
		await mkdir(join(target, ".."), { recursive: true });
		await writeFile(target, Buffer.from(data, "base64"));
	}
	if (!hasSkillFile) {
		const description = typeof body.description === "string" ? body.description.trim() : "";
		const text = `---
name: ${skillName}
description: ${description || "Installed from the Skills panel."}
---

${description}`;
		await writeFile(join(skillDir, SKILL_FILE), text, "utf8");
	}
	if (typeof body.bundleId === "string" && body.bundleId !== "") {
		const ledger = await readBundles(root);
		const index = ledger.bundles.findIndex((bundle) => bundle.id === body.bundleId);
		if (index === -1) throw new Error(`bundle ${JSON.stringify(body.bundleId)} not found`);
		await writeBundles(root, {
			version: 1,
			bundles: ledger.bundles.map((candidate, i) => i === index ? {
				...candidate,
				skills: [...candidate.skills.filter((name2) => name2 !== skillName), skillName]
			} : {
				...candidate,
				skills: candidate.skills.filter((name2) => name2 !== skillName)
			})
		});
	}
	const meta = await readSkillMeta(root, skillName);
	return {
		name: meta?.name ?? skillName,
		description: meta?.description ?? ""
	};
}
async function readSkillFile(skillName, relPath) {
	const name2 = checkedName(skillName);
	const roots = [managedRoot(), dshRoot()];
	let dir = null;
	for (const root of roots) {
		const candidate = join(root, name2);
		try {
			if ((await stat(candidate)).isDirectory()) {
				dir = candidate;
				break;
			}
		} catch {}
	}
	if (dir === null) throw new Error(`skill ${JSON.stringify(name2)} not found`);
	if (relPath === "" || relPath.includes("\0") || relPath.includes("\\")) throw new Error(`unsupported file path: ${JSON.stringify(relPath)}`);
	const target = resolveSkillFile(dir, relPath);
	let info;
	try {
		info = await stat(target);
	} catch {
		throw new Error(`file ${JSON.stringify(relPath)} not found in skill ${JSON.stringify(name2)}`);
	}
	if (!info.isFile()) throw new Error(`not a file: ${JSON.stringify(relPath)}`);
	return {
		name: name2,
		path: relPath,
		content: await readFile(target, "utf8")
	};
}
async function deleteSkill(skillName) {
	const name2 = checkedName(skillName);
	if (!NAME_PATTERN.test(name2)) throw new Error("skill name must be lowercase alphanumeric/hyphen");
	const roots = [managedRoot(), dshRoot()];
	let removed = false;
	for (const root2 of roots) {
		const dir = join(root2, name2);
		try {
			if (!(await stat(dir)).isDirectory()) continue;
		} catch {
			continue;
		}
		await rm(dir, {
			recursive: true,
			force: true
		});
		removed = true;
		break;
	}
	if (!removed) throw new Error(`skill ${JSON.stringify(name2)} not found`);
	const root = managedRoot();
	await writeBundles(root, {
		version: 1,
		bundles: (await readBundles(root)).bundles.map((candidate) => ({
			...candidate,
			skills: candidate.skills.filter((candidateName) => candidateName !== name2)
		}))
	});
}
function isLoopbackAddress$1(address) {
	if (typeof address !== "string") return false;
	const a = address.toLowerCase();
	if (a === "::1") return true;
	const octets = (a.startsWith("::ffff:") ? a.slice(7) : a).split(".");
	return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function hostNameOf$1(value) {
	if (typeof value !== "string") return null;
	const host = value.trim().toLowerCase();
	if (host.startsWith("[")) {
		const close = host.indexOf("]");
		if (close <= 1) return null;
		const suffix = host.slice(close + 1);
		if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
		return host.slice(1, close);
	}
	const firstColon = host.indexOf(":");
	if (firstColon !== host.lastIndexOf(":")) return null;
	return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed(req) {
	if (!isLoopbackAddress$1(req.socket.remoteAddress)) return false;
	const host = hostNameOf$1(req.headers.host);
	if (host === null) return false;
	return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function json$1(res, status, value) {
	const body = JSON.stringify(value);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-cache"
	});
	res.end(body);
}
function readBody(req) {
	return new Promise((resolvePromise, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 4 * 1024 * 1024) {
				reject(/* @__PURE__ */ new Error("request body too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (chunks.length === 0) {
				resolvePromise({});
				return;
			}
			try {
				resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch (error) {
				reject(error instanceof Error ? error : /* @__PURE__ */ new Error("invalid JSON body"));
			}
		});
		req.on("error", reject);
	});
}
async function handle(ctx, req, res) {
	if (!loopbackAllowed(req)) {
		json$1(res, 403, { error: "loopback-only" });
		return;
	}
	const rest = new URL$1(req.url ?? "/", "http://localhost").pathname.slice(ROUTE_PREFIX.length);
	const method = req.method ?? "GET";
	try {
		if (method === "GET" && (rest === "" || rest === "/list")) {
			json$1(res, 200, await snapshot());
			return;
		}
		if (method === "POST" && rest === "/bundles") {
			json$1(res, 200, await createBundle(await readBody(req)));
			return;
		}
		const matchId = /^\/bundles\/([^/]+)$/.exec(rest);
		if (method === "PATCH" && matchId !== null) {
			const body = await readBody(req);
			json$1(res, 200, await renameBundle(decodeURIComponent(matchId[1]), body));
			return;
		}
		if (method === "DELETE" && matchId !== null) {
			await deleteBundle(decodeURIComponent(matchId[1]));
			json$1(res, 200, { ok: true });
			return;
		}
		const matchSkills = /^\/bundles\/([^/]+)\/skills$/.exec(rest);
		if (method === "PUT" && matchSkills !== null) {
			const body = await readBody(req);
			json$1(res, 200, await setBundleSkills(decodeURIComponent(matchSkills[1]), body));
			return;
		}
		if (method === "POST" && rest === "/skills") {
			json$1(res, 200, await installSkill(await readBody(req)));
			return;
		}
		const matchSkillDelete = /^\/skills\/([^/]+)$/.exec(rest);
		if (method === "DELETE" && matchSkillDelete !== null) {
			await deleteSkill(decodeURIComponent(matchSkillDelete[1]));
			json$1(res, 200, { ok: true });
			return;
		}
		const matchSkillFile = /^\/skills\/([^/]+)\/files\/(.+)$/.exec(rest);
		if (method === "GET" && matchSkillFile !== null) {
			json$1(res, 200, await readSkillFile(decodeURIComponent(matchSkillFile[1]), decodeURIComponent(matchSkillFile[2])));
			return;
		}
		json$1(res, 404, { error: `no route for ${method} ${rest}` });
	} catch (error) {
		json$1(res, 400, { error: error instanceof Error ? error.message : String(error) });
	}
}
async function apply$1(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: ROUTE_PREFIX,
		handler: (req, res) => {
			handle(ctx, req, res);
		}
	}), "dsh-skill-manager: routes");
}
//#endregion
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/usage.js
/**
* dsh-usage-skill — pure per-day, per-model token-usage aggregation over
* session event logs. Kept free of cordis imports so it can be unit-tested
* and validated against real logs outside the running harness.
*
* Aggregation semantics mirror `dsh-token-meter`'s `tokenUsage` projection:
* a usage sample rides an `assistant/chunk` (`data.chunk.type === "usage"`)
* or an `assistant/message` (`data.usage`); a repeated sample for the same
* (turn, step) REPLACES the earlier value instead of double counting it, and
* the replacement is re-attributed to the day of the later event.
*
* Each sample is additionally attributed to the model that produced it:
* `assistant/message` carries `data.message.source.model`; usage chunks fall
* back to the last `request/header` `data.header.config.model`; samples with
* no model information land in the `unknown` bucket.
*
* @module dsh-usage-skill/usage
*/
/** Local-calendar `YYYY-MM-DD` key for a millisecond epoch. */
function dayKey(timeMs) {
	const date = new Date(timeMs);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}
/** Empty token bucket. */
function zeroBuckets() {
	return {
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0
	};
}
/** Provider usage → buckets (missing cache fields are absent in some reports). */
function bucketsOf(usage) {
	return {
		inputTokens: usage.inputTokens ?? 0,
		outputTokens: usage.outputTokens ?? 0,
		cacheReadTokens: usage.cacheReadTokens ?? 0,
		cacheWriteTokens: usage.cacheWriteTokens ?? 0
	};
}
/** Total tokens across all buckets. */
function totalTokens(buckets) {
	return buckets.inputTokens + buckets.outputTokens + buckets.cacheReadTokens + buckets.cacheWriteTokens;
}
/**
* Prompt-side cache hit rate in percent (0–100, one decimal), or null when
* no prompt tokens were reported at all. Hits over the whole prompt side:
* cacheRead / (input + cacheRead + cacheWrite).
*/
function cacheHitRate(buckets) {
	const input = buckets.inputTokens ?? 0;
	const cacheRead = buckets.cacheReadTokens ?? 0;
	const cacheWrite = buckets.cacheWriteTokens ?? 0;
	const promptTokens = input + cacheRead + cacheWrite;
	if (promptTokens <= 0) return null;
	return Math.round(cacheRead / promptTokens * 1e3) / 10;
}
function addInto(target, source) {
	target.inputTokens += source.inputTokens;
	target.outputTokens += source.outputTokens;
	target.cacheReadTokens += source.cacheReadTokens;
	target.cacheWriteTokens += source.cacheWriteTokens;
	return target;
}
function subtractFrom(target, source) {
	target.inputTokens -= source.inputTokens;
	target.outputTokens -= source.outputTokens;
	target.cacheReadTokens -= source.cacheReadTokens;
	target.cacheWriteTokens -= source.cacheWriteTokens;
	return target;
}
/** Extract the usage sample an event carries, if any. */
function sampleOf(event) {
	if (event.type === "assistant/chunk" && event.data?.chunk?.type === "usage") return {
		key: `${event.data.turn}:${event.data.step}`,
		usage: event.data.chunk.usage
	};
	if (event.type === "assistant/message" && event.data?.usage !== void 0) return {
		key: `${event.data.turn}:${event.data.step}`,
		usage: event.data.usage
	};
}
/**
* The `provider/model` attribution key of a usage sample: the exact provider
* route (dsh adapter id or pi-ai route) plus the model id, so the SAME model
* served by different providers stays distinct. `assistant/message` names
* its provider via `data.message.source`; usage chunks fall back to the last
* `request/header` `data.header.config`; samples with no model information
* land in the `unknown/unknown` bucket.
*/
function modelOf(event) {
	const source = event.data?.message?.source;
	if (source !== void 0 && typeof source.model === "string") return `${typeof source.provider === "string" && source.provider.length > 0 ? source.provider : "unknown"}/${source.model}`;
	const config = event.data?.header?.config;
	if (config !== void 0 && typeof config.model === "string") return `${typeof config.provider === "string" && config.provider.length > 0 ? config.provider : "unknown"}/${config.model}`;
}
/** Day entry: totals plus a per-model bucket map. */
function entryOf(byDay, day) {
	let entry = byDay.get(day);
	if (entry === void 0) {
		entry = {
			totals: zeroBuckets(),
			models: /* @__PURE__ */ new Map()
		};
		byDay.set(day, entry);
	}
	return entry;
}
/**
* One session's incremental fold state. `days` holds the already-folded
* per-day entries; `lastSample`/`currentModel` let a later event slice keep
* the replace-last-sample semantics and model attribution across fold
* boundaries without replaying the whole log.
*/
function createUsageState() {
	return {
		days: /* @__PURE__ */ new Map(),
		lastSample: null,
		currentModel: null,
		consumed: 0
	};
}
/**
* Fold a slice of NEW events onto an existing session state (mutating).
* Replacements for the same (turn, step) subtract the previous sample's
* buckets from the day/model bucket they were attributed to, so a slice
* starting mid-step (e.g. a usage chunk at the tail of the previous fold)
* stays exact.
* @param state - session fold state (mutated in place).
* @param events - the new events, in seq order, starting after the last fold.
*/
function applyUsageDelta(state, events) {
	let last = state.lastSample;
	let currentModel = state.currentModel;
	for (const event of events) {
		if (event.type === "request/header") {
			const model = modelOf(event);
			if (model !== void 0) currentModel = model;
		}
		const sample = sampleOf(event);
		if (sample === void 0) continue;
		const buckets = bucketsOf(sample.usage);
		const model = modelOf(event) ?? currentModel ?? "unknown/unknown";
		const day = dayKey(event.time);
		const entry = entryOf(state.days, day);
		if (last !== null && last.key === sample.key) {
			const previous = state.days.get(last.day);
			if (previous !== void 0) {
				subtractFrom(previous.totals, last.buckets);
				const previousModel = previous.models.get(last.model);
				if (previousModel !== void 0) subtractFrom(previousModel, last.buckets);
			}
		}
		addInto(entry.totals, buckets);
		let modelBucket = entry.models.get(model);
		if (modelBucket === void 0) {
			modelBucket = zeroBuckets();
			entry.models.set(model, modelBucket);
		}
		addInto(modelBucket, buckets);
		last = {
			key: sample.key,
			day,
			model,
			buckets
		};
	}
	state.lastSample = last;
	state.currentModel = currentModel;
}
/**
* Merge one session's folded days into a global per-day map.
* @param byDay - global map to mutate.
* @param sessionDays - session day map (from foldUsage or a state).
*/
function mergeInto(byDay, sessionDays) {
	for (const [day, entry] of sessionDays) {
		const target = entryOf(byDay, day);
		addInto(target.totals, entry.totals);
		for (const [model, buckets] of entry.models) {
			let modelBucket = target.models.get(model);
			if (modelBucket === void 0) {
				modelBucket = zeroBuckets();
				target.models.set(model, modelBucket);
			}
			addInto(modelBucket, buckets);
		}
	}
}
/**
* Render a global per-day map into the wire shape for the usage endpoint.
* @param byDay - day → entry map.
* @param updatedAt - computation timestamp.
* @returns `{ days, total, updatedAt }` with `days` sorted ascending; each
*   day carries `models` (descending by tokens) and a `cacheHitRate` percent.
*/
function renderUsage(byDay, updatedAt) {
	const days = [...byDay.entries()].map(([date, entry]) => {
		const models = [...entry.models.entries()].map(([model, buckets]) => ({
			model,
			...buckets,
			tokens: totalTokens(buckets),
			cacheHitRate: cacheHitRate(buckets)
		})).sort((a, b) => b.tokens - a.tokens);
		return {
			date,
			...entry.totals,
			tokens: totalTokens(entry.totals),
			cacheHitRate: cacheHitRate(entry.totals),
			models
		};
	}).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
	const total = zeroBuckets();
	for (const [, entry] of byDay) addInto(total, entry.totals);
	return {
		days,
		total: {
			...total,
			tokens: totalTokens(total),
			cacheHitRate: cacheHitRate(total)
		},
		updatedAt
	};
}
//#endregion
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/balance.js
/**
* dsh-usage-skill — provider balance schemes.
*
* Pure, testable balance-query registry. Each scheme knows the endpoint path
* (relative to the provider's configured base URL) and how to parse the
* response into a normalized `{ isAvailable, currency, total, used, limit,
* granted, toppedUp }` view. Providers without a public balance API (OpenCode Go,
* Volcano Ark, OpenAI, Anthropic, …) map to no scheme — the UI shows an
* explicit "no public balance interface" state instead of guessing.
*
* @module dsh-usage-skill/balance
*/
const SCHEMES = {
	/** DeepSeek: GET {origin}/user/balance — CNY balance_infos entry. */
	deepseek: {
		url: (baseURL) => new URL("/user/balance", baseURL).href,
		parse: (json) => {
			const infos = Array.isArray(json?.balance_infos) ? json.balance_infos : [];
			const info = infos.find((entry) => entry?.currency === "CNY") ?? infos[0];
			return {
				isAvailable: json?.is_available === true,
				currency: info?.currency ?? void 0,
				total: info?.total_balance ?? void 0,
				granted: info?.granted_balance ?? void 0,
				toppedUp: info?.topped_up_balance ?? void 0
			};
		}
	},
	/** OpenRouter account credits; the endpoint requires a Management Key. */
	openrouter: {
		url: (baseURL) => new URL("/api/v1/credits", baseURL).href,
		parse: (json) => {
			const totalCredits = typeof json?.data?.total_credits === "number" ? json.data.total_credits : void 0;
			const totalUsage = typeof json?.data?.total_usage === "number" ? json.data.total_usage : void 0;
			const remaining = totalCredits !== void 0 && totalUsage !== void 0 ? totalCredits - totalUsage : void 0;
			return {
				isAvailable: remaining !== void 0 ? remaining > 0 : void 0,
				currency: "USD",
				total: remaining,
				used: totalUsage,
				limit: totalCredits,
				granted: void 0,
				toppedUp: void 0
			};
		}
	},
	/** Moonshot / Kimi: GET {origin}/v1/users/me/balance — available/cash/voucher. */
	moonshot: {
		url: (baseURL) => new URL("/v1/users/me/balance", baseURL).href,
		parse: (json) => {
			const data = json?.data;
			const available = typeof data?.available_balance === "number" ? data.available_balance : void 0;
			const cash = typeof data?.cash_balance === "number" ? data.cash_balance : void 0;
			const voucher = typeof data?.voucher_balance === "number" ? data.voucher_balance : void 0;
			return {
				isAvailable: available !== void 0 ? available > 0 : void 0,
				currency: typeof data?.currency === "string" ? data.currency : void 0,
				total: available,
				granted: voucher,
				toppedUp: cash
			};
		}
	},
	/** Z.AI / GLM: GET {origin}/api/paas/v4/balance — total + available. */
	zai: {
		url: (baseURL) => new URL("/api/paas/v4/balance", baseURL).href,
		parse: (json) => {
			const data = json?.data;
			const total = typeof data?.total_balance === "number" ? data.total_balance : typeof data?.available_balance === "number" ? data.available_balance : void 0;
			const available = typeof data?.available_balance === "number" ? data.available_balance : void 0;
			return {
				isAvailable: total !== void 0 ? total > 0 : void 0,
				currency: typeof data?.currency === "string" ? data.currency : void 0,
				total,
				granted: void 0,
				toppedUp: available
			};
		}
	}
};
function providerError(status, message, httpStatus) {
	const error = new Error(message);
	error.providerStatus = status;
	if (httpStatus !== void 0) error.httpStatus = httpStatus;
	return error;
}
function responseStatus$1(status) {
	if (status === 401 || status === 403) return "unauthorized";
	if (status === 429) return "rate-limited";
	return status >= 500 ? "unavailable" : "invalid-response";
}
/** Map a provider id (dsh adapter id or pi-ai route) to a balance scheme id. */
function balanceSchemeOf(providerId) {
	if (providerId === "deepseek-official" || providerId === "deepseek") return "deepseek";
	if (providerId === "openrouter") return "openrouter";
	if (providerId === "moonshotai" || providerId === "moonshotai-cn" || providerId === "kimi" || providerId === "kimi-coding") return "moonshot";
	if (providerId === "zai" || providerId === "zai-coding-cn") return "zai";
	return null;
}
/** Query one provider's balance. Throws on transport/HTTP errors. */
async function queryBalance(scheme, baseURL, apiKey, timeoutMs = 15e3, fetchImpl = fetch) {
	const spec = SCHEMES[scheme];
	if (spec === void 0) throw new Error(`no balance scheme "${scheme}"`);
	const response = await fetchImpl(spec.url(baseURL), {
		headers: { authorization: `Bearer ${apiKey}` },
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!response.ok) throw providerError(responseStatus$1(response.status), `balance API returned HTTP ${response.status}`, response.status);
	let body;
	try {
		body = await response.json();
	} catch {
		throw providerError("invalid-response", "balance API returned invalid JSON");
	}
	return spec.parse(body);
}
//#endregion
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/subscriptions.js
/**
* Subscription-quota module for providers that expose percentage windows.
*
* The external interface is deliberately small: callers provide the Harness
* credentials seam and optional transport/time dependencies, and receive two
* normalized provider records. Provider credentials, upstream response shapes,
* parsing quirks, and error mapping remain inside this module.
*
* OpenCode Go's documented provider API does not include usage, but its
* first-party client currently exposes an undocumented Bearer-key endpoint.
* The adapter prefers that simpler path, can reuse OpenCode's local auth.json,
* and keeps the authenticated workspace dashboard as a compatibility fallback.
* Z.ai uses its Coding Plan quota endpoints with a normal API key.
*
* @module dsh-usage-skill/subscriptions
*/
const OPENCODE_GO_URL = "https://opencode.ai";
const OPENCODE_GO_USAGE_URL = `${OPENCODE_GO_URL}/zen/go/v1/usage`;
const ZAI_HOSTS = {
	global: "https://api.z.ai",
	"bigmodel-cn": "https://open.bigmodel.cn"
};
const ZAI_QUOTA_PATH = "/api/monitor/usage/quota/limit";
const ZAI_SUBSCRIPTION_PATH = "/api/biz/subscription/list";
const KIMI_USAGE_URL = "https://api.kimi.com/coding/v1/usages";
const MINIMAX_TOKEN_PLAN_HOSTS = {
	global: "https://www.minimax.io",
	cn: "https://www.minimaxi.com"
};
const MINIMAX_LEGACY_HOSTS = {
	global: "https://api.minimax.io",
	cn: "https://api.minimaxi.com"
};
const MINIMAX_USAGE_PATH = "/v1/api/openplatform/coding_plan/remains";
const MINIMAX_TOKEN_PLAN_PATH = "/v1/token_plan/remains";
const DEFAULT_TIMEOUT_MS$1 = 15e3;
const REFS = {
	openCodeApiKey: "OPENCODE_GO_API_KEY",
	openCodeCookie: "OPENCODE_GO_AUTH_COOKIE",
	openCodeWorkspace: "OPENCODE_GO_WORKSPACE_ID",
	zaiApiKey: "ZAI_API_KEY",
	zaiRegion: "ZAI_API_REGION",
	kimiApiKey: "KIMI_API_KEY",
	minimaxApiKey: "MINIMAX_API_KEY",
	minimaxRegion: "MINIMAX_API_REGION"
};
function numberOrNull$1(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
}
function clampPercent(value) {
	const parsed = numberOrNull$1(value);
	return parsed === null ? null : Math.max(0, Math.min(100, parsed));
}
function round1$1(value) {
	return Math.round(value * 10) / 10;
}
function toIso$1(value) {
	if (value === null || value === void 0 || value === "") return null;
	if (typeof value === "number" && Number.isFinite(value)) {
		const date = new Date(value < 2e10 ? value * 1e3 : value);
		return Number.isNaN(date.getTime()) ? null : date.toISOString();
	}
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
async function resolveCredential$1(credentials, ref) {
	if (credentials === void 0 || credentials === null || typeof credentials.resolve !== "function") return "";
	try {
		const hit = await credentials.resolve(ref);
		return typeof hit?.value === "string" ? hit.value.trim() : "";
	} catch {
		return "";
	}
}
function normalizedStatus(error) {
	if (error?.name === "TimeoutError" || error?.name === "AbortError") return "unavailable";
	if (error?.providerStatus) return error.providerStatus;
	return error instanceof SyntaxError ? "invalid-response" : "unavailable";
}
function invalidResponse(message) {
	const error = new Error(message);
	error.providerStatus = "invalid-response";
	return error;
}
async function request$2(url, init, deps, type) {
	const response = await (deps.fetch ?? fetch)(url, {
		...init,
		signal: AbortSignal.timeout(deps.timeoutMs ?? DEFAULT_TIMEOUT_MS$1)
	});
	if (!response.ok) {
		const error = /* @__PURE__ */ new Error(`upstream returned HTTP ${response.status}`);
		error.httpStatus = response.status;
		error.providerStatus = response.status === 401 || response.status === 403 ? "unauthorized" : response.status === 429 ? "rate-limited" : "unavailable";
		throw error;
	}
	if (type === "text") return response.text();
	try {
		return await response.json();
	} catch {
		throw invalidResponse("upstream returned invalid JSON");
	}
}
function sanitizeCookie(raw) {
	let value = String(raw ?? "").trim().replace(/^cookie\s*:\s*/i, "");
	value = value.split(";").map((part) => part.trim()).filter(Boolean).join("; ");
	return value !== "" && !value.includes("=") ? `auth=${value}` : value;
}
function workspaceIdOf(raw) {
	return String(raw ?? "").match(/wrk_[A-Za-z0-9]+/)?.[0] ?? "";
}
function looksSignedOut(text) {
	const lower = String(text).toLowerCase();
	return lower.includes("sign in") || lower.includes("login") || lower.includes("auth/authorize") || lower.includes("actor of type \"public\"");
}
function goWindowFromObject(value, kind, now) {
	if (value === null || typeof value !== "object") return null;
	const percentSource = value.usagePercent ?? value.usedPercent ?? value.percentUsed ?? value.percentage ?? value.percent;
	let usedPercent = clampPercent(percentSource);
	if (usedPercent === null) {
		const used = numberOrNull$1(value.used ?? value.consumed);
		const limit = numberOrNull$1(value.limit ?? value.total ?? value.quota);
		if (used !== null && limit !== null && limit > 0) usedPercent = clampPercent(used / limit * 100);
	}
	if (usedPercent === null) return null;
	if (usedPercent <= 1 && usedPercent >= 0 && value.percent === void 0 && percentSource !== void 0) usedPercent *= 100;
	const resetSeconds = numberOrNull$1(value.resetInSec ?? value.resetInSeconds ?? value.resetSeconds);
	const resetsAt = resetSeconds === null ? toIso$1(value.resetAt ?? value.resetsAt ?? value.nextReset) : new Date(now + Math.max(0, resetSeconds) * 1e3).toISOString();
	return {
		kind,
		usedPercent: round1$1(clampPercent(usedPercent)),
		remainingPercent: round1$1(100 - clampPercent(usedPercent)),
		...resetsAt === null ? {} : { resetsAt }
	};
}
function parseOpenCodeGoApi(body, now) {
	const usage = body?.usage ?? body;
	if (usage === null || typeof usage !== "object") return [];
	return [
		goWindowFromObject(usage.rolling, "session", now),
		goWindowFromObject(usage.weekly, "weekly", now),
		goWindowFromObject(usage.monthly, "monthly", now)
	].filter(Boolean);
}
function findObject(root, keyword, depth = 0) {
	if (root === null || typeof root !== "object" || depth > 5) return null;
	for (const [key, value] of Object.entries(root)) if (key.toLowerCase().includes(keyword) && value !== null && typeof value === "object") return value;
	for (const value of Object.values(root)) {
		const found = findObject(value, keyword, depth + 1);
		if (found !== null) return found;
	}
	return null;
}
function goWindowFromText(text, key, kind, now) {
	const percent = new RegExp(`${key}[^}]*?usagePercent\\s*[:=]\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(text);
	if (percent === null) return null;
	const reset = new RegExp(`${key}[^}]*?resetInSec\\s*[:=]\\s*([0-9]+)`, "i").exec(text);
	const usedPercent = round1$1(clampPercent(Number(percent[1])));
	return {
		kind,
		usedPercent,
		remainingPercent: round1$1(100 - usedPercent),
		...reset === null ? {} : { resetsAt: new Date(now + Number(reset[1]) * 1e3).toISOString() }
	};
}
function parseOpenCodeGo(text, now) {
	let windows = [];
	try {
		const root = JSON.parse(text);
		windows = [
			goWindowFromObject(findObject(root, "rolling"), "session", now),
			goWindowFromObject(findObject(root, "weekly") ?? findObject(root, "week"), "weekly", now),
			goWindowFromObject(findObject(root, "monthly") ?? findObject(root, "month"), "monthly", now)
		].filter(Boolean);
	} catch {}
	if (!windows.some((window) => window.kind === "session") || !windows.some((window) => window.kind === "weekly")) windows = [
		goWindowFromText(text, "rollingUsage", "session", now),
		goWindowFromText(text, "weeklyUsage", "weekly", now),
		goWindowFromText(text, "monthlyUsage", "monthly", now)
	].filter(Boolean);
	return windows.some((window) => window.kind === "session") && windows.some((window) => window.kind === "weekly") ? windows : [];
}
async function localOpenCodeApiKey(deps) {
	try {
		const home = typeof deps.homedir === "function" ? deps.homedir() : homedir();
		const load = deps.readFile ?? readFile;
		const raw = JSON.parse(await load(join(home, ".local", "share", "opencode", "auth.json"), "utf8"));
		const entry = raw?.["opencode-go"] ?? raw?.opencode;
		return entry?.type === "api" && typeof entry.key === "string" ? entry.key.trim() : "";
	} catch {
		return "";
	}
}
async function collectOpenCodeGoFromDashboard(cookie, workspaceId, deps) {
	try {
		const text = await request$2(`${OPENCODE_GO_URL}/workspace/${workspaceId}/go`, { headers: {
			cookie,
			accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
		} }, deps, "text");
		if (looksSignedOut(text)) return {
			status: "unauthorized",
			windows: []
		};
		const windows = parseOpenCodeGo(text, deps.now());
		return {
			status: windows.length > 0 ? "ok" : "invalid-response",
			windows
		};
	} catch (error) {
		return {
			status: normalizedStatus(error),
			windows: []
		};
	}
}
async function collectOpenCodeGo(credentials, deps) {
	const apiKeyRef = deps.apiKeyRef ?? REFS.openCodeApiKey;
	const [configuredApiKey, cookieRaw, workspaceRaw] = await Promise.all([
		resolveCredential$1(credentials, apiKeyRef),
		resolveCredential$1(credentials, REFS.openCodeCookie),
		resolveCredential$1(credentials, REFS.openCodeWorkspace)
	]);
	const apiKey = configuredApiKey || await localOpenCodeApiKey(deps);
	const cookie = sanitizeCookie(cookieRaw);
	const workspaceId = workspaceIdOf(workspaceRaw);
	if (apiKey === "" && (cookie === "" || workspaceId === "")) return {
		id: "opencode-go",
		displayName: "OpenCode Go",
		mode: "subscription",
		status: "not-configured",
		plan: "Go",
		missingCredentials: [apiKeyRef],
		windows: []
	};
	let apiStatus = "unavailable";
	if (apiKey !== "") try {
		const windows = parseOpenCodeGoApi(await request$2(OPENCODE_GO_USAGE_URL, { headers: {
			authorization: `Bearer ${apiKey}`,
			accept: "application/json"
		} }, deps, "json"), deps.now());
		if (windows.length > 0) return {
			id: "opencode-go",
			displayName: "OpenCode Go",
			mode: "subscription",
			status: "ok",
			plan: "Go",
			windows
		};
		apiStatus = "invalid-response";
	} catch (error) {
		apiStatus = normalizedStatus(error);
	}
	if (cookie !== "" && workspaceId !== "") {
		const dashboard = await collectOpenCodeGoFromDashboard(cookie, workspaceId, deps);
		return {
			id: "opencode-go",
			displayName: "OpenCode Go",
			mode: "subscription",
			status: dashboard.status,
			plan: "Go",
			windows: dashboard.windows
		};
	}
	return {
		id: "opencode-go",
		displayName: "OpenCode Go",
		mode: "subscription",
		status: apiStatus,
		plan: "Go",
		windows: []
	};
}
function zaiRegionOf(raw, fallback = "global") {
	const value = String(raw || fallback).trim().toLowerCase();
	return value === "bigmodel-cn" || value === "cn" || value.includes("bigmodel.cn") ? "bigmodel-cn" : "global";
}
function zaiWindowMinutes(limit) {
	const unit = numberOrNull$1(limit?.unit);
	const number = numberOrNull$1(limit?.number);
	if (unit === null || number === null || number <= 0) return null;
	if (unit === 5) return number;
	if (unit === 3) return number * 60;
	if (unit === 1) return number * 24 * 60;
	if (unit === 6) return number * 7 * 24 * 60;
	return null;
}
function zaiUsedPercent(limit) {
	const total = numberOrNull$1(limit?.usage);
	const remaining = numberOrNull$1(limit?.remaining);
	const current = numberOrNull$1(limit?.currentValue ?? limit?.current_value);
	if (total !== null && total > 0) {
		const used = remaining === null ? current : current === null ? total - remaining : Math.max(total - remaining, current);
		if (used !== null) return clampPercent(Math.max(0, Math.min(total, used)) / total * 100);
	}
	return clampPercent(limit?.percentage ?? limit?.usedPercent ?? limit?.used_percent);
}
function displayPlan(value) {
	return String(value ?? "").trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/\bglm\b/gi, "GLM").replace(/\b\w/g, (char) => char.toUpperCase());
}
function zaiPlan(quota, subscription) {
	const row = Array.isArray(subscription?.data) ? subscription.data.find((entry) => entry && typeof entry === "object") : null;
	for (const source of [row, quota?.data]) for (const key of [
		"product_name",
		"productName",
		"plan_name",
		"planName",
		"package_name",
		"packageName",
		"plan_type",
		"planType",
		"level"
	]) {
		const value = displayPlan(source?.[key]);
		if (value !== "") return value;
	}
	return "GLM Coding Plan";
}
function zaiWindow(limit, kind, fallbackReset = null) {
	const usedPercent = zaiUsedPercent(limit);
	if (usedPercent === null) return null;
	const resetsAt = toIso$1(limit.nextResetTime ?? limit.next_reset_time) ?? fallbackReset;
	return {
		kind,
		usedPercent: round1$1(usedPercent),
		remainingPercent: round1$1(100 - usedPercent),
		...resetsAt === null ? {} : { resetsAt },
		...numberOrNull$1(limit.remaining) === null ? {} : { remaining: numberOrNull$1(limit.remaining) }
	};
}
function parseZai(quota, subscription) {
	const limits = Array.isArray(quota?.data?.limits) ? quota.data.limits : [];
	const tokenLimits = limits.filter((limit) => ["TOKENS_LIMIT", "CREDIT_LIMIT"].includes(String(limit?.type ?? limit?.limit_type ?? "").toUpperCase()) && zaiUsedPercent(limit) !== null).sort((a, b) => (zaiWindowMinutes(a) ?? Number.MAX_SAFE_INTEGER) - (zaiWindowMinutes(b) ?? Number.MAX_SAFE_INTEGER));
	const timeLimit = limits.find((limit) => String(limit?.type ?? limit?.limit_type ?? "").toUpperCase() === "TIME_LIMIT" && zaiUsedPercent(limit) !== null) ?? null;
	const first = tokenLimits[0] ?? null;
	const session = tokenLimits.length >= 2 ? first : zaiWindowMinutes(first) !== null && zaiWindowMinutes(first) <= 360 ? first : null;
	const weekly = tokenLimits.length >= 2 ? tokenLimits[tokenLimits.length - 1] : session === null ? first : null;
	const subscriptionRow = Array.isArray(subscription?.data) ? subscription.data[0] : null;
	const renewAt = toIso$1(subscriptionRow?.next_renew_time ?? subscriptionRow?.nextRenewTime);
	return {
		plan: zaiPlan(quota, subscription),
		windows: [
			session === null ? null : zaiWindow(session, "session"),
			weekly === null ? null : zaiWindow(weekly, "weekly"),
			timeLimit === null ? null : zaiWindow(timeLimit, "billing", renewAt)
		].filter(Boolean)
	};
}
async function collectZai(credentials, deps) {
	const apiKeyRef = deps.zaiApiKeyRef ?? REFS.zaiApiKey;
	const [apiKey, configuredRegion] = await Promise.all([resolveCredential$1(credentials, apiKeyRef), resolveCredential$1(credentials, REFS.zaiRegion)]);
	const region = zaiRegionOf(configuredRegion, deps.zaiDefaultRegion);
	if (apiKey === "") return {
		id: "zai",
		displayName: "Z.ai",
		mode: "subscription",
		status: "not-configured",
		plan: "GLM Coding Plan",
		region,
		missingCredentials: [apiKeyRef],
		windows: []
	};
	const host = ZAI_HOSTS[region];
	const init = { headers: {
		authorization: apiKey,
		accept: "application/json"
	} };
	try {
		const quota = await request$2(`${host}${ZAI_QUOTA_PATH}`, init, deps, "json");
		let subscription = null;
		try {
			subscription = await request$2(`${host}${ZAI_SUBSCRIPTION_PATH}`, init, deps, "json");
		} catch {}
		const parsed = parseZai(quota, subscription);
		return {
			id: "zai",
			displayName: "Z.ai",
			mode: "subscription",
			status: parsed.windows.length > 0 ? "ok" : "invalid-response",
			plan: parsed.plan,
			region,
			windows: parsed.windows
		};
	} catch (error) {
		return {
			id: "zai",
			displayName: "Z.ai",
			mode: "subscription",
			status: normalizedStatus(error),
			plan: "GLM Coding Plan",
			region,
			windows: []
		};
	}
}
function limitWindow(value, kind) {
	if (value === null || typeof value !== "object") return null;
	const limit = numberOrNull$1(value.limit ?? value.total);
	const remaining = numberOrNull$1(value.remaining);
	if (limit === null || remaining === null || limit <= 0) return null;
	const usedPercent = round1$1(clampPercent((limit - remaining) / limit * 100));
	const resetsAt = toIso$1(value.resetTime ?? value.reset_time ?? value.resetsAt);
	return {
		kind,
		usedPercent,
		remainingPercent: round1$1(100 - usedPercent),
		...resetsAt === null ? {} : { resetsAt }
	};
}
function parseKimi(body) {
	const data = body?.data ?? body;
	const session = (Array.isArray(data?.limits) ? data.limits : []).map((entry) => limitWindow(entry?.detail ?? entry, "session")).find(Boolean) ?? null;
	const weekly = limitWindow(data?.usage, "weekly");
	return {
		plan: String(data?.plan ?? data?.planName ?? "Kimi For Coding"),
		windows: [session, weekly].filter(Boolean)
	};
}
async function collectKimi(credentials, deps) {
	const apiKeyRef = deps.apiKeyRef ?? REFS.kimiApiKey;
	const apiKey = await resolveCredential$1(credentials, apiKeyRef);
	if (apiKey === "") return {
		id: "kimi",
		displayName: "Kimi For Coding",
		mode: "subscription",
		status: "not-configured",
		plan: "Kimi For Coding",
		missingCredentials: [apiKeyRef],
		windows: []
	};
	try {
		const parsed = parseKimi(await request$2(nonEmptyUrl(deps.baseURL, "/coding/v1/usages") ?? KIMI_USAGE_URL, { headers: {
			authorization: `Bearer ${apiKey}`,
			accept: "application/json"
		} }, deps, "json"));
		return {
			id: "kimi",
			displayName: "Kimi For Coding",
			mode: "subscription",
			status: parsed.windows.length > 0 ? "ok" : "invalid-response",
			...parsed
		};
	} catch (error) {
		return {
			id: "kimi",
			displayName: "Kimi For Coding",
			mode: "subscription",
			status: normalizedStatus(error),
			plan: "Kimi For Coding",
			windows: []
		};
	}
}
function nonEmptyUrl(value, defaultPath) {
	if (typeof value !== "string" || value.trim() === "") return null;
	try {
		const url = new URL(value);
		return url.pathname === "/" || url.pathname === "" ? new URL(defaultPath, url).href : url.href;
	} catch {
		return null;
	}
}
function minimaxRegionOf(raw, baseURL) {
	const value = String(raw ?? "").trim().toLowerCase();
	if (value === "cn" || value.includes("minimaxi.com") || String(baseURL ?? "").includes("minimaxi.com")) return "cn";
	return "global";
}
function resetFromDuration(value, now) {
	const milliseconds = numberOrNull$1(value);
	if (milliseconds === null || milliseconds < 0) return null;
	const date = new Date(now + milliseconds);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function parseMiniMax(body, now) {
	const statusCode = numberOrNull$1(body?.base_resp?.status_code ?? body?.baseResp?.statusCode);
	if (statusCode !== null && statusCode !== 0) return [];
	const general = (Array.isArray(body?.model_remains) ? body.model_remains : Array.isArray(body?.data?.model_remains) ? body.data.model_remains : []).find((entry) => String(entry?.model_name ?? entry?.modelName ?? "").toLowerCase() === "general");
	if (general === void 0) return [];
	const intervalRemaining = clampPercent(general.current_interval_remaining_percent ?? general.currentIntervalRemainingPercent);
	const weeklyRemaining = clampPercent(general.current_weekly_remaining_percent ?? general.currentWeeklyRemainingPercent);
	const weeklyStatus = numberOrNull$1(general.current_weekly_status ?? general.currentWeeklyStatus);
	const sessionReset = toIso$1(general.current_interval_end_time ?? general.currentIntervalEndTime ?? general.current_interval_reset_time) ?? resetFromDuration(general.remains_time ?? general.remainsTime, now);
	const weeklyReset = toIso$1(general.current_weekly_end_time ?? general.currentWeeklyEndTime ?? general.current_weekly_reset_time) ?? resetFromDuration(general.weekly_remains_time ?? general.weeklyRemainsTime, now);
	return [intervalRemaining === null ? null : {
		kind: "session",
		usedPercent: round1$1(100 - intervalRemaining),
		remainingPercent: round1$1(intervalRemaining),
		...sessionReset === null ? {} : { resetsAt: sessionReset }
	}, weeklyStatus !== 1 || weeklyRemaining === null ? null : {
		kind: "weekly",
		usedPercent: round1$1(100 - weeklyRemaining),
		remainingPercent: round1$1(weeklyRemaining),
		...weeklyReset === null ? {} : { resetsAt: weeklyReset }
	}].filter(Boolean);
}
async function collectMiniMax(credentials, deps) {
	const apiKeyRef = deps.apiKeyRef ?? REFS.minimaxApiKey;
	const [apiKey, configuredRegion] = await Promise.all([resolveCredential$1(credentials, apiKeyRef), resolveCredential$1(credentials, REFS.minimaxRegion)]);
	const region = minimaxRegionOf(deps.region ?? configuredRegion, deps.baseURL);
	if (apiKey === "") return {
		id: "minimax",
		displayName: "MiniMax Coding Plan",
		mode: "subscription",
		status: "not-configured",
		plan: "MiniMax Coding Plan",
		region,
		missingCredentials: [apiKeyRef],
		windows: []
	};
	const configuredUrl = nonEmptyUrl(deps.baseURL, MINIMAX_USAGE_PATH);
	const urls = configuredUrl === null ? [`${MINIMAX_TOKEN_PLAN_HOSTS[region]}${MINIMAX_TOKEN_PLAN_PATH}`, `${MINIMAX_LEGACY_HOSTS[region]}${MINIMAX_USAGE_PATH}`] : [configuredUrl];
	try {
		let body = null;
		for (const [index, url] of urls.entries()) try {
			body = await request$2(url, { headers: {
				authorization: `Bearer ${apiKey}`,
				accept: "application/json"
			} }, deps, "json");
			break;
		} catch (error) {
			if (index === 0 && urls.length > 1 && (error?.httpStatus === 404 || error?.httpStatus === 405)) continue;
			throw error;
		}
		const windows = parseMiniMax(body, deps.now());
		return {
			id: "minimax",
			displayName: "MiniMax Coding Plan",
			mode: "subscription",
			status: windows.length > 0 ? "ok" : "invalid-response",
			plan: "MiniMax Coding Plan",
			region,
			windows
		};
	} catch (error) {
		return {
			id: "minimax",
			displayName: "MiniMax Coding Plan",
			mode: "subscription",
			status: normalizedStatus(error),
			plan: "MiniMax Coding Plan",
			region,
			windows: []
		};
	}
}
/** Query one subscription/token-plan adapter. */
async function collectSubscription(providerId, credentials, options = {}, deps = {}) {
	const shared = {
		fetch: deps.fetch,
		readFile: deps.readFile,
		homedir: deps.homedir,
		timeoutMs: deps.timeoutMs,
		now: deps.now ?? Date.now,
		apiKeyRef: options.apiKeyRef,
		baseURL: options.baseURL,
		region: options.region
	};
	if (providerId === "opencode-go") return collectOpenCodeGo(credentials, shared);
	if (providerId === "zai") return collectZai(credentials, {
		...shared,
		zaiApiKeyRef: options.apiKeyRef,
		zaiDefaultRegion: options.region ?? "global"
	});
	if (providerId === "kimi") return collectKimi(credentials, shared);
	if (providerId === "minimax") return collectMiniMax(credentials, shared);
	return {
		id: providerId,
		displayName: providerId,
		mode: "subscription",
		status: "unavailable",
		windows: []
	};
}
({ ...REFS });
//#endregion
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/accounts.js
/**
* Unified provider-account monitoring.
*
* Adapters normalize monetary balances and subscription/token-plan windows to
* one discriminated account snapshot. Configuration is declarative: secrets
* are credential references, request paths are relative, and response fields
* are extracted with JSON Pointer rather than executable JavaScript.
*
* @module dsh-usage-skill/accounts
*/
const DEFAULT_TIMEOUT_MS = 15e3;
const DEFAULT_REFRESH_MS = 3e5;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const OPENROUTER_MANAGEMENT_REF = "OPENROUTER_MANAGEMENT_KEY";
const ACCOUNT_STATUSES = new Set([
	"ok",
	"not-configured",
	"unauthorized",
	"rate-limited",
	"unavailable",
	"invalid-response",
	"unsupported"
]);
const ADAPTERS = new Set([
	"deepseek-balance",
	"openrouter-balance",
	"moonshot-balance",
	"zai-balance",
	"general",
	"new-api",
	"sub2api",
	"opencode-go",
	"zai-token-plan",
	"kimi-token-plan",
	"minimax-token-plan",
	"declarative"
]);
const SENSITIVE_HEADERS = new Set([
	"authorization",
	"api-key",
	"cookie",
	"host",
	"proxy-authorization",
	"proxy-authenticate",
	"set-cookie",
	"transfer-encoding",
	"connection",
	"upgrade",
	"x-api-key"
]);
function nonEmptyString(value) {
	return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
function numberOrNull(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
}
function booleanOrNull(value) {
	if (typeof value === "boolean") return value;
	if (value === 1 || value === "1" || value === "true") return true;
	if (value === 0 || value === "0" || value === "false") return false;
	return null;
}
function round1(value) {
	return Math.round(value * 10) / 10;
}
function toIso(value) {
	if (value === null || value === void 0 || value === "") return null;
	if (typeof value === "number" && Number.isFinite(value)) {
		const date = new Date(value < 2e10 ? value * 1e3 : value);
		return Number.isNaN(date.getTime()) ? null : date.toISOString();
	}
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function statusError(status, message, httpStatus) {
	const error = new Error(message);
	error.providerStatus = status;
	if (httpStatus !== void 0) error.httpStatus = httpStatus;
	return error;
}
function statusOf(error) {
	if (ACCOUNT_STATUSES.has(error?.providerStatus)) return error.providerStatus;
	if (error?.name === "TimeoutError" || error?.name === "AbortError") return "unavailable";
	return "unavailable";
}
async function resolveCredential(credentials, ref) {
	if (nonEmptyString(ref) === null || credentials === null || credentials === void 0 || typeof credentials.resolve !== "function") return "";
	try {
		return nonEmptyString((await credentials.resolve(ref))?.value) ?? "";
	} catch {
		return "";
	}
}
function responseStatus(status) {
	if (status === 401 || status === 403) return "unauthorized";
	if (status === 429) return "rate-limited";
	if (status === 404 || status === 405) return "unsupported";
	return status >= 500 ? "unavailable" : "invalid-response";
}
async function parseJsonResponse(response, maxBytes = MAX_RESPONSE_BYTES) {
	const declared = numberOrNull(response.headers?.get?.("content-length"));
	if (declared !== null && declared > maxBytes) throw statusError("invalid-response", "upstream response exceeds the size limit");
	const contentType = response.headers?.get?.("content-type");
	if (typeof contentType === "string" && contentType !== "" && !/\bjson\b/i.test(contentType)) throw statusError("invalid-response", "upstream did not return JSON");
	if (typeof response.arrayBuffer === "function") {
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength > maxBytes) throw statusError("invalid-response", "upstream response exceeds the size limit");
		try {
			return JSON.parse(new TextDecoder().decode(bytes));
		} catch {
			throw statusError("invalid-response", "upstream returned invalid JSON");
		}
	}
	try {
		return await response.json();
	} catch {
		throw statusError("invalid-response", "upstream returned invalid JSON");
	}
}
async function requestJson(url, init, deps = {}) {
	const response = await (deps.fetch ?? fetch)(url, {
		...init,
		redirect: "manual",
		signal: AbortSignal.timeout(deps.timeoutMs ?? DEFAULT_TIMEOUT_MS)
	});
	if (!response.ok) throw statusError(responseStatus(response.status), `upstream returned HTTP ${response.status}`, response.status);
	return parseJsonResponse(response, deps.maxResponseBytes ?? MAX_RESPONSE_BYTES);
}
function schemeAdapter(scheme) {
	return `${scheme}-balance`;
}
function schemeOfAdapter(adapter) {
	return adapter.endsWith("-balance") ? adapter.slice(0, -8) : null;
}
function defaultAdapter(provider) {
	const providerId = provider.id;
	if (providerId === "opencode-go") return "opencode-go";
	if (providerId === "zai" || providerId === "zai-coding-cn") return "zai-token-plan";
	if (providerId === "kimi-coding" || providerId === "kimi-for-coding") return "kimi-token-plan";
	if ([
		"minimax",
		"minimaxi",
		"minimax-cn",
		"minimax-coding"
	].includes(providerId)) return "minimax-token-plan";
	if (providerId === "passion") return "sub2api";
	try {
		const hostname = new URL(provider.baseURL).hostname.toLowerCase();
		if (hostname === "passionapi.com" || hostname.endsWith(".passionapi.com")) return "sub2api";
	} catch {}
	const scheme = balanceSchemeOf(providerId);
	return scheme === null ? null : schemeAdapter(scheme);
}
function adapterMode(adapter, monitor) {
	if (adapter === "declarative") return monitor.mode;
	if ([
		"opencode-go",
		"zai-token-plan",
		"kimi-token-plan",
		"minimax-token-plan"
	].includes(adapter)) return "subscription";
	return "balance";
}
function assertRelativePath(path, label) {
	if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) throw new Error(`${label} must be an absolute-path relative path beginning with /`);
	try {
		if (new URL(path, "https://usage.invalid").origin !== "https://usage.invalid") throw new Error("origin changed");
	} catch {
		throw new Error(`${label} must be a relative path, not a URL`);
	}
}
function validatePointer(pointer, label) {
	if (pointer === void 0 || pointer === null) return;
	const value = typeof pointer === "object" && pointer !== null ? pointer.pointer : pointer;
	if (typeof value !== "string" || value !== "" && !value.startsWith("/")) throw new Error(`${label} must be a JSON Pointer`);
}
function validateWarning(value, label) {
	if (value === void 0) return;
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
	for (const field of ["warnBelow", "criticalBelow"]) if (value[field] !== void 0 && numberOrNull(value[field]) === null) throw new Error(`${label}.${field} must be numeric`);
	const warn = numberOrNull(value.warnBelow);
	const critical = numberOrNull(value.criticalBelow);
	if (warn !== null && critical !== null && critical > warn) throw new Error(`${label}.criticalBelow must not exceed warnBelow`);
}
function validateDeclarative(monitor, label) {
	if (monitor.mode !== "balance" && monitor.mode !== "subscription") throw new Error(`${label}.mode must be balance or subscription`);
	if (monitor.request === null || typeof monitor.request !== "object" || Array.isArray(monitor.request)) throw new Error(`${label}.request must be an object`);
	assertRelativePath(monitor.request.path, `${label}.request.path`);
	if (monitor.request.method !== void 0 && monitor.request.method !== "GET") throw new Error(`${label}.request.method must be GET`);
	const authType = monitor.request.auth?.type;
	if (authType !== void 0 && ![
		"bearer",
		"raw",
		"x-api-key"
	].includes(authType)) throw new Error(`${label}.request.auth.type is unsupported`);
	for (const name of Object.keys(monitor.request.headers ?? {})) if (SENSITIVE_HEADERS.has(name.toLowerCase())) throw new Error(`${label}.request.headers cannot override ${name}`);
	if (monitor.extract === null || typeof monitor.extract !== "object" || Array.isArray(monitor.extract)) throw new Error(`${label}.extract must be an object`);
	for (const field of [
		"root",
		"valid",
		"invalidMessage",
		"plan",
		"remaining",
		"used",
		"total",
		"currency",
		"unlimited",
		"expiresAt",
		"items",
		"kind",
		"usedPercent",
		"remainingPercent",
		"resetsAt"
	]) validatePointer(monitor.extract[field], `${label}.extract.${field}`);
	if (monitor.mode === "balance" && monitor.extract.remaining === void 0 && monitor.extract.total === void 0) throw new Error(`${label}.extract requires remaining or total`);
	if (monitor.mode === "subscription" && monitor.extract.items === void 0) throw new Error(`${label}.extract.items is required`);
	if (monitor.extract.divisor !== void 0 && (numberOrNull(monitor.extract.divisor) === null || Number(monitor.extract.divisor) === 0)) throw new Error(`${label}.extract.divisor must be a non-zero number`);
}
/** Validate and freeze the non-secret account-monitor configuration shape. */
function validateAccountConfig(raw = {}) {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("account config must be an object");
	const monitors = raw.monitors ?? {};
	if (monitors === null || typeof monitors !== "object" || Array.isArray(monitors)) throw new Error("monitors must be an object keyed by provider id");
	const normalized = {};
	for (const [key, value] of Object.entries(monitors)) {
		const label = `monitors.${key}`;
		if (nonEmptyString(key) === null || value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
		const providerId = nonEmptyString(value.providerId) ?? key;
		const adapter = nonEmptyString(value.adapter);
		if (adapter === null || !ADAPTERS.has(adapter)) throw new Error(`${label}.adapter is unsupported`);
		if (value.usageBaseURL !== void 0) {
			let url;
			try {
				url = new URL(value.usageBaseURL);
			} catch {
				throw new Error(`${label}.usageBaseURL must be a valid URL`);
			}
			if (url.username !== "" || url.password !== "") throw new Error(`${label}.usageBaseURL must not contain credentials`);
			if (url.protocol !== "https:" && value.allowInsecure !== true) throw new Error(`${label}.usageBaseURL must use HTTPS unless allowInsecure is true`);
		}
		validateWarning(value.warning, `${label}.warning`);
		if (adapter === "declarative") validateDeclarative(value, label);
		normalized[providerId] = {
			...value,
			providerId,
			adapter
		};
	}
	return { monitors: normalized };
}
/** Bind one configured Harness provider to its explicit or built-in adapter. */
function resolveAccountSpec(provider, config = { monitors: {} }) {
	const monitor = config.monitors?.[provider.id] ?? {};
	const adapter = monitor.adapter ?? defaultAdapter(provider);
	const mode = adapter === null ? null : adapterMode(adapter, monitor);
	const apiKeyRef = monitor.credentialRef ?? (adapter === "openrouter-balance" ? OPENROUTER_MANAGEMENT_REF : provider.apiKeyEnv);
	return {
		id: provider.id,
		displayName: provider.displayName ?? provider.id,
		adapter,
		mode,
		apiKeyRef,
		baseURL: monitor.usageBaseURL ?? provider.baseURL,
		providerBaseURL: provider.baseURL,
		monitor,
		configKey: JSON.stringify({
			adapter,
			mode,
			provider,
			monitor
		})
	};
}
function decodePointerToken(token) {
	return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
/** RFC 6901 JSON Pointer lookup; missing paths return undefined. */
function jsonPointer(value, pointer) {
	if (pointer === "" || pointer === void 0 || pointer === null) return value;
	if (typeof pointer !== "string" || !pointer.startsWith("/")) return void 0;
	let current = value;
	for (const raw of pointer.slice(1).split("/")) {
		const key = decodePointerToken(raw);
		if (current === null || current === void 0 || typeof current !== "object" || !Object.hasOwn(current, key)) return void 0;
		current = current[key];
	}
	return current;
}
function mapped(root, mapping) {
	if (mapping === void 0 || mapping === null) return void 0;
	if (typeof mapping === "string") return jsonPointer(root, mapping);
	if (typeof mapping === "object" && typeof mapping.pointer === "string") {
		const value = jsonPointer(root, mapping.pointer);
		const divisor = numberOrNull(mapping.divisor);
		return divisor === null ? value : numberOrNull(value) === null ? void 0 : Number(value) / divisor;
	}
}
function ipv4Private(octets) {
	const [a, b, c] = octets;
	return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 192 && b === 0 && (c === 0 || c === 2) || a === 192 && b === 88 && c === 99 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19) || a === 198 && b === 51 && c === 100 || a === 203 && b === 0 && c === 113 || a >= 224;
}
function ipv6Bytes(address) {
	let value = address.toLowerCase().split("%")[0];
	let ipv4Tail = null;
	const lastColon = value.lastIndexOf(":");
	if (value.slice(lastColon + 1).includes(".")) {
		const octets = value.slice(lastColon + 1).split(".").map(Number);
		if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
		ipv4Tail = [octets[0] << 8 | octets[1], octets[2] << 8 | octets[3]];
		value = `${value.slice(0, lastColon)}:${ipv4Tail[0].toString(16)}:${ipv4Tail[1].toString(16)}`;
	}
	const halves = value.split("::");
	if (halves.length > 2) return null;
	const left = halves[0] === "" ? [] : halves[0].split(":");
	const right = halves.length === 1 || halves[1] === "" ? [] : halves[1].split(":");
	const missing = 8 - left.length - right.length;
	if (missing < 0 || halves.length === 1 && missing !== 0) return null;
	const words = [
		...left,
		...Array(missing).fill("0"),
		...right
	].map((part) => Number.parseInt(part || "0", 16));
	if (words.length !== 8 || words.some((part) => !Number.isInteger(part) || part < 0 || part > 65535)) return null;
	const bytes = [];
	for (const word of words) bytes.push(word >> 8, word & 255);
	return bytes;
}
/** True for loopback, private, link-local, documentation, multicast, and other non-public IP space. */
function isPrivateAddress(address) {
	const value = String(address ?? "").trim().replace(/^\[|\]$/g, "");
	if (isIP(value) === 4) return ipv4Private(value.split(".").map(Number));
	if (isIP(value) !== 6) return false;
	const bytes = ipv6Bytes(value);
	if (bytes === null) return true;
	if (bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 255 && bytes[11] === 255) return ipv4Private(bytes.slice(12));
	const globalUnicast = (bytes[0] & 224) === 32;
	const word0 = bytes[0] << 8 | bytes[1];
	const word1 = bytes[2] << 8 | bytes[3];
	const ietfSpecial = word0 === 8193 && word1 <= 511;
	const sixToFour = word0 === 8194;
	const documentation = word0 === 8193 && word1 === 3512 || word0 === 16383 && (word1 & 61440) === 0;
	return !globalUnicast || ietfSpecial || sixToFour || documentation;
}
function privateHostname(hostname) {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	return host === "localhost" || host.endsWith(".localhost") || isPrivateAddress(host);
}
async function resolvePublicAddress(url, spec, deps) {
	const hostname = url.hostname.replace(/^\[|\]$/g, "");
	if (privateHostname(hostname) && spec.monitor.allowPrivateNetwork !== true) throw statusError("unsupported", "account monitor private-network access requires allowPrivateNetwork");
	if (isIP(hostname) !== 0) return {
		address: hostname,
		family: isIP(hostname)
	};
	let addresses;
	try {
		addresses = await (deps.lookup ?? lookup)(hostname, {
			all: true,
			verbatim: true
		});
	} catch {
		throw statusError("unavailable", "account monitor hostname could not be resolved");
	}
	if (!Array.isArray(addresses)) addresses = [addresses];
	if (addresses.length === 0) throw statusError("unavailable", "account monitor hostname resolved to no addresses");
	if (spec.monitor.allowPrivateNetwork !== true && addresses.some((entry) => isPrivateAddress(entry?.address))) throw statusError("unsupported", "account monitor hostname resolves to a private network");
	const selected = addresses[0];
	return {
		address: selected.address,
		family: selected.family ?? isIP(selected.address)
	};
}
function crossOriginSensitive(spec) {
	return spec.monitor.usageBaseURL !== void 0 || spec.adapter === "general" || spec.adapter === "new-api" || spec.adapter === "declarative" || schemeOfAdapter(spec.adapter ?? "") !== null;
}
async function assertTargetPolicy(rawUrl, spec, deps) {
	const url = new URL(rawUrl);
	if (url.username !== "" || url.password !== "") throw statusError("unsupported", "account monitor URL must not contain credentials");
	if (url.protocol !== "https:" && spec.monitor.allowInsecure !== true) throw statusError("unsupported", "account monitor requires HTTPS");
	if (url.protocol !== "https:" && url.protocol !== "http:") throw statusError("unsupported", "account monitor protocol is unsupported");
	if (crossOriginSensitive(spec) && nonEmptyString(spec.providerBaseURL) !== null) {
		const providerOrigin = new URL(spec.providerBaseURL).origin;
		if (url.origin !== providerOrigin && spec.monitor.allowCrossOrigin !== true) throw statusError("unsupported", "account monitor cross-origin access requires allowCrossOrigin");
	}
	return {
		url,
		...await resolvePublicAddress(url, spec, deps)
	};
}
function responseHeaders(headers) {
	return { get: (name) => {
		const value = headers[String(name).toLowerCase()];
		return Array.isArray(value) ? value.join(", ") : value === void 0 ? null : String(value);
	} };
}
/** HTTPS/HTTP transport that pins the DNS answer checked by the policy layer. */
async function pinnedFetch(rawUrl, init, spec, deps) {
	const target = await assertTargetPolicy(rawUrl, spec, deps);
	const signal = init?.signal ?? AbortSignal.timeout(deps.timeoutMs ?? DEFAULT_TIMEOUT_MS);
	return new Promise((resolve, reject) => {
		const request$3 = (target.url.protocol === "https:" ? request$1 : request)(target.url, {
			method: init?.method ?? "GET",
			headers: init?.headers,
			signal,
			servername: isIP(target.url.hostname.replace(/^\[|\]$/g, "")) === 0 ? target.url.hostname : void 0,
			lookup: (_hostname, options, callback) => {
				if (options?.all) callback(null, [{
					address: target.address,
					family: target.family
				}]);
				else callback(null, target.address, target.family);
			}
		}, (response) => {
			const chunks = [];
			let size = 0;
			response.on("data", (chunk) => {
				size += chunk.length;
				if (size > (deps.maxResponseBytes ?? MAX_RESPONSE_BYTES)) request$3.destroy(statusError("invalid-response", "upstream response exceeds the size limit"));
				else chunks.push(chunk);
			});
			response.on("end", () => {
				const body = Buffer.concat(chunks);
				resolve({
					ok: response.statusCode >= 200 && response.statusCode < 300,
					status: response.statusCode,
					headers: responseHeaders(response.headers),
					arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
					json: async () => JSON.parse(body.toString("utf8")),
					text: async () => body.toString("utf8")
				});
			});
		});
		request$3.on("error", reject);
		request$3.end();
	});
}
function customURL(spec) {
	const base = new URL(spec.baseURL);
	const providerBase = nonEmptyString(spec.providerBaseURL) === null ? null : new URL(spec.providerBaseURL);
	if (base.protocol !== "https:" && spec.monitor.allowInsecure !== true) throw statusError("unsupported", "custom monitor requires HTTPS");
	if (privateHostname(base.hostname) && spec.monitor.allowPrivateNetwork !== true) throw statusError("unsupported", "custom monitor private-network access requires allowPrivateNetwork");
	if (providerBase !== null && base.origin !== providerBase.origin && spec.monitor.allowCrossOrigin !== true) throw statusError("unsupported", "custom monitor cross-origin access requires allowCrossOrigin");
	const url = new URL(spec.monitor.request.path, base);
	if (url.origin !== base.origin) throw statusError("unsupported", "custom monitor request must stay on its configured origin");
	return url.href;
}
function customHeaders(spec, credential) {
	const headers = { accept: "application/json" };
	for (const [name, value] of Object.entries(spec.monitor.request.headers ?? {})) if (!SENSITIVE_HEADERS.has(name.toLowerCase()) && typeof value === "string") headers[name] = value;
	const type = spec.monitor.request.auth?.type;
	if (credential !== "") {
		if (type === "bearer") headers.authorization = `Bearer ${credential}`;
		if (type === "raw") headers.authorization = credential;
		if (type === "x-api-key") headers["x-api-key"] = credential;
	}
	return headers;
}
function balanceAlert(balance, warning) {
	const remaining = numberOrNull(balance?.remaining);
	const warnBelow = numberOrNull(warning?.warnBelow);
	const criticalBelow = numberOrNull(warning?.criticalBelow);
	if (remaining !== null && (warnBelow !== null || criticalBelow !== null)) {
		if (criticalBelow !== null && remaining <= criticalBelow) return {
			level: "critical",
			metric: "balance",
			value: remaining,
			threshold: criticalBelow
		};
		if (warnBelow !== null && remaining <= warnBelow) return {
			level: "warning",
			metric: "balance",
			value: remaining,
			threshold: warnBelow
		};
		return {
			level: "normal",
			metric: "balance",
			value: remaining
		};
	}
	const total = numberOrNull(balance?.total);
	if (remaining !== null && total !== null && total > 0) {
		const value = round1(Math.max(0, Math.min(100, remaining / total * 100)));
		return {
			level: value <= 10 ? "critical" : value <= 30 ? "warning" : "normal",
			metric: "remaining-percent",
			value
		};
	}
	return {
		level: "unknown",
		metric: "balance",
		value: remaining
	};
}
function subscriptionAlert(windows) {
	const remaining = windows.map((entry) => numberOrNull(entry.remainingPercent)).filter((value) => value !== null);
	if (remaining.length === 0) return {
		level: "unknown",
		metric: "remaining-percent",
		value: null
	};
	const value = round1(Math.min(...remaining));
	return {
		level: value <= 10 ? "critical" : value <= 30 ? "warning" : "normal",
		metric: "remaining-percent",
		value
	};
}
function baseSnapshot(spec, status, now) {
	return {
		id: spec.id,
		displayName: spec.displayName,
		mode: spec.mode ?? "balance",
		adapter: spec.adapter,
		status,
		fetchedAt: now
	};
}
function unavailableSnapshot(spec, status, now, extra = {}) {
	const base = baseSnapshot(spec, status, now);
	if (base.mode === "subscription") return {
		...base,
		windows: [],
		alert: subscriptionAlert([]),
		...extra
	};
	return {
		...base,
		balance: null,
		alert: {
			level: "unknown",
			metric: "balance",
			value: null
		},
		...extra
	};
}
async function queryBuiltInBalance(spec, credential, deps, now) {
	const scheme = schemeOfAdapter(spec.adapter);
	const raw = await queryBalance(scheme, spec.baseURL, credential, deps.timeoutMs ?? DEFAULT_TIMEOUT_MS, deps.fetch ?? fetch);
	const remaining = numberOrNull(raw.total);
	if (remaining === null) throw statusError("invalid-response", "balance response is missing a numeric amount");
	const used = numberOrNull(raw.used);
	const total = numberOrNull(raw.limit);
	const balance = {
		remaining,
		...used === null ? {} : { used },
		...total === null ? {} : { total },
		currency: nonEmptyString(raw.currency) ?? "USD",
		unlimited: false,
		expiresAt: null,
		available: raw.isAvailable !== false,
		breakdown: {
			granted: numberOrNull(raw.granted),
			toppedUp: numberOrNull(raw.toppedUp)
		}
	};
	return {
		...baseSnapshot(spec, scheme === "deepseek" && raw.isAvailable === false ? "unavailable" : "ok", now),
		balance,
		alert: balanceAlert(balance, spec.monitor.warning)
	};
}
async function queryGeneral(spec, credential, deps, now) {
	const body = await requestJson(new URL("/user/balance", spec.baseURL).href, { headers: {
		authorization: `Bearer ${credential}`,
		accept: "application/json"
	} }, deps);
	const remaining = numberOrNull(body?.balance);
	if (remaining === null) throw statusError("invalid-response", "general balance response is missing balance");
	const balance = {
		remaining,
		currency: nonEmptyString(body?.currency) ?? "USD",
		unlimited: false,
		expiresAt: null
	};
	return {
		...baseSnapshot(spec, "ok", now),
		balance,
		alert: balanceAlert(balance, spec.monitor.warning)
	};
}
async function quotaPerUnit(spec, deps) {
	try {
		const value = numberOrNull((await requestJson(new URL("/api/status", spec.baseURL).href, { headers: { accept: "application/json" } }, deps))?.data?.quota_per_unit);
		if (value !== null && value > 0) return {
			value,
			fallback: false
		};
		return {
			value: 5e5,
			fallback: true
		};
	} catch (error) {
		if (error?.httpStatus === 404 || error?.httpStatus === 405) return {
			value: 5e5,
			fallback: true
		};
		throw error;
	}
}
async function queryNewApiFallback(spec, credentials, deps, now) {
	const ref = spec.monitor.fallbackCredentialRef;
	const token = await resolveCredential(credentials, ref);
	if (token === "") return unavailableSnapshot(spec, "unsupported", now, { missingCredentials: ref === void 0 ? [] : [ref] });
	const headers = {
		authorization: `Bearer ${token}`,
		accept: "application/json"
	};
	const userId = await resolveCredential(credentials, spec.monitor.fallbackUserIdRef);
	if (userId !== "") headers["new-api-user"] = userId;
	const [body, quotaUnit] = await Promise.all([requestJson(new URL("/api/user/self", spec.baseURL).href, { headers }, deps), quotaPerUnit(spec, deps)]);
	const unit = quotaUnit.value;
	if (body?.success === false || body?.data === null || typeof body?.data !== "object") throw statusError("invalid-response", "New API user response is invalid");
	const remainingQuota = numberOrNull(body.data.quota);
	const usedQuota = numberOrNull(body.data.used_quota);
	if (remainingQuota === null) throw statusError("invalid-response", "New API user response is missing quota");
	const balance = {
		remaining: remainingQuota / unit,
		...usedQuota === null ? {} : {
			used: usedQuota / unit,
			total: (remainingQuota + usedQuota) / unit
		},
		currency: "USD",
		unlimited: false,
		expiresAt: null
	};
	return {
		...baseSnapshot(spec, "ok", now),
		plan: nonEmptyString(body.data.group) ?? void 0,
		balance,
		alert: balanceAlert(balance, spec.monitor.warning),
		source: "management-fallback",
		quotaUnit: unit,
		quotaUnitFallback: quotaUnit.fallback
	};
}
async function queryNewApi(spec, credentials, credential, deps, now) {
	let body;
	try {
		body = await requestJson(new URL("/api/usage/token/", spec.baseURL).href, { headers: {
			authorization: `Bearer ${credential}`,
			accept: "application/json"
		} }, deps);
	} catch (error) {
		if (error?.httpStatus === 404 || error?.httpStatus === 405) return queryNewApiFallback(spec, credentials, deps, now);
		throw error;
	}
	if (body?.code !== true || body?.data === null || typeof body?.data !== "object") throw statusError("invalid-response", "New API token response is invalid");
	const granted = numberOrNull(body.data.total_granted);
	const used = numberOrNull(body.data.total_used);
	const available = numberOrNull(body.data.total_available);
	const quotaUnit = await quotaPerUnit(spec, deps);
	const unit = quotaUnit.value;
	const unlimited = booleanOrNull(body.data.unlimited_quota) === true;
	if (!unlimited && available === null) throw statusError("invalid-response", "New API token response is missing total_available");
	const balance = {
		remaining: available === null ? null : available / unit,
		...used === null ? {} : { used: used / unit },
		...granted === null ? {} : { total: granted / unit },
		currency: "USD",
		unlimited,
		expiresAt: numberOrNull(body.data.expires_at) > 0 ? toIso(body.data.expires_at) : null
	};
	return {
		...baseSnapshot(spec, "ok", now),
		plan: nonEmptyString(body.data.name) ?? void 0,
		balance,
		alert: unlimited ? {
			level: "normal",
			metric: "remaining-percent",
			value: 100
		} : balanceAlert(balance, spec.monitor.warning),
		source: "token",
		quotaUnit: unit,
		quotaUnitFallback: quotaUnit.fallback
	};
}
function amountWindow(kind, usedValue, limitValue, remainingValue, resetsAt) {
	const limit = numberOrNull(limitValue);
	if (limit === null || limit <= 0) return null;
	const remaining = numberOrNull(remainingValue);
	const used = numberOrNull(usedValue) ?? (remaining === null ? null : limit - remaining);
	if (used === null) return null;
	const usedPercent = round1(Math.max(0, Math.min(100, used / limit * 100)));
	const reset = toIso(resetsAt);
	return {
		kind,
		usedPercent,
		remainingPercent: round1(100 - usedPercent),
		...reset === null ? {} : { resetsAt: reset }
	};
}
function sub2ApiWindowKind(value) {
	const kind = nonEmptyString(value) ?? "quota";
	if (kind === "5h") return "session";
	if (kind === "1d") return "daily";
	if (kind === "7d") return "weekly";
	return kind;
}
function sub2ApiSubscription(spec, body, now) {
	const windows = [];
	if (body.mode === "quota_limited") {
		const quota = body.quota;
		if (quota === null || typeof quota !== "object" || Array.isArray(quota)) throw statusError("invalid-response", "Sub2API quota response is missing quota");
		const total = amountWindow("quota", quota.used, quota.limit, quota.remaining, body.expires_at);
		if (total !== null) windows.push(total);
		for (const entry of Array.isArray(body.rate_limits) ? body.rate_limits : []) {
			if (entry === null || typeof entry !== "object" || Array.isArray(entry)) continue;
			const window = amountWindow(sub2ApiWindowKind(entry.window), entry.used, entry.limit, entry.remaining, entry.reset_at);
			if (window !== null) windows.push(window);
		}
	} else {
		const subscription = body.subscription;
		if (subscription === null || typeof subscription !== "object" || Array.isArray(subscription)) throw statusError("invalid-response", "Sub2API subscription response is missing subscription limits");
		for (const period of [
			"daily",
			"weekly",
			"monthly"
		]) {
			const window = amountWindow(period, subscription[`${period}_usage_usd`], subscription[`${period}_limit_usd`], null, null);
			if (window !== null) windows.push(window);
		}
	}
	if (windows.length === 0) throw statusError("invalid-response", "Sub2API response has no usable quota windows");
	return {
		...baseSnapshot(spec, "ok", now),
		mode: "subscription",
		plan: nonEmptyString(body.planName) ?? nonEmptyString(body.plan_name) ?? "Sub2API",
		windows,
		alert: subscriptionAlert(windows)
	};
}
async function querySub2Api(spec, credential, deps, now) {
	const body = await requestJson(new URL("/v1/usage", spec.baseURL).href, { headers: {
		authorization: `Bearer ${credential}`,
		accept: "application/json"
	} }, deps);
	if (body === null || typeof body !== "object" || Array.isArray(body)) throw statusError("invalid-response", "Sub2API response must be an object");
	if (body.isValid === false || body.is_active === false) throw statusError("unauthorized", "Sub2API key is invalid");
	const hasSubscription = body.subscription !== null && typeof body.subscription === "object" && !Array.isArray(body.subscription);
	if (body.mode === "quota_limited" || hasSubscription) return sub2ApiSubscription(spec, body, now);
	const remaining = numberOrNull(body.balance ?? body.remaining);
	if (remaining === null) throw statusError("invalid-response", "Sub2API response is missing a numeric balance");
	const balance = {
		remaining,
		currency: nonEmptyString(body.unit) ?? "USD",
		unlimited: false,
		expiresAt: toIso(body.expires_at)
	};
	return {
		...baseSnapshot(spec, "ok", now),
		mode: "balance",
		plan: nonEmptyString(body.planName) ?? nonEmptyString(body.plan_name) ?? void 0,
		balance,
		alert: balanceAlert(balance, spec.monitor.warning)
	};
}
function customBalance(spec, body, now) {
	const extract = spec.monitor.extract;
	const root = jsonPointer(body, extract.root ?? "");
	if (root === void 0) throw statusError("invalid-response", "custom response root is missing");
	if (mapped(root, extract.valid) === false) throw statusError("invalid-response", String(mapped(root, extract.invalidMessage) ?? "custom response is marked invalid"));
	const divisor = numberOrNull(extract.divisor) ?? 1;
	const remainingRaw = numberOrNull(mapped(root, extract.remaining) ?? mapped(root, extract.total));
	if (remainingRaw === null) throw statusError("invalid-response", "custom response is missing a numeric balance");
	const usedRaw = numberOrNull(mapped(root, extract.used));
	const totalRaw = numberOrNull(mapped(root, extract.total));
	const balance = {
		remaining: remainingRaw / divisor,
		...usedRaw === null ? {} : { used: usedRaw / divisor },
		...totalRaw === null ? {} : { total: totalRaw / divisor },
		currency: nonEmptyString(mapped(root, extract.currency)) ?? nonEmptyString(extract.currencyValue) ?? "USD",
		unlimited: booleanOrNull(mapped(root, extract.unlimited)) === true,
		expiresAt: toIso(mapped(root, extract.expiresAt))
	};
	return {
		...baseSnapshot(spec, "ok", now),
		plan: nonEmptyString(mapped(root, extract.plan)) ?? void 0,
		balance,
		alert: balanceAlert(balance, spec.monitor.warning)
	};
}
function customSubscription(spec, body, now) {
	const extract = spec.monitor.extract;
	const root = jsonPointer(body, extract.root ?? "");
	const items = mapped(root, extract.items);
	if (!Array.isArray(items)) throw statusError("invalid-response", "custom response items must be an array");
	const windows = [];
	for (const item of items) {
		const used = numberOrNull(mapped(item, extract.usedPercent));
		const remaining = numberOrNull(mapped(item, extract.remainingPercent));
		if (used === null && remaining === null) continue;
		const usedPercent = round1(Math.max(0, Math.min(100, used ?? 100 - remaining)));
		const remainingPercent = round1(Math.max(0, Math.min(100, remaining ?? 100 - used)));
		windows.push({
			kind: nonEmptyString(mapped(item, extract.kind)) ?? "quota",
			usedPercent,
			remainingPercent,
			...toIso(mapped(item, extract.resetsAt)) === null ? {} : { resetsAt: toIso(mapped(item, extract.resetsAt)) }
		});
	}
	if (windows.length === 0) throw statusError("invalid-response", "custom response has no usable quota windows");
	return {
		...baseSnapshot(spec, "ok", now),
		plan: nonEmptyString(mapped(root, extract.plan)) ?? void 0,
		windows,
		alert: subscriptionAlert(windows)
	};
}
async function queryDeclarative(spec, credentials, deps, now) {
	const ref = spec.monitor.request.auth?.credentialRef ?? spec.apiKeyRef;
	const credential = await resolveCredential(credentials, ref);
	if (spec.monitor.request.auth !== void 0 && credential === "") return unavailableSnapshot(spec, "not-configured", now, { missingCredentials: ref === void 0 ? [] : [ref] });
	const body = await requestJson(customURL(spec), {
		method: "GET",
		headers: customHeaders(spec, credential)
	}, deps);
	return spec.mode === "subscription" ? customSubscription(spec, body, now) : customBalance(spec, body, now);
}
/** Query one adapter and return a secret-free normalized account snapshot. */
async function queryAccount(spec, credentials, deps = {}) {
	const now = (deps.now ?? Date.now)();
	if (spec === null || spec === void 0 || spec.adapter === null || spec.mode === null) return unavailableSnapshot(spec ?? {
		id: "unknown",
		displayName: "Unknown",
		adapter: null,
		mode: "balance"
	}, "unsupported", now);
	try {
		const safeDeps = deps.fetch === void 0 ? {
			...deps,
			fetch: (url, init) => pinnedFetch(url, init, spec, deps)
		} : deps;
		if (spec.adapter === "declarative") return await queryDeclarative(spec, credentials, safeDeps, now);
		const credential = await resolveCredential(credentials, spec.apiKeyRef);
		if (spec.adapter !== "opencode-go" && credential === "") return unavailableSnapshot(spec, "not-configured", now, { missingCredentials: spec.apiKeyRef === void 0 ? [] : [spec.apiKeyRef] });
		if (schemeOfAdapter(spec.adapter) !== null) return await queryBuiltInBalance(spec, credential, safeDeps, now);
		if (spec.adapter === "general") return await queryGeneral(spec, credential, safeDeps, now);
		if (spec.adapter === "new-api") return await queryNewApi(spec, credentials, credential, safeDeps, now);
		if (spec.adapter === "sub2api") return await querySub2Api(spec, credential, safeDeps, now);
		const provider = await collectSubscription(spec.adapter === "zai-token-plan" ? "zai" : spec.adapter === "kimi-token-plan" ? "kimi" : spec.adapter === "minimax-token-plan" ? "minimax" : "opencode-go", credentials, {
			apiKeyRef: spec.apiKeyRef,
			region: spec.monitor.region ?? (spec.adapter === "zai-token-plan" && String(spec.baseURL ?? "").includes("bigmodel.cn") ? "bigmodel-cn" : void 0) ?? (spec.adapter === "minimax-token-plan" && String(spec.baseURL ?? "").includes("minimaxi.com") ? "cn" : void 0),
			baseURL: spec.monitor.usageBaseURL
		}, safeDeps);
		const windows = Array.isArray(provider.windows) ? provider.windows : [];
		return {
			...baseSnapshot(spec, provider.status, now),
			plan: provider.plan,
			windows,
			alert: subscriptionAlert(windows),
			...provider.missingCredentials === void 0 ? {} : { missingCredentials: provider.missingCredentials }
		};
	} catch (error) {
		return unavailableSnapshot(spec, statusOf(error), now);
	}
}
function isTransient(status) {
	return status === "unavailable" || status === "rate-limited" || status === "invalid-response";
}
function withStaleData(previous, current) {
	if (previous?.status !== "ok" || !isTransient(current.status)) return current;
	return {
		...previous,
		status: current.status,
		fetchedAt: current.fetchedAt,
		lastSuccessAt: previous.lastSuccessAt ?? previous.fetchedAt,
		stale: true
	};
}
/**
* In-memory account cache with per-provider single-flight and forced bulk
* refresh. Background scheduling is owned by the server plugin so it can also
* refresh local token-usage aggregation in the same five-minute cycle.
*/
function createAccountService({ credentials, getProviders, config = { monitors: {} }, deps = {} }) {
	const cache = /* @__PURE__ */ new Map();
	const inflight = /* @__PURE__ */ new Map();
	const refreshMs = deps.refreshMs ?? DEFAULT_REFRESH_MS;
	async function specs() {
		const providers = [...await getProviders()];
		if (deps.includeLegacyProviders !== false) {
			if (!providers.some((provider) => provider.id === "opencode-go")) providers.push({
				id: "opencode-go",
				displayName: "OpenCode Go",
				apiKeyEnv: "OPENCODE_GO_API_KEY"
			});
			if (!providers.some((provider) => provider.id === "zai" || provider.id === "zai-coding-cn")) providers.push({
				id: "zai",
				displayName: "Z.ai",
				apiKeyEnv: "ZAI_API_KEY",
				baseURL: "https://api.z.ai"
			});
		}
		const known = new Set(providers.map((provider) => provider.id));
		const unknown = Object.keys(config.monitors ?? {}).filter((providerId) => !known.has(providerId));
		if (unknown.length > 0) throw new Error(`account monitor references unknown provider: ${unknown.join(", ")}`);
		return providers.map((provider) => resolveAccountSpec(provider, config));
	}
	async function specById(providerId) {
		return (await specs()).find((spec) => spec.id === providerId) ?? null;
	}
	async function refresh(spec) {
		const existing = inflight.get(spec.id);
		if (existing !== void 0) return existing;
		const promise = queryAccount(spec, credentials, deps).then((current) => {
			const next = withStaleData(cache.get(spec.id)?.account, current);
			cache.set(spec.id, {
				configKey: spec.configKey,
				account: next
			});
			return next;
		}).finally(() => inflight.delete(spec.id));
		inflight.set(spec.id, promise);
		return promise;
	}
	async function get(providerId, { force = false } = {}) {
		const spec = await specById(providerId);
		if (spec === null) return null;
		const hit = cache.get(providerId);
		const age = (deps.now ?? Date.now)() - (hit?.account?.fetchedAt ?? 0);
		if (!force && hit?.configKey === spec.configKey && age >= 0 && age < refreshMs) return hit.account;
		return refresh(spec);
	}
	async function refreshAll() {
		const all = await specs();
		return Promise.all(all.filter((spec) => spec.adapter !== null).map(refresh));
	}
	async function providerViews() {
		return Promise.all((await specs()).map(async (spec) => {
			const account = cache.get(spec.id)?.account;
			const credentialConfigured = account === void 0 && spec.apiKeyRef !== void 0 ? await resolveCredential(credentials, spec.apiKeyRef) !== "" : false;
			return {
				id: spec.id,
				displayName: spec.displayName,
				accountMode: account?.mode ?? spec.mode,
				adapter: spec.adapter,
				configured: account === void 0 ? credentialConfigured : account.status !== "not-configured",
				status: account?.status ?? "pending",
				fetchedAt: account?.fetchedAt ?? null,
				alert: account?.alert ?? null
			};
		}));
	}
	async function subscriptionAccounts() {
		const all = await specs();
		return (await Promise.all(all.filter((spec) => spec.mode === "subscription" || spec.adapter === "sub2api").map((spec) => get(spec.id)))).filter((account) => account?.mode === "subscription");
	}
	return {
		get,
		refreshAll,
		providerViews,
		subscriptionAccounts,
		validate: async () => {
			await specs();
		},
		cached: (providerId) => cache.get(providerId)?.account ?? null
	};
}
//#endregion
//#region ../../plugins/kr-dsh/dsh-usage-skill/lib/index.js
/**
* dsh-usage-skill — server half.
*
* Registers five read-only, loopback-only endpoints on the web server:
*   GET /api/usage-stats/usage         — per-day token usage across every session
*   GET /api/usage-stats/providers     — configured providers + balance schemes
*   GET /api/usage-stats/balance       — balance for one provider (?provider=<id>)
*   GET /api/usage-stats/subscriptions — OpenCode Go + Z.ai quota windows
*   GET /api/usage-stats/account       — unified account snapshot for one provider
*
* Provider configuration is read straight from the harness settings
* (`llm-deepseek` for the official DeepSeek route, `llm-pi-ai` for every
* configured pi-ai provider profile), and each provider's API key is resolved
* through the credentials seam at request time — nothing is stored by this
* plugin.
*
* The endpoints live under the `/api` prefix as exact routes, so they win
* over the connection plugin's `/api` prefix handler; each handler applies
* its own peer-socket loopback fence (the exact routes bypass the RPC trust
* fence); Host is checked only as an additional defense.
*
* Usage aggregation is INCREMENTAL: per-session fold state (day/model
* buckets plus the last usage sample) is cached in memory and persisted to
* `<DSH_HOME>/storages/usage-stats-cache.json`. On each request only the
* events added since the last fold are processed — live sessions fold their
* in-memory tail, while persisted sessions use the storage backend's opaque
* revision when available. Steady-state cost stays O(new events) no matter
* how large the logs grow.
*
* @module dsh-usage-skill
*/
const USAGE_PATH = "/api/usage-stats/usage";
const PROVIDERS_PATH = "/api/usage-stats/providers";
const BALANCE_PATH = "/api/usage-stats/balance";
const SUBSCRIPTIONS_PATH = "/api/usage-stats/subscriptions";
const ACCOUNT_PATH = "/api/usage-stats/account";
const UPSTREAM_TIMEOUT_MS = 15e3;
const CACHE_VERSION = 3;
/** Default DeepSeek connection facts when the settings namespace is absent. */
const DEEPSEEK_DEFAULTS = {
	apiKeyEnv: "DEEPSEEK_API_KEY",
	baseURL: "https://api.deepseek.com"
};
/** Write a JSON response. */
function json(res, status, value) {
	const body = JSON.stringify(value);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-cache"
	});
	res.end(body);
}
/**
* Loopback fence, primary on the PEER SOCKET address (not the
* client-controllable Host header): the request must come from a loopback
* interface. IPv4-mapped IPv6 (`::ffff:127.0.0.1`) is normalized. The Host
* header is kept as an additional check, never as the deciding one.
*/
function isLoopbackAddress(address) {
	if (typeof address !== "string") return false;
	const a = address.toLowerCase();
	if (a === "::1") return true;
	const octets = (a.startsWith("::ffff:") ? a.slice(7) : a).split(".");
	return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** Parse a Host header without breaking bracketed or bare IPv6 literals. */
function hostNameOf(value) {
	if (typeof value !== "string") return null;
	const host = value.trim().toLowerCase();
	if (host.startsWith("[")) {
		const close = host.indexOf("]");
		if (close <= 1) return null;
		const suffix = host.slice(close + 1);
		if (suffix !== "" && !/^:\d+$/.test(suffix)) return null;
		return host.slice(1, close);
	}
	const firstColon = host.indexOf(":");
	const lastColon = host.lastIndexOf(":");
	if (firstColon !== lastColon) return host;
	if (lastColon === -1) return host.replace(/\.$/, "");
	if (!/^\d+$/.test(host.slice(lastColon + 1))) return null;
	return host.slice(0, lastColon).replace(/\.$/, "");
}
function isLoopbackHostHeader(req) {
	const name = hostNameOf(req.headers.host);
	return name === "localhost" || isLoopbackAddress(name);
}
/** Refuse non-loopback callers and non-GET methods before any work. */
function rejectForeignCaller(req, res) {
	if (req.method !== "GET") {
		res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
		res.end(JSON.stringify({
			ok: false,
			error: "method-not-allowed"
		}));
		return true;
	}
	const peer = req.socket?.remoteAddress;
	if (isLoopbackAddress(peer) && isLoopbackHostHeader(req)) return false;
	json(res, 403, {
		ok: false,
		error: "forbidden"
	});
	return true;
}
/** Cache file location under the dsh home. */
function cachePath() {
	return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "storages", "usage-stats-cache.json");
}
let loadedCache = null;
let loadPromise = null;
let inflight = null;
/** Serialize one session's fold state (Maps → plain objects). */
function serializeSession(state) {
	const days = {};
	for (const [date, entry] of state.days) {
		const models = {};
		for (const [model, buckets] of entry.models) models[model] = { ...buckets };
		days[date] = {
			totals: { ...entry.totals },
			models
		};
	}
	return {
		kind: state.kind ?? "persisted",
		consumed: state.consumed ?? 0,
		...state.revision === void 0 ? {} : { revision: state.revision },
		days,
		lastSample: state.lastSample === null ? null : {
			key: state.lastSample.key,
			day: state.lastSample.day,
			model: state.lastSample.model,
			buckets: { ...state.lastSample.buckets }
		},
		currentModel: state.currentModel
	};
}
/** Parse a serialized session entry back into fold state (lenient). */
function parseSession(raw) {
	const state = createUsageState();
	if (raw === null || typeof raw !== "object") return state;
	state.kind = typeof raw.kind === "string" ? raw.kind : "persisted";
	state.consumed = Number.isSafeInteger(raw.consumed) ? raw.consumed : 0;
	if (typeof raw.revision === "string") state.revision = raw.revision;
	if (raw.days !== null && typeof raw.days === "object") for (const [date, entry] of Object.entries(raw.days)) {
		if (entry === null || typeof entry !== "object") continue;
		const target = {
			totals: zeroBuckets(),
			models: /* @__PURE__ */ new Map()
		};
		const totals = entry.totals;
		if (totals !== null && typeof totals === "object") {
			target.totals.inputTokens = Number.isFinite(totals.inputTokens) ? totals.inputTokens : 0;
			target.totals.outputTokens = Number.isFinite(totals.outputTokens) ? totals.outputTokens : 0;
			target.totals.cacheReadTokens = Number.isFinite(totals.cacheReadTokens) ? totals.cacheReadTokens : 0;
			target.totals.cacheWriteTokens = Number.isFinite(totals.cacheWriteTokens) ? totals.cacheWriteTokens : 0;
		}
		if (entry.models !== null && typeof entry.models === "object") for (const [model, buckets] of Object.entries(entry.models)) {
			if (buckets === null || typeof buckets !== "object") continue;
			target.models.set(model, {
				inputTokens: Number.isFinite(buckets.inputTokens) ? buckets.inputTokens : 0,
				outputTokens: Number.isFinite(buckets.outputTokens) ? buckets.outputTokens : 0,
				cacheReadTokens: Number.isFinite(buckets.cacheReadTokens) ? buckets.cacheReadTokens : 0,
				cacheWriteTokens: Number.isFinite(buckets.cacheWriteTokens) ? buckets.cacheWriteTokens : 0
			});
		}
		state.days.set(date, target);
	}
	if (raw.lastSample !== null && raw.lastSample !== void 0 && typeof raw.lastSample === "object" && typeof raw.lastSample.key === "string" && typeof raw.lastSample.day === "string") {
		const buckets = raw.lastSample.buckets ?? {};
		state.lastSample = {
			key: raw.lastSample.key,
			day: raw.lastSample.day,
			model: typeof raw.lastSample.model === "string" ? raw.lastSample.model : "unknown",
			buckets: {
				inputTokens: Number.isFinite(buckets.inputTokens) ? buckets.inputTokens : 0,
				outputTokens: Number.isFinite(buckets.outputTokens) ? buckets.outputTokens : 0,
				cacheReadTokens: Number.isFinite(buckets.cacheReadTokens) ? buckets.cacheReadTokens : 0,
				cacheWriteTokens: Number.isFinite(buckets.cacheWriteTokens) ? buckets.cacheWriteTokens : 0
			}
		};
	}
	if (typeof raw.currentModel === "string") state.currentModel = raw.currentModel;
	return state;
}
/** Load the cache once per process; any corruption degrades to a fresh cache. */
async function loadCache() {
	if (loadedCache !== null) return loadedCache;
	loadPromise ??= (async () => {
		const fresh = {
			version: CACHE_VERSION,
			sessions: {}
		};
		try {
			const raw = await readFile(cachePath(), "utf8");
			const parsed = JSON.parse(raw);
			if (parsed !== null && typeof parsed === "object" && parsed.version === CACHE_VERSION && parsed.sessions !== null && typeof parsed.sessions === "object") {
				const sessions = {};
				for (const [id, entry] of Object.entries(parsed.sessions)) if (typeof id === "string" && id.length > 0) sessions[id] = parseSession(entry);
				return {
					version: CACHE_VERSION,
					sessions
				};
			}
		} catch {}
		return fresh;
	})();
	loadedCache = await loadPromise;
	return loadedCache;
}
/** Persist the cache atomically (temp + rename); failures are logged, never fatal. */
async function saveCache(ctx, cache) {
	try {
		const path = cachePath();
		await mkdir(dirname(path), { recursive: true });
		const serialized = {
			version: CACHE_VERSION,
			sessions: {}
		};
		for (const [id, state] of Object.entries(cache.sessions)) serialized.sessions[id] = serializeSession(state);
		const tmp = `${path}.tmp`;
		await writeFile(tmp, JSON.stringify(serialized), "utf8");
		await rename(tmp, path);
	} catch (error) {
		ctx.logger.warn(`usage-stats: saving usage cache failed: ${String(error)}`);
	}
}
/** Single-flight guard: concurrent requests share one aggregation run. */
function withLock(run) {
	if (inflight !== null) return inflight;
	inflight = run().finally(() => {
		inflight = null;
	});
	return inflight;
}
/**
* Collect per-day usage across live and persisted sessions, incrementally.
*
* Live sessions: fold only the in-memory events added since the last fold.
* Persisted sessions: skipped when the backend's opaque revision is
* unchanged (`sessionPersistence.listSnapshots`, falling back to always
* reading the delta); when the revision changes, the new events are verified
* to be contiguous with the last folded seq — a gap or an empty delta means
* the log was truncated/rewritten, so the session is refolded from scratch.
* Sessions that vanished are dropped, and a session switching between
* live/persisted is refolded from scratch to stay exact.
*/
async function collectUsage(ctx) {
	return withLock(async () => {
		const cache = await loadCache();
		const live = ctx.get("sessions");
		const attached = /* @__PURE__ */ new Set();
		if (live !== void 0) for (const session of live.list()) {
			attached.add(session.id);
			const state = cache.sessions[session.id] ?? createUsageState();
			if (state.kind !== "live") {
				state.days = /* @__PURE__ */ new Map();
				state.lastSample = null;
				state.currentModel = null;
				state.consumed = 0;
			}
			const count = session.events.length;
			if ((state.consumed ?? 0) < count) {
				applyUsageDelta(state, session.events.slice(state.consumed ?? 0));
				state.consumed = count;
			}
			state.kind = "live";
			cache.sessions[session.id] = state;
		}
		const persistence = ctx.get("sessionPersistence");
		const persistedIds = /* @__PURE__ */ new Set();
		if (persistence !== void 0) {
			let snapshots = null;
			if (typeof persistence.listSnapshots === "function") try {
				snapshots = await persistence.listSnapshots();
			} catch (error) {
				ctx.logger.warn(`usage-stats: listSnapshots failed, falling back to list(): ${String(error)}`);
			}
			const metas = snapshots !== null ? snapshots.map((entry) => entry.header) : await persistence.list();
			const revisionOf = /* @__PURE__ */ new Map();
			if (snapshots !== null) for (const entry of snapshots) revisionOf.set(entry.header.id, entry.revision);
			for (const meta of metas) {
				persistedIds.add(meta.id);
				if (attached.has(meta.id)) continue;
				const state = cache.sessions[meta.id] ?? createUsageState();
				const revision = revisionOf.get(meta.id);
				if (state.kind !== "persisted" || revision !== void 0 && revision !== state.revision || revision === void 0) try {
					const wasPersisted = state.kind === "persisted";
					const fromSeq = wasPersisted ? state.consumed : 0;
					const { events } = await persistence.readFrom(meta.id, fromSeq);
					if (!wasPersisted) {
						state.days = /* @__PURE__ */ new Map();
						state.lastSample = null;
						state.currentModel = null;
						state.consumed = 0;
					}
					const fresh = wasPersisted ? events.filter((event) => event.seq > (state.consumed ?? 0)) : events;
					if (!(fresh.length === 0 ? state.consumed === 0 : fresh[0].seq === state.consumed + 1) && state.consumed > 0) {
						state.days = /* @__PURE__ */ new Map();
						state.lastSample = null;
						state.currentModel = null;
						state.consumed = 0;
						const { events: allEvents } = await persistence.readFrom(meta.id, 0);
						applyUsageDelta(state, allEvents);
						state.consumed = allEvents.length > 0 ? allEvents[allEvents.length - 1].seq : 0;
					} else if (fresh.length > 0) {
						applyUsageDelta(state, fresh);
						state.consumed = fresh[fresh.length - 1].seq;
					}
					state.kind = "persisted";
					if (revision !== void 0) state.revision = revision;
				} catch (error) {
					ctx.logger.warn(`usage-stats: reading persisted session "${meta.id}" failed: ${String(error)}`);
				}
				cache.sessions[meta.id] = state;
			}
		}
		for (const id of Object.keys(cache.sessions)) if (!attached.has(id) && !persistedIds.has(id)) delete cache.sessions[id];
		const byDay = /* @__PURE__ */ new Map();
		for (const state of Object.values(cache.sessions)) mergeInto(byDay, state.days);
		await saveCache(ctx, cache);
		return renderUsage(byDay, Date.now());
	});
}
async function handleUsage(ctx, req, res) {
	if (rejectForeignCaller(req, res)) return;
	try {
		json(res, 200, {
			ok: true,
			...await collectUsage(ctx)
		});
	} catch (error) {
		ctx.logger.warn(`usage-stats: usage aggregation failed: ${String(error)}`);
		json(res, 500, {
			ok: false,
			error: "internal",
			message: error instanceof Error ? error.message : String(error)
		});
	}
}
/**
* Enumerate the harness's configured providers: the official DeepSeek route
* (`llm-deepseek` settings namespace) plus every pi-ai provider profile
* (`llm-pi-ai` settings namespace). Each entry carries the connection facts
* (credential ref + base URL) needed to query a balance — no keys here.
*/
async function configuredProviders(ctx) {
	const settings = ctx.get("settings");
	const providers = [];
	const deepseek = settings?.get?.("llm-deepseek");
	if (deepseek !== void 0 && deepseek !== null && typeof deepseek === "object") providers.push({
		id: "deepseek-official",
		displayName: "DeepSeek",
		apiKeyEnv: typeof deepseek.apiKeyEnv === "string" ? deepseek.apiKeyEnv : DEEPSEEK_DEFAULTS.apiKeyEnv,
		baseURL: typeof deepseek.baseURL === "string" ? deepseek.baseURL : DEEPSEEK_DEFAULTS.baseURL
	});
	else providers.push({
		id: "deepseek-official",
		displayName: "DeepSeek",
		apiKeyEnv: DEEPSEEK_DEFAULTS.apiKeyEnv,
		baseURL: DEEPSEEK_DEFAULTS.baseURL
	});
	const pi = settings?.get?.("llm-pi-ai");
	if (pi !== void 0 && pi !== null && typeof pi === "object" && pi.providers !== void 0 && typeof pi.providers === "object") for (const [route, profile] of Object.entries(pi.providers)) {
		if (profile === null || typeof profile !== "object") continue;
		providers.push({
			id: route,
			displayName: typeof profile.displayName === "string" && profile.displayName.length > 0 ? profile.displayName : route,
			apiKeyEnv: typeof profile.apiKeyEnv === "string" ? profile.apiKeyEnv : void 0,
			baseURL: typeof profile.baseURL === "string" ? profile.baseURL : void 0
		});
	}
	return providers;
}
async function handleProviders(ctx, accounts, req, res) {
	if (rejectForeignCaller(req, res)) return;
	try {
		json(res, 200, {
			ok: true,
			providers: await accounts.providerViews()
		});
	} catch (error) {
		ctx.logger.warn(`usage-stats: providers enumeration failed: ${String(error)}`);
		json(res, 500, {
			ok: false,
			error: "internal",
			message: error instanceof Error ? error.message : String(error)
		});
	}
}
async function selectedProviderId(req, accounts) {
	const requested = new URL(req.url ?? "/", "http://x").searchParams.get("provider");
	if (requested !== null && requested !== "") return requested;
	const providers = await accounts.providerViews();
	return providers.find((entry) => entry.id === "deepseek-official")?.id ?? providers.find((entry) => entry.configured)?.id ?? providers[0]?.id ?? null;
}
/** Unified account endpoint; cached by default, `refresh=1` forces upstream. */
async function handleAccount(ctx, accounts, req, res) {
	if (rejectForeignCaller(req, res)) return;
	try {
		const url = new URL(req.url ?? "/", "http://x");
		const providerId = await selectedProviderId(req, accounts);
		const account = providerId === null ? null : await accounts.get(providerId, { force: url.searchParams.get("refresh") === "1" });
		if (account === null) {
			json(res, 200, {
				ok: false,
				error: "unknown-provider",
				message: `provider "${providerId}" is not configured`
			});
			return;
		}
		json(res, 200, {
			ok: true,
			account
		});
	} catch (error) {
		ctx.logger.warn(`usage-stats: account fetch failed: ${String(error)}`);
		json(res, 500, {
			ok: false,
			error: "internal",
			message: error instanceof Error ? error.message : String(error)
		});
	}
}
/** Backward-compatible balance route delegated to the account registry. */
async function handleBalance(ctx, accounts, req, res) {
	if (rejectForeignCaller(req, res)) return;
	try {
		const providerId = await selectedProviderId(req, accounts);
		const account = providerId === null ? null : await accounts.get(providerId);
		if (account === null) {
			json(res, 200, {
				ok: false,
				error: "unknown-provider",
				message: `provider "${providerId}" is not configured`
			});
			return;
		}
		if (account.mode !== "balance" || account.status === "unsupported") {
			json(res, 200, {
				ok: false,
				error: "unsupported",
				message: `${account.displayName} has no public balance interface`,
				provider: account.id
			});
			return;
		}
		if (account.status === "not-configured") {
			json(res, 200, {
				ok: false,
				error: "no-credential",
				message: account.missingCredentials?.[0] ?? "api key",
				provider: account.id
			});
			return;
		}
		if (account.balance === null || account.balance === void 0) {
			json(res, 502, {
				ok: false,
				error: "failed",
				message: account.status
			});
			return;
		}
		json(res, 200, {
			ok: true,
			provider: account.id,
			balance: {
				isAvailable: account.status === "ok" || account.stale === true,
				currency: account.balance.currency,
				total: account.balance.remaining,
				granted: account.balance.breakdown?.granted,
				toppedUp: account.balance.breakdown?.toppedUp
			},
			fetchedAt: account.fetchedAt
		});
	} catch (error) {
		ctx.logger.warn(`usage-stats: balance fetch failed: ${String(error)}`);
		json(res, 502, {
			ok: false,
			error: "failed",
			message: error instanceof Error ? error.message : String(error)
		});
	}
}
/** Query normalized percentage windows for subscription-style providers. */
async function handleSubscriptions(ctx, accounts, req, res) {
	if (rejectForeignCaller(req, res)) return;
	try {
		json(res, 200, {
			ok: true,
			subscriptions: (await accounts.subscriptionAccounts()).filter(Boolean).map((account) => account.adapter === "zai-token-plan" ? {
				...account,
				id: "zai"
			} : account),
			fetchedAt: Date.now()
		});
	} catch (error) {
		ctx.logger.warn(`usage-stats: subscription usage failed: ${String(error)}`);
		json(res, 500, {
			ok: false,
			error: "internal",
			message: error instanceof Error ? error.message : String(error)
		});
	}
}
/** Start an immediate refresh and repeat account + local usage refresh every 5 minutes. */
function startBackgroundRefresh(ctx, accounts, deps = {}) {
	let running = false;
	let stopped = false;
	let active = Promise.resolve();
	const run = async () => {
		if (running || stopped) return;
		running = true;
		active = (async () => {
			const results = await Promise.allSettled([accounts.refreshAll(), collectUsage(ctx)]);
			for (const result of results) if (result.status === "rejected") ctx.logger.warn(`usage-stats: background refresh failed: ${String(result.reason)}`);
		})().finally(() => {
			running = false;
		});
		return active;
	};
	run();
	const setTimer = deps.setInterval ?? setInterval;
	const clearTimer = deps.clearInterval ?? clearInterval;
	const timer = setTimer(run, deps.intervalMs ?? 3e5);
	timer?.unref?.();
	const stop = async () => {
		stopped = true;
		clearTimer(timer);
		await active;
	};
	stop.refreshNow = async () => {
		await active;
		return run();
	};
	return stop;
}
async function apply(ctx, rawConfig = {}, deps = {}) {
	const config = validateAccountConfig(rawConfig);
	const accounts = deps.accounts ?? createAccountService({
		credentials: ctx.get("credentials") ?? ctx.credentials,
		getProviders: () => configuredProviders(ctx),
		config,
		deps: { timeoutMs: UPSTREAM_TIMEOUT_MS }
	});
	await accounts.validate();
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: USAGE_PATH,
		handler: (req, res) => handleUsage(ctx, req, res)
	}), "usage-stats: usage route");
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: PROVIDERS_PATH,
		handler: (req, res) => handleProviders(ctx, accounts, req, res)
	}), "usage-stats: providers route");
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: ACCOUNT_PATH,
		handler: (req, res) => handleAccount(ctx, accounts, req, res)
	}), "usage-stats: account route");
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: BALANCE_PATH,
		handler: (req, res) => handleBalance(ctx, accounts, req, res)
	}), "usage-stats: balance route");
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: SUBSCRIPTIONS_PATH,
		handler: (req, res) => handleSubscriptions(ctx, accounts, req, res)
	}), "usage-stats: subscriptions route");
	if (deps.disableBackgroundRefresh !== true) ctx.effect(() => startBackgroundRefresh(ctx, accounts), "usage-stats: background account refresh");
	await apply$1(ctx);
}
//#endregion
export { apply };

//# sourceMappingURL=lib-zmessZZd.mjs.map