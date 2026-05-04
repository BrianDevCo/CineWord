"use client";

import { useState } from "react";
import Link from "next/link";

const TIPOS = [
  { value: "peticion", label: "Petición", desc: "Solicitud de información o acción" },
  { value: "queja", label: "Queja", desc: "Inconformidad con nuestro servicio" },
  { value: "reclamo", label: "Reclamo", desc: "Incumplimiento de un derecho" },
];

export default function PQRPage() {
  const [tipo, setTipo] = useState("peticion");
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula envío (aquí puedes conectar con Resend o un endpoint real)
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-heading text-xs tracking-widest transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          VOLVER AL INICIO
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#CC1244] font-heading tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-[#CC1244]" />
            Atención al cliente
          </p>
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider mb-3">
            PETICIONES, QUEJAS Y RECLAMOS
          </h1>
          <p className="text-gray-500 font-body text-sm leading-relaxed">
            Tu opinión es importante para nosotros. Responderemos tu solicitud en un plazo máximo de 15 días hábiles, conforme a la Ley 1480 de 2011.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-6 py-16 text-center bg-[#111] border border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center text-3xl">
              ✓
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-white tracking-wider mb-2">
                ¡SOLICITUD ENVIADA!
              </h2>
              <p className="text-gray-400 font-body text-sm leading-relaxed max-w-sm">
                Hemos recibido tu solicitud. Recibirás una respuesta en <strong className="text-white">15 días hábiles</strong> al correo <strong className="text-white">{form.email}</strong>.
              </p>
            </div>
            <Link
              href="/"
              className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-colors"
            >
              VOLVER AL INICIO
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Tipo de solicitud */}
            <div className="flex flex-col gap-3">
              <label className="font-heading text-xs text-gray-400 tracking-widest uppercase">
                Tipo de solicitud *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`flex flex-col gap-1 p-4 rounded-xl border text-left transition-all ${
                      tipo === t.value
                        ? "bg-[#CC1244]/10 border-[#CC1244]/60 text-white"
                        : "bg-[#111] border-white/10 text-gray-400 hover:border-white/30"
                    }`}
                  >
                    <span className="font-heading text-sm tracking-wider">{t.label}</span>
                    <span className="font-body text-xs opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="flex flex-col gap-2">
              <label className="font-heading text-xs text-gray-400 tracking-widest uppercase">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Tu nombre completo"
                className="bg-white/5 border border-white/10 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-heading text-xs text-gray-400 tracking-widest uppercase">
                Correo electrónico *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="tu@correo.com"
                className="bg-white/5 border border-white/10 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600 transition-colors"
              />
            </div>

            {/* Mensaje */}
            <div className="flex flex-col gap-2">
              <label className="font-heading text-xs text-gray-400 tracking-widest uppercase">
                Descripción *
              </label>
              <textarea
                required
                minLength={20}
                maxLength={1000}
                rows={5}
                value={form.mensaje}
                onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))}
                placeholder="Describe con detalle tu petición, queja o reclamo..."
                className="bg-white/5 border border-white/10 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600 transition-colors resize-none"
              />
              <span className="text-gray-600 font-body text-xs text-right">
                {form.mensaje.length}/1000
              </span>
            </div>

            {/* Info legal */}
            <p className="text-gray-600 font-body text-xs leading-relaxed">
              Al enviar este formulario autorizas a CINEWORLD a usar tu información para gestionar tu solicitud, de acuerdo con nuestra{" "}
              <Link href="/privacidad" className="text-[#CC1244] hover:underline">
                Política de Privacidad
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={loading || !form.nombre || !form.email || form.mensaje.length < 20}
              className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest py-4 rounded-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ENVIANDO...
                </>
              ) : (
                "ENVIAR SOLICITUD"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
