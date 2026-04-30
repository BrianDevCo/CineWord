"use client";

import { useState } from "react";
import type { Movie } from "@/lib/movies";

/* ─── Constantes de sala ─── */
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;
const VIP_ROWS = ["G", "H"];
const OCCUPIED = new Set([
  "A3","A4","A5","A8","B1","B6","B7","C2","C5","C9",
  "D4","D5","D6","D7","E2","E3","E8","F1","F9","F10",
  "G3","G4","G7","H5","H6",
]);
const PRICE_REGULAR = 15000;
const PRICE_VIP = 25000;

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

interface Props { movie: Movie }

export default function BookingSection({ movie }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [paymentDone, setPaymentDone] = useState(false);

  const dayData = selectedDay !== null ? movie.schedules[selectedDay] : null;
  const availableFormats = dayData?.times.map((t) => t.format) ?? [];
  const timesForFormat = dayData?.times.find((t) => t.format === selectedFormat)?.horarios ?? [];

  const total = [...selectedSeats].reduce((acc, id) => {
    return acc + (VIP_ROWS.includes(id[0]) ? PRICE_VIP : PRICE_REGULAR);
  }, 0);

  const toggleSeat = (id: string) => {
    if (OCCUPIED.has(id)) return;
    setSelectedSeats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const seatClass = (id: string) => {
    if (OCCUPIED.has(id)) return "bg-white/10 border-white/10 cursor-not-allowed";
    if (selectedSeats.has(id)) return "bg-[#CC1244] border-[#CC1244] cursor-pointer scale-110";
    if (VIP_ROWS.includes(id[0]))
      return "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
    return "bg-white/5 border-white/20 hover:bg-white/15 cursor-pointer";
  };

  const reset = () => {
    setStep(1); setSelectedDay(null); setSelectedFormat(null);
    setSelectedTime(null); setSelectedSeats(new Set()); setPaymentDone(false);
  };

  // ── helpers para avanzar pasos ──
  const pickDay = (i: number) => {
    setSelectedDay(i); setSelectedFormat(null); setSelectedTime(null);
    setSelectedSeats(new Set()); setStep(2);
  };
  const pickFormat = (f: string) => {
    setSelectedFormat(f); setSelectedTime(null);
    setSelectedSeats(new Set()); setStep(3);
  };
  const pickTime = (t: string) => {
    setSelectedTime(t); setSelectedSeats(new Set()); setStep(4);
  };

  // ── Paso completado ──
  if (paymentDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-4xl">
          🎟️
        </div>
        <div>
          <h3 className="font-heading text-3xl font-bold text-white tracking-wider mb-2">
            ¡COMPRA EXITOSA!
          </h3>
          <p className="text-gray-400 font-body">
            Recibirás tu boleto con código QR en tu correo electrónico.
          </p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-sm w-full text-left flex flex-col gap-2">
          <p className="text-gray-500 text-xs font-heading tracking-widest mb-1">RESUMEN</p>
          <div className="flex justify-between text-sm font-body"><span className="text-gray-400">Película</span><span className="text-white font-bold">{movie.title}</span></div>
          <div className="flex justify-between text-sm font-body"><span className="text-gray-400">Fecha</span><span className="text-white">{dayData?.dateLabel}</span></div>
          <div className="flex justify-between text-sm font-body"><span className="text-gray-400">Función</span><span className="text-white">{selectedTime} — {selectedFormat}</span></div>
          <div className="flex justify-between text-sm font-body"><span className="text-gray-400">Asientos</span><span className="text-white">{[...selectedSeats].sort().join(", ")}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between"><span className="text-gray-400 font-body text-sm">Total</span><span className="text-[#CC1244] font-heading text-xl font-bold">{fmt(total)}</span></div>
        </div>
        <button onClick={reset} className="border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all">
          COMPRAR OTRO BOLETO
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── STEP INDICATOR ── */}
      <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
        {["Fecha", "Formato", "Horario", "Asientos", "Pago"].map((label, i) => {
          const n = (i + 1) as 1|2|3|4|5;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap ${
                active ? "bg-[#CC1244] text-white" : done ? "text-[#CC1244]" : "text-gray-600"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-heading border ${
                  active ? "border-white text-white" : done ? "border-[#CC1244] bg-[#CC1244] text-white" : "border-gray-600"
                }`}>
                  {done ? "✓" : n}
                </span>
                <span className="font-heading text-xs tracking-widest">{label.toUpperCase()}</span>
              </div>
              {i < 4 && <div className={`w-8 h-px shrink-0 ${done ? "bg-[#CC1244]" : "bg-white/10"}`} />}
            </div>
          );
        })}
      </div>

      {/* ── PASO 1: FECHA ── */}
      <div className={`flex flex-col gap-4 ${step > 1 ? "mb-6 pb-6 border-b border-white/10" : "mb-10"}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">1</span>
            SELECCIONA LA FECHA
          </h3>
          {step > 1 && selectedDay !== null && (
            <button onClick={() => { setStep(1); setSelectedFormat(null); setSelectedTime(null); setSelectedSeats(new Set()); }}
              className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">
              CAMBIAR
            </button>
          )}
        </div>

        {step === 1 ? (
          <div className="flex gap-4 flex-wrap">
            {movie.schedules.map((day, i) => (
              <button
                key={i}
                onClick={() => pickDay(i)}
                className="group flex flex-col items-center gap-1 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 hover:border-[#CC1244]/50 rounded-xl px-8 py-5 transition-all"
              >
                <span className="font-heading text-2xl font-bold text-white group-hover:text-[#CC1244] transition-colors">{day.dayLabel}</span>
                <span className="font-body text-sm text-gray-500">{day.dateLabel}</span>
                {(day.dayLabel === "Hoy" || day.dayLabel === "Mañana") && (
                  <span className="mt-1 text-[10px] font-heading tracking-widest text-[#CC1244] bg-[#CC1244]/10 px-2 py-0.5 rounded-sm">
                    50% PROMO
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-white font-heading">{dayData?.dayLabel}</span>
            <span className="text-gray-500 font-body text-sm">{dayData?.dateLabel}</span>
          </div>
        )}
      </div>

      {/* ── PASO 2: FORMATO ── */}
      {step >= 2 && (
        <div className={`flex flex-col gap-4 ${step > 2 ? "mb-6 pb-6 border-b border-white/10" : "mb-10"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">2</span>
              SELECCIONA EL FORMATO
            </h3>
            {step > 2 && (
              <button onClick={() => { setStep(2); setSelectedTime(null); setSelectedSeats(new Set()); }}
                className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">
                CAMBIAR
              </button>
            )}
          </div>
          {step === 2 ? (
            <div className="flex gap-3 flex-wrap">
              {availableFormats.map((f) => (
                <button
                  key={f}
                  onClick={() => pickFormat(f)}
                  className={`font-heading text-sm tracking-widest px-8 py-4 rounded-xl border transition-all ${
                    f === "VIP"
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                      : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {f}
                  <span className="block text-xs font-body mt-0.5 font-normal opacity-60">
                    {f === "VIP" ? fmt(PRICE_VIP) : fmt(PRICE_REGULAR)} / silla
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <span className="text-white font-heading">{selectedFormat}</span>
          )}
        </div>
      )}

      {/* ── PASO 3: HORARIO ── */}
      {step >= 3 && (
        <div className={`flex flex-col gap-4 ${step > 3 ? "mb-6 pb-6 border-b border-white/10" : "mb-10"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">3</span>
              SELECCIONA EL HORARIO
            </h3>
            {step > 3 && (
              <button onClick={() => { setStep(3); setSelectedSeats(new Set()); }}
                className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">
                CAMBIAR
              </button>
            )}
          </div>
          {step === 3 ? (
            <div className="flex gap-3 flex-wrap">
              {timesForFormat.map((t) => (
                <button
                  key={t}
                  onClick={() => pickTime(t)}
                  className="bg-white/5 hover:bg-[#CC1244] border border-white/15 hover:border-[#CC1244] text-white font-heading text-lg tracking-wider px-8 py-4 rounded-xl transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-white font-heading">{selectedTime}</span>
          )}
        </div>
      )}

      {/* ── PASO 4: ASIENTOS ── */}
      {step >= 4 && (
        <div className={`flex flex-col gap-6 ${step > 4 ? "mb-6 pb-6 border-b border-white/10" : "mb-10"}`}>
          <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">4</span>
            SELECCIONA TUS ASIENTOS
          </h3>

          {step === 4 && (
            <>
              {/* Pantalla */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                <span className="text-gray-600 text-xs font-heading tracking-widest">PANTALLA</span>
              </div>

              {/* Mapa */}
              <div className="flex flex-col gap-2 overflow-x-auto">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-2 justify-center">
                    <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: COLS }, (_, i) => {
                        const id = `${row}${i + 1}`;
                        return (
                          <button
                            key={id}
                            onClick={() => toggleSeat(id)}
                            title={OCCUPIED.has(id) ? "Ocupado" : id}
                            className={`w-7 h-6 rounded-t-md border text-[10px] transition-all duration-150 ${seatClass(id)}`}
                          />
                        );
                      })}
                    </div>
                    <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                  </div>
                ))}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap justify-center gap-5 text-xs font-body text-gray-500">
                {[
                  { color: "bg-white/5 border-white/20", label: "Disponible" },
                  { color: "bg-[#CC1244] border-[#CC1244]", label: "Seleccionado" },
                  { color: "bg-white/10 border-white/10", label: "Ocupado" },
                  { color: "bg-yellow-500/10 border-yellow-500/40", label: `VIP — ${fmt(PRICE_VIP)}` },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-4 h-3.5 rounded-t-sm border inline-block ${l.color}`} />
                    {l.label}
                  </span>
                ))}
              </div>

              {/* Resumen + CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="font-body text-sm text-gray-400">
                  {selectedSeats.size === 0 ? (
                    "Selecciona tus asientos en el mapa"
                  ) : (
                    <span>
                      <span className="text-white font-bold">{selectedSeats.size}</span> asiento{selectedSeats.size > 1 ? "s" : ""} seleccionado{selectedSeats.size > 1 ? "s" : ""} —{" "}
                      <span className="text-[#CC1244] font-bold text-lg">{fmt(total)}</span>
                    </span>
                  )}
                </div>
                <button
                  disabled={selectedSeats.size === 0}
                  onClick={() => setStep(5)}
                  className="w-full sm:w-auto bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all"
                >
                  CONTINUAR AL PAGO
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PASO 5: PAGO ── */}
      {step === 5 && (
        <div className="flex flex-col gap-6 mb-10">
          <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">5</span>
            RESUMEN Y PAGO
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-3">
              <p className="font-heading text-xs text-gray-500 tracking-widest mb-1">RESUMEN DE COMPRA</p>
              {[
                { label: "Película", value: movie.title },
                { label: "Fecha", value: dayData?.dateLabel ?? "" },
                { label: "Función", value: `${selectedTime} — ${selectedFormat}` },
                { label: "Asientos", value: [...selectedSeats].sort().join(", ") },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm font-body">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="text-white font-medium text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-gray-400 font-body text-sm">Total a pagar</span>
                <span className="text-[#CC1244] font-heading text-2xl font-bold">{fmt(total)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="flex flex-col gap-4">
              <p className="font-heading text-xs text-gray-500 tracking-widest">MÉTODO DE PAGO</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "💳", label: "Tarjeta Crédito/Débito" },
                  { icon: "📱", label: "PSE" },
                  { icon: "🏦", label: "Nequi / Daviplata" },
                  { icon: "💵", label: "Efectivo en taquilla" },
                ].map((m) => (
                  <button
                    key={m.label}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white font-body text-sm py-4 px-4 rounded-xl transition-all text-left flex items-center gap-3"
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-xs leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
                >
                  VOLVER
                </button>
                <button
                  onClick={() => setPaymentDone(true)}
                  className="flex-[2] bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
                >
                  CONFIRMAR — {fmt(total)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
