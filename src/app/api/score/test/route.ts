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

// score_pelicula_id conocidos (en_cartelera)
const PELICULAS: Record<string, string> = {
  "55": "En la Zona Gris",
  "51": "El Diablo Viste a la Moda 2",
  "48": "Michael",
  "52": "Exit 8",
  "49": "La Posesión de la Momia",
  "50": "Buena Suerte, Diviértete, No Mueras",
  "47": "Instinto Implacable",
  "46": "Mario Galaxy 3D",
  // sin score_id aún — probando IDs cercanos
  "56": "Jugada Maestra (?)",
  "57": "Star Wars (?)",
  "58": "El Pasajero del Diablo (?)",
};

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Probar SCOPLA con todas las películas conocidas, salas 1 y 2, varios horarios
  const HORAS = ["1340", "1350", "1400", "1520", "1600", "1610", "1620", "1640", "1650", "1810", "1830", "1840", "1850", "2050", "2100", "2120", "2130"];
  const scoplaResults: Record<string, { nombre: string; sala: string; hora: string; dec: string; tienesTarifas: boolean }> = {};

  for (const [id, nombre] of Object.entries(PELICULAS)) {
    for (const sala of ["2", "4", "5", "6"]) {
      for (const hora of HORAS) {
        const res = await callScore(base, "scopla",
          JSON.stringify({ FechaFuncion: hoy, Pelicula: id, Sala: sala, InicioFuncion: hora, teatro, tercero })
        );
        const tieneTarifas = res.dec.includes("codigo") || res.dec.includes("Codigo") || res.dec.includes("valor") || res.dec.includes("Valor");
        if (tieneTarifas) {
          // Solo guardamos si tiene tarifas reales para no llenar de errores
          const key = `pelicula_${id}_sala_${sala}_hora_${hora}`;
          scoplaResults[key] = { nombre, sala, hora, dec: res.dec, tienesTarifas: true };
        }
      }
    }
  }

  // Si no encontró ninguna con tarifas, mostrar el primer intento para diagnóstico
  if (Object.keys(scoplaResults).length === 0) {
    const res = await callScore(base, "scopla",
      JSON.stringify({ FechaFuncion: hoy, Pelicula: "55", Sala: "2", InicioFuncion: "1400", teatro, tercero })
    );
    scoplaResults["diagnostico_55_sala2_1400"] = { nombre: "En la Zona Gris", sala: "2", hora: "1400", dec: res.dec, tienesTarifas: false };
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
