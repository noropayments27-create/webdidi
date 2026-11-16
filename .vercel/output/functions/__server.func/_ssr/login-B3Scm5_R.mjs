import { S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn } from "./client-1vAx-gM_.mjs";
import { t as GROK_PROVIDERS } from "./server-D7vYKbXN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-B3Scm5_R.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-card px-6 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-bold tracking-wide text-primary uppercase",
				children: "Recojo"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-3xl font-extrabold tracking-tight",
				children: "Entra con tu cuenta"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-base leading-relaxed text-muted",
				children: "La primera persona que entra queda como súper admin: crea tiendas y da créditos. Los demás entran como repartidores."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 space-y-3",
				children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => signIn(provider.providerId, { callbackURL: "/admin" }),
					className: "h-12 w-full rounded-full border border-line bg-card text-base font-semibold",
					children: ["Continuar con ", provider.label]
				}, provider.providerId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-8 text-center text-sm font-semibold text-muted",
				children: "Volver al pedido"
			})
		]
	});
}
//#endregion
export { Login as component };
