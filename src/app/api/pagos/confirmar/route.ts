import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { crearReserva, getFuncionById } from "@/lib/db";
import { enviarEmailBoleto } from "@/lib/email";
import { scoreVenta, scoreGetSecuencia, toScoreHora, toScoreInicio, splitNombre, type AsientoScore } from "@/lib/score";
import type { ScoreQRParams } from "@/lib/email";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const puntoVentaScore = process.env.SCORE_PUNTO_VENTA ?? "77";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeStr(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/[<>"'`]/g, "").trim().slice(0, 200);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      payment_id, funcion_id, email, nombre, telefono, asientos, total,
      // Campos Score (opcionales — solo si el cine tiene Score configurado)
      score_fecha, score_sala, score_hora, score_pelicula, score_secuencia,
      score_ubicaciones, score_descripcion,
    } = body;

    // Validar campos requeridos
    if (!payment_id || typeof payment_id !== "string") {
      return NextResponse.json({ error: "payment_id inválido" }, { status: 400 });
    }
    if (!funcion_id || typeof funcion_id !== "number") {
      return NextResponse.json({ error: "funcion_id inválido" }, { status: 400 });
    }
    if (!email || !isValidEmail(String(email))) {
      return NextResponse.json({ error: "email inválido" }, { status: 400 });
    }
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json({ error: "nombre inválido" }, { status: 400 });
    }
    if (!Array.isArray(asientos) || asientos.length === 0 || asientos.length > 20) {
      return NextResponse.json({ error: "asientos inválidos" }, { status: 400 });
    }
    if (typeof total !== "number" || total <= 0 || total > 10_000_000) {
      return NextResponse.json({ error: "total inválido" }, { status: 400 });
    }

    const nombreSafe = sanitizeStr(nombre);
    const emailSafe = sanitizeStr(email);

    // Verificar el pago con MercadoPago — sin excepciones
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: payment_id });
    if (!paymentData || paymentData.status !== "approved") {
      return NextResponse.json({ error: "Pago no aprobado" }, { status: 400 });
    }

    // Verificar que el monto pagado coincide con el precio real de la BD
    const funcion = await getFuncionById(funcion_id);
    if (!funcion) {
      return NextResponse.json({ error: "Función no encontrada" }, { status: 404 });
    }
    const expectedTotal = (asientos as { tipo?: string }[]).reduce((sum, a) =>
      sum + (a.tipo === "vip" ? funcion.precio_vip : funcion.precio_regular), 0);
    const montoMP = paymentData.transaction_amount ?? 0;
    if (montoMP < expectedTotal * 0.99) {
      console.error(`Monto insuficiente: pagó ${montoMP}, esperado ${expectedTotal}`);
      return NextResponse.json({ error: "El monto pagado no corresponde al precio de los boletos" }, { status: 400 });
    }

    // Registrar venta en Score (no bloqueante — si falla no cancela la reserva)
    let scoreSecuencia: string | undefined;
    let scoreRespuesta: string | undefined;
    if (process.env.SCORE_BASE_URL && score_sala && score_pelicula && score_ubicaciones?.length) {
      try {
        const secuencia = score_secuencia ?? (await scoreGetSecuencia()).secuencia;
        const { nombre: pNombre, apellido: pApellido } = splitNombre(nombre);
        const scoreResult = await scoreVenta({
          puntoVenta:    String(puntoVentaScore),
          factura:       secuencia,
          correoCliente: emailSafe,
          nombre:        pNombre,
          apellido:      pApellido,
          telefono:      sanitizeStr(telefono ?? ""),
          sala:          String(score_sala),
          fechaFun:      score_fecha,               // ya está en "yyyy-MM-dd"
          funcion:       toScoreHora(score_hora),   // "21"
          inicioFun:     toScoreInicio(score_hora), // "2130"
          pelicula:      String(score_pelicula),
          ubicaciones:   score_ubicaciones as AsientoScore[],
          totalVenta:    expectedTotal,
          pagoInterno:   expectedTotal,             // MercadoPago = cobrado externamente
        });
        scoreSecuencia = secuencia;
        scoreRespuesta = scoreResult.raw;
        console.log("Score SCOINT V respuesta:", scoreResult.raw);
      } catch (scoreErr) {
        scoreRespuesta = `ERROR: ${String(scoreErr)}`;
        console.error("Score venta fallida (reserva guardada igualmente):", scoreErr);
      }
    }

    // Crear la reserva en Supabase — usar el total real de la BD, no el del cliente
    const reserva = await crearReserva({
      funcion_id,
      email: emailSafe,
      nombre: nombreSafe,
      telefono: sanitizeStr(telefono ?? ""),
      asientos,
      total: expectedTotal,
    });

    // Enviar email con QR (no bloqueante — si falla no cancela la reserva)
    try {
      if (funcion) { // funcion ya fue obtenida arriba para verificar precio
        const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const [, mes, dia] = funcion.fecha.split("-");
        const fechaLabel = `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`;

        const [h] = funcion.hora.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const horaLabel = `${h12}:${funcion.hora.split(":")[1]} ${ampm}`;

        // Construir datos QR Score si hay secuencia y sala disponibles
        const scoreQR: ScoreQRParams | undefined =
          score_secuencia && score_sala && score_fecha && score_hora
            ? {
                puntoVenta: process.env.SCORE_PUNTO_VENTA ?? "77",
                teatro:     process.env.SCORE_TEATRO      ?? "2",
                secuencia:  String(score_secuencia),
                fecha:      score_fecha,
                sala:       String(score_sala),
                hora:       score_hora,
                asientos:   asientos.map((a: { fila: string; columna: number; columnaLabel?: number }) => ({
                  fila:             a.fila,
                  columnaRelativa:  a.columnaLabel ?? a.columna,
                })),
              }
            : undefined;

        await enviarEmailBoleto({
          to:       emailSafe,
          nombre:   nombreSafe,
          pelicula: funcion.pelicula?.titulo ?? "Película",
          fecha:    fechaLabel,
          hora:     horaLabel,
          formato:  funcion.formato,
          asientos: asientos.map((a: { fila: string; columna: number; columnaLabel?: number }) =>
            `${a.fila}${a.columnaLabel ?? a.columna}`),
          total,
          qr_token: reserva.qr_token ?? "demo",
          scoreQR,
        });
      }
    } catch (emailErr) {
      console.error("Error enviando email (reserva guardada igualmente):", emailErr);
    }

    return NextResponse.json({ ok: true, reserva_id: reserva.id, qr_token: reserva.qr_token, score_secuencia: scoreSecuencia ?? null, score_respuesta: scoreRespuesta ?? null });
  } catch (err) {
    console.error("Error confirmando pago:", err);
    return NextResponse.json({ error: "Error al confirmar el pago" }, { status: 500 });
  }
}
