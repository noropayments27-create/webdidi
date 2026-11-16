import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  addStore,
  assignPickupStore,
  ensureProfile,
  getActiveOrder,
  grantCredits,
  listProfiles,
  listStores,
  updateHeadline,
  type ActiveOrder,
  type ProfileRow,
  type StoreRow,
} from "@/lib/delivery.functions";
import { formatCredits } from "@/lib/format";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [people, setPeople] = useState<ProfileRow[]>([]);
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bogotá, Colombia");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setReady(true);
      return;
    }
    const label = user.displayName ?? user.primaryEmail ?? "";
    ensureProfile({ data: label })
      .then(async (me) => {
        setProfile(me);
        if (me.role !== "superadmin") return;
        const [storeRows, profileRows, active] = await Promise.all([
          listStores(),
          listProfiles(),
          getActiveOrder(),
        ]);
        setStores(storeRows);
        setPeople(profileRows);
        setOrder(active);
        setHeadline(active?.headline ?? "");
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar");
      })
      .finally(() => setReady(true));
  }, [user, isPending]);

  async function refresh() {
    const [storeRows, profileRows, active] = await Promise.all([
      listStores(),
      listProfiles(),
      getActiveOrder(),
    ]);
    setStores(storeRows);
    setPeople(profileRows);
    setOrder(active);
    setHeadline(active?.headline ?? "");
  }

  if (!ready || isPending) {
    return (
      <main className="mx-auto min-h-dvh max-w-md bg-card px-5 py-8">
        <div className="h-8 w-40 rounded-full bg-paper" />
        <div className="mt-6 h-28 rounded-3xl bg-paper" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-card px-6">
        <h1 className="text-2xl font-extrabold">Súper admin</h1>
        <p className="mt-2 text-muted">Entra para crear tiendas y dar créditos.</p>
        <Link
          to="/login"
          className="mt-6 flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-fg"
        >
          Entrar
        </Link>
      </main>
    );
  }

  if (profile && profile.role !== "superadmin") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-card px-5 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold">
          <ChevronLeft className="size-5" /> Pedido
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold">Tu cuenta</h1>
        <p className="mt-2 text-muted">Eres repartidor. Los créditos los asigna el súper admin.</p>
        <p className="mt-6 rounded-3xl bg-paper px-4 py-5 text-3xl font-extrabold">
          {formatCredits(profile.credits)}
          <span className="mt-1 block text-sm font-medium text-muted">créditos</span>
        </p>
        <div className="mt-6">
          <UserButton />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-card px-5 pt-5 pb-12">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold">
          <ChevronLeft className="size-5" /> Pedido
        </Link>
        <UserButton />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Súper admin</h1>
      <p className="mt-1 text-sm text-muted">
        Tiendas, el texto del recuadro y los créditos de cada cuenta.
      </p>

      <section className="mt-6 rounded-3xl border border-line p-4">
        <h2 className="font-extrabold">Texto del recuadro</h2>
        <p className="mt-1 text-sm text-muted">Hoy dice “{order?.headline ?? "…"}”.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            updateHeadline({ data: headline })
              .then(async (next) => {
                setOrder(next);
                toast.success("Texto actualizado");
              })
              .catch((error: unknown) =>
                toast.error(error instanceof Error ? error.message : "No se pudo guardar"),
              );
          }}
        >
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="h-12 min-w-0 flex-1 rounded-2xl bg-paper px-3 font-semibold outline-none"
            maxLength={80}
          />
          <button type="submit" className="h-12 rounded-full bg-ink px-4 font-bold text-primary-fg">
            Guardar
          </button>
        </form>
      </section>

      <section className="mt-4">
        <h2 className="font-extrabold">Tiendas</h2>
        <ul className="mt-3 space-y-2">
          {stores.map((store) => (
            <li key={store.id} className="rounded-2xl bg-paper px-4 py-3">
              <p className="font-semibold">{store.name}</p>
              <p className="text-sm text-muted">
                {[store.address, store.city].filter(Boolean).join(", ")}
              </p>
              <button
                type="button"
                onClick={() =>
                  assignPickupStore({ data: store.id })
                    .then((next) => {
                      setOrder(next);
                      toast.success("Esa tienda quedó en el recojo");
                    })
                    .catch((error: unknown) =>
                      toast.error(error instanceof Error ? error.message : "No se pudo cambiar"),
                    )
                }
                className="mt-2 text-sm font-bold text-primary"
              >
                {order?.storeId === store.id ? "En pantalla" : "Usar en el recojo"}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 space-y-2 rounded-3xl border border-line p-4"
          onSubmit={(event) => {
            event.preventDefault();
            addStore({ data: { name, address, city, phone } })
              .then(async () => {
                setName("");
                setAddress("");
                setPhone("");
                await refresh();
                toast.success("Tienda agregada");
              })
              .catch((error: unknown) =>
                toast.error(error instanceof Error ? error.message : "No se pudo crear"),
              );
          }}
        >
          <h3 className="font-extrabold">Nueva tienda</h3>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre"
            className="h-12 w-full rounded-2xl bg-paper px-3 outline-none"
          />
          <input
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Dirección"
            className="h-12 w-full rounded-2xl bg-paper px-3 outline-none"
          />
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ciudad"
            className="h-12 w-full rounded-2xl bg-paper px-3 outline-none"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Teléfono"
            className="h-12 w-full rounded-2xl bg-paper px-3 outline-none"
          />
          <button type="submit" className="h-12 w-full rounded-full bg-primary font-bold text-primary-fg">
            Agregar tienda
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-extrabold">Créditos</h2>
        <ul className="mt-3 space-y-2">
          {people.map((person) => (
            <li key={person.userId} className="rounded-2xl bg-paper px-4 py-3">
              <p className="font-semibold">{person.displayName || "Sin nombre"}</p>
              <p className="text-sm text-muted">
                {person.role === "superadmin" ? "Súper admin" : "Repartidor"} ·{" "}
                {formatCredits(person.credits)} créditos
              </p>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const amount = Number(amounts[person.userId] ?? "");
                  grantCredits({ data: { userId: person.userId, amount } })
                    .then(async () => {
                      setAmounts((prev) => ({ ...prev, [person.userId]: "" }));
                      await refresh();
                      toast.success("Créditos asignados");
                    })
                    .catch((error: unknown) =>
                      toast.error(error instanceof Error ? error.message : "No se pudo asignar"),
                    );
                }}
              >
                <input
                  inputMode="numeric"
                  value={amounts[person.userId] ?? ""}
                  onChange={(event) =>
                    setAmounts((prev) => ({ ...prev, [person.userId]: event.target.value }))
                  }
                  placeholder="Monto"
                  className="h-11 min-w-0 flex-1 rounded-2xl bg-card px-3 outline-none"
                />
                <button type="submit" className="h-11 rounded-full bg-ink px-4 text-sm font-bold text-primary-fg">
                  Dar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
