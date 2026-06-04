import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const desde = searchParams.get("desde") ?? hace7dias;
  const peliculaId = searchParams.get("pelicula_id");

  const db = createAdminClient();
  let query = db
    .from("funciones")
    .select("*, pelicula:pelicula_id(titulo), sala:sala_id(nombre, tipo)")
    .gte("fecha", desde)
    .order("fecha")
    .order("hora");

  if (peliculaId) query = query.eq("pelicula_id", peliculaId);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const body = await req.json();
  const db = createAdminClient();

  const { data, error: dbError } = await db
    .from("funciones")
    .insert({
      pelicula_id: Number(body.pelicula_id),
      sala_id: Number(body.sala_id),
      fecha: body.fecha,
      hora: body.hora,
      formato: body.formato,
      precio_regular: Number(body.precio_regular) || 15000,
      precio_vip: Number(body.precio_vip) || 25000,
      activa: true,
    })
    .select("*, pelicula:pelicula_id(titulo), sala:sala_id(nombre)")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
