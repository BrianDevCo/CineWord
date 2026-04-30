export default function Contacto() {
  return (
    <section id="contacto" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">
            — Encuéntranos
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
            CONTACTO Y UBICACIÓN
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Info */}
          <div className="flex flex-col gap-8">
            {/* Dirección */}
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#CC1244]/15 border border-[#CC1244]/30 rounded-lg flex items-center justify-center shrink-0 text-xl">
                📍
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white tracking-wider mb-1">
                  DIRECCIÓN
                </h3>
                <p className="text-gray-400 font-body">
                  Centro Comercial MR Outlet
                  <br />
                  Cra 3 y Carrera Cali
                  <br />
                  Piso 2 — Cartelera Principal
                </p>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#CC1244]/15 border border-[#CC1244]/30 rounded-lg flex items-center justify-center shrink-0 text-xl">
                🕐
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white tracking-wider mb-2">
                  HORARIOS DE ATENCIÓN
                </h3>
                <div className="flex flex-col gap-1 font-body text-sm">
                  {[
                    { dia: "Lunes — Viernes", hora: "12:00 PM — 11:30 PM" },
                    { dia: "Sábado", hora: "10:00 AM — 12:00 AM" },
                    { dia: "Domingo y Festivos", hora: "10:00 AM — 11:30 PM" },
                  ].map((h, i) => (
                    <div key={i} className="flex justify-between gap-4 text-gray-400">
                      <span>{h.dia}</span>
                      <span className="text-white/70">{h.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#CC1244]/15 border border-[#CC1244]/30 rounded-lg flex items-center justify-center shrink-0 text-xl">
                📱
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white tracking-wider mb-2">
                  CONTÁCTANOS
                </h3>
                <div className="flex flex-col gap-2 font-body text-gray-400">
                  <a href="https://wa.me/57300000000" className="flex items-center gap-2 hover:text-white transition-colors">
                    <span className="text-green-400">WhatsApp:</span>
                    <span>+57 300 000 0000</span>
                  </a>
                  <a href="https://instagram.com/cineworldmr" className="flex items-center gap-2 hover:text-white transition-colors">
                    <span className="text-pink-400">Instagram:</span>
                    <span>@cineworldmr</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="flex gap-3 mt-2">
              {[
                { icon: "📸", label: "Instagram", href: "https://instagram.com/cineworldmr" },
                { icon: "💬", label: "WhatsApp", href: "https://wa.me/57300000000" },
                { icon: "📘", label: "Facebook", href: "#" },
                { icon: "🎵", label: "TikTok", href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  className="w-11 h-11 bg-[#1a1a1a] hover:bg-[#CC1244] border border-white/10 hover:border-[#CC1244] rounded-lg flex items-center justify-center text-lg transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Mapa simulado */}
          <div className="rounded-xl overflow-hidden border border-white/10 h-80 lg:h-full min-h-64 bg-[#111] relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2a] to-[#0a0a15]" />
            {/* Grid de mapa simulado */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(#ffffff11 1px, transparent 1px), linear-gradient(90deg, #ffffff11 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-12 h-12 bg-[#CC1244] rounded-full flex items-center justify-center animate-pulse-red text-2xl">
                📍
              </div>
              <div>
                <p className="font-heading text-white text-lg font-bold tracking-wider">CINEWORLD</p>
                <p className="text-gray-400 font-body text-sm mt-1">CC MR Outlet — Cra 3 y Cra Cali</p>
              </div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-xs tracking-widest px-5 py-2.5 rounded-sm transition-colors"
              >
                VER EN GOOGLE MAPS
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
