import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn(providerId: string) {
    if (pendingProvider) return;
    setPendingProvider(providerId);
    setErrorMessage(null);

    try {
      await signIn(providerId, { callbackURL: "/admin", errorCallbackURL: "/login" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente.",
      );
      setPendingProvider(null);
    }
  }

  const googleProvider = GROK_PROVIDERS.find((provider) => provider.idp === "google");
  const otherProviders = GROK_PROVIDERS.filter((provider) => provider.idp !== "google");

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
            <img
              src="/login-logo.png"
              alt="Recojo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#ff8a4b]">
            RECOJO
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-[34px]">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 max-w-[310px] text-sm leading-6 text-white/60">
            Inicia sesión para continuar en tu espacio de trabajo.
          </p>
        </header>

        <div className="rounded-[28px] border border-white/60 bg-[#f4f4f7] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-[#17171a]">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[#777780]">
              Accede de forma segura con tu cuenta.
            </p>
          </div>

          {authEnabled ? (
            <div className="space-y-3">
              {googleProvider ? (
                <button
                  type="button"
                  onClick={() => void handleSignIn(googleProvider.providerId)}
                  disabled={pendingProvider !== null}
                  className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[17px] bg-[#ff650f] px-5 text-[15px] font-extrabold text-white shadow-[0_7px_18px_rgba(255,101,15,0.22)] transition hover:bg-[#ed5908] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff650f] disabled:cursor-wait disabled:opacity-65"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[15px] font-black text-[#4285f4]">
                    G
                  </span>
                  {pendingProvider === googleProvider.providerId
                    ? "Conectando..."
                    : "Continuar con Google"}
                </button>
              ) : null}

              {otherProviders.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-[#dedee3]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9999a1]">
                      O también
                    </span>
                    <span className="h-px flex-1 bg-[#dedee3]" />
                  </div>
                  {otherProviders.map((provider) => (
                    <button
                      key={provider.providerId}
                      type="button"
                      onClick={() => void handleSignIn(provider.providerId)}
                      disabled={pendingProvider !== null}
                      className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[17px] border border-[#dedee3] bg-white px-5 text-[15px] font-extrabold text-[#17171a] transition hover:border-[#c5c5cc] hover:bg-[#fafafa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff650f] disabled:cursor-wait disabled:opacity-65"
                    >
                      <span className="text-xl font-black" aria-hidden="true">𝕏</span>
                      {pendingProvider === provider.providerId
                        ? "Conectando..."
                        : `Continuar con ${provider.label}`}
                    </button>
                  ))}
                </>
              ) : null}

              {errorMessage ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <p className="pt-2 text-center text-xs leading-5 text-[#85858d]">
                Si es tu primera vez, al continuar podrás crear tu cuenta.
              </p>
            </div>
          ) : (
            <p className="rounded-xl bg-white px-4 py-3 text-sm text-[#777780]">
              El inicio de sesión está desactivado por el momento.
            </p>
          )}

          <div className="mt-6 border-t border-[#dedee3] pt-5">
            <Link
              to="/"
              className="flex min-h-10 items-center justify-center text-sm font-bold text-[#ff650f] transition hover:text-[#e95508]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] font-semibold tracking-wide text-white/40">
          ACCESO SEGURO · RECOJO
        </p>
      </section>
    </main>
  );
}
