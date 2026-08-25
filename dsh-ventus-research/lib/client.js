window.__ModuleLoader__.load({
	id: "dsh-ventus-research",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/question-bridge.tsx
		/**
		* dsh-ventus-research — AskUserQuestion 工作台桥接。
		*
		* 注入 conversation.composer chain slot，select 匹配 AI 提问（kind==='question'），
		* 把 QuestionPublish 广播到模块级 store，供科研工作台订阅显示。
		* 用户在工作台选择后，通过 QuestionWait.respond() 回填 host→模型。
		*
		* 内联类型（duck typing）避免跨插件 import 类型依赖（tsdown external 跳过）。
		*/
		let current = null;
		const listeners = /* @__PURE__ */ new Set();
		function notify() {
			for (const fn of [...listeners]) fn();
		}
		function publishQuestion(wait) {
			current = {
				wait,
				question: wait.payload.questions[0],
				index: 0
			};
			notify();
		}
		function clearQuestion() {
			current = null;
			notify();
		}
		function setQuestionIndex(index) {
			if (current === null) return;
			const q = current.wait.payload.questions[index];
			if (q === void 0) return;
			current = {
				wait: current.wait,
				question: q,
				index
			};
			notify();
		}
		function getCurrentQuestion() {
			return current;
		}
		function subscribeQuestion(fn) {
			listeners.add(fn);
			return () => {
				listeners.delete(fn);
			};
		}
		function useQuestion() {
			return (0, react.useSyncExternalStore)(subscribeQuestion, getCurrentQuestion);
		}
		function selectQuestion({ interactions }) {
			return interactions.find((i) => i.kind === "question") ?? null;
		}
		function QuestionBridge({ matched }) {
			(0, react.useEffect)(() => {
				publishQuestion(matched);
				return () => {
					clearQuestion();
				};
			}, [matched]);
			return null;
		}
		//#endregion
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
			const advanced = [
				"verified",
				"evidenced",
				"adjudicated",
				"published"
			];
			const advancedCount = entries.filter(([s]) => advanced.includes(s)).reduce((a, [, c]) => a + c, 0);
			const pct = stats.total > 0 ? Math.round(advancedCount / stats.total * 100) : 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: chipRowStyle,
				children: entries.map(([status, count]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: chip(statusColor(status)),
					children: [
						status,
						" · ",
						count
					]
				}, status))
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginTop: 8
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						flex: 1,
						height: 6,
						borderRadius: 3,
						background: "var(--dsw-alias-bg-module-platform)",
						overflow: "hidden"
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
						width: `${pct}%`,
						height: "100%",
						background: "var(--dsw-alias-state-success)",
						transition: "width .3s ease"
					} })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						fontSize: 11,
						color: "var(--dsw-alias-label-tertiary)",
						whiteSpace: "nowrap"
					},
					children: [
						"已验证以上 ",
						advancedCount,
						"/",
						stats.total,
						"（",
						pct,
						"%）"
					]
				})]
			})] });
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
		function ClaimDetail({ claim, evidence, adjudications, onChanged }) {
			const evs = evidence.filter((e) => e.claimId === claim.id);
			const adjs = adjudications.filter((a) => a.claim === claim.id);
			const [adjudicating, setAdjudicating] = (0, react.useState)(false);
			const [adjudicatingVerdict, setAdjudicatingVerdict] = (0, react.useState)("accepted");
			const [adjError, setAdjError] = (0, react.useState)("");
			const signAndAdjudicate = async () => {
				setAdjudicating(true);
				setAdjError("");
				try {
					const sign = await fetch("/research-bench/sign", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							claim_id: claim.id,
							revision: claim.version
						})
					}).then((r) => r.json());
					if (sign.ok !== true || sign.token === void 0) {
						setAdjError(sign.error ?? "签发令牌失败");
						return;
					}
					const adj = await fetch("/research-bench/adjudicate", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							claim_id: claim.id,
							verdict: adjudicatingVerdict,
							note: "",
							signature_token: sign.token
						})
					}).then((r) => r.json());
					if (adj.ok !== true) {
						setAdjError(adj.error ?? "裁决失败");
						return;
					}
					onChanged();
				} finally {
					setAdjudicating(false);
				}
			};
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
							style: {
								...kvValStyle,
								display: "flex",
								flexDirection: "column",
								gap: 2
							},
							children: evs.map((e) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								e.source,
								e.stance !== "pending" ? `（${e.stance}）` : "",
								e.link !== null && e.link !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										...pageBtnStyle,
										marginLeft: 6,
										padding: "0 6px",
										fontSize: 11
									},
									onClick: () => {
										window.open(e.link, "_blank", "noopener");
									},
									children: "打开"
								})
							] }, e.id))
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
					}),
					claim.status === "evidenced" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...kvStyle,
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: kvKeyStyle,
							children: "裁决签字"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								...kvValStyle,
								display: "flex",
								gap: 8,
								alignItems: "center",
								flexWrap: "wrap"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: adjudicatingVerdict,
									disabled: adjudicating,
									onChange: (e) => {
										setAdjudicatingVerdict(e.target.value);
									},
									style: {
										border: "1px solid var(--dsw-alias-border-l2)",
										background: "var(--dsw-alias-bg-layer-1)",
										color: "var(--dsw-alias-label-primary)",
										borderRadius: 8,
										padding: "2px 8px",
										fontSize: 12
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "accepted",
											children: "接受"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "limited",
											children: "限定"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "rejected",
											children: "拒绝"
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: refreshBtnStyle,
									disabled: adjudicating,
									onClick: () => {
										signAndAdjudicate();
									},
									children: adjudicating ? "签字中…" : "签字裁决"
								}),
								adjError !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 11,
										color: "var(--dsw-alias-state-danger)"
									},
									children: adjError
								})
							]
						})]
					})
				]
			});
		}
		function QuestionPanel() {
			const pending = useQuestion();
			const [picked, setPicked] = (0, react.useState)({});
			const [submitting, setSubmitting] = (0, react.useState)(false);
			if (pending === null) return null;
			const { wait, question, index } = pending;
			const total = wait.payload.questions.length;
			const options = question.options ?? [];
			const selected = picked[question.id] ?? [];
			const toggle = (label) => {
				setPicked((prev) => {
					const cur = prev[question.id] ?? [];
					if (question.multiSelect) return {
						...prev,
						[question.id]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]
					};
					return {
						...prev,
						[question.id]: [label]
					};
				});
			};
			const submit = async () => {
				if (submitting) return;
				setSubmitting(true);
				const answers = wait.payload.questions.map((q) => {
					const sel = picked[q.id] ?? [];
					return sel.length > 0 ? {
						id: q.id,
						selected: sel
					} : {
						id: q.id,
						custom: ""
					};
				});
				try {
					await wait.respond({
						ok: true,
						value: {
							sessionId: wait.sessionId,
							answer: { answers }
						}
					});
				} catch {}
				setSubmitting(false);
			};
			const cancel = () => {
				wait.respond({
					ok: false,
					error: {
						code: "cancelled",
						message: "user closed",
						details: {}
					}
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: cardStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: cardTitleStyle,
						children: ["AI 提问（工作台作答）", total > 1 ? ` · ${index + 1}/${total}` : ""]
					}),
					question.header !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 13,
							fontWeight: 600,
							color: "var(--dsw-alias-label-primary)",
							marginBottom: 4
						},
						children: question.header
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 13,
							color: "var(--dsw-alias-label-primary)",
							marginBottom: 8
						},
						children: question.question
					}),
					options.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 6
						},
						children: options.map((opt) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							style: {
								display: "flex",
								gap: 8,
								alignItems: "flex-start",
								cursor: "pointer",
								fontSize: 12
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: question.multiSelect ? "checkbox" : "radio",
								checked: selected.includes(opt.label),
								style: { marginTop: 3 },
								onChange: () => {
									toggle(opt.label);
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: 2
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: { color: "var(--dsw-alias-label-primary)" },
									children: opt.label
								}), opt.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 11,
										color: "var(--dsw-alias-label-tertiary)"
									},
									children: opt.description
								})]
							})]
						}, opt.label))
					}),
					options.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 12,
							color: "var(--dsw-alias-label-tertiary)"
						},
						children: "（无选项，直接提交或取消）"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							marginTop: 10
						},
						children: [
							index > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: pageBtnStyle,
								onClick: () => setQuestionIndex(index - 1),
								children: "上一题"
							}),
							index < total - 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: pageBtnStyle,
								onClick: () => setQuestionIndex(index + 1),
								children: "下一题"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: refreshBtnStyle,
								disabled: submitting,
								onClick: () => {
									submit();
								},
								children: "提交"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: pageBtnStyle,
								disabled: submitting,
								onClick: cancel,
								children: "取消"
							})
						]
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(QuestionPanel, {}),
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
							adjudications: data.adjudications ?? [],
							onChanged: load
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
			ctx.slots.inject("conversation.composer", () => ctx.slots.register({
				name: "conversation.composer",
				select: selectQuestion
			}, (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QuestionBridge, { matched: props.matched })));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map