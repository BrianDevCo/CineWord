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

  // IDs reales de Score: películas 46-55, salas 2/4/5/6
  // SCOPLA necesita FechaFuncion + Pelicula + Sala + InicioFuncion
  const tests = {
    // SCOPLA con todos los parámetros reales
    scopla_full:    callScore(base, "scopla", JSON.stringify({ FechaFuncion: hoy, Pelicula: "48", Sala: "2", InicioFuncion: "1800", teatro, tercero })),
    scopla_pv_full: callScore(base, "scopla", JSON.stringify({ FechaFuncion: hoy, Pelicula: "48", Sala: "2", InicioFuncion: "1800", PuntoVenta: pv, teatro, tercero })),
    scopla_sala4:   callScore(base, "scopla", JSON.stringify({ FechaFuncion: hoy, Pelicula: "51", Sala: "4", InicioFuncion: "1800", teatro, tercero })),
    // Sin InicioFuncion — a ver si lo acepta
    scopla_no_hora: callScore(base, "scopla", JSON.stringify({ FechaFuncion: hoy, Pelicula: "48", Sala: "2", teatro, tercero })),
    // SCOCAR — cartelera (el que dio 500 antes según el listado Score)
    scocar:         callScore(base, "scocar", JSON.stringify({ teatro, tercero })),
    scocar_pv:      callScore(base, "scocar", JSON.stringify({ PuntoVenta: pv, teatro, tercero })),
    // SCOFUN — funciones (podría existir)
    scofun:         callScore(base, "scofun", JSON.stringify({ FechaFuncion: hoy, teatro, tercero })),
    // SCOCAL — calendario
    scocal:         callScore(base, "scocal", JSON.stringify({ teatro, tercero })),
  };

  const results = Object.fromEntries(
    await Promise.all(Object.entries(tests).map(async ([k, p]) => [k, await p]))
  );

  return NextResponse.json(results);
}
