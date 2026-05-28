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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arr = (x: any) => Array.isArray(x) ? x : (x != null ? [x] : []);

type FuncionExtraida = {
  pelicula: string;
  sala: string;
  funcion: string;
  inicioFuncion: string;
  fecha: string;
  tituloPelicula: string;
  tarifaGeneral: string;
  tarifaPremium: string;
} | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extraerFuncionCineWorld(json: any, teatroId: string): FuncionExtraida {
  try {
    const peliculas = arr(json?.Peliculas?.pelicula);
    for (const peli of peliculas) {
      const peliId     = String(peli?.["@id"] ?? "");
      const peliNombre = String(peli?.["@nombre"] ?? "");
      if (!peliId) continue;
      for (const cinema of arr(peli?.cinemas?.cinema)) {
        if (String(cinema?.["@id"]) !== teatroId) continue;
        for (const sala of arr(cinema?.salas?.sala)) {
          const salaId = String(sala?.["@numeroSala"] ?? "");
          if (!salaId) continue;
          for (const fecha of arr(sala?.Fecha)) {
            const fechaUniv = String(fecha?.["@univ"] ?? "");
            if (fechaUniv.length !== 8) continue;
            for (const hora of arr(fecha?.hora)) {
              if (hora?.["@ventasONline"] !== "true") continue;
              const militar = String(hora?.["@militar"] ?? "");
              if (!militar) continue;
              let tarifaGeneral = "", tarifaPremium = "";
              for (const zona of arr(hora?.TipoZona)) {
                const nombreZona = String(zona?.["@nombreZona"] ?? "").toUpperCase();
                const tarifa = zona?.TipoSilla?.Tarifa;
                if (!tarifa || tarifa?.["@validoTeceros"] !== "Si") continue;
                const codigo = String(tarifa?.["@codigoTarifa"] ?? "");
                if (!codigo) continue;
                if (nombreZona === "PREMIUM" && !tarifaPremium) tarifaPremium = codigo;
                else if (!tarifaGeneral) tarifaGeneral = codigo;
              }
              if (!tarifaGeneral) continue;
              const horaNum = Math.floor(parseInt(militar) / 100);
              const minNum  = parseInt(militar) % 100;
              const hh = String(horaNum).padStart(2, "0");
              const mm = String(minNum).padStart(2, "0");
              return {
                pelicula: peliId, sala: salaId,
                funcion: hh, inicioFuncion: hh + mm,
                fecha: fechaUniv, tituloPelicula: peliNombre,
                tarifaGeneral, tarifaPremium,
              };
            }
          }
        }
      }
    }
  } catch { /**/ }
  return null;
}

export async function GET() {
  const base       = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero    = process.env.SCORE_TERCERO     ?? "1";
  const teatro     = process.env.SCORE_TEATRO      ?? "2";
  const puntoVenta = process.env.SCORE_PUNTO_VENTA ?? "77";

  // ── Obtener función real del JSON (necesaria para SCOGRU) ────────────────────
  let funcion: FuncionExtraida = null;
  try {
    const res = await fetch(`${base}/MobileComJson/variable41.json`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(30000),
    });
    funcion = extraerFuncionCineWorld(await res.json(), teatro);
  } catch { /**/ }

  const ref = funcion ?? {
    pelicula: "4811121", sala: "4", funcion: "13", inicioFuncion: "1340",
    fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    tituloPelicula: "fallback hardcoded", tarifaGeneral: "2", tarifaPremium: "4",
  };

  // Secuencia (SCOSEC — ya funciona, solo la necesitamos para SCOGRU)
  const scosec = await callScore(base, "scosec",
    JSON.stringify({ Punto: puntoVenta, teatro, tercero })
  );
  const secuencia = (() => {
    try { return String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "0"); } catch { return "0"; }
  })();

  // ── 1. SCOGRU — hold de sillas (BLOQUEADO para tercero=1) ───────────────────
  const ubicacionTest = `FilaA,Columna4,Tarifa${ref.tarifaGeneral}`;
  const scogru = await callScore(base, "scogru", JSON.stringify({
    FechaFuncion: ref.fecha,
    Sala:         ref.sala,
    HoraFuncion:  ref.funcion,
    Pelicula:     ref.pelicula,
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

  // ── 2. SCOCYA — registrar cliente (accion C) ─────────────────────────────────
  const scocya = await callScore(base, "scocya", JSON.stringify({
    Login:           "test-score@cineworld.co",
    Nombre:          "Test",
    Apellido:        "Score",
    Correo:          "test-score@cineworld.co",
    Cinema:          teatro,
    Clave:           "Test1234",
    Celular:         "3000000000",
    Documento:       "0",
    FechaNacimiento: "19900101",
    Sexo:            "M",
    Reservas:        "N",
    Noticias:        "N",
    Cartelera:       "N",
    OtrasSalas:      "N",
    Contacto:        "Correo Electrónico",
    Accion:          "C",
    tercero,
  }));

  // ── 3. SCOLOG — login cliente ────────────────────────────────────────────────
  const scolog = await callScore(base, "scolog", JSON.stringify({
    Login:   "test-score@cineworld.co",
    Clave:   "Test1234",
    tercero,
  }));

  // ── 4. SCOCED — consultar cliente por documento ──────────────────────────────
  const scoced = await callScore(base, "scoced", JSON.stringify({
    Documento: "1234567890",
    tercero,
  }));

  return NextResponse.json({
    config: { base, tercero, teatro, puntoVenta, secuencia, funcion_usada: ref.tituloPelicula },
    resumen: {
      scogru: scogru.ok  ? "OK" : `BLOQUEADO — ${scogru.dec || scogru.error}`,
      scocya: scocya.ok  ? "OK" : `BLOQUEADO — ${scocya.dec || scocya.error}`,
      scolog: scolog.ok  ? "OK" : `BLOQUEADO — ${scolog.dec || scolog.error}`,
      scoced: scoced.ok  ? "OK" : `BLOQUEADO — ${scoced.dec || scoced.error}`,
    },
    detalle: { scogru, scocya, scolog, scoced },
  });
}
