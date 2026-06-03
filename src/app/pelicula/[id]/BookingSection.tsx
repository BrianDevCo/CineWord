"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Pelicula, Funcion } from "@/lib/types";
import { getAsientosOcupados } from "@/lib/db";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const MercadoPagoBrick = dynamic(() => import("@/components/MercadoPagoBrick"), { ssr: false });

// Cambiar a false para deshabilitar la venta en línea
const VENTA_ONLINE = true;

// ── Constantes de fallback (cuando Score no está configurado) ──────────────────
const FALLBACK_ROWS = ["A","B","C","D","E","F","G","H"];
const FALLBACK_COLS = 10;
const FALLBACK_VIP  = ["G","H"];
const TIMER_TOTAL   = 5 * 60;

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmt(n: number) { return `$${n.toLocaleString("es-CO")}`; }
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}
function horaDisplay(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
function fechaDisplay(f: string) {
  const [, mes, dia] = f.split("-");
  return `${parseInt(dia)} ${MONTH_NAMES[parseInt(mes) - 1]}`;
}

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface AsientoMapa { fila: string; columna: number; columnaLabel: number; estado: "S" | "B" | "R"; zona: string; }
interface ScorePlan   { codigo: string; descripcion: string; valor: number; zona: string; }
interface CalendarDay { label: string; fecha: string; dayOfWeek: number; }

function getTodayStr() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function buildDays(funciones: Funcion[], hoyStr: string): CalendarDay[] {
  const mananaDate = new Date(hoyStr + "T12:00:00");
  mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = `${mananaDate.getFullYear()}-${String(mananaDate.getMonth() + 1).padStart(2, "0")}-${String(mananaDate.getDate()).padStart(2, "0")}`;

  return [...new Set(funciones.map((f) => f.fecha))].slice(0, 7).map((fecha) => {
    const d = new Date(fecha + "T12:00:00");
    const label = fecha === hoyStr ? "Hoy" : fecha === mananaStr ? "Mañana" : fechaDisplay(fecha);
    return { label, fecha, dayOfWeek: d.getDay() };
  });
}

interface Props { movie: Pelicula; funciones: Funcion[]; }

export default function BookingSection({ movie, funciones }: Props) {
  const pathname = usePathname();
  const [hoyStr, setHoyStr] = useState("");
  useEffect(() => { setHoyStr(getTodayStr()); }, []);
  const days = useMemo(() => buildDays(funciones, hoyStr), [funciones, hoyStr]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null | "loading">("loading");
  const [showLoginGate, setShowLoginGate] = useState(false);

  // ── Pasos ─────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1|2|3|4|5>(1);
  const [selectedFecha,   setSelectedFecha]   = useState<string | null>(null);
  const [selectedFormato, setSelectedFormato] = useState<string | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<Funcion | null>(null);
  const [selectedSeats,   setSelectedSeats]   = useState<Set<string>>(new Set());

  // ── Mapa Score + fallback Supabase ────────────────────────────────────────────
  const [mapaScore,    setMapaScore]    = useState<AsientoMapa[]>([]);
  const [mapaFallback, setMapaFallback] = useState<Set<string>>(new Set()); // IDs ocupados Supabase
  const [loadingMapa,  setLoadingMapa]  = useState(false);

  // ── Precios Score (SCOPLA) ────────────────────────────────────────────────────
  const [scorePlanes,  setScorePlanes]  = useState<ScorePlan[]>([]);
  const [loadingPlanes,setLoadingPlanes]= useState(false);

  // ── Secuencia Score (SCOSEC → SCOGRU → SCOLIR / SCOINT V) ────────────────────
  const [scoreSecuencia, setScoreSecuencia] = useState<string | null>(null);

  // ── Pago ──────────────────────────────────────────────────────────────────────
  const [paymentDone,        setPaymentDone]        = useState(false);
  const [timerSeconds,       setTimerSeconds]        = useState<number | null>(null);
  const [timedOut,           setTimedOut]            = useState(false);
  const [paymentInfo,        setPaymentInfo]         = useState({ nombre: "", email: "", telefono: "" });
  const [preferenceId,       setPreferenceId]        = useState<string | null>(null);
  const [creatingPreference, setCreatingPreference]  = useState(false);
  const [showAgeModal,       setShowAgeModal]        = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derivados del mapa ────────────────────────────────────────────────────────
  const usaScoreMapa = mapaScore.length > 0;

  const filas = useMemo(() => {
    if (usaScoreMapa) return [...new Set(mapaScore.map(a => a.fila))].sort();
    return FALLBACK_ROWS;
  }, [mapaScore, usaScoreMapa]);

  const vipFilasSet = useMemo(() => {
    if (usaScoreMapa) return new Set(mapaScore.filter(a => { const z = a.zona.toUpperCase(); return z.includes("VIP") || z.includes("PREMIUM"); }).map(a => a.fila));
    return new Set(FALLBACK_VIP);
  }, [mapaScore, usaScoreMapa]);

  const isVipRow = useCallback((fila: string) => vipFilasSet.has(fila), [vipFilasSet]);

  const colsEnFila = useCallback((fila: string): number[] => {
    if (usaScoreMapa) {
      return mapaScore.filter(a => a.fila === fila).map(a => a.columna).sort((a, b) => a - b);
    }
    return Array.from({ length: FALLBACK_COLS }, (_, i) => i + 1);
  }, [mapaScore, usaScoreMapa]);

  // Rango global de columnas para mostrar pasillos (columnas sin asiento = espacio vacío)
  const mirrorCols = selectedFuncion?.sala?.mirror_columns
    || selectedFuncion?.sala?.score_sala_id === "5"
    || selectedFuncion?.sala?.score_sala_id === "6"
    || false;
  if (selectedFuncion) console.log("[DEBUG sala]", JSON.stringify(selectedFuncion.sala));
  console.log("[DEBUG mirror]", mirrorCols, "allCols:", allCols?.slice(0,5), "mapaLen:", mapaScore.length);

  const allCols = useMemo(() => {
    if (!usaScoreMapa) return null;
    const cols = mapaScore.map(a => a.columna);
    const min = Math.min(...cols);
    const max = Math.max(...cols);
    const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    return mirrorCols ? [...range].reverse() : range;
  }, [mapaScore, usaScoreMapa, mirrorCols]);

  const seatExists = useCallback((fila: string, col: number) =>
    mapaScore.some(a => a.fila === fila && a.columna === col),
  [mapaScore]);

  // Muestra ColumnaTotal como etiqueta — coincide con el número físico del asiento
  const getSeatLabel = useCallback((id: string): string => id, []);

  const ocupadosSet = useMemo(() => {
    if (usaScoreMapa) return new Set(mapaScore.filter(a => a.estado !== "S").map(a => `${a.fila}${a.columna}`));
    return mapaFallback;
  }, [mapaScore, mapaFallback, usaScoreMapa]);

  // ── Funciones filtradas ───────────────────────────────────────────────────────
  const esFuncionValida = useCallback((f: Funcion) => {
    if (!hoyStr) return true; // antes de hidratación muestra todo
    const ahora = new Date();
    const ahoraMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    if (f.fecha > hoyStr) return true;
    if (f.fecha < hoyStr) return false;
    const [h, m] = f.hora.split(":").map(Number);
    return (h * 60 + m) > ahoraMinutos;
  }, [hoyStr]);

  const funcionesPorFecha   = selectedFecha ? funciones.filter(f => f.fecha === selectedFecha && esFuncionValida(f)) : [];
  const formatosDisponibles = [...new Set(funcionesPorFecha.map(f => f.formato))];
  const funcionesPorFormato = selectedFormato ? funcionesPorFecha.filter(f => f.formato === selectedFormato) : [];

  // ── Precios ───────────────────────────────────────────────────────────────────
  const scorePlanRegular = scorePlanes.find(p => !p.zona.toUpperCase().includes("VIP"));
  const scorePlanVip     = scorePlanes.find(p =>  p.zona.toUpperCase().includes("VIP"));
  // Función de referencia: la seleccionada, o la primera disponible del formato/fecha
  const funcionRef = selectedFuncion ?? funcionesPorFormato[0] ?? funcionesPorFecha[0];
  const precioRegular = scorePlanRegular?.valor ?? funcionRef?.precio_regular ?? 15000;
  const precioVip     = scorePlanVip?.valor     ?? funcionRef?.precio_vip     ?? 25000;

  const total = useMemo(
    () => [...selectedSeats].reduce((acc, id) => acc + (isVipRow(id[0]) ? precioVip : precioRegular), 0),
    [selectedSeats, isVipRow, precioRegular, precioVip],
  );

  const asientosList = useMemo(
    () => [...selectedSeats].map(id => ({
      fila: id[0],
      columna: parseInt(id.slice(1)),
      tipo: (isVipRow(id[0]) ? "vip" : "regular") as "regular" | "vip",
    })),
    [selectedSeats, isVipRow],
  );

  // ── Timer ─────────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerSeconds(TIMER_TOTAL);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) { clearInterval(intervalRef.current!); intervalRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerSeconds(null);
  }, []);

  // ── Liberar hold en Score (SCOLIR) ────────────────────────────────────────────
  const liberarHold = useCallback((sec: string | null) => {
    if (!sec) return;
    fetch("/api/score/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secuencia: sec }),
    }).catch(() => {});
  }, []);

  // Timer expira → liberar hold
  useEffect(() => {
    if (timerSeconds === 0) {
      setTimedOut(true);
      setSelectedSeats(new Set());
      setStep(4);
      setTimerSeconds(null);
      liberarHold(scoreSecuencia);
      setScoreSecuencia(null);
    }
  }, [timerSeconds, scoreSecuencia, liberarHold]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!url || url.includes("TU_PROYECTO")) { setUser(null); return; }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch mapa (SCOMAP → fallback Supabase) ───────────────────────────────────
  async function cargarMapa(funcion: Funcion) {
    setLoadingMapa(true);
    setMapaScore([]);
    setMapaFallback(new Set());
    try {
      if (funcion.score_sala_id) {
        const [resMapa, resEsg] = await Promise.all([
          fetch("/api/score/mapa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sala: funcion.score_sala_id, fechaFuncion: funcion.fecha, funcion: funcion.hora }),
          }),
          fetch("/api/score/asientos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sala: funcion.score_sala_id, fechaFuncion: funcion.fecha, funcion: funcion.hora }),
          }),
        ]);
        const dataMapa = await resMapa.json();
        if (resMapa.ok && dataMapa.asientos?.length) {
          let asientos = dataMapa.asientos;
          // Overlay ocupación real de SCOESG (clave: fila+columnaLabel)
          if (resEsg.ok) {
            const dataEsg = await resEsg.json();
            const ocupacion = dataEsg.ocupacion as Record<string, string> | undefined;
            if (ocupacion) {
              asientos = asientos.map((a: { fila: string; columnaLabel: number; columna: number; zona: string; estado: string }) => {
                // SCOESG puede reportar por columnaLabel (relativa) o por columna (absoluta)
                const esgEstado = ocupacion[`${a.fila}${a.columnaLabel}`]
                               ?? ocupacion[`${a.fila}${a.columna}`];
                return { ...a, estado: (esgEstado ?? a.estado) as "S" | "B" | "R" };
              });
            }
          }
          setMapaScore(asientos);
          return;
        }
      }
      // Fallback: asientos ocupados de Supabase
      const ocupados = await getAsientosOcupados(funcion.id);
      setMapaFallback(new Set(ocupados.map(a => `${a.fila}${a.columna}`)));
    } catch {
      // silencioso
    } finally {
      setLoadingMapa(false);
    }
  }

  // ── Fetch precios (SCOPLA) ────────────────────────────────────────────────────
  async function cargarPlanes(funcion: Funcion) {
    if (!funcion.score_pelicula_id || !funcion.score_sala_id) return;
    setLoadingPlanes(true);
    try {
      const res = await fetch("/api/score/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaFuncion: funcion.fecha, pelicula: funcion.score_pelicula_id, sala: funcion.score_sala_id, inicioFuncion: funcion.hora }),
      });
      const data = await res.json();
      if (res.ok && data.planes?.length) setScorePlanes(data.planes);
    } catch { /* fallback a precios Supabase */ }
    finally { setLoadingPlanes(false); }
  }

  // ── Handlers de navegación ────────────────────────────────────────────────────
  const reset = () => {
    stopTimer();
    liberarHold(scoreSecuencia);
    setStep(1); setSelectedFecha(null); setSelectedFormato(null);
    setSelectedFuncion(null); setSelectedSeats(new Set());
    setMapaScore([]); setMapaFallback(new Set()); setScorePlanes([]);
    setPaymentDone(false); setTimedOut(false);
    setPaymentInfo({ nombre: "", email: "", telefono: "" });
    setPreferenceId(null); setScoreSecuencia(null);
  };

  const pickFecha = (fecha: string) => {
    setSelectedFecha(fecha); setSelectedFormato(null); setSelectedFuncion(null);
    setSelectedSeats(new Set()); setTimedOut(false); setStep(2);
  };

  const pickFormato = (f: string) => {
    setSelectedFormato(f); setSelectedFuncion(null); setSelectedSeats(new Set()); setStep(3);
  };

  const pickFuncion = async (f: Funcion) => {
    setSelectedFuncion(f); setSelectedSeats(new Set()); setTimedOut(false); setScorePlanes([]); setShowLoginGate(false);
    if (VENTA_ONLINE) await Promise.all([cargarMapa(f), cargarPlanes(f)]);
    setStep(4);
  };

  const continueToPayment = () => {
    if (!user || user === "loading") { setShowLoginGate(true); return; }
    setShowLoginGate(false);
    const u = user as User;
    setPaymentInfo(prev => ({
      nombre:   prev.nombre   || u.user_metadata?.nombre_completo || u.user_metadata?.full_name || "",
      email:    prev.email    || u.email || "",
      telefono: prev.telefono,
    }));
    startTimer();
    setStep(5);
  };

  const goBackToSeats = () => {
    stopTimer();
    liberarHold(scoreSecuencia);
    setScoreSecuencia(null);
    setPreferenceId(null);
    setStep(4);
  };

  // ── Crear preferencia MP + hold Score (SCOSEC → SCOGRU) ──────────────────────
  const handleCrearPreferencia = async () => {
    if (!selectedFuncion || !paymentInfo.nombre || !paymentInfo.email) return;
    setCreatingPreference(true);
    try {
      // 1. Hold en Score (si la función tiene IDs de Score)
      if (selectedFuncion.score_sala_id && selectedFuncion.score_pelicula_id) {
        try {
          const secRes  = await fetch("/api/score/secuencia");
          const secData = await secRes.json();
          const sec     = secData.secuencia as string;

          if (sec) {
            const tarifaReg = scorePlanRegular?.codigo ?? selectedFuncion.score_tarifa_regular ?? "";
            const tarifaVip = scorePlanVip?.codigo     ?? selectedFuncion.score_tarifa_vip     ?? "";

            const [hh, mm] = selectedFuncion.hora.split(":");
            await fetch("/api/score/grupo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fechaFuncion:  selectedFuncion.fecha,
                sala:          selectedFuncion.score_sala_id,
                horaFuncion:   selectedFuncion.hora,
                pelicula:      selectedFuncion.score_pelicula_id,
                inicioFuncion: (hh ?? "00") + (mm ?? "00"),
                descripcion:   movie.titulo,
                secuencia:     sec,
                nombre:        paymentInfo.nombre,
                telefono:      paymentInfo.telefono || "",
                ubicaciones:   asientosList.map(a => ({
                  fila:    a.fila,
                  columna: String(a.columna),
                  tarifa:  isVipRow(a.fila) ? tarifaVip : tarifaReg,
                })),
              }),
            });

            setScoreSecuencia(sec);
          }
        } catch {
          // Si Score falla el hold, continuamos sin él
        }
      }

      // 2. Crear preferencia MercadoPago
      const res = await fetch("/api/pagos/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo:     movie.titulo,
          asientos:   [...selectedSeats].sort(),
          total,
          email:      paymentInfo.email,
          nombre:     paymentInfo.nombre,
          funcion_id: selectedFuncion.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.preference_id) throw new Error(data.error);
      setPreferenceId(data.preference_id);
    } catch {
      alert("No se pudo conectar con el sistema de pago. Intenta de nuevo.");
    } finally {
      setCreatingPreference(false);
    }
  };

  // ── Pago exitoso ──────────────────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(
    async (paymentId: string) => {
      try {
        const tarifaReg = scorePlanRegular?.codigo ?? selectedFuncion?.score_tarifa_regular ?? "";
        const tarifaVip = scorePlanVip?.codigo     ?? selectedFuncion?.score_tarifa_vip     ?? "";

        const scoreUbicaciones = selectedFuncion?.score_sala_id
          ? asientosList.map(a => {
              const mapaAsiento = mapaScore.find(m => m.fila === a.fila && m.columna === a.columna);
              return {
                fila:        a.fila,
                columna:     String(a.columna),
                filRelativa: a.fila,
                colRelativa: String(mapaAsiento?.columnaLabel ?? a.columna),
                tarifa:      isVipRow(a.fila) ? tarifaVip : tarifaReg,
              };
            })
          : undefined;

        const res = await fetch("/api/pagos/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id:        paymentId,
            funcion_id:        selectedFuncion?.id,
            email:             paymentInfo.email,
            nombre:            paymentInfo.nombre,
            telefono:          paymentInfo.telefono || undefined,
            asientos:          asientosList,
            total,
            score_fecha:       selectedFuncion?.fecha,
            score_sala:        selectedFuncion?.score_sala_id  ?? undefined,
            score_hora:        selectedFuncion?.hora,
            score_pelicula:    selectedFuncion?.score_pelicula_id ?? undefined,
            score_secuencia:   scoreSecuencia ?? undefined,
            score_ubicaciones: scoreUbicaciones,
            score_descripcion: movie.titulo,
          }),
        });

        if (res.ok) {
          stopTimer();
          setScoreSecuencia(null);
          try {
            const dayInfo = days.find(d => d.fecha === selectedFecha);
            sessionStorage.setItem("cw-last-ticket", JSON.stringify({
              pelicula: movie.titulo,
              fecha:    dayInfo ? `${dayInfo.label} · ${fechaDisplay(dayInfo.fecha)}` : selectedFecha ?? "",
              hora:     selectedFuncion ? horaDisplay(selectedFuncion.hora) : "",
              formato:  selectedFuncion?.formato ?? "",
              asientos: [...selectedSeats].sort().map(getSeatLabel).join(", "),
              total:    `$${total.toLocaleString("es-CO")}`,
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
    [selectedFuncion, selectedFecha, selectedSeats, paymentInfo, asientosList, total,
     stopTimer, days, movie.titulo, scoreSecuencia, scorePlanRegular, scorePlanVip, isVipRow],
  );

  // ── UI helpers ────────────────────────────────────────────────────────────────
  const isCritical = timerSeconds !== null && timerSeconds <= 60;
  const isWarning  = timerSeconds !== null && timerSeconds <= 120 && !isCritical;
  const timerColor = isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[#CC1244]";
  const barColor   = isCritical ? "bg-red-500"   : isWarning ? "bg-amber-500"   : "bg-[#CC1244]";
  const barPct     = timerSeconds !== null ? (timerSeconds / TIMER_TOTAL) * 100 : 100;
  const dayData    = days.find(d => d.fecha === selectedFecha);

  const seatClass = (id: string) => {
    if (ocupadosSet.has(id))   return "bg-white/10 border-white/10 cursor-not-allowed opacity-40";
    if (selectedSeats.has(id)) return "bg-blue-500 border-blue-500 cursor-pointer scale-110 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
    if (isVipRow(id[0]))       return "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
    return "bg-[#CC1244]/20 border-[#CC1244]/60 hover:bg-[#CC1244]/40 cursor-pointer";
  };

  const seatFill = (id: string): { back: string; cushion: string; arm: string; glow: boolean } => {
    if (ocupadosSet.has(id))   return { back: "#ffffff", cushion: "#ffffff", arm: "#ffffff", glow: false };
    if (selectedSeats.has(id)) return { back: "#3B82F6", cushion: "#60A5FA", arm: "#2563EB", glow: true };
    if (isVipRow(id[0]))       return { back: "#EAB308", cushion: "#FDE047", arm: "#CA8A04", glow: false };
    return { back: "#CC1244", cushion: "#E8154F", arm: "#A50F36", glow: false };
  };

  const toggleSeat = (id: string) => {
    if (ocupadosSet.has(id)) return;
    setTimedOut(false);
    setSelectedSeats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ── Sin funciones ─────────────────────────────────────────────────────────────
  if (funciones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 font-heading tracking-widest text-sm">
        NO HAY FUNCIONES DISPONIBLES EN LOS PRÓXIMOS DÍAS
      </div>
    );
  }

  // ── Compra exitosa ────────────────────────────────────────────────────────────
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
            { label: "Fecha",    value: dayData ? `${dayData.label} · ${fechaDisplay(dayData.fecha)}` : "" },
            { label: "Función",  value: selectedFuncion ? `${horaDisplay(selectedFuncion.hora)} — ${selectedFuncion.formato}` : "" },
            { label: "Asientos", value: [...selectedSeats].sort().map(getSeatLabel).join(", ") },
          ].map(row => (
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
      <div className="flex items-center gap-0 mb-8 sm:mb-10">
        {["Fecha","Formato","Horario","Asientos","Pago"].map((label, i) => {
          const n = (i + 1) as 1|2|3|4|5;
          const locked = !VENTA_ONLINE && n > 3;
          const active = step === n && !locked; const done = step > n && !locked;
          return (
            <div key={label} className="flex items-center flex-1 sm:flex-none">
              <div className={`flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-4 py-2 rounded-sm transition-all w-full sm:w-auto ${active ? "bg-[#CC1244] text-white" : done ? "text-[#CC1244]" : locked ? "text-gray-700 opacity-50" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-heading border shrink-0 ${active ? "border-white text-white" : done ? "border-[#CC1244] bg-[#CC1244] text-white" : locked ? "border-gray-700" : "border-gray-600"}`}>
                  {done ? "✓" : locked ? "🔒" : n}
                </span>
                <span className="font-heading text-[9px] sm:text-xs tracking-widest hidden xs:inline sm:inline">{label.toUpperCase()}</span>
              </div>
              {i < 4 && <div className={`w-3 sm:w-8 h-px shrink-0 ${done ? "bg-[#CC1244]" : "bg-white/10"}`} />}
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
            <button onClick={() => { stopTimer(); liberarHold(scoreSecuencia); setScoreSecuencia(null); setStep(1); setSelectedFormato(null); setSelectedFuncion(null); setSelectedSeats(new Set()); }}
              className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline">CAMBIAR</button>
          )}
        </div>
        {step === 1 ? (
          <div className="flex gap-3 flex-wrap">
            {days.map(day => {
              const isWknd  = day.dayOfWeek === 0 || day.dayOfWeek === 6;
              const isTueWed = day.dayOfWeek === 2 || day.dayOfWeek === 3;
              return (
                <button key={day.fecha} onClick={() => pickFecha(day.fecha)}
                  className={`group flex flex-col items-center gap-1 sm:gap-1.5 rounded-xl px-4 sm:px-6 py-3 sm:py-5 border transition-all hover:border-[#CC1244]/50 hover:bg-[#1a1a1a] ${isWknd ? "bg-[#111] border-yellow-500/20" : "bg-[#111] border-white/10"}`}>
                  <span className={`font-heading text-[10px] tracking-widest uppercase ${isWknd ? "text-yellow-500/70" : "text-gray-600"}`}>{fechaDisplay(day.fecha)}</span>
                  <span className="font-heading text-2xl font-bold text-white group-hover:text-[#CC1244] transition-colors">{day.label}</span>
                  {isWknd && <span className="text-[9px] font-heading tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-sm">MÁS FUNCIONES</span>}
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
            formatosDisponibles.length === 0 ? (
              <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <span className="text-2xl">🎬</span>
                <div>
                  <p className="font-heading text-white text-sm tracking-wider">No hay funciones disponibles</p>
                  <p className="font-body text-gray-500 text-sm mt-1">
                    No quedan funciones para este día. Selecciona otra fecha o consúltanos en taquilla.
                  </p>
                </div>
              </div>
            ) : (
            <div className="flex gap-3 flex-wrap">
              {formatosDisponibles.map(f => (
                <button key={f} onClick={() => pickFormato(f)}
                  className={`font-heading text-sm tracking-widest px-6 sm:px-8 py-3 sm:py-4 rounded-xl border transition-all ${f === "VIP"
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"}`}>
                  {f}
                  <span className="block text-xs font-body mt-0.5 font-normal opacity-60">
                    {f === "VIP" ? fmt(precioVip) : fmt(precioRegular)} / silla
                  </span>
                </button>
              ))}
            </div>
            )
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
              {funcionesPorFormato.map(f => (
                <button key={f.id} onClick={() => pickFuncion(f)}
                  className="bg-white/5 hover:bg-[#CC1244] border border-white/15 hover:border-[#CC1244] text-white font-heading text-lg tracking-wider px-8 py-4 rounded-xl transition-all">
                  {horaDisplay(f.hora)}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-white font-heading">{selectedFuncion ? horaDisplay(selectedFuncion.hora) : ""}</span>
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

          {step === 4 && !VENTA_ONLINE && (
            <div className="flex flex-col items-center gap-6 py-12 text-center border border-white/10 rounded-2xl bg-[#111]">
              <div className="w-16 h-16 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center text-3xl">
                🎟️
              </div>
              <div>
                <p className="font-heading text-white text-xl tracking-wider mb-2">COMPRA EN LÍNEA PRÓXIMAMENTE</p>
                <p className="text-gray-500 font-body text-sm max-w-sm mx-auto leading-relaxed">
                  Estamos trabajando para habilitar la compra de boletos en línea.<br />
                  Por ahora, adquiere tus boletos directamente en <span className="text-white">taquilla</span>.
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-600 text-xs font-body">
                <span>📍 Finca Veracruz, Auto. Cali - Candelaria #Lt 5</span>
                <span>Manuela Beltrán, Candelaria, Valle del Cauca</span>
                <span className="mt-1">Taquilla abre 30 min antes de la primera función</span>
              </div>
              <button
                onClick={() => { setStep(3); setSelectedFuncion(null); }}
                className="border border-white/20 hover:border-white/40 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-6 py-2.5 rounded-sm transition-all"
              >
                ← VOLVER A HORARIOS
              </button>
            </div>
          )}

          {step === 4 && VENTA_ONLINE && (
            loadingMapa || loadingPlanes ? (
              <div className="flex items-center justify-center py-12 text-gray-600 font-heading text-sm tracking-widest">
                CARGANDO DISPONIBILIDAD...
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 overflow-x-auto">
                  {[...filas].reverse().map(row => (
                    <div key={row} className="flex items-center gap-2 justify-center">
                      <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                      <div className="flex gap-1.5 items-center">
                        {(allCols ?? colsEnFila(row)).map(col => {
                          const id = `${row}${col}`;
                          if (allCols && !seatExists(row, col)) {
                            if (col === 3) {
                              return (
                                <div key="aisle" className="w-6 h-8 flex items-center justify-center shrink-0">
                                  <span className="text-[7px] text-gray-700 font-heading" style={{ writingMode: "vertical-rl" }}>ESC</span>
                                </div>
                              );
                            }
                            return <div key={`gap-${col}`} className="w-8 h-8 shrink-0" />;
                          }
                          const occupied = ocupadosSet.has(id);
                          const selected = selectedSeats.has(id);
                          const f = seatFill(id);
                          return (
                            <button
                              key={id}
                              onClick={() => toggleSeat(id)}
                              title={occupied ? "Ocupado" : getSeatLabel(id)}
                              disabled={occupied}
                              className={`shrink-0 transition-all duration-150 ${selected ? "scale-110" : !occupied ? "hover:scale-105" : ""} ${occupied ? "cursor-not-allowed" : "cursor-pointer"}`}
                              style={{ background: "none", border: "none", padding: 0, filter: f.glow ? "drop-shadow(0 0 4px rgba(59,130,246,0.7))" : "none" }}
                            >
                              <svg viewBox="0 0 30 30" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                                {/* Respaldo */}
                                <rect x="4" y="1" width="22" height="17" rx="5" fill={f.back} opacity={occupied ? 0.18 : 0.85} />
                                {/* Apoyabrazos izquierdo */}
                                <rect x="0" y="13" width="5.5" height="15" rx="2.5" fill={f.arm} opacity={occupied ? 0.14 : 0.75} />
                                {/* Apoyabrazos derecho */}
                                <rect x="24.5" y="13" width="5.5" height="15" rx="2.5" fill={f.arm} opacity={occupied ? 0.14 : 0.75} />
                                {/* Cojín del asiento */}
                                <rect x="4" y="15" width="22" height="13" rx="4" fill={f.cushion} opacity={occupied ? 0.14 : 0.95} />
                                {/* Línea de costura del cojín */}
                                {!occupied && <rect x="7" y="18" width="16" height="7" rx="2.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />}
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
                  <span className="text-gray-600 text-xs font-heading tracking-widest">PANTALLA</span>
                </div>

                <div className="flex flex-wrap justify-center gap-5 text-xs font-body text-gray-500">
                  {[
                    { back: "#CC1244", cushion: "#E8154F", arm: "#A50F36", occ: false,  label: "Disponible" },
                    { back: "#3B82F6", cushion: "#60A5FA", arm: "#2563EB", occ: false,  label: "Seleccionado" },
                    { back: "#ffffff", cushion: "#ffffff", arm: "#ffffff", occ: true,   label: "Ocupado" },
                    { back: "#EAB308", cushion: "#FDE047", arm: "#CA8A04", occ: false,  label: `VIP — ${fmt(precioVip)}` },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5">
                      <svg viewBox="0 0 30 30" width="18" height="18">
                        <rect x="4" y="1" width="22" height="17" rx="5" fill={l.back} opacity={l.occ ? 0.18 : 0.85} />
                        <rect x="0" y="13" width="5.5" height="15" rx="2.5" fill={l.arm} opacity={l.occ ? 0.14 : 0.75} />
                        <rect x="24.5" y="13" width="5.5" height="15" rx="2.5" fill={l.arm} opacity={l.occ ? 0.14 : 0.75} />
                        <rect x="4" y="15" width="22" height="13" rx="4" fill={l.cushion} opacity={l.occ ? 0.14 : 0.95} />
                      </svg>
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
                    IR AL PAGO — {fmt(total)}
                  </button>
                </div>

                {/* Gate de login — aparece solo si intenta pagar sin sesión */}
                {showLoginGate && (
                  <div className="flex flex-col items-center gap-5 py-8 border border-[#CC1244]/30 rounded-2xl bg-[#CC1244]/5 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#CC1244]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading text-white text-base tracking-wider mb-1">INICIA SESIÓN PARA CONTINUAR</p>
                      <p className="text-gray-500 font-body text-sm">Necesitas una cuenta para completar tu compra.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                      <Link href={`/cuenta/login?redirect=${encodeURIComponent(pathname)}`}
                        className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center">INGRESAR</Link>
                      <Link href={`/cuenta/registrar?redirect=${encodeURIComponent(pathname)}`}
                        className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center">REGISTRARSE</Link>
                    </div>
                  </div>
                )}
              </>
            )
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

          {user && user !== "loading" && (<>
            {/* Timer */}
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
                  { label: "Fecha",    value: dayData ? `${dayData.label} · ${fechaDisplay(dayData.fecha)}` : "" },
                  { label: "Función",  value: selectedFuncion ? `${horaDisplay(selectedFuncion.hora)} — ${selectedFuncion.formato}` : "" },
                  { label: "Asientos", value: [...selectedSeats].sort().map(getSeatLabel).join(", ") },
                ].map(row => (
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

              {/* Datos + pago */}
              <div className="flex flex-col gap-4">
                <p className="font-heading text-xs text-gray-500 tracking-widest">TUS DATOS</p>
                <div className="flex flex-col gap-3">
                  {[
                    { type: "text",  placeholder: "Nombre completo *", key: "nombre",   value: paymentInfo.nombre },
                    { type: "email", placeholder: "Correo electrónico *", key: "email", value: paymentInfo.email },
                    { type: "tel",   placeholder: "Teléfono (opcional)", key: "telefono", value: paymentInfo.telefono },
                  ].map(f => (
                    <input key={f.key} type={f.type} placeholder={f.placeholder} value={f.value}
                      onChange={e => setPaymentInfo(p => ({ ...p, [f.key]: e.target.value }))}
                      className="bg-white/5 border border-white/15 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600" />
                  ))}
                </div>

                {!preferenceId ? (
                  <div className="flex gap-3 mt-2">
                    <button onClick={goBackToSeats}
                      className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all">
                      VOLVER
                    </button>
                    <button disabled={!paymentInfo.nombre || !paymentInfo.email || creatingPreference}
                      onClick={() => movie.edad_minima > 0 ? setShowAgeModal(true) : handleCrearPreferencia()}
                      className="flex-[2] bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all flex items-center justify-center gap-2">
                      {creatingPreference ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />CARGANDO...</>
                      ) : (`IR AL PAGO — ${fmt(total)}`)}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="font-heading text-xs text-gray-500 tracking-widest">MÉTODO DE PAGO</p>
                    <MercadoPagoBrick preferenceId={preferenceId} total={total}
                      onSuccess={handlePaymentSuccess}
                      onError={() => alert("Error en el pago. Intenta de nuevo.")} />
                    <button onClick={() => setPreferenceId(null)}
                      className="text-gray-600 hover:text-white font-heading text-xs tracking-widest transition-colors text-center">
                      ← VOLVER A MIS DATOS
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>)}
        </div>
      )}

      {/* Modal restricción de edad */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-[#CC1244]/15 border border-[#CC1244]/30 flex items-center justify-center">
                <span className="font-heading text-[#CC1244] text-2xl font-bold">+{movie.edad_minima}</span>
              </div>
              <h3 className="font-heading text-white text-lg font-bold tracking-wide">
                Restricción de edad
              </h3>
              <p className="font-body text-gray-400 text-sm leading-relaxed">
                Esta película tiene restricción para menores de{" "}
                <span className="text-white font-semibold">{movie.edad_minima} años</span>.
                Al continuar, confirmas que eres consciente de que{" "}
                <span className="text-[#CC1244] font-semibold">cualquier persona menor de {movie.edad_minima} años no podrá ingresar a la sala</span>, independientemente de si tiene boleta.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowAgeModal(false); handleCrearPreferencia(); }}
                className="w-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
              >
                ENTIENDO — CONTINUAR AL PAGO
              </button>
              <button
                onClick={() => setShowAgeModal(false)}
                className="w-full border border-white/15 hover:border-white/30 text-gray-400 hover:text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
