// Datos estáticos de respaldo mientras no haya Supabase configurado.
// Se usan automáticamente cuando NEXT_PUBLIC_SUPABASE_URL tiene el valor placeholder.
import type { Pelicula, Funcion } from "./types";

const TMDB = "https://media.themoviedb.org/t/p/w500";
const TMDB_W = "https://image.tmdb.org/t/p/original";

export const FALLBACK_PELICULAS: Pelicula[] = [
  {
    id: 1, titulo: "Michael", genero: "Biopic / Drama",
    filter_genres: ["Drama"], duracion: "138 min", clasificacion: "PG-13",
    poster_url: `${TMDB}/j57QWe3OoaXL9Idi9gLtsAybWLP.jpg`,
    backdrop_url: `${TMDB_W}/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg`,
    badge: "ESTRENO", badge_color: "bg-[#CC1244]",
    sinopsis: "La historia épica de Michael Jackson, el artista más grande de todos los tiempos. Desde sus comienzos con los Jackson 5 hasta convertirse en el Rey del Pop, esta película revela los momentos más íntimos, las batallas personales y el legado imborrable de un hombre que cambió la música para siempre.",
    director: "Antoine Fuqua",
    reparto: ["Jaafar Jackson", "Nia Long", "Colman Domingo", "Miles Teller"],
    trailer_search: "Michael Jackson biopic 2025 trailer oficial",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 1,
    accent_color: "#CC1244", created_at: "",
  },
  {
    id: 2, titulo: "El Diablo Viste a la Moda 2", genero: "Comedia / Drama",
    filter_genres: ["Drama", "Comedia"], duracion: "115 min", clasificacion: "PG",
    poster_url: `${TMDB}/sRTYF65JvbHLoC3LoBj4UKYqIlA.jpg`, backdrop_url: null,
    badge: "EN CARTELERA", badge_color: "bg-emerald-600",
    sinopsis: "Miranda Priestly regresa más implacable que nunca al mundo de la moda de lujo. Cuando sus caminos se cruzan de nuevo con Andy Sachs, una revelación explosiva pondrá en jaque los cimientos de la industria de la moda.",
    director: "David Frankel",
    reparto: ["Meryl Streep", "Anne Hathaway", "Emily Blunt", "Stanley Tucci"],
    trailer_search: "The Devil Wears Prada 2 trailer oficial 2025",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 2,
    accent_color: "#CC1244", created_at: "",
  },
  {
    id: 3, titulo: "La Momia", genero: "Terror / Aventura",
    filter_genres: ["Terror"], duracion: "112 min", clasificacion: "PG-13",
    poster_url: `${TMDB}/8L8efNkz8rUmwR7sV0g3vnC9yjn.jpg`, backdrop_url: null,
    badge: "EN CARTELERA", badge_color: "bg-emerald-600",
    sinopsis: "Una expedición arqueológica en el desierto de Egipto desentierra accidentalmente a una poderosa sacerdotisa sepultada viva hace miles de años. Al despertar, la criatura trae consigo una oscuridad sin precedentes.",
    director: "Lee Cronin",
    reparto: ["Tom Hiddleston", "Sofia Boutella", "Annabelle Wallis", "Russell Crowe"],
    trailer_search: "La Momia 2025 trailer oficial",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 3,
    accent_color: "#CC1244", created_at: "",
  },
  {
    id: 4, titulo: "Te Van a Matar", genero: "Thriller / Suspenso",
    filter_genres: ["Acción"], duracion: "98 min", clasificacion: "R",
    poster_url: `${TMDB}/6oI4oQKTWMVUlr8Ivqydp28Ruu6.jpg`, backdrop_url: null,
    badge: "EN CARTELERA", badge_color: "bg-emerald-600",
    sinopsis: "Un detective retirado recibe un misterioso mensaje que lo obliga a regresar al caso que arruinó su carrera. Con el tiempo en su contra y sin saber en quién confiar, deberá descubrir la verdad.",
    director: "James Wan",
    reparto: ["Josh Hartnett", "Maika Monroe", "Ben Mendelsohn", "Fionn Whitehead"],
    trailer_search: "They Will Kill You 2025 trailer oficial",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 4,
    accent_color: "#CC1244", created_at: "",
  },
  {
    id: 5, titulo: "Turbulencia", genero: "Acción / Suspenso",
    filter_genres: ["Acción"], duracion: "105 min", clasificacion: "PG-13",
    poster_url: `${TMDB}/jRuiKL4S9UpLma2ZlM47xIu2gbe.jpg`, backdrop_url: null,
    badge: "EN CARTELERA", badge_color: "bg-emerald-600",
    sinopsis: "A bordo de un vuelo transatlántico, una amenaza invisible comienza a afectar a los pasajeros uno a uno. Con 38,000 pies de altura y sin posibilidad de aterrizar, la tensión llega al límite.",
    director: "Roland Emmerich",
    reparto: ["Taron Egerton", "Naomi Watts", "Jamie Foxx", "Lucy Boynton"],
    trailer_search: "Turbulence 2025 movie trailer oficial",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 5,
    accent_color: "#CC1244", created_at: "",
  },
  {
    id: 6, titulo: "Soy Múcura", genero: "Comedia / Familiar",
    filter_genres: ["Comedia", "Familiar"], duracion: "95 min", clasificacion: "G",
    poster_url: `${TMDB}/srfONbR9dDLxKVxAqqVOU7OA9Ij.jpg`, backdrop_url: null,
    badge: "NACIONAL", badge_color: "bg-yellow-600",
    sinopsis: "Múcura es un simpático duende colombiano con una misión especial: proteger los secretos de la naturaleza. Una aventura llena de humor, magia y amor por Colombia.",
    director: "Carlos Moreno",
    reparto: ["Sebastián Eslava", "María Cecilia Botero", "Frank Ramírez", "Carolina Gaitán"],
    trailer_search: "Soy Múcura pelicula colombiana trailer",
    estado: "en_cartelera", fecha_estreno: null, activa: true, orden: 6,
    accent_color: "#CC1244", created_at: "",
  },
];

