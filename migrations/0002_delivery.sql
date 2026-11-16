create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  role text not null default 'courier',
  credits integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id serial primary key,
  name text not null,
  address text not null,
  city text not null default '',
  phone text not null default '',
  photo_url text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id serial primary key,
  store_id integer not null references stores (id),
  code text not null,
  status text not null default 'ready',
  headline text not null,
  status_message text not null,
  items_json text not null,
  total_cop integer not null default 0,
  customer_name text not null default '',
  note text not null default '',
  rating text,
  created_at timestamptz not null default now()
);

insert into stores (name, address, city, phone, photo_url)
select
  'KFC Alitas ( Restrepo )',
  'Calle 18 Sur #19',
  'Bogotá, Colombia',
  '+57 300 555 0148',
  '/media/restrepo.jpg'
where not exists (
  select 1 from stores where name = 'KFC Alitas ( Restrepo )'
);

insert into orders (
  store_id, code, status, headline, status_message, items_json, total_cop, customer_name, note
)
select
  s.id,
  'AL-1842',
  'ready',
  '#Editar acá',
  'La tienda ha confirmado que el pedido está listo para recolectar',
  '[{"name":"Alitas BBQ","qty":8},{"name":"Papa francesa grande","qty":1},{"name":"Gaseosa personal","qty":2}]',
  42900,
  'Mostrador',
  'Pedido para llevar, sin cubiertos'
from stores s
where s.name = 'KFC Alitas ( Restrepo )'
  and not exists (select 1 from orders);
