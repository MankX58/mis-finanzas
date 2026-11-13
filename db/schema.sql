-- Un documento JSON por usuario (movimientos, presupuestos, categorías, tarjeta).
create table if not exists finanzas_state (
  user_id    text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
