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

async function post(base: string, service: string, body: string, ct: string) {
  const res = await fetch(`${base}/ThirdParty/api/SCOact/${service}`, {
    method: "POST",
    headers: { "Content-Type": ct },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  let decrypted = "";
  try {
    const json = JSON.parse(text) as { request?: string };
    if (json.request) decrypted = decrypt(json.request);
  } catch { /* ignore */ }
  return { status: res.status, body: text.slice(0, 300), decrypted: decrypted.slice(0, 300) };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);

  // Ver qué produce la encriptación
  const debug = { base, plaintext, enc_raw: enc, enc_length: enc.length };

  // Intento 1: URLSearchParams (estándar)
  const t1 = await post(base, "scosec",
    new URLSearchParams({ details: enc }).toString(),
    "application/x-www-form-urlencoded"
  ).catch(e => e.message);

  // Intento 2: encodeURIComponent manual
  const t2 = await post(base, "scosec",
    `details=${encodeURIComponent(enc)}`,
    "application/x-www-form-urlencoded"
  ).catch(e => e.message);

  // Intento 3: JSON body
  const t3 = await post(base, "scosec",
    JSON.stringify({ details: enc }),
    "application/json"
  ).catch(e => e.message);

  // Intento 4: base64 sin padding (quitar los = finales)
  const encNoPad = enc.replace(/=+$/, "");
  const t4 = await post(base, "scosec",
    new URLSearchParams({ details: encNoPad }).toString(),
    "application/x-www-form-urlencoded"
  ).catch(e => e.message);

  // Intento 5: raw body solo el valor base64 sin clave
  const t5 = await post(base, "scosec",
    enc,
    "text/plain"
  ).catch(e => e.message);

  return NextResponse.json({ debug, t1_URLSearchParams: t1, t2_encodeURI: t2, t3_JSON: t3, t4_noPadding: t4, t5_rawBody: t5 });
}
