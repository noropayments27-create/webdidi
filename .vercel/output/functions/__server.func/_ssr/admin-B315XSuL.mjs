import { o as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { a as hasGateSessionMarker } from "./server-D7vYKbXN.mjs";
import { a as useCurrentUserState, i as useCurrentUser, n as formatCredits } from "./format-BL-Jrhx5.mjs";
import { u as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as ensureProfile, c as listProfiles, f as updateHeadline, i as assignPickupStore, l as listStores, o as getActiveOrder, r as addStore, s as grantCredits } from "./router-CRLBAG87.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-B315XSuL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
function Admin() {
	const { user, isPending } = useCurrentUserState();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [stores, setStores] = (0, import_react.useState)([]);
	const [people, setPeople] = (0, import_react.useState)([]);
	const [order, setOrder] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("Bogotá, Colombia");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [headline, setHeadline] = (0, import_react.useState)("");
	const [amounts, setAmounts] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setReady(true);
			return;
		}
		const label = user.displayName ?? user.primaryEmail ?? "";
		ensureProfile({ data: label }).then(async (me) => {
			setProfile(me);
			if (me.role !== "superadmin") return;
			const [storeRows, profileRows, active] = await Promise.all([
				listStores(),
				listProfiles(),
				getActiveOrder()
			]);
			setStores(storeRows);
			setPeople(profileRows);
			setOrder(active);
			setHeadline(active?.headline ?? "");
		}).catch((error) => {
			toast.error(error instanceof Error ? error.message : "No se pudo cargar");
		}).finally(() => setReady(true));
	}, [user, isPending]);
	async function refresh() {
		const [storeRows, profileRows, active] = await Promise.all([
			listStores(),
			listProfiles(),
			getActiveOrder()
		]);
		setStores(storeRows);
		setPeople(profileRows);
		setOrder(active);
		setHeadline(active?.headline ?? "");
	}
	if (!ready || isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh max-w-md bg-card px-5 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-40 rounded-full bg-paper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-28 rounded-3xl bg-paper" })]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-card px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-extrabold",
				children: "Súper admin"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-muted",
				children: "Entra para crear tiendas y dar créditos."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/login",
				className: "mt-6 flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-fg",
				children: "Entrar"
			})
		]
	});
	if (profile && profile.role !== "superadmin") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col bg-card px-5 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "inline-flex items-center gap-1 text-sm font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" }), " Pedido"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 text-2xl font-extrabold",
				children: "Tu cuenta"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-muted",
				children: "Eres repartidor. Los créditos los asigna el súper admin."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 rounded-3xl bg-paper px-4 py-5 text-3xl font-extrabold",
				children: [formatCredits(profile.credits), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-sm font-medium text-muted",
					children: "créditos"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh w-full max-w-md bg-card px-5 pt-5 pb-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "inline-flex items-center gap-1 text-sm font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" }), " Pedido"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-5 text-2xl font-extrabold tracking-tight",
				children: "Súper admin"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Tiendas, el texto del recuadro y los créditos de cada cuenta."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-3xl border border-line p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-extrabold",
						children: "Texto del recuadro"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"Hoy dice “",
							order?.headline ?? "…",
							"”."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex gap-2",
						onSubmit: (event) => {
							event.preventDefault();
							updateHeadline({ data: headline }).then(async (next) => {
								setOrder(next);
								toast.success("Texto actualizado");
							}).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar"));
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: headline,
							onChange: (event) => setHeadline(event.target.value),
							className: "h-12 min-w-0 flex-1 rounded-2xl bg-paper px-3 font-semibold outline-none",
							maxLength: 80
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "h-12 rounded-full bg-ink px-4 font-bold text-primary-fg",
							children: "Guardar"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-extrabold",
						children: "Tiendas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: stores.map((store) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-paper px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: store.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: [store.address, store.city].filter(Boolean).join(", ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => assignPickupStore({ data: store.id }).then((next) => {
										setOrder(next);
										toast.success("Esa tienda quedó en el recojo");
									}).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cambiar")),
									className: "mt-2 text-sm font-bold text-primary",
									children: order?.storeId === store.id ? "En pantalla" : "Usar en el recojo"
								})
							]
						}, store.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 space-y-2 rounded-3xl border border-line p-4",
						onSubmit: (event) => {
							event.preventDefault();
							addStore({ data: {
								name,
								address,
								city,
								phone
							} }).then(async () => {
								setName("");
								setAddress("");
								setPhone("");
								await refresh();
								toast.success("Tienda agregada");
							}).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo crear"));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-extrabold",
								children: "Nueva tienda"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								value: name,
								onChange: (event) => setName(event.target.value),
								placeholder: "Nombre",
								className: "h-12 w-full rounded-2xl bg-paper px-3 outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								value: address,
								onChange: (event) => setAddress(event.target.value),
								placeholder: "Dirección",
								className: "h-12 w-full rounded-2xl bg-paper px-3 outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: city,
								onChange: (event) => setCity(event.target.value),
								placeholder: "Ciudad",
								className: "h-12 w-full rounded-2xl bg-paper px-3 outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: phone,
								onChange: (event) => setPhone(event.target.value),
								placeholder: "Teléfono",
								className: "h-12 w-full rounded-2xl bg-paper px-3 outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "h-12 w-full rounded-full bg-primary font-bold text-primary-fg",
								children: "Agregar tienda"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-extrabold",
					children: "Créditos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-2xl bg-paper px-4 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: person.displayName || "Sin nombre"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									person.role === "superadmin" ? "Súper admin" : "Repartidor",
									" ·",
									" ",
									formatCredits(person.credits),
									" créditos"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-2 flex gap-2",
								onSubmit: (event) => {
									event.preventDefault();
									const amount = Number(amounts[person.userId] ?? "");
									grantCredits({ data: {
										userId: person.userId,
										amount
									} }).then(async () => {
										setAmounts((prev) => ({
											...prev,
											[person.userId]: ""
										}));
										await refresh();
										toast.success("Créditos asignados");
									}).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo asignar"));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									inputMode: "numeric",
									value: amounts[person.userId] ?? "",
									onChange: (event) => setAmounts((prev) => ({
										...prev,
										[person.userId]: event.target.value
									})),
									placeholder: "Monto",
									className: "h-11 min-w-0 flex-1 rounded-2xl bg-card px-3 outline-none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "h-11 rounded-full bg-ink px-4 text-sm font-bold text-primary-fg",
									children: "Dar"
								})]
							})
						]
					}, person.userId))
				})]
			})
		]
	});
}
//#endregion
export { Admin as component };
