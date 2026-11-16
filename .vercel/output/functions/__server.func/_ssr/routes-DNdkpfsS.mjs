import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { a as useCurrentUserState, r as telHref, t as formatCop } from "./format-BL-Jrhx5.mjs";
import { a as SlidersHorizontal, c as ChevronsRight, d as ChevronDown, i as ThumbsDown, l as ChevronRight, n as TriangleAlert, o as Scan, r as ThumbsUp, s as Phone, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as ensureProfile, d as setOrderStatus, n as Route$3, u as rateStore } from "./router-CRLBAG87.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DNdkpfsS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function bannerFor(order) {
	if (order.status === "picked") return "Ya tienes el pedido. Llévalo con cuidado.";
	if (order.status === "delivered") return "Pedido entregado. Gracias por el servicio.";
	if (order.status === "exited") return "Saliste de este pedido.";
	return order.statusMessage;
}
function ctaFor(status) {
	if (status === "picked") return "Entregué el pedido";
	if (status === "delivered") return "Pedido entregado";
	if (status === "exited") return "Volver al pedido";
	return "Tengo el pedido";
}
function QrMark({ value }) {
	const n = 25;
	const cells = new Array(625).fill(false);
	let hash = 2166136261;
	for (const ch of value) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
	for (let i = 0; i < cells.length; i++) {
		hash = Math.imul(hash ^ i + 17, 16777619);
		cells[i] = (hash >>> 0) % 3 !== 0;
	}
	const stamp = (ox, oy) => {
		for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
			const edge = x === 0 || y === 0 || x === 6 || y === 6;
			const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
			cells[(oy + y) * n + (ox + x)] = edge || core;
		}
	};
	stamp(0, 0);
	stamp(18, 0);
	stamp(0, 18);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${n} ${n}`,
		className: "h-52 w-52 text-ink",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			width: n,
			height: n,
			className: "fill-card"
		}), cells.map((on, i) => on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: i % n,
			y: Math.floor(i / n),
			width: "1",
			height: "1",
			fill: "currentColor"
		}, i) : null)]
	});
}
function Overlay({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/40",
		onClick: onClose,
		role: "presentation",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-label": title,
			className: "max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-3 pb-8",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-line" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-extrabold",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Cerrar",
						onClick: onClose,
						className: "grid size-11 place-items-center rounded-full bg-paper",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				children
			]
		})
	});
}
function PickupScreen({ order, onOrder, profile }) {
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const address = [order.address, order.city].filter(Boolean).join(", ");
	const phone = telHref(order.phone);
	async function run(task, done) {
		if (busy) return;
		setBusy(true);
		try {
			onOrder(await task());
			if (done) toast.success(done);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo guardar");
		} finally {
			setBusy(false);
		}
	}
	function onPrimary() {
		if (order.status === "ready") run(() => setOrderStatus({ data: {
			id: order.id,
			status: "picked"
		} }), "Pedido recogido");
		else if (order.status === "picked") run(() => setOrderStatus({ data: {
			id: order.id,
			status: "delivered"
		} }), "Entrega confirmada");
		else if (order.status === "exited") run(() => setOrderStatus({ data: {
			id: order.id,
			status: "ready"
		} }));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card sm:shadow-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					order.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: order.photoUrl,
						alt: `Fachada de ${order.storeName}`,
						className: "block aspect-[720/308] w-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-[720/308] w-full bg-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Volver",
						onClick: () => setSheet("options"),
						className: "absolute top-3 left-3 grid size-14 place-items-center rounded-2xl bg-card shadow-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							className: "size-7",
							strokeWidth: 2.25
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSheet("photo"),
						className: "absolute right-3 bottom-6 inline-flex items-center gap-1 rounded-full bg-ink/80 py-1.5 pr-2 pl-3 text-sm font-semibold text-primary-fg",
						children: ["1/1", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 -mt-5 flex flex-1 flex-col rounded-t-3xl bg-card px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mt-2 h-1 w-10 rounded-full bg-line" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mt-4 flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-xl font-extrabold tracking-tight",
									children: order.storeName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setSheet("qr"),
									className: "rounded-full bg-badge px-2.5 py-1 text-xs font-bold text-primary-fg",
									children: "QR-Code"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-snug text-muted",
								children: address
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Ver código QR",
								onClick: () => setSheet("qr"),
								className: "grid size-12 place-items-center rounded-full bg-paper",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, {
									className: "size-6",
									strokeWidth: 1.75
								})
							}), phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: phone,
								"aria-label": `Llamar a la tienda ${order.phone}`,
								className: "grid size-12 place-items-center rounded-full bg-paper text-ink",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
									className: "size-6",
									strokeWidth: 1.75
								})
							}) : null]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-2xl bg-paper px-4 py-4 text-base leading-snug font-medium",
						children: bannerFor(order)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4 rounded-3xl border border-line px-4 pt-5 pb-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-extrabold tracking-tight",
								children: order.headline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy || order.status === "delivered",
								onClick: onPrimary,
								className: "mt-5 h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-fg transition active:brightness-95 disabled:opacity-60",
								children: ctaFor(order.status)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSheet("details"),
								className: "mt-3 w-full py-2 text-center text-sm font-medium text-muted",
								children: "Detalles del pedido ›"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSheet("help"),
						className: "mt-4 flex w-full items-center gap-3 rounded-2xl bg-paper px-4 py-4 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
								className: "size-5 shrink-0",
								strokeWidth: 1.75
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 font-medium",
								children: "Centro de ayuda"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-muted" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4 rounded-3xl bg-paper px-2 pt-4 pb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 text-center text-base font-medium",
							children: "¿Te gustó el servicio de la tienda?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 grid grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void run(() => rateStore({ data: {
									id: order.id,
									rating: "no"
								} })),
								className: `flex items-center justify-center gap-3 py-4 text-lg font-medium ${order.rating === "no" ? "text-primary" : "text-ink"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbsDown, {
									className: "size-8",
									strokeWidth: 1.6,
									fill: order.rating === "no" ? "currentColor" : "none"
								}), "No"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void run(() => rateStore({ data: {
									id: order.id,
									rating: "yes"
								} })),
								className: `flex items-center justify-center gap-3 border-l border-line py-4 text-lg font-medium ${order.rating === "yes" ? "text-primary" : "text-ink"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbsUp, {
									className: "size-8",
									strokeWidth: 1.6,
									fill: order.rating === "yes" ? "currentColor" : "none"
								}), "Sí"]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex items-center gap-3 pt-5 pb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Opciones",
							onClick: () => setSheet("options"),
							className: "grid size-12 shrink-0 place-items-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
								className: "size-7",
								strokeWidth: 2.1
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSheet("exit"),
							className: "flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-chip text-lg font-semibold text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsRight, {
								className: "size-5",
								strokeWidth: 2.25
							}), "Salir"]
						})]
					})
				]
			}),
			sheet === "details" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
				title: "Detalles del pedido",
				onClose: () => setSheet(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: ["Código ", order.code]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-line",
						children: order.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: item.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: ["×", item.qty]
							})]
						}, item.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Total"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg font-extrabold",
							children: formatCop(order.totalCop)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed",
						children: [
							order.customerName,
							". ",
							order.note
						]
					})
				]
			}) : null,
			sheet === "help" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Centro de ayuda",
				onClose: () => setSheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-3 text-sm leading-relaxed",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "No encuentro la tienda"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-muted",
								children: [
									order.storeName,
									" queda en ",
									address,
									". Llama si la fachada no coincide."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "El pedido no está listo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted",
								children: "Espera en caja y no marques “Tengo el pedido” hasta recibirlo completo."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Problema con el QR"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-muted",
								children: [
									"Muestra el código ",
									order.code,
									" en caja. Si no lee, dicta el número."
								]
							})]
						})
					]
				})
			}) : null,
			sheet === "qr" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "QR-Code",
				onClose: () => setSheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center rounded-3xl border border-line px-4 py-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrMark, { value: order.code }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-2xl font-extrabold tracking-wide",
							children: order.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-center text-sm text-muted",
							children: ["Muéstralo en caja de ", order.storeName]
						})
					]
				})
			}) : null,
			sheet === "photo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 flex items-center justify-center bg-ink",
				onClick: () => setSheet(null),
				role: "presentation",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Cerrar foto",
					className: "absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-card text-ink",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				}), order.photoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: order.photoUrl,
					alt: `Fachada de ${order.storeName}`,
					className: "max-h-[80dvh] w-full max-w-md object-contain"
				}) : null]
			}) : null,
			sheet === "options" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Opciones",
				onClose: () => setSheet(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Pedido"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: order.code
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Créditos"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: profile ? profile.credits.toLocaleString("es-CO") : "Entra para verlos"
								}),
								profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: profile.role === "superadmin" ? "Súper admin" : "Repartidor"
								}) : null
							]
						}),
						profile?.role === "superadmin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/admin",
							className: "flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-fg",
							children: "Tiendas y créditos"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							className: "flex h-12 items-center justify-center rounded-full bg-ink font-bold text-primary-fg",
							children: profile ? "Tu cuenta" : "Entrar"
						}),
						profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void signOut("/").catch(() => toast.error("No se pudo salir")),
							className: "h-12 w-full rounded-full bg-paper font-semibold",
							children: "Cerrar sesión"
						}) : null
					]
				})
			}) : null,
			sheet === "exit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center",
				onClick: () => setSheet(null),
				role: "presentation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-label": "Salir del pedido",
					className: "w-full max-w-md rounded-t-3xl bg-card px-5 pt-5 pb-8 sm:rounded-3xl",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-extrabold",
							children: "¿Salir de este pedido?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Puedes retomarlo cuando quieras."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSheet(null),
								className: "h-12 rounded-full bg-paper font-semibold",
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setSheet(null);
									run(() => setOrderStatus({ data: {
										id: order.id,
										status: "exited"
									} }), "Saliste del pedido");
								},
								className: "h-12 rounded-full bg-primary font-bold text-primary-fg",
								children: "Salir"
							})]
						})
					]
				})
			}) : null
		]
	});
}
function Home() {
	const initial = Route$3.useLoaderData();
	const [order, setOrder] = (0, import_react.useState)(initial);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const { user, isPending } = useCurrentUserState();
	(0, import_react.useEffect)(() => {
		setOrder(initial);
	}, [initial]);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) {
			setProfile(null);
			return;
		}
		const label = user.displayName ?? user.primaryEmail ?? "";
		ensureProfile({ data: label }).then(setProfile).catch(() => setProfile(null));
	}, [user, isPending]);
	if (!order) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto flex min-h-dvh max-w-md items-center justify-center bg-card px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg font-semibold",
			children: "No hay pedidos para recolectar."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickupScreen, {
		order,
		onOrder: setOrder,
		profile
	});
}
//#endregion
export { Home as component };
