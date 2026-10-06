import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTransaccion } from "@/lib/wompi";
import { procesarTransaccion } from "@/lib/ordenes";

export const metadata: Metadata = { title: "Resultado del Pago" };

// Wompi redirige aquí con ?id=<transaction_id>&env=<test|prod>
export default async function PagoResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/pago/fallo");

  const tx = await getTransaccion(id);
  if (!tx) redirect("/pago/fallo");

  // Respaldo del webhook: si el pago ya está aprobado, confirma la compra (idempotente)
  const orden = await procesarTransaccion(tx);

  if (tx.status === "PENDING" || (tx.status === "APPROVED" && orden?.estado === "procesando")) {
    redirect(`/pago/pendiente?id=${encodeURIComponent(tx.id)}`);
  }
  if (tx.status === "APPROVED" && orden?.estado === "pagado") {
    redirect(`/pago/exito?payment_id=${encodeURIComponent(tx.id)}`);
  }
  if (tx.status !== "APPROVED") {
    redirect(`/pago/fallo?payment_id=${encodeURIComponent(tx.id)}`);
  }

  // Pago aprobado pero la reserva no se pudo completar → revisión manual
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0a0a0a] to-black pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 text-center max-w-md w-full">
        <div className="w-24 h-24 rounded-full bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center text-5xl">
          ⚠️
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider">
            PAGO RECIBIDO
          </h1>
          <p className="text-gray-400 font-body leading-relaxed">
            Tu pago fue aprobado, pero tuvimos un problema al emitir tu boleto. Nuestro equipo lo revisará y te contactará por correo. Si lo prefieres, escríbenos por PQR con tu número de pago.
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl px-6 py-4 w-full">
          <p className="text-gray-600 font-heading text-xs tracking-widest mb-1">NÚMERO DE PAGO</p>
          <p className="text-white font-body text-sm font-mono">{tx.id}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/pqr"
            className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            IR A PQR
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
