"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Pelicula } from "@/lib/types";

const FILTERS = ["Todas", "Acción", "Drama", "Terror", "Comedia", "Familiar"];

interface Props {
  peliculas: Pelicula[];
}

export default function Cartelera({ peliculas }: Props) {
  const [activeFilter, setActiveFilter] = useState("Todas");

  const featured = peliculas[0];
  const rest =
    activeFilter === "Todas"
      ? peliculas.slice(1)
      : peliculas.filter((m) => m.filter_genres.includes(activeFilter));
  const showFeatured = activeFilter === "Todas";

  if (!featured) {
    return (
      <section id="cartelera" className="py-20 lg:py-28 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 font-heading tracking-widest text-sm">
          NO HAY PELÍCULAS EN CARTELERA
        </div>
      </section>
    );
  }

  return (
    <section id="cartelera" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-1 flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-[#CC1244]" />
              Ahora en pantalla
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl font-bold text-white tracking-wider">
              CARTELERA
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`font-heading text-xs tracking-widest px-4 py-2 rounded-sm border transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-[#CC1244] border-[#CC1244] text-white"
                    : "border-white/15 text-gray-500 hover:border-white/30 hover:text-white"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* FEATURED */}
        {showFeatured && (
          <Link href={`/pelicula/${featured.id}`}>
            <div className="relative rounded-2xl overflow-hidden mb-10 h-[400px] lg:h-[480px] group cursor-pointer">
              {featured.backdrop_url ? (
                <Image
                  src={featured.backdrop_url}
                  alt={featured.titulo}
                  fill
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute inset-0 flex items-end p-8 lg:p-12">
                <div className="flex gap-6 items-end max-w-3xl">
                  {featured.poster_url && (
                    <div className="shrink-0 w-28 h-40 lg:w-36 lg:h-52 rounded-lg overflow-hidden relative shadow-2xl border border-white/10 hidden sm:block">
                      <Image src={featured.poster_url} alt={featured.titulo} fill className="object-cover" sizes="144px" />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <span className={`${featured.badge_color} text-white font-heading text-xs px-3 py-1 rounded-sm tracking-widest w-fit`}>
                      {featured.badge}
                    </span>
                    <h3 className="font-heading text-4xl lg:text-5xl font-bold text-white tracking-wider leading-tight">
                      {featured.titulo}
                    </h3>
                    <p className="text-gray-400 font-body text-sm hidden sm:block">
                      {featured.genero} · {featured.duracion}
                    </p>
                    <div className="flex items-center gap-2 text-white/70 font-heading text-xs tracking-widest group-hover:text-[#CC1244] transition-colors">
                      Ver sinopsis y comprar boleto
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* GRID */}
        {rest.length === 0 ? (
          <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">
            NO HAY PELÍCULAS EN ESTA CATEGORÍA
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {rest.map((movie) => (
              <Link key={movie.id} href={`/pelicula/${movie.id}`}>
                <div className="group flex flex-col rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/60 cursor-pointer">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {movie.poster_url ? (
                      <Image
                        src={movie.poster_url}
                        alt={movie.titulo}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                    <span className={`absolute top-2 left-2 ${movie.badge_color} text-white font-heading text-[10px] px-1.5 py-0.5 rounded-sm tracking-widest`}>
                      {movie.badge}
                    </span>
                    {movie.filter_genres.includes("VIP") && (
                      <span className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-heading text-[10px] px-1.5 py-0.5 rounded-sm">
                        VIP
                      </span>
                    )}

                    <div className="absolute inset-0 bg-[#CC1244]/0 group-hover:bg-[#CC1244]/10 transition-all duration-300 flex items-center justify-center">
                      <span className="font-heading text-white text-xs tracking-widest opacity-0 group-hover:opacity-100 bg-[#CC1244] px-4 py-2 rounded-sm transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        VER PELÍCULA
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-gray-400 text-[10px] font-body">{movie.genero}</p>
                      <h3 className="font-heading text-sm font-bold text-white leading-tight line-clamp-2">
                        {movie.titulo}
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
