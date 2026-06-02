export default function Horarios() {
  const info = [
    { icon: "🎟️", label: "Taquilla", value: "Abre 30 min antes de la primera función" },
    { icon: "🍿", label: "Confitería", value: "Abre junto con taquilla" },
    { icon: "🌐", label: "Compra online", value: "Disponible las 24 horas" },
  ];

  return (
    <section id="horarios" className="py-24 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">— Horarios</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
            ESTAMOS AQUÍ PARA TI
          </h2>
        </div>

        {/* Horario principal — gran display */}
        <div className="flex flex-col items-center gap-3 mb-14 text-center">
          <p className="font-heading text-gray-500 text-xs tracking-[0.3em] uppercase">
            Abiertos todos los días
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center">
              <span className="font-heading text-white font-bold text-6xl sm:text-8xl lg:text-9xl leading-none tracking-tight">
                1<span className="text-[#CC1244]">:</span>00
              </span>
              <span className="font-heading text-gray-500 text-xs tracking-widest mt-1">PM</span>
            </div>
            <span className="text-[#CC1244] text-4xl sm:text-6xl font-heading font-light">—</span>
            <div className="flex flex-col items-center">
              <span className="font-heading text-white font-bold text-6xl sm:text-8xl lg:text-9xl leading-none tracking-tight">
                10<span className="text-[#CC1244]">:</span>00
              </span>
              <span className="font-heading text-gray-500 text-xs tracking-widest mt-1">PM</span>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="w-full h-px bg-white/5 mb-10" />

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {info.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center gap-3 bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-[#CC1244]/20 transition-colors"
            >
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="font-heading text-white text-sm tracking-widest uppercase mb-1">{item.label}</p>
                <p className="font-body text-gray-500 text-sm leading-snug">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
