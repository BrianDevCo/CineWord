import { NextRequest, NextResponse } from "next/server";
import { scoreGetOcupacion, toScoreFecha, toScoreHora } from "@/lib/score";

// POST /api/score/asientos  — SCOESG: ocupación real por función
// Body: { fechaFuncion: "YYYY-MM-DD", sala, funcion: "HH:MM:SS" }
// Responde: { ok: true, ocupacion: { "K3": "S", "K4": "B", ... } }
export async function POST(req: NextRequest) {
  try {
    const { fechaFuncion, sala, funcion } = await req.json();

    if (!fechaFuncion || !sala || !funcion) {
      return NextResponse.json(
        { error: "Faltan campos: fechaFuncion, sala, funcion" },
        { status: 400 },
      );
    }

    const ocupacion = await scoreGetOcupacion({
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      sala:         String(sala),
      funcion:      funcion.includes(":") ? toScoreHora(funcion) : funcion,
    });

    return NextResponse.json({ ok: true, ocupacion });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
