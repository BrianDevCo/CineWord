import { NextRequest, NextResponse } from "next/server";
import { scoreGetCartelera } from "@/lib/score";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { tmdbEnrich, cleanScoreTitle } from "@/lib/tmdb";

// ── XML helpers ────────────────────────────────────────────────────────────────

function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  return xml.match(re)?.[1]?.trim() ?? "";
}

function getAttr(xml: string, attr: string): string {
  const re = new RegExp(`${attr}=["']([^"']+)["']`, "i");
  return xml.match(re)?.[1]?.trim() ?? "";
}

function getAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(re) ?? [];
}

/** Convierte "20260513" → "2026-05-13" */
function parseScoreFecha(f: string): string {
  if (f.length === 8) return `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}`;
  return f;
}

/** "15" o "1530" → "15:30:00" */
function parseScoreHora(h: string): string {
  const s = h.padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:00`;
}

function inferFormato(xml: string, nombre: string): "2D" | "3D" | "VIP" {
  const combined = (xml + " " + nombre).toUpperCase();
  if (combined.includes("VIP")) return "VIP";
  if (combined.includes("3D")) return "3D";
  return "2D";
}

interface ParsedTarifa {
  codigo: string;
  nombre: string;
  valor: number;
}

interface ParsedFuncion {
  score_sala_id: string;
  fecha: string;        // "YYYY-MM-DD"
  hora: string;         // "HH:MM:SS"
  formato: "2D" | "3D" | "VIP";
  tarifas: ParsedTarifa[];
}

interface ParsedPelicula {
  score_pelicula_id: string;
  titulo: string;
  clasificacion: string;
  duracion: string;
  sinopsis: string;
  funciones: ParsedFuncion[];
}

function parseTarifas(block: string): ParsedTarifa[] {
  const tarifaBlocks = getAllBlocks(block, "tarifa");
  return tarifaBlocks.map((t) => {
    const codigo = getTag(t, "codigo") || getTag(t, "cod") || getAttr(t, "cod") || getAttr(t, "codigo");
    const nombre = getTag(t, "nombre") || getTag(t, "nom") || getAttr(t, "nom") || getAttr(t, "nombre");
    const valorStr = getTag(t, "valor") || getTag(t, "val") || getAttr(t, "valor") || getAttr(t, "val");
    return { codigo, nombre, valor: parseInt(valorStr) || 0 };
  });
}

function parseFunciones(pelBlock: string): ParsedFuncion[] {
  const funcBlocks = getAllBlocks(pelBlock, "funcion");
  return funcBlocks.map((f) => {
    const sala = getTag(f, "sala") || getTag(f, "codigoSala") || getAttr(f, "sala") || getAttr(f, "codigoSala");
    const fechaRaw = getTag(f, "fecha") || getAttr(f, "fecha");
    const horaRaw = getTag(f, "hora") || getAttr(f, "hora");
    const min = getTag(f, "minuto") || getTag(f, "min") || getAttr(f, "minuto") || "00";
    const tarifas = parseTarifas(f);
    const fecha = parseScoreFecha(fechaRaw);
    const hora = parseScoreHora(horaRaw.padEnd(2, "0") + min.padStart(2, "0"));
    return {
      score_sala_id: sala,
      fecha,
      hora,
      formato: inferFormato(f, ""),
      tarifas,
    };
  });
}

function parseXML(xml: string): ParsedPelicula[] {
  const pelBlocks = getAllBlocks(xml, "pelicula");
  return pelBlocks.map((p) => {
    const codigo = getTag(p, "codigo") || getTag(p, "cod") || getAttr(p, "cod") || getAttr(p, "codigo");
    const titulo = getTag(p, "nombre") || getTag(p, "nom") || getTag(p, "titulo") || getAttr(p, "nom") || getAttr(p, "nombre");
    const clasificacion = getTag(p, "clasificacion") || getTag(p, "clasi") || getAttr(p, "clasificacion") || "";
    const duracion = getTag(p, "duracion") || getTag(p, "dur") || getAttr(p, "duracion") || "";
    const sinopsis = getTag(p, "sinopsis") || getTag(p, "descripcion") || "";
    return {
      score_pelicula_id: codigo,
      titulo,
      clasificacion,
      duracion: duracion ? `${duracion} min` : "",
      sinopsis,
      funciones: parseFunciones(p),
    };
  });
}

// ── Sync a Supabase ────────────────────────────────────────────────────────────

async function syncToSupabase(peliculas: ParsedPelicula[]) {
  const admin = createAdminClient();
  const log: string[] = [];
  let pelUpdated = 0, funcUpdated = 0;

  for (const pel of peliculas) {
    if (!pel.score_pelicula_id || !pel.titulo) continue;

    // Busca película existente por score_pelicula_id o titulo
    const { data: existing } = await admin
      .from("peliculas")
      .select("id")
      .eq("score_pelicula_id" as never, pel.score_pelicula_id)
      .maybeSingle();

    let peliculaId: number | null = existing?.id ?? null;

    if (!peliculaId) {
      // Intenta por título
      const { data: byTitle } = await admin
        .from("peliculas")
        .select("id")
        .ilike("titulo", pel.titulo)
        .maybeSingle();
      peliculaId = byTitle?.id ?? null;
    }

    if (peliculaId) {
      // Actualiza score_pelicula_id si no lo tenía
      await admin.from("peliculas").update({ score_pelicula_id: pel.score_pelicula_id } as never).eq("id", peliculaId);
      pelUpdated++;
      log.push(`✓ Película "${pel.titulo}" (id=${peliculaId}) → score_id=${pel.score_pelicula_id}`);
    } else {
      // Película nueva — crearla automáticamente y enriquecer desde TMDB
      const tituloLimpio = cleanScoreTitle(pel.titulo);
      const tmdb = await tmdbEnrich(tituloLimpio).catch(() => null);

      const nuevaPelicula = {
        titulo:            tituloLimpio,
        sinopsis:          tmdb?.sinopsis ?? pel.sinopsis ?? "",
        poster_url:        tmdb?.poster_url ?? "",
        backdrop_url:      tmdb?.backdrop_url ?? "",
        duracion:          tmdb?.duracion ?? pel.duracion ?? "",
        clasificacion:     tmdb?.clasificacion ?? pel.clasificacion ?? "PG",
        director:          tmdb?.director ?? "",
        reparto:           tmdb?.reparto ?? [],
        trailer_search:    tmdb?.trailer_search ?? "",
        genero:            tmdb?.genero ?? "",
        fecha_estreno:     tmdb?.fecha_estreno ?? null,
        accent_color:      tmdb?.accent_color ?? "#CC1244",
        badge:             "EN CARTELERA",
        badge_color:       "bg-emerald-600",
        estado:            "en_cartelera",
        activa:            true,
        orden:             0,
        filter_genres:     tmdb?.genero ? [tmdb.genero.split(" / ")[0]] : [],
        score_pelicula_id: pel.score_pelicula_id,
      };

      const { data: inserted, error: insertErr } = await admin
        .from("peliculas")
        .insert(nuevaPelicula as never)
        .select("id")
        .single();

      if (insertErr || !inserted) {
        log.push(`❌ No se pudo crear "${tituloLimpio}": ${insertErr?.message ?? "error"}`);
        continue;
      }

      peliculaId = inserted.id;
      pelUpdated++;
      const tmdbInfo = tmdb ? ` + TMDB #${tmdb.tmdb_id}` : " (sin TMDB)";
      log.push(`✨ Película NUEVA "${tituloLimpio}" creada (id=${peliculaId})${tmdbInfo}`);
    }

    // Sync funciones
    for (const fn of pel.funciones) {
      if (!fn.score_sala_id || !fn.fecha || !fn.hora) continue;

      // Busca sala por score_sala_id
      const { data: sala } = await admin
        .from("salas")
        .select("id")
        .eq("score_sala_id" as never, fn.score_sala_id)
        .maybeSingle();

      const salaId = sala?.id ?? null;
      if (!salaId) {
        log.push(`  ⚠ Sala score_id=${fn.score_sala_id} no encontrada — configúrala en /admin`);
        continue;
      }

      const tarifaReg = fn.tarifas.find((t) => !t.nombre.toUpperCase().includes("VIP"));
      const tarifaVip = fn.tarifas.find((t) => t.nombre.toUpperCase().includes("VIP"));

      const { data: existe } = await admin.from("funciones").select("id")
        .eq("pelicula_id", peliculaId).eq("sala_id", salaId).eq("fecha", fn.fecha).eq("hora", fn.hora).maybeSingle();
      if (existe) { funcUpdated++; continue; }

      const { error: inErr } = await admin.from("funciones").insert({
        pelicula_id: peliculaId,
        sala_id: salaId,
        fecha: fn.fecha,
        hora: fn.hora,
        formato: fn.formato,
        precio_regular: tarifaReg?.valor ?? 15000,
        precio_vip: tarifaVip?.valor ?? 25000,
        activa: true,
        score_sala_id: fn.score_sala_id,
        score_tarifa_regular: tarifaReg?.codigo ?? null,
        score_tarifa_vip: tarifaVip?.codigo ?? null,
        score_pelicula_id: pel.score_pelicula_id,
      } as never);
      if (inErr) { log.push(`  ❌ Insert función ${fn.fecha} ${fn.hora}: ${inErr.message}`); continue; }
      funcUpdated++;
    }
  }

  return { pelUpdated, funcUpdated, log };
}

