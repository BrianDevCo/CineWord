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

const REF = { pelicula: "182511121", sala: "2", hora: "14", horaInicio: "1400", fecha: (hoy: string) => hoy };

export async function GET() {
  const base       = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero    = process.env.SCORE_TERCERO     ?? "1";
  const teatro     = process.env.SCORE_TEATRO      ?? "2";
  const puntoVenta = process.env.SCORE_PUNTO_VENTA ?? "77";
  const hoy        = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fecha      = REF.fecha(hoy);

  // SCOSEC solo para obtener la secuencia (no se muestra en resultados)
  const scosec = await callScore(base, "scosec",
    JSON.stringify({ Punto: puntoVenta, teatro, tercero })
  );
  const secuencia = (() => {
    try { return String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "0"); } catch { return "0"; }
  })();

  // Servicios bloqueados — probar en paralelo donde sea posible
  const [scopla, scocar] = await Promise.all([

    // SCOPLA — tarifas por función
    callScore(base, "scopla",
      JSON.stringify({ FechaFuncion: fecha, Pelicula: REF.pelicula, Sala: REF.sala, InicioFuncion: REF.horaInicio, teatro, tercero })
    ).then(r => ({ ...r, params: { FechaFuncion: fecha, Pelicula: REF.pelicula, Sala: REF.sala, InicioFuncion: REF.horaInicio, teatro, tercero } })),

    // SCOCAR — cartelera automática
    callScore(base, "scocar",
      JSON.stringify({ teatro, tercero })
    ).then(r => ({ ...r, params: { teatro, tercero } })),

  ]);

  // SCOGRU — hold de sillas (necesita secuencia de SCOSEC)
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

  // SCOLIR — liberar hold inmediatamente (aunque falle scogru)
  const scolir = await callScore(base, "scolir", JSON.stringify({
    PuntoVenta: puntoVenta,
    Secuencia:  secuencia,
    teatro,
    tercero,
  }));

  const resumen = {
    scopla: scopla.ok ? "OK" : "BLOQUEADO/ERROR",
    scocar: scocar.ok ? "OK" : "BLOQUEADO/ERROR",
    scogru: scogru.ok ? "OK" : "BLOQUEADO/ERROR",
    scolir: scolir.ok ? "OK" : "BLOQUEADO/ERROR",
    scoint: "NO PROBADO — registrar venta (afecta datos reales)",
  };

  return NextResponse.json({
    config: { base, tercero, teatro, puntoVenta, hoy, secuencia },
    resumen,
    detalle: {
      scopla: { ...scopla },
      scocar: { ...scocar },
      scogru: { ...scogru, params: { FechaFuncion: fecha, Sala: REF.sala, HoraFuncion: REF.hora, Pelicula: REF.pelicula, Ubicaciones: ubicacionTest, Secuencia: secuencia } },
      scolir: { ...scolir, params: { PuntoVenta: puntoVenta, Secuencia: secuencia } },
    },
  });
}
