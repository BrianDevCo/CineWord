export default function Precios() {
  const grupos = [
    {
      dias: ["Lunes", "Jueves"],
      subtitulo: "Entre semana",
      general: 12000,
      premium: 18000,
      tag: null,
      highlight: false,
      dotColor: "bg-sky-400",
      textColor: "text-white",
    },
    {
      dias: ["Martes", "Miércoles"],
      subtitulo: "Promo especial",
      general: 7000,
      premium: 10000,
      tag: "MITAD DE PRECIO",
      highlight: true,
      dotColor: "bg-[#CC1244]",
      textColor: "text-[#CC1244]",
      horario: "Solo funciones antes de las 3:00 PM",
    },
    {
      dias: ["Viernes", "Sábado", "Domingo"],
      subtitulo: "Fin de semana",
      general: 14000,
      premium: 20000,
      tag: null,
      highlight: false,
      dotColor: "bg-amber-400",
      textColor: "text-white",
    },
  ];

  function fmt(n: number) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <section id="precios" className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      {/* Decorative film-strip top */}
      <div className="absolute top-0 left-0 right-0 flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 h-3 border-r border-white/5 odd:bg-white/[0.02]" />
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">
            — Tarifas
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
            PRECIOS DE BOLETERÍA
          </h2>
          <p className="text-gray-500 font-body text-sm mt-4 max-w-sm mx-auto leading-relaxed">
            Disfruta el cine con tarifas especiales según el día de la semana.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {grupos.map((g) => (
            <div
              key={g.dias.join()}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
                g.highlight
                  ? "bg-gradient-to-b from-[#CC1244]/10 to-[#CC1244]/5 border-[#CC1244]/40 shadow-xl shadow-[#CC1244]/10"
                  : "bg-[#111] border-white/8 hover:border-white/15"
              }`}
            >
              {/* Tag flotante */}
              {g.tag && (
                <div className="absolute -top-0 left-0 right-0 flex justify-center">
                  <span className="bg-[#CC1244] text-white font-heading text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-b-lg shadow-lg shadow-[#CC1244]/30">
                    ★ {g.tag} ★
                  </span>
                </div>
              )}

              {/* Tope de la card */}
              <div className={`px-6 pt-8 pb-5 flex flex-col gap-2 ${g.tag ? "pt-10" : ""}`}>
                <p className="font-body text-gray-500 text-xs tracking-widest uppercase">
                  {g.subtitulo}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {g.dias.map((dia, idx) => (
                    <span key={dia} className="flex items-center gap-2">
                      <span className="font-heading text-white font-bold text-lg leading-none">
                        {dia}
                      </span>
                      {idx < g.dias.length - 1 && (
                        <span className="text-white/20 font-light">·</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Horario restricción */}
              {"horario" in g && g.horario && (
                <div className="mx-6 mb-4 flex items-center gap-2 bg-[#CC1244]/15 border border-[#CC1244]/40 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-[#CC1244] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-heading text-[#CC1244] text-xs tracking-wide font-bold">
                    {g.horario}
                  </span>
                </div>
              )}

              {/* Divisor tipo ticket */}
              <div className="relative mx-4 flex items-center gap-0">
                <div className="absolute -left-8 w-5 h-5 rounded-full bg-[#0a0a0a] border-r border-white/8" />
                <div className="flex-1 border-t border-dashed border-white/10" />
                <div className="absolute -right-8 w-5 h-5 rounded-full bg-[#0a0a0a] border-l border-white/8" />
              </div>

              {/* Precios */}
              <div className="px-6 pt-5 pb-6 flex flex-col gap-3">
                {/* General */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </div>
                    <span className="font-heading text-gray-400 text-xs tracking-widest">
                      GENERAL
                    </span>
                  </div>
                  <span className={`font-heading font-bold text-2xl tracking-tight ${g.textColor}`}>
                    {fmt(g.general)}
                  </span>
                </div>

                {/* Separador */}
                <div className="h-px bg-white/5" />

                {/* Premium */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                    </div>
                    <span className="font-heading text-gray-400 text-xs tracking-widest">
                      PREMIUM
                    </span>
                  </div>
                  <span className={`font-heading font-bold text-2xl tracking-tight ${g.textColor}`}>
                    {fmt(g.premium)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nota inferior */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 text-gray-600 font-body text-xs">
            <svg className="w-3.5 h-3.5 text-[#CC1244]/60 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            Precios incluyen IVA
          </div>
          <div className="hidden sm:block w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2 text-gray-600 font-body text-xs">
            <svg className="w-3.5 h-3.5 text-[#CC1244]/60 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            No aplica con otras promociones
          </div>
          <div className="hidden sm:block w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2 text-gray-600 font-body text-xs">
            <svg className="w-3.5 h-3.5 text-[#CC1244]/60 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            Sujeto a cambio sin previo aviso
          </div>
        </div>
      </div>

      {/* Decorative film-strip bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 h-3 border-r border-white/5 odd:bg-white/[0.02]" />
        ))}
      </div>
    </section>
  );
}