export const FALLBACK_PROXIMAS: Pelicula[] = [
  {
    id: 7, titulo: "Venom: El Último Baile", genero: "Acción / Superhéroes",
    filter_genres: ["Acción"], duracion: "Por confirmar", clasificacion: "PG-13",
    poster_url: `${TMDB}/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg`, backdrop_url: null,
    badge: "PRÓXIMAMENTE", badge_color: "bg-blue-600",
    sinopsis: "El capítulo final de la saga más oscura del universo de los superhéroes.",
    director: null, reparto: [],
    trailer_search: null, estado: "proximo", fecha_estreno: "2026-05-16",
    activa: true, orden: 7, accent_color: "#4488ff", created_at: "",
  },
  {
    id: 8, titulo: "Núremberg", genero: "Drama / Historia",
    filter_genres: ["Drama"], duracion: "Por confirmar", clasificacion: "PG-13",
    poster_url: `${TMDB}/7cWTGH2svfNHWVRjsfKIBob9pDj.jpg`, backdrop_url: null,
    badge: "PRÓXIMAMENTE", badge_color: "bg-yellow-600",
    sinopsis: "El juicio que cambió la historia del mundo, llevado al cine con épica precisión.",
    director: null, reparto: [],
    trailer_search: null, estado: "proximo", fecha_estreno: "2026-05-30",
    activa: true, orden: 8, accent_color: "#cc9900", created_at: "",
  },
  {
    id: 9, titulo: "Suerte, Diviértete, No Mueras", genero: "Comedia / Aventura",
    filter_genres: ["Comedia"], duracion: "Por confirmar", clasificacion: "PG-13",
    poster_url: `${TMDB}/rWcfOdY7TU6lTdazWj0ebDZnAfO.jpg`, backdrop_url: null,
    badge: "PRÓXIMAMENTE", badge_color: "bg-green-600",
    sinopsis: "Una comedia de aventuras que redefine el género con un humor explosivo.",
    director: null, reparto: [],
    trailer_search: null, estado: "proximo", fecha_estreno: "2026-06-06",
    activa: true, orden: 9, accent_color: "#44cc88", created_at: "",
  },
  {
    id: 10, titulo: "ChaO", genero: "Drama / Thriller",
    filter_genres: ["Drama"], duracion: "Por confirmar", clasificacion: "R",
    poster_url: `${TMDB}/m723xGi6lyklfsTPdtgEtYJSKcw.jpg`, backdrop_url: null,
    badge: "PRÓXIMAMENTE", badge_color: "bg-pink-600",
    sinopsis: "Un thriller psicológico que te mantendrá adivinando hasta el último segundo.",
    director: null, reparto: [],
    trailer_search: null, estado: "proximo", fecha_estreno: "2026-06-20",
    activa: true, orden: 10, accent_color: "#cc4488", created_at: "",
  },
];

