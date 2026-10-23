import type { SupabaseClient } from "@supabase/supabase-js";

// Las columnas tmdb_id y hero_imagenes las crea supabase/migration_hero_imagenes.sql.
// Mientras no se ejecute, el sitio sigue funcionando sin guardarlas.
let existen = false;

export async function tieneColumnasHero(db: SupabaseClient): Promise<boolean> {
  if (existen) return true;
  const { error } = await db.from("peliculas").select("tmdb_id, hero_imagenes").limit(1);
  existen = !error;
  return existen;
}
