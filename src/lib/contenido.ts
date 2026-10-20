import { supabase } from "./supabase";

// Contenido editable desde /admin/contenido (tabla `contenido`, clave → JSON).
// Si la tabla no existe o está vacía se usan estos valores por defecto, que son
// los precios reales publicados por el cine (no son datos de ejemplo).

export interface Tarifa {
  dias: string[];
  subtitulo: string;
  general: number;
  premium: number;
  tag: string;        // "" = sin etiqueta destacada
  horario: string;    // aclaración opcional, ej. "Todo el día"
  destacada: boolean;
}

export interface Combo {
  id: string;
  nombre: string;
  tag: string;
  desc: string;
  imagen: string;     // ruta en /public/combos
  precios: { salado: number; mixto?: number; dulce?: number };
  activo: boolean;
}

export const IMAGENES_COMBOS = [
  "/combos/mi-combo.jpg",
  "/combos/combo-world.jpg",
  "/combos/mundo-para-dos.jpg",
  "/combos/mega-familiar.jpg",
  "/combos/cajita-kid.jpg",
  "/combos/combo-express.jpg",
  "/combos/combo-nachos.jpg",
  "/combos/nachos.jpg",
  "/combos/paquete.jpg",
  "/combos/gomas.jpg",
  "/combos/granizados.png",
  "/combos/bebida-grande.jpg",
  "/combos/bebida-mediana.jpg",
  "/combos/bebida-pequena.jpg",
];

export const TARIFAS_DEFAULT: Tarifa[] = [
  { dias: ["Lunes", "Jueves"], subtitulo: "Entre semana", general: 12000, premium: 18000, tag: "", horario: "", destacada: false },
  { dias: ["Martes", "Miércoles"], subtitulo: "Promo especial", general: 7000, premium: 10000, tag: "MITAD DE PRECIO", horario: "Todo el día", destacada: true },
  { dias: ["Viernes", "Sábado", "Domingo"], subtitulo: "Fin de semana", general: 14000, premium: 20000, tag: "", horario: "", destacada: false },
];

export const COMBOS_DEFAULT: Combo[] = [
  { id: "mi-combo",       nombre: "Mi Combo",       tag: "",        desc: "Crispeta mediana, 1 perro, 1 gaseosa y 1 dulce",     imagen: "/combos/mi-combo.jpg",       precios: { salado: 33000, mixto: 36500, dulce: 39000 }, activo: true },
  { id: "combo-world",    nombre: "Combo World",    tag: "POPULAR", desc: "Crispeta grande y 2 gaseosas",                       imagen: "/combos/combo-world.jpg",    precios: { salado: 35000, mixto: 38500, dulce: 41000 }, activo: true },
  { id: "mundo-para-dos", nombre: "Mundo para Dos", tag: "DÚO",     desc: "Crispeta grande, 2 perros, 2 gaseosas y 1 dulce",    imagen: "/combos/mundo-para-dos.jpg", precios: { salado: 60000, mixto: 63500, dulce: 66000 }, activo: true },
  { id: "mega-familiar",  nombre: "Mega Familiar",  tag: "FAMILIA", desc: "2 crispetas medianas, 3 perros, 3 gaseosas y papas", imagen: "/combos/mega-familiar.jpg",  precios: { salado: 90000, mixto: 93500, dulce: 96000 }, activo: true },
  { id: "combo-kids",     nombre: "Combo Kids",     tag: "",        desc: "Cajita feliz, chocolatina y 1 bebida",               imagen: "/combos/cajita-kid.jpg",     precios: { salado: 18000, mixto: 21500, dulce: 24000 }, activo: true },
  { id: "combo-express",  nombre: "Combo Express",  tag: "",        desc: "Crispeta mediana y 2 gaseosas",                      imagen: "/combos/combo-express.jpg",  precios: { salado: 28000, mixto: 31500, dulce: 34000 }, activo: true },
  { id: "combo-nachos",   nombre: "Combo Nachos",   tag: "",        desc: "Nachos con queso, perro y bebida",                   imagen: "/combos/combo-nachos.jpg",   precios: { salado: 30000 }, activo: true },
];

// ── Validación (la usa la API de admin antes de guardar) ─────────────────────
const precio = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10_000_000;
const texto = (v: unknown, max: number) => typeof v === "string" && v.length <= max;

export function validarTarifas(v: unknown): Tarifa[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 7) return null;
  const ok = v.every((t) =>
    t && Array.isArray(t.dias) && t.dias.length > 0 && t.dias.length <= 7 && t.dias.every((d: unknown) => texto(d, 20) && d)
    && texto(t.subtitulo, 40) && precio(t.general) && precio(t.premium)
    && texto(t.tag, 30) && texto(t.horario, 80) && typeof t.destacada === "boolean");
  return ok ? (v as Tarifa[]) : null;
}

export function validarCombos(v: unknown): Combo[] | null {
  if (!Array.isArray(v) || v.length > 30) return null;
  const ok = v.every((c) =>
    c && texto(c.id, 40) && c.id && texto(c.nombre, 60) && c.nombre && texto(c.tag, 20) && texto(c.desc, 200)
    && IMAGENES_COMBOS.includes(c.imagen) && typeof c.activo === "boolean"
    && c.precios && precio(c.precios.salado)
    && (c.precios.mixto === undefined || precio(c.precios.mixto))
    && (c.precios.dulce === undefined || precio(c.precios.dulce)));
  return ok ? (v as Combo[]) : null;
}

// ── Lectura pública ──────────────────────────────────────────────────────────
function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
}

export async function getContenido(): Promise<{ tarifas: Tarifa[]; combos: Combo[] }> {
  const defaults = { tarifas: TARIFAS_DEFAULT, combos: COMBOS_DEFAULT };
  if (!supabaseReady()) return defaults;

  const { data, error } = await supabase.from("contenido").select("clave, valor").in("clave", ["tarifas", "combos"]);
  if (error || !data) return defaults;

  const porClave = Object.fromEntries(data.map((r) => [r.clave, r.valor]));
  return {
    tarifas: validarTarifas(porClave.tarifas) ?? TARIFAS_DEFAULT,
    combos: validarCombos(porClave.combos) ?? COMBOS_DEFAULT,
  };
}
