import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type OrderItem = { name: string; qty: number };

export type ActiveOrder = {
  id: number;
  code: string;
  status: string;
  headline: string;
  statusMessage: string;
  items: OrderItem[];
  totalCop: number;
  customerName: string;
  note: string;
  rating: string | null;
  storeId: number;
  storeName: string;
  address: string;
  city: string;
  phone: string;
  photoUrl: string;
};

export type StoreRow = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  photoUrl: string;
};

export type ProfileRow = {
  userId: string;
  displayName: string;
  role: string;
  credits: number;
};

type OrderSqlRow = {
  id: number;
  code: string;
  status: string;
  headline: string;
  status_message: string;
  items_json: string;
  total_cop: number;
  customer_name: string;
  note: string;
  rating: string | null;
  store_id: number;
  store_name: string;
  address: string;
  city: string;
  phone: string;
  photo_url: string;
};

function parseItems(raw: string): OrderItem[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const rec = row as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name : "";
      const qty = typeof rec.qty === "number" ? rec.qty : 1;
      return name ? [{ name, qty }] : [];
    });
  } catch {
    return [];
  }
}

function mapOrder(row: OrderSqlRow): ActiveOrder {
  return {
    id: Number(row.id),
    code: row.code,
    status: row.status,
    headline: row.headline,
    statusMessage: row.status_message,
    items: parseItems(row.items_json),
    totalCop: Number(row.total_cop),
    customerName: row.customer_name,
    note: row.note,
    rating: row.rating,
    storeId: Number(row.store_id),
    storeName: row.store_name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    photoUrl: row.photo_url,
  };
}

const ORDER_SELECT = `
  select
    o.id, o.code, o.status, o.headline, o.status_message, o.items_json,
    o.total_cop, o.customer_name, o.note, o.rating, o.store_id,
    s.name as store_name, s.address, s.city, s.phone, s.photo_url
  from orders o
  join stores s on s.id = o.store_id
`;

async function readActive(): Promise<ActiveOrder | null> {
  const sql = await getSql();
  const rows = await sql.query<OrderSqlRow>(
    `${ORDER_SELECT} order by case o.status when 'ready' then 0 when 'picked' then 1 when 'delivered' then 2 else 3 end, o.id desc limit 1`,
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role from profiles where user_id = ${userId}
  `;
  if (rows[0]?.role !== "superadmin") {
    throw new Error("Solo el súper admin puede hacer esto");
  }
  return sql;
}

export const getActiveOrder = createServerFn({ method: "GET" }).handler(async () => {
  return readActive();
});

const STATUSES = new Set(["ready", "picked", "delivered", "exited"]);

export const setOrderStatus = createServerFn({ method: "POST" })
  .validator((input: { id: number; status: string }) => {
    const id = Number(input?.id);
    const status = String(input?.status ?? "");
    if (!Number.isFinite(id) || !STATUSES.has(status)) {
      throw new Error("No se pudo actualizar el pedido");
    }
    return { id, status };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update orders set status = ${data.status} where id = ${data.id}`;
    const order = await readActive();
    if (!order) throw new Error("Pedido no encontrado");
    return order;
  });

