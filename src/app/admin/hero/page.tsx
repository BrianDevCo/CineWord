"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface PeliculaResumen {
  id: number;
  titulo: string;
  poster_url: string | null;
  backdrop_url: string | null;
  estado: "en_cartelera" | "proximo";
  badge: string;
  badge_color: string;
  en_hero: boolean;
  fecha_estreno: string | null;
}

export default function AdminHeroPage() {
  const [peliculas, setPeliculas] = useState<PeliculaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const cartelera = peliculas.filter((p) => p.estado === "en_cartelera");
  const proximas = peliculas.filter((p) => p.estado === "proximo");

  const selectedCartelera = cartelera.filter((p) => p.en_hero).map((p) => p.id);
  const selectedProximas = proximas.filter((p) => p.en_hero).map((p) => p.id);

  useEffect(() => {
    fetch("/api/admin/hero")
      .then((r) => r.json())
      .then((data) => { setPeliculas(data); setLoading(false); });
  }, []);

  function toggle(id: number, estado: "en_cartelera" | "proximo") {
    setPeliculas((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const estaActiva = p.en_hero;
        if (!estaActiva) {
          // Verificar límite de 2
          const cuantas = prev.filter((x) => x.estado === estado && x.en_hero).length;
          if (cuantas >= 2) {
            setMsg(`Máximo 2 ${estado === "en_cartelera" ? "en cartelera" : "próximos"} en el hero`);
            setTimeout(() => setMsg(""), 3000);
            return p;
          }
        }
        return { ...p, en_hero: !estaActiva };
      })
    );
  }

  async function guardar() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids_cartelera: selectedCartelera,
        ids_proximos: selectedProximas,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Guardado correctamente");
    } else {
      const err = await res.json();
      setMsg("Error: " + err.error);
    }
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#CC1244] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Hero Carousel</h1>
          <p className="text-gray-500 text-sm mt-1">Selecciona hasta 2 en cartelera y 2 próximos para el hero de la página principal</p>
        </div>
        <button
          onClick={guardar}
          disabled={saving}
          className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-sm tracking-widest px-6 py-3 rounded-sm transition-all"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-body ${msg.startsWith("Error") || msg.startsWith("Máximo") ? "bg-red-900/30 border border-red-500/30 text-red-300" : "bg-emerald-900/30 border border-emerald-500/30 text-emerald-300"}`}>
          {msg}
        </div>
      )}

      {/* En cartelera */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-heading text-sm font-bold text-white tracking-wider uppercase">En Cartelera</span>
          <span className="text-xs text-gray-500">({selectedCartelera.length}/2 seleccionadas)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cartelera.map((p) => (
            <PeliculaCard key={p.id} pelicula={p} onToggle={() => toggle(p.id, p.estado)} />
          ))}
        </div>
      </section>

      {/* Próximos estrenos */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-heading text-sm font-bold text-white tracking-wider uppercase">Próximos Estrenos</span>
          <span className="text-xs text-gray-500">({selectedProximas.length}/2 seleccionadas)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {proximas.map((p) => (
            <PeliculaCard key={p.id} pelicula={p} onToggle={() => toggle(p.id, p.estado)} />
          ))}
        </div>
      </section>

      {/* Preview */}
      <section>
        <p className="font-heading text-sm font-bold text-white tracking-wider uppercase mb-3">Vista previa del orden</p>
        <div className="flex gap-2 flex-wrap">
          {peliculas.filter((p) => p.en_hero).map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="font-heading text-[#CC1244] text-sm font-bold">{i + 1}</span>
              {p.poster_url && (
                <div className="relative w-6 h-8 rounded overflow-hidden shrink-0">
                  <Image src={p.poster_url} alt={p.titulo} fill className="object-cover" sizes="24px" />
                </div>
              )}
              <span className="font-body text-white text-xs">{p.titulo}</span>
              <span className={`${p.badge_color} text-white text-[10px] font-heading px-1.5 py-0.5 rounded-sm`}>{p.badge}</span>
            </div>
          ))}
          {peliculas.filter((p) => p.en_hero).length === 0 && (
            <p className="text-gray-600 text-sm font-body">Ninguna seleccionada</p>
          )}
        </div>
      </section>
    </div>
  );
}

function PeliculaCard({ pelicula, onToggle }: { pelicula: PeliculaResumen; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-lg overflow-hidden border-2 transition-all text-left w-full ${
        pelicula.en_hero
          ? "border-[#CC1244] shadow-lg shadow-[#CC1244]/30"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <div className="aspect-[2/3] relative bg-gray-900">
        {pelicula.poster_url ? (
          <Image src={pelicula.poster_url} alt={pelicula.titulo} fill className="object-cover" sizes="160px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
            </svg>
          </div>
        )}
        {pelicula.en_hero && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-[#CC1244] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2 bg-black/80">
        <p className="font-heading text-white text-xs font-bold leading-tight truncate">{pelicula.titulo}</p>
        <span className={`${pelicula.badge_color} text-white text-[10px] font-heading px-1.5 py-0.5 rounded-sm mt-1 inline-block`}>
          {pelicula.badge}
        </span>
      </div>
    </button>
  );
}
