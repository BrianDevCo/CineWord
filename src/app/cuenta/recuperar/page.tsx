"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta/nueva-contrasena`,
    });

    if (error) {
      setError("No se pudo enviar el correo. Verifica la dirección e intenta de nuevo.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />
        <div className="relative flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center text-4xl">
            ✉️
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-white tracking-wider mb-2">
              ¡CORREO ENVIADO!
            </h2>
            <p className="text-gray-400 font-body text-sm leading-relaxed">
              Revisa tu bandeja de entrada en{" "}
              <span className="text-white font-medium">{email}</span>.
              <br />El enlace expira en 1 hora.
            </p>
          </div>
          <Link href="/cuenta/login" className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all">
            VOLVER AL LOGIN
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CC1244]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <div className="bg-[#CC1244] px-4 py-2 rounded-sm">
              <span className="font-heading text-white text-2xl font-bold tracking-widest">CINEWORLD</span>
            </div>
          </Link>
          <p className="text-gray-500 font-body text-sm mt-3">
            Te enviamos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col gap-5">
          <h1 className="font-heading text-2xl font-bold text-white tracking-wider text-center">
            RECUPERAR CONTRASEÑA
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder-gray-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-body bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-sm tracking-widest py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> ENVIANDO...</>
              ) : "ENVIAR ENLACE"}
            </button>
          </form>

          <p className="text-center text-gray-600 font-body text-sm">
            <Link href="/cuenta/login" className="text-[#CC1244] hover:underline">
              ← Volver al login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
