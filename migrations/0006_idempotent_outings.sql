alter table outings add column if not exists request_key text;
create unique index if not exists outings_user_request_key_uidx
  on outings(user_id, request_key);
