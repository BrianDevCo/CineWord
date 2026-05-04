import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, asientos, total, email, nombre, funcion_id } = body;

    const preference = new Preference(client);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost");

    const result = await preference.create({
      body: {
        items: [
          {
            id: String(funcion_id),
            title: `${titulo} — ${asientos.join(", ")}`,
            quantity: 1,
            unit_price: total,
            currency_id: "COP",
          },
        ],
        payer: {
          name: nombre,
          email: email,
        },
        back_urls: {
          success: `${baseUrl}/pago/exito`,
          failure: `${baseUrl}/pago/fallo`,
          pending: `${baseUrl}/pago/pendiente`,
        },
        ...(!isLocalhost && { auto_return: "approved" as const }),
        ...(!isLocalhost && { notification_url: `${baseUrl}/api/pagos/webhook` }),
        external_reference: String(funcion_id),
        expires: true,
        expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    return NextResponse.json({ preference_id: result.id });
  } catch (err) {
    console.error("Error creando preferencia MP:", err);
    return NextResponse.json({ error: "No se pudo crear la preferencia de pago" }, { status: 500 });
  }
}
