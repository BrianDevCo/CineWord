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
    return { status, raw: text.slice(0, 400), dec: dec.slice(0, 5000) };
  } catch (e) {
    return { status: 0, raw: String(e), dec: "" };
  }
}

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const tests = {
    // SCOEST — disponibilidad/ocupación de asientos por función
    scoest_s2_14: callScore(base, "scoest", JSON.stringify({ Sala: "2", FechaFuncion: hoy, Funcion: "14", teatro, tercero })),
    scoest_s2_18: callScore(base, "scoest", JSON.stringify({ Sala: "2", FechaFuncion: hoy, Funcion: "18", teatro, tercero })),
    scoest_s2_21: callScore(base, "scoest", JSON.stringify({ Sala: "2", FechaFuncion: hoy, Funcion: "21", teatro, tercero })),
  };

  const results = Object.fromEntries(
    await Promise.all(Object.entries(tests).map(async ([k, p]) => [k, await p]))
  );

  return NextResponse.json(results);
}
