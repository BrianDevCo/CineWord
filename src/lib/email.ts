import { Resend } from "resend";
import QRCode from "qrcode";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface TicketEmailData {
  to: string;
  nombre: string;
  pelicula: string;
  fecha: string;
  hora: string;
  formato: string;
  asientos: string[];
  total: number;
  qr_token: string;
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export async function enviarEmailBoleto(data: TicketEmailData) {
  const qrDataUrl = await QRCode.toDataURL(`CINEWORLD-${data.qr_token}`, {
    width: 200,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;">

        <!-- HEADER -->
        <tr><td style="background:#CC1244;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:6px;font-weight:900;">CINEWORLD</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;">CENTRO COMERCIAL MR OUTLET</p>
        </td></tr>

        <!-- HERO -->
        <tr><td style="background:#111;padding:32px;text-align:center;border-left:1px solid #222;border-right:1px solid #222;">
          <div style="width:56px;height:56px;background:rgba(204,18,68,0.15);border:2px solid rgba(204,18,68,0.4);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;">🎟️</div>
          <h2 style="margin:0 0 8px;color:#fff;font-size:22px;letter-spacing:3px;">¡RESERVA CONFIRMADA!</h2>
          <p style="margin:0;color:#666;font-size:14px;">Hola ${data.nombre}, tu boleto está listo.</p>
        </td></tr>

        <!-- TICKET INFO -->
        <tr><td style="background:#111;padding:0 32px 24px;border-left:1px solid #222;border-right:1px solid #222;">
          <table width="100%" style="border-top:1px solid #222;padding-top:20px;">
            ${[
              ["PELÍCULA", data.pelicula],
              ["FECHA", data.fecha],
              ["FUNCIÓN", `${data.hora} — ${data.formato}`],
              ["ASIENTOS", data.asientos.join(", ")],
              ["TOTAL PAGADO", fmt(data.total)],
            ]
              .map(
                ([label, value]) => `
            <tr>
              <td style="padding:8px 0;color:#666;font-size:12px;letter-spacing:2px;width:40%;">${label}</td>
              <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right;">${value}</td>
            </tr>`
              )
              .join("")}
          </table>
        </td></tr>

        <!-- DIVIDER TICKET -->
        <tr><td style="background:#111;padding:0 32px;border-left:1px solid #222;border-right:1px solid #222;">
          <div style="border-top:2px dashed #333;margin:4px 0;position:relative;">
            <div style="width:20px;height:20px;background:#0a0a0a;border-radius:50%;position:absolute;left:-42px;top:-10px;"></div>
            <div style="width:20px;height:20px;background:#0a0a0a;border-radius:50%;position:absolute;right:-42px;top:-10px;"></div>
          </div>
        </td></tr>

        <!-- QR CODE -->
        <tr><td style="background:#111;padding:28px 32px 32px;border-left:1px solid #222;border-right:1px solid #222;border-radius:0 0 12px 12px;text-align:center;">
          <p style="margin:0 0 16px;color:#666;font-size:12px;letter-spacing:2px;">PRESENTA ESTE CÓDIGO EN TAQUILLA</p>
          <div style="display:inline-block;background:#fff;padding:16px;border-radius:8px;">
            <img src="cid:qr-boleto" width="160" height="160" alt="QR Boleto" style="display:block;" />
          </div>
          <p style="margin:14px 0 0;color:#444;font-size:11px;font-family:monospace;letter-spacing:2px;">
            ${data.qr_token.toUpperCase().slice(0, 16)}
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding:24px;text-align:center;">
          <p style="margin:0 0 6px;color:#444;font-size:12px;">¿Problemas con tu boleto? Escríbenos.</p>
          <p style="margin:0;color:#333;font-size:11px;">© CINEWORLD · Todos los derechos reservados</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "CINEWORLD <onboarding@resend.dev>",
    to: data.to,
    subject: `🎟️ Tu boleto para ${data.pelicula} — CINEWORLD`,
    html,
    attachments: [
      {
        filename: "qr-boleto.png",
        content: qrBuffer,
        contentType: "image/png",
        contentId: "qr-boleto",
      },
    ],
  });
}
