import { NextRequest, NextResponse } from "next/server";
import {
  scoreGetSecuencia,
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
      fechaFuncion,   // "2025-01-15" o "20250115"
      sala,           // Score sala ID
      horaFuncion,    // "20:30:00" o "20"
      pelicula,       // Score pelicula ID
      nombre,         // nombre completo o solo nombre
      apellido,       // apellido (opcional si nombre es completo)
      telefono,
      ubicaciones,    // AsientoScore[]
    } = body;

    if (!fechaFuncion || !sala || !horaFuncion || !pelicula || !nombre || !ubicaciones?.length) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const { secuencia, recargo } = await scoreGetSecuencia();
    if (!secuencia) {
      return NextResponse.json({ error: "No se pudo obtener secuencia Score" }, { status: 502 });
    }

    const nombreFinal = apellido ? nombre : splitNombre(nombre).nombre;
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
      accion: "R",
    });

    return NextResponse.json({ ok: true, secuencia, recargo, score: result.kv });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
