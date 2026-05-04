import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { crearReserva, getFuncionById } from "@/lib/db";
import { enviarEmailBoleto } from "@/lib/email";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

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
    const { payment_id, funcion_id, email, nombre, telefono, asientos, total } = body;

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

    // Verificar el pago con MercadoPago (wallet ya fue procesado internamente por MP)
    if (payment_id !== "wallet_purchase") {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: payment_id });
      if (!paymentData || paymentData.status !== "approved") {
        return NextResponse.json({ error: "Pago no aprobado" }, { status: 400 });
      }
    }

    // Crear la reserva en Supabase
    const reserva = await crearReserva({
      funcion_id,
      email: emailSafe,
      nombre: nombreSafe,
      telefono: sanitizeStr(telefono ?? ""),
      asientos,
      total,
    });

    // Enviar email con QR (no bloqueante — si falla no cancela la reserva)
    try {
      const funcion = await getFuncionById(funcion_id);
      if (funcion) {
        const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const [, mes, dia] = funcion.fecha.split("-");
        const fechaLabel = `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`;

        const [h] = funcion.hora.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const horaLabel = `${h12}:${funcion.hora.split(":")[1]} ${ampm}`;

        await enviarEmailBoleto({
          to: emailSafe,
          nombre: nombreSafe,
          pelicula: funcion.pelicula?.titulo ?? "Película",
          fecha: fechaLabel,
          hora: horaLabel,
          formato: funcion.formato,
          asientos: asientos.map((a: { fila: string; columna: number }) => `${a.fila}${a.columna}`),
          total,
          qr_token: reserva.qr_token ?? "demo",
        });
      }
    } catch (emailErr) {
      console.error("Error enviando email (reserva guardada igualmente):", emailErr);
    }

    return NextResponse.json({ ok: true, reserva_id: reserva.id, qr_token: reserva.qr_token });
  } catch (err) {
    console.error("Error confirmando pago:", err);
    return NextResponse.json({ error: "Error al confirmar el pago" }, { status: 500 });
  }
}
