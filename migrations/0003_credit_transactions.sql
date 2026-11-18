create table if not exists credit_transactions (
  id bigserial primary key,
  user_id text not null references profiles(user_id) on delete cascade,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (
    transaction_type in ('grant', 'purchase', 'spend', 'refund', 'adjustment')
  ),
  reason text not null default '',
  reference_type text,
  reference_id text,
  actor_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on credit_transactions (user_id, created_at desc);

create index if not exists credit_transactions_actor_created_idx
  on credit_transactions (actor_user_id, created_at desc);
