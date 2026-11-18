import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { setTestRole, clearTestRole, GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const google = GROK_PROVIDERS.find((provider) => provider.idp === "google");

  function enterAsRole(role: "admin" | "user") {
    setTestRole(role);
    window.location.href = role === "admin" ? "/admin/users" : "/";
  }

  async function googleSignIn() {
    if (!google || pending) return;
    clearTestRole();
    setPending("google"); setError(null);
    try { await signIn(google.providerId, { callbackURL: "/", errorCallbackURL: "/login" }); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar sesión"); setPending(null); }
  }

  return <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#151519] px-4 py-10 sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#ff650f]/20 blur-[110px]" />
      <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-[#ff650f]/10 blur-[120px]" />
    </div>
    <section className="w-full max-w-[430px]">
      <header className="mb-7 flex flex-col items-center text-center">
        <div className="mb-5 flex h-[76px] w-[150px] items-center justify-center"><img src="/login-logo.png" alt="" className="max-h-full max-w-full object-contain" /></div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-[34px]">Bienvenido</h1>
      </header>
      <div className="rounded-[28px] border border-white/60 bg-[#f4f4f7] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-7">
        <h2 className="text-xl font-extrabold text-[#17171a]">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-[#777780]">Accede a Didi repartidor.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => enterAsRole("admin")} className="h-[52px] rounded-[17px] bg-[#ff650f] px-3 text-[15px] font-extrabold text-white shadow-[0_7px_18px_rgba(255,101,15,0.22)] transition hover:bg-[#ed5908]">Admin</button>
          <button type="button" onClick={() => enterAsRole("user")} className="h-[52px] rounded-[17px] border-2 border-[#ff650f] bg-white px-3 text-[15px] font-extrabold text-[#e95508] transition hover:bg-orange-50">Usuarios</button>
        </div>
        {authEnabled && google ? <button type="button" onClick={() => void googleSignIn()} disabled={pending !== null} className="mt-4 flex h-[52px] w-full items-center justify-center gap-3 rounded-[17px] border border-[#dedee3] bg-white px-5 text-[15px] font-extrabold text-[#202027] disabled:opacity-60">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4285f4] text-[15px] font-black text-white">G</span>
          {pending === "google" ? "Conectando..." : "Continuar con Google"}
        </button> : null}
        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>
    </section>
  </main>;
}
