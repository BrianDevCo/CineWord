import { NextResponse } from "next/server";
import { scoreGetMediosPago } from "@/lib/score";

// GET /api/score/medios-pago — diagnóstico de medios de pago Score
export async function GET() {
  if (!process.env.SCORE_BASE_URL) {
    return NextResponse.json({ error: "SCORE_BASE_URL no configurado" }, { status: 500 });
  }
  try {
    const medios = await scoreGetMediosPago();
    return NextResponse.json({ ok: true, medios });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
