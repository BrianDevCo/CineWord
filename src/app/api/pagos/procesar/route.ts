import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { randomUUID } from "crypto";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    console.log("FormData recibido del brick:", JSON.stringify(formData, null, 2));

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        ...formData,
        description: "Boleto CINEWORLD",
        statement_descriptor: "CINEWORLD",
      },
      requestOptions: { idempotencyKey: randomUUID() },
    });

    console.log("Resultado MP:", result.id, result.status);
    return NextResponse.json({ id: result.id, status: result.status });
  } catch (err) {
    const detail = JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2);
    console.error("Error procesando pago MP:", detail);
    return NextResponse.json({ error: "Error al procesar el pago", detail }, { status: 500 });
  }
}
