-- Repair deployments where 0006 was already recorded before order_id was added.
alter table outings
  add column if not exists order_id integer references orders(id);

create unique index if not exists outings_user_order_uidx
  on outings(user_id, order_id);

-- Store-wide pickup-screen presentation, editable by authenticated couriers.
alter table stores
  add column if not exists pickup_headline text,
  add column if not exists pickup_status_message text,
  add column if not exists show_qr_code boolean not null default true;
