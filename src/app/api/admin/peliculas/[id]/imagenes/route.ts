import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";
import { esImagenTmdb, tmdbBackdrops, tmdbSearch } from "@/lib/tmdb";
import { tieneColumnasHero } from "@/lib/columnas-hero";

const SIN_MIGRACION = "Falta ejecutar supabase/migration_hero_imagenes.sql en Supabase";

// GET — fondos disponibles en TMDB y los 2 elegidos para el hero
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const db = createAdminClient();
  if (!(await tieneColumnasHero(db))) return NextResponse.json({ error: SIN_MIGRACION }, { status: 409 });

  const { id } = await params;
  const { data: peli } = await db.from("peliculas").select("id, titulo, tmdb_id, hero_imagenes, backdrop_url").eq("id", id).maybeSingle();
  if (!peli) return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });

  try {
    let tmdbId: number | null = peli.tmdb_id;
    if (!tmdbId) {
      tmdbId = await tmdbSearch(peli.titulo);
      if (tmdbId) await db.from("peliculas").update({ tmdb_id: tmdbId }).eq("id", peli.id);
    }
    if (!tmdbId) {
      return NextResponse.json({ error: "No encontré esta película en TMDB. Revisa el título o usa el botón de TMDB con su ID." }, { status: 404 });
    }

    const opciones = await tmdbBackdrops(tmdbId);
    return NextResponse.json({ tmdb_id: tmdbId, seleccionadas: peli.hero_imagenes ?? [], opciones });
  } catch (err) {
    console.error("Error cargando imágenes TMDB:", err);
    return NextResponse.json({ error: "No se pudieron cargar las imágenes de TMDB" }, { status: 502 });
  }
}

// PUT { hero_imagenes: string[] } — máximo 2, solo URLs de TMDB
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const db = createAdminClient();
  if (!(await tieneColumnasHero(db))) return NextResponse.json({ error: SIN_MIGRACION }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const imagenes = (body as { hero_imagenes?: unknown }).hero_imagenes;
  if (!Array.isArray(imagenes) || imagenes.length > 2 || !imagenes.every(esImagenTmdb)) {
    return NextResponse.json({ error: "Elige máximo 2 imágenes de la galería" }, { status: 400 });
  }

  const { id } = await params;
  const { error: dbError } = await db.from("peliculas").update({ hero_imagenes: imagenes }).eq("id", id);
  if (dbError) {
    console.error("Error guardando imágenes del hero:", dbError);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
