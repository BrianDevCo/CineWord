-- Ejecutar en Supabase SQL Editor
-- Agrega campos Score POS a las tablas

alter table salas add column if not exists score_sala_id text;

alter table peliculas add column if not exists score_pelicula_id text;

alter table funciones add column if not exists score_pelicula_id text;
alter table funciones add column if not exists score_sala_id text;
alter table funciones add column if not exists score_tarifa_regular text;
alter table funciones add column if not exists score_tarifa_vip text;
