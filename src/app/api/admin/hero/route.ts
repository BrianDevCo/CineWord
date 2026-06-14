import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

// PUT { ids_cartelera: number[], ids_proximos: number[] }
// Máx 2 por categoría. Desactiva en_hero de todos y activa solo los seleccionados.
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const body = await req.json();
  const ids_cartelera: number[] = (body.ids_cartelera ?? []).slice(0, 2);
  const ids_proximos: number[] = (body.ids_proximos ?? []).slice(0, 2);
  const ids_activos = [...ids_cartelera, ...ids_proximos];

  const db = createAdminClient();

  // Desactiva en_hero de todas
  const { error: resetError } = await db
    .from("peliculas")
    .update({ en_hero: false })
    .neq("id", 0);

  if (resetError) return NextResponse.json({ error: resetError.message }, { status: 500 });

  // Activa las seleccionadas
  if (ids_activos.length > 0) {
    const { error: setError } = await db
      .from("peliculas")
      .update({ en_hero: true })
      .in("id", ids_activos);

    if (setError) return NextResponse.json({ error: setError.message }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const db = createAdminClient();
  const { data, error: dbError } = await db
    .from("peliculas")
    .select("id, titulo, poster_url, backdrop_url, estado, badge, badge_color, en_hero, activa, orden, fecha_estreno")
    .eq("activa", true)
    .in("estado", ["en_cartelera", "proximo"])
    .order("estado")
    .order("orden");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
