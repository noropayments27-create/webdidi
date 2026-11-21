alter table outings add column if not exists request_key text;
alter table outings add column if not exists order_id integer references orders(id);
create unique index if not exists outings_user_request_key_uidx
  on outings(user_id, request_key);
create unique index if not exists outings_user_order_uidx
  on outings(user_id, order_id);
