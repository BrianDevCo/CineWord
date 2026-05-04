"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Pelicula, Funcion, AsientoOcupado } from "@/lib/types";
import { getAsientosOcupados } from "@/lib/db";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const MercadoPagoBrick = dynamic(() => import("@/components/MercadoPagoBrick"), { ssr: false });

/* ─── Sala ──────────────────────────────────────────────────── */
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;
const VIP_ROWS = ["G", "H"];
const TIMER_TOTAL = 5 * 60;

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmt(n: number) { return `$${n.toLocaleString("es-CO")}`; }
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function horaDisplay(horaStr: string) {
  const [h, m] = horaStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
function fechaDisplay(fechaStr: string) {
  const [, mes, dia] = fechaStr.split("-");
  return `${parseInt(dia)} ${MONTH_NAMES[parseInt(mes) - 1]}`;
}

interface CalendarDay {
  label: string;
  fecha: string;       // "YYYY-MM-DD"
  dayOfWeek: number;
}

function buildDays(funciones: Funcion[]): CalendarDay[] {
  const fechasUnicas = [...new Set(funciones.map((f) => f.fecha))].slice(0, 7);
  return fechasUnicas.map((fecha, i) => {
    const d = new Date(fecha + "T12:00:00");
    return {
      label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : fechaDisplay(fecha),
      fecha,
      dayOfWeek: d.getDay(),
    };
  });
}

interface Props {
  movie: Pelicula;
  funciones: Funcion[];
}

export default function BookingSection({ movie, funciones }: Props) {
  const pathname = usePathname();
  const days = useMemo(() => buildDays(funciones), [funciones]);

  const [user, setUser] = useState<User | null | "loading">("loading");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [selectedFormato, setSelectedFormato] = useState<string | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<Funcion | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [ocupados, setOcupados] = useState<AsientoOcupado[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({ nombre: "", email: "", telefono: "" });
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [creatingPreference, setCreatingPreference] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Funciones filtradas por fecha + formato
  const funcionesPorFecha = selectedFecha
    ? funciones.filter((f) => f.fecha === selectedFecha)
    : [];
  const formatosDisponibles = [...new Set(funcionesPorFecha.map((f) => f.formato))];
  const funcionesPorFormato = selectedFormato
    ? funcionesPorFecha.filter((f) => f.formato === selectedFormato)
    : [];

  // Asientos ocupados como Set de "FilaColumna"
  const ocupadosSet = useMemo(
    () => new Set(ocupados.map((a) => `${a.fila}${a.columna}`)),
    [ocupados]
  );

  // Precio de la función seleccionada
  const precioRegular = selectedFuncion?.precio_regular ?? 15000;
  const precioVip = selectedFuncion?.precio_vip ?? 25000;

  const total = [...selectedSeats].reduce(
    (acc, id) => acc + (VIP_ROWS.includes(id[0]) ? precioVip : precioRegular),
    0
  );

  /* ── Timer ── */
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerSeconds(TIMER_TOTAL);
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerSeconds(null);
  }, []);

  useEffect(() => {
    if (timerSeconds === 0) {
      setTimedOut(true);
      setSelectedSeats(new Set());
      setStep(4);
      setTimerSeconds(null);
    }
  }, [timerSeconds]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Detectar sesión activa
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!url || url.includes("TU_PROYECTO")) { setUser(null); return; }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Fetch asientos al seleccionar función ── */
  async function fetchAsientos(funcion: Funcion) {
    setLoadingSeats(true);
    try {
      const data = await getAsientosOcupados(funcion.id);
      setOcupados(data);
    } catch {
      setOcupados([]);
    } finally {
      setLoadingSeats(false);
    }
  }

  /* ── Handlers ── */
  const toggleSeat = (id: string) => {
    if (ocupadosSet.has(id)) return;
    setTimedOut(false);
    setSelectedSeats((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const seatClass = (id: string) => {
    if (ocupadosSet.has(id)) return "bg-white/10 border-white/10 cursor-not-allowed opacity-40";
    if (selectedSeats.has(id)) return "bg-[#CC1244] border-[#CC1244] cursor-pointer scale-110 shadow-[0_0_8px_rgba(204,18,68,0.6)]";
    if (VIP_ROWS.includes(id[0])) return "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
    return "bg-white/5 border-white/20 hover:bg-white/15 cursor-pointer";
  };

  const reset = () => {
    stopTimer();
    setStep(1); setSelectedFecha(null); setSelectedFormato(null);
    setSelectedFuncion(null); setSelectedSeats(new Set()); setOcupados([]);
    setPaymentDone(false); setTimedOut(false); setPaymentInfo({ nombre: "", email: "", telefono: "" });
  };

  const pickFecha = (fecha: string) => {
    setSelectedFecha(fecha); setSelectedFormato(null); setSelectedFuncion(null);
    setSelectedSeats(new Set()); setTimedOut(false); setStep(2);
  };

  const pickFormato = (f: string) => {
    setSelectedFormato(f); setSelectedFuncion(null); setSelectedSeats(new Set()); setStep(3);
  };

  const pickFuncion = async (f: Funcion) => {
    setSelectedFuncion(f); setSelectedSeats(new Set()); setTimedOut(false);
    await fetchAsientos(f);
    setStep(4);
  };

  const continueToPayment = () => {
    if (!user || user === "loading") {
      setStep(5); // muestra el gate de login
      return;
    }
    // Pre-llenar datos del usuario logueado
    const u = user as User;
    setPaymentInfo((prev) => ({
      nombre: prev.nombre || u.user_metadata?.nombre_completo || u.user_metadata?.full_name || "",
      email: prev.email || u.email || "",
      telefono: prev.telefono,
    }));
    startTimer();
    setStep(5);
  };
  const goBackToSeats = () => { stopTimer(); setStep(4); };

  const asientosList = useMemo(
    () =>
      [...selectedSeats].map((id) => ({
        fila: id[0],
        columna: parseInt(id.slice(1)),
        tipo: (VIP_ROWS.includes(id[0]) ? "vip" : "regular") as "regular" | "vip",
      })),
    [selectedSeats]
  );

  const handleCrearPreferencia = async () => {
    if (!selectedFuncion || !paymentInfo.nombre || !paymentInfo.email) return;
    setCreatingPreference(true);
    try {
      const res = await fetch("/api/pagos/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: movie.titulo,
          asientos: [...selectedSeats].sort(),
          total,
          email: paymentInfo.email,
          nombre: paymentInfo.nombre,
          funcion_id: selectedFuncion.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.preference_id) throw new Error(data.error);
      setPreferenceId(data.preference_id);
    } catch {
      alert("No se pudo conectar con MercadoPago. Intenta de nuevo.");
    } finally {
      setCreatingPreference(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (paymentId: string) => {
      try {
        const res = await fetch("/api/pagos/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: paymentId,
            funcion_id: selectedFuncion?.id,
            email: paymentInfo.email,
            nombre: paymentInfo.nombre,
            telefono: paymentInfo.telefono || undefined,
            asientos: asientosList,
            total,
          }),
        });
        if (res.ok) {
          stopTimer();
          // Guardar resumen en sessionStorage para mostrarlo en /pago/exito si MP redirige
          try {
            const dayInfo = days.find((d) => d.fecha === selectedFecha);
            sessionStorage.setItem("cw-last-ticket", JSON.stringify({
              pelicula: movie.titulo,
              fecha: dayInfo ? `${dayInfo.label} · ${fechaDisplay(dayInfo.fecha)}` : selectedFecha ?? "",
              hora: selectedFuncion ? horaDisplay(selectedFuncion.hora) : "",
              formato: selectedFuncion?.formato ?? "",
              asientos: [...selectedSeats].sort().join(", "),
              total: `$${total.toLocaleString("es-CO")}`,
            }));
          } catch { /* sessionStorage no disponible */ }
          setPaymentDone(true);
        } else {
          alert("Pago recibido pero error al guardar reserva. Guarda el ID: " + paymentId);
        }
      } catch {
        alert("Pago recibido pero error al guardar reserva. Guarda el ID: " + paymentId);
      }
    },
    [selectedFuncion, selectedFecha, selectedSeats, paymentInfo, asientosList, total, stopTimer, days, movie.titulo]
  );

  /* ── Timer UI ── */
  const isCritical = timerSeconds !== null && timerSeconds <= 60;
  const isWarning = timerSeconds !== null && timerSeconds <= 120 && !isCritical;
  const timerColor = isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[#CC1244]";
  const barColor = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-[#CC1244]";
  const barPct = timerSeconds !== null ? (timerSeconds / TIMER_TOTAL) * 100 : 100;

  const dayData = days.find((d) => d.fecha === selectedFecha);

  /* ── Sin funciones ── */
  if (funciones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 font-heading tracking-widest text-sm">
        NO HAY FUNCIONES DISPONIBLES EN LOS PRÓXIMOS DÍAS
      </div>
    );
  }

  /* ── Compra exitosa ── */
  if (paymentDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-4xl">🎟️</div>
        <div>
          <h3 className="font-heading text-3xl font-bold text-white tracking-wider mb-2">¡RESERVA EXITOSA!</h3>
          <p className="text-gray-400 font-body">Recibirás la confirmación en tu correo electrónico.</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-sm w-full text-left flex flex-col gap-2">
          <p className="text-gray-500 text-xs font-heading tracking-widest mb-1">RESUMEN</p>
          {[
            { label: "Película", value: movie.titulo },
            { label: "Fecha", value: dayData ? `${dayData.label} · ${fechaDisplay(dayData.fecha)}` : "" },
            { label: "Función", value: selectedFuncion ? `${horaDisplay(selectedFuncion.hora)} — ${selectedFuncion.formato}` : "" },
            { label: "Asientos", value: [...selectedSeats].sort().join(", ") },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm font-body">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-white font-medium text-right max-w-[60%]">{row.value}</span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="text-gray-400 font-body text-sm">Total</span>
            <span className="text-[#CC1244] font-heading text-xl font-bold">{fmt(total)}</span>
          </div>
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
          const n = (i + 1) as 1 | 2 | 3 | 4 | 5;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap ${active ? "bg-[#CC1244] text-white" : done ? "text-[#CC1244]" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-heading border ${active ? "border-white text-white" : done ? "border-[#CC1244] bg-[#CC1244] text-white" : "border-gray-600"}`}>
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
          {step > 1 && (
            <button onClick={() => { stopTimer(); setStep(1); setSelectedFormato(null); setSelectedFuncion(null); setSelectedSeats(new Set()); }}
              className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">CAMBIAR</button>
          )}
        </div>

        {step === 1 ? (
          <div className="flex gap-3 flex-wrap">
            {days.map((day) => {
              const isWknd = day.dayOfWeek === 0 || day.dayOfWeek === 6;
              const isTueWed = day.dayOfWeek === 2 || day.dayOfWeek === 3;
              return (
                <button key={day.fecha} onClick={() => pickFecha(day.fecha)}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl px-6 py-5 border transition-all hover:border-[#CC1244]/50 hover:bg-[#1a1a1a] ${isWknd ? "bg-[#111] border-yellow-500/20" : "bg-[#111] border-white/10"}`}
                >
                  <span className={`font-heading text-[10px] tracking-widest uppercase ${isWknd ? "text-yellow-500/70" : "text-gray-600"}`}>
                    {fechaDisplay(day.fecha)}
                  </span>
                  <span className="font-heading text-2xl font-bold text-white group-hover:text-[#CC1244] transition-colors">
                    {day.label}
                  </span>
                  {isWknd && <span className="text-[9px] font-heading tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-sm">MÁS FUNCIONES</span>}
                  {isTueWed && !isWknd && <span className="text-[9px] font-heading tracking-widest text-[#CC1244] bg-[#CC1244]/10 px-2 py-0.5 rounded-sm">50% PROMO</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-white font-heading">{dayData?.label}</span>
            <span className="text-gray-500 font-body text-sm">·</span>
            <span className="text-gray-500 font-body text-sm">{dayData ? fechaDisplay(dayData.fecha) : ""}</span>
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
              <button onClick={() => { stopTimer(); setStep(2); setSelectedFuncion(null); setSelectedSeats(new Set()); }}
                className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">CAMBIAR</button>
            )}
          </div>
          {step === 2 ? (
            <div className="flex gap-3 flex-wrap">
              {formatosDisponibles.map((f) => (
                <button key={f} onClick={() => pickFormato(f)}
                  className={`font-heading text-sm tracking-widest px-8 py-4 rounded-xl border transition-all ${f === "VIP"
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
                  }`}>
                  {f}
                  <span className="block text-xs font-body mt-0.5 font-normal opacity-60">
                    {f === "VIP" ? fmt(precioVip) : fmt(precioRegular)} / silla
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <span className="text-white font-heading">{selectedFormato}</span>
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
              <button onClick={() => { stopTimer(); setStep(3); setSelectedSeats(new Set()); }}
                className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">CAMBIAR</button>
            )}
          </div>
          {step === 3 ? (
            <div className="flex gap-3 flex-wrap">
              {funcionesPorFormato.map((f) => (
                <button key={f.id} onClick={() => pickFuncion(f)}
                  className="bg-white/5 hover:bg-[#CC1244] border border-white/15 hover:border-[#CC1244] text-white font-heading text-lg tracking-wider px-8 py-4 rounded-xl transition-all">
                  {horaDisplay(f.hora)}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-white font-heading">
              {selectedFuncion ? horaDisplay(selectedFuncion.hora) : ""}
            </span>
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

          {timedOut && step === 4 && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
              <span className="text-xl mt-0.5">⏰</span>
              <div>
                <p className="font-heading text-sm text-red-400 tracking-wider mb-0.5">TIEMPO AGOTADO</p>
                <p className="text-gray-400 font-body text-sm">Tu reserva expiró. Selecciona tus sillas otra vez para continuar.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              {loadingSeats ? (
                <div className="flex items-center justify-center py-12 text-gray-600 font-heading text-sm tracking-widest">
                  CARGANDO DISPONIBILIDAD...
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                    <span className="text-gray-600 text-xs font-heading tracking-widest">PANTALLA</span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-x-auto">
                    {ROWS.map((row) => (
                      <div key={row} className="flex items-center gap-2 justify-center">
                        <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                        <div className="flex gap-1.5">
                          {Array.from({ length: COLS }, (_, i) => {
                            const id = `${row}${i + 1}`;
                            return (
                              <button key={id} onClick={() => toggleSeat(id)} title={ocupadosSet.has(id) ? "Ocupado" : id}
                                className={`w-7 h-6 rounded-t-md border text-[10px] transition-all duration-150 ${seatClass(id)}`}
                              />
                            );
                          })}
                        </div>
                        <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-center gap-5 text-xs font-body text-gray-500">
                    {[
                      { color: "bg-white/5 border-white/20", label: "Disponible" },
                      { color: "bg-[#CC1244] border-[#CC1244]", label: "Seleccionado" },
                      { color: "bg-white/10 border-white/10 opacity-40", label: "Ocupado" },
                      { color: "bg-yellow-500/10 border-yellow-500/40", label: `VIP — ${fmt(precioVip)}` },
                    ].map((l) => (
                      <span key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-4 h-3.5 rounded-t-sm border inline-block ${l.color}`} />
                        {l.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111] border border-white/10 rounded-xl p-5">
                    <div className="font-body text-sm text-gray-400">
                      {selectedSeats.size === 0 ? "Selecciona tus asientos en el mapa" : (
                        <span>
                          <span className="text-white font-bold">{selectedSeats.size}</span>{" "}
                          asiento{selectedSeats.size > 1 ? "s" : ""} —{" "}
                          <span className="text-[#CC1244] font-bold text-lg">{fmt(total)}</span>
                        </span>
                      )}
                    </div>
                    <button disabled={selectedSeats.size === 0} onClick={continueToPayment}
                      className="w-full sm:w-auto bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest px-8 py-3 rounded-sm transition-all">
                      CONTINUAR AL PAGO
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PASO 5: PAGO ── */}
      {step === 5 && (
        <div className="flex flex-col gap-6 mb-10">
          <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">5</span>
            DATOS Y PAGO
          </h3>

          {/* Gate de login — solo si no hay sesión */}
          {!user && (
            <div className="flex flex-col items-center gap-6 py-10 border border-white/10 rounded-2xl bg-[#111] text-center">
              <div className="w-14 h-14 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#CC1244]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-white text-lg tracking-wider mb-1">
                  NECESITAS UNA CUENTA
                </p>
                <p className="text-gray-500 font-body text-sm">
                  Inicia sesión o regístrate gratis para completar tu compra.
                  <br />Tus asientos quedan reservados.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link
                  href={`/cuenta/login?redirect=${encodeURIComponent(pathname)}`}
                  className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
                >
                  INGRESAR
                </Link>
                <Link
                  href={`/cuenta/registrar?redirect=${encodeURIComponent(pathname)}`}
                  className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center"
                >
                  REGISTRARSE
                </Link>
              </div>
              <button
                onClick={() => { setStep(4); }}
                className="text-gray-600 hover:text-white font-heading text-xs tracking-widest transition-colors"
              >
                ← VOLVER A MIS ASIENTOS
              </button>
            </div>
          )}

          {/* Flujo de pago normal — solo si hay sesión */}
          {user && user !== "loading" && (<>

          {timerSeconds !== null && (
            <div className={`rounded-xl border px-5 py-4 flex flex-col gap-3 transition-all ${isCritical ? "border-red-500/40 bg-red-500/5" : isWarning ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${isCritical ? "animate-bounce" : ""}`}>{isCritical ? "⚠️" : "⏱️"}</span>
                  <div>
                    <p className={`font-heading text-xs tracking-widest uppercase mb-0.5 ${isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-gray-400"}`}>
                      {isCritical ? "¡Tiempo casi agotado!" : isWarning ? "Apresúrate" : "Asientos reservados para ti"}
                    </p>
                    <p className="text-gray-500 font-body text-xs">Completa el pago antes de que expire la reserva</p>
                  </div>
                </div>
                <span className={`font-heading font-bold text-3xl tabular-nums shrink-0 ${timerColor}`}>{fmtTime(timerSeconds)}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${barColor} ${isCritical ? "animate-pulse" : ""}`} style={{ width: `${barPct}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-3">
              <p className="font-heading text-xs text-gray-500 tracking-widest mb-1">RESUMEN DE COMPRA</p>
              {[
                { label: "Película", value: movie.titulo },
                { label: "Fecha", value: dayData ? `${dayData.label} · ${fechaDisplay(dayData.fecha)}` : "" },
                { label: "Función", value: selectedFuncion ? `${horaDisplay(selectedFuncion.hora)} — ${selectedFuncion.formato}` : "" },
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

            {/* Datos + método de pago */}
            <div className="flex flex-col gap-4">
              <p className="font-heading text-xs text-gray-500 tracking-widest">TUS DATOS</p>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={paymentInfo.nombre}
                  onChange={(e) => setPaymentInfo((p) => ({ ...p, nombre: e.target.value }))}
                  className="bg-white/5 border border-white/15 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico *"
                  value={paymentInfo.email}
                  onChange={(e) => setPaymentInfo((p) => ({ ...p, email: e.target.value }))}
                  className="bg-white/5 border border-white/15 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={paymentInfo.telefono}
                  onChange={(e) => setPaymentInfo((p) => ({ ...p, telefono: e.target.value }))}
                  className="bg-white/5 border border-white/15 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600"
                />
              </div>

              {!preferenceId ? (
                <>
                  <div className="flex gap-3 mt-2">
                    <button onClick={goBackToSeats}
                      className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all">
                      VOLVER
                    </button>
                    <button
                      disabled={!paymentInfo.nombre || !paymentInfo.email || creatingPreference}
                      onClick={handleCrearPreferencia}
                      className="flex-[2] bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all flex items-center justify-center gap-2">
                      {creatingPreference ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          CARGANDO...
                        </>
                      ) : (
                        `IR AL PAGO — ${fmt(total)}`
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="font-heading text-xs text-gray-500 tracking-widest">MÉTODO DE PAGO</p>
                  <MercadoPagoBrick
                    preferenceId={preferenceId}
                    total={total}
                    onSuccess={handlePaymentSuccess}
                    onError={() => alert("Error en el pago. Intenta de nuevo.")}
                  />
                  <button
                    onClick={() => setPreferenceId(null)}
                    className="text-gray-600 hover:text-white font-heading text-xs tracking-widest transition-colors text-center"
                  >
                    ← VOLVER A MIS DATOS
                  </button>
                </div>
              )}
            </div>
          </div>
          </>)}
        </div>
      )}
    </div>
  );
}
