import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = 50;

  const db = createAdminClient();
  let query = db
    .from("reservas")
    .select(`
      id, email, nombre, telefono, asientos, total, estado, referencia_pago, created_at,
      funcion:funcion_id (
        fecha, hora, formato,
        pelicula:pelicula_id ( titulo ),
        sala:sala_id ( nombre )
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (estado) query = query.eq("estado", estado);
  if (desde) query = query.gte("created_at", desde);
  if (hasta) query = query.lte("created_at", hasta + "T23:59:59");

  const { data, error: dbError, count } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ data, total: count ?? 0, page, pageSize });
}
