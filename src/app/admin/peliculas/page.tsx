"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Pelicula } from "@/lib/types";

const ESTADO_LABEL: Record<string, string> = {
  en_cartelera: "En cartelera",
  proximo: "Próximo",
  retirada: "Retirada",
};
const ESTADO_COLOR: Record<string, string> = {
  en_cartelera: "text-green-400 bg-green-400/10 border-green-400/30",
  proximo: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  retirada: "text-gray-500 bg-white/5 border-white/10",
};

export default function PeliculasAdminPage() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [enriching, setEnriching] = useState(false);
  const [enrichLog, setEnrichLog] = useState<string[]>([]);
  const [tmdbInputs, setTmdbInputs] = useState<Record<number, string>>({});

  const load = () => {
    fetch("/api/admin/peliculas")
      .then((r) => r.json())
      .then((d) => { setPeliculas(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActiva = async (p: Pelicula) => {
    await fetch(`/api/admin/peliculas/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, activa: !p.activa }),
    });
    load();
  };

  const enrichAll = async () => {
    setEnriching(true);
    setEnrichLog([]);
    const res = await fetch("/api/admin/enrich-tmdb", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const d = await res.json() as { enriquecidas?: number; total?: number; log?: string[] };
    setEnrichLog(d.log ?? []);
    setEnriching(false);
    load();
  };

  const enrichOne = async (id: number) => {
    const tmdbId = tmdbInputs[id] ? parseInt(tmdbInputs[id]) : undefined;
    const res = await fetch("/api/admin/enrich-tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pelicula_id: id, force: true, ...(tmdbId ? { tmdb_id: tmdbId } : {}) }),
    });
    const d = await res.json() as { log?: string[]; mensaje?: string };
    setEnrichLog(d.log ?? (d.mensaje ? [d.mensaje] : ["Sin respuesta del servidor"]));
    load();
  };

  const filtered = peliculas.filter((p) =>
    filter === "all" ? true : p.estado === filter
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
          <h1 className="font-heading text-3xl font-bold text-white tracking-wider">PELÍCULAS</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={enrichAll}
            disabled={enriching}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-heading text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {enriching
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            }
            {enriching ? "BUSCANDO..." : "ENRIQUECER CON TMDB"}
          </button>
          <Link
            href="/admin/peliculas/nueva"
            className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            NUEVA PELÍCULA
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "all", label: "Todas" },
          { value: "en_cartelera", label: "En cartelera" },
          { value: "proximo", label: "Próximas" },
          { value: "retirada", label: "Retiradas" },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`font-heading text-xs tracking-widest px-4 py-1.5 rounded-full border transition-all ${filter === f.value ? "bg-[#CC1244] border-[#CC1244] text-white" : "border-white/15 text-gray-400 hover:border-white/30"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Log TMDB */}
      {enrichLog.length > 0 && (
        <div className="mb-6 bg-[#0d0d0d] border border-white/10 rounded-xl p-4 flex flex-col gap-1 max-h-48 overflow-y-auto">
          <p className="font-heading text-xs text-gray-500 tracking-widest mb-2">RESULTADO TMDB</p>
          {enrichLog.map((line, i) => (
            <p key={i} className="font-body text-xs text-gray-400">{line}</p>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#111] border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">
          NO HAY PELÍCULAS
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div key={p.id} className={`bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-4 transition-all ${!p.activa ? "opacity-50" : ""}`}>
              {/* Poster */}
              <div className="w-10 h-14 rounded-md overflow-hidden bg-white/5 shrink-0 relative">
                {p.poster_url ? (
                  <Image src={p.poster_url} alt={p.titulo} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-white font-bold truncate">{p.titulo}</p>
                <p className="font-body text-gray-500 text-xs">{p.genero} · {p.duracion} · {p.clasificacion}</p>
              </div>

              {/* Estado */}
              <span className={`font-heading text-xs px-2.5 py-1 rounded-full border shrink-0 ${ESTADO_COLOR[p.estado]}`}>
                {ESTADO_LABEL[p.estado]}
              </span>

              {/* Toggle activa */}
              <button onClick={() => toggleActiva(p)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${p.activa ? "bg-[#CC1244]" : "bg-white/20"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${p.activa ? "left-5" : "left-0.5"}`} />
              </button>

              {/* Acciones TMDB */}
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  placeholder="ID TMDB"
                  value={tmdbInputs[p.id] ?? ""}
                  onChange={e => setTmdbInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-24 bg-white/5 border border-white/10 text-white text-xs font-body px-2 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-600"
                />
                <button onClick={() => enrichOne(p.id)}
                  title="Buscar/actualizar desde TMDB"
                  className="border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-blue-300 font-heading text-xs tracking-widest px-3 py-1.5 rounded-lg transition-all">
                  TMDB
                </button>
              </div>
              <Link href={`/admin/peliculas/${p.id}`}
                className="border border-white/15 hover:border-white/40 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-3 py-1.5 rounded-lg transition-all shrink-0">
                EDITAR
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
