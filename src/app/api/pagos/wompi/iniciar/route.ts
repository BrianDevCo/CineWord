import { NextRequest, NextResponse } from "next/server";
import { getFuncionById } from "@/lib/db";
import { crearOrden, type AsientoOrden, type ScoreOrden } from "@/lib/ordenes";
import { firmaIntegridad, nuevaReferencia, wompiPublicKey, wompiReady } from "@/lib/wompi";
import { esId, validarUbicaciones, MAX_SILLAS } from "@/lib/score-validacion";
import { asegurarClienteScore } from "@/lib/score-cliente";
import { errorInterno, isValidEmail, rateLimit, requireUser, sanitizeStr } from "@/lib/seguridad";

// Tiempo para completar el pago (PSE / Nequi / Bancolombia pueden tardar más que una tarjeta)
const MINUTOS_PAGO = 10;

// POST /api/pagos/wompi/iniciar — guarda la orden pendiente y devuelve los datos firmados del widget
export async function POST(req: NextRequest) {
  const limitado = rateLimit(req, "wompi-iniciar", 10, 10 * 60_000);
  if (limitado) return limitado;

  const { user, error: authError } = await requireUser();
  if (authError) return authError;

  try {
    if (!wompiReady()) {
      return NextResponse.json({ error: "Pasarela de pago no configurada" }, { status: 503 });
    }

    const body = await req.json();
    const {
      funcion_id, email, nombre, telefono, asientos, total,
      score_secuencia, score_ubicaciones, score_descripcion,
    } = body;

    if (!funcion_id || typeof funcion_id !== "number") {
      return NextResponse.json({ error: "funcion_id inválido" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "email inválido" }, { status: 400 });
    }
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json({ error: "nombre inválido" }, { status: 400 });
    }
    if (!Array.isArray(asientos) || asientos.length === 0 || asientos.length > MAX_SILLAS
        || !asientos.every((a) => a && /^[A-Z]{1,2}$/i.test(String(a.fila)) && Number.isInteger(Number(a.columna)))) {
      return NextResponse.json({ error: "asientos inválidos" }, { status: 400 });
    }
    if (typeof total !== "number" || !Number.isInteger(total) || total <= 0 || total > 10_000_000) {
      return NextResponse.json({ error: "total inválido" }, { status: 400 });
    }

    // Verificar que el monto no sea menor al precio real de la BD
    const funcion = await getFuncionById(funcion_id);
    if (!funcion) {
      return NextResponse.json({ error: "Función no encontrada" }, { status: 404 });
    }
    const expectedTotal = (asientos as { tipo?: string }[]).reduce((sum, a) =>
      sum + (a.tipo === "vip" ? funcion.precio_vip : funcion.precio_regular), 0);
    if (total < expectedTotal * 0.99) {
      return NextResponse.json({ error: "El monto no corresponde al precio de los boletos" }, { status: 400 });
    }

    const asientosOrden: AsientoOrden[] = (asientos as AsientoOrden[]).map(a => ({
      fila: String(a.fila).toUpperCase(),
      columna: Number(a.columna),
      tipo: a.tipo === "vip" ? "vip" : "regular",
      ...(a.columnaLabel !== undefined && { columnaLabel: Number(a.columnaLabel) }),
    }));

    // Datos de la función en Score: se toman de la BD, no del navegador
    const score: ScoreOrden | null = funcion.score_sala_id
      ? {
          fecha:       funcion.fecha,
          sala:        String(funcion.score_sala_id),
          hora:        funcion.hora,
          pelicula:    funcion.score_pelicula_id ? String(funcion.score_pelicula_id) : undefined,
          secuencia:   esId(score_secuencia) ? String(score_secuencia) : undefined,
          ubicaciones: Array.isArray(score_ubicaciones) && validarUbicaciones(score_ubicaciones)
            ? (score_ubicaciones as { fila: string; columna: unknown; filRelativa?: unknown; colRelativa?: unknown; tarifa: unknown }[]).map(u => ({
                fila:        String(u.fila).toUpperCase(),
                columna:     String(u.columna),
                filRelativa: String(u.filRelativa ?? u.fila).toUpperCase().slice(0, 2),
                colRelativa: String(u.colRelativa ?? u.columna).replace(/\D/g, "").slice(0, 3),
                tarifa:      String(u.tarifa),
              }))
            : undefined,
          descripcion: sanitizeStr(score_descripcion),
        }
      : null;

    const referencia = nuevaReferencia();
    const expirationTime = new Date(Date.now() + MINUTOS_PAGO * 60 * 1000).toISOString();
    const amountInCents = total * 100;

    await crearOrden({
      referencia,
      funcion_id,
      email: sanitizeStr(email),
      nombre: sanitizeStr(nombre),
      telefono: sanitizeStr(telefono ?? "") || null,
      asientos: asientosOrden,
      total,
      score,
      expires_at: expirationTime,
    });

    // Registrar al cliente en Score (una sola vez, no bloquea el pago)
    await asegurarClienteScore(user);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

    return NextResponse.json({
      publicKey: wompiPublicKey(),
      currency: "COP",
      amountInCents,
      reference: referencia,
      signature: firmaIntegridad(referencia, amountInCents, expirationTime),
      expirationTime,
      redirectUrl: `${baseUrl}/pago/resultado`,
    });
  } catch (err) {
    return errorInterno("Error iniciando pago Wompi", err);
  }
}
