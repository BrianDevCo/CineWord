import Link from "next/link";
import type { Metadata } from "next";
import TicketResumen from "./TicketResumen";

export const metadata: Metadata = { title: "¡Pago Exitoso!" };

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; status?: string }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-[#001a0a] via-[#0a0a0a] to-black pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 text-center max-w-md w-full">

        {/* Ícono */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center text-5xl">
            🎟️
          </div>
          <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Mensaje */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider">
            ¡PAGO EXITOSO!
          </h1>
          <p className="text-gray-400 font-body leading-relaxed text-sm">
            Tu reserva fue confirmada. Revisa tu correo — te enviamos el boleto con el código QR para presentar en taquilla.
          </p>
        </div>

        {/* Detalle del boleto (desde sessionStorage) */}
        <TicketResumen />

        {/* ID de pago */}
        {paymentId && (
          <div className="bg-[#111] border border-white/10 rounded-xl px-6 py-4 w-full">
            <p className="text-gray-600 font-heading text-xs tracking-widest mb-1">NÚMERO DE PAGO</p>
            <p className="text-white font-body text-sm font-mono">{paymentId}</p>
          </div>
        )}

        {/* Recordatorio email */}
        <div className="bg-[#111] border border-green-500/20 rounded-xl px-6 py-4 w-full text-left flex gap-4">
          <span className="text-2xl shrink-0">📧</span>
          <div>
            <p className="font-heading text-green-400 text-xs tracking-widest mb-1">REVISA TU CORREO</p>
            <p className="text-gray-500 font-body text-sm">
              Si no lo ves en unos minutos, revisa la carpeta de spam.
            </p>
          </div>
        </div>

        {/* Acciones */}
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
