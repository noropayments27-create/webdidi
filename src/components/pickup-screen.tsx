import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  Check, ChevronDown, ChevronRight, ChevronsRight, Eye, EyeOff, ImagePlus, Phone, Scan, SlidersHorizontal,
  ThumbsDown, ThumbsUp, TriangleAlert, X,
} from "lucide-react";
import { toast } from "sonner";
import { createOuting, rateStore, setOrderStatus, updateStorePhoto, updateStorePresentation, type ActiveOrder, type ProfileRow } from "@/lib/delivery.functions";
import { formatCop, telHref } from "@/lib/format";

type Sheet = "details" | "help" | "qr" | "photo" | null;

function QrMark({ value }: { value: string }) {
  const size = 25;
  const cells = new Array<boolean>(size * size).fill(false);
  let hash = 2166136261;
  for (const ch of value) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  for (let i = 0; i < cells.length; i++) {
    hash = Math.imul(hash ^ (i + 17), 16777619);
    cells[i] = (hash >>> 0) % 3 !== 0;
  }
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      cells[(oy + y) * size + ox + x] = x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
    }
  };
  stamp(0, 0); stamp(size - 7, 0); stamp(0, size - 7);
  return <svg viewBox={`0 0 ${size} ${size}`} className="h-52 w-52 text-ink" aria-hidden="true">
    <rect width={size} height={size} className="fill-card" />
    {cells.map((on, i) => on ? <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="currentColor" /> : null)}
  </svg>;
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40" onClick={onClose} role="presentation">
    <div role="dialog" aria-label={title} className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-3 pb-8" onClick={(event) => event.stopPropagation()}>
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-paper"><X className="size-5" /></button>
      </div>
      {children}
    </div>
  </div>;
}

function ExitSlider({ disabled, loading, onComplete }: { disabled: boolean; loading: boolean; onComplete: () => Promise<void> }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const track = useRef<HTMLDivElement>(null);
  const knob = 48;
  const max = () => Math.max(0, (track.current?.clientWidth ?? 0) - knob - 16);
  const finish = async () => {
    const threshold = max() * 0.42;
    if (offset >= threshold && !disabled && !loading) {
      setOffset(max() * 0.42);
      try { await onComplete(); } catch { /* The caller reports the failure. */ }
    }
    setOffset(0);
    setDragging(false);
  };
  const onDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startX.current = event.clientX;
    startOffset.current = offset;
    setDragging(true);
  };
  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging || disabled || loading) return;
    setOffset(Math.max(0, Math.min(max(), startOffset.current + event.clientX - startX.current)));
  };
  return <div ref={track} className={`relative flex h-14 flex-1 items-center overflow-hidden rounded-[20px] transition-colors duration-200 ${disabled || loading ? "bg-chip" : "bg-primary"}`}>
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {loading ? <span className="text-sm font-bold text-white">Procesando salida…</span> : <span className={`flex items-center gap-2 text-lg font-extrabold transition-opacity duration-150 ${disabled ? "text-muted/50" : "text-primary-fg"}`} style={{ opacity: Math.max(0, 1 - offset / Math.max(1, max() * 0.42)) }}> <ChevronsRight className="size-6" /> Salir </span>}
    </div>
    {!loading && <button type="button" aria-label="Deslizar para salir" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => void finish()} onPointerCancel={() => { setOffset(0); setDragging(false); }} className={`absolute left-2 top-1 grid size-12 touch-none place-items-center rounded-2xl shadow-sm transition-transform ${disabled ? "bg-paper text-muted/40" : "bg-white text-primary"}`} style={{ transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 180ms ease-out" }}>
      <ChevronsRight className="size-6" strokeWidth={2.5} />
    </button>}
  </div>;
}

