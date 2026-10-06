import { NextRequest, NextResponse } from "next/server";
import { scoreGetMapa, toScoreFecha, toScoreHora } from "@/lib/score";
import { esFecha, esHora, esId } from "@/lib/score-validacion";
import { errorInterno, rateLimit } from "@/lib/seguridad";

// POST /api/score/mapa
// Body: { sala, fechaFuncion: "YYYY-MM-DD", funcion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "score-mapa", 60, 60_000);
  if (limitado) return limitado;

  try {
    const { sala, fechaFuncion, funcion } = await req.json();

    if (!esId(sala) || !esFecha(fechaFuncion) || !esHora(funcion)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const result = await scoreGetMapa({
      sala:         String(sala),
      fechaFuncion: toScoreFecha(fechaFuncion),
      funcion:      toScoreHora(funcion),
    });

    return NextResponse.json({ ok: true, asientos: result.asientos });
  } catch (err) {
    return errorInterno("Score mapa", err, 502);
  }
}
