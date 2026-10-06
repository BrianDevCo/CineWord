import { NextRequest, NextResponse } from "next/server";
import { scoreGetOcupacion, toScoreFecha, toScoreHora } from "@/lib/score";
import { esFecha, esHora, esId } from "@/lib/score-validacion";
import { errorInterno, rateLimit } from "@/lib/seguridad";

// POST /api/score/asientos  — SCOESG: ocupación real por función
// Body: { fechaFuncion: "YYYY-MM-DD", sala, funcion: "HH:MM:SS" }
// Responde: { ok: true, ocupacion: { "K3": "S", "K4": "B", ... } }
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "score-asientos", 60, 60_000);
  if (limitado) return limitado;

  try {
    const { fechaFuncion, sala, funcion } = await req.json();

    if (!esFecha(fechaFuncion) || !esId(sala) || !esHora(funcion)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const ocupacion = await scoreGetOcupacion({
      fechaFuncion: toScoreFecha(fechaFuncion),
      sala:         String(sala),
      funcion:      toScoreHora(funcion),
    });

    return NextResponse.json({ ok: true, ocupacion });
  } catch (err) {
    return errorInterno("Score asientos", err, 502);
  }
}
