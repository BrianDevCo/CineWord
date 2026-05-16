import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";

  try {
    const res = await fetch(`${base}/Mobile/ComJson/variable41.xml`, {
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json({ ok: true, status: res.status, base });
  } catch (err) {
    const e = err as Error & { cause?: unknown; code?: string };
    return NextResponse.json({
      base,
      error: e.message,
      code: e.code ?? "",
      cause: String(e.cause ?? ""),
      causeCode: (e.cause as { code?: string })?.code ?? "",
    });
  }
}
