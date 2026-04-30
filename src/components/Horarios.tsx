export default function Horarios() {
  const schedule = [
    {
      days: "Lunes — Viernes",
      hours: "10:00 AM – 10:00 PM",
      note: "Martes y Miércoles 50% de descuento",
      highlight: true,
      icon: "🎬",
    },
    {
      days: "Sábado",
      hours: "9:00 AM – 11:00 PM",
      note: "Función de medianoche disponible",
      highlight: false,
      icon: "🌙",
    },
    {
      days: "Domingo",
      hours: "10:00 AM – 9:00 PM",
      note: "Última función a las 8:00 PM",
      highlight: false,
      icon: "☀️",
    },
    {
      days: "Festivos",
      hours: "10:00 AM – 10:00 PM",
      note: "Mismo horario que sábado",
      highlight: false,
      icon: "🎉",
    },
  ];

  const info = [
    { icon: "🎟️", label: "Taquilla abre", value: "30 min antes de la primera función" },
    { icon: "🍿", label: "Confitería", value: "Abre junto con taquilla" },
    { icon: "🅿️", label: "Parqueadero", value: "Disponible hasta media hora después del cierre" },
    { icon: "📞", label: "Reservas", value: "24 horas por la app o web" },
  ];

  return (
    <section id="horarios" className="py-24 bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14">
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

        {/* Schedule cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {schedule.map((s) => (
            <div
              key={s.days}
              className={`relative flex flex-col gap-3 rounded-xl p-6 border transition-all ${
                s.highlight
                  ? "bg-[#CC1244]/5 border-[#CC1244]/30"
                  : "bg-[#111] border-white/8"
              }`}
            >
              {s.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#CC1244] text-white font-heading text-[10px] tracking-widest px-3 py-0.5 rounded-sm whitespace-nowrap">
                  PROMO ESPECIAL
                </span>
              )}
              <span className="text-3xl">{s.icon}</span>
              <div>
                <p className="font-heading text-white text-sm tracking-wider">{s.days}</p>
                <p className="font-heading text-[#CC1244] text-xl font-bold mt-1">{s.hours}</p>
              </div>
              <p className="font-body text-gray-500 text-xs leading-relaxed">{s.note}</p>
            </div>
          ))}
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
