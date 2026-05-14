import { NextRequest, NextResponse } from "next/server";
import { scoreGetPlanes, toScoreFecha, toScoreInicio } from "@/lib/score";

// POST /api/score/planes
// Body: { fechaFuncion: "YYYY-MM-DD", pelicula: "112121", sala: "1", inicioFuncion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fechaFuncion, pelicula, sala, inicioFuncion } = body;

    if (!fechaFuncion || !pelicula || !sala || !inicioFuncion) {
      return NextResponse.json(
        { error: "Faltan campos: fechaFuncion, pelicula, sala, inicioFuncion" },
        { status: 400 },
      );
    }

    const result = await scoreGetPlanes({
      fechaFuncion:   fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      pelicula:       String(pelicula),
      sala:           String(sala),
      inicioFuncion:  inicioFuncion.includes(":") ? toScoreInicio(inicioFuncion) : inicioFuncion,
    });

    return NextResponse.json({ ok: true, planes: result.planes, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
