-- Ejecutar en Supabase SQL Editor
-- Órdenes de pago (Wompi): se crean antes de pagar y se confirman por webhook

create table if not exists ordenes_pago (
  id                   bigserial primary key,
  referencia           text not null unique,
  funcion_id           integer not null references funciones(id),
  email                text not null,
  nombre               text not null,
  telefono             text,
  asientos             jsonb not null default '[]',
  total                integer not null,
  score                jsonb,                 -- datos para SCOINT V y QR (sala, pelicula, secuencia, ubicaciones...)
  estado               text not null default 'pendiente'
                       check (estado in ('pendiente', 'procesando', 'pagado', 'rechazado', 'error')),
  wompi_transaction_id text,
  wompi_status         text,
  reserva_id           integer references reservas(id),
  error                text,
  expires_at           timestamptz not null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists idx_ordenes_pago_estado on ordenes_pago(estado, created_at);

-- Solo el servidor (service_role) accede: RLS activo y sin políticas públicas
alter table ordenes_pago enable row level security;
