import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as getSql, t as authMiddleware } from "./middleware-CL-txhd2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/delivery.functions-CSKAtxj9.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function parseItems(raw) {
	try {
		const data = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		return data.flatMap((row) => {
			if (!row || typeof row !== "object") return [];
			const rec = row;
			const name = typeof rec.name === "string" ? rec.name : "";
			const qty = typeof rec.qty === "number" ? rec.qty : 1;
			return name ? [{
				name,
				qty
			}] : [];
		});
	} catch {
		return [];
	}
}
function mapOrder(row) {
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
		photoUrl: row.photo_url
	};
}
var ORDER_SELECT = `
  select
    o.id, o.code, o.status, o.headline, o.status_message, o.items_json,
    o.total_cop, o.customer_name, o.note, o.rating, o.store_id,
    s.name as store_name, s.address, s.city, s.phone, s.photo_url
  from orders o
  join stores s on s.id = o.store_id
`;
async function readActive() {
	const rows = await (await getSql()).query(`${ORDER_SELECT} order by case o.status when 'ready' then 0 when 'picked' then 1 when 'delivered' then 2 else 3 end, o.id desc limit 1`);
	return rows[0] ? mapOrder(rows[0]) : null;
}
async function requireAdmin(userId) {
	const sql = await getSql();
	if ((await sql`
    select role from profiles where user_id = ${userId}
  `)[0]?.role !== "superadmin") throw new Error("Solo el súper admin puede hacer esto");
	return sql;
}
var getActiveOrder_createServerFn_handler = createServerRpc({
	id: "8db55f1f3a827256aa3e3e1572be5ff9573a7c543001067dc67bfd775f4ba8ae",
	name: "getActiveOrder",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => getActiveOrder.__executeServer(opts));
var getActiveOrder = createServerFn({ method: "GET" }).handler(getActiveOrder_createServerFn_handler, async () => {
	return readActive();
});
var STATUSES = /* @__PURE__ */ new Set([
	"ready",
	"picked",
	"delivered",
	"exited"
]);
var setOrderStatus_createServerFn_handler = createServerRpc({
	id: "ca4d9f56f1dd4724f25037db29c810d88f29f8f84e1ce23874f3bfe3c4c49fe7",
	name: "setOrderStatus",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => setOrderStatus.__executeServer(opts));
var setOrderStatus = createServerFn({ method: "POST" }).validator((input) => {
	const id = Number(input?.id);
	const status = String(input?.status ?? "");
	if (!Number.isFinite(id) || !STATUSES.has(status)) throw new Error("No se pudo actualizar el pedido");
	return {
		id,
		status
	};
}).handler(setOrderStatus_createServerFn_handler, async ({ data }) => {
	await (await getSql())`update orders set status = ${data.status} where id = ${data.id}`;
	const order = await readActive();
	if (!order) throw new Error("Pedido no encontrado");
	return order;
});
var rateStore_createServerFn_handler = createServerRpc({
	id: "266545130c1973bb00696a90a669b084dca2ab8cc700e67f7d218f28fe65b9e9",
	name: "rateStore",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => rateStore.__executeServer(opts));
var rateStore = createServerFn({ method: "POST" }).validator((input) => {
	const id = Number(input?.id);
	const rating = input?.rating === "no" ? "no" : "yes";
	if (!Number.isFinite(id)) throw new Error("Pedido inválido");
	return {
		id,
		rating
	};
}).handler(rateStore_createServerFn_handler, async ({ data }) => {
	await (await getSql())`update orders set rating = ${data.rating} where id = ${data.id}`;
	const order = await readActive();
	if (!order) throw new Error("Pedido no encontrado");
	return order;
});
var ensureProfile_createServerFn_handler = createServerRpc({
	id: "7b06ed34a184ebd390f0db3b67f6ea42a4ccda57e39b3f6a55ee8f4bb66edfa0",
	name: "ensureProfile",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => ensureProfile.__executeServer(opts));
var ensureProfile = createServerFn({ method: "POST" }).validator((name) => String(name ?? "").trim().slice(0, 80)).middleware([authMiddleware]).handler(ensureProfile_createServerFn_handler, async ({ context, data: displayName }) => {
	const sql = await getSql();
	const existing = await sql`
      select role, credits, display_name from profiles where user_id = ${context.userId}
    `;
	if (existing[0]) {
		if (displayName && displayName !== existing[0].display_name) await sql`update profiles set display_name = ${displayName} where user_id = ${context.userId}`;
		return {
			userId: context.userId,
			displayName: displayName || existing[0].display_name,
			role: existing[0].role,
			credits: Number(existing[0].credits)
		};
	}
	const admins = await sql`
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
		credits: 0
	};
});
var listStores_createServerFn_handler = createServerRpc({
	id: "40e859b7f1b29d5e629678920eb5539629016d5d8f0f2f209528125db343ebea",
	name: "listStores",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => listStores.__executeServer(opts));
var listStores = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listStores_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await (await getSql())`
      select id, name, address, city, phone, photo_url from stores order by id asc
    `).map((row) => ({
		id: Number(row.id),
		name: row.name,
		address: row.address,
		city: row.city,
		phone: row.phone,
		photoUrl: row.photo_url
	}));
});
var addStore_createServerFn_handler = createServerRpc({
	id: "949f4e8d28f54479b24488d1c4802c0206fd8bab8724a04858c122b851eb3235",
	name: "addStore",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => addStore.__executeServer(opts));
var addStore = createServerFn({ method: "POST" }).validator((input) => {
	const name = String(input?.name ?? "").trim().slice(0, 80);
	const address = String(input?.address ?? "").trim().slice(0, 120);
	const city = String(input?.city ?? "").trim().slice(0, 80);
	const phone = String(input?.phone ?? "").trim().slice(0, 40);
	if (name.length < 2 || address.length < 3) throw new Error("Nombre y dirección son obligatorios");
	return {
		name,
		address,
		city,
		phone
	};
}).middleware([authMiddleware]).handler(addStore_createServerFn_handler, async ({ context, data }) => {
	const rows = await (await requireAdmin(context.userId))`
      insert into stores (name, address, city, phone, created_by)
      values (${data.name}, ${data.address}, ${data.city}, ${data.phone}, ${context.userId})
      returning id
    `;
	return { id: Number(rows[0]?.id ?? 0) };
});
var listProfiles_createServerFn_handler = createServerRpc({
	id: "be361aa750c7522f707980706f96780e963f0db9177d59c3db158f219a57afda",
	name: "listProfiles",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => listProfiles.__executeServer(opts));
var listProfiles = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listProfiles_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return (await (await getSql())`
      select user_id, display_name, role, credits from profiles order by created_at asc
    `).map((row) => ({
		userId: row.user_id,
		displayName: row.display_name,
		role: row.role,
		credits: Number(row.credits)
	}));
});
var grantCredits_createServerFn_handler = createServerRpc({
	id: "c6566b486dae1538ef6994a1cffdebb5c826c881135910cbe6e3893dc4baf49e",
	name: "grantCredits",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => grantCredits.__executeServer(opts));
var grantCredits = createServerFn({ method: "POST" }).validator((input) => {
	const userId = String(input?.userId ?? "").trim();
	const amount = Math.round(Number(input?.amount));
	if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 1e6) throw new Error("Indica un monto de créditos válido");
	return {
		userId,
		amount
	};
}).middleware([authMiddleware]).handler(grantCredits_createServerFn_handler, async ({ context, data }) => {
	const updated = await (await requireAdmin(context.userId))`
      update profiles set credits = credits + ${data.amount}
      where user_id = ${data.userId}
      returning credits
    `;
	if (!updated[0]) throw new Error("Ese usuario todavía no ha entrado a la app");
	return { credits: Number(updated[0].credits) };
});
var updateHeadline_createServerFn_handler = createServerRpc({
	id: "9217e5b2fbc7d592d1f88a8fcdaaabb3052f35ea506ceaadc5bad71556b03c40",
	name: "updateHeadline",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => updateHeadline.__executeServer(opts));
var updateHeadline = createServerFn({ method: "POST" }).validator((headline) => {
	const text = String(headline ?? "").trim().slice(0, 80);
	if (!text) throw new Error("Escribe el texto del recuadro");
	return text;
}).middleware([authMiddleware]).handler(updateHeadline_createServerFn_handler, async ({ context, data: headline }) => {
	await (await requireAdmin(context.userId))`
      update orders set headline = ${headline}
      where id = (select id from orders order by id desc limit 1)
    `;
	const order = await readActive();
	if (!order) throw new Error("No hay pedido");
	return order;
});
var assignPickupStore_createServerFn_handler = createServerRpc({
	id: "72108b62322bb219d24fd23c075ecbb9830cb1d38bfedfd8a0d5f11018d1e479",
	name: "assignPickupStore",
	filename: "src/lib/delivery.functions.ts"
}, (opts) => assignPickupStore.__executeServer(opts));
var assignPickupStore = createServerFn({ method: "POST" }).validator((storeId) => {
	const id = Number(storeId);
	if (!Number.isFinite(id)) throw new Error("Tienda inválida");
	return id;
}).middleware([authMiddleware]).handler(assignPickupStore_createServerFn_handler, async ({ context, data: storeId }) => {
	const sql = await requireAdmin(context.userId);
	if (!(await sql`select id from stores where id = ${storeId}`)[0]) throw new Error("Tienda no encontrada");
	await sql`
      update orders set store_id = ${storeId}
      where id = (select id from orders order by id desc limit 1)
    `;
	const order = await readActive();
	if (!order) throw new Error("No hay pedido");
	return order;
});
//#endregion
export { addStore_createServerFn_handler, assignPickupStore_createServerFn_handler, ensureProfile_createServerFn_handler, getActiveOrder_createServerFn_handler, grantCredits_createServerFn_handler, listProfiles_createServerFn_handler, listStores_createServerFn_handler, rateStore_createServerFn_handler, setOrderStatus_createServerFn_handler, updateHeadline_createServerFn_handler };
