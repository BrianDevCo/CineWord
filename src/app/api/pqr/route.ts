import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { enviarEmailPQR } from "@/lib/email";
import { errorInterno, isValidEmail, rateLimit } from "@/lib/seguridad";

const TIPOS = ["peticion", "queja", "reclamo"] as const;
const ETIQUETA: Record<(typeof TIPOS)[number], string> = { peticion: "Petición", queja: "Queja", reclamo: "Reclamo" };

// POST /api/pqr — radica una petición, queja o reclamo (Ley 1480 de 2011)
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "pqr", 5, 60 * 60_000);
  if (limitado) return limitado;

  let body: { tipo?: unknown; nombre?: unknown; email?: unknown; mensaje?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const tipo = TIPOS.find((t) => t === body.tipo);
  const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 100) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 2000) : "";

  if (!tipo || nombre.length < 2 || !isValidEmail(email) || mensaje.length < 10) {
    return NextResponse.json({ error: "Revisa los datos del formulario" }, { status: 400 });
  }

  const fecha = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).replace(/-/g, "");
  const radicado = `PQR-${fecha}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const { error } = await createAdminClient().from("pqr").insert({ radicado, tipo, nombre, email, mensaje });
  if (error) return errorInterno("Error guardando PQR", error);

  try {
    await enviarEmailPQR({ radicado, tipo: ETIQUETA[tipo], nombre, email, mensaje });
  } catch (err) {
    // La PQR ya quedó guardada; el correo es secundario
    console.error(`PQR ${radicado}: error enviando correo`, err);
  }

  return NextResponse.json({ ok: true, radicado });
}
