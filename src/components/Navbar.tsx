"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import ThemeToggle from "./ThemeToggle";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!url || url.includes("TU_PROYECTO")) return;

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.refresh();
  };

  const isLight = theme === "light";

  const nombreUsuario =
    user?.user_metadata?.nombre_completo ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";
  const inicial = nombreUsuario.charAt(0).toUpperCase();

  const links = [
    { label: "Cartelera", href: "/#cartelera" },
    { label: "Horarios", href: "/#horarios" },
    { label: "Próximos", href: "/#proximos" },
    { label: "Combos", href: "/#snacks" },
    { label: "Contacto", href: "/#contacto" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? isLight
            ? "bg-white/95 backdrop-blur-md shadow-md shadow-black/8 border-b border-black/8"
            : "bg-black/95 backdrop-blur-md shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-0 shrink-0">
            <div className="bg-[#CC1244] px-3 py-1.5 rounded-sm">
              <span className="font-heading text-white text-xl lg:text-2xl font-bold tracking-widest">
                CINEWORLD
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`font-heading text-sm tracking-widest uppercase transition-colors duration-200 hover:text-[#CC1244] ${
                  isLight ? "text-gray-600" : "text-gray-300"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              /* Reservas + Avatar con dropdown */
              <div className="flex items-center gap-2">
                <Link
                  href="/cuenta"
                  className={`flex items-center gap-2 font-heading text-xs tracking-widest px-4 py-2.5 rounded-sm border transition-all ${
                    isLight
                      ? "border-black/20 text-gray-700 hover:border-[#CC1244] hover:text-[#CC1244]"
                      : "border-white/20 text-gray-300 hover:border-[#CC1244] hover:text-[#CC1244]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
                  </svg>
                  MIS RESERVAS
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#CC1244] flex items-center justify-center text-white font-heading text-sm font-bold">
                      {inicial}
                    </div>
                    <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""} ${isLight ? "text-gray-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                      <Link
                        href="/cuenta"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white font-body text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi cuenta
                      </Link>
                      <div className="border-t border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-500/10 hover:text-red-400 font-body text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Botones login / registro */
              <div className="flex items-center gap-2">
                <Link
                  href="/cuenta/login"
                  className={`font-heading text-xs tracking-widest px-4 py-2.5 rounded-sm border transition-all ${
                    isLight
                      ? "border-black/20 text-gray-700 hover:border-[#CC1244] hover:text-[#CC1244]"
                      : "border-white/20 text-gray-300 hover:border-[#CC1244] hover:text-[#CC1244]"
                  }`}
                >
                  INGRESAR
                </Link>
                <a
                  href="/#cartelera"
                  className="flex items-center gap-2 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-5 py-2.5 rounded-sm transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
                  </svg>
                  COMPRAR
                </a>
              </div>
            )}
          </div>

          {/* Mobile: ThemeToggle + hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2"
              aria-label="Menu"
            >
              <div className="w-6 flex flex-col gap-1.5">
                <span className={`block h-0.5 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""} ${isLight ? "bg-black" : "bg-white"}`} />
                <span className={`block h-0.5 transition-all ${menuOpen ? "opacity-0" : ""} ${isLight ? "bg-black" : "bg-white"}`} />
                <span className={`block h-0.5 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""} ${isLight ? "bg-black" : "bg-white"}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`lg:hidden border-t px-4 py-6 flex flex-col gap-4 ${
          isLight ? "bg-white/98 border-black/10" : "bg-black/98 border-white/10"
        }`}>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`font-heading text-lg tracking-widest uppercase py-1 hover:text-[#CC1244] transition-colors ${
                isLight ? "text-gray-700" : "text-gray-300"
              }`}
            >
              {l.label}
            </a>
          ))}

          <div className={`border-t pt-4 flex flex-col gap-3 ${isLight ? "border-black/10" : "border-white/10"}`}>
            {user ? (
              <>
                <Link
                  href="/cuenta"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 font-heading text-sm tracking-widest py-1 hover:text-[#CC1244] transition-colors ${isLight ? "text-gray-700" : "text-gray-300"}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
                  </svg>
                  MIS RESERVAS
                </Link>
                <Link
                  href="/cuenta"
                  onClick={() => setMenuOpen(false)}
                  className={`font-heading text-sm tracking-widest py-1 hover:text-[#CC1244] transition-colors ${isLight ? "text-gray-600" : "text-gray-400"}`}
                >
                  MI CUENTA — {nombreUsuario.split(" ")[0].toUpperCase()}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="text-left font-heading text-sm tracking-widest text-gray-500 hover:text-red-400 transition-colors py-1"
                >
                  CERRAR SESIÓN
                </button>
              </>
            ) : (
              <Link
                href="/cuenta/login"
                onClick={() => setMenuOpen(false)}
                className={`font-heading text-sm tracking-widest py-1 hover:text-[#CC1244] transition-colors ${isLight ? "text-gray-700" : "text-gray-300"}`}
              >
                INGRESAR / REGISTRARSE
              </Link>
            )}
            <a
              href="/#cartelera"
              onClick={() => setMenuOpen(false)}
              className="text-center bg-[#CC1244] text-white font-heading text-sm tracking-widest px-5 py-3 rounded-sm"
            >
              COMPRAR BOLETOS
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
