"use client";

import { useMemo, useState } from "react";
import { parseCartelera } from "@/lib/cartelera-texto";

const EJEMPLO = `STREET FIGHTER | Todo público | 2:25PM - 4:50PM - 7:10PM - 9:35PM
MADRE SINIESTRA | +15 | 7:15PM - 9:25PM`;

function hoy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}
function sumarDias(fecha: string, n: number) {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function horaCorta(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m}${hour >= 12 ? "pm" : "am"}`;
}

const inputClass = "bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-3 py-2 rounded-lg outline-none transition-colors";

export default function CarteleraAdminPage() {
  const [texto, setTexto] = useState("");
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(() => sumarDias(hoy(), 6));
  const [retirarOtras, setRetirarOtras] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string[] } | null>(null);

  const { peliculas, errores } = useMemo(() => parseCartelera(texto), [texto]);
  const dias = desde && hasta && hasta >= desde
    ? Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 86_400_000) + 1
    : 0;
  const totalFunciones = peliculas.reduce((a, p) => a + p.horas.length, 0) * dias;

  async function publicar() {
    setSaving(true);
    setResultado(null);
    const res = await fetch("/api/admin/cartelera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, desde, hasta, retirarOtras }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setResultado(res.ok
      ? { ok: true, texto: data.log ?? ["Cartelera publicada"] }
      : { ok: false, texto: [...String(data.error ?? "No se pudo publicar").split("\n"), ...(data.log ?? [])] });
  }

  return (
    <div className="p-8 flex flex-col gap-8 max-w-4xl">
      <div>
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Programación</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">CARTELERA DE LA SEMANA</h1>
        <p className="text-gray-500 font-body text-sm mt-1">
          Pega la cartelera: una película por línea con sus horarios. Las películas nuevas se crean solas con póster,
          sinopsis y tráiler de TMDB, y se reemplazan todas las funciones de las fechas elegidas.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] text-gray-500 tracking-widest">DESDE</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] text-gray-500 tracking-widest">HASTA</span>
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={inputClass} />
        </label>
        <span className="text-gray-500 font-body text-sm pb-2">{dias > 0 ? `${dias} días` : "Fechas inválidas"}</span>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-[10px] text-gray-500 tracking-widest">PELÍCULAS Y HORARIOS</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={9}
          placeholder={EJEMPLO}
          className={`${inputClass} font-mono leading-relaxed resize-y`}
        />
        <span className="text-gray-600 font-body text-xs">
          Formato: <code className="text-gray-400">NOMBRE | edad (opcional) | horarios</code>. La edad puede ser +12, +15, +18 o Todo público.
        </span>
      </label>

      {/* Vista previa */}
      {(peliculas.length > 0 || errores.length > 0) && (
        <div className="flex flex-col gap-2">
          <span className="font-heading text-[10px] text-gray-500 tracking-widest">VISTA PREVIA</span>
          {peliculas.map((p) => (
            <div key={p.titulo} className="bg-[#111] border border-white/10 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
              <span className="font-heading text-white text-sm">{p.titulo}</span>
              <span className="text-[10px] font-heading tracking-widest text-gray-400 border border-white/15 rounded-sm px-1.5 py-0.5">
                {p.edad > 0 ? `+${p.edad}` : "TODO PÚBLICO"}
              </span>
              <div className="flex flex-wrap gap-1 ml-auto">
                {p.horas.map((h) => (
                  <span key={h} className="text-xs font-body text-white bg-white/10 rounded-sm px-2 py-0.5 tabular-nums">{horaCorta(h)}</span>
                ))}
              </div>
            </div>
          ))}
          {errores.map((e) => (
            <p key={e} className="text-red-400 font-body text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{e}</p>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-gray-400 font-body text-sm">
        <input type="checkbox" checked={retirarOtras} onChange={(e) => setRetirarOtras(e.target.checked)} className="accent-[#CC1244]" />
        Quitar de la cartelera las películas que no estén en esta lista
      </label>

      <div className="flex items-center gap-4">
        <button
          onClick={publicar}
          disabled={saving || !peliculas.length || errores.length > 0 || dias <= 0 || dias > 14}
          className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest px-6 py-3 rounded-lg transition-all flex items-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />PUBLICANDO… (buscando en TMDB)</>
          ) : "PUBLICAR CARTELERA"}
        </button>
        {peliculas.length > 0 && !errores.length && dias > 0 && (
          <span className="text-gray-500 font-body text-sm">{peliculas.length} películas · {totalFunciones} funciones</span>
        )}
      </div>

      {resultado && (
        <div className={`rounded-lg px-4 py-3 border font-body text-sm flex flex-col gap-1 ${resultado.ok ? "text-green-300 bg-green-500/10 border-green-500/20" : "text-red-300 bg-red-500/10 border-red-500/20"}`}>
          {resultado.texto.map((l, i) => <p key={i}>{l}</p>)}
          {resultado.ok && (
            <p className="text-gray-400 text-xs mt-2">
              Revisa en Admin → Películas que el póster y la sinopsis correspondan. Si TMDB eligió otra película, corrígela desde ahí.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
