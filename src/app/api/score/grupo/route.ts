import { NextRequest, NextResponse } from "next/server";
import { scoreReservar, toScoreFecha, toScoreHora, splitNombre, type AsientoScore } from "@/lib/score";

// POST /api/score/grupo  — SCOGRU: hold de sillas antes del pago
// Body: { fechaFuncion, sala, horaFuncion, pelicula, secuencia, nombre, telefono?, ubicaciones }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fechaFuncion, sala, horaFuncion, pelicula, secuencia, nombre, telefono, ubicaciones } = body;

    if (!fechaFuncion || !sala || !horaFuncion || !pelicula || !secuencia || !nombre || !ubicaciones?.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    const { nombre: pNombre, apellido: pApellido } = splitNombre(nombre);

    const result = await scoreReservar({
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      sala:         String(sala),
      horaFuncion:  horaFuncion.includes(":") ? toScoreHora(horaFuncion) : horaFuncion,
      pelicula:     String(pelicula),
      secuencia:    String(secuencia),
      nombre:       pNombre,
      apellido:     pApellido,
      telefono:     String(telefono ?? ""),
      ubicaciones:  ubicaciones as AsientoScore[],
      accion:       "G",
    });

    const exitoso = !result.raw.toLowerCase().includes("error");
    return NextResponse.json({ ok: exitoso, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
