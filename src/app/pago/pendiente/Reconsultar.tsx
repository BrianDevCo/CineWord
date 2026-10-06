"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Vuelve a consultar el estado del pago cada pocos segundos (PSE / Nequi / Bancolombia)
export default function Reconsultar({ transactionId }: { transactionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`/pago/resultado?id=${encodeURIComponent(transactionId)}`);
    }, 5000);
    return () => clearTimeout(t);
  }, [router, transactionId]);

  return (
    <p className="text-gray-600 font-body text-xs flex items-center gap-2">
      <span className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      Verificando el estado de tu pago…
    </p>
  );
}
