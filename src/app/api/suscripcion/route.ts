import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { errorInterno, isValidEmail, rateLimit } from "@/lib/seguridad";

// POST /api/suscripcion — boletín de cartelera y promociones (footer)
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "suscripcion", 5, 60 * 60_000);
  if (limitado) return limitado;

  let body: { email?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Datos inválidos" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Correo inválido" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("suscriptores")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

  if (error) return errorInterno("Error guardando suscriptor", error);
  return NextResponse.json({ ok: true });
}
