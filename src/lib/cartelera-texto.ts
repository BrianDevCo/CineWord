// Convierte el texto de la cartelera semanal (como la publica el cine en Instagram)
// en datos. Una película por línea:
//
//   STREET FIGHTER | 2:25PM - 4:50PM - 7:10PM - 9:35PM
//   MADRE SINIESTRA | +15 | 7:15PM - 9:25PM
//
// La edad es opcional (+12, +15, +18, "Todo público").

export interface PeliculaSemana {
  titulo: string;
  edad: number;          // 0 = todo público
  horas: string[];       // "HH:MM:SS"
}

const RE_HORA = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m?\.?/gi;

/** "2:25PM - 4:50 pm - 9PM" → ["14:25:00", "16:50:00", "21:00:00"] */
export function parseHoras(texto: string): string[] {
  const horas = new Set<string>();
  for (const m of texto.matchAll(RE_HORA)) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2] ?? "0", 10);
    if (h < 1 || h > 12 || min > 59) continue;
    const pm = m[3].toLowerCase() === "p";
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    horas.add(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`);
  }
  return [...horas].sort();
}

function parseEdad(texto: string): number | null {
  const t = texto.toLowerCase();
  if (t.includes("todo") || t === "tp") return 0;
  const m = t.match(/\+?\s*(\d{1,2})/);
  return m && !/[ap]m/.test(t) ? parseInt(m[1], 10) : null;
}

const MINUSCULAS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "en", "a", "al", "o", "u", "con", "por", "para"]);

/** "LA CAIDA DE LA BALLENA" → "La Caida de la Ballena" */
export function capitalizar(t: string) {
  return t.trim().toLowerCase().split(/\s+/).map((w, i) =>
    i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
  ).join(" ");
}

/** Compara títulos ignorando tildes, mayúsculas y signos: "LA LAMPARA" = "La Lámpara" */
export function mismoTitulo(a: string, b: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return norm(a) === norm(b);
}

export function parseCartelera(texto: string): { peliculas: PeliculaSemana[]; errores: string[] } {
  const peliculas: PeliculaSemana[] = [];
  const errores: string[] = [];

  texto.split(/\r?\n/).forEach((linea, i) => {
    if (!linea.trim()) return;
    const partes = linea.split("|").map((p) => p.trim()).filter(Boolean);
    const titulo = partes[0] ?? "";
    let edad = 0;
    let horas: string[] = [];
    for (const p of partes.slice(1)) {
      const hs = parseHoras(p);
      if (hs.length) horas = [...new Set([...horas, ...hs])].sort();
      else {
        const e = parseEdad(p);
        if (e !== null) edad = e;
      }
    }
    if (titulo.length < 2) errores.push(`Línea ${i + 1}: falta el nombre de la película`);
    else if (!horas.length) errores.push(`Línea ${i + 1} (${titulo}): no encontré horarios. Escríbelos como 2:25PM - 4:50PM`);
    else peliculas.push({ titulo: capitalizar(titulo), edad, horas });
  });

  return { peliculas, errores };
}
