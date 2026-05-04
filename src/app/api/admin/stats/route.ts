import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const db = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const [peliculas, reservasHoy, reservasMes, funciones] = await Promise.all([
    db.from("peliculas").select("id, estado, activa"),
    db.from("reservas").select("id, total, estado").gte("created_at", today),
    db.from("reservas").select("id, total, estado").gte("created_at", monthStart),
    db.from("funciones").select("id").gte("fecha", today).eq("activa", true),
  ]);

  const enCartelera = (peliculas.data ?? []).filter((p) => p.estado === "en_cartelera" && p.activa).length;
  const proximas = (peliculas.data ?? []).filter((p) => p.estado === "proximo" && p.activa).length;
  const reservasHoyPagadas = (reservasHoy.data ?? []).filter((r) => r.estado === "pagado");
  const reservasMesPagadas = (reservasMes.data ?? []).filter((r) => r.estado === "pagado");

  return NextResponse.json({
    enCartelera,
    proximas,
    reservasHoy: reservasHoyPagadas.length,
    ingresoHoy: reservasHoyPagadas.reduce((a, r) => a + r.total, 0),
    reservasMes: reservasMesPagadas.length,
    ingresoMes: reservasMesPagadas.reduce((a, r) => a + r.total, 0),
    funcionesProximas: funciones.data?.length ?? 0,
  });
}
