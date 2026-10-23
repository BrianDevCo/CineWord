const BASE = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p";

function apiKey() {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY no configurado");
  return k;
}

// Limpia títulos de Score: "MICHAEL GEN 2D GNR DOB" → "MICHAEL"
export function cleanScoreTitle(raw: string): string {
  return raw
    .replace(/\b(GEN|GNR|DOB|DUB|SUB|3D|2D|4DX|IMAX|VIP|SON|ESP|LAT)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface TmdbMovie {
  tmdb_id: number;
  titulo: string;
  sinopsis: string;
  poster_url: string;
  backdrop_url: string;
  duracion: string;
  clasificacion: string;
  director: string;
  reparto: string[];
  trailer_search: string; // URL YouTube — se guarda en columna trailer_search
  fecha_estreno: string;
  genero: string;
  accent_color: string;
  hero_imagenes: string[]; // 2 fondos sugeridos para el hero
}

interface TmdbSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
}

interface TmdbDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  release_date: string;
  genres: { id: number; name: string }[];
  certification?: string;
}

interface TmdbVideo {
  type: string;
  site: string;
  key: string;
  official: boolean;
}

interface TmdbCredits {
  crew: { job: string; name: string }[];
  cast: { name: string; order: number }[];
}

interface TmdbRelease {
  iso_3166_1: string;
  release_dates: { certification: string; type: number }[];
}

async function fetchTmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("language", "es-CO");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`TMDB ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function tmdbSearch(title: string, year?: string): Promise<number | null> {
  const clean = cleanScoreTitle(title);
  // Si no viene año, usa el año actual — todas las películas en cartelera son recientes
  const searchYear = year ?? new Date().getFullYear().toString();

  const data = await fetchTmdb<{ results: TmdbSearchResult[] }>("/search/movie", { query: clean, year: searchYear });

  // Si no encontró con el año exacto, reintenta con año-1 (por si es estreno tardío)
  let results = data.results;
  if (!results.length) {
    const prevYear = (parseInt(searchYear) - 1).toString();
    const retry = await fetchTmdb<{ results: TmdbSearchResult[] }>("/search/movie", { query: clean, year: prevYear });
    results = retry.results;
  }
  // Si sigue sin resultados, busca sin año como último recurso
  if (!results.length) {
    const noYear = await fetchTmdb<{ results: TmdbSearchResult[] }>("/search/movie", { query: clean });
    results = noYear.results;
  }
  if (!results.length) return null;

  // Prefiere título exacto, luego el que tiene backdrop
  const sorted = [...results].sort((a, b) => {
    const cleanLower = clean.toLowerCase();
    const aExact = a.title.toLowerCase() === cleanLower ? 0 : 1;
    const bExact = b.title.toLowerCase() === cleanLower ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return (b.backdrop_path ? 1 : 0) - (a.backdrop_path ? 1 : 0);
  });
  return sorted[0].id;
}

export interface TmdbImagen {
  url: string;        // w1280, para mostrar
  thumb: string;      // w300, para la galería del admin
  idioma: string | null;
  votos: number;
}

interface TmdbImagesResponse {
  backdrops: { file_path: string; iso_639_1: string | null; vote_average: number; width: number }[];
}

/** Fondos de la película: primero los que no tienen texto (mejores para el hero) */
export async function tmdbBackdrops(tmdbId: number, max = 40): Promise<TmdbImagen[]> {
  const data = await fetchTmdb<TmdbImagesResponse>(`/movie/${tmdbId}/images`, {
    include_image_language: "null,es,en",
  });
  return [...(data.backdrops ?? [])]
    .sort((a, b) => (a.iso_639_1 === null ? 0 : 1) - (b.iso_639_1 === null ? 0 : 1) || b.vote_average - a.vote_average)
    .slice(0, max)
    .map((b) => ({
      url: `${IMG}/w1280${b.file_path}`,
      thumb: `${IMG}/w300${b.file_path}`,
      idioma: b.iso_639_1,
      votos: b.vote_average,
    }));
}

/** Acepta solo imágenes de TMDB (lo que se guarda en hero_imagenes) */
export function esImagenTmdb(url: unknown): url is string {
  return typeof url === "string" && /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\/[\w-]+\.(jpg|png|webp)$/.test(url);
}

export async function tmdbEnrich(titleOrId: string | number, year?: string): Promise<TmdbMovie | null> {
  try {
    let tmdbId: number;
    if (typeof titleOrId === "number") {
      tmdbId = titleOrId;
    } else {
      const found = await tmdbSearch(titleOrId, year);
      if (!found) return null;
      tmdbId = found;
    }

    // Detalles + videos + créditos + clasificación en paralelo
    const [details, videos, credits, releases, fondos] = await Promise.all([
      fetchTmdb<TmdbDetails>(`/movie/${tmdbId}`),
      fetchTmdb<{ results: TmdbVideo[] }>(`/movie/${tmdbId}/videos`),
      fetchTmdb<TmdbCredits>(`/movie/${tmdbId}/credits`),
      fetchTmdb<{ results: TmdbRelease[] }>(`/movie/${tmdbId}/release_dates`),
      tmdbBackdrops(tmdbId, 2).catch(() => [] as TmdbImagen[]),
    ]);

    // Trailer — busca tráiler oficial de YouTube en español primero, luego cualquiera
    const allTrailers = videos.results.filter(v => v.type === "Trailer" && v.site === "YouTube");
    const trailer = allTrailers.find(v => v.official) ?? allTrailers[0] ?? null;

    // Director
    const director = credits.crew.find(c => c.job === "Director")?.name ?? "";

    // Reparto — primeros 5
    const reparto = credits.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map(c => c.name);

    // Clasificación Colombia/US
    const col = releases.results.find(r => r.iso_3166_1 === "CO");
    const us  = releases.results.find(r => r.iso_3166_1 === "US");
    const certEntry = (col ?? us)?.release_dates.find(r => r.certification) ?? null;
    const clasificacion = certEntry?.certification ?? "PG";

    // Géneros
    const genero = details.genres.slice(0, 2).map(g => g.name).join(" / ") || "Drama";

    // Accent color por defecto según género principal
    const genreAccent: Record<string, string> = {
      Terror: "#8B0000", "Ciencia Ficción": "#0044CC", Acción: "#CC4400",
      Romance: "#CC0066", Animación: "#CC7700", Comedia: "#006600",
    };
    const accent_color = genreAccent[details.genres[0]?.name ?? ""] ?? "#CC1244";

    return {
      tmdb_id:      tmdbId,
      titulo:       details.title,
      sinopsis:     details.overview,
      poster_url:   details.poster_path   ? `${IMG}/w500${details.poster_path}`   : "",
      backdrop_url: details.backdrop_path ? `${IMG}/w1280${details.backdrop_path}` : "",
      duracion:     details.runtime ? `${details.runtime} min` : "",
      clasificacion,
      director,
      reparto,
      trailer_search: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
      fecha_estreno: details.release_date ?? "",
      genero,
      accent_color,
      hero_imagenes: fondos.map((f) => f.url),
    };
  } catch (e) {
    console.error("TMDB enrich error:", e);
    return null;
  }
}
