import { NextRequest, NextResponse } from "next/server";
import { scoreGetAsientosConMapa, toScoreFecha, toScoreHora } from "@/lib/score";

// POST /api/score/asientos  — SCOEST: disponibilidad por función
// Body: { fechaFuncion: "YYYY-MM-DD", sala, funcion: "HH:MM:SS" }
export async function POST(req: NextRequest) {
  try {
    const { fechaFuncion, sala, funcion, correo } = await req.json();

    if (!fechaFuncion || !sala || !funcion || !correo) {
      return NextResponse.json(
        { error: "Faltan campos: fechaFuncion, sala, funcion, correo" },
        { status: 400 },
      );
    }

    const result = await scoreGetAsientosConMapa({
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      sala:         String(sala),
      funcion:      funcion.includes(":") ? toScoreHora(funcion) : funcion,
      correo:       String(correo),
    });

    return NextResponse.json({ ok: true, raw: result.raw, asientos: result.asientos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
