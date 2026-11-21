import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, History, MapPin, Store as StoreIcon, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PickupScreen } from "@/components/pickup-screen";
import { ensureProfile, getOrderForStore, listStores, type ActiveOrder, type ProfileRow, type StoreRow } from "@/lib/delivery.functions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    ensureProfile({ data: user.displayName ?? user.primaryEmail ?? "" })
      .then((p) => {
        setProfile(p);
        if (p.role === "superadmin") window.location.replace("/admin/users");
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar tu cuenta");
        if (error instanceof Error && error.message.toLowerCase().includes("bloqueada")) window.location.replace("/login");
      });
  }, [user, isPending]);

  useEffect(() => {
    if (isPending) return;
    listStores()
      .then(setStores)
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las tiendas"))
      .finally(() => setLoaded(true));
  }, [isPending]);

  useEffect(() => {
    if (!isPending && !user) window.location.replace("/login");
  }, [user, isPending]);

  async function openStore(store: StoreRow) {
    if (loadingStore) return;
    setLoadingStore(true);
    try {
      const order = await getOrderForStore({ data: store.id });
      if (!order) {
        toast.error("Esta tienda todavía no tiene un pedido asignado.");
        return;
      }
      setSelectedOrder(order);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la tienda");
    } finally {
      setLoadingStore(false);
    }
  }

  if (selectedOrder) {
    return <PickupScreen
      order={selectedOrder}
      onOrder={setSelectedOrder}
      profile={profile}
      onCredits={(credits) => setProfile((current) => current ? { ...current, credits } : current)}
      onBack={() => {
        setStores((current) => current.map((store) => store.id === selectedOrder.storeId ? { ...store, photoUrl: selectedOrder.photoUrl } : store));
        setSelectedOrder(null);
      }}
    />;
  }

  if (isPending || !loaded || !user || !profile) {
    return <main className="mx-auto min-h-dvh max-w-md bg-card p-6"><div className="h-8 w-40 animate-pulse rounded-full bg-paper" /><div className="mt-6 h-24 animate-pulse rounded-3xl bg-paper" /></main>;
  }

  return <main className="mx-auto min-h-dvh w-full max-w-md bg-card px-5 pt-5 pb-12">
    <header className="flex items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Tiendas</h1><p className="mt-1 text-sm text-muted">Selecciona el pedido que vas a recoger</p></div>
      <UserButton />
    </header>
    <section className="mt-5 flex items-center justify-between rounded-3xl bg-paper p-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Tu saldo</p><p className="mt-1 text-2xl font-extrabold">{formatCredits(profile.credits)} <span className="text-sm font-semibold">créditos</span></p></div>
      <Wallet className="size-7 text-primary" />
    </section>
    {profile.role === "superadmin" && <nav className="mt-3 grid grid-cols-2 gap-2">
      <Link to="/admin/users" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold"><Wallet className="size-4" /> Usuarios</Link>
      <Link to="/admin/history" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line text-sm font-bold"><History className="size-4" /> Historial</Link>
    </nav>}
    <div className="mt-6 flex items-center justify-between"><h2 className="font-extrabold">Tiendas disponibles</h2><span className="text-xs text-muted">{stores.length} registradas</span></div>
    {stores.length === 0 ? <p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-muted">Todavía no hay tiendas registradas.</p> : <ul className="mt-3 space-y-3">
      {stores.map((store) => <li key={store.id}>
        <button type="button" disabled={loadingStore} onClick={() => void openStore(store)} className="flex w-full items-center gap-3 rounded-3xl border border-line p-3 text-left transition hover:bg-paper disabled:opacity-60">
          {store.photoUrl ? <img src={store.photoUrl} alt="" className="size-16 rounded-2xl object-cover" /> : <span className="grid size-16 place-items-center rounded-2xl bg-paper"><StoreIcon className="size-7 text-muted" /></span>}
          <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{store.name}</span><span className="mt-1 flex items-start gap-1 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{[store.address, store.city].filter(Boolean).join(", ")}</span></span>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </button>
      </li>)}
    </ul>}
  </main>;
}
