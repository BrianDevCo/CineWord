"use client";

import { useState } from "react";
import Image from "next/image";

const TMDB = "https://media.themoviedb.org/t/p/w500";

const upcoming = [
  {
    title: "Venom: El Último Baile",
    genre: "Acción / Superhéroes",
    date: "Mayo 16, 2026",
    poster: `${TMDB}/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg`,
    accentColor: "#4488ff",
    description: "El capítulo final de la saga más oscura del universo de los superhéroes.",
  },
  {
    title: "Núremberg",
    genre: "Drama / Historia",
    date: "Mayo 30, 2026",
    poster: `${TMDB}/7cWTGH2svfNHWVRjsfKIBob9pDj.jpg`,
    accentColor: "#cc9900",
    description: "El juicio que cambió la historia del mundo, llevado al cine con épica precisión.",
  },
  {
    title: "Suerte, Diviértete, No Mueras",
    genre: "Comedia / Aventura",
    date: "Junio 6, 2026",
    poster: `${TMDB}/rWcfOdY7TU6lTdazWj0ebDZnAfO.jpg`,
    accentColor: "#44cc88",
    description: "Una comedia de aventuras que redefine el género con un humor explosivo.",
  },
  {
    title: "ChaO",
    genre: "Drama / Thriller",
    date: "Junio 20, 2026",
    poster: `${TMDB}/m723xGi6lyklfsTPdtgEtYJSKcw.jpg`,
    accentColor: "#cc4488",
    description: "Un thriller psicológico que te mantendrá adivinando hasta el último segundo.",
  },
];

export default function ProximosEstrenos() {
  const [reminded, setReminded] = useState<Set<number>>(new Set());

  const remind = (i: number) =>
    setReminded((prev) => new Set([...prev, i]));

  return (
    <section id="proximos" className="py-20 lg:py-28 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">
            — Muy pronto en CINEWORLD
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
            PRÓXIMOS ESTRENOS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {upcoming.map((movie, i) => (
            <div
              key={i}
              className="group bg-[#111] rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/40" />
                <div className="absolute top-3 left-3 bg-black/60 border border-white/20 text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest">
                  PRÓXIMAMENTE
                </div>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: movie.accentColor }} />
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <span className="text-xs font-body text-gray-500">{movie.genre}</span>
                  <h3 className="font-heading text-base font-bold text-white mt-1 leading-tight">
                    {movie.title}
                  </h3>
                </div>

                <p className="text-gray-400 text-sm font-body leading-relaxed flex-1">
                  {movie.description}
                </p>

                <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                  <svg className="w-4 h-4 text-[#CC1244] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-heading text-sm text-white/70 tracking-wider">{movie.date}</span>
                </div>

                {reminded.has(i) ? (
                  <div className="w-full flex items-center justify-center gap-2 border border-green-500/40 bg-green-500/10 text-green-400 font-heading text-xs tracking-widest py-2.5 rounded-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡TE AVISAMOS!
                  </div>
                ) : (
                  <button
                    onClick={() => remind(i)}
                    className="w-full border border-[#CC1244]/50 hover:bg-[#CC1244] text-[#CC1244] hover:text-white font-heading text-xs tracking-widest py-2.5 rounded-sm transition-all duration-200"
                  >
                    RECORDARME
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
