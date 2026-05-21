import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { email, pelicula_id } = await req.json();

  if (!email || !pelicula_id) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Evitar duplicados del mismo email + película
  const { error } = await supabase
    .from("notificaciones_estreno")
    .upsert({ email: email.toLowerCase().trim(), pelicula_id }, { onConflict: "email,pelicula_id" });

  if (error) {
    console.error("Error notificación:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
