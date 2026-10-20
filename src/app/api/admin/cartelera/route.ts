import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";
import { mismoTitulo, parseCartelera } from "@/lib/cartelera-texto";
import { tmdbEnrich } from "@/lib/tmdb";
import { getContenido } from "@/lib/contenido";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function rangoFechas(desde: string, hasta: string): string[] {
  const out: string[] = [];
  const d = new Date(desde + "T12:00:00Z");
  const fin = new Date(hasta + "T12:00:00Z");
  while (d <= fin && out.length < 15) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// POST /api/admin/cartelera
// Body: { texto, desde: "YYYY-MM-DD", hasta: "YYYY-MM-DD", retirarOtras: boolean }
// Reemplaza la programación de esas fechas por la del texto (una película por línea).
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const { texto, desde, hasta, retirarOtras } = body as { texto?: unknown; desde?: unknown; hasta?: unknown; retirarOtras?: unknown };

  if (typeof texto !== "string" || !texto.trim()) return NextResponse.json({ error: "Pega la cartelera" }, { status: 400 });
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde) return NextResponse.json({ error: "Revisa las fechas" }, { status: 400 });
  const fechas = rangoFechas(desde, hasta);
  if (fechas.length > 14) return NextResponse.json({ error: "Máximo 14 días por carga" }, { status: 400 });

  const { peliculas, errores } = parseCartelera(texto);
  if (errores.length) return NextResponse.json({ error: errores.join("\n") }, { status: 400 });
  if (!peliculas.length) return NextResponse.json({ error: "No encontré películas en el texto" }, { status: 400 });

  const db = createAdminClient();
  const log: string[] = [];

  // Sala: el sitio es informativo, todas las funciones van a la primera sala activa
  const { data: sala } = await db.from("salas").select("id").eq("activa", true).order("id").limit(1).maybeSingle();
  if (!sala) return NextResponse.json({ error: "No hay salas creadas. Crea una en Admin → Salas." }, { status: 400 });

  // Precio de referencia por día según las tarifas publicadas (solo informativo)
  const { tarifas } = await getContenido();
  const precioDia = (fecha: string) => {
    const dia = DIAS[new Date(fecha + "T12:00:00Z").getUTCDay()];
    const t = tarifas.find((x) => x.dias.includes(dia) && !x.horario) ?? tarifas.find((x) => x.dias.includes(dia)) ?? tarifas[0];
    return { precio_regular: t?.general ?? 0, precio_vip: t?.premium ?? 0 };
  };

  // ── 1. Películas: buscar o crear, completando datos con TMDB ───────────────
  const ids: { id: number; horas: string[] }[] = [];
  for (const p of peliculas) {
    const tmdb = await tmdbEnrich(p.titulo).catch(() => null);
    // Se muestra el nombre que usa el cine. TMDB suele traer el título de España
    // ("Vengadores: Endgame") o el original ("Whalefall"); solo se usa si es el
    // mismo nombre, para aprovechar sus tildes y mayúsculas.
    const titulo = tmdb?.titulo && mismoTitulo(tmdb.titulo, p.titulo) ? tmdb.titulo : p.titulo;
    const clasificacion = p.edad > 0 ? `+${p.edad}` : "Todo público";

    // Busca por el nombre escrito y por el título oficial de TMDB (sin distinguir mayúsculas)
    let existente: Record<string, unknown> & { id: number; titulo: string; estado: string; badge: string; badge_color: string } | null = null;
    for (const nombre of new Set([p.titulo, titulo, ...(tmdb?.titulo ? [tmdb.titulo] : [])])) {
      const escapado = nombre.replace(/[%_\\]/g, (c) => `\\${c}`);
      const { data } = await db.from("peliculas").select("*").ilike("titulo", escapado).limit(1).maybeSingle();
      if (data) { existente = data; break; }
    }

    const datosTmdb = tmdb ? {
      sinopsis:       tmdb.sinopsis || null,
      poster_url:     tmdb.poster_url || null,
      backdrop_url:   tmdb.backdrop_url || null,
      duracion:       tmdb.duracion || "",
      director:       tmdb.director || null,
      reparto:        tmdb.reparto,
      trailer_search: tmdb.trailer_search || null,
      genero:         tmdb.genero || "",
      filter_genres:  tmdb.genero ? [tmdb.genero.split(" / ")[0]] : [],
      accent_color:   tmdb.accent_color,
    } : {};

    if (existente) {
      // Solo se rellenan los campos vacíos: no se pisan cambios hechos a mano en el admin
      const relleno = Object.fromEntries(
        Object.entries(datosTmdb).filter(([k]) => {
          const actual = existente[k];
          return actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
        }),
      );
      await db.from("peliculas").update({
        ...relleno,
        titulo,
        estado: "en_cartelera",
        activa: true,
        edad_minima: p.edad,
        clasificacion,
        badge: existente.estado === "en_cartelera" ? existente.badge : "EN CARTELERA",
        badge_color: existente.estado === "en_cartelera" ? existente.badge_color : "bg-emerald-600",
      }).eq("id", existente.id);
      ids.push({ id: existente.id, horas: p.horas });
      log.push(existente.titulo === titulo
        ? `✓ ${titulo} — ya existía, actualizada`
        : `✓ ${titulo} — ya existía como "${existente.titulo}", renombrada`);
    } else {
      const { data: nueva, error: insErr } = await db.from("peliculas").insert({
        titulo,
        genero: "",
        duracion: "",
        ...datosTmdb,
        clasificacion,
        edad_minima: p.edad,
        fecha_estreno: tmdb?.fecha_estreno || null,
        badge: "ESTRENO",
        badge_color: "bg-[#CC1244]",
        estado: "en_cartelera",
        activa: true,
        orden: 0,
      }).select("id").single();
      if (insErr || !nueva) {
        log.push(`❌ ${titulo}: no se pudo crear (${insErr?.message ?? "error"})`);
        continue;
      }
      ids.push({ id: nueva.id, horas: p.horas });
      log.push(tmdb
        ? `✨ ${titulo} — creada con póster, sinopsis y tráiler de TMDB`
        : `⚠ ${titulo} — creada SIN datos de TMDB (no la encontré). Complétala en Admin → Películas`);
    }
  }

  // ── 2. Funciones: reemplazar la programación de esas fechas ────────────────
  const { data: previas } = await db.from("funciones").select("id").gte("fecha", desde).lte("fecha", hasta);
  const previasIds = (previas ?? []).map((f) => f.id);
  if (previasIds.length) {
    // Las funciones con reservas u órdenes de pago no se borran: se desactivan
    const { data: conReservas } = await db.from("reservas").select("funcion_id").in("funcion_id", previasIds);
    const { data: conOrdenes } = await db.from("ordenes_pago").select("funcion_id").in("funcion_id", previasIds);
    const usadas = new Set([...(conReservas ?? []), ...(conOrdenes ?? [])].map((r) => r.funcion_id));
    const borrar = previasIds.filter((id) => !usadas.has(id));
    if (borrar.length) await db.from("funciones").delete().in("id", borrar);
    if (usadas.size) await db.from("funciones").update({ activa: false }).in("id", [...usadas]);
  }

  const filas = ids.flatMap(({ id, horas }) =>
    fechas.flatMap((fecha) => horas.map((hora) => ({
      pelicula_id: id,
      sala_id: sala.id,
      fecha,
      hora,
      formato: "2D",
      ...precioDia(fecha),
      activa: true,
    }))),
  );
  const { error: funcErr } = await db.from("funciones").insert(filas);
  if (funcErr) {
    console.error("Error creando funciones:", funcErr);
    return NextResponse.json({ error: `No se pudieron crear las funciones: ${funcErr.message}`, log }, { status: 500 });
  }
  log.push(`🎬 ${filas.length} funciones creadas del ${desde} al ${hasta}`);

  // ── 3. Retirar películas que ya no están en cartelera ──────────────────────
  if (retirarOtras === true) {
    const { data: retiradas } = await db
      .from("peliculas")
      .update({ estado: "retirada", en_hero: false })
      .eq("estado", "en_cartelera")
      .not("id", "in", `(${ids.map((x) => x.id).join(",")})`)
      .select("titulo");
    if (retiradas?.length) log.push(`📦 Retiradas de cartelera: ${retiradas.map((r) => r.titulo).join(", ")}`);
  }

  revalidatePath("/");
  revalidatePath("/pelicula/[id]", "page");
  return NextResponse.json({ ok: true, log });
}
