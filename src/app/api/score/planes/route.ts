import { NextRequest, NextResponse } from "next/server";
import { scoreGetPlanes, toScoreFecha, toScoreInicio } from "@/lib/score";
import { esFecha, esHora, esId } from "@/lib/score-validacion";
import { errorInterno, rateLimit } from "@/lib/seguridad";

// POST /api/score/planes
// Body: { fechaFuncion: "YYYY-MM-DD", pelicula: "112121", sala: "1", inicioFuncion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "score-planes", 60, 60_000);
  if (limitado) return limitado;

  try {
    const { fechaFuncion, pelicula, sala, inicioFuncion } = await req.json();

    if (!esFecha(fechaFuncion) || !esId(pelicula) || !esId(sala) || !esHora(inicioFuncion)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const result = await scoreGetPlanes({
      fechaFuncion:  toScoreFecha(fechaFuncion),
      pelicula:      String(pelicula),
      sala:          String(sala),
      inicioFuncion: toScoreInicio(inicioFuncion),
    });

    return NextResponse.json({ ok: true, planes: result.planes });
  } catch (err) {
    return errorInterno("Score planes", err, 502);
  }
}
