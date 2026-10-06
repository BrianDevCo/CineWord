// Validación de parámetros que el navegador envía a las rutas /api/score/*

export const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const esHora  = (v: unknown): v is string => typeof v === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
export const esId    = (v: unknown): boolean => (typeof v === "string" || typeof v === "number") && /^\d{1,9}$/.test(String(v));
export const esFila  = (v: unknown): v is string => typeof v === "string" && /^[A-Z]{1,2}$/i.test(v);
export const esCol   = (v: unknown): boolean => (typeof v === "string" || typeof v === "number") && /^\d{1,3}$/.test(String(v));

export const MAX_SILLAS = 10;

export interface UbicacionHold { fila: string; columna: string; tarifa: string }

export function validarUbicaciones(v: unknown): UbicacionHold[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_SILLAS) return null;
  const out: UbicacionHold[] = [];
  for (const u of v) {
    if (!u || !esFila(u.fila) || !esCol(u.columna) || (u.tarifa !== undefined && u.tarifa !== "" && !esId(u.tarifa))) return null;
    out.push({ fila: u.fila.toUpperCase(), columna: String(u.columna), tarifa: String(u.tarifa ?? "") });
  }
  return out;
}
