"use client";

import { useEffect, useState, useCallback } from "react";

interface ReservaAdmin {
  id: number;
  email: string;
  nombre: string;
  telefono: string | null;
  asientos: Array<{ fila: string; columna: number }>;
  total: number;
  estado: string;
  referencia_pago: string | null;
  created_at: string;
  funcion?: {
    fecha: string;
    hora: string;
    formato: string;
    pelicula?: { titulo: string };
    sala?: { nombre: string };
  };
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function fechaLabel(s: string) {
  const [, m, d] = s.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
}
function horaLabel(s: string) {
  const [h, m] = s.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${m} ${ampm}`;
}
function dateTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) + " " +
    d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

const ESTADO_COLOR: Record<string, string> = {
  pagado: "text-green-400 bg-green-400/10 border-green-400/30",
  pendiente: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  cancelado: "text-gray-500 bg-white/5 border-white/10",
};

export default function ReservasAdminPage() {
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  const ingresoTotal = reservas
    .filter((r) => r.estado === "pagado")
    .reduce((a, r) => a + r.total, 0);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (estado) params.set("estado", estado);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);

    fetch(`/api/admin/reservas?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setReservas(d.data ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [estado, desde, hasta, page]);

  useEffect(() => { load(); }, [load]);

  const inputClass = "bg-[#0d0d0d] border border-white/10 text-white font-body text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#CC1244] transition-colors";

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">RESERVAS</h1>
        <p className="text-gray-500 font-body text-sm mt-1">{total} reservas en total</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-heading text-xs text-gray-500 tracking-widest">Estado</label>
          <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className={inputClass}>
            <option value="">Todos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-heading text-xs text-gray-500 tracking-widest">Desde</label>
          <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1); }} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-heading text-xs text-gray-500 tracking-widest">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1); }} className={inputClass} />
        </div>
        <button onClick={() => { setEstado(""); setDesde(""); setHasta(""); setPage(1); }}
          className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-4 py-2 rounded-lg transition-all">
          LIMPIAR
        </button>

        {ingresoTotal > 0 && (
          <div className="ml-auto text-right">
            <p className="font-heading text-xs text-gray-500 tracking-widest">Ingresos filtrados</p>
            <p className="font-heading text-xl font-bold text-[#CC1244]">${ingresoTotal.toLocaleString("es-CO")}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#111] rounded-xl animate-pulse" />)}</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">NO HAY RESERVAS</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {reservas.map((r) => (
              <div key={r.id} className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-heading text-white font-bold text-sm">
                      {r.funcion?.pelicula?.titulo ?? `Función #${r.funcion?.fecha ?? r.id}`}
                    </span>
                    {r.funcion && (
                      <span className="text-gray-500 font-body text-xs">
                        {fechaLabel(r.funcion.fecha)} · {horaLabel(r.funcion.hora)} · {r.funcion.formato}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-gray-400 font-body text-xs">{r.nombre}</span>
                    <span className="text-gray-600 font-body text-xs">{r.email}</span>
                    {r.telefono && <span className="text-gray-600 font-body text-xs">{r.telefono}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-body text-gray-600">
                    <span>Asientos: {r.asientos.map((a) => `${a.fila}${a.columna}`).join(", ")}</span>
                    <span>·</span>
                    <span>{dateTimeLabel(r.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-heading text-xs px-2.5 py-1 rounded-full border ${ESTADO_COLOR[r.estado] ?? ESTADO_COLOR.cancelado}`}>
                    {r.estado}
                  </span>
                  <span className="font-heading text-white font-bold">${r.total.toLocaleString("es-CO")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {total > 50 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-30">
                ANTERIOR
              </button>
              <span className="text-gray-500 font-body text-sm">Página {page}</span>
              <button disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}
                className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-30">
                SIGUIENTE
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
