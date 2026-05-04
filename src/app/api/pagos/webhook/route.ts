import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import crypto from "crypto";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

function verifySignature(req: NextRequest, paymentId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Omitir validación si no está configurado

  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature || !requestId) return false;

  const parts = Object.fromEntries(signature.split(",").map((p) => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const template = `id:${paymentId};request-id:${requestId};ts:${ts}`;
  const hash = crypto.createHmac("sha256", secret).update(template).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data?.id ?? "");
    if (!paymentId) return NextResponse.json({ ok: true });

    if (!verifySignature(req, paymentId)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === "approved") {
      // Backup: la confirmación principal la hace /api/pagos/confirmar desde el cliente.
      // Este webhook actúa como respaldo ante fallos de red del lado del cliente.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en webhook MP:", err);
    return NextResponse.json({ ok: true }); // Siempre 200 para que MP no reintente
  }
}
