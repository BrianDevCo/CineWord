-- Ejecutar en Supabase SQL Editor
-- Dos imágenes de fondo por película para el hero (se muestran mitad y mitad)
-- y el ID de TMDB para poder consultar su galería de imágenes.

alter table peliculas add column if not exists tmdb_id integer;
alter table peliculas add column if not exists hero_imagenes text[] not null default '{}';
