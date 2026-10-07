"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Pelicula, Funcion } from "@/lib/types";
import { getAsientosOcupados } from "@/lib/db";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const WompiCheckout = dynamic(() => import("@/components/WompiCheckout"), { ssr: false });
import type { WompiCheckoutData } from "@/components/WompiCheckout";

// Cambiar a false para deshabilitar la venta en línea
import { VENTA_ONLINE } from "@/lib/config";
import { CINE } from "@/lib/cine";
import SeatMap from "./booking/SeatMap";
import StepIndicator from "./booking/StepIndicator";
import AgeModal from "./booking/AgeModal";

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

const suscribirNada = () => () => {};

function supabaseConfigurado() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
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
  const router = useRouter();
  // "" en el servidor y la fecha local en el navegador (evita diferencias de hidratación)
  const hoyStr = useSyncExternalStore(suscribirNada, getTodayStr, () => "");
  const days = useMemo(() => buildDays(funciones, hoyStr), [funciones, hoyStr]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null | "loading">(() => (supabaseConfigurado() ? "loading" : null));
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
  const [timerSeconds,       setTimerSeconds]        = useState<number | null>(null);
  const [timedOut,           setTimedOut]            = useState(false);
  const [paymentInfo,        setPaymentInfo]         = useState({ nombre: "", email: "", telefono: "" });
  const [wompiData,          setWompiData]           = useState<WompiCheckoutData | null>(null);
  const [iniciandoPago,      setIniciandoPago]       = useState(false);
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
  const allCols = useMemo(() => {
    if (!usaScoreMapa) return null;
    const cols = mapaScore.map(a => a.columna);
    const min = Math.min(...cols);
    const max = Math.max(...cols);
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  }, [mapaScore, usaScoreMapa]);

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

  const total = [...selectedSeats].reduce((acc, id) => acc + (isVipRow(id[0]) ? precioVip : precioRegular), 0);

  const asientosList = useMemo(
    () => [...selectedSeats].map(id => ({
      fila: id[0],
      columna: parseInt(id.slice(1)),
      tipo: (isVipRow(id[0]) ? "vip" : "regular") as "regular" | "vip",
    })),
    [selectedSeats, isVipRow],
  );

  // ── Timer ─────────────────────────────────────────────────────────────────────
  const onTimeoutRef = useRef<() => void>(() => {});
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const deadline = Date.now() + TIMER_TOTAL * 1000;
    setTimerSeconds(TIMER_TOTAL);
    intervalRef.current = setInterval(() => {
      const restante = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (restante === 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onTimeoutRef.current();
      } else {
        setTimerSeconds(restante);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerSeconds(null);
  }, []);

  // ── Liberar hold en Score (SCOSIL, silla por silla) ───────────────────────────
  const holdRef = useRef<{ fechaFuncion: string; sala: string; funcion: string; asientos: { fila: string; columna: number }[] } | null>(null);
  const liberarHold = useCallback(() => {
    const hold = holdRef.current;
    holdRef.current = null;
    if (!hold) return;
    fetch("/api/score/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hold),
      keepalive: true,
    }).catch(() => {});
  }, []);

  // Timer expira → liberar hold
  useEffect(() => {
    onTimeoutRef.current = () => {
      setTimedOut(true);
      setSelectedSeats(new Set());
      setStep(4);
      setTimerSeconds(null);
      liberarHold();
      setScoreSecuencia(null);
    };
  }, [liberarHold]);

  // Si el cliente sale de la página sin pagar, liberar las sillas
  useEffect(() => liberarHold, [liberarHold]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigurado()) return;
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

  const continueToPayment = async () => {
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

    // Hold en Score al momento que el cliente avanza al paso de pago
    if (selectedFuncion?.score_sala_id && selectedFuncion?.score_pelicula_id) {
      try {
        const secRes  = await fetch("/api/score/secuencia");
        const secData = await secRes.json();
        const sec     = secData.secuencia as string;
        if (sec) {
          const tarifaReg = scorePlanRegular?.codigo ?? selectedFuncion.score_tarifa_regular ?? "";
          const tarifaVip = scorePlanVip?.codigo     ?? selectedFuncion.score_tarifa_vip     ?? "";
          const [hh, mm]  = selectedFuncion.hora.split(":");
          const grupoRes  = await fetch("/api/score/grupo", {
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
              nombre:        u.user_metadata?.full_name || u.email || "Cliente",
              telefono:      u.user_metadata?.telefono || "",
              ubicaciones:   asientosList.map(a => ({
                fila:    a.fila,
                columna: String(a.columna),
                tarifa:  isVipRow(a.fila) ? tarifaVip : tarifaReg,
              })),
            }),
          });
          const grupoData = await grupoRes.json();
          if (grupoRes.ok && grupoData.ok) {
            holdRef.current = {
              fechaFuncion: selectedFuncion.fecha,
              sala:         selectedFuncion.score_sala_id,
              funcion:      selectedFuncion.hora,
              asientos:     asientosList.map(a => ({ fila: a.fila, columna: a.columna })),
            };
          }
          setScoreSecuencia(sec);
        }
      } catch { /* sin hold en Score: la venta se valida igual al confirmar */ }
    }
  };

  const goBackToSeats = () => {
    stopTimer();
    liberarHold();
    setScoreSecuencia(null);
    setWompiData(null);
    setStep(4);
  };

  // ── Iniciar pago Wompi: guarda la orden en el servidor y devuelve los datos firmados ──
  const handleIniciarPago = async () => {
    if (!selectedFuncion || !paymentInfo.nombre || !paymentInfo.email) return;
    setIniciandoPago(true);
    try {
      const tarifaReg = scorePlanRegular?.codigo ?? selectedFuncion.score_tarifa_regular ?? "";
      const tarifaVip = scorePlanVip?.codigo     ?? selectedFuncion.score_tarifa_vip     ?? "";

      const columnaLabel = (fila: string, columna: number) =>
        mapaScore.find(m => m.fila === fila && m.columna === columna)?.columnaLabel ?? columna;

      const scoreUbicaciones = selectedFuncion.score_sala_id
        ? asientosList.map(a => ({
            fila:        a.fila,
            columna:     String(a.columna),
            filRelativa: a.fila,
            colRelativa: String(columnaLabel(a.fila, a.columna)),
            tarifa:      isVipRow(a.fila) ? tarifaVip : tarifaReg,
          }))
        : undefined;

      const res = await fetch("/api/pagos/wompi/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcion_id:        selectedFuncion.id,
          email:             paymentInfo.email,
          nombre:            paymentInfo.nombre,
          telefono:          paymentInfo.telefono || undefined,
          asientos:          asientosList.map(a => ({ ...a, columnaLabel: columnaLabel(a.fila, a.columna) })),
          total,
          score_fecha:       selectedFuncion.fecha,
          score_sala:        selectedFuncion.score_sala_id  ?? undefined,
          score_hora:        selectedFuncion.hora,
          score_pelicula:    selectedFuncion.score_pelicula_id ?? undefined,
          score_secuencia:   scoreSecuencia ?? undefined,
          score_ubicaciones: scoreUbicaciones,
          score_descripcion: movie.titulo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reference) throw new Error(data.error);

      // A partir de aquí el tiempo para pagar lo controla Wompi (expirationTime)
      stopTimer();
      try {
        const dayInfo = days.find(d => d.fecha === selectedFecha);
        sessionStorage.setItem("cw-last-ticket", JSON.stringify({
          pelicula: movie.titulo,
          fecha:    dayInfo ? `${dayInfo.label} · ${fechaDisplay(dayInfo.fecha)}` : selectedFecha ?? "",
          hora:     horaDisplay(selectedFuncion.hora),
          formato:  selectedFuncion.formato,
          asientos: [...selectedSeats].sort().map(getSeatLabel).join(", "),
          total:    `$${total.toLocaleString("es-CO")}`,
        }));
      } catch { /* sessionStorage no disponible */ }
      setWompiData(data as WompiCheckoutData);
    } catch {
      alert("No se pudo conectar con el sistema de pago. Intenta de nuevo.");
    } finally {
      setIniciandoPago(false);
    }
  };

  // ── Resultado del widget → la página de resultado consulta el estado real ─────
  const handleWompiResult = useCallback((transactionId: string) => {
    holdRef.current = null; // el pago ya se intentó: no liberar las sillas
    setScoreSecuencia(null);
    router.push(`/pago/resultado?id=${encodeURIComponent(transactionId)}`);
  }, [router]);

  // ── UI helpers ────────────────────────────────────────────────────────────────
  const isCritical = timerSeconds !== null && timerSeconds <= 60;
  const isWarning  = timerSeconds !== null && timerSeconds <= 120 && !isCritical;
  const timerColor = isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-[#CC1244]";
  const barColor   = isCritical ? "bg-red-500"   : isWarning ? "bg-amber-500"   : "bg-[#CC1244]";
  const barPct     = timerSeconds !== null ? (timerSeconds / TIMER_TOTAL) * 100 : 100;
  const dayData    = days.find(d => d.fecha === selectedFecha);

  const toggleSeat = (id: string) => {
    if (ocupadosSet.has(id)) return;
    setTimedOut(false);
    setSelectedSeats(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // ── Sin funciones ─────────────────────────────────────────────────────────────
  if (funciones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600 font-heading tracking-widest text-sm">
        NO HAY FUNCIONES DISPONIBLES EN LOS PRÓXIMOS DÍAS
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">

      <StepIndicator step={step} ventaOnline={VENTA_ONLINE} />

      {/* ── PASO 1: FECHA ── */}
      <div className={`flex flex-col gap-4 ${step > 1 ? "mb-6 pb-6 border-b border-white/10" : "mb-10"}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-white tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#CC1244] text-white text-xs flex items-center justify-center font-bold">1</span>
            SELECCIONA LA FECHA
          </h3>
          {step > 1 && (
            <button onClick={() => { stopTimer(); liberarHold(); setScoreSecuencia(null); setStep(1); setSelectedFormato(null); setSelectedFuncion(null); setSelectedSeats(new Set()); }}
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
                  {isTueWed && <span className="text-[9px] font-heading tracking-widest text-[#CC1244] bg-[#CC1244]/10 px-2 py-0.5 rounded-sm">½ PRECIO</span>}
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
                <span>📍 {CINE.lugar} — {CINE.direccion}</span>
                <span>{CINE.ciudad}</span>
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
                <SeatMap
                  filas={filas}
                  allCols={allCols}
                  colsEnFila={colsEnFila}
                  seatExists={seatExists}
                  mirrorCols={mirrorCols}
                  ocupados={ocupadosSet}
                  seleccionados={selectedSeats}
                  isVipRow={isVipRow}
                  precioVip={fmt(precioVip)}
                  onToggle={toggleSeat}
                />

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
                    <input key={f.key} type={f.type} placeholder={f.placeholder} value={f.value} disabled={!!wompiData}
                      onChange={e => setPaymentInfo(p => ({ ...p, [f.key]: e.target.value }))}
                      className="bg-white/5 border border-white/15 text-white font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-[#CC1244] placeholder-gray-600 disabled:opacity-50" />
                  ))}
                </div>

                {!wompiData ? (
                  <div className="flex gap-3 mt-2">
                    <button onClick={goBackToSeats}
                      className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all">
                      VOLVER
                    </button>
                    <button disabled={!paymentInfo.nombre || !paymentInfo.email || iniciandoPago}
                      onClick={() => movie.edad_minima > 0 ? setShowAgeModal(true) : handleIniciarPago()}
                      className="flex-[2] bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all flex items-center justify-center gap-2">
                      {iniciandoPago ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />CARGANDO...</>
                      ) : (`IR AL PAGO — ${fmt(total)}`)}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="font-heading text-xs text-gray-500 tracking-widest">MÉTODO DE PAGO</p>
                    <p className="text-gray-500 font-body text-xs leading-relaxed">
                      Paga con tarjeta, PSE, Nequi, Botón Bancolombia o Daviplata. Tienes 10 minutos para completar el pago.
                    </p>
                    <WompiCheckout data={wompiData}
                      customer={paymentInfo}
                      label={`PAGAR ${fmt(total)}`}
                      onResult={handleWompiResult}
                      onError={() => alert("No se pudo cargar el sistema de pago. Intenta de nuevo.")} />
                    <button onClick={() => { setWompiData(null); startTimer(); }}
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

      {showAgeModal && (
        <AgeModal
          edad={movie.edad_minima}
          onConfirm={() => { setShowAgeModal(false); handleIniciarPago(); }}
          onCancel={() => setShowAgeModal(false)}
        />
      )}
    </div>
  );
}
