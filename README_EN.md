# 🚀 dsh-ventus-plugins

[English](README_EN.md) | 中文

## Ventus Plugin Family — One Integrated Plugin

**11 self-installed DSH plugins integrated into ONE plugin**, with functionality
and settings identical to the multi-plugin era. The plugin list shows a single
entry; the sidebar, floating ball, theme, search, desktop pet, skills, and usage
stats are all preserved.

> **Why integrate**: the plugin list keeps growing and every upgrade means
> syncing each plugin individually. After integration:
> - The plugin management panel shows only `dsh-ventus-plugins`;
> - All sub-plugins share one lifecycle (host aggregate mount + single client bundle);
> - Upgrading means replacing one package.

<p align="center">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="version" src="https://img.shields.io/badge/version-v0.2.0-blueviolet">
  <img alt="plugins" src="https://img.shields.io/badge/plugins-11%20in%201-4d6bfe">
  <img alt="runtime" src="https://img.shields.io/badge/runtime-dsh%20web-4d6bfe">
</p>

## ✨ Feature Overview

<table>
  <thead>
    <tr><th style="width:24%">Category</th><th style="width:22%">Sub-plugin</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td>🎨 Theme</td><td><code>dsh-theme-endfield</code></td><td>Arknights: Endfield industrial editorial theme: cream paper, ink text, signal-yellow accents, zero radius. Contour background, ENDFIELD watermark, glass/solid sidebar surface (dropdown in theme settings), docked hero (toggleable)</td></tr>
    <tr><td>📊 Usage</td><td><code>dsh-deepseek-usage</code></td><td>Floating ball: live balance, today's R0 multiplier, model hit-rate badge; panel: cumulative/today spend, requests, tokens, per-model usage, trends, login/logout, screenshot</td></tr>
    <tr><td>📈 Usage & skills</td><td><code>dsh-usage-skill</code></td><td>Token usage heatmaps (day/month/year), multi-provider balance cards, skill bundle manager (**sidebar entry disabled per user request**; components and dictionaries kept)</td></tr>
    <tr><td>📁 Right rail</td><td><code>dsh-better-sidebar</code></td><td>VSCode-like right sidebar: file tree / editor (CodeMirror multi-language) / terminal / git / browser, per-session isolation; editor footer info bar (total + selected chars)</td></tr>
    <tr><td>🔍 Search</td><td><code>dsh-ventus-search</code></td><td>Bing / 360 / Bilibili multi-engine search + Readability content fetch, registered as DSH search provider with settings card</td></tr>
    <tr><td>🐋 Desktop pet</td><td><code>dsh-ventus-whale</code></td><td>Interactive 3D orca pet overlay: drag / rotate / context menu; size, sensitivity, text configurable</td></tr>
    <tr><td>📶 Subagent progress</td><td><code>dsh-ventus-progress</code></td><td>Parses `progress-json` progress models from subagents; hover subagent entries to see staged progress bars; ships a skill that teaches the model to emit progress models</td></tr>
    <tr><td>🛠️ Toolchain</td><td><code>@dsh-external/dsh-webui</code></td><td>View tiles / message navigation / tool-call aggregation / Markdown rendering / reasoning-effort sync / AnySearch; **floating sidebar** (with popup-keep-open fix) and prompt-optimize popover</td></tr>
    <tr><td>🧩 Module injection</td><td><code>@dsh-external/dsh-super-injector</code></td><td>Runtime injection of local DSH plugin packages (junction + loader.create, no restart), hot reload + management UI</td></tr>
    <tr><td>👁️ Visualization</td><td><code>@dsh-external/dsh-visualize</code></td><td>`visualize` tool + bundled skill: render interactive HTML fragments as sandboxed cards (Codex `/visualize` semantics)</td></tr>
    <tr><td>⚖️ Permission policy</td><td><code>@nanmicoder/dsh-auto-mode</code></td><td>Sandbox-first automatic permission policy (the **Auto** permission option, patched into this package)</td></tr>
    <tr><td>🌐 UA relay</td><td><code>dsh-ua-relay</code></td><td>UA-rewriting reverse relay for B.AI (bankofai.io), target `https://api.bankofai.io`</td></tr>
  </tbody>
</table>

> `@nanmicoder/dsh-agent-teams` (multi-agent team collaboration) stays
> **disabled** per user request: its activity scanner repeatedly scans whole
> history after abnormal logs and freezes the UI. Host not mounted, client not
> embedded — identical to the multi-plugin era.

## 🚀 Installation

```sh
dsh plugin --profile web add github:mmzm0808/dsh-ventus-plugins
```

Or local dev:

```sh
dsh plugin --profile web add "<absolute path to this repo>"
```

- Committed `lib/` artifacts and `vendor/` deps — **no build script needed**
  (pnpm ≥10 allowBuilds gate does not affect this plugin)
- **Restart dsh** after install (bundle layer loads at boot; client changes via HMR)

