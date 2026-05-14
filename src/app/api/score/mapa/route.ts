import { NextRequest, NextResponse } from "next/server";
import { scoreGetMapa, toScoreFecha, toScoreHora } from "@/lib/score";

// POST /api/score/mapa
// Body: { sala, fechaFuncion: "YYYY-MM-DD", funcion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  try {
    const { sala, fechaFuncion, funcion } = await req.json();

    if (!sala || !fechaFuncion || !funcion) {
      return NextResponse.json(
        { error: "Faltan campos: sala, fechaFuncion, funcion" },
        { status: 400 },
      );
    }

    const result = await scoreGetMapa({
      sala:         String(sala),
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      funcion:      funcion.includes(":") ? toScoreHora(funcion) : funcion,
    });

    return NextResponse.json({ ok: true, asientos: result.asientos, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
