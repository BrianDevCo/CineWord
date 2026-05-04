import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const db = createAdminClient();
  const { data, error: dbError } = await db
    .from("peliculas")
    .select("*")
    .order("orden")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

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
    .insert({
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
      badge: body.badge || "EN CARTELERA",
      badge_color: body.badge_color || "bg-emerald-600",
      trailer_search: body.trailer_search || null,
      estado: body.estado || "en_cartelera",
      fecha_estreno: body.fecha_estreno || null,
      activa: body.activa ?? true,
      orden: body.orden ?? 0,
      accent_color: body.accent_color || "#CC1244",
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
