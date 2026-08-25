window.__ModuleLoader__.load({
	id: "dsh-context",
	factory: (require) => {
		var module = { exports: {} };
		module.exports;
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region src/client/i18n.ts
		const DICT_ZH = {
			"tab": "上下文",
			"cat.system": "系统提示词",
			"cat.tools": "工具定义",
			"cat.user": "用户消息",
			"cat.inject": "注入内容",
			"cat.assistant": "助手消息",
			"cat.tool": "工具结果",
			"overview.title": "当前上下文",
			"overview.estimate": "tokens（估算）",
			"overview.free": "剩余窗口",
			"overview.used": "上下文已用",
			"overview.ofUsed": "占已用上下文",
			"overview.compactReserve": "自动压缩预留：占用达 {pct}% 窗口时触发压缩，此区域一般不实际占用",
			"stats.title": "上下文统计",
			"stats.hint": "当前上下文存在和包含的内容",
			"stats.turns": "轮次",
			"stats.steps": "步数",
			"stats.injects": "注入",
			"stats.compactions": "压缩",
			"stats.prunes": "剪枝",
			"stats.toolCalls": "工具调用",
			"stats.images": "图片",
			"stats.cacheHit": "缓存命中",
			"stats.cost": "预估费用",
			"stats.costTip": "按 DeepSeek 官方刊例价估算整个会话的累计费用：输入区分缓存命中/未命中，输出含思考；按请求时间区分高峰（北京时间工作日 9:00–12:00、14:00–18:00）与空闲时段（半价，周末全天均为空闲时段）。适用于 deepseek-v4-flash / deepseek-v4-pro（不限 provider），价格写死在代码中，仅供参考。",
			"stats.costPriceHead": "每百万 tokens 价格（高峰 | 空闲半价）：",
			"stats.costHit": "命中",
			"stats.costMiss": "未命中",
			"stats.costOut": "输出",
			"plugin.title": "插件信息",
			"plugin.hint": "The best DSH context plugin ⭐",
			"plugin.name": "插件",
			"plugin.github": "GitHub",
			"tools.top": "工具定义 Top：",
			"tools.more": "等 {n} 个",
			"trend.title": "上下文趋势",
			"gran.step": "步骤",
			"gran.turn": "轮次",
			"settings.title": "上下文",
			"settings.desc": "上下文面板的展示偏好",
			"settings.gran": "趋势图默认粒度",
			"settings.mode": "趋势图默认展示",
			"settings.expand": "展开",
			"settings.collapse": "收起",
			"settings.readOnly": "当前环境的设置为只读",
			"gran.total": "全量",
			"gran.delta": "增量",
			"gran.modeHint": "全量：累计构成；增量：相对上一条请求的变化量",
			"trend.hint": "✂ 表示压缩/剪枝，步骤/轮次 切换粒度",
			"trend.empty": "发起一轮对话后，这里会展示每次模型请求的上下文构成",
			"detail.step": "第 {t} 轮 · 第 {s} 步",
			"detail.turn": "第 {t} 轮 · 共 {n} 步",
			"detail.lastStep": "末步",
			"detail.estTotal": "估算合计 ≈ {n}",
			"detail.actual": "实际 prompt {n}",
			"detail.output": "输出 {n}",
			"detail.cache": "缓存 {n}%",
			"brief.turn": "本轮",
			"brief.input": "输入",
			"brief.reply": "回复",
			"brief.more": "+{n}",
			"brief.locate": "在上下文浏览器中查看",
			"brief.turnTip": "这一轮开场时用户发送的消息",
			"brief.inputTip": "这一步新进入上下文的内容（通常是上一步工具调用的结果）",
			"brief.replyTip": "这一步模型返回的内容（文本回复或工具调用）",
			"events.title": "上下文事件",
			"events.empty": "暂无上下文事件（压缩、注入、模型切换会出现在这里）",
			"events.at": "第 {t} 轮 · 第 {s} 步",
			"events.range": "第 {t} 轮 · 第 {a}→{b} 步",
			"events.rangeTo": "第 {a} 轮 · 第 {as} 步 → 第 {b} 轮 · 第 {bs} 步",
			"kind.inject": "注入",
			"kind.compaction": "压缩",
			"kind.prune": "剪枝",
			"kind.model": "切换",
			"kind.mode": "模式",
			"nodes.title": "消息构成",
			"nodes.hint": "当前模型可见的消息，最新在前",
			"nodes.more": "… 更早的 {n} 条消息已省略",
			"nodes.empty": "当前没有模型可见的消息",
			"loading": "正在读取会话日志…",
			"error": "上下文数据读取失败：",
			"error.retry": "重试",
			"footer": "估算口径：与 dsh 内置 tokenMeter 相同的固定密度启发式（约 4 字符 ≈ 1 token）；「实际」为供应商上报用量。",
			"tip.step": "第 {t} 轮 · 第{s}步",
			"tip.turn": "第 {t} 轮 · 共 {n} 步",
			"tip.total": "合计 ≈ {n}",
			"tip.actual": "（实际 {n}）",
			"tip.delta": "Δ {n}",
			"ev.compaction": "压缩上下文（摘要替换 {n} 条消息）",
			"ev.prune": "剪枝工具输出",
			"ev.skill": "Skill 注入（{name}）",
			"ev.model": "模型切换：{a} → {b}",
			"ev.mode.plan.on": "进入计划模式",
			"ev.mode.plan.off": "退出计划模式",
			"form.instructions": "指令注入",
			"form.catalog": "目录更新",
			"form.snapshot": "状态快照",
			"form.notice": "通知",
			"form.relay": "代理转发",
			"form.recall": "历史召回",
			"form.context": "上下文注入",
			"node.toolResult": "工具结果",
			"node.calls": "调用 ",
			"node.empty": "(空回复)",
			"node.nonText": "(非文本消息)",
			"node.snapshot": "快照: ",
			"node.skillTag": "技能 · {name}",
			"cmd.desc": "查看当前上下文构成，浏览各步骤组成",
			"cmd.close": "关闭",
			"browser.title": "上下文浏览器",
			"browser.live": "当前（下一次请求）",
			"browser.liveNow": "当前 · 下一次请求",
			"browser.items": "{n} 项",
			"browser.missingLive": "… 另有 {n} 条更早的消息也在上下文中（超出展示窗口）",
			"browser.approx": "该步骤涉及的部分已移除消息超出保留范围，以下为近似构成",
			"browser.deltaHint": "对比上轮末步的变动",
			"browser.noHeader": "此数据来自旧版插件：仅提供 token 估算，无实际内容",
			"browser.noEpoch": "该步骤的头部内容（系统提示词 / 工具定义）不在保留范围内",
			"browser.noContent": "完整内容不在当前加载的消息窗口内（在聊天页加载更早历史后可查看）",
			"browser.loading": "正在从更早的会话历史加载完整内容…",
			"browser.preview": "预览",
			"tool.desc": "描述",
			"tool.params": "参数",
			"tool.paramsEmpty": "（无参数）",
			"tool.jsonToggle": "查看原始 JSON",
			"tool.jsonHide": "收起",
			"rich.raw": "原文",
			"rich.md": "Markdown",
			"rich.toMd": "按 Markdown 渲染查看",
			"rich.toRaw": "查看原始文本",
			"block.thinking": "思考",
			"block.answer": "回答",
			"block.content": "内容",
			"block.result": "结果",
			"block.summary": "摘要",
			"block.line": "{n} 行",
			"block.lines": "{n} 行",
			"call.ok": "正常",
			"call.fail": "失败",
			"call.exit": "exit {n}",
			"node.failed": "工具执行失败",
			"attach.images": "图片附件",
			"attach.other": "其他内容",
			"attach.image": "图片",
			"attach.open": "查看原图",
			"attach.preview": "图片预览",
			"attach.close": "关闭",
			"attach.loading": "…",
			"attach.loadFailed": "加载失败 · 点击重试",
			"attach.raw": "原图",
			"attach.sent": "发送",
			"attach.token": "Token",
			"attach.tokensTip": "按 DeepSeek 官方图片尺寸换算（单图上限 384 tokens）估算的 token 消耗"
		};
		const DICT_EN = {
			"tab": "Context",
			"cat.system": "System Prompt",
			"cat.tools": "Tool Schemas",
			"cat.user": "User Messages",
			"cat.inject": "Injected Context",
			"cat.assistant": "Assistant Messages",
			"cat.tool": "Tool Results",
			"overview.title": "Current Context",
			"overview.estimate": "tokens (estimated)",
			"overview.free": "Free Window",
			"overview.used": "of context used",
			"overview.ofUsed": "of used context",
			"overview.compactReserve": "Auto-compaction reserve: auto-compaction triggers at {pct}% of the window — this area is normally kept as headroom, not actually used",
			"stats.title": "Context Stats",
			"stats.hint": "Present in the current context",
			"stats.turns": "Turns",
			"stats.steps": "Steps",
			"stats.injects": "Injections",
			"stats.compactions": "Compactions",
			"stats.prunes": "Prunes",
			"stats.toolCalls": "Tool Calls",
			"stats.images": "Images",
			"stats.cacheHit": "Cache Hit",
			"stats.cost": "Cost",
			"stats.costTip": "Rough cumulative cost of the whole session at DeepSeek’s list prices: input split by cache hit/miss, output includes reasoning; each request is priced at the peak (Beijing Time weekdays 09:00–12:00, 14:00–18:00) or half-price off-peak rate by its time — weekends bill at off-peak all day. Applies to deepseek-v4-flash / deepseek-v4-pro on any provider; prices are hardcoded, for reference only.",
			"stats.costPriceHead": "Per-1M-token rates (peak | off-peak at half price):",
			"stats.costHit": "hit",
			"stats.costMiss": "miss",
			"stats.costOut": "output",
			"plugin.title": "Plugin Info",
			"plugin.hint": "The best DSH context plugin ⭐",
			"plugin.name": "Plugin",
			"plugin.github": "GitHub",
			"tools.top": "Top Tool Schemas:",
			"tools.more": "of {n}",
			"trend.title": "Context Trend",
			"gran.step": "Step",
			"gran.turn": "Turn",
			"settings.title": "Context",
			"settings.desc": "Display preferences for the Context panel",
			"settings.gran": "Default trend granularity",
			"settings.mode": "Default trend display",
			"settings.expand": "Expand",
			"settings.collapse": "Collapse",
			"settings.readOnly": "Settings are read-only in this environment",
			"gran.total": "Total",
			"gran.delta": "Delta",
			"gran.modeHint": "Total: cumulative makeup; Delta: change vs the previous request",
			"trend.hint": "✂ marks compaction/prune, Step/Turn switches granularity",
			"trend.empty": "Send a message and each model request’s context makeup shows up here",
			"detail.step": "Turn {t} · Step {s}",
			"detail.turn": "Turn {t} · {n} steps",
			"detail.lastStep": "Last Step",
			"detail.estTotal": "Estimated ≈ {n}",
			"detail.actual": "Actual Prompt {n}",
			"detail.output": "Output {n}",
			"detail.cache": "Cache {n}%",
			"brief.turn": "User",
			"brief.input": "In",
			"brief.reply": "Response",
			"brief.more": "+{n}",
			"brief.locate": "Reveal in Context Browser",
			"brief.turnTip": "The user message that opened this turn",
			"brief.inputTip": "What newly entered the context for this step (usually results of the previous tool calls)",
			"brief.replyTip": "What the model returned on this step (a text reply or tool calls)",
			"events.title": "Context Events",
			"events.empty": "No context events yet (compaction, injections, model switches appear here)",
			"events.at": "Turn {t} · Step {s}",
			"events.range": "Turn {t} · Step {a}→{b}",
			"events.rangeTo": "Turn {a} · Step {as} → Turn {b} · Step {bs}",
			"kind.inject": "Inject",
			"kind.compaction": "Compact",
			"kind.prune": "Prune",
			"kind.model": "Switch",
			"kind.mode": "Mode",
			"nodes.title": "Messages",
			"nodes.hint": "currently model-visible, newest first",
			"nodes.more": "… {n} earlier messages omitted",
			"nodes.empty": "No model-visible messages right now",
			"loading": "Reading the session log…",
			"error": "Failed to read context data: ",
			"error.retry": "Retry",
			"footer": "Estimate: same fixed-density heuristic as dsh’s built-in tokenMeter (~4 chars ≈ 1 token); “actual” is provider-reported usage.",
			"tip.step": "Turn {t} · Step {s}",
			"tip.turn": "Turn {t} · {n} steps",
			"tip.total": "Total ≈ {n}",
			"tip.actual": " (actual {n})",
			"tip.delta": "Δ {n}",
			"ev.compaction": "Context compacted (summary replaced {n} messages)",
			"ev.prune": "Tool output pruned",
			"ev.skill": "Skill injected ({name})",
			"ev.model": "Model switched: {a} → {b}",
			"ev.mode.plan.on": "Plan mode on",
			"ev.mode.plan.off": "Plan mode off",
			"form.instructions": "Instructions",
			"form.catalog": "Catalog Update",
			"form.snapshot": "State Snapshot",
			"form.notice": "Notice",
			"form.relay": "Agent Relay",
			"form.recall": "Recall",
			"form.context": "Context Injection",
			"node.toolResult": "Tool Result",
			"node.calls": "Calls ",
			"node.empty": "(empty reply)",
			"node.nonText": "(non-text message)",
			"node.snapshot": "Snapshot: ",
			"node.skillTag": "Skill · {name}",
			"cmd.desc": "View current context makeup, browse per-step composition",
			"cmd.close": "Close",
			"browser.title": "Context Browser",
			"browser.live": "Live (Next Request)",
			"browser.liveNow": "Live · Next Request",
			"browser.items": "{n} Items",
			"browser.missingLive": "… {n} earlier messages are also part of the context (outside the served window)",
			"browser.approx": "Some removed messages of this step exceed retention — the makeup below is approximate",
			"browser.deltaHint": "vs previous turn",
			"browser.noHeader": "Served by an older plugin build: token estimates only, no content",
			"browser.noEpoch": "The header content (System Prompt / Tool Schemas) of this step is outside retention",
			"browser.noContent": "Full content is outside the loaded message window (load older history in Chat to view)",
			"browser.loading": "Loading full content from older session history…",
			"browser.preview": "Preview",
			"tool.desc": "Description",
			"tool.params": "Parameters",
			"tool.paramsEmpty": "(no parameters)",
			"tool.jsonToggle": "View Raw JSON",
			"tool.jsonHide": "Collapse",
			"rich.raw": "Raw",
			"rich.md": "Markdown",
			"rich.toMd": "View as Markdown",
			"rich.toRaw": "View Raw Text",
			"block.thinking": "Reasoning",
			"block.answer": "Response",
			"block.content": "Content",
			"block.result": "Result",
			"block.summary": "Summary",
			"block.line": "1 line",
			"block.lines": "{n} lines",
			"call.ok": "OK",
			"call.fail": "Failed",
			"call.exit": "exit {n}",
			"node.failed": "Tool execution failed",
			"attach.images": "Images",
			"attach.other": "Other content",
			"attach.image": "Image",
			"attach.open": "Open full image",
			"attach.preview": "Image preview",
			"attach.close": "Close",
			"attach.loading": "…",
			"attach.loadFailed": "Load failed · click to retry",
			"attach.raw": "Raw",
			"attach.sent": "Sent",
			"attach.token": "Token",
			"attach.tokensTip": "Estimated token cost via DeepSeek's official image-size conversion (384-token cap per image)"
		};
		//#endregion
		//#region src/client/modalStore.ts
		const stores = /* @__PURE__ */ new Map();
		function modalStoreOf(sessionId) {
			const existing = stores.get(sessionId);
			if (existing !== void 0) return existing;
			let open = false;
			const listeners = /* @__PURE__ */ new Set();
			const store = {
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				getSnapshot: () => open,
				set(next) {
					if (next === open) return;
					open = next;
					for (const listener of listeners) listener();
				}
			};
			stores.set(sessionId, store);
			return store;
		}
		const pendingConsume = /* @__PURE__ */ new Map();
		function setPendingConsume(sessionId, guard) {
			pendingConsume.set(sessionId, guard);
		}
		function takePendingConsume(sessionId) {
			const guard = pendingConsume.get(sessionId);
			if (guard !== void 0) pendingConsume.delete(sessionId);
			return guard;
		}
		//#endregion
		//#region src/client/command.ts
		/**
		* `/context` — a client-owned slash command that opens the context modal
		* (current composition + recent trend) in the center of the page.
		*
		* Implemented as the plugin's own '/' trigger source instead of a host
		* command: nothing is dispatched to the host, no session log records are
		* written, and nothing becomes model-visible — the invocation never enters
		* the message history. Both paths answer `'handled'` and open the modal,
		* leaving the `/context` token in the composer while it is open; the modal's
		* close path consumes the token then (see modalStore.ts).
		*/
		const COMMAND = "context";
		const LINE = "/context";
		function registerContextCommand(ctx, kit) {
			ctx.effect(() => {
				const inputTriggers = ctx.get("inputTriggers");
				if (inputTriggers === void 0) return () => {};
				return inputTriggers.registerSource({
					trigger: "/",
					name: COMMAND,
					order: 1,
					candidates: (_session, req) => {
						if (req.position !== "leading") return Promise.resolve([]);
						const query = req.query.trim().toLowerCase();
						if (query !== "" && !COMMAND.startsWith(query)) return Promise.resolve([]);
						return Promise.resolve([{
							name: COMMAND,
							description: kit.t("cmd.desc")
						}]);
					},
					onPick: (pick) => {
						setPendingConsume(pick.session.sessionId, {
							kind: "span",
							span: pick.span
						});
						modalStoreOf(pick.session.sessionId).set(true);
						return "handled";
					},
					matchEnter: (session, line) => {
						if (line !== LINE) return Promise.resolve(void 0);
						setPendingConsume(session.sessionId, {
							kind: "bare-token",
							token: LINE
						});
						modalStoreOf(session.sessionId).set(true);
						return Promise.resolve("handled");
					}
				});
			}, "dsh-context: /context command");
		}
		//#endregion
		//#region src/client/categories.ts
		const CATS = [
			{
				key: "system",
				color: "#6366f1"
			},
			{
				key: "tools",
				color: "#f59e0b"
			},
			{
				key: "user",
				color: "#22c55e"
			},
			{
				key: "inject",
				color: "#a855f7"
			},
			{
				key: "assistant",
				color: "#3b82f6"
			},
			{
				key: "tool",
				color: "#14b8a6"
			}
		];
		const MESSAGE_CATS = [
			"user",
			"inject",
			"assistant",
			"tool"
		];
		/** Category key → chart color, built once from CATS. */
		const CAT_COLORS = Object.fromEntries(CATS.map((c) => [c.key, c.color]));
		function partsOf(breakdown) {
			return CATS.map((c) => {
				return {
					key: c.key,
					color: c.color,
					value: breakdown[c.key] || 0
				};
			});
		}
		/**
		* Build the pie-consistent raw parts: system/tools/messages take the
		* OFFICIAL `contextBreakdown` figures when delivered (the exact counts the
		* chat ring's panel shows), with the message bucket subdivided into the
		* four surface categories by the fold's per-category ratios (rounding
		* residue lands on the largest category, so the four always sum exactly to
		* the official message figure). Absent the projection, the fold's own sums
		* serve — the same fixed estimator, so identical on image-free sessions.
		*/
		function officialParts(current, breakdown) {
			const foldSurface = current.user + current.inject + current.assistant + current.tool;
			const system = breakdown?.systemTokens ?? current.system;
			const tools = breakdown?.toolsTokens ?? current.tools;
			const messages = breakdown?.messageTokens ?? foldSurface;
			const shares = {
				system,
				tools
			};
			if (foldSurface > 0) {
				let assigned = 0;
				let largest = "user";
				for (const cat of MESSAGE_CATS) {
					const count = Math.round(messages * (current[cat] / foldSurface));
					shares[cat] = count;
					assigned += count;
					if (current[cat] > current[largest]) largest = cat;
				}
				shares[largest] = Math.max(0, shares[largest] + messages - assigned);
			} else for (const cat of MESSAGE_CATS) shares[cat] = 0;
			return CATS.map((c) => ({
				key: c.key,
				color: c.color,
				value: shares[c.key] ?? 0
			}));
		}
		/**
		* Reproportion heuristic parts so they sum to a provider-anchored target —
		* the same trick the official ContextMeter uses: the heuristic breakdown
		* supplies the composition RATIOS, the provider sample the total. The
		* anchored figure rides `value` (bar widths); the heuristic count stays on
		* `raw` for the legend and tooltips. Returns the parts unchanged when no
		* anchor applies.
		*/
		function anchoredParts(parts, target) {
			const sourced = parts.map((p) => ({
				...p,
				raw: p.raw ?? p.value
			}));
			if (target === null || target <= 0) return sourced;
			let total = 0;
			for (const p of sourced) total += p.raw;
			if (total <= 0) return sourced;
			if (total === target) return sourced.map((p) => ({
				...p,
				value: p.raw
			}));
			const scale = target / total;
			return sourced.map((p) => ({
				...p,
				value: Math.round(p.raw * scale)
			}));
		}
		//#endregion
		//#region src/client/headline.ts
		function headlineOf(data, pressure = null, breakdown = null) {
			const current = data.current;
			const projected = pressure !== null && typeof pressure.projectedTokens === "number" ? pressure.projectedTokens : void 0;
			const requests = data.requests;
			const lastReq = requests.length > 0 ? requests[requests.length - 1] : null;
			const derived = lastReq !== null && typeof lastReq.prompt === "number" ? lastReq.prompt + (current.total - lastReq.total) : void 0;
			const occupancyTokens = projected ?? derived ?? null;
			const window = pressure !== null && typeof pressure.contextWindow === "number" ? pressure.contextWindow : data.contextWindow;
			const tokens = occupancyTokens ?? current.total;
			return {
				tokens,
				window,
				pct: window !== void 0 && window > 0 ? Math.min(100, Math.round(tokens / window * 100)) : null,
				parts: anchoredParts(officialParts(current, breakdown), occupancyTokens !== null && tokens > 0 ? tokens : null)
			};
		}
		//#endregion
		//#region src/client/services.ts
		/**
		* Narrow an unknown projection value to a string-keyed record, or null when
		* it is not one. The boundary type is Record<string, unknown> on purpose:
		* every field read below must re-prove itself (the no-white-screen
		* guarantee), so no field may borrow the wire type before its check.
		*/
		function asRecord(value) {
			if (value === null || value === void 0 || typeof value !== "object") return null;
			return value;
		}
		/**
		* Safe finite-number read: a missing/non-numeric/NaN field degrades to 0
		* instead of leaking into the UI as NaN percentages or broken arithmetic.
		*/
		function numOf(value) {
			return typeof value === "number" && Number.isFinite(value) ? value : 0;
		}
		function objectsOf(value) {
			if (!Array.isArray(value)) return [];
			return value.filter((v) => v !== null && typeof v === "object");
		}
		/**
		* Narrow a delivered projection value to a RENDER-SAFE context timeline —
		* the client's no-white-screen guarantee against backend/parse failures.
		*
		* A value that is not a record at all (capability absent, nothing delivered
		* yet) stays `null` and callers show the loading screen. A record that fails
		* the wire shape (corrupt checkpoint restore, a failed/older host payload,
		* plugin drift) is SANITIZED instead of rejected: every collection becomes
		* an array, non-object entries are dropped, `current` becomes a numeric
		* breakdown, and wrong-typed scalars are dropped or zeroed — so the whole
		* tab still renders with every usable piece of data instead of throwing
		* during render and unmounting the conversation view.
		*/
		function timelineOf(value) {
			const data = asRecord(value);
			if (data === null) return null;
			const current = data.current;
			if (current !== null && typeof current === "object" && [
				"system",
				"tools",
				"user",
				"inject",
				"assistant",
				"tool",
				"total"
			].every((k) => typeof current[k] === "number") && Array.isArray(data.requests) && Array.isArray(data.events) && Array.isArray(data.nodes) && Array.isArray(data.archive) && Array.isArray(data.toolList)) return data;
			const safeCurrent = current !== null && typeof current === "object" ? current : {};
			const cost = typeof data.cost === "object" && data.cost !== null && !Array.isArray(data.cost) ? data.cost : void 0;
			return {
				ok: true,
				...typeof data.model === "string" ? { model: data.model } : {},
				...typeof data.provider === "string" ? { provider: data.provider } : {},
				...typeof data.contextWindow === "number" ? { contextWindow: data.contextWindow } : {},
				current: {
					system: numOf(safeCurrent.system),
					tools: numOf(safeCurrent.tools),
					user: numOf(safeCurrent.user),
					inject: numOf(safeCurrent.inject),
					assistant: numOf(safeCurrent.assistant),
					tool: numOf(safeCurrent.tool),
					total: numOf(safeCurrent.total)
				},
				toolList: objectsOf(data.toolList),
				requests: objectsOf(data.requests),
				events: objectsOf(data.events),
				nodes: objectsOf(data.nodes),
				droppedNodes: numOf(data.droppedNodes),
				...typeof data.images === "number" ? { images: data.images } : {},
				...typeof data.toolCalls === "number" ? { toolCalls: data.toolCalls } : {},
				archive: objectsOf(data.archive),
				...cost !== void 0 ? { cost } : {},
				...typeof data.surfaceFloor === "number" ? { surfaceFloor: data.surfaceFloor } : {},
				...typeof data.archiveFloor === "number" ? { archiveFloor: data.archiveFloor } : {}
			};
		}
		/**
		* Narrow a delivered projection value to the official token-meter
		* `contextPressure` projection (provider-anchored occupancy of the next
		* request). Absent key or value = the meter's projection is not composed
		* (e.g. a harness without the session-projection registry) — callers fall
		* back to their derived anchor, so the UI degrades gracefully.
		*/
		function contextPressureOf(value) {
			return asRecord(value);
		}
		/**
		* Narrow a delivered projection value to the official token-meter
		* `contextBreakdown` projection (the heuristic composition rows of the chat
		* ring's panel). Every figure must be a finite number — a partial/corrupt
		* value degrades to null so the composition card falls back to the fold's
		* own sums instead of mixing sources.
		*/
		function contextBreakdownOf(value) {
			const data = asRecord(value);
			if (data === null) return null;
			const { systemTokens, toolsTokens, messageTokens } = data;
			if (typeof systemTokens !== "number" || !Number.isFinite(systemTokens)) return null;
			if (typeof toolsTokens !== "number" || !Number.isFinite(toolsTokens)) return null;
			if (typeof messageTokens !== "number" || !Number.isFinite(messageTokens)) return null;
			return {
				systemTokens,
				toolsTokens,
				messageTokens
			};
		}
		/**
		* Narrow a delivered projection value to the official token-meter
		* `tokenUsage` projection (durable cumulative provider usage). Absent key or
		* value = the meter's projection is not composed (or no request has reported
		* usage yet) — callers drop the cache-hit cell to a dash.
		*/
		function tokenUsageOf(value) {
			return asRecord(value);
		}
		/**
		* Narrow a delivered projection value to the plugin's `contextHeaders`
		* (request-header content epochs). Absent key = an older Host half without
		* the companion unit — the Context browser degrades its system/tools
		* sections to tokens-only with a note.
		*
		* Entry-level shape is checked too: a malformed epoch (corrupt payload with
		* a missing tools list or wrong-typed system prompt) would crash the
		* browser's tools/sections reads, so the WHOLE projection degrades to null
		* and the card falls back to its tokens-only note.
		*/
		function headersOf(value) {
			const headers = asRecord(value);
			if (headers === null || !Array.isArray(headers.headers)) return null;
			for (const h of headers.headers) {
				if (h === null || typeof h !== "object") return null;
				const entry = h;
				if (!Array.isArray(entry.tools)) return null;
				if (entry.system !== void 0 && typeof entry.system !== "string") return null;
			}
			return headers;
		}
		//#endregion
		//#region src/client/assemble.ts
		/** The header epoch in force at `seq` (last logged before it), or the newest. */
		function headerAt(headers, seq) {
			if (headers === null || headers.headers.length === 0) return null;
			if (seq === null) return headers.headers[headers.headers.length - 1];
			for (let i = headers.headers.length - 1; i >= 0; i--) if (headers.headers[i].seq < seq) return headers.headers[i];
			return null;
		}
		function assemble(data, headers, seq) {
			const live = seq === null;
			let nodes;
			if (live) nodes = data.nodes.slice();
			else {
				const picked = [];
				for (const n of data.nodes) if (n.seq < seq) picked.push(n);
				for (const n of data.archive) if (n.seq < seq && n.gone !== void 0 && n.gone > seq) picked.push(n);
				nodes = picked;
			}
			nodes.sort((a, b) => a.seq - b.seq);
			let missingLive = 0;
			if (data.droppedNodes > 0) {
				if (live || data.surfaceFloor !== void 0 && seq > data.surfaceFloor) missingLive = data.droppedNodes;
			}
			const approximate = !live && data.archiveFloor !== void 0 && seq < data.archiveFloor;
			return {
				live,
				header: headerAt(headers, seq),
				nodes,
				missingLive,
				approximate
			};
		}
		//#endregion
		//#region src/client/react.ts
		const React = require("react");
		const h = React.createElement;
		const ReactDOM = require("react-dom");
		//#endregion
		//#region src/client/callSummary.ts
		function parseCallArgs(raw) {
			if (typeof raw !== "string" || raw === "") return null;
			try {
				const parsed = JSON.parse(raw);
				return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
			} catch {
				return null;
			}
		}
		function summaryInArgs(args) {
			if (args === null) return null;
			for (const k of [
				"description",
				"file_path",
				"path",
				"filePath"
			]) {
				const v = args[k];
				if (typeof v === "string" && v !== "") return v;
			}
			return null;
		}
		function callSummaryOf(conv) {
			return summaryInArgs(parseCallArgs(conv?.call?.argsRaw));
		}
		function blockSummaryOf(conv) {
			if (conv === void 0 || !Array.isArray(conv.blocks)) return null;
			for (const b of conv.blocks) {
				const blk = b !== null && typeof b === "object" ? b : null;
				if (blk === null || blk.kind !== "tool-call") continue;
				const s = summaryInArgs(parseCallArgs(blk.argsRaw));
				if (s !== null) return s;
			}
			return null;
		}
		/**
		* All tool-call names in an assistant conversation node, in order. The fold's surface node keeps `calls` only for TEXT-LESS replies,
		* so a reply carrying both text and calls recovers its call breadcrumb here through the conversation join.
		*/
		function callNamesOf(conv) {
			if (conv === void 0 || !Array.isArray(conv.blocks)) return [];
			const names = [];
			for (const b of conv.blocks) {
				const blk = b !== null && typeof b === "object" ? b : null;
				if (blk !== null && blk.kind === "tool-call" && typeof blk.name === "string") names.push(blk.name);
			}
			return names;
		}
		//#endregion
		//#region src/client/components/nodes.tsx
		function makeNodeText(kit) {
			const { t } = kit;
			return function nodeText(n) {
				if (n.cat === "tool") return t("node.toolResult") + (n.tool ? " ← " + n.tool : "") + (n.err ? " ⚠" : "");
				if (n.skill) return "Skill: " + n.skill;
				if (n.calls) return t("node.calls") + n.calls.join(", ");
				if (n.text) return n.form === "snapshot" ? t("node.snapshot") + n.text : n.text;
				if (n.cat === "assistant") return t("node.empty");
				if (n.cat === "inject") return t("form." + (n.form || "context"));
				return t("node.nonText");
			};
		}
		function makeNodeList(kit) {
			const { t, fmt, fmtTime } = kit;
			const nodeText = makeNodeText(kit);
			return function NodeList(props) {
				if (props.nodes.length === 0) return /* @__PURE__ */ React.createElement("div", { className: "lc-empty" }, t("nodes.empty"));
				const rows = props.nodes.slice().reverse();
				return /* @__PURE__ */ React.createElement("div", { className: "lc-nodes" }, props.dropped > 0 ? /* @__PURE__ */ React.createElement("div", { className: "lc-nodes-more" }, t("nodes.more", { n: props.dropped })) : null, rows.map((n) => {
					const text = nodeText(n);
					return /* @__PURE__ */ React.createElement("div", {
						key: n.seq,
						className: "lc-node"
					}, /* @__PURE__ */ React.createElement("i", { style: { background: CAT_COLORS[n.cat] || "#999" } }), /* @__PURE__ */ React.createElement("span", {
						className: "lc-node-preview",
						title: text
					}, text), typeof n.time === "number" ? /* @__PURE__ */ React.createElement("span", { className: "lc-node-time" }, fmtTime(n.time)) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-node-tokens" }, fmt(n.tokens)));
				}));
			};
		}
		//#endregion
		//#region src/client/format.ts
		/** `fmt`: the k/M suffix style shared by bars/details/stats; `fmtTime`: local HH:MM:SS. */
		function fmt(n) {
			if (n === void 0 || n === null || isNaN(n)) return "—";
			const sign = n < 0 ? "-" : "";
			const a = Math.abs(n);
			if (a >= 1e6) return sign + (a / 1e6).toFixed(1) + "M";
			if (a >= 1e3) return sign + (a / 1e3).toFixed(1) + "k";
			return sign + String(Math.round(a));
		}
		/** Byte sizes for attachment metadata (1 kB = 1000 B, matching the k/M style of `fmt`). */
		function fmtBytes(n) {
			if (n === void 0 || n === null || isNaN(n) || n < 0) return "—";
			if (n >= 1e6) return (n / 1e6).toFixed(1) + " MB";
			if (n >= 1e3) return (n / 1e3).toFixed(1) + " kB";
			return String(Math.round(n)) + " B";
		}
		/**
		* Cache-hit share of billed prompt-side input (`reads` over `billed`),
		* TRUNCATED to two decimals (cut, not round) — same formula as the harness
		* chat stats line's '缓存命中' figure and the stats board's cell. Null when
		* nothing was billed. The 1e-9 epsilon absorbs only float noise (integer
		* token counts never sit that close to a boundary).
		*/
		function cacheHitPercent$1(reads, billed) {
			if (!(billed > 0)) return null;
			const hundredths = Math.trunc(reads / billed * 1e4 + 1e-9);
			return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, "0")}`;
		}
		function fmtTime(t) {
			const d = new Date(t);
			if (isNaN(d.getTime())) return "—";
			return d.toLocaleTimeString("en-GB", { hour12: false });
		}
		//#endregion
		//#region src/shared/imageTokens.ts
		/**
		* Per-image token estimate for DeepSeek's vision model — a faithful port of
		* the official "图片 Token 计算器" (Image Token Calculator) shipped on the
		* DeepSeek API docs (https://api-docs.deepseek.com/zh-cn/quick_start/token_usage),
		* which implements the provider's own image→token conversion:
		*
		*   - every image is aspect-preserved rescaled before entering the model:
		*     below ~384×384 total pixels it is enlarged, above it is shrunk;
		*   - tokens follow the patch grid (patch 14px, downsample 3), so every
		*     image costs at least 117 and at most ~384 tokens (the documented cap).
		*
		* Verified against the docs calculator itself: 2048×1365→313, 800×600→341,
		* 2048×2048→349, 512×512→201, 100×100→117, 1920×1080→369, 400×900→249.
		* The DSH request pipeline's own 640k-pixel pre-resize does not change the
		* result (the provider formula rescales to the same patch grid), so the
		* durable attachment dimensions can be fed in directly.
		*
		* Pure math shared by the Host fold (message pricing) and the Client
		* (attachment card token badges) — no dependencies, never mutates.
		*/
		const PATCH_SIZE = 14;
		const DOWNSAMPLE_RATIO = 3;
		const MAX_WH_RATIO = 8;
		/** ~384×384 total pixels: smaller images are enlarged before patching. */
		const MIN_PIXELS = 147456;
		const floorDiv = (a, b) => Math.floor(a / b);
		const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);
		function gridTokens(rows, cols) {
			let n = rows * (cols + 1) + 2;
			if (rows % 2 === 1) n += cols + 1;
			n += ceilDiv(rows, 2) * (cols + 1) % 2 * 2;
			return n;
		}
		/** Solve the largest in-grid resize whose token count fits `budget`. */
		function solveResizeRatio(height, width, budget) {
			const ratio = height / width;
			const gridW = Math.sqrt((budget - 2) / ratio + .25) - .5;
			const gridH = gridW * ratio;
			const unit = 42;
			let bestHeight;
			let bestWidth;
			if (gridW < 1) {
				let rows = floorDiv(budget - 2, 2);
				if (rows % 2 === 1) rows -= 1;
				bestWidth = unit;
				bestHeight = rows * unit;
			} else if (gridH < 2) {
				const cols = floorDiv(budget - 2, 2) - 1;
				if (cols <= 1) throw new Error("image tokens: budget too small to solve");
				bestHeight = 84;
				bestWidth = cols * unit;
			} else {
				const cols = Math.trunc(gridW);
				let rows = Math.trunc(gridH);
				if (rows % 2 === 1) rows -= 1;
				const scale = Math.min(cols * unit / width, rows * unit / height);
				bestWidth = Math.trunc(width * scale / PATCH_SIZE) * PATCH_SIZE;
				bestHeight = Math.trunc(height * scale / PATCH_SIZE) * PATCH_SIZE;
			}
			const nLlmH = ceilDiv(floorDiv(bestHeight, PATCH_SIZE), DOWNSAMPLE_RATIO);
			const nLlmW = ceilDiv(floorDiv(bestWidth, PATCH_SIZE), DOWNSAMPLE_RATIO);
			return {
				nLlmH,
				nLlmW,
				bestHeight,
				bestWidth,
				numTokens: gridTokens(nLlmH, nLlmW)
			};
		}
		/** Resize so the patch grid fits the cap, then re-add the pad reserve. */
		function safeResize(height, width, paddedHeight, paddedWidth) {
			const nLlmH = ceilDiv(floorDiv(paddedHeight, PATCH_SIZE), DOWNSAMPLE_RATIO);
			const nLlmW = ceilDiv(floorDiv(paddedWidth, PATCH_SIZE), DOWNSAMPLE_RATIO);
			const pad = 3;
			const budget = 381;
			let result = {
				nLlmH,
				nLlmW,
				bestHeight: paddedHeight,
				bestWidth: paddedWidth,
				numTokens: gridTokens(nLlmH, nLlmW)
			};
			if (result.numTokens > budget) {
				result = solveResizeRatio(height, width, budget);
				let nextBudget = budget;
				while (result.numTokens > budget) {
					nextBudget -= 1;
					result = solveResizeRatio(height, width, nextBudget);
				}
			}
			result.numTokens += pad;
			return result;
		}
		function calcResizeInner(width, height) {
			let w = width;
			let h = height;
			if (w > h * MAX_WH_RATIO) w = h * MAX_WH_RATIO;
			const pixels = w * h;
			if (pixels < MIN_PIXELS && pixels > 0) {
				const scale = Math.sqrt(MIN_PIXELS / pixels);
				w = Math.trunc(w * scale);
				h = Math.trunc(h * scale);
			}
			const paddedWidth = ceilDiv(w, PATCH_SIZE) * PATCH_SIZE;
			const paddedHeight = ceilDiv(h, PATCH_SIZE) * PATCH_SIZE;
			return safeResize(h, w, paddedHeight, paddedWidth);
		}
		/**
		* Estimate the tokens one image consumes in a DeepSeek vision request from its pixel dimensions. Returns null for non-positive/non-finite
		* dimensions or when the official iteration fails to converge — callers fall back to the generic structural price.
		*/
		function estimateImageTokens(width, height) {
			if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
			try {
				let result = calcResizeInner(width, height);
				for (let i = 1; i < 10; i++) {
					const next = calcResizeInner(result.bestWidth, result.bestHeight);
					if (next.nLlmH === result.nLlmH && next.nLlmW === result.nLlmW && next.bestHeight === result.bestHeight && next.bestWidth === result.bestWidth && next.numTokens === result.numTokens) return result.numTokens;
					result = next;
				}
				return null;
			} catch {
				return null;
			}
		}
		//#endregion
		//#region src/client/components/images.tsx
		/**
		* Narrow an unknown content block to a durable image ref: accepts both raw message blocks (`{ type: 'image', attachment }`) and the
		* snapshot's assistant blocks (`{ kind: 'image', attachment }`); everything else null. Lenient on the optional facts — resolveImage reads
		* only attachmentId.
		*/
		function imageRefOf(block) {
			if (block === null || typeof block !== "object") return null;
			const b = block;
			if (b.type !== "image" && b.kind !== "image") return null;
			const a = b.attachment;
			if (a === null || typeof a !== "object") return null;
			const r = a;
			if (typeof r.attachmentId !== "string" || r.attachmentId === "") return null;
			const num = (v) => typeof v === "number" && Number.isFinite(v) && v > 0 ? v : void 0;
			const orig = r.originalDimensions !== null && typeof r.originalDimensions === "object" ? r.originalDimensions : void 0;
			const origDims = orig !== void 0 && num(orig.width) !== void 0 && num(orig.height) !== void 0 ? {
				width: num(orig.width),
				height: num(orig.height)
			} : void 0;
			return {
				attachmentId: r.attachmentId,
				...typeof r.name === "string" && r.name !== "" ? { name: r.name } : {},
				...num(r.bytes) !== void 0 ? { bytes: num(r.bytes) } : {},
				...num(r.width) !== void 0 ? { width: num(r.width) } : {},
				...num(r.height) !== void 0 ? { height: num(r.height) } : {},
				...origDims !== void 0 ? { originalDimensions: origDims } : {}
			};
		}
		/**
		* Document-level original-image preview — the chat history's ImageLightbox recipe (dsh ui-attachment, which the browser module table does
		* not seed) ported onto the plugin's lc-* classes: body portal (a transformed/filtered ancestor cannot trap the fixed backdrop), blurred
		* mask, contain-fit image, circular close, Escape/mask close, focus restored to the opener.
		*/
		function AttachmentLightbox(props) {
			const { src, alt, labels, onClose } = props;
			const closeRef = React.useRef(null);
			const restoreRef = React.useRef(null);
			React.useEffect(() => {
				restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				closeRef.current?.focus();
				const onKeyDown = (event) => {
					if (event.key === "Escape") onClose();
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
					restoreRef.current?.focus();
				};
			}, [onClose]);
			return ReactDOM.createPortal(/* @__PURE__ */ React.createElement("div", {
				className: "lc-att-lightbox",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": labels.dialog
			}, /* @__PURE__ */ React.createElement("div", {
				className: "lc-att-lightbox-mask",
				"aria-hidden": "true",
				onMouseDown: onClose
			}), /* @__PURE__ */ React.createElement("img", {
				className: "lc-att-lightbox-img",
				src,
				alt
			}), /* @__PURE__ */ React.createElement("button", {
				ref: closeRef,
				type: "button",
				className: "lc-att-lightbox-close",
				"aria-label": labels.close,
				onClick: onClose
			}, /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 16 }))), document.body);
		}
		/**
		* One attachment card, the WHOLE card the click target: 64px cover tile + metadata column — Raw (the pre-normalization raster dsh records
		* when normalization reduced the image), Sent (the normalized raster the model receives, with byte size), estimated provider-billed tokens.
		* Click opens the chat-style lightbox; load failures retry on click; unknown facts leave no row.
		*/
		function makeImageCard(kit) {
			const { t, fmt } = kit;
			return function ImageCard(props) {
				const { attachment, load } = props;
				const [src, setSrc] = React.useState(null);
				const [error, setError] = React.useState(false);
				const [attempt, setAttempt] = React.useState(0);
				const [preview, setPreview] = React.useState(false);
				const closePreview = React.useCallback(() => {
					setPreview(false);
				}, []);
				React.useEffect(() => {
					if (load === void 0) return;
					let live = true;
					setError(false);
					setSrc(null);
					load(attachment).then((url) => {
						if (live) setSrc(url);
					}).catch(() => {
						if (live) setError(true);
					});
					return () => {
						live = false;
					};
				}, [
					attachment,
					load,
					attempt
				]);
				const name = attachment.name ?? t("attach.image");
				const dimsOf = (w, h) => w !== void 0 && h !== void 0 ? `${w}×${h}` : null;
				const rows = [];
				const raw = attachment.originalDimensions !== void 0 ? dimsOf(attachment.originalDimensions.width, attachment.originalDimensions.height) : null;
				if (raw !== null) rows.push({
					label: t("attach.raw"),
					value: raw
				});
				const sent = dimsOf(attachment.width, attachment.height);
				if (sent !== null) rows.push({
					label: t("attach.sent"),
					value: attachment.bytes !== void 0 ? `${sent} · ${fmtBytes(attachment.bytes)}` : sent
				});
				const tokens = attachment.width !== void 0 && attachment.height !== void 0 ? estimateImageTokens(attachment.width, attachment.height) : null;
				if (tokens !== null) rows.push({
					label: t("attach.token"),
					value: `≈${fmt(tokens)}`,
					tip: t("attach.tokensTip")
				});
				const activate = () => {
					if (error) {
						setAttempt((a) => a + 1);
						return;
					}
					if (src !== null) setPreview(true);
				};
				return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: "lc-att-item",
					title: error ? t("attach.loadFailed") : t("attach.open"),
					onClick: activate
				}, /* @__PURE__ */ React.createElement("span", { className: "lc-att-thumb" }, src !== null ? /* @__PURE__ */ React.createElement("img", {
					src,
					alt: name
				}) : /* @__PURE__ */ React.createElement("span", { className: error ? "lc-att-err" : "lc-att-ph" }, error ? "⚠" : load === void 0 ? "🖼" : t("attach.loading"))), /* @__PURE__ */ React.createElement("span", { className: "lc-att-meta" }, /* @__PURE__ */ React.createElement("span", {
					className: "lc-att-name",
					title: name
				}, name), rows.map((r) => /* @__PURE__ */ React.createElement("span", {
					key: r.label,
					className: "lc-att-row",
					title: r.tip
				}, /* @__PURE__ */ React.createElement("b", { className: "lc-att-row-label" }, r.label), r.value)))), preview && src !== null && /* @__PURE__ */ React.createElement(AttachmentLightbox, {
					src,
					alt: name,
					labels: {
						dialog: t("attach.preview"),
						close: t("attach.close")
					},
					onClose: closePreview
				}));
			};
		}
		//#endregion
		//#region src/client/components/richText.tsx
		function makeRichText(kit) {
			const { t } = kit;
			function useRichMode() {
				const [mode, setMode] = React.useState("md");
				return [mode, setMode];
			}
			function RichSwitch(props) {
				const seg = (m, label, tip) => /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: "lc-rich-seg-btn" + (props.mode === m ? " lc-rich-seg-on" : ""),
					title: tip,
					onClick: () => {
						props.onPick(m);
					}
				}, label);
				return /* @__PURE__ */ React.createElement("span", { className: "lc-rich-seg" }, seg("raw", t("rich.raw"), t("rich.toRaw")), seg("md", t("rich.md"), t("rich.toMd")));
			}
			function RichText(props) {
				if (props.mode === "md") return /* @__PURE__ */ React.createElement("div", { className: "lc-ts-desc-md" }, /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: props.text }));
				return /* @__PURE__ */ React.createElement("pre", { className: "lc-ts-desc-body" }, props.text);
			}
			return {
				RichText,
				RichSwitch,
				useRichMode
			};
		}
		//#endregion
		//#region src/client/components/browser.tsx
		/** 上下文浏览器单批渲染的 surface 节点数（渐进加载，降低长会话瞬时渲染压力）。 */
		const NODE_PAGE = 30;
		function unionTypesOf(p) {
			const branches = [];
			if (Array.isArray(p.anyOf)) branches.push(...p.anyOf);
			if (Array.isArray(p.oneOf)) branches.push(...p.oneOf);
			if (branches.length === 0) return null;
			const parts = [];
			for (const b of branches) if (b !== null && typeof b === "object") parts.push(typeOf(b));
			return parts.length > 0 ? parts.join(" | ") : null;
		}
		function typeOf(p) {
			const u = unionTypesOf(p);
			if (u !== null) return u;
			const t = p.type;
			if (t === "array") {
				const items = p.items;
				if (items !== null && typeof items === "object") return "array<" + typeOf(items) + ">";
				return "array";
			}
			if (typeof t === "string") {
				if (t === "object") {
					const props = p.properties;
					if (props !== null && typeof props === "object" && Object.keys(props).length > 0) return `object{${Object.keys(props).length}}`;
				}
				if (Array.isArray(p.enum) && p.enum.length > 0) return t + " (enum)";
				return t;
			}
			if (Array.isArray(p.enum) && p.enum.length > 0) return "(enum)";
			return "unknown";
		}
		/**
		* Tool schemas nest parameters under `parameters`, `input_schema`, or `inputSchema` (producer-dependent), or bare when `type === 'object'`
		* — `{type:'object', properties}` at the root is itself the parameter object.
		*/
		function paramsOf(schema) {
			if (schema === null || typeof schema !== "object") return null;
			const s = schema;
			const candidate = (v) => v !== null && typeof v === "object" ? v : null;
			const nested = candidate(s.parameters) ?? candidate(s.input_schema) ?? candidate(s.inputSchema);
			if (nested !== null) return nested;
			if (s.type === "object" && s.properties !== void 0 && typeof s.properties === "object") return s;
			return null;
		}
		function ParamRow(props) {
			const typeLabel = typeOf(props.schema);
			const desc = props.schema.description;
			return /* @__PURE__ */ React.createElement("div", { className: "lc-ts-param-row" }, /* @__PURE__ */ React.createElement("span", { className: "lc-ts-param-name" }, props.name), /* @__PURE__ */ React.createElement("span", { className: "lc-ts-param-type" }, typeLabel), /* @__PURE__ */ React.createElement("span", { className: props.required ? "lc-ts-param-req" : "lc-ts-param-req-off" }, props.required ? "✓" : "·"), typeof desc === "string" && desc !== "" ? /* @__PURE__ */ React.createElement("span", { className: "lc-ts-param-desc" }, desc) : null);
		}
		/**
		* Section — the ONE detail chrome of the browser: every expanded element is a stack of these (labeled head + body), so the reader scans one
		* repeating anatomy per content kind.
		*/
		function Section(props) {
			const right = props.actions !== void 0 || props.meta !== void 0;
			return /* @__PURE__ */ React.createElement("div", { className: "lc-ts-card" }, /* @__PURE__ */ React.createElement("div", { className: "lc-ts-card-head" }, /* @__PURE__ */ React.createElement("b", { className: props.labelClass }, props.label), right ? /* @__PURE__ */ React.createElement("span", { className: "lc-ts-card-right" }, props.meta ?? null, props.actions ?? null) : null, props.count !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-ts-card-count" }, props.count) : null), props.children);
		}
		function TextSection(props) {
			const { rich } = props;
			const [mode, setMode] = rich.useRichMode();
			return /* @__PURE__ */ React.createElement(Section, {
				label: props.label,
				actions: /* @__PURE__ */ React.createElement(rich.RichSwitch, {
					mode,
					onPick: setMode
				}),
				meta: props.meta
			}, /* @__PURE__ */ React.createElement(rich.RichText, {
				text: props.text,
				mode
			}));
		}
		function RawSection(props) {
			return /* @__PURE__ */ React.createElement(Section, { label: props.label }, /* @__PURE__ */ React.createElement("pre", { className: "lc-ts-desc-body lc-br-dim" }, props.text));
		}
		/**
		* Full tool-row body: description, parsed parameter table (when the schema carries one), raw JSON behind a per-row toggle — the JSON open
		* state is per-row so two expanded tools stay independent.
		*/
		function ToolSchema(props) {
			const { rich } = props;
			const [jsonOpen, setJsonOpen] = React.useState(false);
			const params = React.useMemo(() => paramsOf(props.schema), [props.schema]);
			const rows = React.useMemo(() => {
				if (params === null) return [];
				const props = params.properties;
				if (props === null || typeof props !== "object") return [];
				const req = Array.isArray(params.required) ? new Set(params.required.filter((x) => typeof x === "string")) : /* @__PURE__ */ new Set();
				const out = [];
				for (const k of Object.keys(props)) {
					const v = props[k];
					if (v === null || typeof v !== "object") continue;
					out.push({
						name: k,
						schema: v,
						required: req.has(k)
					});
				}
				return out;
			}, [params]);
			const schemaJson = React.useMemo(() => props.schema !== void 0 ? JSON.stringify(props.schema, null, 2) : "", [props.schema]);
			return /* @__PURE__ */ React.createElement(React.Fragment, null, props.description !== void 0 ? /* @__PURE__ */ React.createElement(TextSection, {
				label: props.labels.desc,
				text: props.description,
				rich
			}) : null, params !== null && rows.length > 0 ? /* @__PURE__ */ React.createElement(Section, {
				label: props.labels.title,
				count: rows.length
			}, rows.map((r) => /* @__PURE__ */ React.createElement(ParamRow, {
				key: r.name,
				name: r.name,
				schema: r.schema,
				required: r.required
			}))) : params !== null ? /* @__PURE__ */ React.createElement("div", { className: "lc-ts-params-empty" }, props.labels.empty) : null, schemaJson !== "" ? /* @__PURE__ */ React.createElement("div", { className: "lc-ts-json" }, /* @__PURE__ */ React.createElement("button", {
				type: "button",
				className: "lc-ts-json-toggle",
				onClick: () => {
					setJsonOpen((o) => !o);
				}
			}, (jsonOpen ? "▾ " : "▸ ") + (jsonOpen ? props.labels.hide : props.labels.show)), jsonOpen ? /* @__PURE__ */ React.createElement("pre", { className: "lc-ts-desc-body lc-br-dim" }, schemaJson) : null) : null);
		}
		/**
		* Both block vocabularies normalize here — raw durable blocks (`type`: text/reasoning/tool-call/tool-result/image) and snapshot assistant
		* blocks (`kind`: text/reasoning/tool-call/image, argsRaw). Consecutive images group into one grid; tool-result payloads carry the Raw/MD
		* switch + line count; nested tool-result blocks flatten into the same flow.
		*/
		function BlocksBody(props) {
			const { rich, img, labels } = props;
			const out = [];
			let images = [];
			const flushImages = () => {
				if (images.length === 0) return;
				const group = images;
				images = [];
				out.push(/* @__PURE__ */ React.createElement(Section, {
					key: "img" + String(out.length),
					label: labels.images,
					count: group.length
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-att-grid" }, group.map((a, i) => /* @__PURE__ */ React.createElement(img.Card, {
					key: `${a.attachmentId}:${i}`,
					attachment: a,
					load: img.load
				})))));
			};
			for (const b of props.blocks) {
				const image = imageRefOf(b);
				if (image !== null) {
					images.push(image);
					continue;
				}
				flushImages();
				const blk = b !== null && typeof b === "object" ? b : null;
				const blockKind = blk !== null ? typeof blk.type === "string" ? blk.type : typeof blk.kind === "string" ? blk.kind : "" : "";
				if ((blockKind === "text" || blockKind === "reasoning") && typeof blk?.text === "string") {
					const label = blockKind === "reasoning" ? labels.thinking : props.textLabel;
					out.push(/* @__PURE__ */ React.createElement(TextSection, {
						key: out.length,
						label,
						text: blk.text,
						rich,
						meta: props.textLabel === labels.result ? /* @__PURE__ */ React.createElement("span", { className: "lc-ts-card-meta" }, labels.lines(blk.text.split("\n").length)) : void 0
					}));
					continue;
				}
				if (blockKind === "tool-call") {
					out.push(/* @__PURE__ */ React.createElement(ToolCallCard, {
						key: out.length,
						name: typeof blk?.name === "string" ? blk.name : "?",
						argsRaw: blk?.argsRaw ?? blk?.arguments
					}));
					continue;
				}
				if (blockKind === "tool-result" && Array.isArray(blk?.content)) {
					out.push(/* @__PURE__ */ React.createElement(BlocksBody, {
						key: out.length,
						blocks: blk.content,
						richable: false,
						textLabel: labels.result,
						rich,
						img,
						labels
					}));
					continue;
				}
				out.push(/* @__PURE__ */ React.createElement(RawSection, {
					key: out.length,
					label: labels.other,
					text: JSON.stringify(b, null, 2)
				}));
			}
			flushImages();
			return /* @__PURE__ */ React.createElement(React.Fragment, null, out);
		}
		/**
		* The trailing status markers dsh shell tools append at the END of a result's text while `isError` stays false
		* (the status is result data, per tool-bash's render: "non-zero exits are reported, not errored"):
		* - one-shot bash/pwsh: `[exit code: N]` (non-zero only), `[killed by signal: X]`
		* - persistent shells: `[shell killed by signal: X]`, `[shell exited: code N]` — riding LAST, after the
		*   `[exit code: N]` of the command whose failure killed the shell, so the command marker is re-checked
		*   on the preceding text
		* - job_output: `[status: killed]` / `[status: failed, detail]` — the tool-jobs status line always terminates
		*   the read; a killed/failed background job settles with `isError` false, so only the line flags the loss
		* End-anchored like dsh's own parseExitStatus, so marker text quoted inside the output (e.g. a cat'ed log)
		* is not a failure. A clean shell exit (code 0 or code-less) or a live/completed job status is a notice,
		* not a failure.
		* The parsed exit code feeds the FAILED run-state pill.
		*/
		function tailStatusOf(conv) {
			if (conv === void 0 || !Array.isArray(conv.content)) return {
				fail: false,
				exit: null
			};
			for (const b of conv.content) {
				const text = b?.text;
				if (typeof text !== "string") continue;
				const tail = text.trimEnd();
				const shell = /\[(shell killed by signal: [^\]\n]+|shell exited(?:: code \d+)?)\]$/.exec(tail);
				if (shell !== null) {
					const cmdExit = /\[exit code:\s*(\d+)\]\s*$/.exec(tail.slice(0, shell.index));
					if (cmdExit !== null) return {
						fail: true,
						exit: Number(cmdExit[1])
					};
					const code = /: code (\d+)$/.exec(shell[1]);
					if (code !== null) return {
						fail: code[1] !== "0",
						exit: code[1] === "0" ? null : Number(code[1])
					};
					return {
						fail: shell[1].startsWith("shell killed"),
						exit: null
					};
				}
				const exit = /\[exit code:\s*(\d+)\]$/.exec(tail);
				if (exit !== null) return {
					fail: true,
					exit: Number(exit[1])
				};
				if (/\[killed by signal: [^\]\n]+\]$/.test(tail)) return {
					fail: true,
					exit: null
				};
				if (/\[status: (?:killed|failed)(?:, [^\]\n]*)?\]$/.test(tail)) return {
					fail: true,
					exit: null
				};
			}
			return {
				fail: false,
				exit: null
			};
		}
		/**
		* A tool result's failure: the fold-stamped `err` or the snapshot's `isError` (infrastructure failures — dsh stamps
		* those) OR a trailing status marker (see tailStatusOf). dsh settles a failing COMMAND as a completed call, so the
		* marker is the only failure signal — mirroring the chat row's terminalFailed. A timeout stays a notice, as in the chat.
		*/
		function toolErrOf(node, conv) {
			const tail = tailStatusOf(conv);
			return {
				err: node.err === true || conv?.isError === true || tail.fail,
				exit: tail.exit
			};
		}
		function ToolCallCard(props) {
			const args = React.useMemo(() => parseCallArgs(props.argsRaw), [props.argsRaw]);
			return /* @__PURE__ */ React.createElement(Section, {
				label: (props.arrow ?? "→") + " " + props.name,
				labelClass: "lc-ts-call-name",
				meta: props.status
			}, args !== null ? Object.keys(args).map((k) => /* @__PURE__ */ React.createElement(CallArgRow, {
				key: k,
				name: k,
				value: args[k]
			})) : typeof props.argsRaw === "string" && props.argsRaw !== "" ? /* @__PURE__ */ React.createElement("pre", { className: "lc-ts-desc-body lc-br-dim" }, props.argsRaw) : null);
		}
		function CallArgRow(props) {
			const v = props.value;
			const text = typeof v === "string" ? v : v === void 0 ? "" : JSON.stringify(v);
			return /* @__PURE__ */ React.createElement("div", { className: "lc-ts-arg-row" }, /* @__PURE__ */ React.createElement("span", { className: "lc-ts-param-name" }, props.name), /* @__PURE__ */ React.createElement("span", { className: "lc-ts-arg-val" }, text));
		}
		function NodeContent(props) {
			const { node, conv, rich, img, labels } = props;
			if (conv === void 0) {
				if (node.text === void 0 || node.text === "") return /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, props.hint);
				return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TextSection, {
					label: labels.content,
					text: node.text,
					rich
				}), /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, props.hint));
			}
			if (conv.kind === "assistant" && Array.isArray(conv.blocks)) return /* @__PURE__ */ React.createElement(BlocksBody, {
				blocks: conv.blocks,
				richable: true,
				textLabel: labels.answer,
				rich,
				img,
				labels
			});
			if (conv.kind === "tool-result") {
				const { err, exit } = toolErrOf(node, conv);
				return /* @__PURE__ */ React.createElement(React.Fragment, null, conv.call != null ? /* @__PURE__ */ React.createElement(ToolCallCard, {
					arrow: "←",
					name: conv.call.name,
					argsRaw: conv.call.argsRaw,
					status: labels.callState(err, exit)
				}) : null, Array.isArray(conv.content) ? /* @__PURE__ */ React.createElement(BlocksBody, {
					blocks: conv.content,
					richable: false,
					textLabel: labels.result,
					rich,
					img,
					labels
				}) : null);
			}
			if (conv.kind === "compaction") return typeof conv.summary === "string" && conv.summary !== "" ? /* @__PURE__ */ React.createElement(TextSection, {
				label: labels.summary,
				text: conv.summary,
				rich
			}) : /* @__PURE__ */ React.createElement(React.Fragment, null);
			if (Array.isArray(conv.content)) return /* @__PURE__ */ React.createElement(BlocksBody, {
				blocks: conv.content,
				richable: true,
				textLabel: labels.content,
				rich,
				img,
				labels
			});
			return /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, props.hint);
		}
		function byCatOf(asm) {
			const m = {};
			for (const n of asm.nodes) (m[n.cat] ??= []).push(n);
			return m;
		}
		function countOf(asm, byCat, c) {
			if (c === "system") return asm.header !== null && asm.header.system !== void 0 ? 1 : 0;
			if (c === "tools") return asm.header !== null ? asm.header.tools.length : 0;
			return byCat[c]?.length ?? 0;
		}
		function lastOfTurn(requests, turn) {
			for (let i = requests.length - 1; i >= 0; i--) if ((requests[i].turn ?? 0) === turn) return requests[i];
			return null;
		}
		function makeContextBrowser(kit, StackedBar) {
			const { t, fmt, fmtTime, catLabel } = kit;
			const nodeText = makeNodeText(kit);
			const rich = makeRichText(kit);
			const ImageCard = makeImageCard(kit);
			const MAX_AUTO_PAGES = 20;
			return function ContextBrowser(props) {
				const { data, headers } = props;
				const [sel, setSel] = React.useState("live");
				const [openCat, setOpenCat] = React.useState(null);
				const [openElem, setOpenElem] = React.useState(null);
				const [maxNodes, setMaxNodes] = React.useState(NODE_PAGE);
				const convNodes = typeof props.useSession === "function" ? props.useSession((s) => s.nodes) : void 0;
				const bySeq = React.useMemo(() => {
					const m = /* @__PURE__ */ new Map();
					for (const n of convNodes ?? []) m.set(n.seq, n);
					return m;
				}, [convNodes]);
				const hasMore = typeof props.useSession === "function" ? props.useSession((s) => s.hasMore === true) : false;
				const loadingOlder = typeof props.useSession === "function" ? props.useSession((s) => s.loadingOlder === true) : false;
				const openSeq = openElem !== null && openElem.startsWith("n") ? Number(openElem.slice(1)) : null;
				const missingSeq = openSeq !== null && !bySeq.has(openSeq) ? openSeq : null;
				const [exhausted, setExhausted] = React.useState(false);
				const pagesRef = React.useRef(0);
				React.useEffect(() => {
					pagesRef.current = 0;
					setExhausted(false);
				}, [openElem]);
				const loadOlderHistory = props.loadOlderHistory;
				React.useEffect(() => {
					if (missingSeq === null || !hasMore || loadingOlder || exhausted) return;
					if (loadOlderHistory === void 0) return;
					if (pagesRef.current >= MAX_AUTO_PAGES) {
						setExhausted(true);
						return;
					}
					pagesRef.current += 1;
					loadOlderHistory();
				}, [
					missingSeq,
					hasMore,
					loadingOlder,
					exhausted,
					bySeq,
					loadOlderHistory
				]);
				React.useEffect(() => {
					if (!hasMore && missingSeq !== null && !exhausted) setExhausted(true);
				}, [
					hasMore,
					missingSeq,
					exhausted
				]);
				const pinSeq = props.pinSeq;
				React.useEffect(() => {
					setSel(pinSeq === null || pinSeq === void 0 ? "live" : pinSeq);
					setOpenCat(null);
					setOpenElem(null);
				}, [pinSeq]);
				const toolFocus = props.toolFocus;
				React.useEffect(() => {
					if (toolFocus === null || toolFocus === void 0) return;
					setSel("live");
					setOpenCat("tools");
					setOpenElem(toolFocus.tool !== void 0 ? "tool:" + toolFocus.tool : null);
					if (props.onToolFocusHandled !== void 0) props.onToolFocusHandled();
				}, [toolFocus, props.onToolFocusHandled]);
				const rootRef = React.useRef(null);
				const focusScrollRef = React.useRef(false);
				const nodeFocus = props.nodeFocus;
				React.useEffect(() => {
					if (nodeFocus === null || nodeFocus === void 0) return;
					setSel(nodeFocus.step);
					setOpenCat(nodeFocus.cat);
					setOpenElem("n" + String(nodeFocus.seq));
					focusScrollRef.current = true;
					if (props.onNodeFocusHandled !== void 0) props.onNodeFocusHandled();
				}, [nodeFocus, props.onNodeFocusHandled]);
				React.useLayoutEffect(() => {
					if (!focusScrollRef.current) return;
					focusScrollRef.current = false;
					rootRef.current?.querySelector(".lc-br-elem-on")?.scrollIntoView({ block: "nearest" });
				});
				const awaiting = missingSeq !== null && !exhausted && loadOlderHistory !== void 0 && hasMore;
				const requests = data.requests;
				const hoverReq = props.previewSeq !== null && props.previewSeq !== void 0 ? requests.find((r) => r.seq === props.previewSeq) ?? null : null;
				const req = hoverReq ?? (sel === "live" ? null : requests.find((r) => r.seq === sel) ?? null);
				const seq = req !== null ? req.seq : null;
				const linked = req === null && props.onHoverKey !== void 0;
				const linkKey = linked && props.hoverKey !== null && props.hoverKey !== "free" ? props.hoverKey : null;
				const view = assemble(data, headers, seq);
				const breakdown = req !== null ? req : data.current;
				const parts = partsOf(breakdown);
				const total = breakdown.total;
				const pick = (v) => {
					setSel(v === "live" ? "live" : Number(v));
					setOpenCat(null);
					setOpenElem(null);
				};
				const refReq = req === null ? requests.length > 0 ? requests[requests.length - 1] : null : lastOfTurn(requests, (req.turn ?? 0) - 1);
				const prevView = refReq !== null ? assemble(data, headers, refReq.seq) : null;
				const prevByCat = prevView !== null ? byCatOf(prevView) : null;
				const byCat = byCatOf(view);
				const toolCount = (c) => countOf(view, byCat, c);
				const toggleCat = (c) => {
					if (!(toolCount(c) > 0 || (c === "system" || c === "tools") && view.header === null)) return;
					setOpenCat(openCat === c ? null : c);
					setOpenElem(null);
				};
				const toggleElem = (key) => {
					setOpenElem(openElem === key ? null : key);
				};
				/**
				* Expandable element row; `err` rows carry the red run-state dot right after the chevron (the chat's failed-tool marker) so a failed
				* result scans while collapsed.
				*/
				const elemRow = (key, tag, preview, tokens, time, body, err = false) => {
					const open = openElem === key;
					return /* @__PURE__ */ React.createElement("div", {
						key,
						className: "lc-br-elem" + (open ? " lc-br-elem-on" : "")
					}, /* @__PURE__ */ React.createElement("button", {
						type: "button",
						className: "lc-br-elem-row",
						onClick: () => {
							toggleElem(key);
						}
					}, /* @__PURE__ */ React.createElement("span", { className: "lc-br-chev" + (open ? " lc-br-chev-on" : "") }, "▸"), err ? /* @__PURE__ */ React.createElement("span", {
						className: "lc-br-err-dot",
						title: t("node.failed")
					}) : null, tag !== null ? /* @__PURE__ */ React.createElement("span", { className: "lc-br-tag" }, tag) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-br-preview" }, preview), time !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-br-time" }, fmtTime(time)) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-br-tokens" }, "≈" + fmt(tokens))), open ? /* @__PURE__ */ React.createElement("div", { className: "lc-br-content" }, body) : null);
				};
				const catBody = (c) => {
					if (c === "system") {
						if (view.header === null) return /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, t(headers === null ? "browser.noHeader" : "browser.noEpoch"));
						const system = view.header.system;
						if (system === void 0) return null;
						return elemRow("sys", null, system.replace(/\s+/g, " ").trim().slice(0, 80), breakdown.system, void 0, /* @__PURE__ */ React.createElement(TextSection, {
							label: catLabel("system"),
							text: system,
							rich
						}));
					}
					if (c === "tools") {
						if (view.header === null) return /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, t(headers === null ? "browser.noHeader" : "browser.noEpoch"));
						const labels = {
							desc: t("tool.desc"),
							title: t("tool.params"),
							empty: t("tool.paramsEmpty"),
							show: t("tool.jsonToggle"),
							hide: t("tool.jsonHide")
						};
						return view.header.tools.slice().sort((a, b) => b.tokens - a.tokens).map((tool) => {
							return elemRow("tool:" + tool.name, null, tool.name, tool.tokens, void 0, /* @__PURE__ */ React.createElement(ToolSchema, {
								description: tool.description,
								schema: tool.schema,
								rich,
								labels
							}));
						});
					}
					const allNodes = (byCat[c] ?? []).slice().reverse();
					const visibleNodes = allNodes.slice(0, maxNodes);
					return /* @__PURE__ */ React.createElement(React.Fragment, null, visibleNodes.map((n) => {
						const conv = bySeq.get(n.seq);
						const rowErr = n.cat === "tool" && toolErrOf(n, conv).err;
						let tag = null;
						let preview = nodeText(n);
						if (n.cat === "tool") {
							tag = n.skill ? t("node.skillTag", { name: n.skill }) : n.tool ?? "?";
							preview = callSummaryOf(conv) ?? t("node.toolResult");
						} else if (n.cat === "assistant" && Array.isArray(n.calls) && n.calls.length > 0) {
							tag = n.calls.join(" › ");
							preview = (n.text !== void 0 && n.text !== "" ? n.text : null) ?? blockSummaryOf(conv) ?? t("node.empty");
						} else if (n.cat === "assistant" && (n.text === void 0 || n.text === "")) preview = blockSummaryOf(conv) ?? preview;
						else if (n.cat === "user") {
							const imgCount = conv !== void 0 && Array.isArray(conv.content) ? conv.content.filter((b) => imageRefOf(b) !== null).length : 0;
							if (imgCount > 0 && openElem !== `n${n.seq}`) tag = t("attach.image") + (imgCount > 1 ? " ×" + String(imgCount) : "");
						} else if (n.cat === "inject" && !n.skill) {
							tag = t("form." + (n.form || "context"));
							if (n.text !== void 0 && n.text !== "") preview = n.form === "snapshot" ? t("node.snapshot") + n.text : n.text;
						}
						return elemRow(`n${n.seq}`, tag, preview, n.tokens, n.time, /* @__PURE__ */ React.createElement(NodeContent, {
							node: n,
							conv,
							rich,
							img: {
								Card: ImageCard,
								load: props.loadImage
							},
							labels: {
								thinking: t("block.thinking"),
								answer: t("block.answer"),
								content: t("block.content"),
								result: t("block.result"),
								summary: t("block.summary"),
								images: t("attach.images"),
								other: t("attach.other"),
								lines: (n) => t(n === 1 ? "block.line" : "block.lines", { n }),
								callState: (err, exit) => /* @__PURE__ */ React.createElement("span", { className: "lc-ts-call-state " + (err ? "lc-ts-call-err" : "lc-ts-call-ok") }, /* @__PURE__ */ React.createElement("i", null), err ? t("call.fail") + (exit !== null ? " · " + t("call.exit", { n: exit }) : "") : t("call.ok"))
							},
							hint: conv === void 0 && awaiting ? t("browser.loading") : t("browser.noContent")
						}), rowErr);
					}), allNodes.length > visibleNodes.length && /* @__PURE__ */ React.createElement("button", {
						type: "button",
						className: "lc-br-more",
						onClick: () => setMaxNodes((prev) => prev + NODE_PAGE)
					}, "加载更多（剩余 ", allNodes.length - visibleNodes.length, " 条）"));
				};
				return /* @__PURE__ */ React.createElement("div", {
					className: "lc-card",
					ref: rootRef
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("browser.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-br-hint" }, t("browser.deltaHint")), /* @__PURE__ */ React.createElement("select", {
					className: "lc-br-pick",
					value: seq === null ? "live" : String(seq),
					onChange: (e) => {
						pick(e.target.value);
					}
				}, /* @__PURE__ */ React.createElement("option", { value: "live" }, t("browser.live")), requests.slice().reverse().map((r) => /* @__PURE__ */ React.createElement("option", {
					key: r.seq,
					value: String(r.seq)
				}, t("detail.step", {
					t: r.turn ?? 0,
					s: r.step ?? 0
				}) + " · " + fmtTime(r.time))))), /* @__PURE__ */ React.createElement("div", { className: "lc-br-meta" }, /* @__PURE__ */ React.createElement("b", null, req !== null ? t("detail.step", {
					t: req.turn ?? 0,
					s: req.step ?? 0
				}) : t("browser.liveNow")), req !== null ? /* @__PURE__ */ React.createElement("span", null, fmtTime(req.time)) : null, hoverReq !== null ? /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, t("browser.preview")) : null, /* @__PURE__ */ React.createElement("span", null, t("detail.estTotal", { n: fmt(total) })), req !== null && req.prompt !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-actual" }, t("detail.actual", { n: fmt(req.prompt) })) : null), /* @__PURE__ */ React.createElement("div", { className: "lc-br-bar" }, /* @__PURE__ */ React.createElement(StackedBar, {
					parts,
					height: 10,
					hoverKey: linked ? linkKey : void 0,
					onHoverKey: linked ? props.onHoverKey : void 0,
					tip: false
				})), view.missingLive > 0 ? /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, t("browser.missingLive", { n: view.missingLive })) : null, view.approximate ? /* @__PURE__ */ React.createElement("div", { className: "lc-br-note" }, t("browser.approx")) : null, /* @__PURE__ */ React.createElement("div", { className: "lc-br-cats" }, CATS.map((c) => {
					const count = toolCount(c.key);
					const v = breakdown[c.key] || 0;
					const prevCount = prevView !== null && prevByCat !== null ? countOf(prevView, prevByCat, c.key) : null;
					const countDelta = prevCount !== null ? count - prevCount : null;
					const prevTokens = refReq !== null ? refReq[c.key] || 0 : null;
					const tokenDelta = prevTokens !== null ? v - prevTokens : null;
					const openable = count > 0 || (c.key === "system" || c.key === "tools") && view.header === null;
					const open = openCat === c.key && openable;
					return /* @__PURE__ */ React.createElement("div", {
						key: c.key,
						className: "lc-br-cat" + (openable ? "" : " lc-br-cat-empty")
					}, /* @__PURE__ */ React.createElement("button", {
						type: "button",
						className: "lc-br-cat-row" + (linked && props.hoverKey === c.key ? " lc-br-cat-on" : ""),
						onMouseEnter: linked ? () => {
							if (props.onHoverKey !== void 0) props.onHoverKey(c.key);
						} : void 0,
						onMouseLeave: linked ? () => {
							if (props.onHoverKey !== void 0) props.onHoverKey(null);
						} : void 0,
						onClick: () => {
							toggleCat(c.key);
						}
					}, /* @__PURE__ */ React.createElement("span", { className: "lc-br-chev" + (open ? " lc-br-chev-on" : "") }, "▸"), /* @__PURE__ */ React.createElement("i", { style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", { className: "lc-br-cat-label" }, catLabel(c.key)), /* @__PURE__ */ React.createElement("span", { className: "lc-br-count-grp" }, /* @__PURE__ */ React.createElement("span", { className: "lc-br-cat-count" }, t("browser.items", { n: count })), countDelta !== null && countDelta !== 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-br-delta lc-br-delta-" + (countDelta > 0 ? "up" : "down") }, `${countDelta > 0 ? "+" : ""}${countDelta}`) : null), /* @__PURE__ */ React.createElement("span", { className: "lc-br-tokens-grp" }, tokenDelta !== null && tokenDelta !== 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-br-tdelta lc-br-tdelta-" + (tokenDelta > 0 ? "up" : "down") }, (tokenDelta > 0 ? "+" : "") + fmt(tokenDelta)) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-br-tokens" }, "≈" + fmt(v))), /* @__PURE__ */ React.createElement("span", { className: "lc-br-pct" }, total > 0 ? `${Math.round(v / total * 100)}%` : "")), open ? /* @__PURE__ */ React.createElement("div", { className: "lc-br-body" }, catBody(c.key)) : null);
				})));
			};
		}
		//#endregion
		//#region src/client/components/stackedBar.tsx
		/**
		* Mirror of dsh-compaction-basic's default `thresholdRatio` (0.8): it compacts at step boundaries once `floor(contextWindow × ratio)` is
		* reached; DSH does not publish the configured ratio to plugins/clients, so the reserve band mirrors the default — deployments tuning
		* `thresholdRatio`/`modelPolicies` should adjust it to match.
		*/
		const AUTO_COMPACT_RATIO = .8;
		function makeStackedBar(kit) {
			const { t, fmt, catLabel } = kit;
			return function StackedBar(props) {
				const [reserveOn, setReserveOn] = React.useState(false);
				let total = 0;
				for (const p of props.parts) total += p.value;
				const scale = props.max !== void 0 && props.max > total ? props.max : total;
				const free = props.max !== void 0 && props.max > total ? props.max - total : 0;
				const usedPct = scale > 0 ? total / scale * 100 : 0;
				const hovering = props.hoverKey !== null && props.hoverKey !== void 0;
				const showBox = free > 0 && hovering;
				const reserve = props.reserve !== void 0 && props.max !== void 0 && props.max > 0 ? {
					...props.reserve,
					max: props.max
				} : null;
				const reserveLeft = reserve !== null ? Math.round(reserve.max * reserve.ratio / scale * 1e3) / 10 : 0;
				const reserveWidth = reserve !== null ? Math.round((1 - reserve.ratio) * reserve.max / scale * 1e3) / 10 : 0;
				let tip = null;
				if (reserveOn && reserve !== null) tip = {
					text: reserve.label,
					leftPct: Math.max(12, Math.min(reserveLeft + reserveWidth / 2, 88))
				};
				else if (props.hoverKey !== null && props.hoverKey !== void 0) {
					if (props.hoverKey === "free" && free > 0) {
						const pct = scale > 0 ? free / scale * 100 : 0;
						tip = {
							text: `${t("overview.free")} ${fmt(free)} (${Math.round(pct)}%)`,
							leftPct: Math.max(12, Math.min(total / scale * 100 + pct / 2, 88))
						};
					} else {
						let acc = 0;
						let rawTotal = 0;
						for (const p of props.parts) rawTotal += p.raw ?? p.value;
						for (const p of props.parts) {
							const pct = scale > 0 ? p.value / scale * 100 : 0;
							if (p.key === props.hoverKey && p.value > 0) {
								const count = p.raw ?? p.value;
								tip = {
									text: `${catLabel(p.key)} ≈${fmt(count)} (${rawTotal > 0 ? Math.round(count / rawTotal * 100) : 0}%) ` + t("overview.ofUsed"),
									leftPct: Math.max(12, Math.min(acc + pct / 2, 88))
								};
								break;
							}
							acc += pct;
						}
					}
				}
				return /* @__PURE__ */ React.createElement("div", { className: "lc-stacked-wrap" }, /* @__PURE__ */ React.createElement("div", {
					className: "lc-stacked" + (hovering ? " lc-stacked-dim" : ""),
					style: { height: `${props.height || 14}px` },
					onMouseLeave: () => {
						if (props.onHoverKey !== void 0) props.onHoverKey(null);
						setReserveOn(false);
					}
				}, total > 0 ? props.parts.map((p) => {
					if (!p.value) return null;
					const on = props.hoverKey !== void 0 && props.hoverKey === p.key;
					return /* @__PURE__ */ React.createElement("div", {
						key: p.key,
						className: "lc-stacked-seg" + (on ? " lc-stacked-seg-on" : ""),
						style: {
							width: `${p.value / scale * 100}%`,
							background: p.color
						},
						onMouseEnter: () => {
							if (props.onHoverKey !== void 0) props.onHoverKey(p.key);
						}
					});
				}) : null, free > 0 ? /* @__PURE__ */ React.createElement("div", {
					key: "free",
					className: "lc-stacked-free" + (props.hoverKey === "free" ? " lc-stacked-free-on" : ""),
					style: { width: `${free / scale * 100}%` },
					onMouseEnter: () => {
						if (props.onHoverKey !== void 0) props.onHoverKey("free");
					}
				}) : null, reserve !== null ? /* @__PURE__ */ React.createElement("div", {
					className: "lc-reserve",
					style: {
						left: `${reserveLeft}%`,
						width: `${reserveWidth}%`
					},
					onMouseEnter: () => {
						setReserveOn(true);
						if (props.onHoverKey !== void 0) props.onHoverKey(null);
					},
					onMouseLeave: () => {
						setReserveOn(false);
					}
				}) : null, /* @__PURE__ */ React.createElement("div", {
					className: "lc-occupied-box" + (showBox ? " lc-occupied-box-on" : ""),
					style: { width: `${usedPct}%` }
				})), props.tip !== false ? /* @__PURE__ */ React.createElement("div", {
					className: "lc-bar-tip" + (tip ? " lc-bar-tip-on" : ""),
					style: { left: tip ? `${tip.leftPct}%` : "50%" }
				}, tip ? tip.text : "") : null);
			};
		}
		function makeLegend(kit) {
			const { t, fmt, catLabel } = kit;
			return function Legend(props) {
				let total = 0;
				for (const p of props.parts) total += p.raw ?? p.value;
				return /* @__PURE__ */ React.createElement("div", { className: "lc-legend" }, props.parts.map((p) => {
					const count = p.raw ?? p.value;
					const on = props.hoverKey !== void 0 && props.hoverKey === p.key;
					return /* @__PURE__ */ React.createElement("span", {
						key: p.key,
						className: "lc-chip" + (on ? " lc-chip-on" : ""),
						title: t("overview.ofUsed"),
						onMouseEnter: () => {
							if (props.onHoverKey !== void 0) props.onHoverKey(p.key);
						},
						onMouseLeave: () => {
							if (props.onHoverKey !== void 0) props.onHoverKey(null);
						}
					}, /* @__PURE__ */ React.createElement("i", { style: { background: p.color } }), /* @__PURE__ */ React.createElement("span", { className: "lc-chip-label" }, catLabel(p.key)), /* @__PURE__ */ React.createElement("span", { className: "lc-chip-nums" }, "≈" + fmt(count), total > 0 ? /* @__PURE__ */ React.createElement("em", null, `${Math.round(count / total * 100)}%`) : null));
				}));
			};
		}
		//#endregion
		//#region src/client/components/currentComposition.tsx
		function makeCurrentComposition(kit, StackedBar, Legend) {
			const { t, fmt } = kit;
			return function CurrentComposition(props) {
				const head = props.head;
				const reserve = head.window != null && head.window > 0 ? {
					ratio: AUTO_COMPACT_RATIO,
					label: t("overview.compactReserve", { pct: Math.round(AUTO_COMPACT_RATIO * 100) })
				} : void 0;
				return /* @__PURE__ */ React.createElement("div", { className: "lc-card" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("overview.title")), props.subtitle !== void 0 && props.subtitle !== "" ? /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, props.subtitle) : null), /* @__PURE__ */ React.createElement("div", { className: "lc-overview-num" }, /* @__PURE__ */ React.createElement("b", null, fmt(head.tokens)), /* @__PURE__ */ React.createElement("span", null, head.window ? " / " + fmt(head.window) + " tokens" : " " + t("overview.estimate")), head.pct !== null ? /* @__PURE__ */ React.createElement("span", { className: "lc-overview-pct" }, /* @__PURE__ */ React.createElement("b", null, `${head.pct}%`), t("overview.used")) : null), /* @__PURE__ */ React.createElement(StackedBar, {
					parts: head.parts,
					height: 16,
					max: head.window,
					hoverKey: props.hoverKey,
					onHoverKey: props.onHoverKey,
					reserve
				}), /* @__PURE__ */ React.createElement(Legend, {
					parts: head.parts,
					hoverKey: props.hoverKey,
					onHoverKey: props.onHoverKey
				}), props.tools !== void 0 && props.tools.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "lc-tools" }, /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: "lc-tools-label",
					onClick: () => {
						if (props.onToolFocus !== void 0) props.onToolFocus({});
					}
				}, t("tools.top")), props.tools.slice().sort((a, b) => b.tokens - a.tokens).slice(0, 5).map((tool) => /* @__PURE__ */ React.createElement("button", {
					key: tool.name,
					type: "button",
					className: "lc-tool-chip",
					onClick: () => {
						if (props.onToolFocus !== void 0) props.onToolFocus({ tool: tool.name });
					}
				}, tool.name + " " + fmt(tool.tokens))), props.tools.length > 5 ? /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: "lc-tools-more",
					onClick: () => {
						if (props.onToolFocus !== void 0) props.onToolFocus({});
					}
				}, t("tools.more", { n: props.tools.length })) : null) : null);
			};
		}
		//#endregion
		//#region src/client/components/errorBoundary.tsx
		function makeErrorBoundary(t) {
			return class ErrorBoundary extends React.Component {
				constructor(props) {
					super(props);
					this.state = { error: null };
				}
				static getDerivedStateFromError(error) {
					return { error: error instanceof Error ? error : new Error(String(error)) };
				}
				render() {
					const error = this.state.error;
					if (error === null) return this.props.children;
					return /* @__PURE__ */ React.createElement("div", { className: "lc-root" }, /* @__PURE__ */ React.createElement("div", { className: "lc-empty lc-error" }, /* @__PURE__ */ React.createElement("span", null, t("error")), /* @__PURE__ */ React.createElement("code", { className: "lc-error-msg" }, error.message), /* @__PURE__ */ React.createElement("button", {
						type: "button",
						className: "lc-error-retry",
						onClick: () => {
							this.setState({ error: null });
						}
					}, t("error.retry"))));
				}
			};
		}
		//#endregion
		//#region src/client/components/contextModal.tsx
		function makeContextModal(ctx, kit) {
			const { t } = kit;
			const sessions = ctx.get("sessions");
			const StackedBar = makeStackedBar(kit);
			const CurrentComposition = makeCurrentComposition(kit, StackedBar, makeLegend(kit));
			const ContextBrowser = makeContextBrowser(kit, StackedBar);
			const ErrorBoundary = makeErrorBoundary(t);
			function ContextModalBody(props) {
				const sessionId = typeof props.sessionId === "string" ? props.sessionId : "";
				const open = typeof props.useContextModal === "function" ? props.useContextModal((s) => s) : false;
				const data = typeof props.useProjection === "function" ? timelineOf(props.useProjection("contextTimeline")) : null;
				const pressure = typeof props.useProjection === "function" ? contextPressureOf(props.useProjection("contextPressure")) : null;
				const breakdown = typeof props.useProjection === "function" ? contextBreakdownOf(props.useProjection("contextBreakdown")) : null;
				const headers = typeof props.useProjection === "function" ? headersOf(props.useProjection("contextHeaders")) : null;
				const [hoverCat, setHoverCat] = React.useState(null);
				const [toolFocus, setToolFocus] = React.useState(null);
				const close = React.useCallback(() => {
					if (sessionId === "") return;
					modalStoreOf(sessionId).set(false);
					const guard = takePendingConsume(sessionId);
					if (guard === void 0 || sessions === void 0) return;
					const scope = sessions.scope(sessionId);
					if (scope !== void 0) scope.bail(scope, "slash/input-consume-token", { guard });
				}, [sessionId]);
				React.useEffect(() => {
					if (!open) return void 0;
					const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
					const onKey = (ev) => {
						if (ev.key !== "Escape") return;
						ev.preventDefault();
						ev.stopPropagation();
						close();
					};
					window.addEventListener("keydown", onKey, true);
					return () => {
						window.removeEventListener("keydown", onKey, true);
						if (previous !== null && document.contains(previous)) previous.focus();
					};
				}, [open, close]);
				if (!open) return null;
				const head = data !== null ? headlineOf(data, pressure, breakdown) : null;
				const subtitle = data !== null ? (data.model ? data.model : "") + (data.provider ? " · " + data.provider : "") : "";
				return /* @__PURE__ */ React.createElement("div", {
					className: "lc-modal-backdrop",
					onClick: close
				}, /* @__PURE__ */ React.createElement("div", {
					className: "lc-modal-card",
					onClick: (ev) => {
						ev.stopPropagation();
					}
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-modal-head" }, /* @__PURE__ */ React.createElement("span", { className: "lc-modal-title" }, t("tab")), /* @__PURE__ */ React.createElement("button", {
					className: "lc-modal-close",
					"aria-label": t("cmd.close"),
					onClick: close
				}, "×")), data === null || head === null ? /* @__PURE__ */ React.createElement("div", { className: "lc-empty" }, t("loading")) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(CurrentComposition, {
					head,
					subtitle,
					hoverKey: hoverCat,
					onHoverKey: setHoverCat,
					tools: data.toolList,
					onToolFocus: setToolFocus
				}), /* @__PURE__ */ React.createElement(ContextBrowser, {
					data,
					headers,
					useSession: props.useSession,
					loadOlderHistory: props.loadOlderHistory,
					hoverKey: hoverCat,
					onHoverKey: setHoverCat,
					toolFocus,
					onToolFocusHandled: () => {
						setToolFocus(null);
					}
				}))));
			}
			return function ContextModal(props) {
				return h(ErrorBoundary, null, h(ContextModalBody, props));
			};
		}
		//#endregion
		//#region src/client/components/settingsCard.tsx
		function PrefRow(props) {
			const [open, setOpen] = React.useState(false);
			const active = props.options.find((o) => o.id === props.value)?.label ?? props.value;
			return /* @__PURE__ */ React.createElement("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "8px 0"
			} }, /* @__PURE__ */ React.createElement("span", { style: {
				flex: 1,
				minWidth: 0,
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis",
				fontSize: 14,
				color: "var(--dsw-alias-label-primary)"
			} }, props.label), /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => {
					setOpen(false);
				},
				items: props.options,
				selectedId: props.value,
				onSelect: (id) => {
					setOpen(false);
					props.onPick(id);
				},
				align: "end",
				portal: true,
				anchor: /* @__PURE__ */ React.createElement("button", {
					type: "button",
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: 12,
						height: 36,
						padding: "0 14px",
						border: "none",
						borderRadius: 18,
						background: "var(--dsw-alias-bg-module-platform)",
						fontSize: 14,
						color: "var(--dsw-alias-label-primary)",
						cursor: "pointer",
						whiteSpace: "nowrap",
						opacity: props.disabled ? .5 : 1
					},
					disabled: props.disabled,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => {
						setOpen((v) => !v);
					}
				}, active, /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, null))
			}));
		}
		function makeSettingsCard(kit) {
			const { t } = kit;
			return function SettingsCard(props) {
				const [open, setOpen] = React.useState(false);
				const state = typeof props.useContextSettings === "function" ? props.useContextSettings((s) => s) : void 0;
				if (state === void 0 || state.status === "unavailable") return null;
				const disabled = state.status !== "ready" || !state.writable;
				return /* @__PURE__ */ React.createElement("li", { className: "lc-settings-card" + (open ? " lc-settings-open" : "") }, /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: "lc-settings-head",
					"aria-expanded": open,
					"aria-label": `${t(open ? "settings.collapse" : "settings.expand")}: ${t("settings.title")}`,
					onClick: () => {
						setOpen(!open);
					}
				}, /* @__PURE__ */ React.createElement("span", { className: "lc-settings-headtext" }, /* @__PURE__ */ React.createElement("span", { className: "lc-settings-name" }, t("settings.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-settings-desc" }, t("settings.desc"))), /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "lc-settings-chevron" })), open ? /* @__PURE__ */ React.createElement("div", { className: "lc-settings-body" }, !state.writable && state.status === "ready" ? /* @__PURE__ */ React.createElement("p", {
					className: "lc-settings-note",
					role: "status"
				}, t("settings.readOnly")) : null, /* @__PURE__ */ React.createElement(PrefRow, {
					label: t("settings.gran"),
					value: state.granularity,
					disabled,
					options: [{
						id: "step",
						label: t("gran.step")
					}, {
						id: "turn",
						label: t("gran.turn")
					}],
					onPick: (id) => {
						props.set?.("defaultGranularity", id);
					}
				}), /* @__PURE__ */ React.createElement(PrefRow, {
					label: t("settings.mode"),
					value: state.mode,
					disabled,
					options: [{
						id: "total",
						label: t("gran.total")
					}, {
						id: "delta",
						label: t("gran.delta")
					}],
					onPick: (id) => {
						props.set?.("defaultTrendMode", id);
					}
				})) : null);
			};
		}
		//#endregion
		//#region src/client/settings.ts
		function prefsOf(value) {
			if (value === null || typeof value !== "object") return {};
			const v = value;
			return {
				...v.defaultGranularity === "step" || v.defaultGranularity === "turn" ? { granularity: v.defaultGranularity } : {},
				...v.defaultTrendMode === "total" || v.defaultTrendMode === "delta" ? { mode: v.defaultTrendMode } : {}
			};
		}
		function createContextSettings() {
			let state = {
				status: "loading",
				granularity: "step",
				mode: "total",
				writable: false
			};
			let scope;
			const listeners = /* @__PURE__ */ new Set();
			const publish = (next) => {
				if (next.status === state.status && next.granularity === state.granularity && next.mode === state.mode && next.writable === state.writable) return;
				state = next;
				for (const listener of listeners) listener();
			};
			return {
				store: {
					subscribe(listener) {
						listeners.add(listener);
						return () => {
							listeners.delete(listener);
						};
					},
					getSnapshot: () => state
				},
				defaultGranularity: () => state.granularity,
				defaultTrendMode: () => state.mode,
				attach(bound) {
					scope = bound;
					const sync = () => {
						const snap = bound.getSnapshot();
						const prefs = prefsOf(snap.value);
						publish({
							status: snap.status === "ready" || snap.status === "unavailable" ? snap.status : "loading",
							granularity: prefs.granularity ?? state.granularity,
							mode: prefs.mode ?? state.mode,
							writable: snap.writable
						});
					};
					sync();
					return bound.subscribe(sync);
				},
				set(field, value) {
					publish({
						...state,
						...prefsOf({ [field]: value })
					});
					scope?.set(field, value);
				}
			};
		}
		//#endregion
		//#region src/client/brief.ts
		/** Every served node (live tail + removed archive copies), seq-sorted. */
		function briefNodes(data) {
			return [...data.nodes, ...data.archive].sort((a, b) => a.seq - b.seq);
		}
		/** First index whose node seq is >= `seq` (lower bound over the sorted list). */
		function lowerBound(nodes, seq) {
			let lo = 0;
			let hi = nodes.length;
			while (lo < hi) {
				const mid = lo + hi >> 1;
				if (nodes[mid].seq < seq) lo = mid + 1;
				else hi = mid;
			}
			return lo;
		}
		/**
		* Derive the brief for `requests[idx]` (the DISPLAY list — step records or
		* turn aggregates; a turn aggregate is always a turn start, so its inputs row
		* stays hidden and the opener/response carry the narrative).
		*/
		function briefOf(nodes, requests, idx) {
			if (idx < 0 || idx >= requests.length) return null;
			const req = requests[idx];
			const ri = lowerBound(nodes, req.seq);
			const hit = ri < nodes.length && nodes[ri].seq === req.seq ? nodes[ri] : void 0;
			const response = hit !== void 0 && hit.cat === "assistant" ? hit : void 0;
			const turnStart = idx === 0 || (requests[idx - 1].turn ?? 0) !== (req.turn ?? 0);
			let firstIdx = idx;
			while (firstIdx > 0 && (requests[firstIdx - 1].turn ?? 0) === (req.turn ?? 0)) firstIdx--;
			const upper = requests[firstIdx].seq;
			const lower = firstIdx > 0 ? requests[firstIdx - 1].seq : -1;
			let opener;
			for (let i = lowerBound(nodes, upper) - 1; i >= 0; i--) {
				const n = nodes[i];
				if (n.seq <= lower) break;
				if (n.cat === "user") {
					opener = n;
					break;
				}
			}
			const inputs = [];
			if (!turnStart) {
				const prevSeq = requests[idx - 1].seq;
				for (let i = lowerBound(nodes, prevSeq + 1); i < nodes.length && nodes[i].seq < req.seq; i++) inputs.push(nodes[i]);
			}
			return {
				opener,
				inputs,
				response
			};
		}
		/**
		* seq → one-line reply preview for the chart tooltip: the response node's
		* text, else its tool-call breadcrumb. Absent for usage-only replies and
		* steps outside retention.
		*/
		function replyTipsOf(nodes) {
			const m = /* @__PURE__ */ new Map();
			for (const n of nodes) {
				if (n.cat !== "assistant") continue;
				const s = n.text ?? (n.calls !== void 0 ? n.calls.join(" › ") : "");
				if (s !== "") m.set(n.seq, s);
			}
			return m;
		}
		//#endregion
		//#region src/client/components/events.tsx
		const EVENT_ICONS = {
			compaction: "✂",
			prune: "✂",
			inject: "＋",
			model: "⇄",
			mode: "⇄"
		};
		function makeEventText(t) {
			function eventLabel(ev) {
				if (ev.kind === "compaction") return t("ev.compaction", { n: ev.count || 0 });
				if (ev.kind === "prune") return t("ev.prune");
				if (ev.kind === "model") return t("ev.model", {
					a: ev.from || "?",
					b: ev.to || "?"
				});
				if (ev.kind === "mode") return t("ev.mode." + (ev.name || "?"));
				if (ev.sub === "skill") return t("ev.skill", { name: ev.name || "?" });
				const base = t("form." + (ev.form || "context"));
				let label = ev.name ? base + " · " + ev.name : base;
				if (ev.detail) label += " · " + ev.detail;
				return label;
			}
			/**
			* Where this event sits in the timeline: boundary events (compaction/prune) label the GAP they sit in — same-turn 'Turn 2 · Step 3→4',
			* cross-turn 'Turn 50 · Step 8 → Turn 51 · Step 1'; other kinds keep their single point; no turn/step (in flight) → null.
			*/
			function eventAt(ev) {
				if (ev.kind === "compaction" || ev.kind === "prune") {
					if (typeof ev.turn === "number" && typeof ev.step === "number") {
						if (typeof ev.fromTurn === "number" && typeof ev.fromStep === "number") {
							if (ev.fromTurn === ev.turn) return t("events.range", {
								t: ev.turn,
								a: ev.fromStep,
								b: ev.step
							});
							return t("events.rangeTo", {
								a: ev.fromTurn,
								as: ev.fromStep,
								b: ev.turn,
								bs: ev.step
							});
						}
						return t("events.at", {
							t: ev.turn,
							s: ev.step
						});
					}
					return null;
				}
				if (typeof ev.turn === "number" && typeof ev.step === "number") return t("events.at", {
					t: ev.turn,
					s: ev.step
				});
				return null;
			}
			return {
				eventLabel,
				eventAt
			};
		}
		function makeEventList(kit) {
			const { t, fmt, fmtTime, eventLabel, eventAt } = kit;
			return function EventList(props) {
				const rootRef = React.useRef(null);
				React.useLayoutEffect(() => {
					const root = rootRef.current;
					if (!root) return;
					const sync = () => {
						for (const el of root.querySelectorAll(".lc-event-label")) el.title = el.scrollWidth > el.clientWidth ? el.textContent || "" : "";
					};
					sync();
					window.addEventListener("resize", sync);
					return () => {
						window.removeEventListener("resize", sync);
					};
				});
				if (props.events.length === 0) return /* @__PURE__ */ React.createElement("div", { className: "lc-empty" }, t("events.empty"));
				const sorted = props.events.slice().reverse();
				return /* @__PURE__ */ React.createElement("div", {
					className: "lc-events",
					ref: rootRef
				}, sorted.map((ev, i) => {
					const label = eventLabel(ev);
					const at = eventAt(ev);
					const glyph = ev.kind === "inject" ? /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, null) : ev.kind === "model" ? /* @__PURE__ */ React.createElement(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, null) : EVENT_ICONS[ev.kind] || "•";
					return /* @__PURE__ */ React.createElement("div", {
						key: `${ev.seq}-${i}`,
						className: "lc-event"
					}, /* @__PURE__ */ React.createElement("span", { className: "lc-event-icon lc-event-" + ev.kind }, glyph), /* @__PURE__ */ React.createElement("span", { className: "lc-kind lc-kind-" + ev.kind }, t("kind." + ev.kind)), /* @__PURE__ */ React.createElement("span", { className: "lc-event-label" }, label), at !== null ? /* @__PURE__ */ React.createElement("span", { className: "lc-event-at" }, at) : null, ev.tokens ? /* @__PURE__ */ React.createElement("span", { className: "lc-event-tokens" + (ev.kind === "inject" ? " lc-up" : " lc-down") }, (ev.kind === "inject" ? "+" : "−") + fmt(ev.tokens)) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-event-time" }, fmtTime(ev.time)));
				}));
			};
		}
		const PLUGIN_REPO = "https://github.com/bowenliang123/dsh-context";
		const PLUGIN_REPO_SHORT = PLUGIN_REPO.replace(/^https?:\/\/github\.com\//, "");
		//#endregion
		//#region src/client/latestVersion.ts
		/**
		* One live check for the Plugin-info card: lazy with 1h TTL; every failure
		* mode narrows to null so the card silently keeps its static version.
		*/
		const REGISTRY_URL = "https://registry.npmjs.org/dsh-context/latest";
		const TTL_MS = 36e5;
		let cached = null;
		function fetchLatestVersion() {
			if (!cached || Date.now() - cached.at >= TTL_MS) cached = {
				at: Date.now(),
				promise: fetch(REGISTRY_URL).then((res) => res.ok ? res.json() : null).then((body) => body !== null && typeof body.version === "string" ? body.version : null).catch(() => null)
			};
			return cached.promise;
		}
		/** Numeric semver compare (pre-release suffix ignored): is `latest` strictly newer than `current`? */
		function isNewerVersion(latest, current) {
			const parse = (v) => v.replace(/^v/, "").split("-", 1)[0].split(".").map((n) => parseInt(n, 10) || 0);
			const a = parse(latest);
			const b = parse(current);
			for (let i = 0; i < Math.max(a.length, b.length); i++) {
				const x = a[i] || 0;
				const y = b[i] || 0;
				if (x !== y) return x > y;
			}
			return false;
		}
		//#endregion
		//#region src/client/components/pluginInfo.tsx
		function makePluginInfo(kit) {
			const { t } = kit;
			const row = (label, value, href) => /* @__PURE__ */ React.createElement("a", {
				className: "lc-pi-row",
				href,
				target: "_blank",
				rel: "noreferrer"
			}, /* @__PURE__ */ React.createElement("div", { className: "lc-pi-label" }, label), /* @__PURE__ */ React.createElement("div", { className: "lc-pi-value" }, value));
			return function PluginInfo() {
				const [latest, setLatest] = React.useState(null);
				React.useEffect(() => {
					if ("0.31.1".includes("-dev")) return;
					let on = true;
					fetchLatestVersion().then((v) => {
						if (on && v) setLatest(v);
					});
					return () => {
						on = false;
					};
				}, []);
				const update = latest !== null && isNewerVersion(latest, "0.31.1") ? latest : null;
				const nameValue = ["dsh-context (v0.31.1)"];
				if (update) nameValue.push(/* @__PURE__ */ React.createElement("span", {
					key: "update",
					className: "lc-pi-update"
				}, "↑ v" + update));
				return /* @__PURE__ */ React.createElement("div", { className: "lc-card" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("plugin.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, t("plugin.hint"))), /* @__PURE__ */ React.createElement("div", { className: "lc-pi-grid" }, row(t("plugin.name"), nameValue, PLUGIN_REPO + "/releases"), row(t("plugin.github"), PLUGIN_REPO_SHORT, PLUGIN_REPO)));
			};
		}
		//#endregion
		//#region src/client/components/requestDetail.tsx
		function makeRequestDetail(kit, StackedBar) {
			const { t, fmt, fmtTime, catLabel, eventLabel, eventAt } = kit;
			/**
			* One brief row: a fixed-width kind tag plus one glanceable line. The tag carries a styled, instant explanation bubble (the
			* `.lc-stat-tip` pattern); the content span keeps the native title (preview + locate hint), so the two never stack.
			* Clickable when the browser linkage is wired.
			*/
			function BriefRow(props) {
				const cls = "lc-brief-row" + (props.onLocate !== void 0 ? " lc-brief-row-link" : "");
				const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "lc-brief-tag" }, props.tag, /* @__PURE__ */ React.createElement("span", {
					className: "lc-brief-tip",
					role: "tooltip"
				}, props.tagTip)), props.children);
				if (props.onLocate === void 0) return /* @__PURE__ */ React.createElement("div", { className: cls }, inner);
				const locate = () => {
					props.onLocate?.(props.node, props.isResponse);
				};
				return /* @__PURE__ */ React.createElement("button", {
					type: "button",
					className: cls,
					onClick: locate
				}, inner);
			}
			/** One-line identity of a surface node: text preview, call breadcrumb, tool name, or a localized placeholder. */
			function nodeLine(n, conv) {
				if (n.cat === "tool") return callSummaryOf(conv) ?? n.tool ?? t("node.toolResult");
				if (n.text !== void 0 && n.text !== "") return n.text;
				if (n.skill !== void 0) return t("node.skillTag", { name: n.skill });
				if (n.calls !== void 0 && n.calls.length > 0) {
					const summary = blockSummaryOf(conv);
					return n.calls.join(" › ") + (summary !== null ? " · " + summary : "");
				}
				if (n.cat === "assistant") return t("node.empty");
				if (n.cat === "inject") return t("form." + (n.form ?? "context"));
				return t("node.nonText");
			}
			function BriefSection(props) {
				const { opener, inputs, response } = props.brief;
				if (opener === void 0 && inputs.length === 0 && response === void 0) return null;
				const convOf = props.convOf ?? (() => void 0);
				const hint = props.onLocate !== void 0 ? " — " + t("brief.locate") : "";
				const locateChip = props.onLocate === void 0 ? void 0 : (n) => (e) => {
					e?.stopPropagation();
					props.onLocate?.(n, false);
				};
				const MAX_CHIPS = 3;
				let replyText = "";
				let replyArrow = false;
				if (response !== void 0) {
					const conv = convOf(response.seq);
					replyText = nodeLine(response, conv);
					if (response.calls !== void 0 && response.calls.length > 0) replyArrow = true;
					else {
						const joined = callNamesOf(conv);
						if (joined.length > 0) replyText += " → " + joined.join(" › ");
					}
				}
				return /* @__PURE__ */ React.createElement("div", { className: "lc-brief" }, opener !== void 0 ? /* @__PURE__ */ React.createElement(BriefRow, {
					tag: t("brief.turn"),
					tagTip: t("brief.turnTip"),
					node: opener,
					isResponse: false,
					onLocate: props.onLocate
				}, /* @__PURE__ */ React.createElement("span", {
					className: "lc-brief-text",
					title: nodeLine(opener, convOf(opener.seq)) + hint
				}, nodeLine(opener, convOf(opener.seq)))) : null, inputs.length > 0 ? /* @__PURE__ */ React.createElement(BriefRow, {
					tag: t("brief.input"),
					tagTip: t("brief.inputTip"),
					node: inputs[0],
					isResponse: false,
					onLocate: props.onLocate
				}, inputs.slice(0, MAX_CHIPS).map((n) => /* @__PURE__ */ React.createElement("span", {
					key: n.seq,
					className: "lc-brief-chip" + (props.onLocate !== void 0 ? " lc-brief-chip-link" : ""),
					title: nodeLine(n, convOf(n.seq)) + hint,
					onClick: locateChip !== void 0 ? locateChip(n) : void 0
				}, n.err === true ? /* @__PURE__ */ React.createElement("span", { className: "lc-br-err-dot" }) : null, nodeLine(n, convOf(n.seq)))), inputs.length > MAX_CHIPS ? /* @__PURE__ */ React.createElement("span", { className: "lc-brief-more" }, t("brief.more", { n: inputs.length - MAX_CHIPS })) : null) : null, response !== void 0 ? /* @__PURE__ */ React.createElement(BriefRow, {
					tag: t("brief.reply"),
					tagTip: t("brief.replyTip"),
					node: response,
					isResponse: true,
					onLocate: props.onLocate
				}, /* @__PURE__ */ React.createElement("span", {
					className: "lc-brief-text",
					title: replyText + hint
				}, replyArrow ? "→ " : "", replyText)) : null);
			}
			return function RequestDetail(props) {
				const req = props.request;
				if (!req) return null;
				const isTurn = req.stepCount !== void 0 && req.stepCount > 1;
				const head = isTurn ? t("detail.turn", {
					t: req.turn ?? 0,
					n: req.stepCount ?? 0
				}) : t("detail.step", {
					t: req.turn ?? 0,
					s: req.step ?? 0
				});
				const marker = props.marker ?? null;
				const markerAt = marker !== null ? eventAt(marker) : null;
				const delta = props.prev !== void 0;
				const prev = props.prev ?? null;
				const deltas = CATS.map((c) => delta ? (req[c.key] || 0) - (prev !== null ? prev[c.key] || 0 : 0) : 0);
				let net = 0;
				let maxAbs = 0;
				if (delta) for (const d of deltas) {
					net += d;
					if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d);
				}
				const parts = delta ? CATS.map((c, i) => ({
					key: c.key,
					color: c.color,
					value: Math.abs(deltas[i])
				})) : partsOf(req);
				return /* @__PURE__ */ React.createElement("div", { className: "lc-detail" }, /* @__PURE__ */ React.createElement("div", { className: "lc-detail-head" }, /* @__PURE__ */ React.createElement("b", null, head), marker !== null && markerAt !== null ? /* @__PURE__ */ React.createElement("span", {
					className: "lc-detail-marker",
					title: eventLabel(marker)
				}, "✂ " + markerAt) : null, isTurn ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-tag" }, t("detail.lastStep")) : null, delta ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-tag" }, t("gran.delta")) : null, /* @__PURE__ */ React.createElement("span", { className: "lc-detail-time" }, fmtTime(req.time)), delta ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-metric" + (net > 0 ? " lc-detail-metric-up" : net < 0 ? " lc-detail-metric-down" : "") }, t("tip.delta", { n: (net > 0 ? "+" : "") + fmt(net) })) : null, !delta && req.prompt !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-metric" }, t("detail.actual", { n: fmt(req.prompt) })) : null, !delta && req.output !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-metric" }, t("detail.output", { n: fmt(req.output) })) : null, !delta && req.prompt !== void 0 && req.cacheRead !== void 0 ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-metric" }, t("detail.cache", { n: cacheHitPercent$1(req.cacheRead, req.prompt) ?? "—" })) : null), props.brief !== null && props.brief !== void 0 ? /* @__PURE__ */ React.createElement(BriefSection, {
					brief: props.brief,
					convOf: props.convOf,
					onLocate: props.onLocate
				}) : null, /* @__PURE__ */ React.createElement(StackedBar, {
					parts,
					height: 10
				}), /* @__PURE__ */ React.createElement("div", { className: "lc-detail-rows" }, CATS.map((c, i) => {
					const v = delta ? deltas[i] : req[c.key] || 0;
					const mag = Math.abs(v);
					return /* @__PURE__ */ React.createElement("div", {
						key: c.key,
						className: "lc-detail-row"
					}, /* @__PURE__ */ React.createElement("i", { style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", { className: "lc-detail-label" }, catLabel(c.key)), /* @__PURE__ */ React.createElement("span", { className: "lc-bar-track" }, delta ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "lc-bar-zero" }), v !== 0 ? /* @__PURE__ */ React.createElement("span", {
						className: "lc-bar-fill " + (v > 0 ? "lc-bar-fill-up" : "lc-bar-fill-down"),
						style: {
							width: `${mag / maxAbs * 50}%`,
							background: c.color
						}
					}) : null) : /* @__PURE__ */ React.createElement("span", {
						className: "lc-bar-fill",
						style: {
							width: `${req.total > 0 ? v / req.total * 100 : 0}%`,
							background: c.color
						}
					})), delta ? /* @__PURE__ */ React.createElement("span", { className: "lc-detail-num" + (v > 0 ? " lc-detail-num-up" : v < 0 ? " lc-detail-num-down" : "") }, (v > 0 ? "+" : "") + fmt(v)) : /* @__PURE__ */ React.createElement("span", { className: "lc-detail-num" }, "≈" + fmt(v)), /* @__PURE__ */ React.createElement("span", { className: "lc-detail-pct" }, !delta && req.total > 0 ? `${Math.round(v / req.total * 100)}%` : ""));
				})));
			};
		}
		//#endregion
		//#region src/client/cost.ts
		const PRICES = {
			usd: {
				flash: {
					peak: {
						hit: .014,
						miss: .44,
						out: 1.32
					},
					off: {
						hit: .007,
						miss: .22,
						out: .66
					}
				},
				pro: {
					peak: {
						hit: .044,
						miss: 1.32,
						out: 3.96
					},
					off: {
						hit: .022,
						miss: .66,
						out: 1.98
					}
				}
			},
			cny: {
				flash: {
					peak: {
						hit: .1,
						miss: 3,
						out: 9
					},
					off: {
						hit: .05,
						miss: 1.5,
						out: 4.5
					}
				},
				pro: {
					peak: {
						hit: .3,
						miss: 9,
						out: 27
					},
					off: {
						hit: .15,
						miss: 4.5,
						out: 13.5
					}
				}
			}
		};
		/**
		* Price the session's cumulative billed-token totals. Cache reads bill at
		* the hit rate; uncached input AND cache writes bill at the miss rate;
		* output (reasoning included) bills at the out rate. Null when nothing was
		* priced (no DeepSeek V4 usage folded yet), so the cell can show a dash.
		*/
		function estimateSessionCost(usage, currency) {
			if (usage === null || usage === void 0) return null;
			let total = 0;
			let any = false;
			for (const family of ["flash", "pro"]) {
				const fam = usage[family];
				if (fam === void 0) continue;
				for (const period of ["peak", "off"]) {
					const b = fam[period];
					if (b === void 0) continue;
					const p = PRICES[currency][family][period];
					total += (numOf(b.cacheRead) * p.hit + (numOf(b.uncached) + numOf(b.cacheWrite)) * p.miss + numOf(b.output) * p.out) / 1e6;
					any = true;
				}
			}
			return any ? total : null;
		}
		function formatCost(amount, currency) {
			return (currency === "cny" ? "¥" : "$") + (amount >= 1 ? amount.toFixed(2) : amount.toPrecision(2));
		}
		/**
		* All priced model families for one currency, in display order, with their
		* peak/off-peak rate triples — the raw material of the stats-board tooltip's
		* price list. The numbers stay hardcoded in PRICES above; this function only
		* reshapes the table for display, so what the tooltip prints can never drift
		* from the math that prices the session.
		*/
		function sessionPrices(currency) {
			return ["flash", "pro"].map((id) => ({
				family: id === "flash" ? "deepseek-v4-flash" : "deepseek-v4-pro",
				peak: PRICES[currency][id].peak,
				off: PRICES[currency][id].off
			}));
		}
		/** Price-list figure: the same money format as formatCost, trailing zeros trimmed (¥3.00 → ¥3, $0.0070 → $0.007). */
		function formatPriceRate(amount, currency) {
			return formatCost(amount, currency).replace(/0+$/, "").replace(/\.$/, "");
		}
		//#endregion
		//#region src/client/components/statsBoard.tsx
		/**
		* Cache-hit share of billed prompt-side input — same three disjoint buckets
		* as the harness chat line (`cacheReadTokens` over uncached + reads + writes)
		* and the step line's 缓存 figure; null when nothing was billed.
		*/
		function cacheHitPercent(usage) {
			const uncached = numOf(usage.uncachedInputTokens);
			const reads = numOf(usage.cacheReadTokens);
			const writes = numOf(usage.cacheWriteTokens);
			return cacheHitPercent$1(reads, uncached + reads + writes);
		}
		function cell(label, value, tip) {
			return /* @__PURE__ */ React.createElement("div", { className: "lc-stat" + (tip === void 0 ? "" : " lc-stat-tipped") }, /* @__PURE__ */ React.createElement("span", { className: "lc-stat-label" }, label, tip !== void 0 && /* @__PURE__ */ React.createElement("i", {
				className: "lc-stat-q",
				"aria-hidden": "true"
			}, "?")), /* @__PURE__ */ React.createElement("b", { className: "lc-stat-value" }, value), tip !== void 0 && /* @__PURE__ */ React.createElement("span", {
				className: "lc-stat-tip",
				role: "tooltip"
			}, tip));
		}
		function makeStatsBoard(kit) {
			const { t, fmt } = kit;
			return function StatsBoard(props) {
				const turns = /* @__PURE__ */ new Set();
				let steps = 0, compactions = 0, prunes = 0, injects = 0;
				for (const req of props.requests) {
					turns.add(req.turn ?? 0);
					steps++;
				}
				for (const ev of props.events) if (ev.kind === "compaction") compactions++;
				else if (ev.kind === "prune") prunes++;
				else if (ev.kind === "inject") injects++;
				const hit = props.usage !== null ? cacheHitPercent(props.usage) : null;
				const currency = props.locale === "zh" ? "cny" : "usd";
				const cost = estimateSessionCost(props.cost, currency);
				const fmtRate = (n) => formatPriceRate(n, currency);
				const costTip = [t("stats.costTip"), /* @__PURE__ */ React.createElement("span", {
					key: "prices",
					className: "lc-stat-tip-prices"
				}, /* @__PURE__ */ React.createElement("span", { className: "lc-stat-tip-head" }, t("stats.costPriceHead")), sessionPrices(currency).map((r) => /* @__PURE__ */ React.createElement("span", {
					key: r.family,
					className: "lc-stat-tip-row"
				}, /* @__PURE__ */ React.createElement("b", { className: "lc-stat-tip-model" }, r.family), " ", t("stats.costHit"), " ", fmtRate(r.peak.hit), "/", fmtRate(r.off.hit), " · ", t("stats.costMiss"), " ", fmtRate(r.peak.miss), "/", fmtRate(r.off.miss), " · ", t("stats.costOut"), " ", fmtRate(r.peak.out), "/", fmtRate(r.off.out))))];
				return /* @__PURE__ */ React.createElement("div", { className: "lc-card lc-col lc-col-stats" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("stats.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, t("stats.hint"))), /* @__PURE__ */ React.createElement("div", { className: "lc-stats" }, cell(t("stats.turns"), fmt(turns.size)), cell(t("stats.steps"), fmt(steps)), cell(t("stats.injects"), fmt(injects)), cell(t("stats.compactions"), fmt(compactions)), cell(t("stats.prunes"), fmt(prunes)), cell(t("stats.toolCalls"), fmt(props.toolCalls ?? 0)), cell(t("stats.images"), fmt(props.images ?? 0)), cell(t("stats.cacheHit"), hit === null ? "—" : hit + "%"), cell(t("stats.cost"), cost === null ? "—" : formatCost(cost, currency), costTip)));
			};
		}
		//#endregion
		//#region src/client/components/trendChart.tsx
		/**
		* Collapse per-step requests into one bar per turn — each turn is represented by its LAST step's record, tagged `stepCount` for the bar's
		* column width; the log keeps one turn's requests consecutive, so a run of equal turns collapses to its final record.
		*/
		function aggregateByTurn(requests) {
			const out = [];
			let runSteps = 0;
			for (const req of requests) {
				const last = out.length > 0 ? out[out.length - 1] : null;
				if (last !== null && (last.turn ?? 0) === (req.turn ?? 0)) {
					runSteps++;
					out[out.length - 1] = {
						...req,
						stepCount: runSteps
					};
				} else {
					runSteps = 1;
					out.push({
						...req,
						stepCount: 1
					});
				}
			}
			return out;
		}
		/**
		* Attach each boundary event (compaction/prune) to the first request logged after it — one entry per index, for the ✂ marker and the detail
		* chip; shared with the detail panel so both show the SAME event.
		*/
		function attachMarkers(requests, events) {
			const markers = new Array(requests.length);
			for (const ev of events) {
				if (ev.kind !== "compaction" && ev.kind !== "prune") continue;
				for (let r = 0; r < requests.length; r++) if (requests[r].seq >= ev.seq) {
					if (markers[r] === void 0) markers[r] = ev;
					break;
				}
			}
			return markers;
		}
		function makeTrendChart(kit) {
			const { t, fmt, fmtTime, eventLabel, eventAt } = kit;
			const CHART_H = 112;
			const BAR_W = 14;
			const BAR_GAP = 2;
			const TURN_FILLS = ["rgba(128,128,128,0.12)", "rgba(128,128,128,0.26)"];
			const anchorOf = (req) => typeof req.prompt === "number" && req.prompt > 0 && req.total > 0 ? req.prompt / req.total : 1;
			const barTotalOf = (req) => typeof req.prompt === "number" && req.prompt > 0 ? req.prompt : req.total;
			/**
			* Delta mode: each category keeps the SIGNED change vs the previous record so bars can diverge
			* above/below the zero line; `total` is the churn (summed magnitude), `net` the signed change
			* for the tooltip; the first request starts from zero so the scale is change-driven, and per-request
			* provider prompt/output are dropped (they are not deltas).
			*/
			const deltaOf = (req, prev) => {
				const { prompt: _prompt, output: _output, ...out } = req;
				let churn = 0;
				let net = 0;
				for (const c of CATS) {
					const d = prev !== null ? (req[c.key] || 0) - (prev[c.key] || 0) : 0;
					out[c.key] = d;
					churn += Math.abs(d);
					net += d;
				}
				out.total = churn;
				out.net = net;
				return out;
			};
			const ChartBar = React.memo(function ChartBar(props) {
				const { req, marker } = props;
				const markerAt = marker !== void 0 ? eventAt(marker) : null;
				const diverge = props.upPx !== void 0 && props.downPx !== void 0 && props.deltaScale !== void 0;
				return /* @__PURE__ */ React.createElement("div", {
					className: "lc-bar" + (props.selected ? " lc-bar-selected" : "") + (props.hovered ? " lc-bar-hovered" : "") + (props.inTurn ? " lc-bar-in-turn" : ""),
					"data-seq": req.seq,
					style: { width: `${BAR_W}px` },
					onClick: () => {
						props.onSelect(props.selected ? null : req.seq);
					},
					onMouseEnter: () => {
						props.onHover(req.seq);
					}
				}, marker !== void 0 ? /* @__PURE__ */ React.createElement("span", {
					className: "lc-bar-marker",
					title: "✂ " + (markerAt !== null ? markerAt + " — " : "") + eventLabel(marker)
				}, "✂") : null, diverge ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", {
					className: "lc-bar-up",
					style: { bottom: `${props.downPx}px` }
				}, CATS.map((c) => {
					const d = req[c.key] || 0;
					if (d <= 0) return null;
					return /* @__PURE__ */ React.createElement("div", {
						key: c.key,
						style: {
							height: `${Math.max(1, Math.round(d * props.deltaScale))}px`,
							background: c.color
						}
					});
				})), /* @__PURE__ */ React.createElement("div", {
					className: "lc-bar-down",
					style: { top: `${props.upPx}px` }
				}, CATS.map((c) => {
					const d = req[c.key] || 0;
					if (d >= 0) return null;
					return /* @__PURE__ */ React.createElement("div", {
						key: c.key,
						style: {
							height: `${Math.max(1, Math.round(-d * props.deltaScale))}px`,
							background: c.color
						}
					});
				}))) : /* @__PURE__ */ React.createElement("div", { className: "lc-bar-stack" }, CATS.map((c) => {
					const v = (req[c.key] || 0) * anchorOf(req);
					if (!v) return null;
					return /* @__PURE__ */ React.createElement("div", {
						key: c.key,
						style: {
							height: `${Math.max(1, Math.round(v / props.maxTotal * CHART_H))}px`,
							background: c.color
						}
					});
				})));
			});
			return function TrendChart(props) {
				const delta = props.mode === "delta";
				const requests = React.useMemo(() => delta ? props.requests.map((req, i) => deltaOf(req, i > 0 ? props.requests[i - 1] : null)) : props.requests, [props.requests, delta]);
				const markers = props.markers;
				let maxTotal = 1;
				let maxUp = 0;
				let maxDown = 0;
				if (delta) for (const req of requests) {
					let up = 0;
					let down = 0;
					for (const c of CATS) {
						const d = req[c.key] || 0;
						if (d > 0) up += d;
						else down -= d;
					}
					if (up > maxUp) maxUp = up;
					if (down > maxDown) maxDown = down;
				}
				else for (const req of requests) {
					const bt = barTotalOf(req);
					if (bt > maxTotal) maxTotal = bt;
				}
				const span = Math.max(1, maxUp + maxDown);
				const deltaScale = CHART_H / span;
				const upPx = Math.round(maxUp * deltaScale);
				const downPx = CHART_H - upPx;
				const groups = [];
				for (const req of requests) {
					let grp = groups.length > 0 ? groups[groups.length - 1] : null;
					if (grp === null || grp.turn !== (req.turn ?? 0)) {
						grp = {
							turn: req.turn ?? 0,
							count: 0,
							span: 0,
							agg: req.stepCount !== void 0
						};
						groups.push(grp);
					}
					grp.count++;
					grp.span += req.stepCount ?? 1;
				}
				const turnOffsets = [];
				const turnWidths = [];
				{
					let x = 0;
					for (const grp of groups) {
						const w = grp.agg ? BAR_W : grp.span * 16 - BAR_GAP;
						turnOffsets.push(x);
						turnWidths.push(w);
						x += w + BAR_GAP;
					}
				}
				const scrollRef = React.useRef(null);
				const scrolledOnce = React.useRef(false);
				const lastGranRef = React.useRef(props.granularity);
				const [edges, setEdges] = React.useState({
					left: false,
					right: false
				});
				const edgesRef = React.useRef(edges);
				const updateEdges = (el) => {
					const left = el.scrollLeft > 4;
					const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
					const prev = edgesRef.current;
					if (prev.left === left && prev.right === right) return;
					edgesRef.current = {
						left,
						right
					};
					setEdges({
						left,
						right
					});
				};
				/**
				* Keep each turn label centered within its block's VISIBLE slice so it never scrolls out while any part of the block is on screen
				* (narrower-than-label blocks stay put); reads (offsetWidth) batch before writes (transform) to avoid layout thrash — out-of-view
				* blocks need no measurement.
				*/
				const updateTurnLabels = (el) => {
					const labels = el.querySelectorAll(".lc-turn-label");
					const n = Math.min(labels.length, turnOffsets.length);
					const sl = el.scrollLeft;
					const vr = sl + el.clientWidth;
					const writes = [];
					for (let i = 0; i < n; i++) {
						const off = turnOffsets[i];
						const w = turnWidths[i];
						const visL = Math.max(off, sl);
						const visR = Math.min(off + w, vr);
						let dx = 0;
						if (visR > visL) {
							const lw = labels[i].offsetWidth;
							if (lw < w) {
								const center = (visL + visR) / 2 - off;
								dx = Math.min(Math.max(center, lw / 2), w - lw / 2) - w / 2;
							}
						}
						const next = dx !== 0 ? `translateX(${dx}px)` : "";
						if (labels[i].style.transform !== next) writes.push([labels[i], next]);
					}
					for (const [label, next] of writes) label.style.transform = next;
				};
				React.useLayoutEffect(() => {
					const el = scrollRef.current;
					if (el === null) return;
					if (props.granularity !== lastGranRef.current) {
						lastGranRef.current = props.granularity;
						scrolledOnce.current = false;
					}
					if (props.focusTurn !== null) {
						const gi = groups.findIndex((g) => g.turn === props.focusTurn);
						if (gi >= 0) {
							scrolledOnce.current = true;
							el.scrollLeft = Math.max(0, gi * 16 + BAR_W / 2 - el.clientWidth / 2);
						}
						props.onFocusTurnHandled();
					}
					if (!scrolledOnce.current) {
						scrolledOnce.current = true;
						el.scrollLeft = el.scrollWidth;
					} else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 24) el.scrollLeft = el.scrollWidth;
					updateEdges(el);
					updateTurnLabels(el);
				});
				const tipOf = (req) => {
					const head = req.stepCount !== void 0 && req.stepCount > 1 ? t("tip.turn", {
						t: req.turn ?? 0,
						n: req.stepCount
					}) : t("tip.step", {
						t: req.turn ?? 0,
						s: req.step ?? 0
					});
					const reply = props.replyTips?.get(req.seq);
					const tail = reply !== void 0 ? " · “" + (reply.length > 48 ? reply.slice(0, 48) + "…" : reply) + "”" : "";
					if (delta) {
						const n = req.net ?? 0;
						return head + " · " + fmtTime(req.time) + " · " + t("tip.delta", { n: (n > 0 ? "+" : "") + fmt(n) }) + tail;
					}
					return head + " · " + fmtTime(req.time) + " · " + t("tip.total", { n: fmt(req.total) }) + (req.prompt !== void 0 ? " · " + t("tip.actual", { n: fmt(req.prompt) }) : "") + tail;
				};
				const hoveredIdx = props.hoveredSeq !== null ? requests.findIndex((r) => r.seq === props.hoveredSeq) : -1;
				const hoveredReq = hoveredIdx >= 0 ? requests[hoveredIdx] : null;
				return /* @__PURE__ */ React.createElement("div", { className: "lc-chartrow" }, /* @__PURE__ */ React.createElement("div", { className: "lc-axis" }, delta ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "lc-axis-top" }, (maxUp > 0 ? "+" : "") + fmt(maxUp)), /* @__PURE__ */ React.createElement("span", {
					className: "lc-axis-mid",
					style: { top: `${13 + upPx}px` }
				}, "0"), /* @__PURE__ */ React.createElement("span", { className: "lc-axis-bot" }, (maxDown > 0 ? "-" : "") + fmt(maxDown))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "lc-axis-top" }, fmt(maxTotal)), /* @__PURE__ */ React.createElement("span", { className: "lc-axis-mid" }, fmt(Math.round(maxTotal / 2))), /* @__PURE__ */ React.createElement("span", { className: "lc-axis-bot" }, "0"))), /* @__PURE__ */ React.createElement("div", {
					className: "lc-chart-scroll" + (props.activeTurn !== null ? " lc-chart-dim" : ""),
					ref: scrollRef,
					onScroll: (e) => {
						updateEdges(e.currentTarget);
						updateTurnLabels(e.currentTarget);
					}
				}, edges.left ? /* @__PURE__ */ React.createElement("div", { className: "lc-chart-fade lc-chart-fade-l" }) : null, /* @__PURE__ */ React.createElement("div", {
					className: "lc-chart",
					onMouseLeave: () => {
						props.onHover(null);
					}
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-grid lc-grid-top" }), delta ? /* @__PURE__ */ React.createElement("div", {
					className: "lc-grid lc-grid-zero",
					style: { top: `${18 + upPx}px` }
				}) : /* @__PURE__ */ React.createElement("div", { className: "lc-grid lc-grid-mid" }), requests.map((req, i) => /* @__PURE__ */ React.createElement(ChartBar, {
					key: req.seq,
					req,
					marker: markers[i],
					selected: props.selectedSeq === req.seq,
					hovered: props.hoveredSeq === req.seq,
					inTurn: props.activeTurn !== null && (req.turn ?? 0) === props.activeTurn,
					maxTotal,
					upPx: delta ? upPx : void 0,
					downPx: delta ? downPx : void 0,
					deltaScale: delta ? deltaScale : void 0,
					onSelect: props.onSelect,
					onHover: props.onHover
				}))), hoveredReq !== null ? /* @__PURE__ */ React.createElement("div", {
					className: "lc-chart-tip",
					style: { left: `${hoveredIdx * 16 + BAR_W / 2}px` }
				}, tipOf(hoveredReq)) : null, /* @__PURE__ */ React.createElement("div", {
					className: "lc-turns",
					onMouseLeave: () => {
						props.onHoverTurn(null);
					}
				}, groups.map((grp, gi) => {
					const on = props.activeTurn === grp.turn;
					return /* @__PURE__ */ React.createElement("span", {
						key: `turn-${gi}`,
						className: "lc-turn" + (on ? " lc-turn-on" : ""),
						style: {
							width: `${turnWidths[gi]}px`,
							background: TURN_FILLS[gi % TURN_FILLS.length]
						},
						title: `T${grp.turn}`,
						onMouseEnter: () => {
							props.onHoverTurn(grp.turn);
						},
						onClick: () => {
							props.onPickTurn(grp.turn);
						}
					}, /* @__PURE__ */ React.createElement("span", { className: "lc-turn-label" }, `T${grp.turn}`));
				}))), edges.right ? /* @__PURE__ */ React.createElement("div", { className: "lc-chart-fade lc-chart-fade-r" }) : null);
			};
		}
		//#endregion
		//#region src/client/components/contextView.tsx
		const viewScroll = /* @__PURE__ */ new Map();
		const EVENT_KINDS = [
			"inject",
			"compaction",
			"prune",
			"model",
			"mode"
		];
		function makeContextView(ctx, kit, settings) {
			const { t } = kit;
			const StackedBar = makeStackedBar(kit);
			const CurrentComposition = makeCurrentComposition(kit, StackedBar, makeLegend(kit));
			const TrendChart = makeTrendChart(kit);
			const RequestDetail = makeRequestDetail(kit, StackedBar);
			const EventList = makeEventList(kit);
			const NodeList = makeNodeList(kit);
			const StatsBoard = makeStatsBoard(kit);
			const PluginInfo = makePluginInfo(kit);
			const ContextBrowser = makeContextBrowser(kit, StackedBar);
			const ErrorBoundary = makeErrorBoundary(t);
			function ContextViewBody(props) {
				const sessionId = props.sessionId;
				const data = typeof props.useProjection === "function" ? timelineOf(props.useProjection("contextTimeline")) : null;
				const pressure = typeof props.useProjection === "function" ? contextPressureOf(props.useProjection("contextPressure")) : null;
				const usage = typeof props.useProjection === "function" ? tokenUsageOf(props.useProjection("tokenUsage")) : null;
				const breakdown = typeof props.useProjection === "function" ? contextBreakdownOf(props.useProjection("contextBreakdown")) : null;
				const headers = typeof props.useProjection === "function" ? headersOf(props.useProjection("contextHeaders")) : null;
				const [selectedSeq, setSelectedSeq] = React.useState(null);
				const [hoveredSeq, setHoveredSeq] = React.useState(null);
				const [hoverTurn, setHoverTurn] = React.useState(null);
				const [granularity, setGranularity] = React.useState(() => settings.defaultGranularity());
				const [trendMode, setTrendMode] = React.useState(() => settings.defaultTrendMode());
				const [focusTurn, setFocusTurn] = React.useState(null);
				const [hoverCat, setHoverCat] = React.useState(null);
				const [pickedKinds, setPickedKinds] = React.useState([...EVENT_KINDS]);
				const toggleKind = (k) => {
					setPickedKinds((p) => {
						if (p.length === EVENT_KINDS.length) return [k];
						if (!p.includes(k)) return [...p, k];
						return p.length === 1 ? [...EVENT_KINDS] : p.filter((x) => x !== k);
					});
				};
				const [toolFocus, setToolFocus] = React.useState(null);
				const clearToolFocus = React.useCallback(() => {
					setToolFocus(null);
				}, []);
				const [nodeFocus, setNodeFocus] = React.useState(null);
				const clearNodeFocus = React.useCallback(() => {
					setNodeFocus(null);
				}, []);
				const loadImage = React.useMemo(() => {
					if (typeof sessionId !== "string" || sessionId === "") return void 0;
					const conversation = ctx.get("conversation");
					if (conversation === void 0 || typeof conversation.resolveImage !== "function") return void 0;
					return (attachment) => conversation.resolveImage(sessionId, attachment);
				}, [sessionId]);
				const rootRef = React.useRef(null);
				const scrollerRef = React.useRef(null);
				const restoredRef = React.useRef(null);
				React.useLayoutEffect(() => {
					if (typeof sessionId !== "string" || sessionId === "" || data === null) return;
					if (restoredRef.current === sessionId) return;
					restoredRef.current = sessionId;
					const scroller = rootRef.current !== null ? rootRef.current.closest("[data-conversation-scroll]") : null;
					if (scroller === null) return;
					scrollerRef.current = scroller;
					scroller.scrollTop = viewScroll.get(sessionId) ?? 0;
				}, [sessionId, data]);
				React.useLayoutEffect(() => {
					return () => {
						if (typeof sessionId !== "string" || sessionId === "") return;
						const scroller = scrollerRef.current;
						if (scroller === null) return;
						viewScroll.set(sessionId, scroller.scrollTop);
					};
				}, [sessionId]);
				const requests = data ? data.requests : [];
				const events = data ? data.events : [];
				const shownEvents = pickedKinds.length === EVENT_KINDS.length ? events : events.filter((e) => pickedKinds.includes(e.kind));
				const nodes = data ? data.nodes : [];
				const displayRequests = React.useMemo(() => granularity === "turn" ? aggregateByTurn(requests) : requests, [requests, granularity]);
				const markers = React.useMemo(() => attachMarkers(displayRequests, events), [displayRequests, events]);
				const briefList = React.useMemo(() => data ? briefNodes(data) : [], [data]);
				const replyTips = React.useMemo(() => replyTipsOf(briefList), [briefList]);
				const convNodes = typeof props.useSession === "function" ? props.useSession((s) => s.nodes) : void 0;
				const bySeq = React.useMemo(() => {
					const m = /* @__PURE__ */ new Map();
					for (const n of convNodes ?? []) m.set(n.seq, n);
					return m;
				}, [convNodes]);
				if (!data) return /* @__PURE__ */ React.createElement("div", {
					className: "lc-root",
					ref: rootRef
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-empty" }, t("loading")));
				const markerOf = (req) => {
					const i = displayRequests.indexOf(req);
					return i >= 0 ? markers[i] : void 0;
				};
				let pinnedIdx = -1;
				for (let i = 0; i < displayRequests.length; i++) if (displayRequests[i].seq === selectedSeq) pinnedIdx = i;
				const pinnedReq = pinnedIdx >= 0 ? displayRequests[pinnedIdx] : null;
				let activeIdx = -1;
				if (hoveredSeq !== null) {
					for (let i = 0; i < displayRequests.length; i++) if (displayRequests[i].seq === hoveredSeq) {
						activeIdx = i;
						break;
					}
				}
				if (activeIdx < 0) activeIdx = pinnedIdx;
				if (activeIdx < 0 && displayRequests.length > 0) activeIdx = displayRequests.length - 1;
				const activeReq = activeIdx >= 0 ? displayRequests[activeIdx] : null;
				const brief = activeReq !== null ? briefOf(briefList, displayRequests, activeIdx) : null;
				const convOf = (seq) => bySeq.get(seq);
				const locateNode = (node, isResponse) => {
					if (activeReq === null) return;
					const next = isResponse && activeIdx + 1 < displayRequests.length ? displayRequests[activeIdx + 1] : null;
					const step = isResponse ? next !== null ? next.seq : "live" : activeReq.seq;
					setNodeFocus({
						step,
						seq: node.seq,
						cat: node.cat
					});
				};
				let activeTurn = hoverTurn;
				if (activeTurn === null && hoveredSeq !== null) {
					for (const req of displayRequests) if (req.seq === hoveredSeq) {
						activeTurn = req.turn ?? null;
						break;
					}
				}
				const head = headlineOf(data, pressure, breakdown);
				const localeSvc = ctx.get("locale");
				const activeLocale = localeSvc !== void 0 && typeof localeSvc.getLocale === "function" ? localeSvc.getLocale().active : "en";
				return /* @__PURE__ */ React.createElement("div", {
					className: "lc-root",
					ref: rootRef
				}, /* @__PURE__ */ React.createElement("div", { className: "lc-cols lc-head" }, /* @__PURE__ */ React.createElement(StatsBoard, {
					requests,
					events,
					usage,
					toolCalls: data.toolCalls,
					images: data.images,
					cost: data.cost,
					locale: activeLocale
				}), /* @__PURE__ */ React.createElement(PluginInfo, null)), /* @__PURE__ */ React.createElement("div", { className: "lc-cols" }, /* @__PURE__ */ React.createElement("div", { className: "lc-col" }, /* @__PURE__ */ React.createElement(CurrentComposition, {
					head,
					subtitle: (data.model ? data.model : "") + (data.provider ? " · " + data.provider : ""),
					hoverKey: hoverCat,
					onHoverKey: setHoverCat,
					tools: data.toolList,
					onToolFocus: setToolFocus
				}), /* @__PURE__ */ React.createElement("div", { className: "lc-card" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("trend.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, t("trend.hint")), /* @__PURE__ */ React.createElement("div", { className: "lc-trend-ctl" }, /* @__PURE__ */ React.createElement("div", { className: "lc-gran" }, /* @__PURE__ */ React.createElement("button", {
					className: "lc-gran-btn" + (granularity === "step" ? " lc-gran-on" : ""),
					onClick: () => {
						setGranularity("step");
					}
				}, t("gran.step")), /* @__PURE__ */ React.createElement("button", {
					className: "lc-gran-btn" + (granularity === "turn" ? " lc-gran-on" : ""),
					onClick: () => {
						setGranularity("turn");
					}
				}, t("gran.turn"))), /* @__PURE__ */ React.createElement("div", {
					className: "lc-gran",
					title: t("gran.modeHint")
				}, /* @__PURE__ */ React.createElement("button", {
					className: "lc-gran-btn" + (trendMode === "total" ? " lc-gran-on" : ""),
					onClick: () => {
						setTrendMode("total");
					}
				}, t("gran.total")), /* @__PURE__ */ React.createElement("button", {
					className: "lc-gran-btn" + (trendMode === "delta" ? " lc-gran-on" : ""),
					onClick: () => {
						setTrendMode("delta");
					}
				}, t("gran.delta"))))), displayRequests.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "lc-empty" }, t("trend.empty")) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(TrendChart, {
					key: sessionId,
					requests: displayRequests,
					markers,
					selectedSeq: pinnedReq ? pinnedReq.seq : null,
					hoveredSeq,
					activeTurn,
					granularity,
					mode: trendMode,
					focusTurn,
					onSelect: setSelectedSeq,
					onHover: setHoveredSeq,
					onHoverTurn: setHoverTurn,
					onPickTurn: (turn) => {
						setGranularity("turn");
						setFocusTurn(turn);
					},
					onFocusTurnHandled: () => {
						setFocusTurn(null);
					},
					replyTips
				}), /* @__PURE__ */ React.createElement(RequestDetail, {
					request: activeReq,
					prev: trendMode === "delta" && activeIdx >= 0 ? activeIdx > 0 ? displayRequests[activeIdx - 1] : null : void 0,
					marker: activeReq !== null ? markerOf(activeReq) : void 0,
					brief,
					convOf,
					onLocate: locateNode
				})))), /* @__PURE__ */ React.createElement("div", { className: "lc-col lc-col-browser" }, /* @__PURE__ */ React.createElement(ContextBrowser, {
					data,
					headers,
					useSession: props.useSession,
					loadOlderHistory: props.loadOlderHistory,
					previewSeq: hoveredSeq,
					pinSeq: pinnedReq !== null ? pinnedReq.seq : null,
					hoverKey: hoverCat,
					onHoverKey: setHoverCat,
					toolFocus,
					onToolFocusHandled: clearToolFocus,
					nodeFocus,
					onNodeFocusHandled: clearNodeFocus,
					loadImage
				}))), /* @__PURE__ */ React.createElement("div", { className: "lc-cols" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card lc-col" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("events.title")), /* @__PURE__ */ React.createElement("div", { className: "lc-kinds" }, EVENT_KINDS.map((k) => /* @__PURE__ */ React.createElement("button", {
					key: k,
					className: "lc-gran-btn" + (pickedKinds.includes(k) ? " lc-gran-on lc-kind-" + k : ""),
					onClick: () => {
						toggleKind(k);
					}
				}, t("kind." + k))))), /* @__PURE__ */ React.createElement(EventList, { events: shownEvents })), /* @__PURE__ */ React.createElement("div", { className: "lc-card lc-col" }, /* @__PURE__ */ React.createElement("div", { className: "lc-card-title" }, /* @__PURE__ */ React.createElement("span", { className: "lc-card-title-text" }, t("nodes.title")), /* @__PURE__ */ React.createElement("span", { className: "lc-card-sub" }, t("nodes.hint"))), /* @__PURE__ */ React.createElement(NodeList, {
					nodes,
					dropped: data.droppedNodes || 0
				}))), /* @__PURE__ */ React.createElement("div", { className: "lc-foot" }, t("footer")));
			}
			return function ContextView(props) {
				return h(ErrorBoundary, null, h(ContextViewBody, props));
			};
		}
		//#endregion
		//#region src/client/viewkit.ts
		function makeViewKit(t) {
			const { eventLabel, eventAt } = makeEventText(t);
			return {
				t,
				fmt,
				fmtTime,
				catLabel: (key) => t("cat." + key),
				eventLabel,
				eventAt
			};
		}
		//#endregion
		//#region \0dsh-global-css:C:\Users\mmzm0\AppData\Local\Temp\dsh-context-src\src\client\styles.css.mjs
		const css = ".lc-root{box-sizing:border-box;height:100%;color:var(--dsw-alias-label-primary);padding:16px 20px 32px;font-size:13px;overflow-y:auto}.lc-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;margin-bottom:14px;padding:14px 16px}.lc-card-title{align-items:baseline;gap:8px;margin-bottom:10px;font-weight:600;display:flex}.lc-card-title-text{white-space:nowrap;flex:none}.lc-stats{grid-template-columns:repeat(auto-fit,minmax(62px,1fr));gap:6px;display:grid}.lc-stat{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;flex-direction:column;gap:2px;min-width:0;padding:6px;display:flex}.lc-stat-label{color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;font-size:11px;font-weight:600;overflow:hidden}.lc-stat-value{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;text-align:center;font-size:14px;font-weight:600;overflow:hidden}.lc-stat-sub{color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;font-size:11px;overflow:hidden}.lc-stat-tipped{position:relative}.lc-stat-q{text-align:center;width:11px;height:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);cursor:help;border-radius:50%;margin-left:4px;font-size:9px;font-style:normal;font-weight:700;line-height:11px;display:inline-block}.lc-stat-tipped:hover .lc-stat-q{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary)}.lc-stat-tip{z-index:6;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);width:max-content;max-width:280px;color:var(--dsw-alias-label-primary);pointer-events:none;opacity:0;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:400;line-height:1.5;transition:opacity .12s;position:absolute;top:calc(100% + 6px);left:0;box-shadow:0 2px 8px #0000002e}.lc-stat-tipped:hover .lc-stat-tip{opacity:1}.lc-stat-tip-prices{border-top:1px dashed var(--dsw-alias-border-l1);margin-top:5px;padding-top:5px;display:block}.lc-stat-tip-head{font-weight:600;display:block}.lc-stat-tip-row{margin-top:2px;display:block}.lc-stat-tip-model{color:var(--dsw-alias-label-primary)}.lc-card-sub{color:var(--dsw-alias-label-secondary);margin-left:auto;font-size:12px;font-weight:400}.lc-gran,.lc-kinds{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;gap:2px;margin-left:auto;padding:1px;display:flex}.lc-trend-ctl{align-items:center;gap:6px;margin-left:auto;display:flex}.lc-trend-ctl .lc-gran{margin-left:0}.lc-gran-btn{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:5px;padding:3px 8px;font-family:inherit;font-size:11px;line-height:1}.lc-gran-btn:hover{color:var(--dsw-alias-label-primary)}.lc-gran-on,.lc-gran-on:hover{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.lc-settings-card{background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;transition:border-color .16s,background .16s}.lc-settings-card:hover{border-color:var(--dsw-alias-label-dimmed)}.lc-settings-open,.lc-settings-open:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.lc-settings-head{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.lc-settings-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.lc-settings-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.lc-settings-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.lc-settings-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.lc-settings-open .lc-settings-chevron{transform:rotate(180deg)}.lc-settings-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:4px 0 12px}.lc-settings-row{align-items:center;gap:8px;padding:8px 0;display:flex}.lc-settings-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:14px}.lc-settings-select{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.lc-settings-select:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.lc-settings-select:disabled{opacity:.5;cursor:default}.lc-settings-note{color:var(--dsw-alias-label-tertiary);margin:12px 0 4px;font-size:12px;line-height:1.5}.lc-overview-num{align-items:baseline;gap:6px;margin-bottom:8px;display:flex}.lc-overview-num>b{font-size:20px}.lc-overview-num span{color:var(--dsw-alias-label-secondary)}.lc-overview-pct{margin-left:auto;font-size:11px}.lc-overview-pct b{color:var(--dsw-alias-label-primary);margin-right:4px;font-size:20px}.lc-stacked-wrap{width:100%;position:relative}.lc-stacked{background:#8080802e;border-radius:5px;width:100%;display:flex;position:relative;overflow:hidden}.lc-occupied-box{border:2px solid var(--dsw-alias-label-tertiary);box-sizing:border-box;pointer-events:none;opacity:0;box-shadow:0 0 0 1px var(--dsw-alias-bg-layer-2);border-radius:5px;transition:opacity .12s;position:absolute;top:0;bottom:0;left:0}.lc-occupied-box-on{opacity:1}.lc-bar-tip{z-index:5;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);pointer-events:none;opacity:0;border-radius:6px;padding:3px 8px;font-size:12px;transition:opacity .12s;position:absolute;bottom:calc(100% + 6px);transform:translate(-50%);box-shadow:0 2px 8px #0000002e}.lc-bar-tip-on{opacity:1}.lc-stacked>div{height:100%}.lc-stacked-seg{transition:filter .12s,opacity .12s}.lc-stacked-free{box-sizing:border-box;transition:box-shadow .12s,opacity .12s}.lc-stacked-seg-on{filter:brightness(1.18)}.lc-reserve{z-index:1;pointer-events:auto;cursor:help;background:repeating-linear-gradient(45deg, color-mix(in srgb, var(--dsw-alias-state-warn-primary) 24%, transparent) 0 5px, transparent 5px 10px);position:absolute;top:0;bottom:0}.lc-stacked-free-on{border:2px dashed var(--dsw-alias-label-secondary);border-radius:3px}.lc-stacked-dim .lc-stacked-seg{opacity:.35}.lc-stacked-dim .lc-stacked-seg-on{opacity:1}.lc-stacked-dim .lc-stacked-free{opacity:.35}.lc-stacked-dim .lc-stacked-free-on{opacity:1}.lc-legend{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px 14px;margin-top:10px;display:grid}.lc-chip{min-width:0;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:6px;align-items:center;gap:5px;padding:1px 6px;transition:background-color .12s;display:flex}.lc-chip-label{white-space:nowrap;text-overflow:ellipsis;min-width:0;font-weight:600;overflow:hidden}.lc-chip-nums{white-space:nowrap;flex:none;align-items:baseline;gap:6px;margin-left:auto;display:inline-flex}.lc-chip i,.lc-detail-row i,.lc-node i{border-radius:2px;width:8px;height:8px;display:inline-block}.lc-chip i{transition:box-shadow .12s}.lc-chip em{color:var(--dsw-alias-label-secondary);font-style:normal}.lc-chip-on{background:var(--dsw-alias-interactive-bg-hover);font-weight:600}.lc-chip-on i{box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}.lc-tools{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;display:flex}.lc-tools-label,.lc-tools-more{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;padding:0;font-family:inherit;font-size:12px}.lc-tools-label:hover,.lc-tools-more:hover{text-decoration:underline}.lc-tool-chip{background:var(--dsw-alias-bg-layer-2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:0;border-radius:4px;padding:1px 7px;font-size:12px}.lc-tool-chip:hover{text-decoration:underline}.lc-chartrow{align-items:stretch;gap:6px;display:flex}.lc-axis{box-sizing:border-box;width:40px;height:150px;color:var(--dsw-alias-label-secondary);padding-top:18px;font-size:11px;position:relative}.lc-axis span{line-height:1;position:absolute;right:0}.lc-axis-top{top:13px}.lc-axis-mid{top:69px}.lc-axis-bot{top:125px}.lc-chart-scroll{scrollbar-width:thin;scrollbar-gutter:stable;flex:1;min-width:0;padding-bottom:8px;position:relative;overflow:auto hidden}.lc-chart-fade{pointer-events:none;z-index:2;width:26px;position:absolute;top:0;bottom:0}.lc-chart-fade-l{background:linear-gradient(to right, var(--dsw-alias-bg-layer-1), transparent);left:0}.lc-chart-fade-r{background:linear-gradient(to left, var(--dsw-alias-bg-layer-1), transparent);right:0}.lc-chart{box-sizing:border-box;align-items:flex-end;gap:2px;width:max-content;min-width:100%;height:130px;padding-top:18px;display:flex;position:relative}.lc-grid{border-top:1px dashed var(--dsw-alias-border-l1);pointer-events:none;position:absolute;left:0;right:0}.lc-grid-top{top:18px}.lc-grid-mid{top:74px}.lc-grid-zero{border-top-style:solid;border-top-color:#80808080}.lc-bar{cursor:pointer;border-radius:2px;flex:none;align-items:flex-end;width:14px;height:100%;transition:opacity .12s,background-color .12s;display:flex;position:relative}.lc-chart-dim .lc-bar{opacity:.35}.lc-chart-dim .lc-bar-in-turn{opacity:1}.lc-chart-dim .lc-turn{opacity:.35}.lc-chart-dim .lc-turn-on{opacity:1}.lc-chart-tip{z-index:5;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);pointer-events:none;border-radius:6px;padding:3px 8px;font-size:12px;position:absolute;top:0;transform:translate(-50%);box-shadow:0 2px 8px #0000002e}.lc-bar:hover{background:var(--dsw-alias-bg-layer-2)}.lc-bar-hovered{outline:1px dashed var(--dsw-alias-brand-primary);outline-offset:1px}.lc-bar-selected{outline:2px solid var(--dsw-alias-label-primary);outline-offset:1px}.lc-bar-in-turn{background:#80808024}.lc-bar-stack{flex-direction:column-reverse;width:100%;display:flex}.lc-bar-stack>div{width:100%}.lc-bar-up,.lc-bar-down{width:100%;display:flex;position:absolute;left:0}.lc-bar-up{flex-direction:column-reverse}.lc-bar-down{flex-direction:column}.lc-bar-up>div,.lc-bar-down>div{width:100%}.lc-bar-marker{color:var(--dsw-alias-state-warn-primary);font-size:11px;position:absolute;top:-16px;left:50%;transform:translate(-50%)}.lc-turns{gap:2px;width:max-content;min-width:100%;margin-top:4px;display:flex}.lc-turn{box-sizing:border-box;text-align:center;color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;cursor:pointer;border-radius:3px;flex:none;height:14px;font-size:10px;font-weight:600;line-height:14px;transition:filter .12s,opacity .12s;overflow:hidden}.lc-turn-on{filter:brightness(1.35);color:var(--dsw-alias-label-primary)}.lc-turn-label{text-overflow:ellipsis;max-width:100%;display:inline-block;overflow:hidden}.lc-detail{border-top:1px solid var(--dsw-alias-border-l1);margin-top:12px;padding-top:12px}.lc-detail-head{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:6px 8px;margin-bottom:10px;display:flex}.lc-detail-head b{color:var(--dsw-alias-label-primary);font-size:13px}.lc-detail-time{font-variant-numeric:tabular-nums;white-space:nowrap;margin-left:auto;font-size:12px}.lc-detail-marker{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);border-radius:6px;padding:1px 7px;font-size:11px}.lc-detail-tag{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);border-radius:4px;padding:0 6px;font-size:11px}.lc-detail-metric{font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-label-secondary) 14%, transparent);border-radius:6px;padding:2px 8px;font-size:12px;font-weight:600}.lc-detail-metric-up{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent)}.lc-detail-metric-down{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 15%, transparent)}.lc-detail-rows{grid-template-columns:1fr 1fr;gap:4px 24px;margin-top:10px;display:grid}.lc-brief{flex-direction:column;gap:2px;margin:-4px 0 10px;display:flex}.lc-brief-row{min-width:0;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:0;border-radius:6px;align-items:center;gap:8px;margin-left:-6px;margin-right:-6px;padding:3px 6px;font-family:inherit;font-size:12px;line-height:1.5;transition:background-color .12s;display:flex}.lc-brief-row-link:hover{background:var(--dsw-alias-interactive-bg-hover)}button.lc-brief-row-link{cursor:pointer}.lc-brief-tag{box-sizing:border-box;text-align:center;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);min-width:56px;color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;padding:0 6px;font-size:11px;position:relative}.lc-brief-tip{z-index:6;white-space:normal;text-align:left;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);width:max-content;max-width:240px;color:var(--dsw-alias-label-primary);pointer-events:none;opacity:0;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:400;line-height:1.5;transition:opacity .12s;position:absolute;bottom:calc(100% + 6px);left:0;box-shadow:0 2px 8px #0000002e}.lc-brief-tag:hover .lc-brief-tip{opacity:1}.lc-brief-text{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.lc-brief-chip{text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);max-width:220px;color:var(--dsw-alias-label-primary);border-radius:5px;align-items:center;gap:5px;padding:0 7px;font-size:12px;transition:background-color .12s;display:inline-flex;overflow:hidden}.lc-brief-chip-link{cursor:pointer}.lc-brief-chip-link:hover{background:var(--dsw-alias-interactive-bg-hover)}.lc-brief-more{color:var(--dsw-alias-label-secondary);flex:none;font-size:11px}.lc-detail-row{align-items:center;gap:8px;display:flex}.lc-detail-label{white-space:nowrap;min-width:70px;color:var(--dsw-alias-label-secondary)}.lc-bar-track{background:#8080802e;border-radius:3px;flex:1;height:5px;display:block;position:relative;overflow:hidden}.lc-bar-fill{border-radius:3px;height:100%;display:block}.lc-bar-zero{border-left:1px solid #80808073;position:absolute;top:0;bottom:0;left:50%}.lc-bar-fill-up,.lc-bar-fill-down{height:100%;display:block;position:absolute;top:0}.lc-bar-fill-up{border-radius:0 3px 3px 0;left:50%}.lc-bar-fill-down{border-radius:3px 0 0 3px;right:50%}.lc-detail-num{text-align:right;font-variant-numeric:tabular-nums;width:52px}.lc-detail-num-up{color:var(--dsw-alias-state-success-primary)}.lc-detail-num-down{color:var(--dsw-alias-state-error-primary)}.lc-detail-pct{text-align:right;width:34px;color:var(--dsw-alias-label-secondary)}.lc-cols{flex-wrap:wrap;gap:14px;margin-bottom:14px;display:flex}.lc-col{flex:1;min-width:280px}.lc-cols>.lc-card,.lc-col>.lc-card:last-child{margin-bottom:0}.lc-col-browser{flex-direction:column;display:flex}.lc-col-browser>.lc-card{flex:1}.lc-head>.lc-card:first-child{flex:7 1 0;min-width:360px}.lc-head>.lc-card:last-child{flex:3 1 0;min-width:220px}.lc-pi-grid{grid-template-columns:1fr;gap:8px;display:grid}.lc-pi-row{min-width:0;color:inherit;flex-direction:row;justify-content:space-between;align-items:baseline;gap:12px;text-decoration:none;display:flex}.lc-pi-row:hover .lc-pi-value{text-decoration:underline}.lc-pi-update{color:var(--dsw-alias-state-warn-primary);white-space:nowrap;margin-left:6px;font-size:11px}.lc-pi-label{color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;flex:none;font-size:11px;font-weight:600;overflow:hidden}.lc-pi-value{min-width:0;color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;text-align:right;font-size:13px;font-weight:600;overflow:hidden}.lc-events,.lc-nodes{flex-direction:column;gap:2px;max-height:320px;display:flex;overflow-y:auto}.lc-event{align-items:center;gap:8px;padding:3px 0;display:flex}.lc-event-icon{text-align:center;width:18px;color:var(--dsw-alias-state-warn-primary)}.lc-event-icon.lc-event-inject{color:#a855f7}.lc-event-icon.lc-event-model{color:var(--dsw-alias-brand-primary)}.lc-event-icon.lc-event-mode{color:var(--dsw-alias-label-secondary)}.lc-kind{white-space:nowrap;border-radius:4px;flex:none;padding:1px 6px;font-size:10px;font-weight:600}.lc-kind-inject{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent);color:var(--dsw-alias-state-success-primary)}.lc-kind-compaction{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 15%, transparent);color:var(--dsw-alias-state-error-primary)}.lc-kind-prune{color:#8b5cf6;background:#8b5cf626}.lc-kind-model{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 15%, transparent);color:var(--dsw-alias-brand-primary)}.lc-kind-mode{background:color-mix(in srgb, var(--dsw-alias-label-secondary) 15%, transparent);color:var(--dsw-alias-label-secondary)}.lc-event-label{text-overflow:ellipsis;white-space:nowrap;flex:1;overflow:hidden}.lc-event-at{color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none;font-size:11px}.lc-event-tokens{color:var(--dsw-alias-state-success-primary);white-space:nowrap;font-weight:600}.lc-event-tokens.lc-up{color:var(--dsw-alias-state-warn-primary)}.lc-event-time{color:var(--dsw-alias-label-secondary);font-size:12px}.lc-node{align-items:center;gap:8px;padding:3px 0;display:flex}.lc-node-preview{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);flex:1;overflow:hidden}.lc-node-time{color:var(--dsw-alias-label-secondary);text-align:right;min-width:54px;font-size:12px}.lc-node-tokens{color:var(--dsw-alias-label-secondary)}.lc-nodes-more{color:var(--dsw-alias-label-secondary);padding:3px 0}.lc-empty{color:var(--dsw-alias-label-secondary);text-align:center;padding:18px 0}.lc-error{flex-direction:column;align-items:center;gap:8px;padding:40px 16px;display:flex}.lc-error-msg{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);overflow-wrap:anywhere;border-radius:6px;max-width:100%;padding:4px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.lc-error-retry{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:6px;padding:4px 14px;font-size:12px}.lc-error-retry:hover{border-color:var(--dsw-alias-label-primary)}.lc-foot{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px}.lc-modal-backdrop{z-index:200;background:#00000073;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.lc-modal-card{box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);width:min(720px,100vw - 48px);max-height:min(82vh,760px);box-shadow:var(--dsw-shadow-lv3,0 12px 32px #0006);color:var(--dsw-alias-label-primary);border-radius:12px;padding:16px 18px 18px;font-size:13px;overflow-y:auto}.lc-modal-head{align-items:baseline;gap:8px;margin-bottom:12px;display:flex}.lc-modal-title{font-size:14px;font-weight:600}.lc-modal-close{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;margin-left:auto;padding:2px 6px;font-family:inherit;font-size:18px;line-height:1}.lc-modal-close:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.lc-br-hint{color:var(--dsw-alias-label-secondary);white-space:nowrap;margin-left:auto;font-size:11px;font-weight:400}.lc-br-pick{font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;max-width:240px;padding:3px 6px;font-size:12px}.lc-br-meta{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;gap:6px 16px;margin-bottom:8px;display:flex}.lc-br-meta b{color:var(--dsw-alias-label-primary)}.lc-br-meta .lc-actual{color:var(--dsw-alias-state-success-primary)}.lc-br-note{color:var(--dsw-alias-label-secondary);margin-top:8px;font-size:12px}.lc-br-cats{flex-direction:column;gap:4px;margin-top:10px;display:flex}.lc-br-cat{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:8px;overflow:hidden}.lc-br-cat-empty{opacity:.55}.lc-br-cat-row{width:100%;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;text-align:left;background:0 0;border:0;align-items:center;gap:8px;padding:7px 10px;transition:background-color .12s;display:flex}.lc-br-cat-row:hover,.lc-br-cat-on{background:var(--dsw-alias-interactive-bg-hover)}.lc-br-cat-on i{box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}.lc-br-cat-row i{border-radius:2px;flex:none;width:8px;height:8px;transition:box-shadow .12s;display:inline-block}.lc-br-cat-label{font-weight:600}.lc-br-cat-count{color:var(--dsw-alias-label-secondary);white-space:nowrap;font-size:12px}.lc-br-count-grp{flex:1;align-items:center;gap:4px;min-width:0;display:inline-flex}.lc-br-chev{width:12px;color:var(--dsw-alias-label-secondary);flex:none;transition:transform .12s}.lc-br-chev-on{transform:rotate(90deg)}.lc-br-tokens{color:var(--dsw-alias-label-secondary);flex:none;font-size:12px}.lc-br-delta,.lc-br-tdelta{white-space:nowrap;border-radius:4px;flex:none;padding:0 5px;font-size:11px;font-weight:600}.lc-br-delta-up,.lc-br-tdelta-up{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 15%, transparent)}.lc-br-delta-down,.lc-br-tdelta-down{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 15%, transparent)}.lc-br-tokens-grp{flex:none;align-items:center;gap:4px;min-width:0;display:inline-flex}.lc-br-pct{text-align:right;width:36px;color:var(--dsw-alias-label-secondary);flex:none;font-size:12px}.lc-br-body{border-top:1px solid var(--dsw-alias-border-l1);flex-direction:column;gap:2px;padding:4px 6px;display:flex}.lc-br-elem{border-radius:6px}.lc-br-elem-on{background:var(--dsw-alias-interactive-bg-active)}.lc-br-elem-row{width:100%;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;text-align:left;background:0 0;border:0;border-radius:6px;align-items:center;gap:8px;padding:5px 6px;font-size:12px;transition:background-color .12s;display:flex}.lc-br-elem-row:hover{background:var(--dsw-alias-interactive-bg-hover)}.lc-br-err-dot{background:var(--dsw-alias-state-error-primary);width:6px;height:6px;box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);border-radius:50%;flex:none}.lc-br-tag{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);text-overflow:ellipsis;white-space:nowrap;border-radius:4px;flex:none;max-width:220px;padding:0 6px;font-size:11px;overflow:hidden}.lc-br-preview{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.lc-br-time{color:var(--dsw-alias-label-secondary);flex:none;font-size:11px}.lc-br-content{flex-direction:column;gap:6px;padding:2px 6px 8px 26px;display:flex}.lc-br-dim{color:var(--dsw-alias-label-secondary)}.lc-ts-card{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;min-width:0;overflow:hidden}.lc-ts-card-head{color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:8px;padding:6px 10px;font-size:11px;font-weight:600;display:flex}.lc-ts-card-head b{color:var(--dsw-alias-label-primary)}.lc-ts-call-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}.lc-ts-card-count{margin-left:auto}.lc-ts-card-right{align-items:center;gap:8px;margin-left:auto;display:inline-flex}.lc-ts-card-meta{color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums;font-size:11px;font-weight:400}.lc-ts-call-state{white-space:nowrap;border-radius:999px;flex:none;align-items:center;gap:4px;padding:2px 7px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:600;line-height:1;display:inline-flex}.lc-ts-call-state i{background:currentColor;border-radius:50%;flex:none;width:6px;height:6px}.lc-ts-call-ok{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent)}.lc-ts-call-err{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent)}.lc-ts-desc-body{color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word;scrollbar-width:thin;max-height:320px;margin:0;padding:8px 10px;font-size:12px;line-height:1.55;overflow-y:auto}.lc-ts-param-row{border-top:1px solid var(--dsw-alias-border-l1);grid-template-columns:140px 90px 56px 1fr;align-items:baseline;gap:2px 10px;padding:6px 10px;font-size:12px;display:grid}.lc-ts-param-row:first-of-type{border-top:0}.lc-ts-param-name{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-weight:600;overflow:hidden}.lc-ts-param-type{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow:hidden}.lc-ts-param-req{color:var(--dsw-alias-state-warn-primary);font-size:11px;font-weight:600}.lc-ts-param-req-off{color:var(--dsw-alias-label-secondary);font-size:11px}.lc-ts-param-desc{color:var(--dsw-alias-label-secondary);grid-column:1/-1;line-height:1.5}.lc-ts-params-empty{color:var(--dsw-alias-label-secondary);padding:8px 10px;font-size:12px}.lc-ts-arg-row{border-top:1px solid var(--dsw-alias-border-l1);grid-template-columns:minmax(0,96px) 1fr;align-items:start;column-gap:12px;padding:6px 10px;font-size:12px;display:grid}.lc-ts-arg-row:first-of-type{border-top:0}.lc-ts-arg-row .lc-ts-param-name{text-overflow:unset;white-space:normal;overflow-wrap:anywhere;overflow:visible}.lc-ts-arg-val{color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word;scrollbar-width:thin;max-height:200px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.55;overflow-y:auto}.lc-ts-json{flex-direction:column;gap:4px;display:flex}.lc-ts-json-toggle{color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;align-self:flex-start;padding:0;font-size:11px}.lc-ts-json-toggle:hover{color:var(--dsw-alias-label-primary);text-decoration:underline}.lc-rich-seg{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;gap:2px;margin-left:auto;padding:1px;display:flex}.lc-rich-seg-btn{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:5px;padding:3px 8px;font-family:inherit;font-size:11px;line-height:1}.lc-rich-seg-btn:hover{color:var(--dsw-alias-label-primary)}.lc-rich-seg-on,.lc-rich-seg-on:hover{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.lc-ts-desc-md{color:var(--dsw-alias-label-primary);word-break:break-word;overflow-wrap:anywhere;white-space:pre-line;scrollbar-width:thin;min-width:0;max-height:320px;padding:4px 10px;font-size:12px;line-height:1.55;overflow:hidden auto}.lc-ts-desc-md>div{font-size:13px;line-height:1.55}.lc-ts-desc-md div :is(h1,h2,h3,h4,h5,h6){margin:10px 0 4px;font-size:13px;font-weight:600}.lc-ts-desc-md div p{margin:6px 0}.lc-ts-desc-md div pre{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;margin:6px 0}.lc-ts-desc-md div :not(pre)>code{box-decoration-break:clone;padding:1px 5px;line-height:1.3;font-size:1em!important}.lc-ts-desc-md div table code{font-size:inherit}.lc-att-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:8px 10px;display:grid}.lc-att-item{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-width:0;font:inherit;text-align:left;cursor:pointer;background:0 0;border-radius:8px;align-items:center;gap:8px;padding:6px;display:flex}.lc-att-item:hover{border-color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}.lc-att-thumb{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:6px;flex:none;justify-content:center;align-items:center;width:64px;height:64px;padding:0;display:flex;overflow:hidden}.lc-att-thumb img{object-fit:cover;width:100%;height:100%;display:block}.lc-att-ph,.lc-att-err{color:var(--dsw-alias-label-secondary);text-align:center;padding:2px;font-size:10px}.lc-att-meta{flex-direction:column;gap:2px;min-width:0;display:flex}.lc-att-name{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;word-break:break-word;font-size:12px;line-height:1.3}.lc-att-row{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11px}.lc-att-row-label{min-width:3.2em;font-weight:400;display:inline-block}.lc-att-lightbox{z-index:1000;place-items:center;padding:40px;display:grid;position:fixed;inset:0}.lc-att-lightbox-mask{background:var(--dsw-alias-bg-mask-1,#00000073);backdrop-filter:var(--dsw-mask-blur,blur(2px));position:absolute;inset:0}.lc-att-lightbox-img{object-fit:contain;background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));max-width:min(100%,1600px);max-height:calc(100vh - 80px);box-shadow:var(--dsw-shadow-lv3,0 12px 32px #0006);border-radius:12px;position:relative}.lc-att-lightbox-close{z-index:1;border:1px solid var(--dsw-alias-border-l2-darkmode-thin,var(--dsw-alias-border-l1));background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));width:36px;height:36px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:999px;place-items:center;padding:0;display:grid;position:fixed;top:20px;right:20px}[data-conversation-scroll]:has(.lc-root)>[data-composer-seat]:not(:has([data-approval-key],[data-question-key],[data-plan-review-key])){display:none}";
		const tagId = "dsh-context/styles.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-context";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* dsh-context — Client half (installed package bundle entry).
		*
		* Registers a "上下文/Context" tab in the conversation view ring
		* (`conversation.view` slot, beside Chat/Trajectory) and renders the
		* context-composition timeline: current makeup, per-request stacked-bar
		* history, context events, and the live message list.
		*
		* Since v0.9 the tab needs no custom data plane: the Host half pushes its
		* fold through the harness's session-projection pipeline
		* (`contextTimeline` projection key), and this half reads the finished value
		* from the framework standard kit (`useProjection('contextTimeline')`, a
		* standard prop on every session-scope slot component). No polling, no RPC,
		* no client-side cache.
		*
		* This module is the body of the package's `./client` bundle: tsdown
		* (tsdown.config.ts) bundles it (external `react` — the browser module table
		* supplies it via the injected `require`) into the web boot handoff
		* (`window.__ModuleLoader__.load({id, factory})`). All imports from other
		* client modules are inlined by the bundler; everything here is zero-runtime
		* beyond the bundled source.
		*/
		const NS = "dsh-context";
		function apply(ctx) {
			ctx.effect(() => {
				return ctx.locale.register(NS, {
					zh: DICT_ZH,
					en: DICT_EN
				});
			}, "dsh-context: dictionaries");
			const t = ctx.locale.bind(NS);
			const kit = makeViewKit(t);
			const settings = createContextSettings();
			const ContextView = makeContextView(ctx, kit, settings);
			ctx.effect(() => {
				const noop = () => {};
				const sessions = ctx.get("sessions");
				if (sessions === void 0 || typeof sessions.provide !== "function") return noop;
				try {
					return sessions.provide({
						props: ["loadOlderHistory"],
						resolve: (binding) => ({ props: { loadOlderHistory: () => binding.session.loadOlder() } })
					});
				} catch {
					return noop;
				}
			}, "dsh-context: loadOlderHistory prop");
			ctx.slots.inject("conversation.view", () => {
				return ctx.slots.register({
					name: "conversation.view",
					id: "context",
					order: 20,
					locale: NS,
					label: () => t("tab")
				}, (props) => h(ContextView, props));
			});
			registerContextCommand(ctx, kit);
			const ContextModal = makeContextModal(ctx, kit);
			ctx.slots.inject("conversation.input.overlay", () => {
				return ctx.slots.register({
					name: "conversation.input.overlay",
					id: "context-modal",
					order: 10,
					locale: NS,
					inject: (sessionId) => ({ hooks: { contextModal: modalStoreOf(sessionId) } })
				}, (props) => h(ContextModal, props));
			});
			ctx.inject(["settingsScope"], (raw) => {
				const c = raw;
				const binder = c.settingsScope;
				if (binder === void 0) return;
				c.effect(() => settings.attach(binder.bind({ namespace: NS })), "dsh-context: settings scope");
				const SettingsCard = makeSettingsCard(kit);
				c.slots.inject("settings.plugin.item", () => {
					return c.slots.register({
						name: "settings.plugin.item",
						key: NS,
						locale: NS,
						inject: () => ({
							hooks: { contextSettings: settings.store },
							set: (field, value) => {
								settings.set(field, value);
							}
						})
					}, (props) => h(SettingsCard, props));
				});
			});
		}
		module.exports = {
			name: "dsh-context",
			inject: ["slots", "locale"],
			apply
		};
		//#endregion
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map