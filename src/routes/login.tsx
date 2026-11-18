import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleProvider = GROK_PROVIDERS.find((provider) => provider.idp === "google");

  async function handleSignIn(target: "admin" | "user") {
    if (pendingProvider || !googleProvider) return;
    setPendingProvider(target);
    setErrorMessage(null);
    try {
      await signIn(googleProvider.providerId, {
        callbackURL: target === "admin" ? "/admin/users" : "/",
        errorCallbackURL: "/login",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión. Inténtalo nuevamente.");
      setPendingProvider(null);
    }
  }

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#151519] px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#ff650f]/20 blur-[110px]" />
        <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-[#ff650f]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>
      <section className="w-full max-w-[430px]">
        <header className="mb-7 flex flex-col items-center text-center">
          <div className="mb-5 flex h-[76px] w-[150px] items-center justify-center">
            <img src="/login-logo.png" alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-[34px]">Bienvenido</h1>
        </header>
        <div className="rounded-[28px] border border-white/60 bg-[#f4f4f7] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-[#17171a]">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[#777780]">Accede de forma segura con tu cuenta.</p>
          </div>
          {authEnabled && googleProvider ? (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => void handleSignIn("admin")} disabled={pendingProvider !== null}
                className="flex h-[52px] items-center justify-center rounded-[17px] bg-[#ff650f] px-3 text-[15px] font-extrabold text-white shadow-[0_7px_18px_rgba(255,101,15,0.22)] transition hover:bg-[#ed5908] disabled:cursor-wait disabled:opacity-65">
                {pendingProvider === "admin" ? "Conectando..." : "Admin"}
              </button>
              <button type="button" onClick={() => void handleSignIn("user")} disabled={pendingProvider !== null}
                className="flex h-[52px] items-center justify-center rounded-[17px] border-2 border-[#ff650f] bg-white px-3 text-[15px] font-extrabold text-[#e95508] transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-65">
                {pendingProvider === "user" ? "Conectando..." : "Usuarios"}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-white px-4 py-3 text-sm text-[#777780]">El inicio de sesión está desactivado por el momento.</p>
          )}
          {errorMessage ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">{errorMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}
