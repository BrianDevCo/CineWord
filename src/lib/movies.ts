const TMDB   = "https://media.themoviedb.org/t/p/w500";
const TMDB_W = "https://image.tmdb.org/t/p/original";

export interface FormatTimes {
  format: string;
  horarios: string[];
}

export interface WeekSchedule {
  /** Lunes a Viernes */
  weekday: FormatTimes[];
  /** Sábado y Domingo */
  weekend: FormatTimes[];
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  filterGenres: string[];
  duration: string;
  rating: string;
  formats: string[];
  poster: string;
  backdrop: string | null;
  badge: string;
  badgeColor: string;
  synopsis: string;
  director: string;
  cast: string[];
  trailerSearch: string;
  weekSchedule: WeekSchedule;
}

export const movies: Movie[] = [
  {
    id: 1,
    title: "Michael",
    genre: "Biopic / Drama",
    filterGenres: ["Drama"],
    duration: "138 min",
    rating: "PG-13",
    formats: ["2D", "VIP"],
    poster: `${TMDB}/j57QWe3OoaXL9Idi9gLtsAybWLP.jpg`,
    backdrop: `${TMDB_W}/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg`,
    badge: "ESTRENO",
    badgeColor: "bg-[#CC1244]",
    synopsis:
      "La historia épica de Michael Jackson, el artista más grande de todos los tiempos. Desde sus comienzos con los Jackson 5 hasta convertirse en el Rey del Pop, esta película revela los momentos más íntimos, las batallas personales y el legado imborrable de un hombre que cambió la música para siempre. Protagonizada por Jaafar Jackson, sobrino de Michael, y dirigida por Antoine Fuqua.",
    director: "Antoine Fuqua",
    cast: ["Jaafar Jackson", "Nia Long", "Colman Domingo", "Miles Teller"],
    trailerSearch: "Michael Jackson biopic 2025 trailer oficial",
    weekSchedule: {
      weekday: [
        { format: "2D",  horarios: ["2:00 PM", "5:00 PM", "8:00 PM"] },
        { format: "VIP", horarios: ["6:30 PM", "9:30 PM"] },
      ],
      weekend: [
        { format: "2D",  horarios: ["12:00 PM", "2:30 PM", "5:00 PM", "8:00 PM", "10:30 PM"] },
        { format: "VIP", horarios: ["4:00 PM", "7:00 PM", "10:00 PM"] },
      ],
    },
  },
  {
    id: 2,
    title: "El Diablo Viste a la Moda 2",
    genre: "Comedia / Drama",
    filterGenres: ["Drama", "Comedia"],
    duration: "115 min",
    rating: "PG",
    formats: ["2D", "3D", "VIP"],
    poster: `${TMDB}/sRTYF65JvbHLoC3LoBj4UKYqIlA.jpg`,
    backdrop: null,
    badge: "EN CARTELERA",
    badgeColor: "bg-emerald-600",
    synopsis:
      "Miranda Priestly regresa más implacable que nunca al mundo de la moda de lujo. Años después de los eventos de la primera película, Andy Sachs se ha convertido en una destacada periodista de investigación. Cuando sus caminos se cruzan de nuevo, una revelación explosiva pondrá en jaque los cimientos de la industria de la moda. Elegancia, intriga y poder en una secuela que supera a su predecesora.",
    director: "David Frankel",
    cast: ["Meryl Streep", "Anne Hathaway", "Emily Blunt", "Stanley Tucci"],
    trailerSearch: "The Devil Wears Prada 2 trailer oficial 2025",
    weekSchedule: {
      weekday: [
        { format: "2D",  horarios: ["1:30 PM", "4:30 PM", "7:30 PM"] },
        { format: "3D",  horarios: ["3:00 PM", "6:00 PM"] },
        { format: "VIP", horarios: ["8:30 PM"] },
      ],
      weekend: [
        { format: "2D",  horarios: ["12:00 PM", "2:30 PM", "5:00 PM", "7:30 PM", "10:00 PM"] },
        { format: "3D",  horarios: ["1:00 PM", "3:30 PM", "6:30 PM", "9:00 PM"] },
        { format: "VIP", horarios: ["4:00 PM", "7:00 PM", "9:30 PM"] },
      ],
    },
  },
  {
    id: 3,
    title: "La Momia",
    genre: "Terror / Aventura",
    filterGenres: ["Terror"],
    duration: "112 min",
    rating: "PG-13",
    formats: ["2D", "3D"],
    poster: `${TMDB}/8L8efNkz8rUmwR7sV0g3vnC9yjn.jpg`,
    backdrop: null,
    badge: "EN CARTELERA",
    badgeColor: "bg-emerald-600",
    synopsis:
      "Una expedición arqueológica en el desierto de Egipto desentierra accidentalmente a una poderosa sacerdotisa que fue sepultada viva hace miles de años. Al despertar, la criatura trae consigo una oscuridad y un poder destructivo sin precedentes. En una carrera contra el tiempo, un equipo de expertos deberá descubrir el secreto para detener su reinado de terror antes de que sea demasiado tarde.",
    director: "Lee Cronin",
    cast: ["Tom Hiddleston", "Sofia Boutella", "Annabelle Wallis", "Russell Crowe"],
    trailerSearch: "La Momia 2025 trailer oficial",
    weekSchedule: {
      weekday: [
        { format: "2D", horarios: ["3:30 PM", "6:30 PM", "9:30 PM"] },
        { format: "3D", horarios: ["5:00 PM", "8:00 PM"] },
      ],
      weekend: [
        { format: "2D", horarios: ["1:00 PM", "3:30 PM", "6:00 PM", "9:00 PM", "11:30 PM"] },
        { format: "3D", horarios: ["2:30 PM", "5:30 PM", "8:30 PM", "11:00 PM"] },
      ],
    },
  },
  {
    id: 4,
    title: "Te Van a Matar",
    genre: "Thriller / Suspenso",
    filterGenres: ["Acción"],
    duration: "98 min",
    rating: "R",
    formats: ["2D"],
    poster: `${TMDB}/6oI4oQKTWMVUlr8Ivqydp28Ruu6.jpg`,
    backdrop: null,
    badge: "EN CARTELERA",
    badgeColor: "bg-emerald-600",
    synopsis:
      "Un detective retirado recibe un misterioso mensaje que lo obliga a regresar al caso que arruinó su carrera. Lo que comienza como una simple investigación se convierte en una pesadilla de traición, mentiras y violencia. Con el tiempo en su contra y sin saber en quién confiar, deberá descubrir la verdad antes de convertirse en la próxima víctima.",
    director: "James Wan",
    cast: ["Josh Hartnett", "Maika Monroe", "Ben Mendelsohn", "Fionn Whitehead"],
    trailerSearch: "They Will Kill You 2025 trailer oficial",
    weekSchedule: {
      weekday: [
        { format: "2D", horarios: ["12:00 PM", "2:30 PM", "5:00 PM", "7:30 PM", "10:00 PM"] },
      ],
      weekend: [
        { format: "2D", horarios: ["11:00 AM", "1:30 PM", "3:30 PM", "5:30 PM", "7:30 PM", "9:30 PM", "11:30 PM"] },
      ],
    },
  },
  {
    id: 5,
    title: "Turbulencia",
    genre: "Acción / Suspenso",
    filterGenres: ["Acción"],
    duration: "105 min",
    rating: "PG-13",
    formats: ["2D", "VIP"],
    poster: `${TMDB}/jRuiKL4S9UpLma2ZlM47xIu2gbe.jpg`,
    backdrop: null,
    badge: "EN CARTELERA",
    badgeColor: "bg-emerald-600",
    synopsis:
      "A bordo de un vuelo transatlántico, una amenaza invisible comienza a afectar a los pasajeros uno a uno. La piloto a cargo deberá mantener la calma y resolver el misterio antes de que el avión llegue a su destino. Con 38,000 pies de altura y sin posibilidad de aterrizar, la tensión llega al límite en este thriller de alta velocidad que te dejará sin aliento.",
    director: "Roland Emmerich",
    cast: ["Taron Egerton", "Naomi Watts", "Jamie Foxx", "Lucy Boynton"],
    trailerSearch: "Turbulence 2025 movie trailer oficial",
    weekSchedule: {
      weekday: [
        { format: "2D",  horarios: ["2:00 PM", "5:00 PM", "8:00 PM"] },
        { format: "VIP", horarios: ["9:00 PM"] },
      ],
      weekend: [
        { format: "2D",  horarios: ["12:30 PM", "3:00 PM", "5:30 PM", "8:00 PM", "10:30 PM"] },
        { format: "VIP", horarios: ["4:30 PM", "7:30 PM", "10:00 PM"] },
      ],
    },
  },
  {
    id: 6,
    title: "Soy Múcura",
    genre: "Comedia / Familiar",
    filterGenres: ["Comedia", "Familiar"],
    duration: "95 min",
    rating: "G",
    formats: ["2D"],
    poster: `${TMDB}/srfONbR9dDLxKVxAqqVOU7OA9Ij.jpg`,
    backdrop: null,
    badge: "NACIONAL",
    badgeColor: "bg-yellow-600",
    synopsis:
      "Múcura es un simpático duende colombiano que vive en los cerros de Bogotá y tiene una misión especial: proteger los secretos de la naturaleza. Cuando una empresa constructora amenaza su hogar, Múcura deberá hacer equipo con una familia de la ciudad para salvar el bosque encantado. Una aventura llena de humor, magia y amor por Colombia.",
    director: "Carlos Moreno",
    cast: ["Sebastián Eslava", "María Cecilia Botero", "Frank Ramírez", "Carolina Gaitán"],
    trailerSearch: "Soy Múcura pelicula colombiana trailer",
    weekSchedule: {
      weekday: [
        { format: "2D", horarios: ["1:00 PM", "3:30 PM", "6:00 PM"] },
      ],
      weekend: [
        { format: "2D", horarios: ["10:00 AM", "12:30 PM", "3:00 PM", "5:30 PM", "8:00 PM"] },
      ],
    },
  },
];

export function getMovie(id: number) {
  return movies.find((m) => m.id === id) ?? null;
}
