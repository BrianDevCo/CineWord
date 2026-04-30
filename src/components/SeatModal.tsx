"use client";

import { useState, useEffect } from "react";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;
const VIP_ROWS = ["G", "H"];

const OCCUPIED = new Set([
  "A3","A4","A5","A8",
  "B1","B6","B7",
  "C2","C5","C9",
  "D4","D5","D6","D7",
  "E2","E3","E8",
  "F1","F9","F10",
  "G3","G4","G7",
  "H5","H6",
]);

const PRICE_REGULAR = 15000;
const PRICE_VIP = 25000;

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

interface Props {
  movie: { title: string; duration: string; rating: string };
  schedule: string;
  format: string;
  onClose: () => void;
}

export default function SeatModal({ movie, schedule, format, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"seats" | "confirm">("seats");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggle = (id: string) => {
    if (OCCUPIED.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = [...selected].reduce((acc, id) => {
    const row = id.charAt(0);
    return acc + (VIP_ROWS.includes(row) ? PRICE_VIP : PRICE_REGULAR);
  }, 0);

  const seatColor = (id: string) => {
    if (OCCUPIED.has(id)) return "bg-white/10 cursor-not-allowed border-white/10";
    if (selected.has(id)) return "bg-[#CC1244] border-[#CC1244] cursor-pointer";
    const row = id.charAt(0);
    if (VIP_ROWS.includes(row))
      return "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
    return "bg-white/5 border-white/20 hover:bg-white/15 cursor-pointer";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-[#111] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white tracking-wider">
              {movie.title}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 font-body">
              <span>{schedule}</span>
              <span>•</span>
              <span>{format}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span>{movie.rating}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "seats" ? (
          <div className="p-6 flex flex-col gap-6">
            {/* Pantalla */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
              <span className="text-gray-500 text-xs font-heading tracking-widest">PANTALLA</span>
            </div>

            {/* Mapa de asientos */}
            <div className="flex flex-col gap-2">
              {ROWS.map((row) => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-5 text-center text-gray-500 text-xs font-heading">{row}</span>
                  <div className="flex gap-1.5 flex-wrap justify-center flex-1">
                    {Array.from({ length: COLS }, (_, i) => {
                      const id = `${row}${i + 1}`;
                      return (
                        <button
                          key={id}
                          onClick={() => toggle(id)}
                          className={`w-7 h-7 rounded-t-md border text-xs font-heading transition-all duration-150 ${seatColor(id)}`}
                          title={OCCUPIED.has(id) ? "Ocupado" : id}
                        />
                      );
                    })}
                  </div>
                  <span className="w-5 text-center text-gray-500 text-xs font-heading">{row}</span>
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap justify-center gap-4 text-xs font-body text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-t-sm bg-white/5 border border-white/20 inline-block" />
                Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-t-sm bg-[#CC1244] border border-[#CC1244] inline-block" />
                Seleccionado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-t-sm bg-white/10 border border-white/10 inline-block" />
                Ocupado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-t-sm bg-yellow-500/10 border border-yellow-500/40 inline-block" />
                VIP {fmt(PRICE_VIP)}
              </span>
            </div>

            {/* Resumen + CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-5">
              <div className="font-body text-sm text-gray-400">
                {selected.size === 0 ? (
                  <span>Selecciona tus asientos</span>
                ) : (
                  <span>
                    <span className="text-white font-bold">{selected.size}</span> asiento{selected.size > 1 ? "s" : ""} —{" "}
                    <span className="text-[#CC1244] font-bold text-lg">{fmt(total)}</span>
                  </span>
                )}
              </div>
              <button
                disabled={selected.size === 0}
                onClick={() => setStep("confirm")}
                className="w-full sm:w-auto bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all"
              >
                CONTINUAR
              </button>
            </div>
          </div>
        ) : (
          /* Pantalla de confirmación */
          <div className="p-6 flex flex-col gap-6">
            <h3 className="font-heading text-xl text-white tracking-wider">RESUMEN DE COMPRA</h3>

            <div className="bg-[#1a1a1a] rounded-lg p-5 flex flex-col gap-3">
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-400">Película</span>
                <span className="text-white font-bold">{movie.title}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-400">Función</span>
                <span className="text-white">{schedule} — {format}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-400">Asientos</span>
                <span className="text-white">{[...selected].sort().join(", ")}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-gray-400 font-body text-sm">Total</span>
                <span className="text-[#CC1244] font-heading text-2xl font-bold">{fmt(total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-gray-400 text-sm font-body">Selecciona tu método de pago:</p>
              <div className="grid grid-cols-2 gap-3">
                {["💳 Tarjeta", "📱 PSE", "🏦 Nequi", "💰 Efectivo"].map((m) => (
                  <button
                    key={m}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white font-body text-sm py-3 px-4 rounded-lg transition-all"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("seats")}
                className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
              >
                VOLVER
              </button>
              <button
                onClick={onClose}
                className="flex-2 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all"
              >
                CONFIRMAR COMPRA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
