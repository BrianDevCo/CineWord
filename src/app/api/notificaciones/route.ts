import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { errorInterno, isValidEmail, rateLimit } from "@/lib/seguridad";

// POST /api/notificaciones — aviso por correo cuando se estrene una película
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "notificaciones", 5, 60 * 60_000);
  if (limitado) return limitado;

  let body: { email?: unknown; pelicula_id?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Datos incompletos" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const peliculaId = Number(body.pelicula_id);

  if (!isValidEmail(email) || !Number.isInteger(peliculaId) || peliculaId <= 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Evitar duplicados del mismo email + película
  const { error } = await createAdminClient()
    .from("notificaciones_estreno")
    .upsert({ email, pelicula_id: peliculaId }, { onConflict: "email,pelicula_id", ignoreDuplicates: true });

  if (error) return errorInterno("Error notificación", error);

  return NextResponse.json({ ok: true });
}
