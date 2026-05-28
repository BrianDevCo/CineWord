import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arr = (x: any) => Array.isArray(x) ? x : (x != null ? [x] : []);

function scoreToIso(fecha: string): string {
  return `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`;
}

// Limpia nombres internos de Score: "MICHAEL GEN 2D GNR DOB" → "MICHAEL"
function limpiarNombre(nombre: string): string {
  return nombre.replace(/\s+(GEN|ORIG?|GNR|DOB|ORI|3D|2D)\b.*$/i, "").trim();
}

function militarToTime(militar: string): string {
  const padded = militar.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:00`;
}

function getPrecio(fechaIso: string): { regular: number; vip: number } {
  const dow = new Date(fechaIso + "T12:00:00").getDay();
  if (dow === 2 || dow === 3) return { regular: 7000,  vip: 10000 }; // Mar/Mié
  if (dow === 1 || dow === 4) return { regular: 12000, vip: 18000 }; // Lun/Jue
  return { regular: 14000, vip: 20000 };                              // Vie/Sáb/Dom
}

type FuncionScore = {
  scorePeliculaId: string;
  nombrePelicula:  string;
  scoreSalaId:     string;
  fecha:           string; // "yyyy-mm-dd"
  hora:            string; // "HH:MM:00"
  tarifaRegular:   string;
  tarifaVip:       string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsearCartelera(json: any, teatroId: string) {
  const peliculasMap = new Map<string, string>(); // scoreId → nombre
  const funciones: FuncionScore[] = [];

  const peliculas = arr(json?.Peliculas?.pelicula);
  for (const peli of peliculas) {
    const peliId     = String(peli?.["@id"]     ?? "");
    const peliNombre = String(peli?.["@nombre"] ?? "");
    if (!peliId) continue;

    for (const cinema of arr(peli?.cinemas?.cinema)) {
      if (String(cinema?.["@id"]) !== teatroId) continue;

      peliculasMap.set(peliId, peliNombre);

      for (const sala of arr(cinema?.salas?.sala)) {
        const salaId = String(sala?.["@numeroSala"] ?? "");
        if (!salaId) continue;

        for (const fecha of arr(sala?.Fecha)) {
          const fechaUniv = String(fecha?.["@univ"] ?? "");
          if (fechaUniv.length !== 8) continue;
          const fechaIso = scoreToIso(fechaUniv);

          for (const hora of arr(fecha?.hora)) {
            if (hora?.["@ventasONline"] !== "true") continue;
            const militar = String(hora?.["@militar"] ?? "");
            if (!militar) continue;

            let tarifaRegular = "", tarifaVip = "";
            for (const zona of arr(hora?.TipoZona)) {
              const nombreZona = String(zona?.["@nombreZona"] ?? "").toUpperCase();
              const tarifa = zona?.TipoSilla?.Tarifa;
              if (!tarifa || tarifa?.["@validoTeceros"] !== "Si") continue;
              const codigo = String(tarifa?.["@codigoTarifa"] ?? "");
              if (!codigo) continue;
              if (nombreZona === "PREMIUM" && !tarifaVip) tarifaVip = codigo;
              else if (!tarifaRegular) tarifaRegular = codigo;
            }
            if (!tarifaRegular) continue;

            funciones.push({
              scorePeliculaId: peliId,
              nombrePelicula:  peliNombre,
              scoreSalaId:     salaId,
              fecha:           fechaIso,
              hora:            militarToTime(militar),
              tarifaRegular,
              tarifaVip:       tarifaVip || tarifaRegular,
            });
          }
        }
      }
    }
  }

  return {
    peliculas: Array.from(peliculasMap.entries()).map(([id, nombre]) => ({ id, nombre })),
    funciones,
  };
}

// GET — solo muestra qué hay en el JSON de Score, sin tocar la BD
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const base   = process.env.SCORE_BASE_URL;
  const teatro = process.env.SCORE_TEATRO ?? "2";
  if (!base) return NextResponse.json({ error: "SCORE_BASE_URL no configurado" }, { status: 503 });

  let json: unknown;
  try {
    const res = await fetch(`${base}/MobileComJson/variable41.json`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(30000),
    });
    json = await res.json();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }

  const { peliculas, funciones } = parsearCartelera(json, teatro);
  const hoy = new Date().toISOString().split("T")[0];

  return NextResponse.json({
    peliculas,
    funciones_por_pelicula: peliculas.map(p => ({
      score_id:  p.id,
      nombre:    limpiarNombre(p.nombre),
      funciones: funciones
        .filter(f => f.scorePeliculaId === p.id && f.fecha >= hoy)
        .map(f => `${f.fecha} ${f.hora.slice(0,5)} sala${f.scoreSalaId}`),
    })),
  });
}

export async function POST() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  if (!adminReady()) return NextResponse.json({ error: "Admin no configurado" }, { status: 503 });

  const base   = process.env.SCORE_BASE_URL;
  const teatro = process.env.SCORE_TEATRO ?? "2";
  if (!base) return NextResponse.json({ error: "SCORE_BASE_URL no configurado" }, { status: 503 });

  // ── 1. Fetch JSON de Score ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any;
  try {
    const res = await fetch(`${base}/MobileComJson/variable41.json`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(30000),
    });
    json = await res.json();
  } catch (e) {
    return NextResponse.json({ error: `No se pudo conectar a Score: ${String(e)}` }, { status: 502 });
  }

  const { peliculas: peliculasScore, funciones: funcionesScore } = parsearCartelera(json, teatro);
  if (!peliculasScore.length) {
    return NextResponse.json({ error: "El JSON de Score no tiene películas para este teatro" }, { status: 422 });
  }

  const db  = createAdminClient();
  const hoy = new Date().toISOString().split("T")[0];

  // ── 2. Sync películas ─────────────────────────────────────────────────────────
  const { data: peliculasExistentes } = await db
    .from("peliculas")
    .select("id, score_pelicula_id");

  const peliculaMap = new Map<string, number>(); // scoreId → db id
  for (const p of peliculasExistentes ?? []) {
    if (p.score_pelicula_id) peliculaMap.set(p.score_pelicula_id, p.id);
  }

  let peliculasCreadas = 0;
  let peliculasLinkeadas = 0;
  for (const peli of peliculasScore) {
    if (peliculaMap.has(peli.id)) continue;

    const tituloLimpio = limpiarNombre(peli.nombre);

    // Buscar película existente con título parecido (sin score_pelicula_id)
    const { data: existente } = await db
      .from("peliculas")
      .select("id")
      .ilike("titulo", `${tituloLimpio}%`)
      .is("score_pelicula_id", null)
      .limit(1)
      .single();

    if (existente) {
      // Linkear la existente con el ID de Score
      await db.from("peliculas")
        .update({ score_pelicula_id: peli.id, estado: "en_cartelera", activa: true })
        .eq("id", existente.id);
      peliculaMap.set(peli.id, existente.id);
      peliculasLinkeadas++;
    } else {
      // Crear nueva con título limpio
      const { data: nueva } = await db
        .from("peliculas")
        .insert({
          titulo:            tituloLimpio,
          genero:            "Por definir",
          filter_genres:     [],
          duracion:          "Por definir",
          clasificacion:     "Por definir",
          estado:            "en_cartelera",
          activa:            true,
          score_pelicula_id: peli.id,
          badge:             "EN CARTELERA",
          badge_color:       "bg-emerald-600",
        })
        .select("id")
        .single();
      if (nueva) { peliculaMap.set(peli.id, nueva.id); peliculasCreadas++; }
    }
  }

  // ── 3. Salas ──────────────────────────────────────────────────────────────────
  const { data: salasData } = await db
    .from("salas")
    .select("id, tipo, score_sala_id")
    .not("score_sala_id", "is", null);

  const salaMap = new Map<string, { id: number; tipo: string }>();
  for (const s of salasData ?? []) {
    if (s.score_sala_id) salaMap.set(s.score_sala_id, { id: s.id, tipo: s.tipo });
  }

  // ── 4. Funciones existentes (futuras con Score data) ─────────────────────────
  const { data: funcionesExistentes } = await db
    .from("funciones")
    .select("id, score_pelicula_id, score_sala_id, fecha, hora")
    .gte("fecha", hoy)
    .not("score_pelicula_id", "is", null);

  const existingByKey = new Map<string, number>(); // "peli|sala|fecha|hora" → id
  for (const f of funcionesExistentes ?? []) {
    const key = `${f.score_pelicula_id}|${f.score_sala_id}|${f.fecha}|${f.hora.slice(0, 5)}`;
    existingByKey.set(key, f.id);
  }

  // Claves que trae el JSON de Score (solo futuras)
  const scoreKeys = new Set<string>();
  for (const f of funcionesScore) {
    if (f.fecha < hoy) continue;
    scoreKeys.add(`${f.scorePeliculaId}|${f.scoreSalaId}|${f.fecha}|${f.hora.slice(0, 5)}`);
  }

  // ── 5. Desactivar funciones que ya no están en Score ────────────────────────
  let funcionesDesactivadas = 0;
  for (const [key, id] of existingByKey) {
    if (!scoreKeys.has(key)) {
      await db.from("funciones").update({ activa: false }).eq("id", id);
      funcionesDesactivadas++;
    }
  }

  // ── 6. Crear funciones nuevas ────────────────────────────────────────────────
  let funcionesCreadas = 0;
  for (const f of funcionesScore) {
    if (f.fecha < hoy) continue;

    const peliculaId = peliculaMap.get(f.scorePeliculaId);
    const salaInfo   = salaMap.get(f.scoreSalaId);
    if (!peliculaId || !salaInfo) continue;

    const key = `${f.scorePeliculaId}|${f.scoreSalaId}|${f.fecha}|${f.hora.slice(0, 5)}`;
    if (existingByKey.has(key)) continue; // ya existe

    const precios = getPrecio(f.fecha);
    await db.from("funciones").insert({
      pelicula_id:          peliculaId,
      sala_id:              salaInfo.id,
      fecha:                f.fecha,
      hora:                 f.hora,
      formato:              salaInfo.tipo,
      precio_regular:       precios.regular,
      precio_vip:           precios.vip,
      activa:               true,
      score_pelicula_id:    f.scorePeliculaId,
      score_sala_id:        f.scoreSalaId,
      score_tarifa_regular: f.tarifaRegular,
      score_tarifa_vip:     f.tarifaVip,
    });
    funcionesCreadas++;
  }

  // ── 7. Retirar películas de Score que ya no están en el JSON ─────────────────
  const scoreIds = new Set(peliculasScore.map(p => p.id));
  let peliculasRetiradas = 0;
  for (const p of peliculasExistentes ?? []) {
    if (p.score_pelicula_id && !scoreIds.has(p.score_pelicula_id)) {
      await db.from("peliculas")
        .update({ estado: "retirada", activa: false })
        .eq("id", p.id);
      peliculasRetiradas++;
    }
  }

  return NextResponse.json({
    ok: true,
    resumen: {
      peliculas_en_json:      peliculasScore.length,
      peliculas_linkeadas:    peliculasLinkeadas,
      peliculas_creadas:      peliculasCreadas,
      peliculas_retiradas:    peliculasRetiradas,
      funciones_en_json:      funcionesScore.filter(f => f.fecha >= hoy).length,
      funciones_creadas:      funcionesCreadas,
      funciones_desactivadas: funcionesDesactivadas,
    },
  });
}
