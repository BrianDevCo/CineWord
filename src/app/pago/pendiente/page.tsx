import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago Pendiente" };

export default function PagoPendientePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0a0a0a] to-black pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 text-center max-w-md w-full">
        <div className="w-24 h-24 rounded-full bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center text-5xl">
          ⏳
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider">
            PAGO PENDIENTE
          </h1>
          <p className="text-gray-400 font-body leading-relaxed">
            Tu pago está siendo procesado. Esto puede tardar unos minutos dependiendo de tu método de pago. Te notificaremos por correo cuando se confirme.
          </p>
        </div>

        <div className="bg-[#111] border border-amber-500/20 rounded-xl px-6 py-4 w-full text-left flex gap-4">
          <span className="text-2xl shrink-0">📧</span>
          <div>
            <p className="font-heading text-amber-400 text-xs tracking-widest mb-1">EN PROCESO</p>
            <p className="text-gray-500 font-body text-sm">
              No cierres tu correo. Te enviaremos el boleto cuando el pago se apruebe.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/cuenta"
            className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            MIS RESERVAS
          </Link>
          <Link
            href="/"
            className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            VER CARTELERA
          </Link>
        </div>
      </div>
    </main>
  );
}
