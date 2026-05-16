import { NextResponse } from "next/server";

const PATHS = [
  "/Mobile/ComJson/variable41.xml",
  "/Mobile/ComJson/Cartelera.xml",
  "/Mobile/ComJson/cartelera.xml",
  "/Mobile/ComJson/variable1.xml",
  "/Mobile/ComJson/variable42.xml",
  "/Mobile/",
];

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";

  const results: Record<string, number | string> = { base };

  for (const path of PATHS) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(8000),
      });
      results[path] = res.status;
      // Si encontramos uno que funciona, incluir preview del contenido
      if (res.status === 200) {
        const text = await res.text();
        results[`${path}_preview`] = text.slice(0, 300);
      }
    } catch (err) {
      results[path] = `ERROR: ${(err as Error).message}`;
    }
  }

  return NextResponse.json(results);
}
