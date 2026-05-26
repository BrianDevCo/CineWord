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

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Datos de prueba — función real sala 2
  const sala     = "2";
  const pelicula = "55";
  const hora     = "14";

  // ── 1. SCOSEC — obtener secuencia real ────────────────────────────────────────
  const scosec = await callScore(base, "scosec",
    JSON.stringify({ Punto: pv, teatro, tercero })
  );

  let secuencia = "TEST999";
  try {
    const parsed = JSON.parse(scosec.dec) as { Secuencia?: string }[] | { Secuencia?: string };
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    secuencia = obj?.Secuencia ?? "TEST999";
  } catch { /**/ }

  // ── 2. SCOMAP — layout de sillas ─────────────────────────────────────────────
  const scomap = await callScore(base, "scomap",
    JSON.stringify({ Sala: sala, FechaFuncion: hoy, Funcion: hora, teatro, tercero })
  );

  // ── 3. SCOPLA — tarifas por función ──────────────────────────────────────────
  const scopla = await callScore(base, "scopla",
    JSON.stringify({ FechaFuncion: hoy, Pelicula: pelicula, Sala: sala, InicioFuncion: "1400", teatro, tercero })
  );

  // ── 4. SCOCAR — cartelera completa ───────────────────────────────────────────
  const scocar = await callScore(base, "scocar",
    JSON.stringify({ teatro, tercero })
  );

  // ── 5. SCOCYA — registrar cliente de prueba ───────────────────────────────────
  const scocya = await callScore(base, "scocya",
    JSON.stringify({
      Login: "test@cineworld.com", Nombre: "Test", Apellido: "Cineworld",
      Correo: "test@cineworld.com", Cinema: teatro, Clave: "123456",
      Celular: "3000000000", Documento: "0", FechaNacimiento: "19900101",
      Sexo: "M", Reservas: "N", Noticias: "N", Cartelera: "N",
      OtrasSalas: "N", Contacto: "Correo Electrónico", Accion: "C", tercero,
    })
  );

  // ── 6. SCOGRU — hold de sillas (accion G) ────────────────────────────────────
  const scogru = await callScore(base, "scogru",
    JSON.stringify({
      FechaFuncion: hoy, Sala: sala, HoraFuncion: hora, Pelicula: pelicula,
      PuntoVenta: pv, Secuencia: secuencia,
      Nombre: "Test", Apellido: "Cineworld", Telefono: "3000000000",
      Ubicaciones: `FilaK,Columna9,Tarifa,FilaK,Columna10,Tarifa`,
      Accion: "G", teatro, tercero,
    })
  );

  // ── 7. SCOLIR — liberar hold inmediatamente ───────────────────────────────────
  const scolir = await callScore(base, "scolir",
    JSON.stringify({ PuntoVenta: pv, Secuencia: secuencia, teatro, tercero })
  );

  // ── 8. SCOINT V — registrar venta (con secuencia liberada, debería fallar o indicar error) ──
  const scoint = await callScore(base, "scoint",
    JSON.stringify({
      FechaFuncion: hoy, Sala: sala, HoraFuncion: hora, Pelicula: pelicula,
      PuntoVenta: pv, Secuencia: secuencia,
      Nombre: "Test", Apellido: "Cineworld", Telefono: "3000000000",
      Ubicaciones: `FilaK,Columna9,Tarifa,FilaK,Columna10,Tarifa`,
      Accion: "V", teatro, tercero,
    })
  );

  return NextResponse.json({
    config: { base, tercero, teatro, pv, hoy, secuencia_obtenida: secuencia },
    "1_scosec":  scosec,
    "2_scomap":  scomap,
    "3_scopla":  scopla,
    "4_scocar":  scocar,
    "5_scocya":  scocya,
    "6_scogru":  scogru,
    "7_scolir":  scolir,
    "8_scoint":  scoint,
  });
}
