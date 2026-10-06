import { NextRequest, NextResponse } from "next/server";
import { scoreReservar, toScoreFecha, toScoreHora, splitNombre } from "@/lib/score";
import { esFecha, esHora, esId, validarUbicaciones } from "@/lib/score-validacion";
import { errorInterno, rateLimit, requireUser, sanitizeStr } from "@/lib/seguridad";

// POST /api/score/grupo  — SCOGRU: hold de sillas antes del pago (requiere sesión)
// Body: { fechaFuncion, sala, horaFuncion, pelicula, inicioFuncion, descripcion, secuencia, nombre, telefono?, ubicaciones }
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "score-grupo", 10, 60_000);
  if (limitado) return limitado;

  const { error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const { fechaFuncion, sala, horaFuncion, pelicula, inicioFuncion, descripcion, secuencia, nombre, telefono } = body;
    const ubicaciones = validarUbicaciones(body.ubicaciones);

    if (!esFecha(fechaFuncion) || !esId(sala) || !esHora(horaFuncion) || !esId(pelicula) || !esId(secuencia)
        || !ubicaciones || (inicioFuncion !== undefined && !/^\d{1,4}$/.test(String(inicioFuncion)))) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const { nombre: pNombre, apellido: pApellido } = splitNombre(sanitizeStr(nombre, 100) || "Cliente");

    const result = await scoreReservar({
      fechaFuncion:  toScoreFecha(fechaFuncion),
      sala:          String(sala),
      horaFuncion:   toScoreHora(horaFuncion),
      pelicula:      String(pelicula),
      inicioFuncion: String(inicioFuncion ?? ""),
      descripcion:   sanitizeStr(descripcion, 100),
      secuencia:     String(secuencia),
      nombre:        pNombre,
      apellido:      pApellido,
      telefono:      String(telefono ?? "").replace(/\D/g, "").slice(0, 15),
      ubicaciones,
      accion:        "G",
    });

    const exitoso = !result.raw.toLowerCase().includes("error");
    if (!exitoso) console.error("Score SCOGRU:", result.raw);
    return NextResponse.json({ ok: exitoso });
  } catch (err) {
    return errorInterno("Score grupo", err, 502);
  }
}
