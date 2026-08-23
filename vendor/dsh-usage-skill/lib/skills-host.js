// src/index.ts
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { URL } from "node:url";
import { inflateRawSync } from "node:zlib";
var name = "skill-manager";
var inject = ["webServer"];
var SKILL_FILE = "SKILL.md";
var BUNDLES_FILE = ".bundles.json";
var ROUTE_PREFIX = "/api/skill-manager";
var NAME_MAX = 64;
var NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
var ARCHIVE_MAX_ENTRIES = 2000;
var ARCHIVE_MAX_TOTAL = 200 * 1024 * 1024;
function unzipArchive(buffer) {
  if (buffer.length < 22) throw new Error("not a zip archive");
  let eocd = -1;
  const tailStart = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= tailStart; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip archive");
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  if (totalEntries === 0 || totalEntries > ARCHIVE_MAX_ENTRIES) throw new Error("archive has too many entries");
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const files = [];
  let pos = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (pos + 46 > buffer.length || buffer.readUInt32LE(pos) !== 0x02014b50) break;
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
      files.push({ name, data });
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
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join(homedir(), ".agents");
  return join(agentsHome, "skills");
}
function dshRoot() {
  const dshHome = process.env.DSH_HOME ?? join(homedir(), ".dsh");
  return join(dshHome, "skills");
}
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const block = match?.[1];
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
    return void 0;
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
    if (typeof parsed === "object" && parsed !== null && parsed.version === 1 && Array.isArray(parsed.bundles)) {
      return parsed;
    }
  } catch {
  }
  return { version: 1, bundles: [] };
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
  if (trimmed === "" || trimmed.length > NAME_MAX) {
    throw new Error(`name must be 1-${String(NAME_MAX)} characters`);
  }
  return trimmed;
}
function resolveSkillFile(base, path) {
  if (path === "" || path.includes("\0") || path.includes("\\")) {
    throw new Error(`unsupported skill file path: ${JSON.stringify(path)}`);
  }
  const target = resolve(base, path);
  const within = relative(resolve(base), target);
  if (within === "" || within.startsWith("..") || within.includes(sep + "..")) {
    throw new Error(`skill file escapes its directory: ${JSON.stringify(path)}`);
  }
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
    bundles.push({ id: record.id, name: record.name, skillCount: skills.length, skills });
  }
  const loose = all.filter((skill) => !assigned.has(skill.name));
  return { bundles, loose };
}
async function createBundle(body) {
  const name2 = checkedName(typeof body.name === "string" ? body.name : "");
  const root = managedRoot();
  const ledger = await readBundles(root);
  if (ledger.bundles.some((bundle) => bundle.name === name2)) {
    throw new Error(`bundle "${name2}" already exists`);
  }
  const base = name2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bundle";
  let id = base;
  let suffix = 2;
  while (ledger.bundles.some((bundle) => bundle.id === id)) {
    id = `${base}-${String(suffix)}`;
    suffix += 1;
  }
  const record = { id, name: name2, skills: [] };
  await writeBundles(root, { version: 1, bundles: [...ledger.bundles, record] });
  return { id, name: name2, skillCount: 0, skills: [] };
}
async function renameBundle(id, body) {
  const name2 = checkedName(typeof body.name === "string" ? body.name : "");
  const root = managedRoot();
  const ledger = await readBundles(root);
  const index = ledger.bundles.findIndex((bundle) => bundle.id === id);
  const existing = index === -1 ? void 0 : ledger.bundles[index];
  if (existing === void 0) throw new Error(`bundle ${JSON.stringify(id)} not found`);
  if (ledger.bundles.some((bundle, i) => i !== index && bundle.name === name2)) {
    throw new Error(`bundle "${name2}" already exists`);
  }
  const record = { ...existing, name: name2 };
  const bundles = [...ledger.bundles];
  bundles[index] = record;
  await writeBundles(root, { version: 1, bundles });
  const all = [...await listRootSkills(root), ...await listRootSkills(dshRoot())];
  const byName = new Map(all.map((skill) => [skill.name, skill]));
  const skills = record.skills.map((skillName) => byName.get(skillName)).filter((skill) => skill !== void 0);
  return { id: record.id, name: name2, skillCount: skills.length, skills };
}
async function deleteBundle(id) {
  const root = managedRoot();
  const ledger = await readBundles(root);
  const bundles = ledger.bundles.filter((bundle) => bundle.id !== id);
  if (bundles.length === ledger.bundles.length) {
    throw new Error(`bundle ${JSON.stringify(id)} not found`);
  }
  await writeBundles(root, { version: 1, bundles });
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
  const record = { ...existing, skills };
  const bundles = ledger.bundles.map((candidate) => candidate.id === id ? record : { ...candidate, skills: candidate.skills.filter((name2) => !skills.includes(name2)) });
  await writeBundles(root, { version: 1, bundles });
  const views = skills.map((name2) => byName.get(name2)).filter((skill) => skill !== void 0);
  return { id: record.id, name: record.name, skillCount: views.length, skills: views };
}
async function assignBundle(root, skillName, bundleId) {
  if (typeof bundleId !== "string" || bundleId === "") return;
  const ledger = await readBundles(root);
  const index = ledger.bundles.findIndex((bundle) => bundle.id === bundleId);
  if (index === -1) throw new Error(`bundle ${JSON.stringify(bundleId)} not found`);
  const bundles = ledger.bundles.map((candidate, i) => i === index ? { ...candidate, skills: [...candidate.skills.filter((name2) => name2 !== skillName), skillName] } : { ...candidate, skills: candidate.skills.filter((name2) => name2 !== skillName) });
  await writeBundles(root, { version: 1, bundles });
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
  if (!NAME_PATTERN.test(skillName)) {
    const top = skillEntry.name.slice(0, skillEntry.name.length - SKILL_FILE.length).replace(/\/+$/, "");
    const fallback = top.split("/").pop() ?? "";
    skillName = fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
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
  return { name: finalMeta?.name ?? skillName, description: finalMeta?.description ?? "" };
}
async function installSkill(body) {
  if (typeof body.archive === "string" && body.archive !== "") {
    return installArchive(body);
  }
  const skillName = checkedName(typeof body.skillName === "string" ? body.skillName : "");
  if (!NAME_PATTERN.test(skillName)) {
    throw new Error("skill name must be lowercase alphanumeric/hyphen");
  }
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
    const bundles = ledger.bundles.map((candidate, i) => i === index ? { ...candidate, skills: [...candidate.skills.filter((name2) => name2 !== skillName), skillName] } : { ...candidate, skills: candidate.skills.filter((name2) => name2 !== skillName) });
    await writeBundles(root, { version: 1, bundles });
  }
  const meta = await readSkillMeta(root, skillName);
  return { name: meta?.name ?? skillName, description: meta?.description ?? "" };
}
async function readSkillFile(skillName, relPath) {
  const name2 = checkedName(skillName);
  const roots = [managedRoot(), dshRoot()];
  let dir = null;
  for (const root of roots) {
    const candidate = join(root, name2);
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) {
        dir = candidate;
        break;
      }
    } catch {
    }
  }
  if (dir === null) throw new Error(`skill ${JSON.stringify(name2)} not found`);
  if (relPath === "" || relPath.includes("\0") || relPath.includes("\\")) {
    throw new Error(`unsupported file path: ${JSON.stringify(relPath)}`);
  }
  const target = resolveSkillFile(dir, relPath);
  let info;
  try {
    info = await stat(target);
  } catch {
    throw new Error(`file ${JSON.stringify(relPath)} not found in skill ${JSON.stringify(name2)}`);
  }
  if (!info.isFile()) throw new Error(`not a file: ${JSON.stringify(relPath)}`);
  const content = await readFile(target, "utf8");
  return { name: name2, path: relPath, content };
}

