import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-card px-6 py-10">
      <p className="text-sm font-bold tracking-wide text-primary uppercase">Recojo</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Entra con tu cuenta</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        La primera persona que entra queda como súper admin: crea tiendas y da créditos.
        Los demás entran como repartidores.
      </p>
      <div className="mt-8 space-y-3">
        {authEnabled ? (
          GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => signIn(provider.providerId, { callbackURL: "/admin" })}
              className="h-12 w-full rounded-full border border-line bg-card text-base font-semibold"
            >
              Continuar con {provider.label}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted">El ingreso está desactivado.</p>
        )}
      </div>
      <Link to="/" className="mt-8 text-center text-sm font-semibold text-muted">
        Volver al pedido
      </Link>
    </main>
  );
}
