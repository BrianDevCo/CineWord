"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      setLoading(false);
      return;
    }

    router.push("/cuenta");
  };

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
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col gap-5">
          <h1 className="font-heading text-2xl font-bold text-white tracking-wider text-center">
            NUEVA CONTRASEÑA
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">NUEVA CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder-gray-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">CONFIRMAR CONTRASEÑA</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repite tu contraseña"
                className="bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-4 py-3 rounded-lg outline-none transition-colors placeholder-gray-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-body bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-sm tracking-widest py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> GUARDANDO...</>
              ) : "GUARDAR CONTRASEÑA"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
