"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pelicula } from "@/lib/types";

const BADGE_COLORS = [
  { value: "bg-emerald-600", label: "Verde — En Cartelera" },
  { value: "bg-blue-600", label: "Azul — Estreno" },
  { value: "bg-purple-600", label: "Morado — Próximamente" },
  { value: "bg-amber-600", label: "Ámbar — Pronto" },
  { value: "bg-red-600", label: "Rojo — Solo Hoy" },
];

interface Props {
  pelicula?: Pelicula;
}

export default function PeliculaForm({ pelicula }: Props) {
  const router = useRouter();
  const isEdit = !!pelicula;

  const [form, setForm] = useState({
    titulo: pelicula?.titulo ?? "",
    genero: pelicula?.genero ?? "",
    filter_genres: pelicula?.filter_genres?.join(", ") ?? "",
    duracion: pelicula?.duracion ?? "",
    clasificacion: pelicula?.clasificacion ?? "PG",
    sinopsis: pelicula?.sinopsis ?? "",
    director: pelicula?.director ?? "",
    reparto: pelicula?.reparto?.join(", ") ?? "",
    poster_url: pelicula?.poster_url ?? "",
    backdrop_url: pelicula?.backdrop_url ?? "",
    badge: pelicula?.badge ?? "EN CARTELERA",
    badge_color: pelicula?.badge_color ?? "bg-emerald-600",
    trailer_search: pelicula?.trailer_search ?? "",
    estado: pelicula?.estado ?? "en_cartelera",
    fecha_estreno: pelicula?.fecha_estreno ?? "",
    activa: pelicula?.activa ?? true,
    orden: pelicula?.orden ?? 0,
    accent_color: pelicula?.accent_color ?? "#CC1244",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/admin/peliculas/${pelicula!.id}` : "/api/admin/peliculas";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, orden: Number(form.orden) }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
      setLoading(false);
      return;
    }

    router.push("/admin/peliculas");
    router.refresh();
  };

  const inputClass = "bg-[#0d0d0d] border border-white/10 text-white font-body text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#CC1244] placeholder-gray-700 w-full transition-colors";
  const labelClass = "font-heading text-xs text-gray-400 tracking-widest uppercase";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">

      {/* Básicos */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-heading text-sm text-white tracking-widest">INFORMACIÓN BÁSICA</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>Título *</label>
            <input required value={form.titulo} onChange={(e) => set("titulo", e.target.value)}
              placeholder="Nombre de la película" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Género *</label>
            <input required value={form.genero} onChange={(e) => set("genero", e.target.value)}
              placeholder="Ej: Acción / Aventura" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Géneros para filtro</label>
            <input value={form.filter_genres} onChange={(e) => set("filter_genres", e.target.value)}
              placeholder="Acción, Aventura (separados por coma)" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Duración *</label>
            <input required value={form.duracion} onChange={(e) => set("duracion", e.target.value)}
              placeholder="Ej: 120 min" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Clasificación *</label>
            <select required value={form.clasificacion} onChange={(e) => set("clasificacion", e.target.value)}
              className={inputClass}>
              {["G", "PG", "PG-13", "R", "+18"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>Sinopsis</label>
            <textarea value={form.sinopsis} onChange={(e) => set("sinopsis", e.target.value)}
              rows={4} placeholder="Descripción de la película..." className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Director</label>
            <input value={form.director} onChange={(e) => set("director", e.target.value)}
              placeholder="Nombre del director" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Reparto</label>
            <input value={form.reparto} onChange={(e) => set("reparto", e.target.value)}
              placeholder="Actor 1, Actor 2, Actor 3" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-heading text-sm text-white tracking-widest">IMÁGENES Y TRAILER</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>URL del Póster</label>
            <input value={form.poster_url} onChange={(e) => set("poster_url", e.target.value)}
              placeholder="https://..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>URL del Backdrop (imagen de fondo)</label>
            <input value={form.backdrop_url} onChange={(e) => set("backdrop_url", e.target.value)}
              placeholder="https://..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Búsqueda de tráiler (YouTube)</label>
            <input value={form.trailer_search} onChange={(e) => set("trailer_search", e.target.value)}
              placeholder='Ej: "Nombre película 2025 tráiler oficial"' className={inputClass} />
          </div>
        </div>
      </div>

      {/* Estado y configuración */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-heading text-sm text-white tracking-widest">ESTADO Y CONFIGURACIÓN</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Estado *</label>
            <select required value={form.estado} onChange={(e) => set("estado", e.target.value)}
              className={inputClass}>
              <option value="en_cartelera">En Cartelera</option>
              <option value="proximo">Próximo Estreno</option>
              <option value="retirada">Retirada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fecha de estreno</label>
            <input type="date" value={form.fecha_estreno} onChange={(e) => set("fecha_estreno", e.target.value)}
              className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Badge (etiqueta)</label>
            <input value={form.badge} onChange={(e) => set("badge", e.target.value)}
              placeholder="EN CARTELERA" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Color del badge</label>
            <select value={form.badge_color} onChange={(e) => set("badge_color", e.target.value)}
              className={inputClass}>
              {BADGE_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Orden de aparición</label>
            <input type="number" min={0} value={form.orden} onChange={(e) => set("orden", e.target.value)}
              className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Color acento (hex)</label>
            <div className="flex gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
              <input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)}
                className={`${inputClass} flex-1`} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className={labelClass}>Activa</label>
            <button type="button" onClick={() => set("activa", !form.activa)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.activa ? "bg-[#CC1244]" : "bg-white/20"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.activa ? "left-7" : "left-1"}`} />
            </button>
            <span className="font-body text-sm text-gray-400">{form.activa ? "Sí" : "No"}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 font-body text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="border border-white/15 hover:border-white/30 text-gray-400 hover:text-white font-heading text-sm tracking-widest px-6 py-3 rounded-lg transition-all">
          CANCELAR
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 text-white font-heading text-sm tracking-widest py-3 rounded-lg transition-all flex items-center justify-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? "GUARDANDO..." : isEdit ? "GUARDAR CAMBIOS" : "CREAR PELÍCULA"}
        </button>
      </div>
    </form>
  );
}
