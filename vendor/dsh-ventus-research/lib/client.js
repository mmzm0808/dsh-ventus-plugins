window.__ModuleLoader__.load({
	id: "dsh-ventus-research",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/workbench.tsx
		/**
		* dsh-ventus-research — 科研工作台主组件。
		*
		* 原生风格：全部使用 DSH 设计 token（--dsw-alias-* / --edge-accent），不固定
		* 颜色，随主题/皮肤适配。性能：claims 列表分页（20 条/页）、详情懒加载、
		* tab 挂载时读一次 state（不轮询）、列表项 memo。
		*/
		const PAGE_SIZE = 20;
		/** claim 状态 → 语义色（原生 token）。 */
		const STATUS_COLOR = {
			draft: "var(--dsw-alias-label-tertiary)",
			derived: "var(--dsw-alias-label-secondary)",
			verified: "var(--dsw-alias-state-success)",
			"needs-review": "var(--dsw-alias-state-warning)",
			mismatch: "var(--dsw-alias-state-danger)",
			evidenced: "var(--dsw-alias-state-business-primary)",
			adjudicated: "var(--dsw-alias-state-business-primary)",
			published: "var(--dsw-alias-state-success)",
			superseded: "var(--dsw-alias-label-tertiary)"
		};
		const statusColor = (status) => STATUS_COLOR[status] ?? "var(--dsw-alias-label-tertiary)";
		const rootStyle = {
			height: "100%",
			overflowY: "auto",
			padding: "16px 18px 24px",
			display: "flex",
			flexDirection: "column",
			gap: 12,
			color: "var(--dsw-alias-label-primary)",
			fontSize: 13,
			lineHeight: "20px"
		};
		const headerStyle = {
			display: "flex",
			alignItems: "center",
			gap: 10,
			flexWrap: "wrap"
		};
		const topicStyle = {
			fontSize: 15,
			fontWeight: 600,
			color: "var(--dsw-alias-label-primary)"
		};
		const trustBadge = (trust) => ({
			fontSize: 11,
			lineHeight: "18px",
			padding: "0 8px",
			borderRadius: 8,
			border: "1px solid var(--dsw-alias-border-l2)",
			color: trust === "high" ? "var(--dsw-alias-state-success)" : "var(--dsw-alias-state-warning)",
			background: "transparent"
		});
		const rootPathStyle = {
			fontSize: 11,
			color: "var(--dsw-alias-label-tertiary)",
			fontFamily: "var(--ds-font-family-code, ui-monospace, monospace)",
			wordBreak: "break-all"
		};
		const cardStyle = {
			border: "1px solid var(--dsw-alias-border-l1)",
			borderRadius: 10,
			background: "var(--dsw-alias-bg-layer-1)",
			padding: "12px 14px"
		};
		const cardTitleStyle = {
			fontSize: 12,
			fontWeight: 600,
			color: "var(--dsw-alias-label-secondary)",
			marginBottom: 10
		};
		const chipRowStyle = {
			display: "flex",
			flexWrap: "wrap",
			gap: 8
		};
		const chip = (color) => ({
			fontSize: 12,
			lineHeight: "20px",
			padding: "0 10px",
			borderRadius: 99,
			border: "1px solid var(--dsw-alias-border-l2)",
			color,
			background: "transparent"
		});
		const listStyle = {
			display: "flex",
			flexDirection: "column"
		};
		const rowStyle = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			padding: "7px 8px",
			borderRadius: 8,
			border: "none",
			background: "transparent",
			color: "var(--dsw-alias-label-primary)",
			cursor: "pointer",
			textAlign: "left",
			width: "100%"
		};
		const rowHover = {
			...rowStyle,
			background: "var(--dsw-alias-interactive-bg-hover)"
		};
		const statusDot = (status) => ({
			flex: "none",
			width: 8,
			height: 8,
			borderRadius: "50%",
			background: statusColor(status),
			boxShadow: status === "mismatch" ? "0 0 0 1px var(--dsw-alias-state-danger)" : "none"
		});
		const rowIdStyle = {
			flex: "none",
			fontSize: 12,
			fontWeight: 600,
			color: "var(--dsw-alias-label-secondary)",
			fontVariantNumeric: "tabular-nums"
		};
		const rowTextStyle = {
			flex: "0 1 auto",
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap"
		};
		const rowMetaStyle = {
			flex: "none",
			fontSize: 11,
			color: "var(--dsw-alias-label-tertiary)",
			marginLeft: "auto"
		};
		const pagerStyle = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			paddingTop: 8
		};
		const pageBtnStyle = {
			border: "1px solid var(--dsw-alias-border-l2)",
			background: "transparent",
			color: "var(--dsw-alias-label-primary)",
			borderRadius: 8,
			padding: "2px 10px",
			fontSize: 12,
			cursor: "pointer"
		};
		const detailStyle = {
			marginTop: 4,
			border: "1px solid var(--dsw-alias-border-l1)",
			borderRadius: 10,
			background: "var(--dsw-alias-bg-layer-1)",
			padding: "12px 14px",
			display: "flex",
			flexDirection: "column",
			gap: 6
		};
		const kvStyle = {
			display: "flex",
			gap: 8,
			fontSize: 12,
			lineHeight: "20px"
		};
		const kvKeyStyle = {
			flex: "none",
			width: 84,
			color: "var(--dsw-alias-label-tertiary)"
		};
		const kvValStyle = {
			flex: 1,
			color: "var(--dsw-alias-label-primary)",
			wordBreak: "break-all"
		};
		const emptyStyle = {
			padding: "28px 8px",
			textAlign: "center",
			fontSize: 12,
			color: "var(--dsw-alias-label-tertiary)"
		};
		const refreshBtnStyle = {
			marginLeft: "auto",
			border: "1px solid var(--dsw-alias-border-l2)",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			borderRadius: 8,
			padding: "2px 12px",
			fontSize: 12,
			cursor: "pointer"
		};
		const StatusChips = (0, react.memo)(function StatusChips({ stats }) {
			if (stats === void 0) return null;
			const entries = Object.entries(stats.byStatus);
			if (entries.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: chipRowStyle,
				children: entries.map(([status, count]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: chip(statusColor(status)),
					children: [
						status,
						" · ",
						count
					]
				}, status))
			});
		});
		const ClaimRow = (0, react.memo)(function ClaimRow({ claim, active, onClick }) {
			const conv = claim.conventionId !== void 0 ? ` [${claim.conventionId}]` : "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				style: active ? rowHover : rowStyle,
				onClick,
				title: claim.text,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: statusDot(claim.status),
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: rowIdStyle,
						children: claim.id
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: rowTextStyle,
						children: claim.text
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: rowMetaStyle,
						children: [
							"v",
							claim.version,
							conv
						]
					})
				]
			});
		});
		function ClaimDetail({ claim, evidence, adjudications }) {
			const evs = evidence.filter((e) => e.claimId === claim.id);
			const adjs = adjudications.filter((a) => a.claim === claim.id);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: detailStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "状态"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								...kvValStyle,
								color: statusColor(claim.status)
							},
							children: claim.status
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "口径"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: claim.conventionId ?? "未声明"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "误差档"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: claim.tolClass
						})]
					}),
					claim.deriveRef !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "推导"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: claim.deriveRef
						})]
					}),
					claim.verifyRef !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "验证"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: claim.verifyRef
						})]
					}),
					claim.texRef !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "成稿"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: claim.texRef
						})]
					}),
					evs.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "证据"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: evs.map((e) => `${e.source}${e.stance !== "pending" ? `（${e.stance}）` : ""}`).join("；")
						})]
					}),
					adjs.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: kvStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "裁决"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvValStyle,
							children: adjs.map((a) => `${a.verdict} · ${a.by} · ${a.at}`).join("；")
						})]
					})
				]
			});
		}
		function ResearchWorkbench(_props) {
			const [data, setData] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(true);
			const [page, setPage] = (0, react.useState)(0);
			const [selected, setSelected] = (0, react.useState)(null);
			const load = (0, react.useCallback)(() => {
				setLoading(true);
				fetch("/research-bench/state", { cache: "no-store" }).then(async (res) => res.json()).then((payload) => {
					setData(payload);
					setLoading(false);
				}).catch(() => {
					setData({
						ok: false,
						error: "科研工作台服务不可达"
					});
					setLoading(false);
				});
			}, []);
			(0, react.useEffect)(load, [load]);
			const claims = data?.claims ?? [];
			const totalPages = Math.max(1, Math.ceil(claims.length / PAGE_SIZE));
			const safePage = Math.min(page, totalPages - 1);
			const pageClaims = (0, react.useMemo)(() => claims.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE), [claims, safePage]);
			const selectedClaim = selected === null ? void 0 : claims.find((c) => c.id === selected);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: rootStyle,
				children: [
					data === null && loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: emptyStyle,
						children: "加载中…"
					}),
					data?.ok === false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: emptyStyle,
						children: data.error ?? "未打开课题（先用 rb_open 立项）"
					}),
					data?.ok === true && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: headerStyle,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: topicStyle,
									children: data.topic
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: trustBadge(data.trust),
									children: ["trust: ", data.trust ?? "low"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: rootPathStyle,
									children: data.root
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: refreshBtnStyle,
									onClick: load,
									children: "刷新"
								})
							]
						}),
						data.stats !== void 0 && data.stats.total > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: cardStyle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: cardTitleStyle,
								children: [
									"概览 · 共 ",
									data.stats.total,
									" 条 claim"
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StatusChips, { stats: data.stats })]
						}),
						claims.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: emptyStyle,
							children: "暂无 claim — 让 AI 用 rb_open / rb_derive 建立科研课题"
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: cardStyle,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: cardTitleStyle,
									children: "claims"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: listStyle,
									children: pageClaims.map((claim) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClaimRow, {
										claim,
										active: claim.id === selected,
										onClick: () => {
											setSelected((prev) => prev === claim.id ? null : claim.id);
										}
									}, claim.id))
								}),
								totalPages > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: pagerStyle,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: pageBtnStyle,
											disabled: safePage === 0,
											onClick: () => setPage(safePage - 1),
											children: "上一页"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: {
												fontSize: 12,
												color: "var(--dsw-alias-label-tertiary)"
											},
											children: [
												safePage + 1,
												" / ",
												totalPages
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: pageBtnStyle,
											disabled: safePage >= totalPages - 1,
											onClick: () => setPage(safePage + 1),
											children: "下一页"
										})
									]
								})
							]
						}),
						selectedClaim !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClaimDetail, {
							claim: selectedClaim,
							evidence: data.evidence ?? [],
							adjudications: data.adjudications ?? []
						})
					] })
				]
			});
		}
		//#endregion
		//#region src/client/index.tsx
		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "research",
				order: 30,
				locale: "research",
				label: () => "科研"
			}, (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResearchWorkbench, { ...props })));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map