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
      headers: { "Content-Type": "application/json" },
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
    return { status, raw: text.slice(0, 800), dec: dec.slice(0, 1000) };
  } catch (e) {
    return { status: 0, raw: String(e), dec: "" };
  }
}

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";

  const [scosec, scopla1, scopla2, scopla3] = await Promise.all([
    // SCOSEC — ya funciona, control
    callScore(base, "scosec", JSON.stringify({ Punto: pv, teatro, tercero })),
    // SCOPLA — solo teatro/tercero (cartelera general)
    callScore(base, "scopla", JSON.stringify({ teatro, tercero })),
    // SCOPLA — con PuntoVenta
    callScore(base, "scopla", JSON.stringify({ PuntoVenta: pv, teatro, tercero })),
    // SCOPLA — con fecha de hoy
    callScore(base, "scopla", JSON.stringify({
      Fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      teatro,
      tercero,
    })),
  ]);

  return NextResponse.json({ scosec, scopla1, scopla2, scopla3 });
}
