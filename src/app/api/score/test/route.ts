import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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
  elapsed: number;
  error?: string;
};

async function callScore(base: string, service: string, payload: unknown): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${base}/ThirdParty/api/SCOact/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(encrypt(JSON.stringify(payload))),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    let dec = "";
    try {
      const j = JSON.parse(text) as { request?: string }[] | { request?: string };
      const item = Array.isArray(j) ? j[0] : j;
      if (item?.request) dec = decrypt(item.request);
      else dec = text;
    } catch { dec = text; }

    const bloqueado =
      dec.toLowerCase().includes("no hay tarifas") ||
      dec.toLowerCase().includes("no autorizado") ||
      dec.toLowerCase().includes("para terceros") ||
      dec.includes("no encontró");

    return { ok: res.status === 200 && !bloqueado, status: res.status, dec, elapsed };
  } catch (e) {
    return { ok: false, status: 0, dec: "", elapsed: Date.now() - start, error: String(e) };
  }
}

async function callGet(base: string, path: string): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    return { ok: res.status === 200 && text.length > 10, status: res.status, dec: text.slice(0, 300), elapsed };
  } catch (e) {
    return { ok: false, status: 0, dec: "", elapsed: Date.now() - start, error: String(e) };
  }
}

// Extrae la primera función real de la cartelera JSON de Score
function extraerFuncion(carteraJson: string, teatroId: string): FuncionRef | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = JSON.parse(carteraJson) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = (x: any) => Array.isArray(x) ? x : (x != null ? [x] : []);
    for (const peli of arr(json?.Peliculas?.pelicula)) {
      const peliId = String(peli?.["@id"] ?? peli?.id ?? "");
      const peliNom = String(peli?.["@nombre"] ?? peli?.nombre ?? "?");
      for (const cinema of arr(peli?.cinemas?.cinema)) {
        if (String(cinema?.["@id"] ?? "") !== teatroId) continue;
        for (const sala of arr(cinema?.salas?.sala)) {
          const salaId = String(sala?.["@numeroSala"] ?? sala?.["@id"] ?? "");
          for (const fecha of arr(sala?.Fecha)) {
            const fechaUniv = String(fecha?.["@univ"] ?? "");
            if (fechaUniv.length !== 8) continue;
            for (const hora of arr(fecha?.hora)) {
              if (hora?.["@ventasONline"] !== "true") continue;
              const militar = String(hora?.["@militar"] ?? "");
              if (!militar) continue;
              // Busca tarifa válida para terceros
              let tarifaGeneral = "", tarifaPremium = "";
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              for (const zona of arr(hora?.TipoZona)) {
                const nomZona = String(zona?.["@nombreZona"] ?? "").toUpperCase();
                const tarifa = zona?.TipoSilla?.Tarifa;
                if (!tarifa || tarifa?.["@validoTeceros"] !== "Si") continue;
                const cod = String(tarifa?.["@codigoTarifa"] ?? "");
                if (!cod) continue;
                if (nomZona === "PREMIUM" && !tarifaPremium) tarifaPremium = cod;
                else if (!tarifaGeneral) tarifaGeneral = cod;
              }
              const hh = String(Math.floor(parseInt(militar) / 100)).padStart(2, "0");
              const mm = String(parseInt(militar) % 100).padStart(2, "0");
              return {
                pelicula: peliId, sala: salaId,
                funcion: hh, inicioFuncion: hh + mm,
                fecha: fechaUniv, titulo: peliNom,
                tarifaGeneral: tarifaGeneral || "2",
                tarifaPremium: tarifaPremium || "4",
              };
            }
          }
        }
      }
    }
  } catch { /**/ }
  return null;
}

interface FuncionRef {
  pelicula: string;
  sala: string;
  funcion: string;
  inicioFuncion: string;
  fecha: string;
  titulo: string;
  tarifaGeneral: string;
  tarifaPremium: string;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const base    = process.env.SCORE_BASE_URL    ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO     ?? "1";
  const teatro  = process.env.SCORE_TEATRO      ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";

  const resultados: Record<string, ServiceResult> = {};

  // ── 1. SCOCAR — cartelera (GET, sin encriptar) ───────────────────────────────
  const scocarXml  = await callGet(base, "/MobileComJson/variable41.xml");
  const scocarJson = await callGet(base, "/MobileComJson/variable41.json");
  resultados.SCOCAR_XML  = scocarXml;
  resultados.SCOCAR_JSON = scocarJson;

  // Extraer función real de la cartelera para usar en los demás tests
  let funcion: FuncionRef | null = null;
  if (scocarJson.ok) funcion = extraerFuncion(scocarJson.dec, teatro);
  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const ref: FuncionRef = funcion ?? {
    pelicula: "55", sala: "2", funcion: "13", inicioFuncion: "1300",
    fecha: hoy, titulo: "FALLBACK (no hay cartelera)",
    tarifaGeneral: "2", tarifaPremium: "4",
  };

