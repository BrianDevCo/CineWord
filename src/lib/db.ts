import { supabase } from "./supabase";
import type { Pelicula, Funcion, AsientoOcupado } from "./types";
import {
  FALLBACK_PELICULAS,
  FALLBACK_PROXIMAS,
  getFallbackFunciones,
} from "./fallback";

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
}

// Los datos de ejemplo (fallback.ts) solo se usan en desarrollo: en producción
// nunca se deben mostrar películas u horarios inventados a clientes reales.
const DEMO = process.env.NODE_ENV !== "production";

function demo<T>(datos: T, vacio: T): T {
  return DEMO ? datos : vacio;
}

/** Fecha y hora actuales en Colombia: { fecha: "YYYY-MM-DD", hora: "HH:MM:SS" } */
export function ahoraBogota() {
  const d = new Date();
  return {
    fecha: d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" }),
    hora: d.toLocaleTimeString("en-GB", { timeZone: "America/Bogota", hour12: false }),
  };
}

/** Quita estrenos cuya fecha ya pasó (deberían estar en cartelera o retirados) */
function soloFuturos(peliculas: Pelicula[]): Pelicula[] {
  const hoy = ahoraBogota().fecha;
  return peliculas.filter((p) => p.estado !== "proximo" || !p.fecha_estreno || p.fecha_estreno >= hoy);
}

export async function getHeroPeliculas(): Promise<Pelicula[]> {
  const fallback = [
    ...FALLBACK_PELICULAS.filter((p) => p.en_hero),
    ...FALLBACK_PROXIMAS.filter((p) => p.en_hero),
  ];

  if (!supabaseReady()) return demo(fallback, []);

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("en_hero", true)
    .eq("activa", true)
    .order("estado") // en_cartelera antes que proximo
    .order("orden");

  if (error || !data?.length) return demo(fallback, []);
  return soloFuturos(data);
}

export async function getPeliculasEnCartelera(): Promise<Pelicula[]> {
  if (!supabaseReady()) return demo(FALLBACK_PELICULAS, []);

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("estado", "en_cartelera")
    .eq("activa", true)
    .order("orden");

  if (error) {
    console.error("Error cargando cartelera:", error);
    return demo(FALLBACK_PELICULAS, []);
  }
  return data ?? [];
}

export async function getPeliculasProximas(): Promise<Pelicula[]> {
  if (!supabaseReady()) return demo(soloFuturos(FALLBACK_PROXIMAS), []);

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("estado", "proximo")
    .eq("activa", true)
    .order("fecha_estreno");

  if (error) {
    console.error("Error cargando próximos estrenos:", error);
    return demo(FALLBACK_PROXIMAS, []);
  }
  return soloFuturos(data ?? []);
}

export async function getPelicula(id: number): Promise<Pelicula | null> {
  if (!supabaseReady()) {
    return demo(
      FALLBACK_PELICULAS.find((m) => m.id === id) ??
      FALLBACK_PROXIMAS.find((m) => m.id === id) ??
      null,
      null,
    );
  }

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("id", id)
    .eq("activa", true)
    .single();

  if (error) return null;
  return data;
}

export async function getFuncionesByPelicula(
  peliculaId: number,
  dias = 7
): Promise<Funcion[]> {
  if (!supabaseReady()) return demo(getFallbackFunciones(peliculaId), []);

  const today = ahoraBogota().fecha;
  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() + dias);
  const until = untilDate.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const { data, error } = await supabase
    .from("funciones")
    .select("*, sala:salas(*)")
    .eq("pelicula_id", peliculaId)
    .eq("activa", true)
    .gte("fecha", today)
    .lte("fecha", until)
    .order("fecha")
    .order("hora");

  if (error) console.error("Error cargando funciones:", error);
  if (error || !data?.length) return demo(getFallbackFunciones(peliculaId), []);
  return data as Funcion[];
}

/** Horarios que quedan hoy por película: { [pelicula_id]: ["16:30:00", "19:00:00"] } */
export async function getHorariosHoy(): Promise<Record<number, string[]>> {
  const { fecha, hora } = ahoraBogota();
  const agrupar = (funciones: Pick<Funcion, "pelicula_id" | "hora">[]) => {
    const out: Record<number, string[]> = {};
    for (const f of funciones) {
      if (f.hora <= hora) continue;
      const horas = (out[f.pelicula_id] ??= []);
      if (!horas.includes(f.hora)) horas.push(f.hora);
    }
    for (const k in out) out[k].sort();
    return out;
  };

  if (!supabaseReady()) {
    if (!DEMO) return {};
    return agrupar(FALLBACK_PELICULAS.flatMap((p) => getFallbackFunciones(p.id).filter((f) => f.fecha === fecha)));
  }

  const { data, error } = await supabase
    .from("funciones")
    .select("pelicula_id, hora")
    .eq("activa", true)
    .eq("fecha", fecha)
    .order("hora");

  if (error) {
    console.error("Error cargando horarios de hoy:", error);
    return {};
  }
  return agrupar(data ?? []);
}

export async function getFuncionById(id: number) {
  if (!supabaseReady()) return null;
  const { data } = await supabase
    .from("funciones")
    .select("*, pelicula:peliculas(titulo)")
    .eq("id", id)
    .single();
  return data as (Funcion & { pelicula: { titulo: string } | null }) | null;
}

export async function getReservasByEmail(email: string) {
  if (!supabaseReady()) return [];
  const { createAdminClient } = await import("./supabase-admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("reservas")
    .select(`
      *,
      funcion:funciones(
        fecha, hora, formato,
        pelicula:peliculas(titulo, poster_url)
      )
    `)
    .eq("email", email)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAsientosOcupados(funcionId: number): Promise<AsientoOcupado[]> {
  if (!supabaseReady()) return [];

  const { data, error } = await supabase
    .from("asientos_ocupados")
    .select("id, funcion_id, fila, columna")
    .eq("funcion_id", funcionId);

  if (error) return [];
  return (data ?? []) as AsientoOcupado[];
}

export interface CreateReservaInput {
  funcion_id: number;
  email: string;
  nombre: string;
  telefono?: string;
  asientos: Array<{ fila: string; columna: number; tipo: "regular" | "vip" }>;
  total: number;
  referencia_pago?: string;
}

export async function crearReserva(input: CreateReservaInput) {
  if (!supabaseReady()) {
    return { id: 0, qr_token: "demo", ...input };
  }

  const { createAdminClient } = await import("./supabase-admin");
  const admin = createAdminClient();

  const { data: reserva, error: resError } = await admin
    .from("reservas")
    .insert({
      funcion_id: input.funcion_id,
      email: input.email,
      nombre: input.nombre,
      telefono: input.telefono ?? null,
      asientos: input.asientos,
      total: input.total,
      estado: "pagado",
      referencia_pago: input.referencia_pago ?? null,
    })
    .select()
    .single();

  if (resError || !reserva) throw resError ?? new Error("No se pudo crear la reserva");

  const asientosRows = input.asientos.map((a) => ({
    funcion_id: input.funcion_id,
    fila: a.fila,
    columna: a.columna,
    reserva_id: reserva.id,
  }));

  const { error: seatsError } = await admin
    .from("asientos_ocupados")
    .insert(asientosRows);

  if (seatsError) throw seatsError;

  return reserva;
}
