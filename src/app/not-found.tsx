import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">

        {/* Número 404 */}
        <div className="relative">
          <span className="font-heading font-bold text-[180px] leading-none text-white/5 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-[#CC1244]">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col gap-3">
          <h1 className="font-heading font-bold text-3xl text-white tracking-wider">
            PÁGINA NO ENCONTRADA
          </h1>
          <p className="text-gray-500 font-body text-sm leading-relaxed">
            La página que buscas no existe o fue movida.
            <br />
            Vuelve a la cartelera y elige tu próxima película.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-6 py-3.5 rounded-sm transition-colors text-center"
          >
            IR A CARTELERA
          </Link>
          <Link
            href="/#contacto"
            className="flex-1 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-heading text-sm tracking-widest px-6 py-3.5 rounded-sm transition-colors text-center"
          >
            CONTACTO
          </Link>
        </div>
      </div>
    </main>
  );
}
