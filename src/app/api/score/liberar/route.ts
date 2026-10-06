import { NextRequest, NextResponse } from "next/server";
import { scoreLiberarPreventa, toScoreFecha, toScoreHora } from "@/lib/score";
import { esCol, esFecha, esFila, esHora, esId, MAX_SILLAS } from "@/lib/score-validacion";
import { rateLimit, requireUser } from "@/lib/seguridad";

// POST /api/score/liberar — SCOSIL: libera la preventa (hold) silla por silla
// Body: { fechaFuncion: "YYYY-MM-DD", sala, funcion: "HH:MM:SS", asientos: [{ fila, columna }] }
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "score-liberar", 20, 60_000);
  if (limitado) return limitado;

  const { error } = await requireUser();
  if (error) return error;

  let body: { fechaFuncion?: unknown; sala?: unknown; funcion?: unknown; asientos?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { fechaFuncion, sala, funcion, asientos } = body;
  if (!esFecha(fechaFuncion) || !esId(sala) || !esHora(funcion) || !Array.isArray(asientos)
      || asientos.length === 0 || asientos.length > MAX_SILLAS
      || !asientos.every((a) => a && esFila(a.fila) && esCol(a.columna))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const resultados = await Promise.allSettled(
    (asientos as { fila: string; columna: string | number }[]).map((a) =>
      scoreLiberarPreventa({
        fechaFuncion: toScoreFecha(fechaFuncion),
        sala:         String(sala),
        funcion:      toScoreHora(funcion),
        fila:         a.fila.toUpperCase(),
        columna:      Number(a.columna),
      }),
    ),
  );

  const fallidos = resultados.filter((r) => r.status === "rejected");
  if (fallidos.length) console.error("Score SCOSIL fallos:", fallidos);
  return NextResponse.json({ ok: fallidos.length === 0 });
}
