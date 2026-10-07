-- Ejecutar en Supabase SQL Editor (después de migration_seguridad.sql)

-- 1. Contenido editable desde el admin (precios de boletería, combos).
--    Si la tabla está vacía el sitio usa los valores por defecto del código.
create table if not exists contenido (
  clave       text primary key,
  valor       jsonb not null,
  updated_at  timestamptz default now()
);
alter table contenido enable row level security;
drop policy if exists "contenido_read" on contenido;
create policy "contenido_read" on contenido for select using (true);

-- 2. Suscriptores del boletín (formulario "Novedades" del footer).
--    Solo el servidor escribe y lee (service_role).
create table if not exists suscriptores (
  id          bigserial primary key,
  email       text not null unique,
  created_at  timestamptz default now()
);
alter table suscriptores enable row level security;
