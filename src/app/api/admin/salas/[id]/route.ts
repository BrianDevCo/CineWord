import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { id } = await params;
  const body = await req.json();
  const db = createAdminClient();

  const filas_vip = Array.isArray(body.filas_vip)
    ? body.filas_vip
    : String(body.filas_vip ?? "").split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);

  const { data, error: dbError } = await db
    .from("salas")
    .update({
      nombre: body.nombre,
      tipo: body.tipo,
      filas: Number(body.filas),
      columnas: Number(body.columnas),
      filas_vip,
      activa: body.activa,
    })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}
