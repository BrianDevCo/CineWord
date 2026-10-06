"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="relative flex flex-col items-center gap-6 text-center max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-[#CC1244]/10 border-2 border-[#CC1244]/40 flex items-center justify-center text-4xl">
          🎞️
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold text-white tracking-wider">ALGO SALIÓ MAL</h1>
          <p className="text-gray-400 font-body text-sm leading-relaxed">
            Tuvimos un problema cargando esta página. Intenta de nuevo en unos segundos.
          </p>
          {error.digest && <p className="text-gray-600 font-mono text-xs">Código: {error.digest}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => unstable_retry()}
            className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
          >
            REINTENTAR
          </button>
          <Link
            href="/"
            className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
          >
            VOLVER AL INICIO
          </Link>
        </div>
      </div>
    </main>
  );
}
