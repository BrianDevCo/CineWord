"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { Pelicula } from "@/lib/types";

interface Props {
  peliculas: Pelicula[];
}

export default function Hero({ peliculas }: Props) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const pausedRef = useRef(false);

  const goTo = useCallback((index: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 500);
  }, [transitioning]);

  const next = useCallback(() => {
    if (pausedRef.current || peliculas.length <= 1) return;
    goTo((current + 1) % peliculas.length);
  }, [current, peliculas.length, goTo]);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  if (!peliculas.length) return null;

  const p = peliculas[current];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Backdrops con crossfade */}
      {peliculas.map((peli, i) => (
        <div
          key={peli.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current && !transitioning ? 1 : 0 }}
        >
          {peli.backdrop_url ? (
            <Image
              src={peli.backdrop_url}
              alt={peli.titulo}
              fill
              priority={i === 0}
              className="object-cover object-center scale-105"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
          )}
        </div>
      ))}

      {/* Capas de oscurecimiento */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-black/40 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 z-[1]" />

      {/* Glow rojo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#CC1244]/15 rounded-full blur-3xl z-[1]" />

      {/* Contenido central */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center gap-8 pt-24">
        {/* Badge promo */}
        <div className="inline-flex items-center gap-2 bg-[#CC1244]/20 border border-[#CC1244]/50 rounded-full px-4 py-1.5 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#CC1244] animate-pulse" />
          <span className="font-heading text-[#CC1244] text-sm tracking-widest uppercase">
            Martes y Miércoles — Entradas a Mitad de Precio
          </span>
        </div>

        {/* Título */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading font-bold text-6xl sm:text-8xl lg:text-9xl tracking-wider leading-none text-white drop-shadow-2xl">
            CINE<span className="text-[#CC1244]">WORLD</span>
          </h1>
          <p className="font-heading font-light text-xl sm:text-2xl lg:text-3xl tracking-widest text-gray-300 uppercase drop-shadow-lg">
            Vive la Magia del Cine
          </p>
        </div>

        {/* Película destacada */}
        <div
          className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 text-left transition-opacity duration-500"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
          {p.poster_url && (
            <div className="shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-md overflow-hidden relative shadow-xl">
              <Image
                src={p.poster_url}
                alt={p.titulo}
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          )}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`${p.badge_color} text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest`}>
                {p.badge}
              </span>
              <span className="text-gray-400 text-xs font-body">{p.genero}</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
              {p.titulo}
            </h2>
            {p.sinopsis && (
              <p className="text-gray-300 text-sm font-body leading-relaxed line-clamp-2">
                {p.sinopsis}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400 font-body flex-wrap">
              {p.duracion && <span>⏱ {p.duracion}</span>}
              <span>📅 {p.estado === "en_cartelera" ? "En cartelera" : p.fecha_estreno ? `Estreno: ${new Date(p.fecha_estreno).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}` : "Próximamente"}</span>
              {p.clasificacion && <span>🎭 {p.clasificacion}</span>}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href="#cartelera"
            className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-4 rounded-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#CC1244]/30"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
            </svg>
            VER CARTELERA
          </a>
          <a
            href="#proximos"
            className="border border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-heading text-sm tracking-widest px-8 py-4 rounded-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            PRÓXIMOS ESTRENOS
          </a>
        </div>

        {/* Indicadores de slide */}
        {peliculas.length > 1 && (
          <div className="flex items-center gap-2 mt-2">
            {peliculas.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir a slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-6 h-2 bg-[#CC1244]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="mt-2 flex flex-col items-center gap-2 opacity-40">
          <span className="font-body text-xs text-gray-400 tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-gray-400 to-transparent" />
        </div>
      </div>

      {/* Flechas navegación */}
      {peliculas.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + peliculas.length) % peliculas.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goTo((current + 1) % peliculas.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Barra de stats inferior */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
          {[
            { value: "6", label: "Películas en cartelera" },
            { value: "3", label: "Tipos de sala" },
            { value: "4", label: "Próximos estrenos" },
            { value: "50%", label: "Desc. Mar y Mié" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="font-heading text-2xl font-bold text-[#CC1244]">{stat.value}</span>
              <span className="font-body text-xs text-gray-500 tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
