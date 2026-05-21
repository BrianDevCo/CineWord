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

function buildDays(funciones: Funcion[]): CalendarDay[] {
  return [...new Set(funciones.map((f) => f.fecha))].slice(0, 7).map((fecha, i) => {
    const d = new Date(fecha + "T12:00:00");
    return { label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : fechaDisplay(fecha), fecha, dayOfWeek: d.getDay() };
  });
}

interface Props { movie: Pelicula; funciones: Funcion[]; }

export default function BookingSection({ movie, funciones }: Props) {
  const pathname = usePathname();
  const days = useMemo(() => buildDays(funciones), [funciones]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null | "loading">("loading");

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
  const mirrorCols = selectedFuncion?.sala?.mirror_columns ?? false;

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

  // Convierte ID interno (A4) → etiqueta visible (A3) usando ColumnaRelativa de Score
  const getSeatLabel = useCallback((id: string): string => {
    if (!usaScoreMapa) return id;
    const fila = id[0];
    const col  = parseInt(id.slice(1));
    const a    = mapaScore.find(s => s.fila === fila && s.columna === col);
    return a ? `${fila}${a.columnaLabel}` : id;
  }, [mapaScore, usaScoreMapa]);

  const ocupadosSet = useMemo(() => {
    if (usaScoreMapa) return new Set(mapaScore.filter(a => a.estado !== "S").map(a => `${a.fila}${a.columna}`));
    return mapaFallback;
  }, [mapaScore, mapaFallback, usaScoreMapa]);

  // ── Precios ───────────────────────────────────────────────────────────────────
  const scorePlanRegular = scorePlanes.find(p => !p.zona.toUpperCase().includes("VIP"));
  const scorePlanVip     = scorePlanes.find(p =>  p.zona.toUpperCase().includes("VIP"));
  const precioRegular = scorePlanRegular?.valor ?? selectedFuncion?.precio_regular ?? 15000;
  const precioVip     = scorePlanVip?.valor     ?? selectedFuncion?.precio_vip     ?? 25000;

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

  // ── Funciones filtradas ───────────────────────────────────────────────────────
  const funcionesPorFecha   = selectedFecha   ? funciones.filter(f => f.fecha === selectedFecha)    : [];
  const formatosDisponibles = [...new Set(funcionesPorFecha.map(f => f.formato))];
  const funcionesPorFormato = selectedFormato ? funcionesPorFecha.filter(f => f.formato === selectedFormato) : [];

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

  // Si el usuario se loguea mientras está en el paso 4, cargar el mapa automáticamente
  useEffect(() => {
    if (user && user !== "loading" && step === 4 && selectedFuncion && mapaScore.length === 0 && mapaFallback.size === 0 && !loadingMapa) {
      const correo = (user as User).email ?? "";
      cargarMapa(selectedFuncion, correo);
      cargarPlanes(selectedFuncion);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Fetch mapa (SCOMAP → fallback Supabase) ───────────────────────────────────
  async function cargarMapa(funcion: Funcion, correo: string) {
    setLoadingMapa(true);
    setMapaScore([]);
    setMapaFallback(new Set());
    try {
      if (funcion.score_sala_id) {
        const res = await fetch("/api/score/mapa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sala: funcion.score_sala_id, fechaFuncion: funcion.fecha, funcion: funcion.hora }),
        });
        const data = await res.json();
        if (res.ok && data.asientos?.length) {
          let asientos = data.asientos as AsientoMapa[];
          // Superponer ocupación real de SCOEST si el usuario tiene correo
          if (correo) {
            try {
              const estRes = await fetch("/api/score/asientos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sala: funcion.score_sala_id, fechaFuncion: funcion.fecha, funcion: funcion.hora, correo }),
              });
              const estData = await estRes.json();
              if (estRes.ok && estData.asientos?.length) {
                const ocupMap = new Map<string, "S" | "B" | "R">();
                for (const a of estData.asientos as AsientoMapa[]) ocupMap.set(`${a.fila}${a.columna}`, a.estado);
                asientos = asientos.map(a => ({ ...a, estado: ocupMap.get(`${a.fila}${a.columna}`) ?? a.estado }));
              }
            } catch { /* si SCOEST falla, usamos SCOMAP sin estado */ }
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
    setSelectedFuncion(f); setSelectedSeats(new Set()); setTimedOut(false); setScorePlanes([]);
    setStep(4);
    if (!user || user === "loading") return; // gate de login en paso 4
    const correo = (user as User).email ?? "";
    await Promise.all([cargarMapa(f, correo), cargarPlanes(f)]);
  };

  const continueToPayment = () => {
    if (!user || user === "loading") { setStep(5); return; }
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

            await fetch("/api/score/grupo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fechaFuncion: selectedFuncion.fecha,
                sala:         selectedFuncion.score_sala_id,
                horaFuncion:  selectedFuncion.hora,
                pelicula:     selectedFuncion.score_pelicula_id,
                secuencia:    sec,
                nombre:       paymentInfo.nombre,
                telefono:     paymentInfo.telefono || "",
                ubicaciones:  asientosList.map(a => ({
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
          ? asientosList.map(a => ({
              fila:    a.fila,
              columna: String(a.columna),
              tarifa:  isVipRow(a.fila) ? tarifaVip : tarifaReg,
            }))
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
    if (selectedSeats.has(id)) return "bg-[#CC1244] border-[#CC1244] cursor-pointer scale-110 shadow-[0_0_8px_rgba(204,18,68,0.6)]";
    if (isVipRow(id[0]))       return "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer";
    return "bg-white/5 border-white/20 hover:bg-white/15 cursor-pointer";
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
      <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
        {["Fecha","Formato","Horario","Asientos","Pago"].map((label, i) => {
          const n = (i + 1) as 1|2|3|4|5;
          const active = step === n; const done = step > n;
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
                  className={`group flex flex-col items-center gap-1.5 rounded-xl px-6 py-5 border transition-all hover:border-[#CC1244]/50 hover:bg-[#1a1a1a] ${isWknd ? "bg-[#111] border-yellow-500/20" : "bg-[#111] border-white/10"}`}>
                  <span className={`font-heading text-[10px] tracking-widest uppercase ${isWknd ? "text-yellow-500/70" : "text-gray-600"}`}>{fechaDisplay(day.fecha)}</span>
                  <span className="font-heading text-2xl font-bold text-white group-hover:text-[#CC1244] transition-colors">{day.label}</span>
                  {isWknd  && <span className="text-[9px] font-heading tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-sm">MÁS FUNCIONES</span>}
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
              {formatosDisponibles.map(f => (
                <button key={f} onClick={() => pickFormato(f)}
                  className={`font-heading text-sm tracking-widest px-8 py-4 rounded-xl border transition-all ${f === "VIP"
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"}`}>
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

          {step === 4 && (!user || user === "loading") && (
            <div className="flex flex-col items-center gap-6 py-10 border border-white/10 rounded-2xl bg-[#111] text-center">
              <div className="w-14 h-14 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#CC1244]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-white text-lg tracking-wider mb-1">INICIA SESIÓN PARA VER LAS SILLAS</p>
                <p className="text-gray-500 font-body text-sm">Necesitamos tu correo para consultar la disponibilidad en tiempo real.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link href={`/cuenta/login?redirect=${encodeURIComponent(pathname)}`}
                  className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center">INGRESAR</Link>
                <Link href={`/cuenta/registrar?redirect=${encodeURIComponent(pathname)}`}
                  className="flex-1 border border-white/20 hover:border-white/40 text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all text-center">REGISTRARSE</Link>
              </div>
              <button onClick={() => setStep(3)} className="text-gray-600 hover:text-white font-heading text-xs tracking-widest transition-colors">
                ← VOLVER AL HORARIO
              </button>
            </div>
          )}

          {step === 4 && user && user !== "loading" && (
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
                            // Col 3 es siempre el pasillo (escaleras) independiente del espejo
                            if (col === 3) {
                              return (
                                <div key="aisle" className="w-6 h-6 flex items-center justify-center shrink-0">
                                  <span className="text-[7px] text-gray-700 font-heading" style={{ writingMode: "vertical-rl" }}>ESC</span>
                                </div>
                              );
                            }
                            return <div key={`gap-${col}`} className="w-7 h-6 shrink-0" />;
                          }
                          return (
                            <button key={id} onClick={() => toggleSeat(id)} title={ocupadosSet.has(id) ? "Ocupado" : getSeatLabel(id)}
                              className={`w-7 h-6 rounded-t-md border text-[10px] transition-all duration-150 ${seatClass(id)}`} />
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
                    { color: "bg-white/5 border-white/20",           label: "Disponible" },
                    { color: "bg-[#CC1244] border-[#CC1244]",        label: "Seleccionado" },
                    { color: "bg-white/10 border-white/10 opacity-40", label: "Ocupado" },
                    { color: "bg-yellow-500/10 border-yellow-500/40", label: `VIP — ${fmt(precioVip)}` },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5">
                      <span className={`w-4 h-3.5 rounded-t-sm border inline-block ${l.color}`} />
                      {l.label}
                    </span>
                  ))}
                </div>

                {/* Banner próximamente */}
                <div className="flex flex-col items-center gap-4 bg-[#111] border border-[#CC1244]/20 rounded-xl p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#CC1244]/10 border border-[#CC1244]/30 flex items-center justify-center text-2xl">
                    🚧
                  </div>
                  <div>
                    <p className="font-heading text-white text-lg tracking-wider">COMPRA EN LÍNEA — PRÓXIMAMENTE</p>
                    <p className="text-gray-500 font-body text-sm mt-2 max-w-sm mx-auto">
                      Estamos trabajando para habilitar la compra de boletos en línea. Por ahora, adquiere tus entradas directamente en taquilla.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-5 py-3 mt-1">
                    <span className="text-lg">🎟️</span>
                    <p className="font-heading text-gray-300 text-xs tracking-widest">TAQUILLA ABIERTA TODOS LOS DÍAS — 1:00 PM A 10:00 PM</p>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}

    </div>
  );
}
