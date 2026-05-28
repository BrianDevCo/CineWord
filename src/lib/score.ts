import { createCipheriv, createDecipheriv } from "crypto";

const KEY = Buffer.from("tHIrd!sc0R3Is.00", "utf8");
const IV  = Buffer.from("tHIrd!sc0R3Is.00", "utf8");

function encrypt(text: string): string {
  const c = createCipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}

function decrypt(base64: string): string {
  const d = createDecipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([d.update(Buffer.from(base64, "base64")), d.final()]).toString("utf8");
}

function parseKV(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const chunk of text.split(",")) {
    const idx = chunk.indexOf(":");
    if (idx !== -1) result[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }
  return result;
}

async function call(
  service: string,
  plaintext: string,
): Promise<{ raw: string; kv: Record<string, string> }> {
  const base = process.env.SCORE_BASE_URL;
  if (!base) throw new Error("SCORE_BASE_URL no configurado");

  const res = await fetch(`${base}/ThirdParty/api/SCOact/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(encrypt(plaintext)),
  });

  if (!res.ok) throw new Error(`Score ${service} → HTTP ${res.status}`);

  const rawJson = await res.json() as { request?: string }[] | { request?: string };
  const item = Array.isArray(rawJson) ? rawJson[0] : rawJson;
  if (!item?.request) throw new Error(`Score ${service}: sin campo 'request'`);

  const raw = decrypt(item.request);

  // La respuesta puede venir como JSON array/objeto o como key:value
  let kv: Record<string, string> = {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | Record<string, unknown>[];
    const obj = Array.isArray(parsed) ? parsed[0] : parsed;
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) kv[k] = String(v);
    }
  } catch {
    kv = parseKV(raw);
  }

  return { raw, kv };
}

const tercero    = () => process.env.SCORE_TERCERO     ?? "1";
const puntoVenta = () => process.env.SCORE_PUNTO_VENTA ?? "77";
const teatro     = () => process.env.SCORE_TEATRO      ?? "2";

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface AsientoScore {
  fila: string;    // "A"
  columna: string; // "1"
  tarifa: string;  // código de tarifa Score
}

/** Accion G = preventa/grupo (SCOGRU), R = reserva (SCOINT), V = venta (SCOINT) */
export interface ScoreReservaParams {
  fechaFuncion: string;
  sala: string;
  horaFuncion: string;
  pelicula: string;
  secuencia: string;
  nombre: string;
  apellido: string;
  telefono: string;
  ubicaciones: AsientoScore[];
  accion: "R" | "V" | "G";
}

export interface ScorePlan {
  codigo: string;
  descripcion: string;
  valor: number;
  zona: string;
}

export interface AsientoMapa {
  fila: string;         // "A"
  columna: number;      // posición interna Score (ColumnaTotal) — usada para SCOGRU/SCOINT
  columnaLabel: number; // número visible para el usuario (ColumnaRelativa)
  estado: "S" | "B" | "R"; // libre, ocupado, reservado
  zona: string;         // "GENERAL", "VIP", etc.
}

export interface ScoreClienteParams {
  email: string;
  nombre: string;
  apellido: string;
  clave: string;
  accion: "C" | "U";
  celular?: string;
  documento?: string;
  fechaNacimiento?: string; // "yyyymmdd"
  sexo?: "M" | "F";
}

// ── Parsers internos ───────────────────────────────────────────────────────────

function parsePlanes(raw: string): ScorePlan[] {
  const planes: ScorePlan[] = [];
  const chunks = raw.split(/(?=codigo:)/gi).filter(Boolean);
  for (const chunk of chunks) {
    const kv = parseKV(chunk);
    const codigo      = kv.codigo      ?? kv.Codigo      ?? "";
    const descripcion = kv.descripcion ?? kv.Descripcion ?? "";
    const valorStr    = kv.valor       ?? kv.Valor       ?? "0";
    const zona        = kv.zona        ?? kv.Zona        ?? "GENERAL";
    if (codigo) planes.push({ codigo, descripcion, valor: parseInt(valorStr) || 0, zona });
  }
  return planes;
}

function parseMapa(raw: string): AsientoMapa[] {
  const asientos: AsientoMapa[] = [];

  // Formato JSON con arrays paralelos: { FilaTotal, ColumnaTotal, TipoZona, Estado? }
  try {
    const json = JSON.parse(raw) as {
      FilaTotal?: string[];
      ColumnaTotal?: number[];
      ColumnaRelativa?: number[];
      TipoSilla?: string[];
      TipoZona?: string[];
      Estado?: string[];
    };
    if (Array.isArray(json.FilaTotal) && Array.isArray(json.ColumnaTotal)) {
      for (let i = 0; i < json.FilaTotal.length; i++) {
        const fila       = json.FilaTotal[i]?.toUpperCase() ?? "";
        const col        = Math.round(json.ColumnaTotal[i] ?? 0);
        const colLabel   = Math.round(json.ColumnaRelativa?.[i] ?? col);
        const silla      = (json.TipoSilla?.[i] ?? "").toLowerCase();
        const zona       = (json.TipoZona?.[i] ?? json.TipoSilla?.[i] ?? "GENERAL").toUpperCase();
        const est        = (json.Estado?.[i] ?? "S").toUpperCase();
        if (fila && col && silla !== "pasillo") {
          asientos.push({
            fila,
            columna:      col,
            columnaLabel: colLabel,
            estado: est === "B" ? "B" : est === "R" ? "R" : "S",
            zona,
          });
        }
      }
      if (asientos.length) return asientos;
    }
  } catch { /**/ }

  // Formato key:value con Fila:A,Columna:1,...
  const byFila = raw.split(/(?=(?:^|,)Fila:[A-Z],)/i);
  if (byFila.length > 1) {
    for (const chunk of byFila) {
      const kv    = parseKV(chunk);
      const fila  = (kv.Fila   ?? kv.fila   ?? "").toUpperCase();
      const col   = parseInt(kv.Columna ?? kv.columna ?? "0");
      const est   = (kv.Estado ?? kv.estado ?? "S").toUpperCase();
      const zona  = kv.Zona    ?? kv.zona   ?? kv.Tipo ?? kv.tipo ?? "GENERAL";
      if (fila && col) {
        asientos.push({
          fila,
          columna:      col,
          columnaLabel: col,
          estado: est === "B" ? "B" : est === "R" ? "R" : "S",
          zona,
        });
      }
    }
    if (asientos.length) return asientos;
  }

  // Formato compacto "A1:S,A2:B,..."
  for (const item of raw.split(",")) {
    const m = item.trim().match(/^([A-Z])(\d+):([SBRsbr])/i);
    if (m) {
      asientos.push({
        fila:         m[1].toUpperCase(),
        columna:      parseInt(m[2]),
        columnaLabel: parseInt(m[2]),
        estado:       m[3].toUpperCase() as "S" | "B" | "R",
        zona:         "GENERAL",
      });
    }
  }
  return asientos;
}

// ── API pública ────────────────────────────────────────────────────────────────

/** SCOSEC — número de secuencia + recargo web */
export async function scoreGetSecuencia(): Promise<{ secuencia: string; recargo: number }> {
  const { kv } = await call(
    "scosec",
    JSON.stringify({ Punto: puntoVenta(), teatro: teatro(), tercero: tercero() }),
  );
  return {
    secuencia: kv.Secuencia ?? kv.secuencia ?? "",
    recargo:   parseInt(kv.Recargo_Venta_Internet ?? kv.RecargoVentaInternet ?? "0", 10),
  };
}

/** SCOMAP — mapa completo de sillas con estado (B=ocupado, S=libre, R=reservado) */
export async function scoreGetMapa(params: {
  sala: string;
  fechaFuncion: string; // "yyyymmdd"
  funcion: string;      // hora "22"
}): Promise<{ raw: string; asientos: AsientoMapa[] }> {
  const { raw } = await call(
    "scomap",
    JSON.stringify({ Sala: params.sala, FechaFuncion: params.fechaFuncion, Funcion: params.funcion, teatro: teatro(), tercero: tercero() }),
  );
  return { raw, asientos: parseMapa(raw) };
}

/** SCOESG — ocupación real por función. Retorna mapa { "K3": "S", "K4": "B", ... }
 *  La clave es `${filRel}${columnaRelativa}` — coincide con AsientoMapa.fila + columnaLabel
 */
export async function scoreGetOcupacion(params: {
  fechaFuncion: string;
  sala: string;
  funcion: string;
}): Promise<Record<string, "S" | "B" | "R">> {
  const { raw } = await call(
    "scoesg",
    JSON.stringify({ FechaFuncion: params.fechaFuncion, Sala: params.sala, Funcion: params.funcion, teatro: teatro(), tercero: tercero() }),
  );
  const ocupacion: Record<string, "S" | "B" | "R"> = {};
  try {
    const filas = JSON.parse(raw) as Array<{
      filRel?: string;
      DescripcionSilla?: Array<{ TipoSilla?: string; EstadoSilla?: string; Columna?: number }>;
    }>;
    for (const fila of filas) {
      const f = fila.filRel?.toUpperCase();
      if (!f) continue;
      for (const s of fila.DescripcionSilla ?? []) {
        if (!s.Columna || s.Columna === 0 || s.TipoSilla?.toLowerCase() === "pasillo") continue;
        const col = Math.round(s.Columna);
        const est = s.EstadoSilla?.toUpperCase() ?? "S";
        ocupacion[`${f}${col}`] = est === "B" ? "B" : est === "R" ? "R" : "S";
      }
    }
  } catch { /**/ }
  return ocupacion;
}

/**
 * SCOGRU (Accion G) — preventa/hold de sillas antes del pago
 * SCOINT (Accion R) — reserva
 * SCOINT (Accion V) — registra venta final
 */
export async function scoreReservar(params: ScoreReservaParams) {
  const ubicaciones = params.ubicaciones
    .map(u => `Fila${u.fila},Columna${u.columna},Tarifa${u.tarifa}`)
    .join(",");

  const endpoint = params.accion === "G" ? "scogru" : "scoint";
  return call(
    endpoint,
    JSON.stringify({
      FechaFuncion: params.fechaFuncion,
      Sala:         params.sala,
      HoraFuncion:  params.horaFuncion,
      Pelicula:     params.pelicula,
      PuntoVenta:   puntoVenta(),
      Secuencia:    params.secuencia,
      Telefono:     params.telefono,
      Nombre:       params.nombre,
      Apellido:     params.apellido,
      Ubicaciones:  ubicaciones,
      Accion:       params.accion,
      teatro:       teatro(),
      tercero:      tercero(),
    }),
  );
}

/** SCOSIL — libera una preventa silla por silla (Accion G de SCOGRU). SCOLIR es para reservas. */
export async function scoreLiberarPreventa(params: {
  fechaFuncion: string;
  sala: string;
  funcion: string;
  fila: string;
  columna: number;
}) {
  return call(
    "scosil",
    JSON.stringify({
      FechaFuncion: params.fechaFuncion,
      Sala:         parseInt(params.sala),
      Funcion:      parseInt(params.funcion),
      Fila:         params.fila,
      Columna:      params.columna,
      Usuario:      parseInt(puntoVenta()),
      teatro:       parseInt(teatro()),
      tercero:      tercero(),
    }),
  );
}

/** SCOPLA — tarifas para una función específica (terceros) */
export async function scoreGetPlanes(params: {
  fechaFuncion: string;
  pelicula: string;
  sala: string;
  inicioFuncion: string; // "HHMM"
}): Promise<{ raw: string; planes: ScorePlan[] }> {
  const { raw } = await call(
    "scopla",
    JSON.stringify({ FechaFuncion: params.fechaFuncion, Pelicula: parseInt(params.pelicula), Sala: parseInt(params.sala), InicioFuncion: parseInt(params.inicioFuncion), teatro: parseInt(teatro()), tercero: tercero() }),
  );
  return { raw, planes: parsePlanes(raw) };
}

/** SCOCYA — registrar (C) o actualizar (U) cliente */
export async function scoreRegistrarCliente(p: ScoreClienteParams) {
  return call(
    "scocya",
    JSON.stringify({
      Login:           p.email,
      Nombre:          p.nombre,
      Apellido:        p.apellido,
      Correo:          p.email,
      Cinema:          teatro(),
      Clave:           p.clave,
      Celular:          p.celular ?? "",
      Telefono:         p.celular ?? "",
      Documento:        p.documento ?? "0",
      Fecha_Nacimiento: p.fechaNacimiento ?? "19900101",
      Sexo:             p.sexo ?? "M",
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
      Accion:          p.accion,
      tercero:         tercero(),
    }),
  );
}

/** SCOLOG — login / consultar cliente por correo */
export async function scoreLoginCliente(email: string, clave: string) {
  return call("scolog", JSON.stringify({ Correo: email, Clave: clave, tercero: tercero() }));
}

/** SCOCED — consultar cliente por número de documento */
export async function scoreConsultarPorDocumento(documento: string) {
  return call("scoced", JSON.stringify({ Documento: documento, tercero: tercero() }));
}

/** variable41.xml — cartelera (GET, sin encriptar) */
export async function scoreGetCartelera(): Promise<string> {
  const base = process.env.SCORE_BASE_URL;
  if (!base) throw new Error("SCORE_BASE_URL no configurado");
  const res = await fetch(`${base}/MobileComJson/variable41.xml`);
  if (!res.ok) throw new Error(`Score cartelera → HTTP ${res.status}`);
  return res.text();
}

// ── Helpers de conversión ──────────────────────────────────────────────────────

/** "2025-01-15" → "20250115" */
export function toScoreFecha(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/** "20:30:00" → "20"  (HoraFuncion en SCOINT/SCOGRU) */
export function toScoreHora(timeStr: string): string {
  return timeStr.split(":")[0];
}

/** "20:30:00" → "2030"  (InicioFuncion en SCOPLA) */
export function toScoreInicio(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  return (h ?? "00").padStart(2, "0") + (m ?? "00").padStart(2, "0");
}

/** "Juan Carlos López" → { nombre: "Juan", apellido: "Carlos López" } */
export function splitNombre(fullName: string): { nombre: string; apellido: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    nombre:   parts[0] ?? "",
    apellido: parts.slice(1).join(" ") || (parts[0] ?? ""),
  };
}
