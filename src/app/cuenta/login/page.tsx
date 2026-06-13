"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { VENTA_ONLINE } from "@/lib/config";

export default function LoginPage() {
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const redirect = searchParams?.get("redirect") || "/cuenta";
  const [showAdminForm, setShowAdminForm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "Correo o contraseña incorrectos."
          : "Ocurrió un error. Intenta de nuevo."
      );
      setLoading(false);
      return;
    }

    window.location.href = redirect;
  };

  const handleGoogle = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/cuenta/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  if (!VENTA_ONLINE && !showAdminForm && !redirect.startsWith("/admin")) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CC1244]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col items-center gap-6 text-center max-w-sm">
          <Link href="/">
            <div className="bg-[#CC1244] px-4 py-2 rounded-sm">
              <span className="font-heading text-white text-2xl font-bold tracking-widest">CINEWORLD</span>
            </div>
          </Link>
          <div className="w-16 h-16 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center text-3xl">🎟️</div>
          <div>
            <p className="font-heading text-white text-xl tracking-wider mb-2">COMPRA EN LÍNEA PRÓXIMAMENTE</p>
            <p className="text-gray-500 font-body text-sm leading-relaxed">
              Estamos preparando la venta de boletos en línea.<br />
              Por ahora adquiere tus boletos en <span className="text-white">taquilla</span>.
            </p>
          </div>
          <Link href="/" className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all">
            VER CARTELERA
          </Link>
          <button onClick={() => setShowAdminForm(true)} className="text-white/10 hover:text-white/30 font-body text-[10px] transition-colors mt-4">
            Acceso staff
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CC1244]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <div className="bg-[#CC1244] px-4 py-2 rounded-sm">
              <span className="font-heading text-white text-2xl font-bold tracking-widest">
                CINEWORLD
              </span>
            </div>
          </Link>
          <p className="text-gray-500 font-body text-sm mt-3">
            Inicia sesión para ver tus boletos
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col gap-5">
          <h1 className="font-heading text-2xl font-bold text-white tracking-wider text-center">
            INICIAR SESIÓN
          </h1>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-body text-sm font-medium py-3 px-4 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs font-body">o con correo</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-heading text-xs text-gray-500 tracking-widest">
                  CONTRASEÑA
                </label>
                <Link
                  href="/cuenta/recuperar"
                  className="text-xs font-body text-gray-500 hover:text-[#CC1244] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
              className="w-full bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-sm tracking-widest py-3.5 rounded-lg transition-all mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  INGRESANDO...
                </>
              ) : (
                "INGRESAR"
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 font-body text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/cuenta/registrar" className="text-[#CC1244] hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs font-body mt-6">
          © CINEWORLD · Centro Comercial MR Outlet
        </p>
      </div>
    </main>
  );
}
