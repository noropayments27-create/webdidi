create table if not exists outings (
  id bigserial primary key,
  user_id text not null references profiles(user_id) on delete cascade,
  store_id integer not null references stores(id),
  destination text not null,
  notes text not null default '',
  credits_used integer not null check (credits_used in (1, 2)),
  created_at timestamptz not null default now()
);

create index if not exists outings_created_idx on outings(created_at desc);
create index if not exists outings_user_created_idx on outings(user_id, created_at desc);
