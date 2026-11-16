import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  Phone,
  Scan,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  rateStore,
  setOrderStatus,
  type ActiveOrder,
} from "@/lib/delivery.functions";
import { formatCop, telHref } from "@/lib/format";
import { signOut } from "@/lib/auth/client";
import type { ProfileRow } from "@/lib/delivery.functions";

type Sheet = "details" | "help" | "qr" | "options" | "photo" | "exit" | null;

function bannerFor(order: ActiveOrder) {
  if (order.status === "picked") return "Ya tienes el pedido. Llévalo con cuidado.";
  if (order.status === "delivered") return "Pedido entregado. Gracias por el servicio.";
  if (order.status === "exited") return "Saliste de este pedido.";
  return order.statusMessage;
}

function ctaFor(status: string) {
  if (status === "picked") return "Entregué el pedido";
  if (status === "delivered") return "Pedido entregado";
  if (status === "exited") return "Volver al pedido";
  return "Tengo el pedido";
}

function QrMark({ value }: { value: string }) {
  const n = 25;
  const cells = new Array<boolean>(n * n).fill(false);
  let hash = 2166136261;
  for (const ch of value) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  for (let i = 0; i < cells.length; i++) {
    hash = Math.imul(hash ^ (i + 17), 16777619);
    cells[i] = (hash >>> 0) % 3 !== 0;
  }
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[(oy + y) * n + (ox + x)] = edge || core;
      }
    }
  };
  stamp(0, 0);
  stamp(n - 7, 0);
  stamp(0, n - 7);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-52 w-52 text-ink" aria-hidden="true">
      <rect width={n} height={n} className="fill-card" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i % n}
            y={Math.floor(i / n)}
            width="1"
            height="1"
            fill="currentColor"
          />
        ) : null,
      )}
    </svg>
  );
}

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-3 pb-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full bg-paper"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PickupScreen({
  order,
  onOrder,
  profile,
}: {
  order: ActiveOrder;
  onOrder: (order: ActiveOrder) => void;
  profile: ProfileRow | null;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const address = [order.address, order.city].filter(Boolean).join(", ");
  const phone = telHref(order.phone);

  async function run(task: () => Promise<ActiveOrder>, done?: string) {
    if (busy) return;
    setBusy(true);
    try {
      onOrder(await task());
      if (done) toast.success(done);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  function onPrimary() {
    if (order.status === "ready") {
      void run(() => setOrderStatus({ data: { id: order.id, status: "picked" } }), "Pedido recogido");
    } else if (order.status === "picked") {
      void run(
        () => setOrderStatus({ data: { id: order.id, status: "delivered" } }),
        "Entrega confirmada",
      );
    } else if (order.status === "exited") {
      void run(() => setOrderStatus({ data: { id: order.id, status: "ready" } }));
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-card sm:shadow-xl">
      <div className="relative">
        {order.photoUrl ? (
          <img
            src={order.photoUrl}
            alt={`Fachada de ${order.storeName}`}
            className="block aspect-[720/308] w-full object-cover"
          />
        ) : (
          <div className="aspect-[720/308] w-full bg-primary" />
        )}
        <button
          type="button"
          aria-label="Volver"
          onClick={() => setSheet("options")}
          className="absolute top-3 left-3 grid size-14 place-items-center rounded-2xl bg-card shadow-md"
        >
          <ChevronDown className="size-7" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => setSheet("photo")}
          className="absolute right-3 bottom-6 inline-flex items-center gap-1 rounded-full bg-ink/80 py-1.5 pr-2 pl-3 text-sm font-semibold text-primary-fg"
        >
          1/1
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="relative z-10 -mt-5 flex flex-1 flex-col rounded-t-3xl bg-card px-4">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />

        <header className="mt-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">{order.storeName}</h1>
              <button
                type="button"
                onClick={() => setSheet("qr")}
                className="rounded-full bg-badge px-2.5 py-1 text-xs font-bold text-primary-fg"
              >
                QR-Code
              </button>
            </div>
            <p className="mt-1 text-sm leading-snug text-muted">{address}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Ver código QR"
              onClick={() => setSheet("qr")}
              className="grid size-12 place-items-center rounded-full bg-paper"
            >
              <Scan className="size-6" strokeWidth={1.75} />
            </button>
            {phone ? (
              <a
                href={phone}
                aria-label={`Llamar a la tienda ${order.phone}`}
                className="grid size-12 place-items-center rounded-full bg-paper text-ink"
              >
                <Phone className="size-6" strokeWidth={1.75} />
              </a>
            ) : null}
          </div>
        </header>

        <p className="mt-4 rounded-2xl bg-paper px-4 py-4 text-base leading-snug font-medium">
          {bannerFor(order)}
        </p>

        <section className="mt-4 rounded-3xl border border-line px-4 pt-5 pb-4">
          <h2 className="text-2xl font-extrabold tracking-tight">{order.headline}</h2>
          <button
            type="button"
            disabled={busy || order.status === "delivered"}
            onClick={onPrimary}
            className="mt-5 h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-fg transition active:brightness-95 disabled:opacity-60"
          >
            {ctaFor(order.status)}
          </button>
          <button
            type="button"
            onClick={() => setSheet("details")}
            className="mt-3 w-full py-2 text-center text-sm font-medium text-muted"
          >
            Detalles del pedido ›
          </button>
        </section>

        <button
          type="button"
          onClick={() => setSheet("help")}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-paper px-4 py-4 text-left"
        >
          <TriangleAlert className="size-5 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 font-medium">Centro de ayuda</span>
          <ChevronRight className="size-5 text-muted" />
        </button>

        <section className="mt-4 rounded-3xl bg-paper px-2 pt-4 pb-1">
          <p className="px-3 text-center text-base font-medium">
            ¿Te gustó el servicio de la tienda?
          </p>
          <div className="mt-1 grid grid-cols-2">
            <button
              type="button"
              onClick={() =>
                void run(() => rateStore({ data: { id: order.id, rating: "no" } }))
              }
              className={`flex items-center justify-center gap-3 py-4 text-lg font-medium ${
                order.rating === "no" ? "text-primary" : "text-ink"
              }`}
            >
              <ThumbsDown
                className="size-8"
                strokeWidth={1.6}
                fill={order.rating === "no" ? "currentColor" : "none"}
              />
              No
            </button>
            <button
              type="button"
              onClick={() =>
                void run(() => rateStore({ data: { id: order.id, rating: "yes" } }))
              }
              className={`flex items-center justify-center gap-3 border-l border-line py-4 text-lg font-medium ${
                order.rating === "yes" ? "text-primary" : "text-ink"
              }`}
            >
              <ThumbsUp
                className="size-8"
                strokeWidth={1.6}
                fill={order.rating === "yes" ? "currentColor" : "none"}
              />
              Sí
            </button>
          </div>
        </section>

        <div className="mt-auto flex items-center gap-3 pt-5 pb-6">
          <button
            type="button"
            aria-label="Opciones"
            onClick={() => setSheet("options")}
            className="grid size-12 shrink-0 place-items-center"
          >
            <SlidersHorizontal className="size-7" strokeWidth={2.1} />
          </button>
          <button
            type="button"
            onClick={() => setSheet("exit")}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-chip text-lg font-semibold text-muted"
          >
            <ChevronsRight className="size-5" strokeWidth={2.25} />
            Salir
          </button>
        </div>
      </div>

      {sheet === "details" ? (
        <Overlay title="Detalles del pedido" onClose={() => setSheet(null)}>
          <p className="text-sm text-muted">Código {order.code}</p>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.name} className="flex items-center justify-between py-3">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted">×{item.qty}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-extrabold">{formatCop(order.totalCop)}</span>
          </div>
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed">
            {order.customerName}. {order.note}
          </p>
        </Overlay>
      ) : null}

      {sheet === "help" ? (
        <Overlay title="Centro de ayuda" onClose={() => setSheet(null)}>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li className="rounded-2xl bg-paper px-4 py-3">
              <p className="font-semibold">No encuentro la tienda</p>
              <p className="mt-1 text-muted">
                {order.storeName} queda en {address}. Llama si la fachada no coincide.
              </p>
            </li>
            <li className="rounded-2xl bg-paper px-4 py-3">
              <p className="font-semibold">El pedido no está listo</p>
              <p className="mt-1 text-muted">
                Espera en caja y no marques “Tengo el pedido” hasta recibirlo completo.
              </p>
            </li>
            <li className="rounded-2xl bg-paper px-4 py-3">
              <p className="font-semibold">Problema con el QR</p>
              <p className="mt-1 text-muted">
                Muestra el código {order.code} en caja. Si no lee, dicta el número.
              </p>
            </li>
          </ul>
        </Overlay>
      ) : null}

      {sheet === "qr" ? (
        <Overlay title="QR-Code" onClose={() => setSheet(null)}>
          <div className="flex flex-col items-center rounded-3xl border border-line px-4 py-6">
            <QrMark value={order.code} />
            <p className="mt-4 text-2xl font-extrabold tracking-wide">{order.code}</p>
            <p className="mt-1 text-center text-sm text-muted">
              Muéstralo en caja de {order.storeName}
            </p>
          </div>
        </Overlay>
      ) : null}

      {sheet === "photo" ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Cerrar foto"
            className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-card text-ink"
          >
            <X className="size-5" />
          </button>
          {order.photoUrl ? (
            <img
              src={order.photoUrl}
              alt={`Fachada de ${order.storeName}`}
              className="max-h-[80dvh] w-full max-w-md object-contain"
            />
          ) : null}
        </div>
      ) : null}

      {sheet === "options" ? (
        <Overlay title="Opciones" onClose={() => setSheet(null)}>
          <div className="space-y-3">
            <div className="rounded-2xl bg-paper px-4 py-3">
              <p className="text-sm text-muted">Pedido</p>
              <p className="font-semibold">{order.code}</p>
            </div>
            <div className="rounded-2xl bg-paper px-4 py-3">
              <p className="text-sm text-muted">Créditos</p>
              <p className="font-semibold">
                {profile ? profile.credits.toLocaleString("es-CO") : "Entra para verlos"}
              </p>
              {profile ? (
                <p className="mt-1 text-sm text-muted">
                  {profile.role === "superadmin" ? "Súper admin" : "Repartidor"}
                </p>
              ) : null}
            </div>
            {profile?.role === "superadmin" ? (
              <Link
                to="/admin"
                className="flex h-12 items-center justify-center rounded-full bg-primary font-bold text-primary-fg"
              >
                Tiendas y créditos
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex h-12 items-center justify-center rounded-full bg-ink font-bold text-primary-fg"
              >
                {profile ? "Tu cuenta" : "Entrar"}
              </Link>
            )}
            {profile ? (
              <button
                type="button"
                onClick={() => void signOut("/").catch(() => toast.error("No se pudo salir"))}
                className="h-12 w-full rounded-full bg-paper font-semibold"
              >
                Cerrar sesión
              </button>
            ) : null}
          </div>
        </Overlay>
      ) : null}

      {sheet === "exit" ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-label="Salir del pedido"
            className="w-full max-w-md rounded-t-3xl bg-card px-5 pt-5 pb-8 sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold">¿Salir de este pedido?</h2>
            <p className="mt-1 text-sm text-muted">Puedes retomarlo cuando quieras.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="h-12 rounded-full bg-paper font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSheet(null);
                  void run(
                    () => setOrderStatus({ data: { id: order.id, status: "exited" } }),
                    "Saliste del pedido",
                  );
                }}
                className="h-12 rounded-full bg-primary font-bold text-primary-fg"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
