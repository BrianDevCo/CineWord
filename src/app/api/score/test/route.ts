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

type ServiceResult = {
  ok: boolean;
  status: number;
  dec: string;
  error: string | null;
  nota?: string;
};

async function callScore(base: string, service: string, plaintext: string): Promise<ServiceResult> {
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
    const bloqueado = dec.toLowerCase().includes("terceros") || dec.includes("no encontró") || dec.includes("diccionario");
    return { ok: status === 200 && !bloqueado, status, dec, error: null };
  } catch (e) {
    return { ok: false, status: 0, dec: "", error: String(e) };
  }
}

// Función de referencia para todos los tests de lectura
// Key completo Score para "En la Zona Gris" doblada = 182511121
const REF = { pelicula: "182511121", sala: "2", hora: "14", horaInicio: "1400", fecha: (hoy: string) => hoy };

export async function GET() {
  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const puntoVenta = process.env.SCORE_PUNTO_VENTA ?? "77";
  const hoy     = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fecha   = REF.fecha(hoy);

  // Correr todos los servicios de solo lectura en paralelo
  const [scosec, scomap, scoesg, scopla, scocar] = await Promise.all([

    // SCOSEC — secuencia + recargo web (necesario para iniciar cualquier compra)
    callScore(base, "scosec",
      JSON.stringify({ Punto: puntoVenta, teatro, tercero })
    ).then(r => ({ ...r, params: { Punto: puntoVenta, teatro, tercero } })),

    // SCOMAP — mapa físico de sillas (para mostrar el selector de asientos)
    callScore(base, "scomap",
      JSON.stringify({ Sala: REF.sala, FechaFuncion: fecha, Funcion: REF.hora, teatro, tercero })
    ).then(r => ({ ...r, params: { Sala: REF.sala, FechaFuncion: fecha, Funcion: REF.hora, teatro, tercero } })),

    // SCOESG — ocupación real de sillas (saber cuáles están vendidas en taquilla)
    callScore(base, "scoesg",
      JSON.stringify({ FechaFuncion: fecha, Sala: REF.sala, Funcion: REF.hora, teatro, tercero })
    ).then(r => ({ ...r, params: { FechaFuncion: fecha, Sala: REF.sala, Funcion: REF.hora, teatro, tercero } })),

    // SCOPLA — tarifas por función (precios para cobrar en web)
    callScore(base, "scopla",
      JSON.stringify({ FechaFuncion: fecha, Pelicula: REF.pelicula, Sala: REF.sala, InicioFuncion: REF.horaInicio, teatro, tercero })
    ).then(r => ({ ...r, params: { FechaFuncion: fecha, Pelicula: REF.pelicula, Sala: REF.sala, InicioFuncion: REF.horaInicio, teatro, tercero } })),

    // SCOCAR — cartelera automática (no tener que cargar funciones manualmente)
    callScore(base, "scocar",
      JSON.stringify({ teatro, tercero })
    ).then(r => ({ ...r, params: { teatro, tercero } })),

  ]);

  // SCOGRU → hold 1 silla → SCOLIR libera inmediatamente
  // Usamos la secuencia que ya obtuvimos de SCOSEC
  const secuencia = (() => {
    try { return String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "0"); } catch { return "0"; }
  })();

  const ubicacionTest = `FilaA,Columna4,Tarifa37`;
  const scogru = await callScore(base, "scogru", JSON.stringify({
    FechaFuncion: fecha,
    Sala:         REF.sala,
    HoraFuncion:  REF.hora,
    Pelicula:     REF.pelicula,
    PuntoVenta:   puntoVenta,
    Secuencia:    secuencia,
    Telefono:     "3000000000",
    Nombre:       "TEST",
    Apellido:     "PRUEBA",
    Ubicaciones:  ubicacionTest,
    Accion:       "G",
    teatro,
    tercero,
  }));

  // Liberar inmediatamente sin importar el resultado
  const scolir = await callScore(base, "scolir", JSON.stringify({
    PuntoVenta: puntoVenta,
    Secuencia:  secuencia,
    teatro,
    tercero,
  }));

  const transaccionales = {
    scoint: { nota: "NO PROBADO — registrar venta (afecta datos reales)" },
    scocya: { nota: "NO PROBADO — crear/actualizar cliente (afecta datos reales)" },
  };

  const resumen = {
    scosec: scosec.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scomap: scomap.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scoesg: scoesg.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scopla: scopla.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scocar: scocar.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scogru: scogru.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scolir: scolir.ok  ? "✅ OK" : "❌ BLOQUEADO/ERROR",
    scoint: "⚠️ NO PROBADO",
    scocya: "⚠️ NO PROBADO",
  };

  // XML cartelera — buscar CineWorld dentro del stream completo
  let xml: { ok: boolean; cinemaId: string | null; extracto: string; bytesLeidos: number; error: string | null } = {
    ok: false, cinemaId: null, extracto: "", bytesLeidos: 0, error: null,
  };
  try {
    const xmlRes = await fetch(`${base}/MobileComJson/variable41.xml`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(55000),
    });
    const reader = xmlRes.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let bytesLeidos = 0;
    // Buscar por el ID de En la Zona Gris o por "Cali"
    const BUSCAR = ["182511", "Cali", "cineworld", "mroutlet", "MR Outlet"];
    let encontrado = "";
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        bytesLeidos += chunk.length;
        buffer += chunk;
        // Buscar en el buffer acumulado
        for (const termino of BUSCAR) {
          const idx = buffer.indexOf(termino);
          if (idx !== -1) {
            encontrado = termino;
            // Extraer 2000 chars alrededor del match
            const inicio = Math.max(0, idx - 500);
            const fin = Math.min(buffer.length, idx + 1500);
            xml = { ok: true, cinemaId: null, extracto: buffer.slice(inicio, fin), bytesLeidos, error: null };
            reader.cancel();
            break;
          }
        }
        if (encontrado) break;
        // Mantener solo los últimos 10KB para no consumir memoria
        if (buffer.length > 10000) buffer = buffer.slice(-5000);
      }
      if (!encontrado) {
        xml = { ok: xmlRes.ok, cinemaId: null, extracto: "No se encontró CineWorld en el XML", bytesLeidos, error: null };
      }
    }
  } catch (e) {
    xml = { ok: false, cinemaId: null, extracto: "", bytesLeidos: 0, error: String(e) };
  }

  return NextResponse.json({
    config: { base, tercero, teatro, puntoVenta, hoy },
    resumen,
    servicios: { scosec, scomap, scoesg, scopla, scocar, scogru: { ...scogru, params: { FechaFuncion: fecha, Sala: REF.sala, HoraFuncion: REF.hora, Pelicula: REF.pelicula, Ubicaciones: ubicacionTest, Secuencia: secuencia, Accion: "G" } }, scolir: { ...scolir, params: { PuntoVenta: puntoVenta, Secuencia: secuencia } } },
    transaccionales,
    xml,
  });
}