async function deleteSkill(skillName) {
  const name2 = checkedName(skillName);
  if (!NAME_PATTERN.test(name2)) {
    throw new Error("skill name must be lowercase alphanumeric/hyphen");
  }
  const roots = [managedRoot(), dshRoot()];
  let removed = false;
  for (const root2 of roots) {
    const dir = join(root2, name2);
    try {
      const info = await stat(dir);
      if (!info.isDirectory()) continue;
    } catch {
      continue;
    }
    await rm(dir, { recursive: true, force: true });
    removed = true;
    break;
  }
  if (!removed) throw new Error(`skill ${JSON.stringify(name2)} not found`);
  const root = managedRoot();
  const ledger = await readBundles(root);
  await writeBundles(root, {
    version: 1,
    bundles: ledger.bundles.map((candidate) => ({
      ...candidate,
      skills: candidate.skills.filter((candidateName) => candidateName !== name2)
    }))
  });
}
function isLoopbackAddress(address) {
  if (typeof address !== "string") return false;
  const a = address.toLowerCase();
  if (a === "::1") return true;
  const ipv4 = a.startsWith("::ffff:") ? a.slice(7) : a;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets[0] === "127" && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
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
  if (firstColon !== lastColon) return null;
  return firstColon === -1 ? host : host.slice(0, firstColon);
}
function loopbackAllowed(req) {
  if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
  const host = hostNameOf(req.headers.host);
  if (host === null) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function json(res, status, value) {
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
        reject(new Error("request body too large"));
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
        reject(error instanceof Error ? error : new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
async function handle(ctx, req, res) {
  if (!loopbackAllowed(req)) {
    json(res, 403, { error: "loopback-only" });
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const rest = url.pathname.slice(ROUTE_PREFIX.length);
  const method = req.method ?? "GET";
  try {
    if (method === "GET" && (rest === "" || rest === "/list")) {
      json(res, 200, await snapshot());
      return;
    }
    if (method === "POST" && rest === "/bundles") {
      const body = await readBody(req);
      json(res, 200, await createBundle(body));
      return;
    }
    const matchId = /^\/bundles\/([^/]+)$/.exec(rest);
    if (method === "PATCH" && matchId !== null) {
      const body = await readBody(req);
      json(res, 200, await renameBundle(decodeURIComponent(matchId[1]), body));
      return;
    }
    if (method === "DELETE" && matchId !== null) {
      await deleteBundle(decodeURIComponent(matchId[1]));
      json(res, 200, { ok: true });
      return;
    }
    const matchSkills = /^\/bundles\/([^/]+)\/skills$/.exec(rest);
    if (method === "PUT" && matchSkills !== null) {
      const body = await readBody(req);
      json(res, 200, await setBundleSkills(decodeURIComponent(matchSkills[1]), body));
      return;
    }
    if (method === "POST" && rest === "/skills") {
      const body = await readBody(req);
      json(res, 200, await installSkill(body));
      return;
    }
    const matchSkillDelete = /^\/skills\/([^/]+)$/.exec(rest);
    if (method === "DELETE" && matchSkillDelete !== null) {
      await deleteSkill(decodeURIComponent(matchSkillDelete[1]));
      json(res, 200, { ok: true });
      return;
    }
    const matchSkillFile = /^\/skills\/([^/]+)\/files\/(.+)$/.exec(rest);
    if (method === "GET" && matchSkillFile !== null) {
      const file = await readSkillFile(
        decodeURIComponent(matchSkillFile[1]),
        decodeURIComponent(matchSkillFile[2])
      );
      json(res, 200, file);
      return;
    }
    json(res, 404, { error: `no route for ${method} ${rest}` });
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}
async function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE_PREFIX,
    handler: (req, res) => {
      void handle(ctx, req, res);
    }
  }), "dsh-skill-manager: routes");
}
export {
  apply,
  inject,
  name
};
