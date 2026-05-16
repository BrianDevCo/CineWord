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
  const res = await fetch(`${base}/ThirdParty/api/SCOact/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ details: encrypt(plaintext) }),
    signal: AbortSignal.timeout(10000),
  });
  const status = res.status;
  const body = await res.text();
  let decrypted = "";
  try {
    const json = JSON.parse(body) as { request?: string };
    if (json.request) decrypted = decrypt(json.request);
  } catch { /* ignore */ }
  return { status, body: body.slice(0, 500), decrypted: decrypted.slice(0, 500) };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";

  const results: Record<string, unknown> = { base, tercero, teatro, pv };

  // 1. Probar SCOSEC (secuencia) — el más básico
  results.scosec = await callScore(base, "scosec", `Punto:${pv},teatro:${teatro},tercero:${tercero}`).catch(e => `ERROR: ${e.message}`);

  // 2. Probar SCOCART (cartelera vía ThirdParty)
  results.scocart = await callScore(base, "scocart", `teatro:${teatro},tercero:${tercero}`).catch(e => `ERROR: ${e.message}`);

  // 3. Probar SCOCAR (nombre alternativo)
  results.scocar = await callScore(base, "scocar", `teatro:${teatro},tercero:${tercero}`).catch(e => `ERROR: ${e.message}`);

  // 4. Probar SCOPEL (películas)
  results.scopel = await callScore(base, "scopel", `teatro:${teatro},tercero:${tercero}`).catch(e => `ERROR: ${e.message}`);

  return NextResponse.json(results);
}
