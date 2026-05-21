"use client";

import { useState } from "react";
import Image from "next/image";
import type { Pelicula } from "@/lib/types";
import { registrarNotificacionEstreno } from "@/lib/db";

function formatFecha(iso: string) {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const [, mes, dia] = iso.split("-");
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}`;
}

interface Props {
  peliculas: Pelicula[];
}

export default function ProximosEstrenos({ peliculas }: Props) {
  const [states, setStates] = useState<Record<number, "idle" | "form" | "loading" | "done" | "error">>({});
  const [emails, setEmails] = useState<Record<number, string>>({});

  const setMovieState = (id: number, s: typeof states[number]) =>
    setStates((prev) => ({ ...prev, [id]: s }));

  const handleRemind = async (movie: Pelicula) => {
    const email = emails[movie.id] ?? "";
    if (!email || !email.includes("@")) return;
    setMovieState(movie.id, "loading");
    try {
      await registrarNotificacionEstreno(movie.id, email);
      setMovieState(movie.id, "done");
    } catch {
      setMovieState(movie.id, "error");
    }
  };

  if (peliculas.length === 0) return null;

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {peliculas.map((movie) => {
            const state = states[movie.id] ?? "idle";
            const email = emails[movie.id] ?? "";

            return (
              <div
                key={movie.id}
                className="group bg-[#111] rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {movie.poster_url ? (
                    <Image
                      src={movie.poster_url}
                      alt={movie.titulo}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/40" />
                  <div className="absolute top-3 left-3 bg-black/60 border border-white/20 text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest">
                    PRÓXIMAMENTE
                  </div>
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: movie.accent_color }}
                  />
                </div>

                <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 flex-1">
                  <div>
                    <span className="text-[10px] sm:text-xs font-body text-gray-500">{movie.genero}</span>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-white mt-0.5 leading-tight line-clamp-2">
                      {movie.titulo}
                    </h3>
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm font-body leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none">
                    {movie.sinopsis}
                  </p>

                  {movie.fecha_estreno && (
                    <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                      <svg className="w-4 h-4 text-[#CC1244] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-heading text-sm text-white/70 tracking-wider">
                        {formatFecha(movie.fecha_estreno)}
                      </span>
                    </div>
                  )}

                  {/* RECORDARME */}
                  {state === "done" ? (
                    <div className="w-full flex items-center justify-center gap-2 border border-green-500/40 bg-green-500/10 text-green-400 font-heading text-xs tracking-widest py-2.5 rounded-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ¡TE AVISAMOS!
                    </div>
                  ) : state === "form" || state === "loading" || state === "error" ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmails((prev) => ({ ...prev, [movie.id]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/15 text-white font-body text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600"
                      />
                      {state === "error" && (
                        <p className="text-red-400 text-xs font-body">Error al guardar. Intenta de nuevo.</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMovieState(movie.id, "idle")}
                          className="flex-1 border border-white/15 text-gray-500 hover:text-white font-heading text-xs tracking-widest py-2 rounded-sm transition-all"
                        >
                          CANCELAR
                        </button>
                        <button
                          onClick={() => handleRemind(movie)}
                          disabled={state === "loading" || !email.includes("@")}
                          className="flex-[2] bg-[#CC1244] disabled:opacity-40 hover:bg-[#a00e35] text-white font-heading text-xs tracking-widest py-2 rounded-sm transition-all"
                        >
                          {state === "loading" ? "GUARDANDO..." : "AVISAR"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setMovieState(movie.id, "form")}
                      className="w-full border border-[#CC1244]/50 hover:bg-[#CC1244] text-[#CC1244] hover:text-white font-heading text-xs tracking-widest py-2.5 rounded-sm transition-all duration-200"
                    >
                      RECORDARME
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