export function PickupScreen({
  order, onOrder, profile, onCredits, onBack,
}: {
  order: ActiveOrder;
  onOrder: (order: ActiveOrder) => void;
  profile: ProfileRow | null;
  onCredits: (credits: number) => void;
  onBack: () => void;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingPresentation, setSavingPresentation] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState(order.headline);
  const [statusDraft, setStatusDraft] = useState(order.statusMessage);
  const [qrVisible, setQrVisible] = useState(order.qrVisible);
  const photoInput = useRef<HTMLInputElement>(null);
  const requestKey = useRef<string | null>(null);
  const address = [order.address, order.city].filter(Boolean).join(", ");
  const phone = telHref(order.phone);
  const canExit = Boolean(!exitDone && profile && profile.credits >= 1 && order.status === "picked");

  async function completeExit() {
    if (busy || !canExit) return;
    setBusy(true);
    requestKey.current ??= `web-${order.id}-${crypto.randomUUID()}`;
    try {
      const result = await createOuting({ data: { storeId: order.storeId, orderId: order.id, requestKey: requestKey.current } });
      onCredits(result.credits);
      requestKey.current = null;
      setExitDone(true);
      onOrder({ ...order, status: "exited", statusMessage: "Salida registrada. Continúa con la entrega." });
      toast.success("Salida registrada. Se descontó 1 crédito.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la salida");
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function toggleEditor() {
    if (!editing) {
      setHeadlineDraft(order.headline);
      setStatusDraft(order.statusMessage);
      setQrVisible(order.qrVisible);
      setEditing(true);
      return;
    }
    if (savingPresentation) return;
    setSavingPresentation(true);
    try {
      const saved = await updateStorePresentation({ data: {
        storeId: order.storeId,
        headline: headlineDraft,
        statusMessage: statusDraft,
        qrVisible,
      } });
      onOrder({ ...order, ...saved });
      setEditing(false);
      toast.success("Cambios de la tienda guardados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar los cambios");
    } finally {
      setSavingPresentation(false);
    }
  }

  async function changePhoto(file?: File) {
    if (!file || photoBusy) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Selecciona una imagen JPG, PNG o WebP de máximo 2 MB");
      return;
    }
    setPhotoBusy(true);
    try {
      const photoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la imagen"));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(file);
      });
      await updateStorePhoto({ data: { storeId: order.storeId, photoDataUrl } });
      onOrder({ ...order, photoUrl: photoDataUrl });
      toast.success("Fotografía de la tienda actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la fotografía");
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function rate(rating: "yes" | "no") {
    if (busy) return;
    setBusy(true);
    try { onOrder(await rateStore({ data: { id: order.id, rating } })); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-card sm:shadow-xl">
    <div className="relative h-[23dvh] min-h-[150px] max-h-[250px] shrink-0">
      {order.photoUrl ? <img src={order.photoUrl} alt={`Fachada de ${order.storeName}`} className="block h-full w-full object-cover" /> : <div className="h-full w-full bg-primary" />}
      <button type="button" aria-label={editing ? "Cambiar fotografía de la tienda" : "Ver fotografía de la tienda"} onClick={() => editing ? photoInput.current?.click() : setSheet("photo")} className="absolute inset-0 z-[1] w-full" />
      {editing && <span className="pointer-events-none absolute right-3 bottom-6 z-[2] inline-flex items-center gap-1 rounded-full bg-ink/80 px-3 py-2 text-xs font-bold text-white"><ImagePlus className="size-4" /> Toca para cambiar la foto</span>}
      <button type="button" aria-label="Volver a tiendas" onClick={onBack} className="absolute z-10 top-3 left-3 grid size-14 place-items-center rounded-2xl bg-card shadow-md"><ChevronDown className="size-7" strokeWidth={2.25} /></button>
      <button type="button" onClick={() => setSheet("photo")} className="absolute right-3 bottom-6 inline-flex items-center gap-1 rounded-full bg-ink/80 py-1.5 pr-2 pl-3 text-sm font-semibold text-primary-fg">1/1 <ChevronRight className="size-4" /></button>
    </div>

    <div className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col rounded-t-3xl bg-card px-4">
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line" />
      <header className="mt-3 flex shrink-0 items-start gap-2 max-[720px]:mt-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-[19px] font-extrabold tracking-tight">{order.storeName}</h1>{qrVisible && <button type="button" disabled={editing} onClick={() => setSheet("qr")} className="rounded-full bg-badge px-2.5 py-1 text-xs font-bold text-primary-fg">QR-Code</button>}</div>
          {editing && <button type="button" onClick={() => setQrVisible((visible) => !visible)} className="mt-2 inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink">{qrVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{qrVisible ? "Ocultar QR" : "Mostrar QR"}</button>}
          <p className="mt-1 text-sm leading-snug text-muted">{address}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {qrVisible && <button type="button" aria-label="Ver código QR" disabled={editing} onClick={() => setSheet("qr")} className="grid size-11 place-items-center rounded-full bg-paper disabled:opacity-40"><Scan className="size-6" strokeWidth={1.75} /></button>}
          {phone && <a href={phone} aria-label={`Llamar a la tienda ${order.phone}`} className="grid size-11 place-items-center rounded-full bg-paper text-ink"><Phone className="size-6" strokeWidth={1.75} /></a>}
        </div>
      </header>

      {editing ? <input aria-label="Texto de estado de la tienda" maxLength={180} value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className="mt-3 w-full shrink-0 rounded-2xl border border-primary bg-paper px-4 py-3 text-[15px] font-semibold outline-none max-[720px]:mt-2 max-[720px]:py-2.5" /> : <p className="mt-3 shrink-0 rounded-2xl bg-paper px-4 py-3 text-[15px] leading-snug font-semibold max-[720px]:mt-2 max-[720px]:py-2.5">{order.statusMessage}</p>}

      <section className="mt-3 shrink-0 rounded-3xl border border-line px-4 pt-4 pb-3 max-[720px]:mt-2 max-[720px]:pt-3 max-[720px]:pb-2">
        {editing ? <input aria-label="Texto del recuadro principal" maxLength={80} value={headlineDraft} onChange={(event) => setHeadlineDraft(event.target.value)} className="w-full rounded-xl border border-primary bg-paper px-3 py-2 text-[24px] font-extrabold tracking-tight outline-none" /> : <h2 className="text-[26px] font-extrabold tracking-tight">{order.headline}</h2>}
        <button type="button" disabled={busy || order.status !== "ready"} onClick={() => { void setOrderStatus({ data: { id: order.id, status: "picked" } }).then((next) => onOrder({ ...next, statusMessage: "Ya tienes el pedido. Llévalo con cuidado." })).catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo actualizar el pedido")); }} className="mt-4 h-14 w-full rounded-full max-[720px]:mt-3 max-[720px]:h-12 bg-primary text-lg font-bold text-primary-fg transition active:brightness-95 disabled:opacity-60">{order.status === "picked" || order.status === "exited" ? "Ya tienes el pedido" : "Tengo el pedido"}</button>
        <button type="button" onClick={() => setSheet("details")} className="mt-2 w-full py-1 text-center text-sm font-medium text-muted">Detalles del pedido ›</button>
      </section>

      <button type="button" onClick={() => setSheet("help")} className="mt-3 flex w-full shrink-0 items-center gap-3 rounded-2xl bg-paper px-4 py-3.5 text-left max-[720px]:mt-2 max-[720px]:py-3"><TriangleAlert className="size-5 shrink-0" strokeWidth={1.75} /><span className="flex-1 font-medium">Centro de ayuda</span><ChevronRight className="size-5 text-muted" /></button>

      <section className="mt-3 shrink-0 rounded-3xl bg-paper px-2 pt-3 pb-0 max-[720px]:mt-2 max-[720px]:pt-2">
        <p className="px-3 text-center text-sm font-medium">¿Te gustó el servicio de la tienda?</p>
        <div className="mt-1 grid grid-cols-2">
          <button type="button" onClick={() => void rate("no")} className={`flex items-center justify-center gap-3 py-3 text-lg font-medium ${order.rating === "no" ? "text-primary" : "text-ink"}`}><ThumbsDown className="size-7" strokeWidth={1.6} fill={order.rating === "no" ? "currentColor" : "none"} />No</button>
          <button type="button" onClick={() => void rate("yes")} className={`flex items-center justify-center gap-3 border-l border-line py-3 text-lg font-medium ${order.rating === "yes" ? "text-primary" : "text-ink"}`}><ThumbsUp className="size-7" strokeWidth={1.6} fill={order.rating === "yes" ? "currentColor" : "none"} />Sí</button>
        </div>
      </section>

      <div className="mt-auto flex shrink-0 items-center gap-3 pt-3 pb-3 max-[720px]:pt-2 max-[720px]:pb-2">
        <button type="button" aria-label={editing ? "Guardar cambios de la tienda" : "Editar pantalla de la tienda"} disabled={savingPresentation} onClick={() => void toggleEditor()} className="grid size-12 shrink-0 place-items-center disabled:opacity-50">{editing ? <Check className="size-7" strokeWidth={2.5} /> : <SlidersHorizontal className="size-7" strokeWidth={2.1} />}</button>
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void changePhoto(event.target.files?.[0])} />
        <ExitSlider disabled={!canExit || photoBusy} loading={busy} onComplete={completeExit} />
      </div>
      {(photoBusy || savingPresentation) && <span className="pb-1 text-center text-xs text-muted">{photoBusy ? "Actualizando fotografía…" : "Guardando cambios…"}</span>}
    </div>

    {sheet === "details" && <Overlay title="Detalles del pedido" onClose={() => setSheet(null)}>
      <p className="text-sm text-muted">Código {order.code}</p>
      <ul className="mt-4 divide-y divide-line">{order.items.map((item) => <li key={item.name} className="flex items-center justify-between py-3"><span className="font-medium">{item.name}</span><span className="text-muted">×{item.qty}</span></li>)}</ul>
      <div className="mt-2 flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-lg font-extrabold">{formatCop(order.totalCop)}</span></div>
      <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed">{order.customerName}. {order.note}</p>
    </Overlay>}
    {sheet === "help" && <Overlay title="Centro de ayuda" onClose={() => setSheet(null)}>
      <ul className="space-y-3 text-sm leading-relaxed">
        <li className="rounded-2xl bg-paper px-4 py-3"><p className="font-semibold">No encuentro la tienda</p><p className="mt-1 text-muted">{order.storeName} queda en {address}. Llama si la fachada no coincide.</p></li>
        <li className="rounded-2xl bg-paper px-4 py-3"><p className="font-semibold">El pedido no está listo</p><p className="mt-1 text-muted">Espera en caja y no marques “Tengo el pedido” hasta recibirlo completo.</p></li>
        <li className="rounded-2xl bg-paper px-4 py-3"><p className="font-semibold">Problema con el QR</p><p className="mt-1 text-muted">Muestra el código {order.code} en caja. Si no lee, dicta el número.</p></li>
      </ul>
    </Overlay>}
    {sheet === "qr" && <Overlay title="QR-Code" onClose={() => setSheet(null)}><div className="flex flex-col items-center rounded-3xl border border-line px-4 py-6"><QrMark value={order.code} /><p className="mt-4 text-2xl font-extrabold tracking-wide">{order.code}</p><p className="mt-1 text-center text-sm text-muted">Muéstralo en caja de {order.storeName}</p></div></Overlay>}
    {sheet === "photo" && <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink" onClick={() => setSheet(null)} role="presentation"><button type="button" aria-label="Cerrar foto" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-card text-ink"><X className="size-5" /></button>{order.photoUrl && <img src={order.photoUrl} alt={`Fachada de ${order.storeName}`} className="max-h-[80dvh] w-full max-w-md object-contain" />}</div>}
  </div>;
}
