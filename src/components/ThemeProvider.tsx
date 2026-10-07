"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; }

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

// El tema vive en localStorage; el script inline del layout lo aplica antes de pintar
const listeners = new Set<() => void>();

function leerTema(): Theme {
  try {
    return localStorage.getItem("cw-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function suscribir(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(suscribir, leerTema, () => "dark" as Theme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("cw-theme", next); } catch { /* modo privado */ }
    document.documentElement.setAttribute("data-theme", next);
    listeners.forEach((cb) => cb());
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