// ── Route handler ──────────────────────────────────────────────────────────────

async function fetchCarteleraJson(): Promise<ParsedPelicula[]> {
  const base = process.env.SCORE_BASE_URL;
  const teatro = process.env.SCORE_TEATRO ?? "2";
  if (!base) throw new Error("SCORE_BASE_URL no configurado");

  const res = await fetch(`${base}/MobileComJson/variable41.json`, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Score JSON → HTTP ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr = (x: any) => Array.isArray(x) ? x : (x != null ? [x] : []);

  const peliculas: ParsedPelicula[] = [];

  for (const peli of arr(json?.Peliculas?.pelicula)) {
    const scoreId = String(peli?.["@id"] ?? "");
    const titulo  = String(peli?.["@nombre"] ?? "");
    const sinopsis = String(peli?.sinopsis ?? "");
    if (!scoreId || !titulo) continue;

    const funciones: ParsedFuncion[] = [];

    for (const cinema of arr(peli?.cinemas?.cinema)) {
      if (String(cinema?.["@id"] ?? "") !== teatro) continue;

      for (const sala of arr(cinema?.salas?.sala)) {
        const salaId = String(sala?.["@numeroSala"] ?? sala?.["@id"] ?? "");
        if (!salaId) continue;

        for (const fecha of arr(sala?.Fecha)) {
          const fechaUniv = String(fecha?.["@univ"] ?? "");
          if (fechaUniv.length !== 8) continue;
          const fechaISO = `${fechaUniv.slice(0,4)}-${fechaUniv.slice(4,6)}-${fechaUniv.slice(6,8)}`;

          for (const hora of arr(fecha?.hora)) {
            const militar = String(hora?.["@militar"] ?? "");
            if (!militar) continue;
            const hh = String(Math.floor(parseInt(militar) / 100)).padStart(2, "0");
            const mm = String(parseInt(militar) % 100).padStart(2, "0");
            const horaISO = `${hh}:${mm}:00`;

            const tarifas: ParsedTarifa[] = [];
            for (const zona of arr(hora?.TipoZona)) {
              for (const silla of arr(zona?.TipoSilla)) {
                for (const tarifa of arr(silla?.Tarifa)) {
                  const codigo = String(tarifa?.["@codigoTarifa"] ?? "");
                  const valor  = parseInt(tarifa?.["@valor"] ?? tarifa?.["@Valor"] ?? "0");
                  const nombre = String(zona?.["@nombreZona"] ?? "GENERAL");
                  if (codigo && valor) tarifas.push({ codigo, nombre, valor });
                }
              }
            }

            funciones.push({
              score_sala_id: salaId,
              fecha: fechaISO,
              hora: horaISO,
              formato: inferFormato("", titulo),
              tarifas,
            });
          }
        }
      }
    }

    peliculas.push({ score_pelicula_id: scoreId, titulo, sinopsis, clasificacion: "", duracion: "", funciones });
  }

  return peliculas;
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const dryRun = req.nextUrl.searchParams.get("dry_run") !== "false";

  try {
    // Usa JSON (incluye TODAS las películas, incluso ventasONline=false)
    const peliculas = await fetchCarteleraJson();

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        message: "Pasa ?dry_run=false para sincronizar a Supabase",
        parsed: peliculas,
      });
    }

    const result = await syncToSupabase(peliculas);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause;
    return NextResponse.json({ error: msg, cause: String(cause ?? "") }, { status: 500 });
  }
}
