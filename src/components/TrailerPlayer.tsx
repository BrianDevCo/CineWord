"use client";

import { useState } from "react";
import Image from "next/image";

/** Extrae el ID de video de URLs de YouTube (watch?v=, youtu.be/, /embed/, /shorts/) */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

interface Props {
  trailer: string;      // URL de YouTube o texto de búsqueda
  titulo: string;
  imagen?: string | null;
}

// Muestra una portada y solo carga el iframe de YouTube al hacer clic
// (el iframe pesa ~1 MB y frena la carga de la página en celular).
export default function TrailerPlayer({ trailer, titulo, imagen }: Props) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(trailer);

  const portada = (
    <>
      {imagen ? (
        <Image src={imagen} alt={`Tráiler de ${titulo}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
      ) : id ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`Tráiler de ${titulo}`} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-[#CC1244]/90 group-hover:bg-[#CC1244] group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl shadow-[#CC1244]/30">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <span className="font-heading text-white text-sm tracking-widest bg-black/60 px-4 py-1.5 rounded-sm">
          VER TRÁILER OFICIAL
        </span>
      </div>
    </>
  );

  const clase = "group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-[#CC1244]/50 transition-all block w-full";

  // Sin ID de video: se abre la búsqueda en YouTube como antes
  if (!id) {
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trailer)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={clase}
      >
        {portada}
      </a>
    );
  }

  if (playing) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={`Tráiler de ${titulo}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} className={clase} aria-label={`Reproducir tráiler de ${titulo}`}>
      {portada}
    </button>
  );
}
