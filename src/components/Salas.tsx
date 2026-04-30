"use client";

const salas = [
  {
    name: "Sala Regular",
    tag: "DESDE $12.000",
    icon: "🎬",
    description: "Pantalla de alta definición con sonido Dolby Digital. La mejor relación calidad-precio para vivir el cine.",
    features: ["Pantalla Full HD", "Sonido Dolby Digital", "Sillas reclinables", "Vista perfecta desde cualquier asiento"],
    color: "#4488ff",
    bg: "from-[#001133] to-[#000a1f]",
    seats: [6, 8, 8, 8, 8, 6],
  },
  {
    name: "Sala 3D",
    tag: "DESDE $18.000",
    icon: "🥽",
    description: "Sumérgete en la acción con nuestra tecnología 3D de última generación. Gafas 3D incluidas.",
    features: ["Proyección 3D activa", "Sonido surround 7.1", "Pantalla XL", "Gafas 3D incluidas"],
    color: "#CC1244",
    bg: "from-[#330011] to-[#1a000a]",
    seats: [6, 8, 8, 8, 8, 6],
  },
  {
    name: "Sala VIP",
    tag: "DESDE $28.000",
    icon: "⭐",
    description: "La experiencia premium de CINEWORLD. Butacas de lujo, servicio a la silla y ambiente exclusivo.",
    features: ["Butacas reclinables de cuero", "Servicio a la silla", "Menú gourmet exclusivo", "Ambiente premium"],
    color: "#f5a623",
    bg: "from-[#2a1900] to-[#150d00]",
    seats: [4, 6, 6, 4],
  },
];

function MiniSeatMap({ seats, color }: { seats: number[]; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pantalla mini */}
      <div className="w-3/4 h-1 rounded-full mb-1" style={{ background: `${color}60` }} />
      {seats.map((count, row) => (
        <div key={row} className="flex gap-1 justify-center">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-2.5 rounded-t-sm"
              style={{ backgroundColor: `${color}40`, border: `1px solid ${color}60` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Salas() {
  return (
    <section id="salas" className="py-20 lg:py-28 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-1 flex items-center justify-center gap-2">
            <span className="inline-block w-6 h-px bg-[#CC1244]" />
            Experiencias únicas
            <span className="inline-block w-6 h-px bg-[#CC1244]" />
          </p>
          <h2 className="font-heading text-5xl sm:text-6xl font-bold text-white tracking-wider">
            NUESTRAS SALAS
          </h2>
        </div>

        {/* Cards horizontales */}
        <div className="flex flex-col gap-6">
          {salas.map((sala, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 bg-gradient-to-br ${sala.bg}`}
            >
              {/* Barra lateral de color */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: sala.color }} />

              <div className="flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-10 pl-10 lg:pl-12">
                {/* Mini mapa de sala */}
                <div className="shrink-0 hidden lg:block">
                  <MiniSeatMap seats={sala.seats} color={sala.color} />
                </div>

                {/* Divider vertical */}
                <div className="hidden lg:block w-px self-stretch bg-white/10" />

                {/* Info */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                        style={{ backgroundColor: `${sala.color}20`, border: `1px solid ${sala.color}40` }}
                      >
                        {sala.icon}
                      </div>
                      <div>
                        <h3 className="font-heading text-2xl font-bold text-white tracking-wider">
                          {sala.name}
                        </h3>
                        <span
                          className="font-heading text-xs tracking-widest"
                          style={{ color: sala.color }}
                        >
                          {sala.tag}
                        </span>
                      </div>
                    </div>
                    <a
                      href="#cartelera"
                      className="font-heading text-sm tracking-widest px-6 py-2.5 rounded-sm border transition-all duration-200 shrink-0 hover:text-white"
                      style={{ borderColor: sala.color, color: sala.color }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.backgroundColor = sala.color;
                        el.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.backgroundColor = "transparent";
                        el.style.color = sala.color;
                      }}
                    >
                      VER FUNCIONES
                    </a>
                  </div>

                  <p className="text-gray-400 font-body text-sm leading-relaxed">
                    {sala.description}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {sala.features.map((f, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1.5 text-sm font-body text-gray-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sala.color }} />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Selección de asientos */}
        <div className="mt-10 relative rounded-2xl overflow-hidden border border-[#CC1244]/20 bg-gradient-to-r from-[#CC1244]/10 via-transparent to-[#CC1244]/10 p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="font-heading font-bold text-[200px] text-white leading-none">🪑</span>
          </div>
          <div className="relative z-10">
            <h3 className="font-heading text-2xl font-bold text-white tracking-wider mb-1">
              SELECCIÓN DE ASIENTOS EN LÍNEA
            </h3>
            <p className="text-gray-400 font-body text-sm">
              Elige tu asiento favorito con nuestro mapa interactivo al comprar tu boleto online.
            </p>
          </div>
          <a
            href="#cartelera"
            className="relative z-10 shrink-0 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-4 rounded-sm transition-all duration-200 shadow-lg shadow-[#CC1244]/20"
          >
            COMPRAR AHORA
          </a>
        </div>
      </div>
    </section>
  );
}
