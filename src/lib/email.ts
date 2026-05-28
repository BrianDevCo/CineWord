import { Resend } from "resend";
import QRCode from "qrcode";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ScoreQRParams {
  puntoVenta:  string;
  teatro:      string;
  secuencia:   string;
  fecha:       string; // "yyyy-mm-dd"
  sala:        string;
  hora:        string; // "HH:MM:SS"
  asientos:    { fila: string; columnaRelativa: number }[];
}

export interface TicketEmailData {
  to:          string;
  nombre:      string;
  pelicula:    string;
  fecha:       string;
  hora:        string;
  formato:     string;
  asientos:    string[];
  total:       number;
  qr_token:    string;
  scoreQR?:    ScoreQRParams;
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

// Genera el string QR en formato Score por silla
function buildScoreQRString(p: ScoreQRParams, fila: string, columnaRelativa: number): string {
  const fechaYMD = p.fecha.replace(/-/g, "");
  const fechaDMY = `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}/${p.fecha.slice(0, 4)}`;
  const hh       = p.hora.split(":")[0];
  const mm       = p.hora.split(":")[1];
  const inicio   = hh + mm;
  const parte3   = `${p.secuencia}-${fechaYMD}_${p.sala}_${hh}_${fila}_${columnaRelativa}`;
  return `cnv${p.puntoVenta} ${p.teatro} ${parte3} ${fechaDMY} ${p.sala} ${inicio} ${fila}${columnaRelativa}`;
}

async function toQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}

export async function enviarEmailBoleto(data: TicketEmailData) {
  // Genera QRs: uno por silla (formato Score) o uno global (token interno)
  const attachments: { filename: string; content: Buffer; contentType: string; contentId: string }[] = [];
  let qrImgTags = "";

  if (data.scoreQR && data.scoreQR.asientos.length > 0) {
    for (let i = 0; i < data.scoreQR.asientos.length; i++) {
      const { fila, columnaRelativa } = data.scoreQR.asientos[i];
      const qrString  = buildScoreQRString(data.scoreQR, fila, columnaRelativa);
      const dataUrl   = await toQRDataURL(qrString);
      const buf       = Buffer.from(dataUrl.split(",")[1], "base64");
      const contentId = `qr-boleto-${i}`;
      attachments.push({ filename: `qr-${fila}${columnaRelativa}.png`, content: buf, contentType: "image/png", contentId });
      qrImgTags += `
        <div style="display:inline-block;text-align:center;margin:8px;">
          <div style="background:#fff;padding:12px;border-radius:8px;display:inline-block;">
            <img src="cid:${contentId}" width="140" height="140" alt="QR ${fila}${columnaRelativa}" style="display:block;" />
          </div>
          <p style="margin:6px 0 0;color:#fff;font-size:13px;font-weight:bold;letter-spacing:2px;">${fila}${columnaRelativa}</p>
        </div>`;
    }
  } else {
    const dataUrl = await toQRDataURL(`CINEWORLD-${data.qr_token}`);
    const buf     = Buffer.from(dataUrl.split(",")[1], "base64");
    attachments.push({ filename: "qr-boleto.png", content: buf, contentType: "image/png", contentId: "qr-boleto" });
    qrImgTags = `
      <div style="display:inline-block;background:#fff;padding:16px;border-radius:8px;">
        <img src="cid:qr-boleto" width="160" height="160" alt="QR Boleto" style="display:block;" />
      </div>`;
  }

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
              .map(([label, value]) => `
            <tr>
              <td style="padding:8px 0;color:#666;font-size:12px;letter-spacing:2px;width:40%;">${label}</td>
              <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right;">${value}</td>
            </tr>`)
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

        <!-- QR CODES -->
        <tr><td style="background:#111;padding:28px 32px 32px;border-left:1px solid #222;border-right:1px solid #222;border-radius:0 0 12px 12px;text-align:center;">
          <p style="margin:0 0 16px;color:#666;font-size:12px;letter-spacing:2px;">PRESENTA ESTE CÓDIGO EN TAQUILLA</p>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
            ${qrImgTags}
          </div>
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
    from:        process.env.RESEND_FROM_EMAIL ?? "CINEWORLD <onboarding@resend.dev>",
    to:          data.to,
    subject:     `🎟️ Tu boleto para ${data.pelicula} — CINEWORLD`,
    html,
    attachments,
  });
}
