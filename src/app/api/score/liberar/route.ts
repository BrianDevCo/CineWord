import { NextRequest, NextResponse } from "next/server";
import { scoreLiberarReserva } from "@/lib/score";

// POST /api/score/liberar  — SCOLIR: libera hold/preventa por secuencia
// Body: { secuencia }
export async function POST(req: NextRequest) {
  try {
    const { secuencia } = await req.json();
    if (!secuencia) {
      return NextResponse.json({ error: "secuencia requerida" }, { status: 400 });
    }
    const result = await scoreLiberarReserva(String(secuencia));
    return NextResponse.json({ ok: true, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
