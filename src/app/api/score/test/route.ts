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

const PELICULAS: Record<string, string> = {
  "60": "El Pasajero del Diablo",
  "59": "Star Wars",
  "56": "Jugada Maestra",
  "55": "En la Zona Gris",
  "54": "Las Ovejas Detectives",
  "53": "Mortal Kombat 2",
  "52": "Exit 8",
  "51": "El Diablo Viste a la Moda",
};

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Probar SCOPLA con todas las películas conocidas, salas 1 y 2, hora 14
  const scoplaResults: Record<string, { nombre: string; sala: string; dec: string; tienesTarifas: boolean }> = {};

  for (const [id, nombre] of Object.entries(PELICULAS)) {
    for (const sala of ["1", "2"]) {
      const key = `pelicula_${id}_sala_${sala}`;
      const res = await callScore(base, "scopla",
        JSON.stringify({ FechaFuncion: hoy, Pelicula: id, Sala: sala, InicioFuncion: "1400", teatro, tercero })
      );
      const tieneTarifas = res.dec.includes("codigo") || res.dec.includes("Codigo") || res.dec.includes("valor") || res.dec.includes("Valor");
      scoplaResults[key] = { nombre, sala, dec: res.dec, tienesTarifas: tieneTarifas };
    }
  }

  // SCOCAR — cartelera completa
  const scocar = await callScore(base, "scocar",
    JSON.stringify({ teatro, tercero })
  );

  return NextResponse.json({
    config: { base, tercero, teatro, hoy },
    scopla_por_pelicula: scoplaResults,
    scocar,
  });
}
