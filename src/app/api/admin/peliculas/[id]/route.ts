import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { id } = await params;
  const db = createAdminClient();
  const { data, error: dbError } = await db.from("peliculas").select("*").eq("id", id).single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { id } = await params;
  const body = await req.json();
  const db = createAdminClient();

  const reparto = Array.isArray(body.reparto)
    ? body.reparto
    : String(body.reparto ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const filter_genres = Array.isArray(body.filter_genres)
    ? body.filter_genres
    : String(body.filter_genres ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const { data, error: dbError } = await db
    .from("peliculas")
    .update({
      titulo: body.titulo,
      genero: body.genero,
      filter_genres,
      duracion: body.duracion,
      clasificacion: body.clasificacion,
      sinopsis: body.sinopsis || null,
      director: body.director || null,
      reparto,
      poster_url: body.poster_url || null,
      backdrop_url: body.backdrop_url || null,
      badge: body.badge,
      badge_color: body.badge_color,
      trailer_search: body.trailer_search || null,
      estado: body.estado,
      fecha_estreno: body.fecha_estreno || null,
      activa: body.activa,
      orden: body.orden ?? 0,
      accent_color: body.accent_color || "#CC1244",
    })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { id } = await params;
  const db = createAdminClient();
  const { error: dbError } = await db.from("peliculas").update({ activa: false }).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
