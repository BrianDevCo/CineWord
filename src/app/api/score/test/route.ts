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

// Extrae la primera función con ventasONline=true y tarifa válida para terceros
type FuncionExtraida = {
  pelicula: string;
  sala: string;
  funcion: string;       // hora "HH" (p.ej. "13")
  inicioFuncion: string; // "HHMM" (p.ej. "1340")
  fecha: string;         // "yyyymmdd"
  tituloPelicula: string;
  tarifaGeneral: string;
  tarifaPremium: string;
} | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arr = (x: any) => Array.isArray(x) ? x : (x != null ? [x] : []);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extraerFuncionCineWorld(json: any, teatroId: string): FuncionExtraida {
  try {
    // Estructura real: json.Peliculas.pelicula (array o objeto)
    const peliculas = arr(json?.Peliculas?.pelicula);
    for (const peli of peliculas) {
      const peliId    = String(peli?.["@id"] ?? "");
      const peliNombre = String(peli?.["@nombre"] ?? "");
      if (!peliId) continue;

      // cinema puede ser objeto (1 cine) o array (varios)
      for (const cinema of arr(peli?.cinemas?.cinema)) {
        if (String(cinema?.["@id"]) !== teatroId) continue;

        for (const sala of arr(cinema?.salas?.sala)) {
          const salaId = String(sala?.["@numeroSala"] ?? "");
          if (!salaId) continue;

          for (const fecha of arr(sala?.Fecha)) {
            const fechaUniv = String(fecha?.["@univ"] ?? "");
            if (fechaUniv.length !== 8) continue;

            for (const hora of arr(fecha?.hora)) {
              // Solo funciones con venta online habilitada
              if (hora?.["@ventasONline"] !== "true") continue;

              const militar = String(hora?.["@militar"] ?? "");
              if (!militar) continue;

              // Extraer tarifas válidas para terceros
              let tarifaGeneral = "";
              let tarifaPremium = "";
              for (const zona of arr(hora?.TipoZona)) {
                const nombreZona = String(zona?.["@nombreZona"] ?? "").toUpperCase();
                const tarifa = zona?.TipoSilla?.Tarifa;
                if (!tarifa) continue;
                if (tarifa?.["@validoTeceros"] !== "Si") continue;
                const codigo = String(tarifa?.["@codigoTarifa"] ?? "");
                if (!codigo) continue;
                if (nombreZona === "PREMIUM" && !tarifaPremium) tarifaPremium = codigo;
                else if (!tarifaGeneral) tarifaGeneral = codigo;
              }
              if (!tarifaGeneral) continue; // necesitamos al menos tarifa general

              const horaNum = Math.floor(parseInt(militar) / 100);
              const minNum  = parseInt(militar) % 100;
              const hh = String(horaNum).padStart(2, "0");
              const mm = String(minNum).padStart(2, "0");

              return {
                pelicula:      peliId,
                sala:          salaId,
                funcion:       hh,
                inicioFuncion: hh + mm,
                fecha:         fechaUniv,
                tituloPelicula: peliNombre,
                tarifaGeneral,
                tarifaPremium,
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

  // ── 1. Leer JSON de cartelera y buscar CineWorld (teatro=2) ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cartelera: { ok: boolean; funcion: FuncionExtraida; extracto: any; error: string | null } = {
    ok: false, funcion: null, extracto: null, error: null,
  };
  try {
    const res = await fetch(`${base}/MobileComJson/variable41.json`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(30000),
    });
    const json = await res.json();
    const funcion = extraerFuncionCineWorld(json, teatro);
    // Guardar un extracto pequeño para debugging (primeras 2 entradas)
    const extracto = Array.isArray(json) ? json.slice(0, 2) : json;
    cartelera = { ok: !!funcion, funcion, extracto, error: null };
  } catch (e) {
    cartelera = { ok: false, funcion: null, extracto: null, error: String(e) };
  }

  // ── 2. SCOSEC — obtener secuencia (interno, no se muestra) ───────────────────
  const scosec = await callScore(base, "scosec",
    JSON.stringify({ Punto: puntoVenta, teatro, tercero })
  );
  const secuencia = (() => {
    try { return String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "0"); } catch { return "0"; }
  })();

  // ── 3. SCOPLA — usar datos reales del JSON si los encontramos ────────────────
  const refFuncion = cartelera.funcion ?? {
    pelicula: "4811121", sala: "4", funcion: "13", inicioFuncion: "1340",
    fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    tituloPelicula: "fallback hardcoded",
    tarifaGeneral: "2", tarifaPremium: "4",
  };

  const scopla = await callScore(base, "scopla",
    JSON.stringify({
      FechaFuncion:  refFuncion.fecha,
      Pelicula:      parseInt(refFuncion.pelicula),
      Sala:          parseInt(refFuncion.sala),
      InicioFuncion: parseInt(refFuncion.inicioFuncion),
      teatro:        parseInt(teatro),
      tercero,
    })
  );

  // ── 4. SCOGRU — hold de sillas ───────────────────────────────────────────────
  const ubicacionTest = `FilaA,Columna4,Tarifa${refFuncion.tarifaGeneral}`;
  const scogru = await callScore(base, "scogru", JSON.stringify({
    FechaFuncion: refFuncion.fecha,
    Sala:         refFuncion.sala,
    HoraFuncion:  refFuncion.funcion,
    Pelicula:     refFuncion.pelicula,
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

  // ── 5. SCOSIL — liberar preventa silla por silla ─────────────────────────────
  const scosil = await callScore(base, "scosil", JSON.stringify({
    FechaFuncion: refFuncion.fecha,
    Sala:         parseInt(refFuncion.sala),
    Funcion:      parseInt(refFuncion.funcion),
    Fila:         "A",
    Columna:      4,
    Usuario:      parseInt(puntoVenta),
    teatro:       parseInt(teatro),
    tercero,
  }));

  const resumen = {
    cartelera_json: cartelera.ok
      ? `OK — ${refFuncion.tituloPelicula} | sala ${refFuncion.sala} | ${refFuncion.fecha} ${refFuncion.funcion}h | tarifa general=${refFuncion.tarifaGeneral} premium=${refFuncion.tarifaPremium}`
      : "NO ENCONTRADO / ERROR",
    scopla:  scopla.ok  ? "OK" : "BLOQUEADO/ERROR",
    scogru:  scogru.ok  ? "OK" : "BLOQUEADO/ERROR",
    scosil:  scosil.ok  ? "OK" : "BLOQUEADO/ERROR",
    scoint:  "NO PROBADO — registrar venta (afecta datos reales)",
  };

  return NextResponse.json({
    config: { base, tercero, teatro, puntoVenta, secuencia },
    resumen,
    detalle: {
      cartelera: { ...cartelera, extracto: cartelera.extracto },
      scopla:  { ...scopla,  params: { FechaFuncion: refFuncion.fecha, Pelicula: refFuncion.pelicula, Sala: refFuncion.sala, InicioFuncion: refFuncion.inicioFuncion, teatro, tercero } },
      scogru:  { ...scogru,  params: { FechaFuncion: refFuncion.fecha, Sala: refFuncion.sala, HoraFuncion: refFuncion.funcion, Pelicula: refFuncion.pelicula, Ubicaciones: ubicacionTest, Secuencia: secuencia } },
      scosil:  { ...scosil,  params: { FechaFuncion: refFuncion.fecha, Sala: refFuncion.sala, Funcion: refFuncion.funcion, Fila: "A", Columna: 4, Usuario: puntoVenta } },
    },
  });
}
