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

async function call(url: string, body: string, ct: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": ct },
    body,
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  let dec = "";
  try { const j = JSON.parse(text) as { request?: string }; if (j.request) dec = decrypt(j.request); } catch { /**/ }
  return { status: res.status, body: text.slice(0, 600), dec };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);
  const svc = `${base}/ThirdParty/api/SCOact/scosec`;

  // LA FIX: enviar el base64 como JSON string puro (sin wrapper objeto)
  // → ASP.NET deserializa JValue → .ToString() = el base64 limpio
  const fixResult = await call(svc, JSON.stringify(enc), "application/json");

  // Variante: JSON string con scocart para ver qué servicios responden
  const svcCar = `${base}/ThirdParty/api/SCOact/scocar`;
  const plainCar = `teatro:${teatro},tercero:${tercero}`;
  const carResult = await call(svcCar, JSON.stringify(encrypt(plainCar)), "application/json");

  return NextResponse.json({
    debug: { base, plaintext, enc },
    scosec_jsonString: fixResult,
    scocar_jsonString: carResult,
  });
}
