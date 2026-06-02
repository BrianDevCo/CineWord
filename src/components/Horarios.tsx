export default function Horarios() {
  const info = [
    { icon: "🎟️", label: "Taquilla abre", value: "30 min antes de la primera función" },
    { icon: "🍿", label: "Confitería",     value: "Abre junto con taquilla" },
    { icon: "🌐", label: "Compras",        value: "24 horas por compra web" },
  ];

  return (
    <section id="horarios" className="py-24 bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block font-heading text-[#CC1244] text-xs tracking-widest uppercase border border-[#CC1244]/30 px-4 py-1.5 rounded-sm mb-4">
            Horarios de Atención
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
            ESTAMOS AQUÍ PARA TI
          </h2>
          <p className="mt-3 font-body text-gray-500 text-sm max-w-md mx-auto">
            Abrimos todos los días del año. Ven a vivir la magia del cine cuando más lo necesites.
          </p>
        </div>

        {/* Horario principal */}
        <div className="relative bg-[#CC1244]/5 border border-[#CC1244]/30 rounded-2xl p-6 sm:p-10 mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-center sm:text-left">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#CC1244] text-white font-heading text-[10px] tracking-widest px-4 py-1 rounded-sm whitespace-nowrap">
            PROMO MAR Y MIÉ — 50% DESCUENTO
          </span>

          <div className="text-6xl">🎬</div>

          <div className="flex flex-col gap-1">
            <p className="font-heading text-gray-400 text-sm tracking-widest uppercase">Todos los días</p>
            <p className="font-heading text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-wider">
              1<span className="text-[#CC1244]">:</span>00 <span className="text-gray-500 text-2xl sm:text-3xl">—</span> 10<span className="text-[#CC1244]">:</span>00 PM
            </p>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {info.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 bg-[#111] border border-white/8 rounded-xl p-4"
            >
              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="font-heading text-gray-500 text-[10px] tracking-widest uppercase">{item.label}</p>
                <p className="font-body text-white text-sm mt-0.5 leading-snug">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