export const rateStore = createServerFn({ method: "POST" })
  .validator((input: { id: number; rating: string }) => {
    const id = Number(input?.id);
    const rating = input?.rating === "no" ? "no" : "yes";
    if (!Number.isFinite(id)) throw new Error("Pedido inválido");
    return { id, rating };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update orders set rating = ${data.rating} where id = ${data.id}`;
    const order = await readActive();
    if (!order) throw new Error("Pedido no encontrado");
    return order;
  });

export const ensureProfile = createServerFn({ method: "POST" })
  .validator((name: string) => String(name ?? "").trim().slice(0, 80))
  .middleware([authMiddleware])
  .handler(async ({ context, data: displayName }) => {
    const sql = await getSql();
    const existing = await sql<{ role: string; credits: number; display_name: string }>`
      select role, credits, display_name from profiles where user_id = ${context.userId}
    `;
    if (existing[0]) {
      if (displayName && displayName !== existing[0].display_name) {
        await sql`update profiles set display_name = ${displayName} where user_id = ${context.userId}`;
      }
      return {
        userId: context.userId,
        displayName: displayName || existing[0].display_name,
        role: existing[0].role,
        credits: Number(existing[0].credits),
      } satisfies ProfileRow;
    }
    const admins = await sql<{ n: number }>`
      select count(*)::int as n from profiles where role = 'superadmin'
    `;
    const role = Number(admins[0]?.n ?? 0) === 0 ? "superadmin" : "courier";
    await sql`
      insert into profiles (user_id, display_name, role, credits)
      values (${context.userId}, ${displayName}, ${role}, 0)
    `;
    return {
      userId: context.userId,
      displayName,
      role,
      credits: 0,
    } satisfies ProfileRow;
  });

export const listStores = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      name: string;
      address: string;
      city: string;
      phone: string;
      photo_url: string;
    }>`
      select id, name, address, city, phone, photo_url from stores order by id asc
    `;
    return rows.map(
      (row): StoreRow => ({
        id: Number(row.id),
        name: row.name,
        address: row.address,
        city: row.city,
        phone: row.phone,
        photoUrl: row.photo_url,
      }),
    );
  });

export const addStore = createServerFn({ method: "POST" })
  .validator((input: { name: string; address: string; city: string; phone: string }) => {
    const name = String(input?.name ?? "").trim().slice(0, 80);
    const address = String(input?.address ?? "").trim().slice(0, 120);
    const city = String(input?.city ?? "").trim().slice(0, 80);
    const phone = String(input?.phone ?? "").trim().slice(0, 40);
    if (name.length < 2 || address.length < 3) {
      throw new Error("Nombre y dirección son obligatorios");
    }
    return { name, address, city, phone };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql<{ id: number }>`
      insert into stores (name, address, city, phone, created_by)
      values (${data.name}, ${data.address}, ${data.city}, ${data.phone}, ${context.userId})
      returning id
    `;
    return { id: Number(rows[0]?.id ?? 0) };
  });

export const listProfiles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      role: string;
      credits: number;
    }>`
      select user_id, display_name, role, credits from profiles order by created_at asc
    `;
    return rows.map(
      (row): ProfileRow => ({
        userId: row.user_id,
        displayName: row.display_name,
        role: row.role,
        credits: Number(row.credits),
      }),
    );
  });

export const grantCredits = createServerFn({ method: "POST" })
  .validator((input: { userId: string; amount: number }) => {
    const userId = String(input?.userId ?? "").trim();
    const amount = Math.round(Number(input?.amount));
    if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      throw new Error("Indica un monto de créditos válido");
    }
    return { userId, amount };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const updated = await sql<{ credits: number }>`
      update profiles set credits = credits + ${data.amount}
      where user_id = ${data.userId}
      returning credits
    `;
    if (!updated[0]) throw new Error("Ese usuario todavía no ha entrado a la app");
    return { credits: Number(updated[0].credits) };
  });

export const updateHeadline = createServerFn({ method: "POST" })
  .validator((headline: string) => {
    const text = String(headline ?? "").trim().slice(0, 80);
    if (!text) throw new Error("Escribe el texto del recuadro");
    return text;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: headline }) => {
    const sql = await requireAdmin(context.userId);
    await sql`
      update orders set headline = ${headline}
      where id = (select id from orders order by id desc limit 1)
    `;
    const order = await readActive();
    if (!order) throw new Error("No hay pedido");
    return order;
  });

export const assignPickupStore = createServerFn({ method: "POST" })
  .validator((storeId: number) => {
    const id = Number(storeId);
    if (!Number.isFinite(id)) throw new Error("Tienda inválida");
    return id;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data: storeId }) => {
    const sql = await requireAdmin(context.userId);
    const stores = await sql<{ id: number }>`select id from stores where id = ${storeId}`;
    if (!stores[0]) throw new Error("Tienda no encontrada");
    await sql`
      update orders set store_id = ${storeId}
      where id = (select id from orders order by id desc limit 1)
    `;
    const order = await readActive();
    if (!order) throw new Error("No hay pedido");
    return order;
  });
