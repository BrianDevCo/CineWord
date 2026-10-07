"use client";

import { useState } from "react";
import Link from "next/link";
import { CINE, DIRECCION_COMPLETA, whatsappUrl } from "@/lib/cine";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [estado, setEstado] = useState<"idle" | "loading" | "error">("idle");
  const wa = whatsappUrl("Hola CINEWORLD, quiero información sobre eventos y cumpleaños");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    try {
      const res = await fetch("/api/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      setEstado("idle");
    } catch {
      setEstado("error");
    }
  };

  const legales = [
    CINE.razonSocial,
    CINE.nit && `NIT ${CINE.nit}`,
    CINE.telefono && `Tel. ${CINE.telefono}`,
    CINE.email,
  ].filter(Boolean);

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <div className="bg-[#CC1244] px-3 py-1.5 rounded-sm w-fit">
              <span className="font-heading text-white text-xl font-bold tracking-widest">
                CINEWORLD
              </span>
            </div>
            <p className="text-gray-500 font-body text-sm leading-relaxed">
              Tu destino favorito para vivir la magia del cine. Películas de estreno, comodidad y la mejor experiencia audiovisual.
            </p>
            <div className="flex gap-3">
              {[
                { icon: "📸", href: CINE.instagram.url, label: "Instagram" },
                ...(wa ? [{ icon: "💬", href: wa, label: "WhatsApp" }] : []),
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 bg-white/5 hover:bg-[#CC1244] border border-white/10 hover:border-[#CC1244] rounded-md flex items-center justify-center text-sm transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm text-white tracking-widest uppercase">Navegación</h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Cartelera", href: "/#cartelera" },
                { label: "Próximos Estrenos", href: "/#proximos" },
                { label: "Combos", href: "/#snacks" },
                { label: "Horarios", href: "/#horarios" },
                { label: "Precios", href: "/#precios" },
                { label: "Contacto", href: "/#contacto" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-gray-500 hover:text-white font-body text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm text-white tracking-widest uppercase">Servicios</h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Mi cuenta y boletos", href: "/cuenta", externo: false },
                { label: "Eventos y cumpleaños", href: wa ?? "/#contacto", externo: Boolean(wa) },
                { label: "Peticiones, quejas y reclamos", href: "/pqr", externo: false },
              ].map((l) => (
                <li key={l.label}>
                  {l.externo ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white font-body text-sm transition-colors">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-gray-500 hover:text-white font-body text-sm transition-colors">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="font-heading text-sm text-white tracking-widest uppercase">Novedades</h4>
            <p className="text-gray-500 font-body text-sm">
              Recibe la cartelera y promociones directo en tu correo.
            </p>

            {subscribed ? (
              <div className="flex flex-col gap-2 bg-green-500/10 border border-green-500/30 rounded-sm px-4 py-3">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-heading text-sm tracking-widest">¡SUSCRITO!</span>
                </div>
                <p className="text-gray-400 font-body text-xs">
                  Recibirás la cartelera cada semana en tu correo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  aria-label="Correo electrónico"
                  required
                  className="bg-white/5 border border-white/10 text-white placeholder:text-gray-600 font-body text-sm px-4 py-2.5 rounded-sm outline-none focus:border-[#CC1244] transition-colors"
                />
                {estado === "error" && (
                  <p className="text-red-400 font-body text-xs">No pudimos registrarte. Intenta de nuevo.</p>
                )}
                <button
                  type="submit"
                  disabled={estado === "loading"}
                  className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-xs tracking-widest py-2.5 rounded-sm transition-colors"
                >
                  {estado === "loading" ? "ENVIANDO..." : "SUSCRIBIRME"}
                </button>
                <p className="text-gray-600 font-body text-[11px] leading-snug">
                  Al suscribirte aceptas nuestra <Link href="/privacidad" className="underline hover:text-gray-400">Política de Privacidad</Link>.
                </p>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-gray-600 font-body text-xs">
              © {currentYear} CINEWORLD. Todos los derechos reservados.
            </p>
            <p className="text-gray-700 font-body text-[11px]">{DIRECCION_COMPLETA}</p>
            {legales.length > 0 && (
              <p className="text-gray-700 font-body text-[11px]">{legales.join(" · ")}</p>
            )}
          </div>
          <div className="flex gap-6">
            {[
              { label: "Términos y Condiciones", href: "/terminos" },
              { label: "Privacidad", href: "/privacidad" },
              { label: "PQR", href: "/pqr" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="text-gray-600 hover:text-gray-400 font-body text-xs transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
