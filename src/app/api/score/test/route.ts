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

export async function GET() {
  const base     = process.env.SCORE_BASE_URL     ?? "NO CONFIGURADO";
  const tercero  = process.env.SCORE_TERCERO      ?? "1";
  const teatro   = process.env.SCORE_TEATRO       ?? "2";
  const pv       = process.env.SCORE_PUNTO_VENTA  ?? "77";

  const plaintext = JSON.stringify({ Punto: pv, teatro, tercero });
  const enc       = encrypt(plaintext);
  const svc       = `${base}/ThirdParty/api/SCOact/scosec`;

  let status = 0, body = "", dec = "";
  try {
    const res  = await fetch(svc, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(enc),
      cache:   "no-store",
      signal:  AbortSignal.timeout(12000),
    });
    status = res.status;
    const text = await res.text();
    body = text.slice(0, 500);
    try {
      const j = JSON.parse(text) as { request?: string }[] | { request?: string };
      const item = Array.isArray(j) ? j[0] : j;
      if (item?.request) dec = decrypt(item.request);
    } catch { /**/ }
  } catch (e) {
    body = String(e);
  }

  return NextResponse.json({ debug: { base, plaintext, enc }, status, body, dec });
}