// Genera funciones de fallback para los próximos 2 días basadas en el weekSchedule original
function pad(n: number) { return String(n).padStart(2, "0"); }

function dateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isWeekend(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

interface WeekScheduleEntry { format: string; horarios: string[] }
interface WeekSchedule { weekday: WeekScheduleEntry[]; weekend: WeekScheduleEntry[] }

const SCHEDULES: Record<number, WeekSchedule> = {
  1: { // Michael — 2D + VIP
    weekday: [
      { format: "2D",  horarios: ["14:00", "17:00", "20:00"] },
      { format: "VIP", horarios: ["18:30", "21:30"] },
    ],
    weekend: [
      { format: "2D",  horarios: ["12:00", "14:30", "17:00", "20:00", "22:30"] },
      { format: "VIP", horarios: ["16:00", "19:00", "22:00"] },
    ],
  },
  2: { // Diablo Moda — 2D + 3D + VIP
    weekday: [
      { format: "2D",  horarios: ["13:30", "16:30", "19:30"] },
      { format: "3D",  horarios: ["15:00", "18:00"] },
      { format: "VIP", horarios: ["20:30"] },
    ],
    weekend: [
      { format: "2D",  horarios: ["12:00", "14:30", "17:00", "19:30", "22:00"] },
      { format: "3D",  horarios: ["13:00", "15:30", "18:30", "21:00"] },
      { format: "VIP", horarios: ["16:00", "19:00", "21:30"] },
    ],
  },
  3: { // La Momia — 2D + 3D
    weekday: [
      { format: "2D", horarios: ["15:30", "18:30", "21:30"] },
      { format: "3D", horarios: ["17:00", "20:00"] },
    ],
    weekend: [
      { format: "2D", horarios: ["13:00", "15:30", "18:00", "21:00", "23:30"] },
      { format: "3D", horarios: ["14:30", "17:30", "20:30", "23:00"] },
    ],
  },
  4: { // Te Van a Matar — 2D
    weekday: [{ format: "2D", horarios: ["12:00", "14:30", "17:00", "19:30", "22:00"] }],
    weekend: [{ format: "2D", horarios: ["11:00", "13:30", "15:30", "17:30", "19:30", "21:30", "23:30"] }],
  },
  5: { // Turbulencia — 2D + VIP
    weekday: [
      { format: "2D",  horarios: ["14:00", "17:00", "20:00"] },
      { format: "VIP", horarios: ["21:00"] },
    ],
    weekend: [
      { format: "2D",  horarios: ["12:30", "15:00", "17:30", "20:00", "22:30"] },
      { format: "VIP", horarios: ["16:30", "19:30", "22:00"] },
    ],
  },
  6: { // Soy Múcura — 2D
    weekday: [{ format: "2D", horarios: ["13:00", "15:30", "18:00"] }],
    weekend: [{ format: "2D", horarios: ["10:00", "12:30", "15:00", "17:30", "20:00"] }],
  },
};

let _funcionesCache: Funcion[] | null = null;

export function getFallbackFunciones(peliculaId: number): Funcion[] {
  if (!_funcionesCache) {
    const all: Funcion[] = [];
    let id = 1;
    for (let day = 0; day < 7; day++) {
      const fecha = dateStr(day);
      const wknd = isWeekend(day);
      for (const [pid, sched] of Object.entries(SCHEDULES)) {
        const entries = wknd ? sched.weekend : sched.weekday;
        for (const entry of entries) {
          for (const hora of entry.horarios) {
            all.push({
              id: id++,
              pelicula_id: Number(pid),
              sala_id: entry.format === "VIP" ? 3 : entry.format === "3D" ? 2 : 1,
              fecha,
              hora: hora + ":00",
              formato: entry.format as "2D" | "3D" | "VIP",
              precio_regular: entry.format === "3D" ? 18000 : 15000,
              precio_vip: 25000,
              activa: true,
            });
          }
        }
      }
    }
    _funcionesCache = all;
  }
  return _funcionesCache.filter((f) => f.pelicula_id === peliculaId);
}
