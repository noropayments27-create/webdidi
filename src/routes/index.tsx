import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { MapPin, Store as StoreIcon, ArrowRight, History, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ensureProfile, listStores, createOuting, type ProfileRow, type StoreRow } from "@/lib/delivery.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selected, setSelected] = useState<StoreRow | null>(null);
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [doublet, setDoublet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setDemoMode(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);

  useEffect(() => {
    if (isPending || !user) return;
    ensureProfile({ data: user.displayName ?? user.primaryEmail ?? "" })
      .then(setProfile)
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cargar tu cuenta"));
  }, [user, isPending]);

  useEffect(() => {
    if (isPending) return;
    listStores()
      .then(setStores)
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las tiendas"))
      .finally(() => setLoaded(true));
  }, [isPending]);

  useEffect(() => {
    if (!isPending && !user && !demoMode && new URLSearchParams(window.location.search).get("demo") !== "1") window.location.replace("/login");
  }, [user, isPending, demoMode]);

  async function submitOuting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    if (demoMode) {
      toast.success("Demostración: la salida no se guardó ni consumió créditos.");
      setSelected(null);
      setDestination("");
      setNotes("");
      setDoublet(false);
      setBusy(false);
      return;
    }
    try {
      const result = await createOuting({ data: { storeId: selected.id, destination, notes, doublet } });
      setProfile((p) => p ? { ...p, credits: result.credits } : p);
      toast.success("Salida registrada correctamente");
      setSelected(null);
      setDestination("");
      setNotes("");
      setDoublet(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la salida");
    } finally {
      setBusy(false);
    }
  }

  if (isPending || !loaded || (!user && !demoMode)) {
    return <main className="mx-auto min-h-dvh max-w-md bg-card p-6"><div className="h-8 w-40 animate-pulse rounded-full bg-paper" /><div className="mt-6 h-24 animate-pulse rounded-3xl bg-paper" /></main>;
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-card px-5 pt-5 pb-12">
      <header className="flex items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-muted">Panel de trabajo</p><h1 className="text-2xl font-extrabold tracking-tight">Tiendas</h1></div>
        {user ? <UserButton /> : <Link to="/login" className="text-sm font-bold text-primary">Iniciar sesión</Link>}
      </header>
      {demoMode ? <p className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-800">Modo demostración · No se guardan salidas ni se consumen créditos.</p> : null}
      <section className="mt-5 flex items-center justify-between rounded-3xl bg-paper p-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Tu saldo</p><p className="mt-1 text-2xl font-extrabold">{demoMode ? "Demo" : formatCredits(profile?.credits ?? 0)} <span className="text-sm font-semibold">{demoMode ? "sin saldo real" : "créditos"}</span></p></div>
        <Wallet className="size-7 text-primary" />
      </section>
      {profile?.role === "superadmin" ? (
        <nav className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/admin/users" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold"><Wallet className="size-4"/> Usuarios</Link>
          <Link to="/admin/history" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold"><History className="size-4"/> Historial</Link>
        </nav>
      ) : null}
      <div className="mt-6 flex items-center justify-between"><h2 className="font-extrabold">Selecciona una tienda</h2><span className="text-xs text-muted">{stores.length} disponibles</span></div>
      {stores.length === 0 ? <p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-muted">Todavía no hay tiendas registradas.</p> : (
        <ul className="mt-3 space-y-3">
          {stores.map((store) => <li key={store.id}>
            <button type="button" onClick={() => setSelected(store)} className="flex w-full items-center gap-3 rounded-3xl border border-line p-3 text-left transition hover:bg-paper">
              {store.photoUrl ? <img src={store.photoUrl} alt="" className="size-16 rounded-2xl object-cover"/> : <span className="grid size-16 place-items-center rounded-2xl bg-paper"><StoreIcon className="size-7 text-muted"/></span>}
              <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{store.name}</span><span className="mt-1 flex items-start gap-1 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0"/>{[store.address,store.city].filter(Boolean).join(", ")}</span></span>
              <ArrowRight className="size-5 shrink-0 text-primary"/>
            </button>
          </li>)}
        </ul>
      )}
      {selected ? <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => setSelected(null)}>
        <form onSubmit={submitOuting} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 sm:rounded-3xl">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Nueva salida</p><h2 className="text-xl font-extrabold">{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} className="rounded-full bg-paper px-3 py-2 text-sm font-bold">Cerrar</button></div>
          <label className="text-sm font-semibold">Destino</label>
          <input required minLength={3} maxLength={180} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dirección o lugar de entrega" className="mt-2 h-12 w-full rounded-2xl bg-paper px-4 outline-none"/>
          <label className="mt-4 block text-sm font-semibold">Notas (opcional)</label>
          <textarea maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles de esta salida" rows={3} className="mt-2 w-full rounded-2xl bg-paper p-4 outline-none"/>
          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-paper p-3"><input type="checkbox" checked={doublet} onChange={(e) => setDoublet(e.target.checked)} className="size-5 accent-orange-500"/><span className="flex-1"><span className="block font-bold">Salida doblete</span><span className="text-xs text-muted">Consume 2 créditos</span></span><span className="font-extrabold">{doublet ? "2" : "1"} crédito(s)</span></label>
          <p className="mt-3 text-xs text-muted">{demoMode ? "En demostración no se guardará la salida ni se descontarán créditos." : "Al confirmar se descontará el crédito correspondiente y quedará registrada la salida."}</p>
          <button disabled={busy || (!demoMode && (!profile || profile.credits < (doublet ? 2 : 1)))} type="submit" className="mt-5 w-full rounded-full bg-primary py-3 font-extrabold text-primary-fg disabled:opacity-50">{busy ? "Registrando..." : demoMode ? "Probar salida (demo)" : "Confirmar salida"}</button>
          {!demoMode && profile && profile.credits < (doublet ? 2 : 1) ? <p className="mt-2 text-center text-sm font-semibold text-red-600">No tienes créditos suficientes.</p> : null}
        </form>
      </div> : null}
    </main>
  );
}
