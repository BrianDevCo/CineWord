export default function Promo() {
  return (
    <section className="flex flex-col lg:flex-row overflow-hidden">
      {/* Lado izquierdo — Rojo */}
      <div className="relative flex-1 bg-[#CC1244] px-10 py-16 lg:px-16 lg:py-20 flex flex-col justify-center overflow-hidden">
        <p className="font-heading text-white/70 text-sm tracking-[0.3em] uppercase mb-4">
          Promoción Especial
        </p>
        <h2 className="font-heading font-bold text-5xl lg:text-7xl text-white leading-none tracking-wider">
          MARTES Y
        </h2>
        <h2 className="font-heading font-bold text-5xl lg:text-7xl text-white leading-none tracking-wider">
          MIÉRCOLES
        </h2>
      </div>

      {/* Lado derecho — Oscuro */}
      <div className="relative flex-1 bg-[#0f0f0f] px-10 py-16 lg:px-16 lg:py-20 flex flex-col justify-center overflow-hidden border-l border-white/5">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-heading font-bold text-5xl lg:text-6xl text-white tracking-wider leading-tight">
              MITAD DE<br />PRECIO
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "🎬", text: "Válido para todas las funciones del día" },
              { icon: "🎟️", text: "Aplica en todas las salas" },
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
          </div>
        </div>
      </div>
    </section>
  );
}
