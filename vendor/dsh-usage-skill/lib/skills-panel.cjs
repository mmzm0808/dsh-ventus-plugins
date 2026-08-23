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
  skillRow: "skm-skill-row",
  skillLabel: "skm-skill-label",
  skillName: "skm-skill-name",
  skillDescription: "skm-skill-desc",
  looseEmpty: "skm-loose-empty",
  visuallyHidden: "skm-visually-hidden"
};
var STYLE_ID = "dsh-skill-manager-styles";
var SHEET = `
.skm-entry{flex:1 1 50%;min-width:0;display:inline-flex;align-items:center;gap:8px;height:32px;box-sizing:border-box;border:none;border-radius:10px;padding:0 8px;background:transparent;cursor:pointer;color:var(--dsw-alias-label-primary,#eee);font-family:inherit;font-size:14px;line-height:20px;overflow:hidden}
.skm-entry:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-entry[aria-expanded='true']{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#eee)}
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
.skm-skill-row{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:8px}
.skm-skill-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.skm-skill-label{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.skm-skill-name{font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary,#eee);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skm-skill-desc{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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
    const rootName = collected[0]?.path.split("/")[0] ?? "";
    setInstallName(rootName);
    setInstallError(null);
    setInstall({ files: collected, folderName: rootName });
  };
  const confirmInstall = async (event) => {
    event.preventDefault();
    if (install === null || installing || installName.trim() === "") return;
    setInstalling(true);
    setInstallError(null);
    try {
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
        placeholder: t("installNamePlaceholder"),
        "aria-label": t("installName"),
        disabled: installing,
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
    )), /* @__PURE__ */ React.createElement("span", { className: css.installMeta }, t("uploadMeta", { n: install.files.length, folder: install.folderName }))), /* @__PURE__ */ React.createElement("div", { className: css.installActions }, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", type: "submit", disabled: installing || installName.trim() === "" }, t("installConfirm")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "outline", type: "button", disabled: installing, onClick: () => {
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
      )))), open2 && /* @__PURE__ */ React.createElement("ul", { className: css.skillList }, bundle.skills.length === 0 ? /* @__PURE__ */ React.createElement("li", { className: css.status }, t("bundleNoSkills")) : bundle.skills.map((skill) => /* @__PURE__ */ React.createElement("li", { className: css.skillRow, key: skill.name }, /* @__PURE__ */ React.createElement("span", { className: css.skillLabel, title: skill.description }, /* @__PURE__ */ React.createElement("span", { className: css.skillName }, skill.name), skill.description !== "" && /* @__PURE__ */ React.createElement("span", { className: css.skillDescription }, skill.description)), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Tooltip, { label: t("removeSkill"), side: "bottom", delayMs: 500 }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: css.iconAction,
          "aria-label": t("removeSkill"),
          onClick: () => {
            void removeFromBundle(bundle.id, skill.name);
          }
        },
        /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 })
      ))))));
    })), /* @__PURE__ */ React.createElement("h3", { className: css.sectionTitle }, t("looseTitle")), loose.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: css.looseEmpty }, t("looseEmpty")) : /* @__PURE__ */ React.createElement("ul", { className: css.skillList }, loose.map((skill) => /* @__PURE__ */ React.createElement("li", { className: css.skillRow, key: skill.name }, /* @__PURE__ */ React.createElement("span", { className: css.skillLabel, title: skill.description }, /* @__PURE__ */ React.createElement("span", { className: css.skillName }, skill.name), skill.description !== "" && /* @__PURE__ */ React.createElement("span", { className: css.skillDescription }, skill.description))))))),
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
    )
  );
}
