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

export async function getHeroPeliculas(): Promise<Pelicula[]> {
  const fallback = [
    ...FALLBACK_PELICULAS.filter((p) => p.en_hero),
    ...FALLBACK_PROXIMAS.filter((p) => p.en_hero),
  ];

  if (!supabaseReady()) return fallback;

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("en_hero", true)
    .eq("activa", true)
    .order("estado") // en_cartelera antes que proximo
    .order("orden");

  if (error || !data?.length) return fallback;
  return data;
}

export async function getPeliculasEnCartelera(): Promise<Pelicula[]> {
  if (!supabaseReady()) return FALLBACK_PELICULAS;

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("estado", "en_cartelera")
    .eq("activa", true)
    .order("orden");

  if (error) return FALLBACK_PELICULAS;
  return data ?? FALLBACK_PELICULAS;
}

export async function getPeliculasProximas(): Promise<Pelicula[]> {
  if (!supabaseReady()) return FALLBACK_PROXIMAS;

  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("estado", "proximo")
    .eq("activa", true)
    .order("fecha_estreno");

  if (error) return FALLBACK_PROXIMAS;
  return data ?? FALLBACK_PROXIMAS;
}

export async function getPelicula(id: number): Promise<Pelicula | null> {
  if (!supabaseReady()) {
    return (
      FALLBACK_PELICULAS.find((m) => m.id === id) ??
      FALLBACK_PROXIMAS.find((m) => m.id === id) ??
      null
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
  if (!supabaseReady()) return getFallbackFunciones(peliculaId);

  const today = new Date().toISOString().split("T")[0];
  const until = new Date(Date.now() + dias * 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("funciones")
    .select("*, sala:salas(*)")
    .eq("pelicula_id", peliculaId)
    .eq("activa", true)
    .gte("fecha", today)
    .lte("fecha", until)
    .order("fecha")
    .order("hora");

  if (error || !data?.length) return getFallbackFunciones(peliculaId);
  return data as Funcion[];
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
    .select("*")
    .eq("funcion_id", funcionId);

  if (error) return [];
  return data ?? [];
}

export interface CreateReservaInput {
  funcion_id: number;
  email: string;
  nombre: string;
  telefono?: string;
  asientos: Array<{ fila: string; columna: number; tipo: "regular" | "vip" }>;
  total: number;
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

export async function registrarNotificacionEstreno(peliculaId: number, email: string) {
  if (!supabaseReady()) return;

  const { error } = await supabase
    .from("notificaciones_estreno")
    .upsert({ pelicula_id: peliculaId, email });

  if (error) throw error;
}
