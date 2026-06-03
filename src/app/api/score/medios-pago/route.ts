import { NextResponse } from "next/server";
import { scoreGetMediosPago } from "@/lib/score";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET /api/score/medios-pago — requiere sesión admin
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const medios = await scoreGetMediosPago();
    return NextResponse.json({ ok: true, medios });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
