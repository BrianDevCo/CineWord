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

async function post(url: string, body: string, ct = "application/x-www-form-urlencoded") {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": ct },
    body,
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  let dec = "";
  try { const j = JSON.parse(text) as { request?: string }; if (j.request) dec = decrypt(j.request); } catch { /**/ }
  return { status: res.status, body: text.slice(0, 800), dec: dec.slice(0, 300) };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);

  const svc = `${base}/ThirdParty/api/SCOact/scosec`;

  // Double-AES: encrypt(base64(plaintext)) — por si Score hace decode→decrypt→decode
  const b64plain = Buffer.from(plaintext).toString("base64");
  const encDouble = encrypt(b64plain);

  // Base64 de ceros sin + ni / — probar si el problema es el carácter +
  const zerosB64 = Buffer.alloc(32).toString("base64");

  return NextResponse.json({
    debug: { base, plaintext, enc, b64plain, encDouble, zerosB64 },

    // Envío normal (URLSearchParams) — stack trace completo
    normal: await post(svc, new URLSearchParams({ details: enc }).toString()).catch(e => e.message),

    // Doble-encode: tal vez Score hace decode del resultado después de descifrar
    doubleEnc: await post(svc, new URLSearchParams({ details: encDouble }).toString()).catch(e => e.message),

    // Base64 de zeros (sin + ni /) — aislar si el problema es el +
    zerosTest: await post(svc, new URLSearchParams({ details: zerosB64 }).toString()).catch(e => e.message),

    // Sin encriptar — por si Score no encripta en este endpoint
    noEncrypt: await post(svc, new URLSearchParams({ details: plaintext }).toString()).catch(e => e.message),
  });
}
