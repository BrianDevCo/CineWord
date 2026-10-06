import { NextRequest, NextResponse } from "next/server";
import { verificarEvento, type WompiEvento } from "@/lib/wompi";
import { procesarTransaccion } from "@/lib/ordenes";

// POST /api/pagos/wompi/webhook — URL de eventos configurada en el panel de comercios de Wompi
export async function POST(req: NextRequest) {
  let evento: WompiEvento;
  try {
    evento = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!verificarEvento(evento)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (evento.event !== "transaction.updated" || !evento.data.transaction) {
    return NextResponse.json({ ok: true });
  }

  try {
    await procesarTransaccion(evento.data.transaction);
  } catch (err) {
    console.error("Error procesando evento Wompi:", err);
    // 500 → Wompi reintenta (30 min, 3 h, 24 h). procesarTransaccion es idempotente.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
