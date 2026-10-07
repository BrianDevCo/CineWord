import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";
import { getContenido, validarCombos, validarTarifas } from "@/lib/contenido";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await getContenido());
}

// PUT { tarifas?: Tarifa[], combos?: Combo[] }
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const body = await req.json();
  const filas: { clave: string; valor: unknown; updated_at: string }[] = [];
  const ahora = new Date().toISOString();

  if (body.tarifas !== undefined) {
    const tarifas = validarTarifas(body.tarifas);
    if (!tarifas) return NextResponse.json({ error: "Tarifas inválidas: revisa días, textos y precios" }, { status: 400 });
    filas.push({ clave: "tarifas", valor: tarifas, updated_at: ahora });
  }
  if (body.combos !== undefined) {
    const combos = validarCombos(body.combos);
    if (!combos) return NextResponse.json({ error: "Combos inválidos: revisa nombres, imágenes y precios" }, { status: 400 });
    filas.push({ clave: "combos", valor: combos, updated_at: ahora });
  }
  if (!filas.length) return NextResponse.json({ error: "Nada para guardar" }, { status: 400 });

  const { error: dbError } = await createAdminClient().from("contenido").upsert(filas);
  if (dbError) {
    console.error("Error guardando contenido:", dbError);
    return NextResponse.json({ error: "No se pudo guardar. ¿Ejecutaste supabase/migration_contenido.sql?" }, { status: 500 });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
