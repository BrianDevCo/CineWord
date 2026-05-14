import { NextRequest, NextResponse } from "next/server";
import {
  scoreReservar,
  toScoreFecha,
  toScoreHora,
  splitNombre,
  type AsientoScore,
} from "@/lib/score";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fechaFuncion,
      sala,
      horaFuncion,
      pelicula,
      secuencia,   // debe obtenerse antes del pago (de /api/score/reservar)
      nombre,
      apellido,
      telefono,
      ubicaciones,
    } = body;

    if (!fechaFuncion || !sala || !horaFuncion || !pelicula || !secuencia || !nombre || !ubicaciones?.length) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const nombreFinal   = apellido ? nombre : splitNombre(nombre).nombre;
    const apellidoFinal = apellido ?? splitNombre(nombre).apellido;

    const result = await scoreReservar({
      fechaFuncion: fechaFuncion.includes("-") ? toScoreFecha(fechaFuncion) : fechaFuncion,
      sala,
      horaFuncion: horaFuncion.includes(":") ? toScoreHora(horaFuncion) : horaFuncion,
      pelicula,
      secuencia,
      nombre: nombreFinal,
      apellido: apellidoFinal,
      telefono: telefono ?? "",
      ubicaciones: ubicaciones as AsientoScore[],
      accion: "V",
    });

    return NextResponse.json({ ok: true, score: result.kv });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
