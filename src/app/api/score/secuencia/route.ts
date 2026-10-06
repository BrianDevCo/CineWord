import { NextRequest, NextResponse } from "next/server";
import { scoreGetSecuencia } from "@/lib/score";
import { errorInterno, rateLimit, requireUser } from "@/lib/seguridad";

// GET /api/score/secuencia — requiere sesión (se usa justo antes del hold de sillas)
export async function GET(req: NextRequest) {
  const limitado = rateLimit(req, "score-secuencia", 10, 60_000);
  if (limitado) return limitado;

  const { error } = await requireUser();
  if (error) return error;

  try {
    const { secuencia } = await scoreGetSecuencia();
    return NextResponse.json({ secuencia });
  } catch (err) {
    return errorInterno("Score secuencia", err, 502);
  }
}
