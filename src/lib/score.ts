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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ details: encrypt(plaintext) }),
  });

  if (!res.ok) throw new Error(`Score ${service} → HTTP ${res.status}`);

  const json = (await res.json()) as { request?: string };
  if (!json.request) throw new Error(`Score ${service}: sin campo 'request'`);

  const raw = decrypt(json.request);
  return { raw, kv: parseKV(raw) };
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
  fila: string;    // "A"
  columna: number; // 1
  estado: "S" | "B" | "R"; // libre, ocupado, reservado
  zona: string;    // "GENERAL", "VIP", etc.
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
  // Cada plan empieza con "codigo:" — dividimos ahí
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

  // Intento 1: formato Score con claves repetidas "Fila:A,Columna:1,Estado:S,Zona:GENERAL,Fila:A,..."
  // Dividimos por cada aparición de "Fila:[A-Z]" (inicio de un asiento)
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
          columna: col,
          estado: est === "B" ? "B" : est === "R" ? "R" : "S",
          zona,
        });
      }
    }
    if (asientos.length) return asientos;
  }

  // Intento 2: formato compacto "A1:S,A2:B,A3:S,..."
  for (const item of raw.split(",")) {
    const m = item.trim().match(/^([A-Z])(\d+):([SBRsbr])/i);
    if (m) {
      asientos.push({
        fila:    m[1].toUpperCase(),
        columna: parseInt(m[2]),
        estado:  m[3].toUpperCase() as "S" | "B" | "R",
        zona:    "GENERAL",
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
    `Punto:${puntoVenta()},teatro:${teatro()},tercero:${tercero()}`,
  );
  return {
    secuencia: kv.Secuencia ?? kv.secuencia ?? "",
    recargo:   parseInt(kv.RecargoVentaInternet ?? "0", 10),
  };
}

/** SCOMAP — mapa completo de sillas con estado (B=ocupado, S=libre, R=reservado) */
export async function scoreGetMapa(params: {
  sala: string;
  fechaFuncion: string; // "yyyymmdd"
  funcion: string;      // hora "22"
}): Promise<{ raw: string; asientos: AsientoMapa[] }> {
  const plaintext = [
    `Sala:${params.sala}`,
    `FechaFuncion:${params.fechaFuncion}`,
    `Funcion:${params.funcion}`,
    `teatro:${teatro()}`,
    `tercero:${tercero()}`,
  ].join(",");
  const { raw } = await call("scomap", plaintext);
  return { raw, asientos: parseMapa(raw) };
}

/** SCOEST — disponibilidad de asientos por función */
export async function scoreGetAsientos(params: {
  fechaFuncion: string;
  sala: string;
  funcion: string; // hora "22"
}) {
  const plaintext = [
    `FechaFuncion:${params.fechaFuncion}`,
    `Sala:${params.sala}`,
    `Funcion:${params.funcion}`,
    `teatro:${teatro()}`,
    `tercero:${tercero()}`,
  ].join(",");
  return call("scoest", plaintext);
}

/**
 * SCOGRU (Accion G) — preventa/hold de sillas antes del pago
 * SCOINT (Accion R) — reserva
 * SCOINT (Accion V) — registra venta final
 */
export async function scoreReservar(params: ScoreReservaParams) {
  const ubStr = params.ubicaciones
    .map(u => `Fila${u.fila},Columna${u.columna},Tarifa${u.tarifa}`)
    .join(",");

  const plaintext = [
    `FechaFuncion:${params.fechaFuncion}`,
    `Sala:${params.sala}`,
    `HoraFuncion:${params.horaFuncion}`,
    `Pelicula:${params.pelicula}`,
    `PuntoVenta:${puntoVenta()}`,
    `Secuencia:${params.secuencia}`,
    `Telefono:${params.telefono}`,
    `Nombre:${params.nombre}`,
    `Apellido:${params.apellido}`,
    `Ubicaciones:${ubStr}`,
    `Accion:${params.accion}`,
    `teatro:${teatro()}`,
    `tercero:${tercero()}`,
  ].join(",");

  // G usa scogru, R y V usan scoint
  const endpoint = params.accion === "G" ? "scogru" : "scoint";
  return call(endpoint, plaintext);
}

/** SCOLIR — libera un hold/preventa por secuencia */
export async function scoreLiberarReserva(secuencia: string) {
  const plaintext = [
    `PuntoVenta:${puntoVenta()}`,
    `Secuencia:${secuencia}`,
    `teatro:${teatro()}`,
    `tercero:${tercero()}`,
  ].join(",");
  return call("scolir", plaintext);
}

/** SCOPLA — tarifas para una función específica (terceros) */
export async function scoreGetPlanes(params: {
  fechaFuncion: string;
  pelicula: string;
  sala: string;
  inicioFuncion: string; // "HHMM"
}): Promise<{ raw: string; planes: ScorePlan[] }> {
  const plaintext = [
    `FechaFuncion:${params.fechaFuncion}`,
    `Pelicula:${params.pelicula}`,
    `Sala:${params.sala}`,
    `InicioFuncion:${params.inicioFuncion}`,
    `teatro:${teatro()}`,
    `tercero:${tercero()}`,
  ].join(",");
  const { raw } = await call("scopla", plaintext);
  return { raw, planes: parsePlanes(raw) };
}

/** SCOCYA — registrar (C) o actualizar (U) cliente */
export async function scoreRegistrarCliente(p: ScoreClienteParams) {
  const plaintext = [
    `Login:${p.email}`,
    `Nombre:${p.nombre}`,
    `Apellido:${p.apellido}`,
    `Correo:${p.email}`,
    `Cinema:${teatro()}`,
    `Clave:${p.clave}`,
    `Celular:${p.celular ?? ""}`,
    `Documento:${p.documento ?? "0"}`,
    `FechaNacimiento:${p.fechaNacimiento ?? "19900101"}`,
    `Sexo:${p.sexo ?? "M"}`,
    `Reservas:N`,
    `Noticias:N`,
    `Cartelera:N`,
    `OtrasSalas:N`,
    `Contacto:Correo Electrónico`,
    `Accion:${p.accion}`,
    `tercero:${tercero()}`,
  ].join(",");
  return call("scocya", plaintext);
}

/** SCOLOG — login / consultar cliente por email */
export async function scoreLoginCliente(email: string, clave: string) {
  return call("scolog", `Login:${email},Clave:${clave},tercero:${tercero()}`);
}

/** SCOCED — consultar cliente por número de documento */
export async function scoreConsultarPorDocumento(documento: string) {
  return call("scoced", `Documento:${documento},tercero:${tercero()}`);
}

/** variable41.xml — cartelera (GET, sin encriptar) */
export async function scoreGetCartelera(): Promise<string> {
  const base = process.env.SCORE_BASE_URL;
  if (!base) throw new Error("SCORE_BASE_URL no configurado");
  const res = await fetch(`${base}/Mobile/ComJson/variable41.xml`);
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