  // ── 2. SCOSEC — secuencia + recargo web ─────────────────────────────────────
  const scosec = await callScore(base, "scosec", { Punto: pv, teatro, tercero });
  resultados.SCOSEC = scosec;
  let secuencia = "1";
  try { secuencia = String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "1"); } catch { /**/ }

  // ── 3. SCOMAP — mapa de sillas ───────────────────────────────────────────────
  resultados.SCOMAP = await callScore(base, "scomap", {
    Sala: ref.sala, FechaFuncion: ref.fecha, Funcion: ref.funcion, teatro, tercero,
  });

  // ── 4. SCOESG — ocupación real ───────────────────────────────────────────────
  resultados.SCOESG = await callScore(base, "scoesg", {
    FechaFuncion: ref.fecha, Sala: ref.sala, Funcion: ref.funcion, teatro, tercero,
  });

  // ── 5. SCOPLA — tarifas para terceros ────────────────────────────────────────
  resultados.SCOPLA = await callScore(base, "scopla", {
    FechaFuncion: ref.fecha,
    Pelicula: parseInt(ref.pelicula),
    Sala: parseInt(ref.sala),
    InicioFuncion: parseInt(ref.inicioFuncion),
    teatro: parseInt(teatro),
    tercero,
  });

  // ── 6. SCOGRU — hold de sillas ───────────────────────────────────────────────
  resultados.SCOGRU = await callScore(base, "scogru", {
    FechaFuncion:  ref.fecha,
    Sala:          parseInt(ref.sala),
    HoraFuncion:   ref.funcion,
    Pelicula:      parseInt(ref.pelicula),
    Descripcion:   ref.titulo,
    InicioFuncion: parseInt(ref.inicioFuncion),
    PuntoVenta:    parseInt(pv),
    Secuencia:     parseInt(secuencia),
    Telefono:      "3000000000",
    Nombre:        "TEST",
    Apellido:      "PRUEBA",
    Ubicaciones:   [{ Fila: "A", Columna: 4, Tarifa: ref.tarifaGeneral }],
    teatro:        parseInt(teatro),
    tercero,
  });

  // ── 7. SCOSIL — liberar hold (solo si SCOGRU funcionó) ──────────────────────
  if (resultados.SCOGRU.ok) {
    resultados.SCOSIL = await callScore(base, "scosil", {
      FechaFuncion: ref.fecha,
      Sala:         parseInt(ref.sala),
      Funcion:      parseInt(ref.funcion),
      Fila:         "A",
      Columna:      4,
      Usuario:      parseInt(pv),
      teatro:       parseInt(teatro),
      tercero,
    });
  } else {
    resultados.SCOSIL = { ok: false, status: 0, dec: "OMITIDO — SCOGRU falló", elapsed: 0 };
  }

  // ── 8. SCOCYA — registrar cliente ────────────────────────────────────────────
  resultados.SCOCYA = await callScore(base, "scocya", {
    Login:            "test-score@cineworld.co",
    Nombre:           "Test",
    Apellido:         "Score",
    Correo:           "test-score@cineworld.co",
    Cinema:           teatro,
    Clave:            "Test1234",
    Celular:          "3000000000",
    Telefono:         "3000000000",
    Documento:        "0",
    Fecha_Nacimiento: "19900101",
    Sexo:             "M",
    Edad:             "",
    Genero:           "",
    Direccion:        "",
    Barrio:           "",
    Municipio:        "",
    Reservas:         "N",
    Noticias:         "N",
    Cartelera:        "N",
    Otras_Salas:      "N",
    Contacto:         "Correo Electrónico",
    Accion:           "C",
    tercero,
  });

  // ── 9. SCOLOG — login cliente ────────────────────────────────────────────────
  resultados.SCOLOG = await callScore(base, "scolog", {
    Correo:  "test-score@cineworld.co",
    Clave:   "Test1234",
    tercero,
  });

  // ── 10. SCOCED — consultar cliente por documento ─────────────────────────────
  resultados.SCOCED = await callScore(base, "scoced", {
    Documento: "1234567890",
    tercero,
  });

  // ── Resumen ──────────────────────────────────────────────────────────────────
  const resumen: Record<string, string> = {};
  for (const [svc, r] of Object.entries(resultados)) {
    resumen[svc] = r.ok
      ? `✅ OK (${r.elapsed}ms)`
      : `❌ ${(r.error ?? r.dec.slice(0, 120)) || `HTTP ${r.status}`} (${r.elapsed}ms)`;
  }

  const total  = Object.values(resultados).filter(r => r.status !== 0 || r.dec !== "OMITIDO — SCOGRU falló").length;
  const ok     = Object.values(resultados).filter(r => r.ok).length;

  return NextResponse.json({
    resumen,
    score_ok: `${ok}/${total}`,
    config: { base, tercero, teatro, pv, secuencia, funcion_ref: ref },
    detalle: resultados,
  });
}
