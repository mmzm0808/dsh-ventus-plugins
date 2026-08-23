/**
 * dsh-usage-skill — browser half.
 *
 * Hand-written `__ModuleLoader__` bundle (no build step): a sidebar footer
 * action that opens a floating panel with provider balances, subscription
 * quota windows, a Codex-style blue daily token-usage heatmap, per-day
 * provider/model breakdowns, and cache hit rates. Data comes from the server
 * half's loopback-only endpoints via same-origin fetch.
 */
window.__ModuleLoader__.load({
	id: "dsh-usage-skill",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		//#region skills (merged from dsh-skill-manager)
		let skillPanelModule = (() => {
			var module = { exports: {} };
			var exports = module.exports;
			"use strict";
			var __defProp = Object.defineProperty;
			var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
			var __getOwnPropNames = Object.getOwnPropertyNames;
			var __hasOwnProp = Object.prototype.hasOwnProperty;
			var __export = (target, all) => {
			  for (var name in all)
			    __defProp(target, name, { get: all[name], enumerable: true });
			};
			var __copyProps = (to, from, except, desc) => {
			  if (from && typeof from === "object" || typeof from === "function") {
			    for (let key of __getOwnPropNames(from))
			      if (!__hasOwnProp.call(to, key) && key !== except)
			        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
			  }
			  return to;
			};
			var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
			
			// src/client/SkillManagerPanel.tsx
			var SkillManagerPanel_exports = {};
			__export(SkillManagerPanel_exports, {
			  SkillManagerPanel: () => SkillManagerPanel
			});
			module.exports = __toCommonJS(SkillManagerPanel_exports);
			var import_react = require("react");
			var React = import_react;
			var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
			
			// src/client/styles.ts
			var css = {
			  entry: "skm-entry",
			  label: "skm-label",
			  modal: "skm-modal",
			  modalBody: "skm-modal-body",
			  panel: "skm-panel",
			  topRow: "skm-top-row",
			  newBundleButton: "skm-new-bundle",
			  upload: "skm-upload",
			  uploadActive: "skm-upload-active",
			  hiddenInput: "skm-hidden-input",
			  installForm: "skm-install-form",
			  installRow: "skm-install-row",
			  inlineForm: "skm-inline-form",
			  inlineInput: "skm-inline-input",
			  bundleSelect: "skm-bundle-select",
			  installMeta: "skm-install-meta",
			  installActions: "skm-install-actions",
			  sectionTitle: "skm-section-title",
			  status: "skm-status",
			  failure: "skm-failure",
			  error: "skm-error",
			  bundleList: "skm-bundle-list",
			  bundle: "skm-bundle",
			  bundleRow: "skm-bundle-row",
			  bundleName: "skm-bundle-name",
			  bundleCount: "skm-bundle-count",
			  chevron: "skm-chevron",
			  bundleActions: "skm-bundle-actions",
			  iconAction: "skm-icon-action",
			  skillList: "skm-skill-list",
			  skillItem: "skm-skill-item",
			  skillRow: "skm-skill-row",
			  skillLabel: "skm-skill-label",
			  skillName: "skm-skill-name",
			  skillDescription: "skm-skill-desc",
			  skillExpand: "skm-skill-expand",
			  skillCount: "skm-skill-count",
			  skillCompat: "skm-skill-compat",
			  skillFiles: "skm-skill-files",
			  skillFile: "skm-skill-file",
			  skillPreview: "skm-skill-preview",
			  viewerModal: "skm-viewer-modal",
			  viewerBody: "skm-viewer-body",
			  viewerLayout: "skm-viewer-layout",
			  viewerNav: "skm-viewer-nav",
			  viewerNavItem: "skm-viewer-nav-item",
			  viewerNavDir: "skm-viewer-nav-dir",
			  viewerContent: "skm-viewer-content",
			  looseEmpty: "skm-loose-empty",
			  visuallyHidden: "skm-visually-hidden"
			};
			var STYLE_ID = "dsh-skill-manager-styles";
			var SHEET = `
			.skm-entry{flex:1 1 50%;min-width:0;display:inline-flex;align-items:center;gap:8px;height:32px;box-sizing:border-box;border:none;border-radius:10px;padding:0 8px;background:transparent;cursor:pointer;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;font-size:14px;line-height:20px;overflow:hidden}
			.skm-entry:hover{background:transparent}
			.skm-entry[aria-expanded='true']{background:transparent;color:var(--dsw-alias-label-primary,#eee)}
			.skm-entry:focus,.skm-entry:focus-visible{outline:none;border:none}
			.skm-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
			.skm-modal{width:min(520px,calc(100vw - 48px))}
			.skm-modal-body{overflow:hidden;display:flex;flex-direction:column}
			.skm-panel{display:flex;flex-direction:column;gap:8px;max-height:min(640px,calc(100vh - 220px));overflow-y:auto;padding:2px 2px 6px;box-sizing:border-box}
			.skm-top-row{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:8px}
			.skm-new-bundle{flex:none;display:inline-flex;align-items:center;gap:4px;appearance:none;border:none;border-radius:12px;padding:4px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#999);background:transparent;cursor:pointer}
			.skm-new-bundle:hover,.skm-new-bundle[aria-expanded='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
			.skm-upload{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:10px 12px;box-sizing:border-box;border:1px dashed var(--dsw-alias-border-l3,#444);border-radius:12px;color:var(--dsw-alias-label-tertiary,#888);font-size:12px;line-height:18px;text-align:center;cursor:pointer;user-select:none}
			.skm-upload:hover{border-color:var(--dsw-alias-brand-primary,#4a9eff);color:var(--dsw-alias-label-secondary,#bbb)}
			.skm-upload-active{border-color:var(--dsw-alias-brand-primary,#4a9eff);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-hidden-input{display:none}
			.skm-install-form{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:12px;background:var(--dsw-alias-bg-layer-1,#1c1f26)}
			.skm-install-row{display:flex;flex-direction:column;gap:6px}
			.skm-inline-form{flex:none;display:flex;align-items:center;gap:6px}
			.skm-inline-input{flex:1;min-width:0;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 10px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
			.skm-inline-input::placeholder{color:var(--dsw-alias-label-tertiary,#888)}
			.skm-bundle-select{display:flex;align-items:center}
			.skm-bundle-select select{flex:1;height:32px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:8px;padding:0 8px;font-size:13px;color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-bg-base,#0e1116)}
			.skm-install-meta{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-install-actions{display:flex;align-items:center;gap:6px}
			.skm-section-title{margin:6px 2px 0;font-size:12px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb)}
			.skm-status{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-failure{display:flex;align-items:center;gap:8px}
			.skm-failure p{margin:2px;font-size:13px;line-height:20px;color:var(--dsw-alias-state-error-primary,#e0434b)}
			.skm-error{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary,#e0434b)}
			.skm-bundle-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
			.skm-bundle{display:flex;flex-wrap:wrap;align-items:center;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1,#1c1f26)}
			.skm-bundle-row{flex:1;min-width:0;display:inline-flex;align-items:center;gap:8px;appearance:none;border:none;background:transparent;padding:8px 10px;font-size:13px;cursor:pointer;color:var(--dsw-alias-label-primary,#eee)}
			.skm-bundle-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-bundle-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
			.skm-bundle-count{flex:none;font-size:12px;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-chevron{flex:none;margin-left:auto;color:var(--dsw-alias-label-tertiary,#888);transition:transform 120ms}
			.skm-bundle[data-open='true'] .skm-chevron{transform:rotate(180deg)}
			.skm-bundle-actions{margin-left:auto;display:flex;align-items:center;gap:2px;padding-right:6px}
			.skm-icon-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;border-radius:50%;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-icon-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
			.skm-skill-list{list-style:none;margin:0;padding:2px 6px 6px;width:100%;display:flex;flex-direction:column;gap:2px}
			.skm-skill-item{display:flex;flex-direction:column;gap:2px;padding:2px 0;border-radius:8px}
			.skm-skill-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-skill-row{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:8px}
			.skm-skill-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-skill-label{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
			.skm-skill-name{font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#eee);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
			.skm-skill-desc{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
			.skm-skill-expand{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;border-radius:6px;padding:0;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary,#888);transition:transform 120ms}
			.skm-skill-expand:hover{color:var(--dsw-alias-label-primary,#eee);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-skill-expand[data-open='true']{transform:rotate(180deg)}
			.skm-skill-count{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:0 6px;white-space:nowrap}
			.skm-skill-compat{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
			.skm-skill-files{list-style:none;margin:0 0 2px 10px;padding:2px 0 2px 10px;border-left:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:0}
			.skm-skill-file{display:flex;align-items:center;gap:6px;padding:2px 6px;border-radius:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
			.skm-skill-file:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-skill-file[data-main='true']{color:var(--dsw-alias-label-primary,#eee);font-weight:500}
			.skm-skill-dir{color:var(--dsw-alias-label-tertiary,#888)}
			.skm-skill-preview{border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:10px;background:var(--dsw-alias-bg-base,#0e1116);padding:8px 12px;margin:0 0 2px 10px;font-size:12px;line-height:20px;color:var(--dsw-alias-label-primary,#eee);overflow:auto;max-height:280px;box-sizing:border-box}
			.skm-skill-preview h3,.skm-skill-preview h4,.skm-skill-preview h5{margin:10px 0 4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,#eee)}
			.skm-skill-preview p{margin:4px 0}
			.skm-skill-preview pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:8px 10px;overflow:auto;font-family:ui-monospace,monospace;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#bbb);margin:6px 0}
			.skm-skill-preview code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:4px;padding:0 4px;font-family:ui-monospace,monospace;font-size:11px}
			.skm-skill-preview a{color:var(--dsw-alias-brand-primary,#4a9eff)}
			.skm-skill-preview ul{margin:4px 0;padding-left:18px}
			.skm-skill-preview li{margin:2px 0}
			.skm-viewer-modal{width:min(960px,calc(100vw - 48px))}
			.skm-viewer-body{overflow:hidden;display:flex;flex-direction:column;height:min(640px,calc(100vh - 120px));--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}
			.skm-viewer-body > div:nth-of-type(2){flex:1;min-height:0;display:flex;flex-direction:column;margin-top:8px;padding:0 16px 16px}
			.skm-viewer-layout{flex:1;min-height:0;display:flex;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:12px;overflow:hidden}
			.skm-viewer-nav{flex:none;width:200px;border-right:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));overflow-y:auto;padding:6px;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,#1c1f26)}
			.skm-viewer-nav-item{display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:6px;font-size:12px;line-height:20px;color:var(--dsw-alias-label-secondary,#bbb);font-family:ui-monospace,monospace;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
			.skm-viewer-nav-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
			.skm-viewer-nav-item[data-active='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
			.skm-viewer-nav-dir{cursor:default;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-viewer-content{flex:1;min-width:0;overflow:auto;padding:14px 18px;box-sizing:border-box;font-size:13px;line-height:22px;color:var(--dsw-alias-label-primary,#eee)}
			.skm-viewer-content h1,.skm-viewer-content h2,.skm-viewer-content h3,.skm-viewer-content h4{margin:12px 0 6px;line-height:26px;color:var(--dsw-alias-label-primary,#eee)}
			.skm-viewer-content h1{font-size:20px}
			.skm-viewer-content h2{font-size:17px}
			.skm-viewer-content h3{font-size:15px}
			.skm-viewer-content h4{font-size:14px}
			.skm-viewer-content p{margin:6px 0}
			.skm-viewer-content pre{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:8px;padding:10px 12px;overflow:auto;font-family:ui-monospace,monospace;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#bbb)}
			.skm-viewer-content code{background:var(--dsw-alias-bg-module-platform,rgba(255,255,255,.05));border-radius:4px;padding:0 4px;font-family:ui-monospace,monospace;font-size:12px}
			.skm-viewer-content a{color:var(--dsw-alias-brand-primary,#4a9eff)}
			.skm-viewer-content ul,.skm-viewer-content ol{margin:6px 0;padding-left:22px}
			.skm-viewer-content li{margin:3px 0}
			.skm-viewer-content blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));color:var(--dsw-alias-label-secondary,#bbb)}
			.skm-viewer-content hr{border:none;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));margin:10px 0}
			.skm-loose-empty{margin:2px;padding:4px 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#888)}
			.skm-visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
			`;
			function ensureStyles() {
			  if (typeof document === "undefined") return;
			  if (document.getElementById(STYLE_ID) !== null) return;
			  const tag = document.createElement("style");
			  tag.id = STYLE_ID;
			  tag.textContent = SHEET;
			  document.head.appendChild(tag);
			}
			
			// src/client/SkillManagerPanel.tsx
			function readEntryFile(entry) {
			  return new Promise((resolve, reject) => {
			    ;
			    entry.file(resolve, reject);
			  });
			}
			async function collectEntry(entry, prefix, out) {
			  if (entry.isFile) {
			    const file = await readEntryFile(entry);
			    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
			    out.push({ path, file });
			    return;
			  }
			  if (entry.isDirectory) {
			    const reader = entry.createReader();
			    const all = [];
			    while (true) {
			      const batch = await new Promise((resolve, reject) => {
			        reader.readEntries(resolve, reject);
			      });
			      if (batch.length === 0) break;
			      all.push(...batch);
			    }
			    const nextPrefix = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
			    for (const child of all) await collectEntry(child, nextPrefix, out);
			  }
			}
			function fileToBase64(file) {
			  return file.arrayBuffer().then((buffer) => {
			    const bytes = new Uint8Array(buffer);
			    let binary = "";
			    const chunkSize = 32768;
			    for (let index = 0; index < bytes.length; index += chunkSize) {
			      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
			    }
			    return btoa(binary);
			  });
			}
			// 技能内容预览：极简 markdown 渲染（frontmatter 隐藏，标题/列表/代码块/粗体/行内代码/链接）。
			function escapeHtml(s) {
			  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			}
			function inlineMd(s) {
			  return escapeHtml(s)
			    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
			    .replace(/`([^`]+)`/g, "<code>$1</code>")
			    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
			}
			function renderSkillMarkdown(text) {
			  const body = String(text).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
			  const lines = body.split("\n");
			  let html = "";
			  let inCode = false;
			  let codeBuf = [];
			  let inList = false;
			  let inQuote = false;
			  const closeList = () => {
			    if (inList) {
			      html += "</ul>";
			      inList = false;
			    }
			  };
			  const closeQuote = () => {
			    if (inQuote) {
			      html += "</blockquote>";
			      inQuote = false;
			    }
			  };
			  for (const line of lines) {
			    const trimmed = line.trim();
			    if (trimmed.startsWith("```")) {
			      if (inCode) {
			        html += "<pre>" + escapeHtml(codeBuf.join("\n")) + "</pre>";
			        codeBuf = [];
			        inCode = false;
			      } else {
			        closeList();
			        closeQuote();
			        inCode = true;
			      }
			      continue;
			    }
			    if (inCode) {
			      codeBuf.push(line);
			      continue;
			    }
			    if (trimmed === "---" || trimmed === "***") {
			      closeList();
			      closeQuote();
			      html += "<hr>";
			      continue;
			    }
			    if (trimmed.startsWith(">")) {
			      if (!inQuote) {
			        closeList();
			        html += "<blockquote>";
			        inQuote = true;
			      }
			      html += "<p>" + inlineMd(trimmed.replace(/^>\s?/, "")) + "</p>";
			      continue;
			    }
			    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
			    if (heading !== null) {
			      closeList();
			      closeQuote();
			      const level = Math.min(heading[1].length + 2, 5);
			      html += "<h" + String(level) + ">" + inlineMd(heading[2]) + "</h" + String(level) + ">";
			      continue;
			    }
			    const item = /^[-*]\s+(.*)$/.exec(trimmed);
			    if (item !== null) {
			      if (!inList) {
			        closeQuote();
			        html += "<ul>";
			        inList = true;
			      }
			      html += "<li>" + inlineMd(item[1]) + "</li>";
			      continue;
			    }
			    closeList();
			    closeQuote();
			    if (trimmed === "") {
			      html += "<p></p>";
			      continue;
			    }
			    html += "<p>" + inlineMd(trimmed) + "</p>";
			  }
			  closeList();
			  closeQuote();
			  if (inCode) html += "<pre>" + escapeHtml(codeBuf.join("\n")) + "</pre>";
			  return html;
			}
			// 技能行：查看按钮 + 名称/描述 + 文件数 + compatibility + （可选）移除/归入按钮；点击查看按钮打开文件查看器。
			function skillRowNode(skill, onView, t, bundleId, onAssign, onRemove, onDelete) {
			  const files = Array.isArray(skill.files) ? skill.files : [];
			  const head = [];
			  if (files.length > 0) {
			    head.push(React.createElement("button", {
			      type: "button",
			      className: css.skillExpand,
			      "aria-label": t("viewSkillFiles"),
			      "aria-expanded": false,
			      onClick: () => { onView(skill); }
			    }, React.createElement(import_dsh_client_ui_primitives.IconFolderOpenOutline16, { size: 14, "aria-hidden": "true" })));
			  }
			  head.push(React.createElement("span", { className: css.skillLabel, title: skill.description },
			    React.createElement("span", { className: css.skillName }, skill.name),
			    skill.description !== "" && React.createElement("span", { className: css.skillDescription }, skill.description)));
			  if (typeof skill.fileCount === "number") {
			    head.push(React.createElement("span", { className: css.skillCount }, t("fileCount", { n: skill.fileCount })));
			  }
			  if (skill.compatibility !== "") {
			    head.push(React.createElement("span", { className: css.skillCompat, title: skill.compatibility }, skill.compatibility));
			  }
			  if (bundleId !== null) {
			    head.push(React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("removeSkill"), side: "bottom", delayMs: 500 },
			      React.createElement("button", {
			        type: "button",
			        className: css.iconAction,
			        "aria-label": t("removeSkill"),
			        onClick: () => {
			          onRemove(skill);
			        }
			      }, React.createElement(import_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 }))));
			  } else if (onAssign !== null) {
			    head.push(React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("assignToBundle"), side: "bottom", delayMs: 500 },
			      React.createElement("button", {
			        type: "button",
			        className: css.iconAction,
			        "aria-label": t("assignToBundle"),
			        onClick: () => {
			          onAssign(skill);
			        }
			      }, React.createElement(import_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }))));
			  }
			  if (onDelete !== null) {
			    head.push(React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("deleteSkillBtn"), side: "bottom", delayMs: 500 },
			      React.createElement("button", {
			        type: "button",
			        className: css.iconAction,
			        "aria-label": t("deleteSkillBtn"),
			        onClick: () => {
			          onDelete(skill);
			        }
			      }, React.createElement(import_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 }))));
			  }
			  const children = [React.createElement("div", { className: css.skillRow }, ...head)];
			  return React.createElement("li", { className: css.skillItem, key: skill.name }, ...children);
			}
			function skillFileRows(files) {
			  const rows = [];
			  const seenDirs = new Set();
			  for (const path of files) {
			    const parts = path.split("/");
			    let dirPath = "";
			    for (let i = 0; i < parts.length - 1; i += 1) {
			      dirPath = dirPath === "" ? parts[i] : dirPath + "/" + parts[i];
			      if (!seenDirs.has(dirPath)) {
			        seenDirs.add(dirPath);
			        rows.push({ kind: "dir", path: dirPath + "/", depth: i, main: false });
			      }
			    }
			    rows.push({ kind: "file", path: path, depth: parts.length - 1, main: path === "SKILL.md" });
			  }
			  return rows;
			}
			function SkillManagerPanel({
			  open,
			  onClose,
			  t,
			  list,
			  createBundle,
			  renameBundle,
			  deleteBundle,
			  setBundleSkills,
			  deleteSkill,
			  installSkill
			}) {
			  ensureStyles();
			  const [state, setState] = (0, import_react.useState)({ status: "loading" });
			  const [reload, setReload] = (0, import_react.useState)(0);
			  const [expanded, setExpanded] = (0, import_react.useState)(/* @__PURE__ */ new Set());
			  const [viewer, setViewer] = (0, import_react.useState)(null);
			  const [assignTarget, setAssignTarget] = (0, import_react.useState)(null);
			  const [newBundleOpen, setNewBundleOpen] = (0, import_react.useState)(false);
			  const [newBundleName, setNewBundleName] = (0, import_react.useState)("");
			  const [creatingBundle, setCreatingBundle] = (0, import_react.useState)(false);
			  const [renameTarget, setRenameTarget] = (0, import_react.useState)(null);
			  const [renaming, setRenaming] = (0, import_react.useState)(false);
			  const [confirm, setConfirm] = (0, import_react.useState)(null);
			  const [confirming, setConfirming] = (0, import_react.useState)(false);
			  const [install, setInstall] = (0, import_react.useState)(null);
			  const [installName, setInstallName] = (0, import_react.useState)("");
			  const [installDescription, setInstallDescription] = (0, import_react.useState)("");
			  const [installBundleId, setInstallBundleId] = (0, import_react.useState)(void 0);
			  const [installing, setInstalling] = (0, import_react.useState)(false);
			  const [installError, setInstallError] = (0, import_react.useState)(null);
			  const [dropActive, setDropActive] = (0, import_react.useState)(false);
			  const fileInput = (0, import_react.useRef)(null);
			  const refresh = () => setReload((value) => value + 1);
			  (0, import_react.useEffect)(() => {
			    if (!open) return;
			    let current = true;
			    setState({ status: "loading" });
			    void list().then(
			      (snapshot) => {
			        if (current) setState({ status: "ready", snapshot });
			      },
			      () => {
			        if (current) setState({ status: "error" });
			      }
			    );
			    return () => {
			      current = false;
			    };
			  }, [open, list, reload]);
			  const toggleExpanded = (bundleId) => {
			    setExpanded((current) => {
			      const next = new Set(current);
			      if (next.has(bundleId)) next.delete(bundleId);
			      else next.add(bundleId);
			      return next;
			    });
			  };
			  const loadViewerContent = async (skillName, filePath) => {
			    try {
			      const res = await fetch(`/api/skill-manager/skills/${encodeURIComponent(skillName)}/files/${encodeURIComponent(filePath)}`);
			      const body = await res.json();
			      if (body.error !== void 0) throw new Error(body.error);
			      setViewer((v) => v === null ? v : { ...v, loading: false, content: body.content ?? "" });
			    } catch (error) {
			      setViewer((v) => v === null ? v : { ...v, loading: false, error: error instanceof Error ? error.message : String(error) });
			    }
			  };
			  const openViewer = (skill) => {
			    setViewer({ skill, file: "SKILL.md", loading: true });
			    void loadViewerContent(skill.name, "SKILL.md");
			  };
			  const selectViewerFile = (filePath) => {
			    if (viewer === null) return;
			    setViewer({ ...viewer, file: filePath, loading: true, error: void 0 });
			    void loadViewerContent(viewer.skill.name, filePath);
			  };
			  const doAssign = async (skill, bundleId) => {
			    try {
			      if (state.status !== "ready") return;
			      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId);
			      if (bundle === void 0) throw new Error("bundle not found");
			      await setBundleSkills(bundleId, [...bundle.skills.map((s) => s.name), skill.name]);
			      setAssignTarget(null);
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    }
			  };
			  const acceptFiles = (files) => {
			    if (files === null || files.length === 0) return;
			    const collected = [];
			    for (const file of files) {
			      const relative = file.webkitRelativePath;
			      if (relative === "") continue;
			      const parts = relative.split("/");
			      if (parts.length < 2) continue;
			      collected.push({ path: parts.slice(1).join("/"), file });
			    }
			    if (collected.length === 0) return;
			    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith(".zip") ? collected[0] : void 0;
			    if (zipCandidate !== void 0) {
			      const reader = new FileReader();
			      reader.onload = () => {
			        const data = String(reader.result ?? "").split(",")[1] ?? "";
			        setInstall({ archive: true, name: zipCandidate.path, data, folderName: zipCandidate.path });
			        setInstallError(null);
			      };
			      reader.readAsDataURL(zipCandidate.file);
			      return;
			    }
			    const rootName = collected[0]?.path.split("/")[0] ?? "";
			    setInstallName(rootName);
			    setInstallError(null);
			    setInstall({ files: collected, folderName: rootName });
			  };
			  const onDrop = async (event) => {
			    event.preventDefault();
			    setDropActive(false);
			    const collected = [];
			    const items = event.dataTransfer.items;
			    if (items === void 0) return;
			    const pending = [];
			    for (const item of Array.from(items)) {
			      const entry = item.webkitGetAsEntry?.();
			      if (entry !== void 0 && entry !== null) pending.push(collectEntry(entry, "", collected));
			    }
			    await Promise.all(pending);
			    if (collected.length === 0) return;
			    const zipCandidate = collected.length === 1 && collected[0].path.toLowerCase().endsWith(".zip") ? collected[0] : void 0;
			    if (zipCandidate !== void 0) {
			      setInstall({ archive: true, name: zipCandidate.path, data: await fileToBase64(zipCandidate.file), folderName: zipCandidate.path });
			      setInstallError(null);
			      return;
			    }
			    const rootName = collected[0]?.path.split("/")[0] ?? "";
			    setInstallName(rootName);
			    setInstallError(null);
			    setInstall({ files: collected, folderName: rootName });
			  };
			  const confirmInstall = async (event) => {
			    event.preventDefault();
			    if (install === null || installing) return;
			    if (install.archive !== true && installName.trim() === "") return;
			    setInstalling(true);
			    setInstallError(null);
			    try {
			      if (install.archive === true) {
			        await installSkill({
			          archive: install.data,
			          description: installDescription.trim(),
			          ...installBundleId === void 0 ? {} : { bundleId: installBundleId }
			        });
			      } else {
			        const files = await Promise.all(install.files.map(async ({ path, file }) => ({
			          path,
			          data: await fileToBase64(file)
			        })));
			        await installSkill({
			          skillName: installName.trim(),
			          description: installDescription.trim(),
			          ...installBundleId === void 0 ? {} : { bundleId: installBundleId },
			          files
			        });
			      }
			      setInstall(null);
			      setInstallName("");
			      setInstallDescription("");
			      setInstallBundleId(void 0);
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    } finally {
			      setInstalling(false);
			    }
			  };
			  const submitNewBundle = async (event) => {
			    event.preventDefault();
			    if (creatingBundle || newBundleName.trim() === "") return;
			    setCreatingBundle(true);
			    try {
			      await createBundle(newBundleName.trim());
			      setNewBundleName("");
			      setNewBundleOpen(false);
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    } finally {
			      setCreatingBundle(false);
			    }
			  };
			  const submitRename = async (event) => {
			    event.preventDefault();
			    if (renaming || renameTarget === null || renameTarget.name.trim() === "") return;
			    setRenaming(true);
			    try {
			      await renameBundle(renameTarget.bundleId, renameTarget.name.trim());
			      setRenameTarget(null);
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    } finally {
			      setRenaming(false);
			    }
			  };
			  const confirmDelete = async () => {
			    if (confirm === null || confirming) return;
			    setConfirming(true);
			    try {
			      if (confirm.kind === "bundle") await deleteBundle(confirm.bundle.id);
			      else await deleteSkill(confirm.name);
			      setConfirm(null);
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    } finally {
			      setConfirming(false);
			    }
			  };
			  const removeFromBundle = async (bundleId, name) => {
			    try {
			      if (state.status !== "ready") return;
			      const bundle = state.snapshot.bundles.find((candidate) => candidate.id === bundleId);
			      if (bundle === void 0) return;
			      await setBundleSkills(bundleId, bundle.skills.map((skill) => skill.name).filter((skillName) => skillName !== name));
			      refresh();
			    } catch (error) {
			      setInstallError(error instanceof Error ? error.message : String(error));
			    }
			  };
			  const bundles = state.status === "ready" ? state.snapshot.bundles : [];
			  const loose = state.status === "ready" ? state.snapshot.loose : [];
			  const SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
			  const trimmedName = installName.trim();
			  const nameInvalid = trimmedName !== "" && !SKILL_NAME_PATTERN.test(trimmedName);
			  return /* @__PURE__ */ React.createElement(
			    import_dsh_client_ui_primitives.Modal,
			    {
			      open,
			      onClose: () => {
			        if (installing || confirming) return;
			        onClose();
			      },
			      closeLabel: t("close"),
			      title: t("panelTitle"),
			      className: css.modal ?? "",
			      contentClassName: css.modalBody ?? ""
			    },
			    /* @__PURE__ */ React.createElement("div", { className: css.panel, "aria-busy": state.status === "loading" }, /* @__PURE__ */ React.createElement("div", { className: css.topRow }, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("newBundle"), side: "bottom", delayMs: 500 }, /* @__PURE__ */ React.createElement(
			      "button",
			      {
			        type: "button",
			        className: css.newBundleButton,
			        "aria-label": t("newBundle"),
			        "aria-expanded": newBundleOpen,
			        onClick: () => {
			          setNewBundleOpen((value) => !value);
			        }
			      },
			      /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }),
			      t("newBundle")
			    ))), newBundleOpen && /* @__PURE__ */ React.createElement("form", { className: css.inlineForm, onSubmit: (event) => {
			      void submitNewBundle(event);
			    } }, /* @__PURE__ */ React.createElement(
			      "input",
			      {
			        className: css.inlineInput,
			        value: newBundleName,
			        placeholder: t("newBundlePlaceholder"),
			        "aria-label": t("newBundlePlaceholder"),
			        autoFocus: true,
			        disabled: creatingBundle,
			        onChange: (event) => {
			          setNewBundleName(event.currentTarget.value);
			        }
			      }
			    ), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", type: "submit", disabled: creatingBundle || newBundleName.trim() === "" }, t("create")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", type: "button", disabled: creatingBundle, onClick: () => {
			      setNewBundleOpen(false);
			    } }, t("cancel"))), /* @__PURE__ */ React.createElement(
			      "div",
			      {
			        className: `${css.upload} ${dropActive ? css.uploadActive : ""}`,
			        onClick: () => {
			          fileInput.current?.click();
			        },
			        onDragOver: (event) => {
			          event.preventDefault();
			          setDropActive(true);
			        },
			        onDragLeave: () => {
			          setDropActive(false);
			        },
			        onDrop: (event) => {
			          void onDrop(event);
			        },
			        role: "button",
			        tabIndex: 0,
			        "aria-label": t("uploadHint"),
			        onKeyDown: (event) => {
			          if (event.key === "Enter" || event.key === " ") {
			            event.preventDefault();
			            fileInput.current?.click();
			          }
			        }
			      },
			      /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconFolderOpenOutline16, { size: 16, "aria-hidden": "true" }),
			      /* @__PURE__ */ React.createElement("span", null, t("uploadHint")),
			      /* @__PURE__ */ React.createElement(
			        "input",
			        {
			          ref: fileInput,
			          type: "file",
			          className: css.hiddenInput,
			          multiple: true,
			          ...{ webkitdirectory: "" },
			          onChange: (event) => {
			            acceptFiles(event.currentTarget.files === null ? null : Array.from(event.currentTarget.files));
			          }
			        }
			      )
			    ), install !== null && /* @__PURE__ */ React.createElement("form", { className: css.installForm, onSubmit: (event) => {
			      void confirmInstall(event);
			    } }, /* @__PURE__ */ React.createElement("div", { className: css.installRow }, /* @__PURE__ */ React.createElement(
			      "input",
			      {
			        className: css.inlineInput,
			        value: installName,
			        placeholder: install.archive === true ? t("installNameFromArchive") : t("installNamePlaceholder"),
			        "aria-label": t("installName"),
			        disabled: installing || install.archive === true,
			        onChange: (event) => {
			          setInstallName(event.currentTarget.value);
			        }
			      }
			    ), /* @__PURE__ */ React.createElement(
			      "input",
			      {
			        className: css.inlineInput,
			        value: installDescription,
			        placeholder: t("installDescription"),
			        "aria-label": t("installDescription"),
			        disabled: installing,
			        onChange: (event) => {
			          setInstallDescription(event.currentTarget.value);
			        }
			      }
			    ), /* @__PURE__ */ React.createElement("label", { className: css.bundleSelect }, /* @__PURE__ */ React.createElement("span", { className: css.visuallyHidden }, t("installBundle")), /* @__PURE__ */ React.createElement(
			      "select",
			      {
			        value: installBundleId ?? "",
			        disabled: installing,
			        onChange: (event) => {
			          setInstallBundleId(event.currentTarget.value === "" ? void 0 : event.currentTarget.value);
			        }
			      },
			      /* @__PURE__ */ React.createElement("option", { value: "" }, t("installLoose")),
			      bundles.map((bundle) => /* @__PURE__ */ React.createElement("option", { key: bundle.id, value: bundle.id }, bundle.name))
			    )), /* @__PURE__ */ React.createElement("span", { className: css.installMeta }, install.archive === true ? t("uploadMeta", { n: 1, folder: install.folderName }) : t("uploadMeta", { n: install.files.length, folder: install.folderName }))), !install.archive === true && nameInvalid && /* @__PURE__ */ React.createElement("p", { className: css.error, role: "alert" }, t("installNameInvalid")), /* @__PURE__ */ React.createElement("div", { className: css.installActions }, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", type: "submit", disabled: installing || (install.archive !== true && (trimmedName === "" || nameInvalid)) }, t("installConfirm")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", type: "button", disabled: installing, onClick: () => {
			      setInstall(null);
			    } }, t("installCancel"))), installError !== null && /* @__PURE__ */ React.createElement("p", { className: css.error, role: "alert" }, installError)), state.status === "loading" ? /* @__PURE__ */ React.createElement("p", { className: css.status }, t("loading")) : null, state.status === "error" ? /* @__PURE__ */ React.createElement("div", { className: css.failure }, /* @__PURE__ */ React.createElement("p", { role: "alert" }, t("error")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", onClick: refresh }, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconRefreshOutline14, null), " ", t("retry"))) : null, state.status === "ready" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h3", { className: css.sectionTitle }, t("bundlesTitle")), bundles.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: css.status }, t("bundlesEmpty")) : /* @__PURE__ */ React.createElement("ul", { className: css.bundleList }, bundles.map((bundle) => {
			      const open2 = expanded.has(bundle.id);
			      const renamingThis = renameTarget?.bundleId === bundle.id;
			      return /* @__PURE__ */ React.createElement("li", { className: css.bundle, key: bundle.id, "data-open": open2 ? "true" : void 0 }, renamingThis ? /* @__PURE__ */ React.createElement("form", { className: css.inlineForm, onSubmit: (event) => {
			        void submitRename(event);
			      } }, /* @__PURE__ */ React.createElement(
			        "input",
			        {
			          className: css.inlineInput,
			          value: renameTarget.name,
			          placeholder: t("renameBundlePlaceholder"),
			          "aria-label": t("renameBundlePlaceholder"),
			          autoFocus: true,
			          disabled: renaming,
			          onChange: (event) => {
			            setRenameTarget((current) => current === null ? current : { ...current, name: event.currentTarget.value });
			          }
			        }
			      ), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", type: "submit", disabled: renaming || renameTarget.name.trim() === "" }, t("rename")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", type: "button", disabled: renaming, onClick: () => {
			        setRenameTarget(null);
			      } }, t("cancel"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
			        "button",
			        {
			          type: "button",
			          className: css.bundleRow,
			          "aria-expanded": open2,
			          onClick: () => {
			            toggleExpanded(bundle.id);
			          }
			        },
			        /* @__PURE__ */ React.createElement("span", { className: css.bundleName }, bundle.name),
			        /* @__PURE__ */ React.createElement("span", { className: css.bundleCount }, t("skillsCount", { n: bundle.skillCount })),
			        /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: css.chevron, size: 12, "aria-hidden": "true" })
			      ), /* @__PURE__ */ React.createElement("div", { className: css.bundleActions }, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("rename"), side: "bottom", delayMs: 500 }, /* @__PURE__ */ React.createElement(
			        "button",
			        {
			          type: "button",
			          className: css.iconAction,
			          "aria-label": t("rename"),
			          onClick: () => {
			            setRenameTarget({ bundleId: bundle.id, name: bundle.name });
			          }
			        },
			        /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconEditOutline16, { size: 14 })
			      )), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("delete"), side: "bottom", delayMs: 500 }, /* @__PURE__ */ React.createElement(
			        "button",
			        {
			          type: "button",
			          className: css.iconAction,
			          "aria-label": t("delete"),
			          onClick: () => {
			            setConfirm({ kind: "bundle", bundle });
			          }
			        },
			        /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 })
			      )))), open2 && /* @__PURE__ */ React.createElement("ul", { className: css.skillList }, bundle.skills.length === 0 ? /* @__PURE__ */ React.createElement("li", { className: css.status }, t("bundleNoSkills")) : bundle.skills.map((skill) => skillRowNode(skill, openViewer, t, bundle.id, null, (s) => { void removeFromBundle(bundle.id, s.name); }, (s) => { setConfirm({ kind: "skill", name: s.name }); }))));
			    })), /* @__PURE__ */ React.createElement("h3", { className: css.sectionTitle }, t("looseTitle")), loose.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: css.looseEmpty }, t("looseEmpty")) : /* @__PURE__ */ React.createElement("ul", { className: css.skillList }, loose.map((skill) => skillRowNode(skill, openViewer, t, null, (s) => { setAssignTarget(s); }, null, (s) => { setConfirm({ kind: "skill", name: s.name }); }))))),
			    /* @__PURE__ */ React.createElement(
			      import_dsh_client_ui_primitives.Modal,
			      {
			        open: confirm !== null,
			        onClose: () => {
			          if (!confirming) setConfirm(null);
			        },
			        closeLabel: t("close"),
			        title: confirm?.kind === "bundle" ? t("deleteBundleConfirm", { name: confirm.bundle.name }) : t("deleteSkillConfirm", { name: confirm?.name ?? "" }),
			        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", disabled: confirming, onClick: () => {
			          setConfirm(null);
			        } }, t("cancel")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", disabled: confirming, onClick: () => {
			          void confirmDelete();
			        } }, t("delete")))
			      }
			    ),
			    viewer !== null && /* @__PURE__ */ React.createElement(
			      import_dsh_client_ui_primitives.Modal,
			      {
			        open: viewer !== null,
			        onClose: () => {
			          setViewer(null);
			        },
			        closeLabel: t("close"),
			        title: viewer.skill.name + (viewer.file === "SKILL.md" ? "" : " · " + viewer.file),
			        className: css.viewerModal,
			        contentClassName: css.viewerBody
			      },
			      /* @__PURE__ */ React.createElement("div", { className: css.viewerLayout }, /* @__PURE__ */ React.createElement("nav", { className: css.viewerNav, "aria-label": t("viewerNav") }, skillFileRows(Array.isArray(viewer.skill.files) ? viewer.skill.files : []).map((row, index) => /* @__PURE__ */ React.createElement("div", {
			        key: row.path + "-" + String(index),
			        className: css.viewerNavItem + (row.kind === "dir" ? " " + css.viewerNavDir : ""),
			        "data-active": row.kind === "file" && row.path === viewer.file ? "true" : void 0,
			        "data-dir": row.kind === "dir" ? "true" : void 0,
			        style: { paddingLeft: 8 + row.depth * 14 },
			        title: row.path,
			        onClick: row.kind === "file" ? () => {
			          selectViewerFile(row.path);
			        } : void 0
			      }, row.kind === "dir" ? "📁 " : "📄 ", row.path))), /* @__PURE__ */ React.createElement("div", { className: css.viewerContent }, viewer.loading === true ? t("previewLoading") : viewer.error !== void 0 ? viewer.error : /* @__PURE__ */ React.createElement("div", { dangerouslySetInnerHTML: { __html: renderSkillMarkdown(viewer.content ?? "") } })))),
			    assignTarget !== null && /* @__PURE__ */ React.createElement(
			      import_dsh_client_ui_primitives.Modal,
			      {
			        open: assignTarget !== null,
			        onClose: () => {
			          setAssignTarget(null);
			        },
			        closeLabel: t("close"),
			        title: t("assignTitle", { name: assignTarget.name }),
			        className: css.viewerModal,
			        contentClassName: css.viewerBody
			      },
			      /* @__PURE__ */ React.createElement("div", { className: css.skillList }, bundles.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: css.looseEmpty }, t("assignEmpty")) : bundles.map((bundle) => /* @__PURE__ */ React.createElement("div", {
			        key: bundle.id,
			        className: css.skillRow,
			        style: { cursor: "pointer" },
			        onClick: () => {
			          void doAssign(assignTarget, bundle.id);
			        }
			      }, /* @__PURE__ */ React.createElement("span", { className: css.skillLabel }, /* @__PURE__ */ React.createElement("span", { className: css.skillName }, bundle.name), /* @__PURE__ */ React.createElement("span", { className: css.skillDescription }, t("skillsCount", { n: bundle.skillCount }))))))
			    )
			  );
			}
			
			ensureStyles();
			return module.exports;
		})();
		//#endregion


		//#region css
		const css = [
			".usg_layer{flex:none;align-items:center;width:100%;height:32px;margin:0;display:flex;position:relative}",
			".usg_footerButtons{align-items:center;width:100%;display:flex}",
			".usg_badge{width:50%;height:32px;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:none;border-radius:10px;align-items:center;gap:6px;padding:0 8px 0 6px;font-family:inherit;font-size:14px;display:inline-flex;overflow:hidden}",
			".usg_badge:hover{background:var(--dsw-alias-interactive-bg-hover-solid)}",
			".usg_badge[data-active]{background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_badgeLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}",
			".usg_badgeCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none;margin-left:auto;font-size:12px;line-height:16px}",
			".usg_layer.usg_rail{width:36px;height:36px;margin:0}",
			".usg_layer.usg_rail .usg_badge{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;padding:0}",
			".usg_layer.usg_rail .usg_footerButtons{flex-direction:column;gap:2px}",
			".usg_panel{z-index:30;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);width:440px;max-width:calc(100vw - 24px);max-height:74vh;box-shadow:var(--dsw-shadow-lv2);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);--usg-blue:#1f6feb;--usg-cellEmpty:rgba(128,128,128,0.16);border-radius:12px;flex-direction:column;display:flex;position:fixed;bottom:128px;left:268px;transform-origin:left bottom;overflow:hidden;animation:usgDrawerIn .8s cubic-bezier(.22,1,.36,1) both}",
			"@keyframes usgDrawerIn{from{opacity:0;transform:translate3d(0,64px,0) scale(.45)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}",
			"@keyframes usgDrawerOut{from{opacity:1;transform:translate3d(0,0,0) scale(1)}to{opacity:0;transform:translate3d(0,64px,0) scale(.45)}}",
			".usg_panel.usg_panelClosing{animation:usgDrawerOut .8s cubic-bezier(.22,1,.36,1) both}",
			"@media (prefers-reduced-motion:reduce){.usg_panel,.usg_panel.usg_panelClosing{animation-duration:.01s}}",
			".usg_header{box-sizing:border-box;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);flex:none;justify-content:space-between;align-items:center;min-height:44px;padding:10px 12px;display:flex}",
			".usg_headerLeft{align-items:center;gap:8px;display:flex}",
			".usg_title{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}",
			".usg_headerActions{align-items:center;gap:2px;display:flex}",
			".usg_iconButton{cursor:pointer;width:26px;height:26px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex}",
			".usg_iconButton:hover{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_body{flex:1;min-height:0;padding:4px 14px 14px;overflow-y:auto}",
			".usg_section{margin-top:12px}",
			".usg_sectionTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;margin:0 0 6px}",
			".usg_note{color:var(--dsw-alias-label-tertiary);margin:4px 0;font-size:12px;line-height:18px}",
			".usg_error{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);border-radius:8px;justify-content:space-between;align-items:flex-start;gap:8px;margin:4px 0;padding:7px 8px;font-size:12px;line-height:18px;display:flex}",
			".usg_retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:none;flex:none;padding:0}",
			".usg_balanceCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-fill-l1, transparent);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}",
			".usg_balanceMain{align-items:baseline;gap:8px;display:flex}",
			".usg_balanceAmount{color:var(--dsw-alias-label-primary);font-size:24px;font-weight:600;line-height:32px;font-variant-numeric:tabular-nums}",
			".usg_balanceStatus{align-items:center;gap:5px;font-size:12px;line-height:18px;display:inline-flex}",
			".usg_balanceOk{color:var(--dsw-alias-state-success-primary)}",
			".usg_balanceBad{color:var(--dsw-alias-state-error-primary)}",
			".usg_balanceRows{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:2px;font-size:12px;line-height:18px;display:flex}",
			".usg_balanceRow{justify-content:space-between;display:flex}",
			".usg_providerPicker{align-items:center;gap:8px;margin:6px 0 8px;font-size:12px;line-height:18px;display:flex}",
			".usg_providerPickerLabel{color:var(--dsw-alias-label-tertiary);flex:none}",
			".usg_providerSelect{box-sizing:border-box;min-width:0;flex:1;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 6px;font:inherit;font-size:12px;line-height:18px}",
			".usg_accountGrid{flex-direction:column;gap:8px;display:flex}",
			".usg_accountCard{--usg-providerAccent:#1f6feb;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:linear-gradient(135deg,color-mix(in srgb,var(--usg-providerAccent) 8%,transparent),transparent 42%);border-radius:12px;padding:10px 11px;display:flex;flex-direction:column;gap:9px}",
			".usg_accountCard[data-provider=deepseek],.usg_accountCard[data-provider=deepseek-official]{--usg-providerAccent:#1f6feb}",
			".usg_accountCard[data-provider=opencode-go]{--usg-providerAccent:#00a67d}",
			".usg_accountCard[data-provider=zai],.usg_accountCard[data-provider=zai-coding-cn]{--usg-providerAccent:#7656e8}",
			".usg_accountCard[data-provider=openrouter]{--usg-providerAccent:#6366f1}",
			".usg_accountCard[data-provider=moonshotai],.usg_accountCard[data-provider=moonshotai-cn],.usg_accountCard[data-provider=kimi],.usg_accountCard[data-provider=kimi-coding]{--usg-providerAccent:#e07a1f}",
			".usg_accountHead{align-items:center;gap:8px;display:flex}",
			".usg_accountMark{width:24px;height:24px;color:#fff;background:var(--usg-providerAccent);border-radius:7px;justify-content:center;align-items:center;font-size:10px;font-weight:700;display:flex;box-shadow:0 4px 12px color-mix(in srgb,var(--usg-providerAccent) 25%,transparent)}",
			".usg_accountIdentity{min-width:0;flex:1;display:flex;flex-direction:column}",
			".usg_accountName{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px}",
			".usg_accountPlan{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px;overflow:hidden}",
			".usg_accountStatus{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-fill-l2);border-radius:999px;padding:2px 7px;font-size:10px;line-height:16px;white-space:nowrap}",
			".usg_accountStatus[data-status=ok]{color:var(--usg-providerAccent);background:color-mix(in srgb,var(--usg-providerAccent) 12%,transparent)}",
			".usg_quotaList{flex-direction:column;gap:8px;display:flex}",
			".usg_quotaRow{display:flex;flex-direction:column;gap:4px}",
			".usg_quotaMeta{align-items:baseline;gap:8px;display:flex}",
			".usg_quotaLabel{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}",
			".usg_quotaValue{color:var(--dsw-alias-label-primary);margin-left:auto;font-size:12px;font-weight:600;line-height:16px;font-variant-numeric:tabular-nums}",
			".usg_quotaReset{color:var(--dsw-alias-label-caption);font-size:9px;line-height:14px;white-space:nowrap}",
			".usg_quotaTrack{height:6px;background:var(--dsw-alias-fill-l2);border-radius:999px;overflow:hidden}",
			".usg_quotaFill{height:100%;background:var(--usg-providerAccent);border-radius:inherit;min-width:2px;transition:width .2s ease}",
			".usg_quotaEmpty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11px;line-height:17px}",
			".usg_statsRow{display:flex;gap:8px}",
			".usg_stat{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;flex:1;flex-direction:column;gap:1px;padding:8px 10px;display:flex}",
			".usg_statValue{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:22px;font-variant-numeric:tabular-nums;white-space:nowrap}",
			".usg_statLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}",
			".usg_hitCaption{color:var(--dsw-alias-label-tertiary);margin-top:6px;font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}",
			".usg_hitCaption b{color:var(--dsw-alias-label-secondary);font-weight:600}",
			".usg_heat{overflow-x:auto}",
			".usg_heatHeader{justify-content:space-between;align-items:center;margin-bottom:6px;display:flex}",
			".usg_heatHeader .usg_sectionTitle{flex:none;margin:0}",
			".usg_monthNav{align-items:center;gap:2px;display:flex}",
			".usg_navButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex}",
			".usg_navButton:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_navButton:disabled{color:var(--dsw-alias-label-caption);cursor:default}",
			".usg_monthTitle{color:var(--dsw-alias-label-primary);min-width:88px;font-size:12px;font-weight:500;line-height:24px;text-align:center;font-variant-numeric:tabular-nums}",
			".usg_todayButton{cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:6px;padding:0 6px;font-size:11px;line-height:24px}",
			".usg_todayButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_viewToggle{align-items:center;gap:2px;display:flex;flex:none}",
			".usg_viewButton{cursor:pointer;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:6px;padding:0 7px;font-size:11px;line-height:22px;font-family:inherit}",
			".usg_viewButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_viewButton[data-active]{color:var(--usg-blue);background:color-mix(in srgb,var(--usg-blue) 10%,transparent)}",
			".usg_yearGrid{grid-template-columns:repeat(4,1fr);gap:6px;display:grid}",
			".usg_yearCell{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);border-radius:10px;padding:8px 4px;flex-direction:column;gap:3px;align-items:center;display:flex;cursor:pointer;font-family:inherit}",
			".usg_yearCell:hover:not(:disabled){border-color:var(--dsw-alias-label-secondary)}",
			".usg_yearCell[data-current]{box-shadow:0 0 0 1px var(--usg-blue)}",
			".usg_yearCell:disabled{cursor:default;opacity:.45}",
			".usg_yearName{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;line-height:16px}",
			".usg_yearTokens{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600;line-height:16px;font-variant-numeric:tabular-nums}",
			".usg_yearSummary{justify-content:space-between;align-items:baseline;gap:8px;margin:2px 0 8px;display:flex}",
			".usg_yearSummaryLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}",
			".usg_yearSummaryValue{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;line-height:20px;font-variant-numeric:tabular-nums}",
			".usg_monthGrid{flex-direction:column;gap:4px;width:100%;display:flex}",
			".usg_weekHeader{color:var(--dsw-alias-label-tertiary);grid-template-columns:repeat(7,1fr);gap:4px;display:grid}",
			".usg_weekLabel{font-size:10px;line-height:16px;text-align:center}",
			".usg_heatRow{grid-template-columns:repeat(7,1fr);gap:4px;display:grid}",
			".usg_cell{aspect-ratio:1/1;min-width:0;width:100%;border-radius:8px;background:var(--usg-cellEmpty);border:0;padding:0;cursor:pointer;justify-content:center;align-items:center;font-family:inherit;display:flex}",
			".usg_cell:hover{box-shadow:0 0 0 1px var(--dsw-alias-label-secondary)}",
			".usg_cellToday{box-shadow:0 0 0 1px var(--usg-blue)}",
			".usg_cellToday:hover{box-shadow:0 0 0 1px var(--usg-blue)}",
			".usg_cellSelected{box-shadow:0 0 0 2px var(--dsw-alias-label-primary)}",
			".usg_cellSelected:hover{box-shadow:0 0 0 2px var(--dsw-alias-label-primary)}",
			".usg_cellDay{font-size:12px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums;pointer-events:none}",
			".usg_emptyCell{aspect-ratio:1/1;min-width:0;width:100%}",
			".usg_legend{align-items:center;gap:4px;margin-top:6px;font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary);display:flex}",
			".usg_legendSwatch{width:10px;height:10px;border-radius:2px;background:var(--dsw-alias-fill-l2)}",
			".usg_days{flex-direction:column;display:flex}",
			".usg_day{width:100%;min-height:30px;align-items:center;gap:8px;border:0;background:0 0;border-bottom:1px solid var(--dsw-alias-border-l1);padding:5px 0;font:inherit;text-align:left;cursor:pointer;display:flex}",
			".usg_day:last-child{border-bottom:0}",
			".usg_day:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_dayDate{color:var(--dsw-alias-label-secondary);flex:none;width:104px;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}",
			".usg_dayTokens{color:var(--dsw-alias-label-primary);flex:none;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}",
			".usg_dayHit{color:var(--dsw-alias-label-tertiary);flex:none;width:52px;font-size:11px;line-height:18px;font-variant-numeric:tabular-nums;text-align:right}",
			".usg_dayBar{background:var(--usg-blue);border-radius:2px;height:6px;flex:1;min-width:4px;opacity:.65}",
			".usg_detailHeader{align-items:center;gap:8px;display:flex}",
			".usg_back{cursor:pointer;width:26px;height:26px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex;flex:none}",
			".usg_back:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".usg_detailDate{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}",
			".usg_detailHit{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:11px;line-height:20px;font-variant-numeric:tabular-nums}",
			".usg_detailSummary{color:var(--dsw-alias-label-secondary);margin:6px 0 8px;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}",
			".usg_modelRow{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;margin-bottom:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px}",
			".usg_modelRow:last-child{margin-bottom:0}",
			".usg_modelHead{align-items:center;gap:8px;display:flex}",
			".usg_modelName{color:var(--dsw-alias-label-primary);min-width:0;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;font-weight:500;line-height:18px;overflow:hidden}",
			".usg_modelTokens{color:var(--dsw-alias-label-primary);flex:none;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}",
			".usg_modelHit{color:var(--dsw-alias-label-tertiary);flex:none;width:56px;font-size:11px;line-height:18px;font-variant-numeric:tabular-nums;text-align:right}",
			".usg_modelBarTrack{background:var(--dsw-alias-fill-l2);border-radius:2px;height:5px;overflow:hidden}",
			".usg_modelBar{background:var(--usg-blue);border-radius:2px;height:5px}",
			".usg_modelMeta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}",
			".usg_footerNote{color:var(--dsw-alias-label-caption);margin-top:10px;font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}"
		].join("");
		const tagId = "dsh-usage-skill/UsageStats.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-usage-skill";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const S = {
			layer: "usg_layer",
			rail: "usg_rail",
			footerButtons: "usg_footerButtons",
			badge: "usg_badge",
			badgeLabel: "usg_badgeLabel",
			badgeCount: "usg_badgeCount",
			panel: "usg_panel",
			panelClosing: "usg_panelClosing",
			header: "usg_header",
			headerLeft: "usg_headerLeft",
			title: "usg_title",
			headerActions: "usg_headerActions",
			iconButton: "usg_iconButton",
			body: "usg_body",
			section: "usg_section",
			sectionTitle: "usg_sectionTitle",
			note: "usg_note",
			error: "usg_error",
			retry: "usg_retry",
			providerPicker: "usg_providerPicker",
			providerPickerLabel: "usg_providerPickerLabel",
			providerSelect: "usg_providerSelect",
			accountGrid: "usg_accountGrid",
			accountCard: "usg_accountCard",
			accountHead: "usg_accountHead",
			accountMark: "usg_accountMark",
			accountIdentity: "usg_accountIdentity",
			accountName: "usg_accountName",
			accountPlan: "usg_accountPlan",
			accountStatus: "usg_accountStatus",
			quotaList: "usg_quotaList",
			quotaRow: "usg_quotaRow",
			quotaMeta: "usg_quotaMeta",
			quotaLabel: "usg_quotaLabel",
			quotaValue: "usg_quotaValue",
			quotaReset: "usg_quotaReset",
			quotaTrack: "usg_quotaTrack",
			quotaFill: "usg_quotaFill",
			quotaEmpty: "usg_quotaEmpty",
			balanceCard: "usg_balanceCard",
			balanceMain: "usg_balanceMain",
			balanceAmount: "usg_balanceAmount",
			balanceStatus: "usg_balanceStatus",
			balanceOk: "usg_balanceOk",
			balanceBad: "usg_balanceBad",
			balanceRows: "usg_balanceRows",
			balanceRow: "usg_balanceRow",
			statsRow: "usg_statsRow",
			stat: "usg_stat",
			statValue: "usg_statValue",
			statLabel: "usg_statLabel",
			hitCaption: "usg_hitCaption",
			heat: "usg_heat",
			heatHeader: "usg_heatHeader",
			monthNav: "usg_monthNav",
			navButton: "usg_navButton",
			monthTitle: "usg_monthTitle",
			todayButton: "usg_todayButton",
			viewToggle: "usg_viewToggle",
			viewButton: "usg_viewButton",
			yearGrid: "usg_yearGrid",
			yearCell: "usg_yearCell",
			yearName: "usg_yearName",
			yearTokens: "usg_yearTokens",
			yearSummary: "usg_yearSummary",
			yearSummaryLabel: "usg_yearSummaryLabel",
			yearSummaryValue: "usg_yearSummaryValue",
			monthGrid: "usg_monthGrid",
			weekHeader: "usg_weekHeader",
			weekLabel: "usg_weekLabel",
			heatRow: "usg_heatRow",
			cell: "usg_cell",
			cellSelected: "usg_cellSelected",
			cellToday: "usg_cellToday",
			cellDay: "usg_cellDay",
			emptyCell: "usg_emptyCell",
			legend: "usg_legend",
			legendSwatch: "usg_legendSwatch",
			days: "usg_days",
			day: "usg_day",
			dayDate: "usg_dayDate",
			dayTokens: "usg_dayTokens",
			dayHit: "usg_dayHit",
			dayBar: "usg_dayBar",
			detailHeader: "usg_detailHeader",
			back: "usg_back",
			detailDate: "usg_detailDate",
			detailHit: "usg_detailHit",
			detailSummary: "usg_detailSummary",
			modelRow: "usg_modelRow",
			modelHead: "usg_modelHead",
			modelName: "usg_modelName",
			modelTokens: "usg_modelTokens",
			modelHit: "usg_modelHit",
			modelBarTrack: "usg_modelBarTrack",
			modelBar: "usg_modelBar",
			modelMeta: "usg_modelMeta",
			footerNote: "usg_footerNote"
		};
		//#endregion

		//#region helpers
		/** Local `YYYY-MM-DD` for a Date. */
		function dayKeyOf(date) {
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${date.getFullYear()}-${month}-${day}`;
		}

		/** Today's local `YYYY-MM-DD`. */
		function todayKey() {
			return dayKeyOf(new Date());
		}

		/** Current month key `YYYY-MM`. */
		function currentMonthKey() {
			const now = new Date();
			return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		}

		/** Shift a `YYYY-MM` key by a signed month delta. */
		function shiftMonth(key, delta) {
			const [year, month] = key.split("-").map(Number);
			const date = new Date(year, month - 1 + delta, 1);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		}

		/** Localized `YYYY-MM` → e.g. "2026年8月" / "Aug 2026". */
		function monthLabelOf(key, translate) {
			const [year, month] = key.split("-").map(Number);
			return translate("month.year", { year, month: monthName(month - 1, translate) });
		}

		/** Group thousands. */
		function fmt(n) {
			return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		/** Compact form: 1234 → "1.2K". */
		function fmtCompact(n) {
			if (n < 1000) return String(n);
			if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}K`;
			return `${(n / 1000000).toFixed(1)}M`;
		}

		/** Hit-rate display: null/undefined → "—". */
		function fmtHit(hitRate) {
			return hitRate === null || hitRate === void 0 ? "—" : `${hitRate}%`;
		}

		/** Currency-aware amount: `¥ 36.44` / `$ 12.00` (Intl, fallback keeps the raw value). */
		function fmtCurrency(amount, currency) {
			if (amount === void 0 || amount === null) return "—";
			const numeric = Number(amount);
			if (!Number.isFinite(numeric)) return "—";
			try {
				return new Intl.NumberFormat(undefined, { style: "currency", currency: currency ?? "CNY" }).format(numeric);
			} catch {
				return `${currency ?? "CNY"} ${amount}`;
			}
		}

		/**
		 * Per-request staleness guard: each `start()` bumps a private counter and
		 * only the most recent start may `isCurrent()`. Usage and balance each
		 * hold their OWN loader, so the two never invalidate each other (the
		 * shared-counter race that dropped the first usage response).
		 */
		function createLoader() {
			let current = 0;
			return {
				start: () => ++current,
				isCurrent: (id) => id === current
			};
		}

		/**
		 * Normalize server-provided account metadata for the single selector.
		 * Adapter/mode selection belongs to the server registry, never UI guesses.
		 */
		function buildProviderChoices(providers) {
			return Array.isArray(providers) ? providers.map((provider) => ({
				...provider,
				accountMode: provider.accountMode ?? "balance"
			})) : [];
		}

		/** Locale-safe template interpolation: `t("key", {a})` replaces `{a}`. */
		function interpolate(template, params) {
			if (params === void 0) return template;
			return template.replace(/\{(\w+)\}/g, (match, key) => (Object.hasOwn(params, key) ? String(params[key]) : match));
		}

		async function fetchJson(path) {
			const response = await fetch(path, { headers: { accept: "application/json" } });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const payload = await response.json();
			if (payload === null || typeof payload !== "object") throw new Error("unexpected response");
			return payload;
		}

		/**
		 * Build one month's calendar heatmap: weeks as rows (Mon-first), only
		 * the month's own days, padded with null placeholders. Cell tokens come
		 * from the day map; `max` is the month's largest daily total, used for
		 * the absolute log-scale color mapping.
		 * @param dayMap - date key → day entry map.
		 * @param year - calendar year.
		 * @param month - zero-based month.
		 * @returns `{ weeks, max }`.
		 */
		function buildMonthHeatmap(dayMap, year, month) {
			const first = new Date(year, month, 1);
			const daysInMonth = new Date(year, month + 1, 0).getDate();
			const lead = (first.getDay() + 6) % 7; // Monday = 0
			const weeks = [];
			let max = 0;
			for (let w = 0; w * 7 < lead + daysInMonth; w += 1) {
				const week = [];
				for (let d = 0; d < 7; d += 1) {
					const dayNum = w * 7 + d - lead + 1;
					if (dayNum < 1 || dayNum > daysInMonth) {
						week.push(null);
						continue;
					}
					const date = new Date(year, month, dayNum);
					const key = dayKeyOf(date);
					const entry = dayMap.get(key);
					const tokens = entry?.tokens ?? 0;
					week.push({ key, day: dayNum, tokens, hitRate: entry?.cacheHitRate ?? null });
					if (tokens > max) max = tokens;
				}
				weeks.push(week);
			}
			return { weeks, max };
		}

		/**
		 * Codex-style blue cell color: continuous square-root mapping against
		 * the month's max (more tokens → strictly deeper blue, no banding),
		 * rendered as a plain rgba overlay of #1f6feb so it works in every
		 * browser/theme without color-mix support. Zero is the neutral gray
		 * "empty" cell. Returns the cell's background and text color.
		 */
		const BLUE_RGB = [31, 111, 235];
		function cellColor(tokens, max) {
			if (tokens <= 0) {
				return {
					background: "var(--usg-cellEmpty)",
					color: "var(--dsw-alias-label-secondary)"
				};
			}
			const ratio = max > 0 ? Math.sqrt(tokens / max) : 1;
			const alpha = Math.min(1, 0.22 + 0.78 * ratio);
			return {
				background: `rgba(${BLUE_RGB[0]}, ${BLUE_RGB[1]}, ${BLUE_RGB[2]}, ${alpha.toFixed(3)})`,
				color: alpha >= 0.6 ? "rgba(255,255,255,0.95)" : "var(--dsw-alias-label-primary)"
			};
		}
		//#endregion

		//#region UsageStatsPanel
		/**
		 * Sidebar footer action: badge + floating panel with balance and usage.
		 * @param props - `wide` from the sidebar shell, `t` bound by the slot runtime.
		 */
		function UsageStatsPanel({ wide, t }) {
			const translate = (key, params) => interpolate(t !== void 0 ? t(key) : key, params);
			const [open, setOpen] = react.useState(false);
			const [skillsOpen, setSkillsOpen] = react.useState(false);
			const [closing, setClosing] = react.useState(false);
			const requestClose = react.useCallback(() => {
				if (!open) return;
				setClosing(true);
			}, [open]);
			const toggleOpen = react.useCallback(() => {
				if (open && !closing) {
					setClosing(true);
				} else {
					setClosing(false);
					setOpen(true);
				}
			}, [open, closing]);
			const handlePanelAnimationEnd = (event) => {
				if (!closing || event.animationName !== "usgDrawerOut") return;
				setOpen(false);
				setClosing(false);
			};
			const [usage, setUsage] = react.useState(null);
			const [usageError, setUsageError] = react.useState(null);
			const [selectedDay, setSelectedDay] = react.useState(null);
			const [viewMonth, setViewMonth] = react.useState(() => currentMonthKey());
			const [viewMode, setViewMode] = react.useState("month");
			const [viewYear, setViewYear] = react.useState(() => new Date().getFullYear());
			const [providers, setProviders] = react.useState([]);
			const [providersLoaded, setProvidersLoaded] = react.useState(false);
			const [selectedProvider, setSelectedProvider] = react.useState(null);
			const [account, setAccount] = react.useState(null);
			const [accountLoading, setAccountLoading] = react.useState(false);
			const [accountError, setAccountError] = react.useState(null);
			const [refreshedAt, setRefreshedAt] = react.useState(null);
			const mountedRef = react.useRef(true);
			const usageLoaderRef = react.useRef(null);
			const accountLoaderRef = react.useRef(null);
			if (usageLoaderRef.current === null) usageLoaderRef.current = createLoader();
			if (accountLoaderRef.current === null) accountLoaderRef.current = createLoader();
			const providerChoices = react.useMemo(() => buildProviderChoices(providers), [providers]);
			const selectedProviderInfo = providerChoices.find((provider) => provider.id === selectedProvider) ?? null;

			const loadUsage = react.useCallback(() => {
				const seq = usageLoaderRef.current.start();
				setUsageError(null);
				fetchJson("/api/usage-stats/usage").then((payload) => {
					if (!mountedRef.current || !usageLoaderRef.current.isCurrent(seq)) return;
					if (payload.ok !== true) {
						setUsageError(payload.message ?? "usage aggregation failed");
						return;
					}
					setUsage(payload);
					setRefreshedAt(Date.now());
				}).catch((error) => {
					if (!mountedRef.current || !usageLoaderRef.current.isCurrent(seq)) return;
					setUsageError(error instanceof Error ? error.message : String(error));
				});
			}, []);

			const loadProviders = react.useCallback(() => {
				fetchJson("/api/usage-stats/providers").then((payload) => {
					if (!mountedRef.current) return;
					if (payload.ok !== true) {
						setProvidersLoaded(true);
						return;
					}
					const list = Array.isArray(payload.providers) ? payload.providers : [];
					setProviders(list);
					setProvidersLoaded(true);
				}).catch(() => { setProvidersLoaded(true); });
			}, []);

			const loadAccount = react.useCallback((providerId, force = false) => {
				const seq = accountLoaderRef.current.start();
				setAccountLoading(true);
				setAccountError(null);
				const target = providerId;
				if (target === null) {
					setAccountLoading(false);
					setAccountError("no providers");
					return;
				}
				const query = `?provider=${encodeURIComponent(target)}${force ? "&refresh=1" : ""}`;
				fetchJson(`/api/usage-stats/account${query}`).then((payload) => {
					if (!mountedRef.current || !accountLoaderRef.current.isCurrent(seq)) return;
					if (payload.ok !== true) {
						setAccountError(payload.message ?? "account fetch failed");
						return;
					}
					setAccount(payload.account);
					setRefreshedAt(payload.account?.fetchedAt ?? Date.now());
				}).catch((error) => {
					if (!mountedRef.current || !accountLoaderRef.current.isCurrent(seq)) return;
					setAccountError(error instanceof Error ? error.message : String(error));
				}).finally(() => {
					if (mountedRef.current && accountLoaderRef.current.isCurrent(seq)) setAccountLoading(false);
				});
			}, []);

			react.useEffect(() => {
				mountedRef.current = true;
				return () => {
					mountedRef.current = false;
				};
			}, []);

			// Keep exactly one valid provider selected across independent provider
			// and subscription responses. DeepSeek remains the initial preference.
			react.useEffect(() => {
				if (!providersLoaded || providerChoices.length === 0) return;
				setSelectedProvider((current) => {
					if (current !== null && providerChoices.some((provider) => provider.id === current)) return current;
					return providerChoices.find((provider) => provider.id === "deepseek-official" && provider.configured)?.id
						?? providerChoices.find((provider) => provider.id === "deepseek")?.id
						?? providerChoices.find((provider) => provider.configured)?.id
						?? providerChoices[0].id;
				});
			}, [providerChoices, providersLoaded]);

			react.useEffect(() => {
				if (!open) return;
				loadUsage();
				loadProviders();
				const usageTimer = window.setInterval(loadUsage, 60000);
				const providerTimer = window.setInterval(loadProviders, 300000);
				return () => {
					window.clearInterval(usageTimer);
					window.clearInterval(providerTimer);
				};
			}, [open, loadUsage, loadProviders]);

			// Fetch exactly the selected account. The server refreshes all providers
			// in the background; this request normally reads its five-minute cache.
			react.useEffect(() => {
				if (!open || selectedProvider === null) return;
				loadAccount(selectedProvider);
				const timer = window.setInterval(() => loadAccount(selectedProvider), 300000);
				return () => {
					window.clearInterval(timer);
				};
			}, [open, selectedProvider, loadAccount]);

			const dayMap = react.useMemo(() => {
				const map = new Map();
				if (usage !== null && Array.isArray(usage.days)) {
					for (const day of usage.days) map.set(day.date, day);
				}
				return map;
			}, [usage]);

			// Drop a stale selection when refreshed data no longer has that day.
			react.useEffect(() => {
				if (selectedDay !== null && !dayMap.has(selectedDay)) setSelectedDay(null);
			}, [dayMap, selectedDay]);

			// Never browse past the current month.
			react.useEffect(() => {
				const current = currentMonthKey();
				if (viewMonth > current) setViewMonth(current);
			}, [viewMonth]);

			const heat = react.useMemo(() => {
				// viewMonth is `YYYY-MM` with a 1-based month; the builder wants 0-based.
				const [year, monthOneBased] = viewMonth.split("-").map(Number);
				return buildMonthHeatmap(dayMap, year, monthOneBased - 1);
			}, [dayMap, viewMonth]);

			const yearHeat = react.useMemo(() => {
				// Twelve zero-based month slots for the viewed year; each sums every
				// recorded day's tokens. `max` drives the shared color scale.
				const months = Array.from({ length: 12 }, (_, month) => ({ month, tokens: 0 }));
				if (usage !== null && Array.isArray(usage.days)) {
					const prefix = String(viewYear);
					for (const day of usage.days) {
						if (!day.date.startsWith(prefix)) continue;
						const month = Number(day.date.slice(5, 7)) - 1;
						if (month >= 0 && month < 12) months[month].tokens += day.tokens ?? 0;
					}
				}
				const max = Math.max(...months.map((entry) => entry.tokens), 0);
				return { months, max };
			}, [usage, viewYear]);

			const stats = react.useMemo(() => {
				if (usage === null || !Array.isArray(usage.days)) return null;
				const today = todayKey();
				const month = today.slice(0, 7);
				let todayEntry = null;
				let dayTokens = 0;
				let monthTokens = 0;
				let total = usage.total?.tokens ?? 0;
				for (const day of usage.days) {
					if (day.date === today) {
						dayTokens = day.tokens ?? 0;
						todayEntry = day;
					}
					if (day.date.startsWith(month)) monthTokens += day.tokens ?? 0;
				}
				return { dayTokens, monthTokens, total, todayHit: todayEntry?.cacheHitRate ?? null };
			}, [usage]);

			const recent = react.useMemo(() => {
				// Last 14 CALENDAR days (not "last 14 recorded days"): days without
				// usage inside the window are omitted from the list.
				if (usage === null || !Array.isArray(usage.days)) return [];
				const cutoff = new Date();
				cutoff.setDate(cutoff.getDate() - 13);
				const cutoffKey = dayKeyOf(cutoff);
				return usage.days.filter((day) => day.date >= cutoffKey && day.date <= todayKey()).reverse();
			}, [usage]);

			const selectedEntry = selectedDay !== null ? dayMap.get(selectedDay) ?? null : null;
			const badgeCount = stats !== null ? fmtCompact(stats.dayTokens) : null;

			const retry = () => {
				loadUsage();
				loadProviders();
				if (selectedProvider !== null) loadAccount(selectedProvider, true);
			};

			const updatedLabel = refreshedAt === null ? "" : translate("panel.updatedAt", {
				time: new Date(refreshedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
			});

			return react_jsx_runtime.jsxs("div", {
				className: wide ? S.layer : `${S.layer} ${S.rail}`,
				children: [
					open && react_jsx_runtime.jsxs("section", {
						className: closing ? `${S.panel} ${S.panelClosing}` : S.panel,
						onAnimationEnd: handlePanelAnimationEnd,
						"data-usage-stats-panel": true,
						"aria-label": translate("panel.title"),
						children: [
							react_jsx_runtime.jsxs("header", {
								className: S.header,
								children: [
									react_jsx_runtime.jsxs("div", {
										className: S.headerLeft,
										children: [
											react_jsx_runtime.jsx(primitives.IconDataOutline16, { size: 16 }),
											react_jsx_runtime.jsx("span", { className: S.title, children: translate("panel.title") })
										]
									}),
									react_jsx_runtime.jsxs("div", {
										className: S.headerActions,
										children: [
											react_jsx_runtime.jsx(primitives.Tooltip, {
												label: translate("action.refresh"),
												side: "bottom",
												delayMs: 500,
												children: react_jsx_runtime.jsx("button", {
													type: "button",
													className: S.iconButton,
													"aria-label": translate("action.refresh"),
													onClick: retry,
													children: react_jsx_runtime.jsx(primitives.IconRefreshOutline14, { size: 14 })
												})
											}),
											react_jsx_runtime.jsx(primitives.Tooltip, {
												label: translate("action.close"),
												side: "bottom",
												delayMs: 500,
												children: react_jsx_runtime.jsx("button", {
													type: "button",
													className: S.iconButton,
													"aria-label": translate("action.close"),
													onClick: requestClose,
													children: react_jsx_runtime.jsx(primitives.IconCloseOutline16, { size: 14 })
												})
											})
										]
									})
								]
							}),
							react_jsx_runtime.jsxs("div", {
								className: S.body,
								children: [
									selectedEntry !== null ? react_jsx_runtime.jsx(DayDetail, {
										day: selectedEntry,
										translate,
										onBack: () => setSelectedDay(null)
									}) : react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
										children: [
											react_jsx_runtime.jsx("section", {
												className: S.section,
												children: react_jsx_runtime.jsx("h3", { className: S.sectionTitle, children: translate("account.title") })
											}),
											react_jsx_runtime.jsx(ProviderPicker, {
												providers: providerChoices,
												selectedProvider,
												onSelect: (id) => setSelectedProvider(id),
												translate
											}),
											selectedProviderInfo === null ? react_jsx_runtime.jsx("p", { className: S.note, children: translate("account.loading") }) : react_jsx_runtime.jsx("div", {
												className: S.accountGrid,
											children: react_jsx_runtime.jsx(ProviderAccountCard, {
												provider: selectedProviderInfo,
												account: account?.id === selectedProvider ? account : null,
												accountLoading,
												accountError,
												translate,
												onRetry: () => loadAccount(selectedProvider, true)
												}, selectedProviderInfo.id)
											}),
											react_jsx_runtime.jsx("section", {
												className: S.section,
												children: react_jsx_runtime.jsx("h3", { className: S.sectionTitle, children: translate("usage.title") })
											}),
											stats === null && usageError === null ? react_jsx_runtime.jsx("p", { className: S.note, children: translate("usage.loading") }) : null,
											usageError !== null ? react_jsx_runtime.jsxs("div", {
												className: S.error,
												children: [
													react_jsx_runtime.jsx("span", { children: translate("usage.error", { message: usageError }) }),
													react_jsx_runtime.jsx("button", {
														type: "button",
														className: S.retry,
														onClick: loadUsage,
														children: translate("action.retry")
													})
												]
											}) : null,
											stats !== null && react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
												children: [
													react_jsx_runtime.jsxs("div", {
														className: S.statsRow,
														children: [
															react_jsx_runtime.jsx("div", { className: S.stat, children: [react_jsx_runtime.jsx("span", { className: S.statValue, children: fmt(stats.dayTokens) }), react_jsx_runtime.jsx("span", { className: S.statLabel, children: translate("usage.today") })] }),
															react_jsx_runtime.jsx("div", { className: S.stat, children: [react_jsx_runtime.jsx("span", { className: S.statValue, children: fmt(stats.monthTokens) }), react_jsx_runtime.jsx("span", { className: S.statLabel, children: translate("usage.month") })] }),
															react_jsx_runtime.jsx("div", { className: S.stat, children: [react_jsx_runtime.jsx("span", { className: S.statValue, children: fmt(stats.total) }), react_jsx_runtime.jsx("span", { className: S.statLabel, children: translate("usage.total") })] })
														]
													}),
													react_jsx_runtime.jsx("p", {
														className: S.hitCaption,
														children: react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
															children: [
																translate("usage.hit.today"),
																": ",
																react_jsx_runtime.jsx("b", { children: fmtHit(stats.todayHit) })
															]
														})
													})
												]
											}),
											usage !== null && usageError === null && react_jsx_runtime.jsxs("section", {
												className: S.section,
												children: [
													react_jsx_runtime.jsxs("div", {
														className: S.heatHeader,
														children: [
															react_jsx_runtime.jsx("h3", { className: S.sectionTitle, children: translate("usage.heatmap") }),
															react_jsx_runtime.jsxs("div", {
																className: S.monthNav,
																children: [
																	react_jsx_runtime.jsxs("div", {
																		className: S.viewToggle,
																		children: [
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.viewButton,
																				"data-active": viewMode === "month" || undefined,
																				onClick: () => setViewMode("month"),
																				children: translate("action.viewMonth")
																			}),
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.viewButton,
																				"data-active": viewMode === "year" || undefined,
																				onClick: () => {
																					setViewYear(Number(viewMonth.slice(0, 4)));
																					setViewMode("year");
																				},
																				children: translate("action.viewYear")
																			})
																		]
																	}),
																	viewMode === "month" ? react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
																		children: [
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.navButton,
																				"aria-label": translate("action.prevMonth"),
																				onClick: () => setViewMonth((month) => shiftMonth(month, -1)),
																				children: react_jsx_runtime.jsx(primitives.IconChevronLeftOutline14, { size: 12 })
																			}),
																			react_jsx_runtime.jsx("span", { className: S.monthTitle, children: monthLabelOf(viewMonth, translate) }),
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.navButton,
																				"aria-label": translate("action.nextMonth"),
																				disabled: viewMonth >= currentMonthKey(),
																				onClick: () => setViewMonth((month) => shiftMonth(month, 1)),
																				children: react_jsx_runtime.jsx(primitives.IconChevronRightOutline14, { size: 12 })
																			}),
																			viewMonth !== currentMonthKey() && react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.todayButton,
																				onClick: () => setViewMonth(currentMonthKey()),
																				children: translate("action.today")
																			})
																		]
																	}) : react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
																		children: [
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.navButton,
																				"aria-label": translate("action.prevYear"),
																				onClick: () => setViewYear((year) => year - 1),
																				children: react_jsx_runtime.jsx(primitives.IconChevronLeftOutline14, { size: 12 })
																			}),
																			react_jsx_runtime.jsx("span", { className: S.monthTitle, children: translate("year.title", { year: viewYear }) }),
																			react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.navButton,
																				"aria-label": translate("action.nextYear"),
																				disabled: viewYear >= new Date().getFullYear(),
																				onClick: () => setViewYear((year) => year + 1),
																				children: react_jsx_runtime.jsx(primitives.IconChevronRightOutline14, { size: 12 })
																			}),
																			viewYear !== new Date().getFullYear() && react_jsx_runtime.jsx("button", {
																				type: "button",
																				className: S.todayButton,
																				onClick: () => setViewYear(new Date().getFullYear()),
																				children: translate("action.today")
																			})
																		]
																	})
																]
															})
														]
													}),
													viewMode === "month" ? react_jsx_runtime.jsx(MonthHeatmap, {
														heat,
														translate,
														selectedKey: selectedDay,
														onSelect: setSelectedDay
													}) : react_jsx_runtime.jsx(YearHeatmap, {
														yearHeat,
														viewYear,
														translate,
														onSelectMonth: (key) => {
															setViewMonth(key);
															setViewMode("month");
														}
													})
												]
											}),
											recent.length > 0 && react_jsx_runtime.jsxs("section", {
												className: S.section,
												children: [
													react_jsx_runtime.jsx("h3", { className: S.sectionTitle, children: translate("usage.recent") }),
													react_jsx_runtime.jsx("div", {
														className: S.days,
														children: recent.map((day) => {
															const maxRecent = Math.max(...recent.map((d) => d.tokens ?? 0), 1);
															return react_jsx_runtime.jsxs("button", {
																type: "button",
																className: S.day,
																onClick: () => setSelectedDay(day.date),
																children: [
																	react_jsx_runtime.jsx("span", { className: S.dayDate, children: dayLabel(day.date, translate) }),
																	react_jsx_runtime.jsx("span", { className: S.dayTokens, children: fmt(day.tokens ?? 0) }),
																	react_jsx_runtime.jsx("span", { className: S.dayHit, children: fmtHit(day.cacheHitRate) }),
																	react_jsx_runtime.jsx("div", {
																		className: S.dayBar,
																		style: { width: `${Math.max(4, Math.round(100 * (day.tokens ?? 0) / maxRecent))}%` }
																	})
																]
															}, day.date);
														})
													})
												]
											}),
											updatedLabel !== "" && react_jsx_runtime.jsx("p", { className: S.footerNote, children: updatedLabel })
										]
									})
								]
							})
						]
					}),
					react_jsx_runtime.jsx("div", {
						className: S.footerButtons,
						children: [
						react_jsx_runtime.jsxs("button", {
							type: "button",
							className: S.badge,
							"data-usage-stats-badge": true,
							"aria-label": translate("panel.badge"),
							"aria-expanded": open,
							onClick: toggleOpen,
							children: [
								react_jsx_runtime.jsx(primitives.IconDataOutline16, { size: wide ? 14 : 18 }),
								wide && react_jsx_runtime.jsx("span", { className: S.badgeLabel, children: "用量" })
							]
						}),
						react_jsx_runtime.jsxs("button", {
							type: "button",
							className: "skm-entry",
							"aria-label": "技能",
							"aria-expanded": skillsOpen,
							onClick: () => { setSkillsOpen(v => !v); },
							children: [
								react_jsx_runtime.jsx(SkillBookIcon, {}),
								wide && react_jsx_runtime.jsx("span", { className: "skm-label", children: "技能" })
							]
						}),
						],
					}),
					skillsOpen && react_jsx_runtime.jsx(skillPanelModule.SkillManagerPanel, {
						open: skillsOpen,
						onClose: () => { setSkillsOpen(false); },
						t: skillT,
						list: skillApi.list,
						createBundle: skillApi.createBundle,
						renameBundle: skillApi.renameBundle,
						deleteBundle: skillApi.deleteBundle,
						setBundleSkills: skillApi.setBundleSkills,
						deleteSkill: skillApi.deleteSkill,
						installSkill: skillApi.installSkill
					})
				]
			});
		}

		function providerMark(provider) {
			const known = {
				"deepseek-official": "DS",
				deepseek: "DS",
				"opencode-go": "GO",
				openrouter: "OR",
				moonshotai: "K",
				"moonshotai-cn": "K",
				kimi: "K",
				"kimi-coding": "K",
				zai: "Z",
				"zai-coding-cn": "Z"
			};
			return known[provider.id] ?? String(provider.displayName ?? provider.id).replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
		}

		/** Balance-mode body rendered inside the shared provider account frame. */
		function BalanceContent({ balance, state, message, translate, onRetry }) {
			if (state === "loading" || balance === null && state === "ok") return react_jsx_runtime.jsx("p", { className: S.quotaEmpty, children: translate("balance.loading") });
			if (state === "unsupported") return react_jsx_runtime.jsx("p", { className: S.quotaEmpty, children: translate("balance.unsupported") });
			if (state === "no-credential") return react_jsx_runtime.jsx("p", { className: S.quotaEmpty, children: translate("balance.noCredential", { ref: message ?? "" }) });
			if (state === "error") return react_jsx_runtime.jsxs("div", {
				className: S.error,
				children: [
					react_jsx_runtime.jsx("span", { children: translate("balance.error", { message: message ?? "" }) }),
					react_jsx_runtime.jsx("button", { type: "button", className: S.retry, onClick: onRetry, children: translate("action.retry") })
				]
			});
			return react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
				children: [
					react_jsx_runtime.jsxs("div", {
						className: S.balanceMain,
						children: [
							react_jsx_runtime.jsx("span", { className: S.balanceAmount, children: balance.unlimited ? "∞" : fmtCurrency(balance.remaining, balance.currency) }),
							react_jsx_runtime.jsx("span", { className: S.accountPlan, children: translate("balance.remaining") })
						]
					}),
					react_jsx_runtime.jsx("div", {
						className: S.balanceRows,
						children: [
							{ value: balance.used, label: translate("balance.used") },
							{ value: balance.total, label: translate("balance.total") },
							{ value: balance.breakdown?.toppedUp, label: translate("balance.toppedUp") },
							{ value: balance.breakdown?.granted, label: translate("balance.granted") }
						].filter((row) => row.value !== null && row.value !== void 0).map((row, index) => react_jsx_runtime.jsxs("div", {
							className: S.balanceRow,
							children: [
								react_jsx_runtime.jsx("span", { children: row.label }),
								react_jsx_runtime.jsx("span", { children: fmtCurrency(row.value, balance.currency) })
							]
						}, `${row.label}-${index}`))
					})
				]
			});
		}

		/** Provider selector shared by monetary and subscription account modes. */
		function ProviderPicker({ providers, selectedProvider, onSelect, translate }) {
			if (providers.length === 0) return null;
			return react_jsx_runtime.jsxs("label", {
				className: S.providerPicker,
				children: [
					react_jsx_runtime.jsx("span", { className: S.providerPickerLabel, children: translate("account.provider") }),
					react_jsx_runtime.jsx("select", {
						className: S.providerSelect,
						value: selectedProvider ?? "",
						"aria-label": translate("account.provider"),
						onChange: (event) => onSelect(event.target.value),
						children: providers.map((provider) => react_jsx_runtime.jsx("option", {
							value: provider.id,
							children: provider.displayName
						}, provider.id))
					})
				]
			});
		}

		function subscriptionStatusLabel(status, translate) {
			if (status === "ok") return translate("subscription.status.ok");
			if (status === "not-configured") return translate("subscription.status.notConfigured");
			if (status === "unauthorized") return translate("subscription.status.unauthorized");
			if (status === "rate-limited") return translate("subscription.status.rateLimited");
			if (status === "invalid-response") return translate("account.status.invalidResponse");
			if (status === "unsupported") return translate("account.status.unsupported");
			return translate("subscription.status.unavailable");
		}

		function quotaLabel(kind, translate) {
			if (kind === "session") return translate("subscription.window.session");
			if (kind === "daily") return translate("subscription.window.daily");
			if (kind === "weekly") return translate("subscription.window.weekly");
			if (kind === "monthly") return translate("subscription.window.monthly");
			if (kind === "quota") return translate("subscription.window.quota");
			if (kind === "billing") return translate("subscription.window.mcp");
			return kind;
		}

		function resetLabel(resetsAt, translate) {
			if (typeof resetsAt !== "string") return "";
			const date = new Date(resetsAt);
			if (Number.isNaN(date.getTime())) return "";
			return translate("subscription.resets", {
				time: date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
			});
		}

		/** Percentage-window body rendered inside the shared provider account frame. */
		function SubscriptionContent({ provider, translate }) {
			const windows = Array.isArray(provider.windows) ? provider.windows : [];
			const status = typeof provider.status === "string" ? provider.status : "unavailable";
			const emptyMessage = status === "not-configured"
				? translate("subscription.notConfigured", { refs: Array.isArray(provider.missingCredentials) ? provider.missingCredentials.join(" + ") : "" })
				: status === "unauthorized" ? translate("subscription.unauthorized")
					: status === "rate-limited" ? translate("subscription.rateLimited")
						: status === "invalid-response" ? translate("account.invalidResponse")
							: status === "unsupported" ? translate("balance.unsupported")
								: translate("subscription.unavailable");
			return (status === "ok" || provider.stale === true) && windows.length > 0 ? react_jsx_runtime.jsx("div", {
						className: S.quotaList,
						children: windows.map((window) => {
							const used = Math.max(0, Math.min(100, Number(window.usedPercent) || 0));
							return react_jsx_runtime.jsxs("div", {
								className: S.quotaRow,
								children: [
									react_jsx_runtime.jsxs("div", {
										className: S.quotaMeta,
										children: [
											react_jsx_runtime.jsx("span", { className: S.quotaLabel, children: quotaLabel(window.kind, translate) }),
											react_jsx_runtime.jsx("span", { className: S.quotaReset, children: resetLabel(window.resetsAt, translate) }),
											react_jsx_runtime.jsx("span", { className: S.quotaValue, children: translate("subscription.used", { value: used.toFixed(used % 1 === 0 ? 0 : 1) }) })
										]
									}),
									react_jsx_runtime.jsx("div", {
										className: S.quotaTrack,
										role: "progressbar",
										"aria-label": quotaLabel(window.kind, translate),
										"aria-valuemin": 0,
										"aria-valuemax": 100,
										"aria-valuenow": used,
										children: react_jsx_runtime.jsx("div", { className: S.quotaFill, style: { width: `${used}%` } })
									})
								]
							}, window.kind);
						})
					}) : react_jsx_runtime.jsx("p", { className: S.quotaEmpty, children: emptyMessage });
		}

		/**
		 * The single account-card interface. Provider identity/colour/status live
		 * in the shared frame; only the inner balance/quota data varies by mode.
		 */
		function ProviderAccountCard({ provider, account, accountLoading, accountError, translate, onRetry }) {
			const mode = account?.mode ?? provider.accountMode ?? "balance";
			const subscriptionMode = mode === "subscription";
			const status = accountLoading && account === null ? "loading" : account?.status ?? "unavailable";
			const statusText = status === "loading" ? translate("account.status.loading")
				: status === "unsupported" ? translate("account.status.unsupported")
					: subscriptionStatusLabel(status, translate);
			const subtitle = account?.plan ?? (subscriptionMode ? translate("subscription.planUnknown") : translate("account.balanceMode"));
			const balanceState = accountLoading && account === null ? "loading"
				: accountError !== null ? "error"
					: status === "not-configured" ? "no-credential"
						: status === "unsupported" ? "unsupported"
							: account?.balance !== null && account?.balance !== void 0 ? "ok" : "error";
			const balanceMessage = accountError ?? account?.missingCredentials?.[0] ?? status;
			return react_jsx_runtime.jsxs("article", {
				className: S.accountCard,
				"data-provider": provider.id,
				"data-account-mode": mode,
				children: [
					react_jsx_runtime.jsxs("div", {
						className: S.accountHead,
						children: [
							react_jsx_runtime.jsx("span", { className: S.accountMark, "aria-hidden": true, children: providerMark(provider) }),
							react_jsx_runtime.jsxs("span", {
								className: S.accountIdentity,
								children: [
									react_jsx_runtime.jsx("span", { className: S.accountName, children: provider.displayName }),
									react_jsx_runtime.jsx("span", { className: S.accountPlan, children: subtitle })
								]
							}),
							react_jsx_runtime.jsx("span", { className: S.accountStatus, "data-status": status, children: statusText })
						]
					}),
					subscriptionMode
						? accountError !== null ? react_jsx_runtime.jsxs("div", {
							className: S.error,
							children: [
								react_jsx_runtime.jsx("span", { children: translate("subscription.error", { message: accountError }) }),
								react_jsx_runtime.jsx("button", { type: "button", className: S.retry, onClick: onRetry, children: translate("action.retry") })
							]
						}) : accountLoading && account === null
							? react_jsx_runtime.jsx("p", { className: S.quotaEmpty, children: translate("subscription.loading") })
							: react_jsx_runtime.jsx(SubscriptionContent, { provider: account ?? { status: "unavailable", windows: [] }, translate })
						: react_jsx_runtime.jsx(BalanceContent, { balance: account?.balance ?? null, state: balanceState, message: balanceMessage, translate, onRetry })
				]
			});
		}

		/**
		 * One day's per-model breakdown. `day` is the wire day entry carrying
		 * `tokens`, `cacheHitRate`, and `models` (descending by tokens).
		 */
		function DayDetail({ day, translate, onBack }) {
			const models = Array.isArray(day.models) ? day.models : [];
			const totalTokens = day.tokens ?? 0;
			return react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
				children: [
					react_jsx_runtime.jsxs("div", {
						className: S.detailHeader,
						children: [
							react_jsx_runtime.jsx("button", {
								type: "button",
								className: S.back,
								"aria-label": translate("usage.back"),
								onClick: onBack,
								children: react_jsx_runtime.jsx(primitives.IconChevronLeftOutline14, { size: 14 })
							}),
							react_jsx_runtime.jsx("span", { className: S.detailDate, children: dayLabel(day.date, translate) }),
							react_jsx_runtime.jsx("span", { className: S.detailHit, children: `${translate("usage.hitRate")} ${fmtHit(day.cacheHitRate)}` })
						]
					}),
					react_jsx_runtime.jsx("p", {
						className: S.detailSummary,
						children: `${translate("usage.total")} ${fmt(totalTokens)} · ${translate("usage.input")} ${fmt(day.inputTokens ?? 0)} · ${translate("usage.output")} ${fmt(day.outputTokens ?? 0)} · ${translate("usage.cacheRead")} ${fmt(day.cacheReadTokens ?? 0)}`
					}),
					react_jsx_runtime.jsx("div", {
						className: S.days,
						children: models.length === 0 ? react_jsx_runtime.jsx("p", { className: S.note, children: translate("usage.noModels") }) : models.map((model) => {
							const share = totalTokens > 0 ? Math.max(3, Math.round(100 * (model.tokens ?? 0) / totalTokens)) : 0;
							return react_jsx_runtime.jsxs("div", {
								className: S.modelRow,
								children: [
									react_jsx_runtime.jsxs("div", {
										className: S.modelHead,
										children: [
											react_jsx_runtime.jsx("span", { className: S.modelName, title: model.model, children: modelLabelOf(model.model, translate) }),
											react_jsx_runtime.jsx("span", { className: S.modelTokens, children: fmt(model.tokens ?? 0) }),
											react_jsx_runtime.jsx("span", { className: S.modelHit, children: fmtHit(model.cacheHitRate) })
										]
									}),
									react_jsx_runtime.jsx("div", {
										className: S.modelBarTrack,
										children: react_jsx_runtime.jsx("div", { className: S.modelBar, style: { width: `${share}%` } })
									}),
									react_jsx_runtime.jsx("div", {
										className: S.modelMeta,
										children: `${translate("usage.input")} ${fmt(model.inputTokens ?? 0)} · ${translate("usage.output")} ${fmt(model.outputTokens ?? 0)} · ${translate("usage.cacheRead")} ${fmt(model.cacheReadTokens ?? 0)}`
									})
								]
							}, model.model);
						})
					})
				]
			});
		}

		/**
		 * Codex-style blue calendar heatmap for one month: weekday header row,
		 * weeks as rows (Mon-first), padded with placeholders. Cells are buttons
		 * that select a day.
		 */
		function MonthHeatmap({ heat, translate, selectedKey, onSelect }) {
			const select = typeof onSelect === "function" ? onSelect : () => {};
			const weekdayLabels = [
				translate("weekday.mon"),
				translate("weekday.tue"),
				translate("weekday.wed"),
				translate("weekday.thu"),
				translate("weekday.fri"),
				translate("weekday.sat"),
				translate("weekday.sun")
			];
			return react_jsx_runtime.jsxs("div", {
				className: S.heat,
				children: [
					react_jsx_runtime.jsxs("div", {
						className: S.monthGrid,
						children: [
							react_jsx_runtime.jsx("div", {
								className: S.weekHeader,
								children: weekdayLabels.map((label) => react_jsx_runtime.jsx("span", { className: S.weekLabel, children: label }, label))
							}),
							heat.weeks.map((week, weekIndex) => react_jsx_runtime.jsx("div", {
								className: S.heatRow,
								children: week.map((cell, dayIndex) => {
									if (cell === null) return react_jsx_runtime.jsx("span", { className: S.emptyCell, "aria-hidden": true }, `${weekIndex}-${dayIndex}`);
									const style = cellColor(cell.tokens, heat.max);
									const hit = cell.hitRate === null || cell.hitRate === void 0 ? "" : ` · ${translate("usage.hitRate")} ${cell.hitRate}%`;
									const isToday = cell.key === todayKey();
									return react_jsx_runtime.jsx("button", {
										type: "button",
										className: `${S.cell}${isToday ? ` ${S.cellToday}` : ""}${selectedKey === cell.key ? ` ${S.cellSelected}` : ""}`,
										style: { background: style.background, color: style.color },
										title: `${cell.key} · ${fmt(cell.tokens)} tokens${hit}`,
										"aria-label": `${cell.key} · ${fmt(cell.tokens)} tokens`,
										onClick: () => select(cell.key),
										children: react_jsx_runtime.jsx("span", { className: S.cellDay, children: cell.day })
									}, cell.key);
								})
							}, weekIndex))
						]
					}),
					react_jsx_runtime.jsxs("div", {
						className: S.legend,
						children: [
							react_jsx_runtime.jsx("span", { children: translate("usage.legendLess") }),
							[0.22, 0.42, 0.6, 0.8, 1].map((alpha, index) => react_jsx_runtime.jsx("span", {
								className: S.legendSwatch,
								style: { background: `rgba(${BLUE_RGB[0]}, ${BLUE_RGB[1]}, ${BLUE_RGB[2]}, ${alpha})` }
							}, index)),
							react_jsx_runtime.jsx("span", { children: translate("usage.legendMore") })
						]
					})
				]
			});
		}

		/**
		 * Year overview: one cell per month, colored by that month's total
		 * tokens against the year's busiest month, with a year-total summary
		 * line on top. Clicking a cell drills into that month's calendar view.
		 */
		function YearHeatmap({ yearHeat, viewYear, translate, onSelectMonth }) {
			const select = typeof onSelectMonth === "function" ? onSelectMonth : () => {};
			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth();
			const names = translate("month.names").split(",");
			const yearTotal = yearHeat.months.reduce((sum, entry) => sum + entry.tokens, 0);
			return react_jsx_runtime.jsxs("div", {
				className: S.heat,
				children: [
					react_jsx_runtime.jsxs("div", {
						className: S.yearSummary,
						children: [
							react_jsx_runtime.jsx("span", { className: S.yearSummaryLabel, children: translate("usage.yearTotal") }),
							react_jsx_runtime.jsx("span", { className: S.yearSummaryValue, children: fmt(yearTotal) })
						]
					}),
					react_jsx_runtime.jsx("div", {
						className: S.yearGrid,
						children: yearHeat.months.map((entry) => {
							const isCurrent = viewYear === currentYear && entry.month === currentMonth;
							const isFuture = viewYear === currentYear && entry.month > currentMonth;
							const style = cellColor(entry.tokens, yearHeat.max);
							return react_jsx_runtime.jsx("button", {
								type: "button",
								className: S.yearCell,
								"data-current": isCurrent || undefined,
								disabled: isFuture,
								style: { background: style.background, color: style.color },
								title: `${viewYear} ${names[entry.month]} · ${fmt(entry.tokens)} tokens`,
								"aria-label": `${viewYear} ${names[entry.month]} · ${fmt(entry.tokens)} tokens`,
								onClick: () => select(`${viewYear}-${String(entry.month + 1).padStart(2, "0")}`),
								children: [
									react_jsx_runtime.jsx("span", { className: S.yearName, children: names[entry.month] }),
									react_jsx_runtime.jsx("span", { className: S.yearTokens, children: fmtCompact(entry.tokens) })
								]
							}, entry.month);
						})
					})
				]
			});
		}

		/** `YYYY-MM-DD` → `MM-DD 周X` display label. */
		function dayLabel(key, translate) {
			const [, month, day] = key.split("-");
			const date = new Date(Number(key.slice(0, 4)), Number(month) - 1, Number(day));
			const weekdays = [translate("weekday.sun"), translate("weekday.mon"), translate("weekday.tue"), translate("weekday.wed"), translate("weekday.thu"), translate("weekday.fri"), translate("weekday.sat")];
			return `${month}-${day} ${weekdays[date.getDay()]}`;
		}

		function monthName(month, translate) {
			const names = translate("month.names").split(",");
			return names[month] ?? String(month + 1);
		}

		/**
		 * Display label for a `provider/model` attribution key (the same model
		 * served by different providers must stay distinguishable).
		 */
		function modelLabelOf(key, translate) {
			if (typeof key !== "string") return "";
			const slash = key.indexOf("/");
			if (slash === -1) return key;
			const provider = key.slice(0, slash);
			const model = key.slice(slash + 1);
			const providerLabel = provider === "unknown" ? translate("usage.unknownModel") : provider;
			const modelLabel = model === "unknown" || model === "" ? translate("usage.unknownModel") : model;
			return `${providerLabel} · ${modelLabel}`;
		}
		//#endregion

		//#region locales
		/** `usageStats` namespace dictionaries (the zh key set is the source of truth). */
		const NS = "usageStats";
		const zh = {
			"panel.title": "用量与余额",
			"panel.badge": "用量/余额",
			"account.title": "供应商账户",
			"account.provider": "当前供应商",
			"account.balanceMode": "API 余额",
			"account.loading": "正在加载供应商…",
			"account.status.loading": "查询中",
			"account.status.unsupported": "不支持余额",
			"account.status.invalidResponse": "响应异常",
			"account.invalidResponse": "供应商返回了无法识别的额度数据。",
			"balance.title": "账户余额",
			"balance.provider": "供应商",
			"balance.noSchemeTag": "无余额接口",
			"balance.unsupported": "该供应商没有公开的余额查询接口。",
			"balance.total": "总余额",
			"balance.remaining": "可用余额",
			"balance.used": "已使用",
			"balance.toppedUp": "充值余额",
			"balance.granted": "赠送余额",
			"balance.available": "可用",
			"balance.unavailable": "不可用",
			"balance.loading": "正在查询余额…",
			"balance.noCredential": "未配置 {ref}（请编辑 ~/.dsh/.credentials.yaml）",
			"balance.error": "余额获取失败：{message}",
			"subscription.title": "订阅额度",
			"subscription.loading": "正在查询订阅额度…",
			"subscription.error": "订阅额度获取失败：{message}",
			"subscription.status.ok": "实时",
			"subscription.status.notConfigured": "未配置",
			"subscription.status.unauthorized": "需重新登录",
			"subscription.status.rateLimited": "请求受限",
			"subscription.status.unavailable": "暂不可用",
			"subscription.window.session": "5 小时窗口",
			"subscription.window.daily": "每日窗口",
			"subscription.window.weekly": "每周窗口",
			"subscription.window.monthly": "每月窗口",
			"subscription.window.quota": "总额度",
			"subscription.window.mcp": "MCP 月度额度",
			"subscription.used": "已用 {value}%",
			"subscription.resets": "{time} 重置",
			"subscription.notConfigured": "配置 {refs} 后显示真实订阅比例。",
			"subscription.unauthorized": "凭据已失效，请更新后重试。",
			"subscription.rateLimited": "供应商暂时限制查询，请稍后重试。",
			"subscription.unavailable": "供应商没有返回可识别的额度窗口。",
			"subscription.planUnknown": "订阅计划",
			"usage.title": "Token 用量",
			"usage.today": "今日",
			"usage.month": "本月",
			"usage.total": "累计",
			"usage.loading": "正在统计用量…",
			"usage.error": "用量统计失败：{message}",
			"usage.heatmap": "当月每日用量",
			"usage.recent": "最近 14 天",
			"usage.legendLess": "少",
			"usage.legendMore": "多",
			"usage.back": "返回",
			"usage.hitRate": "缓存命中",
			"usage.hit.today": "今日缓存命中率",
			"usage.input": "输入",
			"usage.output": "输出",
			"usage.cacheRead": "缓存读",
			"usage.unknownModel": "未知模型",
			"usage.noModels": "这一天没有分模型数据。",
			"usage.yearTotal": "年总量",
			"month.year": "{year}年{month}",
			"year.title": "{year}年",
			"action.viewMonth": "月",
			"action.viewYear": "年",
			"action.prevYear": "上一年",
			"action.nextYear": "下一年",
			"action.refresh": "刷新",
			"action.retry": "重试",
			"action.close": "关闭",
			"action.prevMonth": "上个月",
			"action.nextMonth": "下个月",
			"action.today": "回到今天",
			"panel.updatedAt": "更新于 {time}",
			"weekday.mon": "一",
			"weekday.tue": "二",
			"weekday.wed": "三",
			"weekday.thu": "四",
			"weekday.fri": "五",
			"weekday.sat": "六",
			"weekday.sun": "日",
			"month.names": "1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月"
		};
		const en = {
			"panel.title": "Usage & Balance",
			"panel.badge": "Usage/Balance",
			"account.title": "Provider account",
			"account.provider": "Current provider",
			"account.balanceMode": "API balance",
			"account.loading": "Loading providers…",
			"account.status.loading": "Loading",
			"account.status.unsupported": "Balance unsupported",
			"account.status.invalidResponse": "Invalid response",
			"account.invalidResponse": "The provider returned unrecognized quota data.",
			"balance.title": "Account balance",
			"balance.provider": "Provider",
			"balance.noSchemeTag": "no balance API",
			"balance.unsupported": "This provider has no public balance interface.",
			"balance.total": "Total balance",
			"balance.remaining": "Available balance",
			"balance.used": "Used",
			"balance.toppedUp": "Topped up",
			"balance.granted": "Granted",
			"balance.available": "available",
			"balance.unavailable": "unavailable",
			"balance.loading": "Fetching balance…",
			"balance.noCredential": "{ref} is not configured (edit ~/.dsh/.credentials.yaml)",
			"balance.error": "Balance fetch failed: {message}",
			"subscription.title": "Subscription usage",
			"subscription.loading": "Fetching subscription usage…",
			"subscription.error": "Subscription usage failed: {message}",
			"subscription.status.ok": "Live",
			"subscription.status.notConfigured": "Not configured",
			"subscription.status.unauthorized": "Sign in again",
			"subscription.status.rateLimited": "Rate limited",
			"subscription.status.unavailable": "Unavailable",
			"subscription.window.session": "5-hour window",
			"subscription.window.daily": "Daily window",
			"subscription.window.weekly": "Weekly window",
			"subscription.window.monthly": "Monthly window",
			"subscription.window.quota": "Total quota",
			"subscription.window.mcp": "Monthly MCP quota",
			"subscription.used": "{value}% used",
			"subscription.resets": "Resets {time}",
			"subscription.notConfigured": "Configure {refs} to show live subscription usage.",
			"subscription.unauthorized": "The credential has expired; update it and retry.",
			"subscription.rateLimited": "The provider is rate limiting checks; retry later.",
			"subscription.unavailable": "The provider returned no recognizable quota windows.",
			"subscription.planUnknown": "Subscription plan",
			"usage.title": "Token usage",
			"usage.today": "Today",
			"usage.month": "This month",
			"usage.total": "All time",
			"usage.loading": "Aggregating usage…",
			"usage.error": "Usage aggregation failed: {message}",
			"usage.heatmap": "Daily usage this month",
			"usage.recent": "Last 14 days",
			"usage.legendLess": "Less",
			"usage.legendMore": "More",
			"usage.back": "Back",
			"usage.hitRate": "Cache hit",
			"usage.hit.today": "Today's cache hit rate",
			"usage.input": "Input",
			"usage.output": "Output",
			"usage.cacheRead": "Cache read",
			"usage.unknownModel": "Unknown model",
			"usage.noModels": "No per-model data for this day.",
			"usage.yearTotal": "Year total",
			"month.year": "{month} {year}",
			"year.title": "{year}",
			"action.viewMonth": "Month",
			"action.viewYear": "Year",
			"action.prevYear": "Previous year",
			"action.nextYear": "Next year",
			"action.refresh": "Refresh",
			"action.retry": "Retry",
			"action.close": "Close",
			"action.prevMonth": "Previous month",
			"action.nextMonth": "Next month",
			"action.today": "Today",
			"panel.updatedAt": "Updated at {time}",
			"weekday.mon": "M",
			"weekday.tue": "T",
			"weekday.wed": "W",
			"weekday.thu": "T",
			"weekday.fri": "F",
			"weekday.sat": "S",
			"weekday.sun": "S",
			"month.names": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec"
		};
		//#endregion

		//#region plugin body
		//#region skills support (merged from dsh-skill-manager)
		const SKILL_ZH = {
			entry: "技能", panelTitle: "技能管理", close: "关闭", loading: "正在读取技能…",
			error: "暂时无法读取技能。", retry: "重试",
			uploadHint: "拖入技能文件夹安装，或点击选择", uploadMeta: "{n} 个文件 · {folder}",
			fileCount: "{n} 文件", expandSkillFiles: "展开技能文件", previewLoading: "正在加载内容…", viewSkillFiles: "查看技能文件", viewerNav: "技能文件", assignToBundle: "归入 Bundle", assignTitle: "将「{name}」归入", assignEmpty: "还没有技能包,先点「新建 Bundle」创建一个。", deleteSkillBtn: "删除技能",
			installName: "技能名称", installNamePlaceholder: "例如 my-skill", installDescription: "描述（可选）",
			installNameFromArchive: "技能名取自压缩包内的 SKILL.md",
			installNameInvalid: "技能名只能包含小写字母、数字和连字符（a-z 0-9 -）",
			installBundle: "归入 Bundle", installLoose: "不归组（散装）", installConfirm: "安装", installCancel: "取消",
			bundlesTitle: "技能包", bundlesEmpty: "还没有技能包，点「新建 Bundle」创建一个。",
			bundleNoSkills: "还没有技能，可上传或从散装技能中归入。",
			newBundle: "新建 Bundle", newBundlePlaceholder: "Bundle 名称", create: "创建", cancel: "取消",
			renameBundlePlaceholder: "新的 Bundle 名称", rename: "重命名", delete: "删除",
			skillsCount: "{n} 个技能", removeSkill: "移出",
			looseTitle: "散装技能", looseEmpty: "没有散装 Skill",
			deleteBundleConfirm: "删除 Bundle「{name}」？其中的技能将变为散装。",
			deleteSkillConfirm: "删除技能「{name}」？此操作会删除它的文件。"
		};
		function skillT(key, params) {
			let text = SKILL_ZH[key] ?? key;
			if (params) for (const k of Object.keys(params)) text = text.split("{" + k + "}").join(String(params[k]));
			return text;
		}
		const SKILL_API_BASE = "/api/skill-manager";
		async function skillRequest(path, options) {
			const response = await fetch(SKILL_API_BASE + path, options);
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body.error || "request failed (" + String(response.status) + ")");
			return body;
		}
		const skillApi = {
			list: () => skillRequest("/list", { headers: { accept: "application/json" } }),
			createBundle: (name) => skillRequest("/bundles", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ name }) }),
			renameBundle: (bundleId, name) => skillRequest("/bundles/" + encodeURIComponent(bundleId), { method: "PATCH", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ name }) }),
			deleteBundle: (bundleId) => skillRequest("/bundles/" + encodeURIComponent(bundleId), { method: "DELETE", headers: { accept: "application/json" } }),
			setBundleSkills: (bundleId, skillNames) => skillRequest("/bundles/" + encodeURIComponent(bundleId) + "/skills", { method: "PUT", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ skillNames }) }),
			deleteSkill: (name) => skillRequest("/skills/" + encodeURIComponent(name), { method: "DELETE", headers: { accept: "application/json" } }),
			installSkill: (input) => skillRequest("/skills", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(input) })
		};
		function SkillBookIcon() {
			return react_jsx_runtime.jsx("svg", {
				viewBox: "0 0 16 16", width: "14", height: "14", fill: "currentColor", "aria-hidden": true,
				children: [
					react_jsx_runtime.jsx("path", { d: "M2.2 3.2c1.6 0 3.1.4 4.3 1.1v8c-1.2-.7-2.7-1.1-4.3-1.1v-8z" }),
					react_jsx_runtime.jsx("path", { d: "M13.8 3.2c-1.6 0-3.1.4-4.3 1.1v8c1.2-.7 2.7-1.1 4.3-1.1v-8z" }),
					react_jsx_runtime.jsx("path", { d: "M7.7 4.5c.2-.1.4-.2.6-.2s.4.1.6.2v7.7c-.2-.1-.4-.2-.6-.2s-.4.1-.6.2V4.5z", opacity: ".45" })
				]
			});
		}
		//#endregion

		/** Services required by the client plugin body. */
		const inject = ["slots", "locale"];

		/**
		 * Client plugin body: register the dictionaries and the sidebar footer action.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "usage-stats: dictionaries");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "usage-stats",
				locale: NS,
				order: 10
			}, UsageStatsPanel));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.UsageStatsPanel = UsageStatsPanel;
		exports.DayDetail = DayDetail;
		exports.ProviderAccountCard = ProviderAccountCard;
		exports.MonthHeatmap = MonthHeatmap;
		exports.YearHeatmap = YearHeatmap;
		exports.buildMonthHeatmap = buildMonthHeatmap;
		exports.cellColor = cellColor;
		exports.createLoader = createLoader;
		exports.buildProviderChoices = buildProviderChoices;
		exports.modelLabelOf = modelLabelOf;
		exports.fmt = fmt;
		exports.fmtCurrency = fmtCurrency;
		return module.exports;
	}
});

