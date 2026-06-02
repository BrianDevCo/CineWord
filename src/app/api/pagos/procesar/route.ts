import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { randomUUID } from "crypto";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    // Whitelist explícita — nunca pasar el body completo a MP
    const {
      token, payment_method_id, installments, issuer_id,
      transaction_amount, payer,
    } = body as {
      token?: string;
      payment_method_id?: string;
      installments?: number;
      issuer_id?: string;
      transaction_amount?: number;
      payer?: unknown;
    };

    if (!token || !payment_method_id || !transaction_amount || transaction_amount <= 0) {
      return NextResponse.json({ error: "Datos de pago incompletos" }, { status: 400 });
    }

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        token,
        payment_method_id,
        installments: installments ?? 1,
        issuer_id,
        transaction_amount,
        payer,
        description: "Boleto CINEWORLD",
        statement_descriptor: "CINEWORLD",
      },
      requestOptions: { idempotencyKey: randomUUID() },
    });

    return NextResponse.json({ id: result.id, status: result.status });
  } catch (err) {
    console.error("Error procesando pago MP:", String(err));
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}
