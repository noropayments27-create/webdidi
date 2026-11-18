import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, listOutings, type OutingRow, type ProfileRow } from "@/lib/delivery.functions";

export const Route = createFileRoute("/admin/history")({ component: HistoryPage });

function HistoryPage() {
  const { user, isPending } = useCurrentUserState();
  const [me,setMe]=useState<ProfileRow|null>(null);
  const [rows,setRows]=useState<OutingRow[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(isPending||!user){if(!isPending)setLoading(false);return;}
    ensureProfile({data:user.displayName??user.primaryEmail??""})
      .then(async p=>{setMe(p);if(p.role==="superadmin")setRows(await listOutings());})
      .catch(e=>toast.error(e instanceof Error?e.message:"No se pudo cargar el historial"))
      .finally(()=>setLoading(false));
  },[user,isPending]);
  if(loading||isPending)return <main className="mx-auto min-h-dvh max-w-md bg-card p-6"><div className="h-8 w-40 rounded-full bg-paper"/></main>;
  if(!user||me?.role!=="superadmin")return <main className="mx-auto max-w-md bg-card p-6"><Link to="/" className="font-semibold">← Volver</Link><h1 className="mt-6 text-2xl font-extrabold">Acceso restringido</h1><p className="mt-2 text-muted">El historial solo está disponible para el súper admin.</p></main>;
  return <main className="mx-auto min-h-dvh max-w-md bg-card px-5 pt-5 pb-12">
    <header className="flex items-center justify-between"><Link to="/admin" className="inline-flex items-center gap-1 text-sm font-semibold"><ChevronLeft className="size-5"/> Administración</Link><UserButton/></header>
    <div className="mt-5 flex items-center gap-3"><HistoryIcon className="size-7 text-primary"/><div><h1 className="text-2xl font-extrabold">Historial de salidas</h1><p className="text-sm text-muted">Visible únicamente para el súper admin.</p></div></div>
    <p className="mt-5 text-sm font-semibold text-muted">{rows.length} registros recientes</p>
    {rows.length===0?<p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-muted">Todavía no hay salidas registradas.</p>:<ul className="mt-3 space-y-3">{rows.map(row=><li key={row.id} className="rounded-3xl border border-line p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-extrabold">{row.storeName}</p><p className="mt-1 text-sm text-muted">{row.userName||"Usuario"} · {row.userEmail}</p></div><span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-extrabold">{row.creditsUsed} crédito(s)</span></div>
      <p className="mt-3 text-sm"><span className="font-semibold">Destino:</span> {row.destination}</p>
      {row.notes?<p className="mt-1 text-sm text-muted">{row.notes}</p>:null}
      <p className="mt-3 text-xs text-muted">{new Date(row.createdAt).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"})}</p>
    </li>)}</ul>}
  </main>;
}
