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
                  Finca Veracruz
                  <br />
                  Auto. Cali - Candelaria #Lt 5
                  <br />
                  Manuela Beltrán, Candelaria
                  <br />
                  Valle del Cauca
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
                  <div className="flex justify-between gap-4 text-gray-400">
                    <span>Todos los días</span>
                    <span className="text-white/70">1:00 PM — 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#CC1244]/15 border border-[#CC1244]/30 rounded-lg flex items-center justify-center shrink-0 text-xl">
                📸
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white tracking-wider mb-2">
                  SÍGUENOS
                </h3>
                <a
                  href="https://www.instagram.com/cineworldmr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-body text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-pink-400">Instagram:</span>
                  <span>@cineworldmr</span>
                </a>
              </div>
            </div>
          </div>

          {/* Mapa real */}
          <div className="rounded-xl overflow-hidden border border-white/10 h-80 lg:h-[420px] relative">
            <iframe
              src="https://maps.google.com/maps?q=3.4161865,-76.4573024&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(30%) contrast(1.1)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación CINEWORLD"
            />
            <a
              href="https://www.google.com/maps/place/Cine+Worlds+MR/@3.4167978,-76.456676,19z/data=!4m6!3m5!1s0x8e30a7420b7f66c9:0x135d79da00bfcf9c!8m2!3d3.4161865!4d-76.4573024!16s%2Fg%2F11y01s5rkd"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-xs tracking-widest px-4 py-2 rounded-sm transition-colors shadow-lg"
            >
              VER EN GOOGLE MAPS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
