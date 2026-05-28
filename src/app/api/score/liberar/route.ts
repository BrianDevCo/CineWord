import { NextRequest, NextResponse } from "next/server";
import { scoreLiberarPreventa } from "@/lib/score";

// POST /api/score/liberar — SCOSIL: libera preventa silla por silla
// Body: { fechaFuncion, sala, funcion, fila, columna }
export async function POST(req: NextRequest) {
  try {
    const { fechaFuncion, sala, funcion, fila, columna } = await req.json();
    if (!fechaFuncion || !sala || !funcion || !fila || !columna) {
      return NextResponse.json({ error: "fechaFuncion, sala, funcion, fila y columna son requeridos" }, { status: 400 });
    }
    const result = await scoreLiberarPreventa({
      fechaFuncion: String(fechaFuncion),
      sala:         String(sala),
      funcion:      String(funcion),
      fila:         String(fila),
      columna:      Number(columna),
    });
    return NextResponse.json({ ok: true, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
