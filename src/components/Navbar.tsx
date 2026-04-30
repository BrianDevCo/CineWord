"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLight = theme === "light";

  const links = [
    { label: "Cartelera", href: "#cartelera" },
    { label: "Horarios", href: "#horarios" },
    { label: "Próximos", href: "#proximos" },
    { label: "Combos", href: "#snacks" },
    { label: "Contacto", href: "#contacto" },
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
          <a href="#" className="flex items-center gap-0 shrink-0">
            <div className="bg-[#CC1244] px-3 py-1.5 rounded-sm">
              <span className="font-heading text-white text-xl lg:text-2xl font-bold tracking-widest">
                CINEWORLD
              </span>
            </div>
          </a>

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

          {/* Right side: ThemeToggle + CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <a
              href="#cartelera"
              className="flex items-center gap-2 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-5 py-2.5 rounded-sm transition-all duration-200 animate-pulse-red"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
              </svg>
              COMPRAR BOLETOS
            </a>
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
          <a
            href="#cartelera"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center bg-[#CC1244] text-white font-heading text-sm tracking-widest px-5 py-3 rounded-sm"
          >
            COMPRAR BOLETOS
          </a>
        </div>
      )}
    </header>
  );
}
