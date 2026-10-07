// Esqueleto mientras carga la película (se ve al navegar desde la cartelera)
export default function Loading() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen animate-pulse" aria-busy="true" aria-label="Cargando película">
      <section className="relative min-h-[55vh] sm:min-h-[70vh] flex items-end bg-gradient-to-b from-[#151515] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 flex flex-col gap-4">
          <div className="h-3 w-24 bg-white/10 rounded-sm" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-[#CC1244]/30 rounded-sm" />
            <div className="h-6 w-32 bg-white/10 rounded-sm" />
          </div>
          <div className="h-12 sm:h-16 w-3/4 max-w-xl bg-white/10 rounded-sm" />
          <div className="h-4 w-1/2 max-w-sm bg-white/5 rounded-sm" />
          <div className="h-12 w-48 bg-[#CC1244]/30 rounded-sm mt-2" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-6">
        <div className="h-8 w-56 bg-white/10 rounded-sm" />
        <div className="flex gap-3 flex-wrap">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 w-24 bg-[#111] border border-white/5 rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  );
}
