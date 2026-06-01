import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { tmdbEnrich } from "@/lib/tmdb";

// POST /api/admin/enrich-tmdb
// Body: { pelicula_id?: number }  — si viene id, enriquece solo esa. Si no, enriquece todas las que faltan datos.
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const body = await req.json().catch(() => ({})) as { pelicula_id?: number };

  // Trae películas sin poster o sin sinopsis
  let query = admin
    .from("peliculas")
    .select("id, titulo, poster_url, sinopsis, score_pelicula_id");

  if (body.pelicula_id) {
    query = query.eq("id", body.pelicula_id) as typeof query;
  } else {
    query = query.or("poster_url.is.null,poster_url.eq.,sinopsis.is.null,sinopsis.eq.") as typeof query;
  }

  const { data: peliculas, error: dbErr } = await query;
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  if (!peliculas?.length) return NextResponse.json({ ok: true, mensaje: "No hay películas que enriquecer", enriquecidas: 0 });

  const log: string[] = [];
  let enriquecidas = 0;

  for (const peli of peliculas) {
    try {
      const tmdb = await tmdbEnrich(peli.titulo);
      if (!tmdb) {
        log.push(`⚠ "${peli.titulo}" — no encontrada en TMDB`);
        continue;
      }

      const updates: Record<string, unknown> = {};
      if (!peli.poster_url)  updates.poster_url   = tmdb.poster_url;
      if (!peli.sinopsis)    updates.sinopsis      = tmdb.sinopsis;

      // Siempre actualiza estos si TMDB los tiene
      if (tmdb.backdrop_url) updates.backdrop_url  = tmdb.backdrop_url;
      if (tmdb.duracion)     updates.duracion       = tmdb.duracion;
      if (tmdb.director)     updates.director       = tmdb.director;
      if (tmdb.reparto?.length) updates.reparto     = tmdb.reparto;
      if (tmdb.trailer_url)  updates.trailer_url    = tmdb.trailer_url;
      if (tmdb.genero)       updates.genero         = tmdb.genero;
      if (tmdb.clasificacion) updates.clasificacion = tmdb.clasificacion;
      if (tmdb.fecha_estreno) updates.fecha_estreno = tmdb.fecha_estreno;
      if (tmdb.accent_color) updates.accent_color   = tmdb.accent_color;

      await admin.from("peliculas").update(updates as never).eq("id", peli.id);

      enriquecidas++;
      log.push(`✓ "${peli.titulo}" → "${tmdb.titulo}" (TMDB #${tmdb.tmdb_id})`);
    } catch (e) {
      log.push(`❌ "${peli.titulo}" — error: ${String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, enriquecidas, total: peliculas.length, log });
}