## 📖 Usage

| Feature | Entry |
|---|---|
| Usage ball | Right-side floating ball: drag vertically, snaps to left half; click to expand |
| Usage panel | Balance / spend / tokens / per-model usage / R0 / trends / login / screenshot |
| Endfield theme | Settings → Appearance → Theme → `dsh-theme-endfield`; theme card: contour, watermark, sidebar surface (transparent/glass/solid+color), radius, hero dock |
| Right rail | Panel button top-right of conversation: files / terminal / git / browser |
| Search | `@` or slash command triggers ventus-search provider |
| Desktop pet | Bottom-right orca; right-click to configure |
| Subagent progress | Delegate a multi-stage task (the model emits `progress-json` per the bundled skill); hover the subagent entry at the bottom of the conversation |
| Module injection | Settings → `dsh-ventus-plugins` → drop a local plugin package to hot-load |

## 🏗️ Architecture

```
dsh-ventus-plugins/
├── package.json            # single package; dsh.client.platform=web; 34 third-party deps union
├── cordis.patch.yml        # bundle patch: permission presets (Auto) + insert row
├── lib/
│   ├── index.js            # host aggregate: ctx.plugin each of 10 sub-plugins (agent-teams excluded)
│   └── client.js           # merged client bundle (generated by build-client.mjs)
├── vendor/                 # 11 sub-plugins' runtime artifacts (self-contained)
│   └── node_modules/       # junction chain: third-party → profile node_modules
└── scripts/
    ├── build-client.mjs    # client merge build script
    ├── cdp.mjs             # CDP debugging helper (dev)
    └── extract-dsu-css.mjs # CSS constant extraction (dev)
```

### Client merge (lib/client.js)

DSH loads `/plugins/<id>/client.js` per package; the bundle contract is
`window.__ModuleLoader__.load({ id, factory })`. Merge strategy (no parsing /
no rewriting of minified code):

1. Each sub-bundle's `load` call is **embedded verbatim** into the aggregate
   factory — sub-factories register with the loader at execution time;
2. The aggregate `apply` materializes each sub-module via `require(id)` and
   calls its `apply`.

**Gotchas** (from real incidents):

- **Service injection uses short service names**: the aggregate `exports.inject`
  must be the union of sub-plugin service deps with short names (`slots`,
  `sessions`, `connection`, `workspaces`, `locale`, `modules`,
  `settingsScope`, `conversationEvents`, `remote`, `layout`). Package names
  pend forever; empty throws "cannot get property without inject".
- **Variable scopes are naturally isolated**: each sub-bundle has its own
  factory scope, so same-named top-level `const`s (e.g. `NS`) never collide;
  verify with `node --check lib/client.js`.
- **Style ownership must be explicit**: hand-written `<style>` tags should
  carry a `data-plugin` marker; theme idempotent cleanup must only match its
  own exclusive marker (`data-endfield-css`) — otherwise it deletes other
  plugins' styles (real incident: usage's `data-dsu-css` style was deleted,
  turning the floating ball into plain text).

### Patch layer (cordis.patch.yml)

- `permission.presets` section: the Auto permission option (whole-section
  replace semantics — restate official defaults plus the auto extension);
- `insert` section: this package's mount row.

## 🐛 Known Issues & Fixes

| Issue | Root cause | Fix |
|---|---|---|
| Usage ball became plain text | theme's insertCss cleanup used a generic `style[data-plugin=...]` selector and deleted usage's `data-dsu-css` style | theme cleanup uses exclusive `data-endfield-css`; usage style carries `data-plugin=dsh-deepseek-usage` |
| Duplicate "用量/技能" sidebar buttons | usage-skill registered `sidebar.footer.action`, duplicating the official skills button | Slot registration disabled per user request (dictionaries kept) |
| agent-teams 404 polling storm | client still embedded and polling the state route after user disabled the plugin | Removed from `CLIENT_ENTRIES` |
| Auto permission option missing | aggregate patch didn't migrate `permission.presets.auto` | Merged into `cordis.patch.yml` |
| Sidebar collapses over 3-dot menu popups | `pointInside` pure geometry; portal popups outside the sidebar rect | `pointOverSidebarPopup`: elementFromPoint hit on Radix popper/menu/dialog keeps open without expanding |
| ENDFIELD watermark off-center on new-session pages | hero watermark followed the headline center; headline host width varies per page | Align to the conversation column (centerCol) center; headline matching widened (hash-drift immune) |
| Session log seq gap / tool-source validation | historical writes duplicated seqs / empty callIds | `scripts/repair-session-log.mjs`: renumber seq + patch source.callId and repack |
| ventus-progress skill not installed | vendor lacked the skills dir + DSH_HOME not injected | vendor ships skills; installSkill falls back to `~/.dsh` |
| Page marked English by Edge | official index.html declares `lang="en"` | usage apply sets `zh-CN` at runtime |

## 📜 License

MIT
