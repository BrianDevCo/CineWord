"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Pelicula } from "@/lib/types";

interface Props {
  peliculas: Pelicula[];
}

export default function Hero({ peliculas }: Props) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
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

  // Cierra modal al cambiar de película
  useEffect(() => {
    setShowModal(false);
    setNotifStatus("idle");
    setEmail("");
  }, [current]);

  if (!peliculas.length) return null;

  const p = peliculas[current];

  const handleAvisar = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifStatus("loading");
    try {
      const res = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pelicula_id: p.id }),
      });
      setNotifStatus(res.ok ? "ok" : "error");
    } catch {
      setNotifStatus("error");
    }
  };

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
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 60% 40%, ${peli.accent_color ?? "#CC1244"}33 0%, #0a0a0a 70%)`,
              }}
            />
          )}
        </div>
      ))}

      {/* Capas de oscurecimiento */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-black/40 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 z-[1]" />

      {/* Glow dinámico según accent_color */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl z-[1] transition-colors duration-700"
        style={{ background: `${p.accent_color ?? "#CC1244"}26` }}
      />

      {/* Contenido central */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center gap-5 sm:gap-8 pt-20 sm:pt-24">
        {/* Badge promo */}
        <div className="inline-flex items-center gap-2 bg-[#CC1244]/20 border border-[#CC1244]/50 rounded-full px-3 sm:px-4 py-1.5 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#CC1244] animate-pulse shrink-0" />
          <span className="font-heading text-[#CC1244] text-xs sm:text-sm tracking-widest uppercase">
            <span className="hidden sm:inline">Martes y Miércoles — </span>Entradas a Mitad de Precio
          </span>
        </div>

        {/* Título */}
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <h1 className="font-heading font-bold text-5xl sm:text-7xl lg:text-9xl tracking-wider leading-none text-white drop-shadow-2xl">
            CINE<span className="text-[#CC1244]">WORLD</span>
          </h1>
          <p className="font-heading font-light text-sm sm:text-2xl lg:text-3xl tracking-widest text-gray-300 uppercase drop-shadow-lg">
            Vive la Magia del Cine
          </p>
        </div>

        {/* Película destacada */}
        <div
          className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left transition-opacity duration-500"
          style={{ opacity: transitioning ? 0 : 1 }}
        >
          {p.poster_url && (
            <div className="shrink-0 w-16 h-24 sm:w-28 sm:h-40 rounded-md overflow-hidden relative shadow-xl">
              <Image
                src={p.poster_url}
                alt={p.titulo}
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          )}
          <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${p.badge_color} text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest`}>
                {p.badge}
              </span>
              <span className="text-gray-400 text-xs font-body">{p.genero}</span>
            </div>
            <h2 className="font-heading text-xl sm:text-3xl font-bold text-white leading-tight">
              {p.titulo}
            </h2>
            {p.sinopsis && (
              <p className="text-gray-300 text-xs sm:text-sm font-body leading-relaxed line-clamp-2">
                {p.sinopsis}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400 font-body flex-wrap">
              {p.duracion && <span>⏱ {p.duracion}</span>}
              <span>
                📅 {p.estado === "en_cartelera"
                  ? "En cartelera"
                  : p.fecha_estreno
                  ? `Estreno: ${new Date(p.fecha_estreno).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`
                  : "Próximamente"}
              </span>
              {p.clasificacion && <span>🎭 {p.clasificacion}</span>}
            </div>

            {/* CTA dinámico dentro de la card */}
            <div className="pt-1">
              {p.estado === "en_cartelera" ? (
                <Link
                  href={`/pelicula/${p.id}`}
                  className="inline-flex items-center gap-2 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-xs tracking-widest px-5 py-2.5 rounded-sm transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
                  </svg>
                  VER FUNCIONES
                </Link>
              ) : (
                <button
                  onClick={() => { setShowModal(true); pausedRef.current = true; }}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/60 text-white font-heading text-xs tracking-widest px-5 py-2.5 rounded-sm transition-all backdrop-blur-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  AVISARME DEL ESTRENO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CTAs generales */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
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

        {/* Scroll indicator — only desktop */}
        <div className="mt-2 hidden sm:flex flex-col items-center gap-2 opacity-40">
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


      {/* Modal AVISARME */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); pausedRef.current = false; } }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md flex flex-col gap-5">
            <button
              onClick={() => { setShowModal(false); pausedRef.current = false; }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {notifStatus === "ok" ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-heading text-white text-lg tracking-wider">¡LISTO!</p>
                  <p className="text-gray-400 font-body text-sm mt-1">
                    Te avisaremos cuando <span className="text-white">{p.titulo}</span> esté en cartelera.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`${p.badge_color} text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest`}>
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white tracking-wider mt-1">{p.titulo}</h3>
                  <p className="text-gray-500 font-body text-sm">
                    Te notificamos por correo cuando esté disponible en CINEWORLD.
                  </p>
                </div>

                <form onSubmit={handleAvisar} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-heading text-xs text-gray-500 tracking-widest">CORREO ELECTRÓNICO</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder-gray-600"
                    />
                  </div>

                  {notifStatus === "error" && (
                    <p className="text-red-400 text-sm font-body bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      Ocurrió un error. Intenta de nuevo.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={notifStatus === "loading"}
                    className="w-full bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-sm tracking-widest py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {notifStatus === "loading" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        REGISTRANDO...
                      </>
                    ) : (
                      "AVISARME"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
