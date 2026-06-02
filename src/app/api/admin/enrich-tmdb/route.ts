import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { tmdbEnrich } from "@/lib/tmdb";

// POST /api/admin/enrich-tmdb
// Body: { pelicula_id?: number, force?: boolean }
// - Sin pelicula_id: enriquece todas las que faltan datos
// - Con pelicula_id: enriquece esa película específica (force=true ignora si ya tiene poster)
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const body = await req.json().catch(() => ({})) as {
    pelicula_id?: number;
    force?: boolean;
    tmdb_id?: number; // ID manual de TMDB para evitar búsqueda automática
  };

  let query = admin
    .from("peliculas")
    .select("id, titulo, poster_url, sinopsis, fecha_estreno, score_pelicula_id");

  if (body.pelicula_id) {
    query = query.eq("id", body.pelicula_id) as typeof query;
  } else {
    query = query.or("poster_url.is.null,poster_url.eq.,sinopsis.is.null,sinopsis.eq.") as typeof query;
  }

  const { data: peliculas, error: dbErr } = await query;
  if (dbErr) return NextResponse.json({ ok: false, log: [`❌ Error BD: ${dbErr.message}`] }, { status: 500 });
  if (!peliculas?.length) return NextResponse.json({ ok: true, log: ["ℹ No se encontró la película en la base de datos"], enriquecidas: 0 });

  const log: string[] = [];
  let enriquecidas = 0;

  for (const peli of peliculas) {
    try {
      // Si viene tmdb_id manual, úsalo directo; si no, busca por título
      const year = peli.fecha_estreno ? new Date(peli.fecha_estreno).getFullYear().toString() : undefined;
      const tmdb = await tmdbEnrich(body.tmdb_id ?? peli.titulo, year);

      if (!tmdb) {
        log.push(`⚠ "${peli.titulo}" — no encontrada en TMDB`);
        continue;
      }

      // Si ya tiene poster y no es force, igual actualiza backdrop/trailer pero no sobreescribe poster
      const updates: Record<string, unknown> = {};
      if (!peli.poster_url || body.force)  updates.poster_url  = tmdb.poster_url;
      if (!peli.sinopsis   || body.force)  updates.sinopsis    = tmdb.sinopsis;
      if (tmdb.backdrop_url)  updates.backdrop_url  = tmdb.backdrop_url;
      if (tmdb.duracion)      updates.duracion       = tmdb.duracion;
      if (tmdb.director)      updates.director       = tmdb.director;
      if (tmdb.reparto?.length) updates.reparto      = tmdb.reparto;
      if (tmdb.trailer_search) updates.trailer_search = tmdb.trailer_search;
      if (tmdb.genero)        updates.genero         = tmdb.genero;
      if (tmdb.clasificacion) updates.clasificacion  = tmdb.clasificacion;
      if (tmdb.fecha_estreno) updates.fecha_estreno  = tmdb.fecha_estreno;
      if (tmdb.accent_color)  updates.accent_color   = tmdb.accent_color;

      const { error: upErr } = await admin.from("peliculas").update(updates as never).eq("id", peli.id);
      if (upErr) {
        log.push(`❌ "${peli.titulo}" — error al guardar: ${upErr.message}`);
        continue;
      }

      enriquecidas++;
      const posterInfo = tmdb.poster_url ? "con poster" : "SIN poster en TMDB";
      log.push(`✓ "${peli.titulo}" → TMDB encontró: "${tmdb.titulo}" (#${tmdb.tmdb_id}) — ${posterInfo}`);
    } catch (e) {
      log.push(`❌ "${peli.titulo}" — error: ${String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, enriquecidas, total: peliculas.length, log });
}
