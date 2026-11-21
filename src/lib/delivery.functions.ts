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
  email?: string;
  displayName: string;
  role: string;
  credits: number;
  blocked?: boolean;
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

const SUPERADMIN_EMAIL = "noropayments@gmail.com";

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string; email: string }>`
    select p.role, lower(u.email) as email
    from profiles p
    join "user" u on u.id = p.user_id
    where p.user_id = ${userId}
  `;
  if (userId !== "dev-admin" && (rows[0]?.role !== "superadmin" || rows[0]?.email !== SUPERADMIN_EMAIL)) {
    throw new Error("Solo noropayments@gmail.com puede realizar esta acción");
  }
  return sql;
}

export const getActiveOrder = createServerFn({ method: "GET" }).handler(async () => {
  return readActive();
});

export const getOrderForStore = createServerFn({ method: "GET" })
  .validator((value: number) => {
    const storeId = Math.trunc(Number(value));
    if (!Number.isInteger(storeId) || storeId <= 0) throw new Error("Tienda inválida");
    return storeId;
  })
  .handler(async ({ data: storeId }) => {
    const sql = await getSql();
    const rows = await sql.query<OrderSqlRow>(
      `${ORDER_SELECT} where s.id = $1 order by case o.status when 'ready' then 0 when 'picked' then 1 when 'delivered' then 2 else 3 end, o.id desc limit 1`,
      [storeId],
    );
    return rows[0] ? mapOrder(rows[0]) : null;
  });

export const updateStorePhoto = createServerFn({ method: "POST" })
  .validator((input: { storeId: number; photoDataUrl: string }) => {
    const storeId = Math.trunc(Number(input?.storeId));
    const photoDataUrl = String(input?.photoDataUrl ?? "");
    if (!Number.isInteger(storeId) || storeId <= 0 ||
      !/^data:image\\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoDataUrl) ||
      photoDataUrl.length > 2_800_000) {
      throw new Error("La imagen debe ser JPG, PNG o WebP y pesar menos de 2 MB");
    }
    return { storeId, photoDataUrl };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await sql<{ is_blocked: boolean }>`select is_blocked from profiles where user_id = ${context.userId}`;
    if (!profile[0] || profile[0].is_blocked) throw new Error("Tu cuenta no está habilitada");
    const rows = await sql<{ id: number }>`
      update stores set photo_url = ${data.photoDataUrl} where id = ${data.storeId} returning id
    `;
    if (!rows[0]) throw new Error("No se encontró la tienda");
    return { photoUrl: data.photoDataUrl };
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
    const identity = context.userId === "dev-admin"
      ? [{ email: SUPERADMIN_EMAIL }]
      : context.userId === "dev-user"
        ? [{ email: "" }]
        : await sql<{ email: string }>`
            select lower(email) as email from "user" where id = ${context.userId}
          `;
    if (!identity[0]) throw new Error("No se pudo verificar tu cuenta");
    const isSuperadmin = context.userId === "dev-admin" || identity[0].email === SUPERADMIN_EMAIL;
    const existing = await sql<{ role: string; credits: number; display_name: string; is_blocked: boolean }>`
      select role, credits, display_name, is_blocked from profiles where user_id = ${context.userId}
    `;
    if (existing[0]) {
      if (existing[0].is_blocked && !isSuperadmin) throw new Error("Tu cuenta está bloqueada. Contacta al administrador.");
      const role = isSuperadmin ? "superadmin" : "courier";
      await sql`
        update profiles
        set display_name = case when ${displayName} <> '' then ${displayName} else display_name end,
            role = ${role}
        where user_id = ${context.userId}
      `;
      if (context.userId === "dev-admin") {
        await sql`
          insert into profiles (user_id, display_name, role, credits)
          values ('dev-user', 'Usuario', 'courier', 0)
          on conflict (user_id) do nothing
        `;
      }
      return {
        userId: context.userId,
        displayName: displayName || existing[0].display_name,
        role,
        credits: Number(existing[0].credits),
        blocked: existing[0].is_blocked,
      } satisfies ProfileRow;
    }
    const role = isSuperadmin ? "superadmin" : "courier";
    await sql`
      insert into profiles (user_id, display_name, role, credits)
      values (${context.userId}, ${displayName || (context.userId === "dev-admin" ? "Administrador" : context.userId === "dev-user" ? "Usuario" : "")}, ${role}, 0)
    `;
    if (context.userId === "dev-admin") {
      await sql`
        insert into profiles (user_id, display_name, role, credits)
        values ('dev-user', 'Usuario', 'courier', 0)
        on conflict (user_id) do nothing
      `;
    }
    return {
      userId: context.userId,
      displayName: displayName || (context.userId === "dev-admin" ? "Administrador" : context.userId === "dev-user" ? "Usuario" : ""),
      role,
      credits: 0,
      blocked: false,
    } satisfies ProfileRow;
  });

