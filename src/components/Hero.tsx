import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Backdrop real de la película */}
      <Image
        src="https://image.tmdb.org/t/p/original/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg"
        alt="Michael backdrop"
        fill
        priority
        className="object-cover object-center scale-105"
        sizes="100vw"
      />

      {/* Capas de oscurecimiento */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

      {/* Glow rojo sutil desde arriba */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#CC1244]/15 rounded-full blur-3xl" />

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
        <div className="w-full max-w-2xl bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 text-left">
          <div className="shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-md overflow-hidden relative shadow-xl">
            <Image
              src="https://media.themoviedb.org/t/p/w500/j57QWe3OoaXL9Idi9gLtsAybWLP.jpg"
              alt="Michael"
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#CC1244] text-white font-heading text-xs px-2 py-0.5 rounded-sm tracking-widest">
                ESTRENO
              </span>
              <span className="text-gray-400 text-xs font-body">Biopic / Drama</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
              Michael
            </h2>
            <p className="text-gray-300 text-sm font-body leading-relaxed">
              La historia épica de Michael Jackson, el Rey del Pop. Un viaje íntimo a la vida, música y legado del artista más grande de todos los tiempos.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400 font-body">
              <span>⏱ 138 min</span>
              <span>📅 En cartelera</span>
              <span>🎭 PG-13</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["2D", "VIP"].map((f) => (
                <span key={f} className="border border-white/20 text-white/70 text-xs font-heading tracking-wider px-2 py-0.5 rounded-sm">
                  {f}
                </span>
              ))}
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

        {/* Scroll indicator */}
        <div className="mt-2 flex flex-col items-center gap-2 opacity-40">
          <span className="font-body text-xs text-gray-400 tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-gray-400 to-transparent" />
        </div>
      </div>

      {/* Barra de stats inferior */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10">
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
