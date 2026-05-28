"use client";

import { useEffect, useState } from "react";

interface FuncionAdmin {
  id: number;
  pelicula_id: number;
  sala_id: number;
  fecha: string;
  hora: string;
  formato: string;
  precio_regular: number;
  precio_vip: number;
  activa: boolean;
  pelicula?: { titulo: string };
  sala?: { nombre: string; tipo: string };
}

interface PeliculaOpt { id: number; titulo: string; }
interface SalaOpt { id: number; nombre: string; tipo: string; }

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

const EMPTY_FORM = { pelicula_id: "", sala_id: "", fecha: "", hora: "", formato: "2D", precio_regular: 15000, precio_vip: 25000 };

export default function FuncionesAdminPage() {
  const [funciones, setFunciones] = useState<FuncionAdmin[]>([]);
  const [peliculas, setPeliculas] = useState<PeliculaOpt[]>([]);
  const [salas, setSalas] = useState<SalaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      fetch("/api/admin/funciones").then((r) => r.json()),
      fetch("/api/admin/peliculas").then((r) => r.json()),
      fetch("/api/admin/salas").then((r) => r.json()),
    ]).then(([f, p, s]) => {
      setFunciones(Array.isArray(f) ? f : []);
      setPeliculas(Array.isArray(p) ? p.filter((x: { activa: boolean }) => x.activa) : []);
      setSalas(Array.isArray(s) ? s.filter((x: { activa: boolean }) => x.activa) : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/funciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); setSaving(false); return; }
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
    setSaving(false);
  };

  const toggleActiva = async (f: FuncionAdmin) => {
    await fetch(`/api/admin/funciones/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !f.activa }),
    });
    load();
  };

  const deleteFuncion = async (id: number) => {
    if (!confirm("¿Eliminar esta función?")) return;
    await fetch(`/api/admin/funciones/${id}`, { method: "DELETE" });
    load();
  };

  const syncCartelera = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-cartelera", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setSyncResult(`Error: ${data.error}`); return; }
      const r = data.resumen;
      const partes = [];
      if (r.peliculas_linkeadas) partes.push(`${r.peliculas_linkeadas} películas linkeadas`);
      if (r.peliculas_creadas)   partes.push(`${r.peliculas_creadas} películas nuevas`);
      if (r.peliculas_retiradas) partes.push(`${r.peliculas_retiradas} retiradas`);
      if (r.funciones_creadas)   partes.push(`${r.funciones_creadas} funciones creadas`);
      if (r.funciones_desactivadas) partes.push(`${r.funciones_desactivadas} funciones desactivadas`);
      setSyncResult(`✓ ${partes.length ? partes.join(" · ") : "Todo al día, sin cambios"}`);
      load();
    } catch {
      setSyncResult("Error al conectar con Score");
    } finally {
      setSyncing(false);
    }
  };

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const inputClass = "bg-[#0d0d0d] border border-white/10 text-white font-body text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#CC1244] w-full transition-colors";

  // Agrupar por fecha
  const byDate = funciones.reduce<Record<string, FuncionAdmin[]>>((acc, f) => {
    acc[f.fecha] = acc[f.fecha] ?? [];
    acc[f.fecha].push(f);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
          <h1 className="font-heading text-3xl font-bold text-white tracking-wider">FUNCIONES</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={syncCartelera} disabled={syncing}
            className="border border-[#CC1244] text-[#CC1244] hover:bg-[#CC1244] hover:text-white disabled:opacity-40 font-heading text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "SINCRONIZANDO..." : "SINCRONIZAR SCORE"}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            NUEVA FUNCIÓN
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${syncResult.startsWith("Error") ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"}`}>
          {syncResult}
        </div>
      )}

      {/* Formulario nueva función */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111] border border-[#CC1244]/30 rounded-xl p-6 mb-8 flex flex-col gap-4">
          <h2 className="font-heading text-sm text-white tracking-widest">NUEVA FUNCIÓN</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">Película *</label>
              <select required value={form.pelicula_id} onChange={(e) => set("pelicula_id", e.target.value)} className={inputClass}>
                <option value="">Seleccionar...</option>
                {peliculas.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">Sala *</label>
              <select required value={form.sala_id} onChange={(e) => set("sala_id", e.target.value)} className={inputClass}>
                <option value="">Seleccionar...</option>
                {salas.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">Fecha *</label>
              <input required type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">Hora *</label>
              <input required type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-xs text-gray-500 tracking-widest">Formato *</label>
              <select required value={form.formato} onChange={(e) => set("formato", e.target.value)} className={inputClass}>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="font-heading text-xs text-gray-500 tracking-widest">Precio regular</label>
                <input type="number" value={form.precio_regular} onChange={(e) => set("precio_regular", Number(e.target.value))} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="font-heading text-xs text-gray-500 tracking-widest">Precio VIP</label>
                <input type="number" value={form.precio_vip} onChange={(e) => set("precio_vip", Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 font-body text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-5 py-2 rounded-lg transition-all">CANCELAR</button>
            <button type="submit" disabled={saving} className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 text-white font-heading text-xs tracking-widest px-6 py-2 rounded-lg transition-all">
              {saving ? "CREANDO..." : "CREAR FUNCIÓN"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#111] rounded-xl animate-pulse" />)}</div>
      ) : Object.keys(byDate).length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">NO HAY FUNCIONES PROGRAMADAS</div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(byDate).map(([fecha, fns]) => (
            <div key={fecha}>
              <p className="font-heading text-xs text-gray-500 tracking-widest uppercase mb-3">{fechaLabel(fecha)}</p>
              <div className="flex flex-col gap-2">
                {fns.map((f) => (
                  <div key={f.id} className={`bg-[#111] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap ${!f.activa ? "opacity-50" : ""}`}>
                    <span className="font-heading text-white font-bold w-20 shrink-0">{horaLabel(f.hora)}</span>
                    <span className="font-body text-gray-300 text-sm flex-1 truncate">{f.pelicula?.titulo ?? `ID ${f.pelicula_id}`}</span>
                    <span className="font-body text-gray-500 text-xs">{f.sala?.nombre}</span>
                    <span className="font-heading text-xs px-2 py-0.5 rounded-full border border-white/15 text-gray-400">{f.formato}</span>
                    <span className="font-body text-gray-500 text-xs">${f.precio_regular.toLocaleString("es-CO")}</span>
                    <button onClick={() => toggleActiva(f)}
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${f.activa ? "bg-[#CC1244]" : "bg-white/20"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${f.activa ? "left-4" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => deleteFuncion(f.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
