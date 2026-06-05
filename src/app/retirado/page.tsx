export default function RetiradoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#CC1244]/8 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#CC1244]/5 blur-[120px] rounded-full" />

      {/* Tira de película arriba */}
      <div className="absolute top-0 left-0 right-0 flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 h-3 border-r border-white/5 odd:bg-white/[0.02]" />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Ícono */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-px bg-white/20 rotate-45" />
          </div>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-wider leading-tight">
            SITIO SUSPENDIDO
          </h1>
          <p className="font-body text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            Este sitio web fue suspendido por el desarrollador debido a
            incumplimiento en los términos del servicio contratado.
          </p>
        </div>

        {/* Divisor */}
        <div className="w-16 h-px bg-white/10" />

        {/* Contacto */}
        <p className="font-body text-gray-600 text-xs leading-relaxed">
          Si tienes preguntas, comunícate directamente con el cine.<br />
          <span className="text-gray-500">Centro Comercial MR Outlet · Cali, Valle del Cauca</span>
        </p>
      </div>

      {/* Tira de película abajo */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 h-3 border-r border-white/5 odd:bg-white/[0.02]" />
        ))}
      </div>
    </main>
  );
}
