export default function Promo() {
  return (
    <section className="flex flex-col lg:flex-row overflow-hidden">
      {/* Lado izquierdo — Rojo */}
      <div className="relative flex-1 bg-[#CC1244] px-10 py-16 lg:px-16 lg:py-20 flex flex-col justify-center overflow-hidden">
        {/* Número decorativo de fondo */}
        <span className="absolute -right-8 top-1/2 -translate-y-1/2 font-heading font-bold text-[220px] lg:text-[280px] leading-none text-black/10 select-none pointer-events-none">
          ½
        </span>
        <p className="font-heading text-white/70 text-sm tracking-[0.3em] uppercase mb-4 relative z-10">
          Promoción Especial
        </p>
        <h2 className="font-heading font-bold text-5xl lg:text-7xl text-white leading-none tracking-wider relative z-10">
          MARTES Y
        </h2>
        <h2 className="font-heading font-bold text-5xl lg:text-7xl text-white leading-none tracking-wider relative z-10">
          MIÉRCOLES
        </h2>
      </div>

      {/* Lado derecho — Oscuro */}
      <div className="relative flex-1 bg-[#0f0f0f] px-10 py-16 lg:px-16 lg:py-20 flex flex-col justify-center overflow-hidden border-l border-white/5">
        {/* Texto decorativo de fondo */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 font-heading font-bold text-[180px] lg:text-[220px] leading-none text-white/[0.03] select-none pointer-events-none whitespace-nowrap">
          50% OFF
        </span>

        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <p className="font-heading text-[#CC1244] text-sm tracking-[0.3em] uppercase mb-2">
              Tu entrada a
            </p>
            <h3 className="font-heading font-bold text-5xl lg:text-6xl text-white tracking-wider leading-tight">
              MITAD DE<br />PRECIO
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "🎬", text: "Válido para todas las funciones del día" },
              { icon: "🎭", text: "Aplica en salas 2D, 3D y VIP" },
              { icon: "👥", text: "Sin límite de personas por función" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-400 font-body text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="text-gray-600 text-xs font-body">
            * No acumulable con otras promociones. Sujeto a disponibilidad.
          </p>

          <div className="flex gap-3 flex-wrap">
            <a
              href="#cartelera"
              className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-7 py-3.5 rounded-sm transition-all"
            >
              VER CARTELERA
            </a>
            <a
              href="#cartelera"
              className="border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest px-7 py-3.5 rounded-sm transition-all"
            >
              COMPRAR BOLETO
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
