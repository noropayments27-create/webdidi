alter table profiles
  add column if not exists is_blocked boolean not null default false;

create index if not exists profiles_is_blocked_idx on profiles (is_blocked);
