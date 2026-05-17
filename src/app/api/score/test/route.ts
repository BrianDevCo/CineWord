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
    return { status, raw: text.slice(0, 800), dec: dec.slice(0, 1500) };
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

  // scocar_e { Fecha: "20260516", tercero } llegó a SQL — probar formatos de fecha
  const fechaISO  = new Date().toISOString().slice(0, 10);           // "2026-05-16"
  const fechaES   = hoy.slice(6, 8) + "/" + hoy.slice(4, 6) + "/" + hoy.slice(0, 4); // "16/05/2026"
  const fechaUS   = hoy.slice(4, 6) + "/" + hoy.slice(6, 8) + "/" + hoy.slice(0, 4); // "05/16/2026"

  const tests = {
    // Formato ganador del ciclo anterior: { Fecha: "20260516", tercero } → llegó a SQL
    scocar_yyyymmdd:  callScore(base, "scocar", JSON.stringify({ Fecha: hoy,      tercero })),
    // Formatos alternativos de fecha
    scocar_iso:       callScore(base, "scocar", JSON.stringify({ Fecha: fechaISO,  tercero })),
    scocar_es:        callScore(base, "scocar", JSON.stringify({ Fecha: fechaES,   tercero })),
    scocar_us:        callScore(base, "scocar", JSON.stringify({ Fecha: fechaUS,   tercero })),
    // Con teatro además
    scocar_t_yyyymmdd:callScore(base, "scocar", JSON.stringify({ Fecha: hoy,      tercero, teatro })),
    scocar_t_iso:     callScore(base, "scocar", JSON.stringify({ Fecha: fechaISO,  tercero, teatro })),
    scocar_t_es:      callScore(base, "scocar", JSON.stringify({ Fecha: fechaES,   tercero, teatro })),
    // Nombre campo FechaFuncion en vez de Fecha
    scocar_ff:        callScore(base, "scocar", JSON.stringify({ FechaFuncion: hoy, tercero })),
    scocar_ff_iso:    callScore(base, "scocar", JSON.stringify({ FechaFuncion: fechaISO, tercero })),
    scocar_ff_es:     callScore(base, "scocar", JSON.stringify({ FechaFuncion: fechaES,  tercero })),
  };

  const results = Object.fromEntries(
    await Promise.all(Object.entries(tests).map(async ([k, p]) => [k, await p]))
  );

  return NextResponse.json(results);
}
