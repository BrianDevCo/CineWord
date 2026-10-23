-- Ejecutar en Supabase SQL Editor (una sola vez)
-- Cierra permisos públicos que permitían escribir/leer datos con la llave anon
-- del navegador. Todas las escrituras las hace el servidor con service_role,
-- que no se ve afectado por RLS.

-- 1. Nadie puede crear reservas ni ocupar asientos desde el navegador
drop policy if exists "reservas_insert" on reservas;
drop policy if exists "asientos_insert" on asientos_ocupados;
-- El script del POS (CineWord-POS/supabase/schema_pos_migration.sql) abría las
-- reservas de la web a cualquiera: lectura de todos los clientes y edición.
drop policy if exists "reservas_read_by_token" on reservas;
drop policy if exists "reservas_update_usado" on reservas;

-- 2. La lista de correos para avisos de estreno no es pública
drop policy if exists "notificaciones_read"   on notificaciones_estreno;
drop policy if exists "notificaciones_insert" on notificaciones_estreno;
drop policy if exists "insert_notificaciones" on notificaciones_estreno;

-- 3. La ocupación de sillas es pública, pero sin exponer a qué reserva pertenece
revoke select on asientos_ocupados from anon, authenticated;
grant select (id, funcion_id, fila, columna) on asientos_ocupados to anon, authenticated;

-- 4. PQR (peticiones, quejas y reclamos) — Ley 1480 de 2011
create table if not exists pqr (
  id          bigserial primary key,
  radicado    text not null unique,
  tipo        text not null check (tipo in ('peticion', 'queja', 'reclamo')),
  nombre      text not null,
  email       text not null,
  mensaje     text not null,
  estado      text not null default 'abierta' check (estado in ('abierta', 'respondida', 'cerrada')),
  created_at  timestamptz default now()
);
alter table pqr enable row level security;

-- 5. Verificación: debe devolver solo las políticas de lectura de catálogo
-- select tablename, policyname, cmd from pg_policies where schemaname = 'public';
