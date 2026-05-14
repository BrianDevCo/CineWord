import { NextRequest, NextResponse } from "next/server";
import { scoreGetAsientos, toScoreFecha, toScoreHora } from "@/lib/score";

// POST /api/score/asientos  — SCOEST: disponibilidad por función
// Body: { fechaFuncion: "YYYY-MM-DD", sala, funcion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  try {
    const { fechaFuncion, sala, funcion } = await req.json();

    if (!fechaFuncion || !sala || !funcion) {
      return NextResponse.json(
        { error: "Faltan campos: fechaFuncion, sala, funcion" },
        { status: 400 },
      );
    }

    const result = await scoreGetAsientos({
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      sala:         String(sala),
      funcion:      funcion.includes(":") ? toScoreHora(funcion) : funcion,
    });

    return NextResponse.json({ ok: true, raw: result.raw, kv: result.kv });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