export const listStores = createServerFn({ method: "GET" })
  .handler(async () => {
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
      email: string;
      is_blocked: boolean;
    }>`
      select u.id as user_id,
        coalesce(p.display_name, u.name, '') as display_name,
        coalesce(p.role, case when lower(u.email) = ${SUPERADMIN_EMAIL} then 'superadmin' else 'courier' end) as role,
        coalesce(p.credits, 0) as credits,
        coalesce(p.is_blocked, false) as is_blocked,
        u.email
      from "user" u
      left join profiles p on p.user_id = u.id
      union all
      select p.user_id as user_id, p.display_name, p.role, p.credits,
        coalesce(p.is_blocked, false) as is_blocked,
        case when p.user_id = 'dev-admin' then 'noropayments@gmail.com' else '' end as email
      from profiles p
      where p.user_id in ('dev-admin', 'dev-user')
      order by display_name asc
    `;
    return rows.map(
      (row): ProfileRow => ({
        userId: row.user_id,
        email: row.email ?? "",
        displayName: row.display_name,
        role: row.role,
        credits: Number(row.credits),
        blocked: row.is_blocked,
      }),
    );
  });

export const setUserBlocked = createServerFn({ method: "POST" })
  .validator((input: { userId: string; blocked: boolean }) => {
    const userId = String(input?.userId ?? "").trim();
    if (!userId || typeof input?.blocked !== "boolean") throw new Error("Solicitud inválida");
    return { userId, blocked: input.blocked };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("No puedes bloquear tu propia cuenta");
    await sql`
      insert into profiles (user_id, display_name, role, credits)
      select id, coalesce(name, ''), 'courier', 0
      from "user"
      where id = ${data.userId} and lower(email) <> ${SUPERADMIN_EMAIL}
      on conflict (user_id) do nothing
    `;
    const rows = await sql<{ id: string }>`
      update profiles set is_blocked = ${data.blocked}
      where user_id = ${data.userId}
        and (user_id = 'dev-user' or user_id in (select id from "user" where lower(email) <> ${SUPERADMIN_EMAIL}))
      returning user_id as id
    `;
    if (!rows[0]) throw new Error("No se encontró el usuario o no se puede bloquear");
    return { userId: data.userId, blocked: data.blocked };
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
    await sql`
      insert into profiles (user_id, display_name, role, credits)
      select id, coalesce(name, ''), 'courier', 0 from "user" where id = ${data.userId}
      on conflict (user_id) do nothing
    `;
    await sql`
      insert into profiles (user_id, display_name, role, credits)
      select 'dev-user', 'Usuario', 'courier', 0
      where ${data.userId} = 'dev-user'
      on conflict (user_id) do nothing
    `;
    const updated = await sql<{ credits: number; transaction_id: number }>`
      with changed as (
        update profiles set credits = credits + ${data.amount}
        where user_id = ${data.userId}
        returning user_id, credits
      ), logged as (
        insert into credit_transactions
          (user_id, amount, transaction_type, reason, actor_user_id)
        select user_id, ${data.amount}, 'grant', 'Asignación manual del súper admin', ${context.userId}
        from changed
        returning id
      )
      select changed.credits, logged.id as transaction_id
      from changed cross join logged
    `;
    if (!updated[0]) throw new Error("Ese usuario todavía no ha entrado a la app");
    return { credits: Number(updated[0].credits), transactionId: Number(updated[0].transaction_id) };
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


export type OutingRow = {
  id: number;
  storeName: string;
  userName: string;
  userEmail: string;
  destination: string;
  notes: string;
  creditsUsed: number;
  createdAt: string;
};

export const createOuting = createServerFn({ method: "POST" })
  .validator((input: { storeId: number; destination?: string; notes?: string; doublet?: boolean; requestKey: string }) => {
    const storeId = Math.trunc(Number(input?.storeId));
    const destination = String(input?.destination ?? "Entrega asignada").trim().slice(0, 180);
    const notes = String(input?.notes ?? "").trim().slice(0, 500);
    const doublet = input?.doublet === true;
    const requestKey = String(input?.requestKey ?? "").trim().slice(0, 80);
    if (!Number.isInteger(storeId) || storeId <= 0 || requestKey.length < 12) {
      throw new Error("No se pudo validar la salida");
    }
    return { storeId, destination, notes, doublet, requestKey, cost: doublet ? 2 : 1 };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const active = await sql<{ is_blocked: boolean }>`select is_blocked from profiles where user_id = ${context.userId}`;
    if (!active[0] || active[0].is_blocked) throw new Error("Tu cuenta está bloqueada o no está habilitada.");
    const rows = await sql<{ id: number; credits: number; was_duplicate: boolean }>`
      with profile_lock as materialized (
        select user_id, credits from profiles where user_id = ${context.userId} for update
      ), existing as materialized (
        select id from outings where user_id = ${context.userId} and request_key = ${data.requestKey} limit 1
      ), charged as (
        update profiles set credits = credits - ${data.cost}
        where user_id = ${context.userId} and credits >= ${data.cost}
          and exists (select 1 from profile_lock)
          and not exists (select 1 from existing)
          and exists (select 1 from stores where id = ${data.storeId})
        returning user_id, credits
      ), outing as (
        insert into outings (user_id, store_id, destination, notes, credits_used, request_key)
        select user_id, ${data.storeId}, ${data.destination}, ${data.notes}, ${data.cost}, ${data.requestKey}
        from charged
        on conflict (user_id, request_key) do nothing
        returning id, user_id
      ), ledger as (
        insert into credit_transactions (user_id, amount, transaction_type, reason, reference_type, reference_id, actor_user_id)
        select user_id, -${data.cost}, 'spend', 'Salida registrada', 'outing', id::text, user_id
        from outing returning id
      )
      select coalesce(outing.id, existing.id) as id,
        profiles.credits,
        (existing.id is not null) as was_duplicate
      from profiles
      left join existing on true
      left join outing on true
      where profiles.user_id = ${context.userId}
        and (existing.id is not null or outing.id is not null)
    `;
    if (!rows[0]) {
      const profile = await sql<{ credits: number }>`select credits from profiles where user_id = ${context.userId}`;
      if (!profile[0]) throw new Error("No se encontró tu perfil");
      if (Number(profile[0].credits) < data.cost) throw new Error("No tienes créditos suficientes");
      throw new Error("No se pudo registrar la salida. Verifica la tienda seleccionada.");
    }
    return { id: Number(rows[0].id), credits: Number(rows[0].credits), deduplicated: rows[0].was_duplicate };
  });

export const listOutings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql<{
      id: number; store_name: string; display_name: string; email: string;
      destination: string; notes: string; credits_used: number; created_at: string;
    }>`
      select o.id, s.name as store_name, p.display_name, u.email,
        o.destination, o.notes, o.credits_used, o.created_at::text
      from outings o
      join stores s on s.id = o.store_id
      join profiles p on p.user_id = o.user_id
      left join "user" u on u.id = o.user_id
      order by o.created_at desc
      limit 500
    `;
    return rows.map((r): OutingRow => ({
      id: Number(r.id), storeName: r.store_name, userName: r.display_name,
      userEmail: r.email ?? "", destination: r.destination, notes: r.notes,
      creditsUsed: Number(r.credits_used), createdAt: r.created_at,
    }));
  });
