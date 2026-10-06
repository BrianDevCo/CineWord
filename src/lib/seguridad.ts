import { NextResponse, type NextRequest } from "next/server";

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeStr(s: unknown, max = 200): string {
  if (typeof s !== "string") return "";
  return s.replace(/[<>"'`]/g, "").trim().slice(0, max);
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "desconocida";
}

// ── Límite de peticiones en memoria ──────────────────────────────────────────
// Es por instancia del servidor (best effort). Para una protección fuerte usar
// las reglas de rate limiting del Firewall de Vercel.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: NextRequest, nombre: string, limite: number, ventanaMs: number): NextResponse | null {
  const ahora = Date.now();
  const key = `${nombre}:${clientIp(req)}`;
  const b = buckets.get(key);

  if (!b || b.reset < ahora) {
    buckets.set(key, { count: 1, reset: ahora + ventanaMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < ahora) buckets.delete(k);
    }
    return null;
  }

  b.count++;
  if (b.count > limite) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((b.reset - ahora) / 1000)) } },
    );
  }
  return null;
}

/** Respuesta genérica de error: el detalle va al log del servidor, no al navegador */
export function errorInterno(contexto: string, err: unknown, status = 500) {
  console.error(`${contexto}:`, err);
  return NextResponse.json({ error: "Ocurrió un error. Intenta de nuevo." }, { status });
}

/** Para rutas API que requieren sesión iniciada (clientes de la web) */
export async function requireUser() {
  const { getUser } = await import("@/lib/supabase-server");
  const user = await getUser();
  if (!user || !user.email) {
    return { user: null, error: NextResponse.json({ error: "Inicia sesión para continuar" }, { status: 401 }) };
  }
  return { user, error: null };
}
