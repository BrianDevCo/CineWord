import { NextResponse } from "next/server";
import { createCipheriv, createDecipheriv } from "crypto";

const KEY = Buffer.from("tHIrd!sc0R3Is.00", "utf8");
const IV  = Buffer.from("tHIrd!sc0R3Is.00", "utf8");

function encrypt(text: string): string {
  const c = createCipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}

function decrypt(b64: string): string {
  const d = createDecipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([d.update(Buffer.from(b64, "base64")), d.final()]).toString("utf8");
}

async function callScore(base: string, service: string, plaintext: string) {
  try {
    const res = await fetch(`${base}/ThirdParty/api/SCOact/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(encrypt(plaintext)),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const status = res.status;
    const text = await res.text();
    let dec = "";
    try {
      const j = JSON.parse(text) as { request?: string }[] | { request?: string };
      const item = Array.isArray(j) ? j[0] : j;
      if (item?.request) dec = decrypt(item.request);
    } catch { /**/ }
    return { status, dec, error: null };
  } catch (e) {
    return { status: 0, dec: "", error: String(e) };
  }
}

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // ── 1. variable41.xml — cartelera sin encriptar ───────────────────────────────
  let xml = "";
  let xmlError: string | null = null;
  let peliculaId = "55";
  let salaId = "2";
  let inicioFuncion = "1400";

  try {
    const xmlRes = await fetch(`${base}/Mobile/ComJson/variable41.xml`, {
      headers: { "ngrok-skip-browser-warning": "true" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    xml = await xmlRes.text();

    // Intentar extraer primera película, sala y hora de la cartelera
    const pelMatch = xml.match(/<CodigoPelicula[^>]*>(\d+)<\/CodigoPelicula>|CodigoPelicula="(\d+)"|<pelicula[^>]*id="(\d+)"/i);
    if (pelMatch) peliculaId = pelMatch[1] ?? pelMatch[2] ?? pelMatch[3] ?? peliculaId;

    const salaMatch = xml.match(/<CodigoSala[^>]*>(\d+)<\/CodigoSala>|CodigoSala="(\d+)"|<sala[^>]*id="(\d+)"/i);
    if (salaMatch) salaId = salaMatch[1] ?? salaMatch[2] ?? salaMatch[3] ?? salaId;

    const horaMatch = xml.match(/<HoraFuncion[^>]*>(\d{4})<\/HoraFuncion>|HoraFuncion="(\d{4})"/i);
    if (horaMatch) inicioFuncion = horaMatch[1] ?? horaMatch[2] ?? inicioFuncion;

  } catch (e) {
    xmlError = String(e);
  }

  // ── 2. SCOPLA — tarifas usando datos reales de la cartelera ──────────────────
  const scopla = await callScore(base, "scopla",
    JSON.stringify({ FechaFuncion: hoy, Pelicula: peliculaId, Sala: salaId, InicioFuncion: inicioFuncion, teatro, tercero })
  );

  // ── 3. SCOCAR — cartelera completa ───────────────────────────────────────────
  const scocar = await callScore(base, "scocar",
    JSON.stringify({ teatro, tercero })
  );

  return NextResponse.json({
    config: { base, tercero, teatro, pv, hoy },
    "1_variable41_xml": {
      ok: !xmlError,
      error: xmlError,
      extractedFor_scopla: { peliculaId, salaId, inicioFuncion },
      raw_preview: xml.slice(0, 2000),
    },
    "2_scopla": scopla,
    "3_scocar": scocar,
  });
}
