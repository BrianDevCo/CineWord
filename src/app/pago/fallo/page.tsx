import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago Fallido" };

export default async function PagoFalloPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 text-center max-w-md w-full">
        {/* Icono */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center text-5xl">
            😞
          </div>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider">
            PAGO FALLIDO
          </h1>
          <p className="text-gray-400 font-body leading-relaxed">
            No pudimos procesar tu pago. Puede ser un problema temporal con tu banco o tarjeta. Tus asientos no fueron cobrados.
          </p>
        </div>

        {/* Razones comunes */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-5 w-full text-left flex flex-col gap-3">
          <p className="font-heading text-xs text-gray-500 tracking-widest">RAZONES COMUNES</p>
          {[
            "Fondos insuficientes",
            "Tarjeta bloqueada o vencida",
            "Límite de pago en línea excedido",
            "Error temporal del banco",
          ].map((r) => (
            <div key={r} className="flex items-center gap-3 text-sm font-body text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
              {r}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            VOLVER AL INICIO
          </Link>
          <Link
            href="/#cartelera"
            className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            INTENTAR DE NUEVO
          </Link>
        </div>
      </div>
    </main>
  );
}
