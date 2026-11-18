import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Wallet, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, listProfiles, grantCredits, setUserBlocked, type ProfileRow } from "@/lib/delivery.functions";
import { formatCredits } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const { user, isPending } = useCurrentUserState();
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [people, setPeople] = useState<ProfileRow[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() { setPeople(await listProfiles()); }
  useEffect(() => {
    if (isPending || !user) { if (!isPending) setLoading(false); return; }
    ensureProfile({ data: user.displayName ?? user.primaryEmail ?? "" })
      .then(async (p) => { setMe(p); if (p.role === "superadmin") await refresh(); })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar"))
      .finally(() => setLoading(false));
  }, [user, isPending]);

  const filtered = people.filter((p) => [p.displayName, p.email, p.userId].join(" ").toLowerCase().includes(query.toLowerCase()));
  if (loading || isPending) return <main className="mx-auto min-h-dvh max-w-md bg-card p-6"><div className="h-8 w-40 rounded-full bg-paper" /></main>;
  if (!user || me?.role !== "superadmin") return <main className="mx-auto max-w-md bg-card p-6"><Link to="/login" className="font-semibold">← Volver al acceso</Link><h1 className="mt-6 text-2xl font-extrabold">Acceso restringido</h1><p className="mt-2 text-muted">Esta pantalla es exclusiva del súper admin.</p></main>;

  return <main className="mx-auto min-h-dvh max-w-md bg-card px-5 pt-5 pb-12">
    <header className="flex items-center justify-between"><span className="text-sm font-semibold text-muted">Panel de administración</span><UserButton /></header>
    <h1 className="mt-5 text-2xl font-extrabold">Usuarios</h1>
    <p className="mt-1 text-sm text-muted">Gestiona cuentas, créditos y acceso de usuarios.</p>
    <div className="mt-5 flex items-center gap-2 rounded-2xl bg-paper px-3"><Search className="size-5 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o correo" className="h-12 min-w-0 flex-1 bg-transparent outline-none" /></div>
    <p className="mt-4 text-sm font-semibold text-muted">{filtered.length} cuentas registradas</p>
    <ul className="mt-2 space-y-3">{filtered.map((person) => <li key={person.userId} className="rounded-3xl border border-line p-4">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-paper"><Wallet className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{person.displayName || "Sin nombre"}</p><p className="break-all text-sm text-muted">{person.email || "Cuenta de usuario"}</p><p className="mt-1 text-sm font-semibold">{person.role === "superadmin" ? "Súper admin" : "Usuario"} · {formatCredits(person.credits)} créditos</p><p className={person.blocked ? "mt-1 text-xs font-bold text-red-600" : "mt-1 text-xs font-bold text-emerald-700"}>{person.blocked ? "Cuenta bloqueada" : "Cuenta activa"}</p></div></div>
      {person.role !== "superadmin" ? <>
        <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const amount = Number(amounts[person.userId] ?? ""); try { await grantCredits({ data: { userId: person.userId, amount } }); setAmounts((prev) => ({ ...prev, [person.userId]: "" })); await refresh(); toast.success("Créditos agregados"); } catch (err) { toast.error(err instanceof Error ? err.message : "No se pudieron agregar"); } }}>
          <input required min="1" step="1" type="number" inputMode="numeric" value={amounts[person.userId] ?? ""} onChange={(e) => setAmounts((prev) => ({ ...prev, [person.userId]: e.target.value }))} placeholder="Cantidad de créditos" className="h-11 min-w-0 flex-1 rounded-xl bg-paper px-3 outline-none" />
          <button className="h-11 rounded-full bg-primary px-5 text-sm font-extrabold text-primary-fg">Agregar</button>
        </form>
        <button type="button" onClick={async () => { try { await setUserBlocked({ data: { userId: person.userId, blocked: !person.blocked } }); await refresh(); toast.success(person.blocked ? "Usuario desbloqueado" : "Usuario bloqueado"); } catch (err) { toast.error(err instanceof Error ? err.message : "No se pudo actualizar el usuario"); } }} className={person.blocked ? "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 text-sm font-extrabold text-emerald-700" : "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-extrabold text-red-600"}>
          {person.blocked ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
          {person.blocked ? "Desbloquear usuario" : "Bloquear usuario"}
        </button>
      </> : null}
    </li>)}</ul>
  </main>;
}
