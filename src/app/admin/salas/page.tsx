"use client";

import { useEffect, useState } from "react";
import type { Sala } from "@/lib/types";

export default function SalasAdminPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sala | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/salas")
      .then((r) => r.json())
      .then((d) => { setSalas(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/salas/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); setSaving(false); return; }
    setEditing(null);
    load();
    setSaving(false);
  };

  const inputClass = "bg-[#0d0d0d] border border-white/10 text-white font-body text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#CC1244] w-full";

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">SALAS</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-[#111] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map((sala) => (
            <div key={sala.id} className={`bg-[#111] border border-white/10 rounded-xl p-5 flex flex-col gap-4 ${!sala.activa ? "opacity-50" : ""}`}>
              {editing?.id === sala.id ? (
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-heading text-xs text-gray-500 tracking-widest">Nombre</label>
                    <input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-heading text-xs text-gray-500 tracking-widest">Tipo</label>
                    <select value={editing.tipo} onChange={(e) => setEditing({ ...editing, tipo: e.target.value as Sala["tipo"] })} className={inputClass}>
                      <option value="2D">2D</option>
                      <option value="3D">3D</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs text-gray-500 tracking-widest">Filas</label>
                      <input type="number" min={1} max={26} value={editing.filas} onChange={(e) => setEditing({ ...editing, filas: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs text-gray-500 tracking-widest">Columnas</label>
                      <input type="number" min={1} max={30} value={editing.columnas} onChange={(e) => setEditing({ ...editing, columnas: Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-heading text-xs text-gray-500 tracking-widest">Filas VIP (separadas por coma)</label>
                    <input value={editing.filas_vip.join(", ")} onChange={(e) => setEditing({ ...editing, filas_vip: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) })} className={inputClass} placeholder="G, H" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-heading text-xs text-gray-500 tracking-widest">Score Sala ID</label>
                    <input value={editing.score_sala_id ?? ""} onChange={(e) => setEditing({ ...editing, score_sala_id: e.target.value || null })} className={inputClass} placeholder="Ej: 2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEditing({ ...editing, activa: !editing.activa })}
                      className={`w-9 h-5 rounded-full transition-colors relative ${editing.activa ? "bg-[#CC1244]" : "bg-white/20"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editing.activa ? "left-4" : "left-0.5"}`} />
                    </button>
                    <span className="text-gray-400 font-body text-xs">{editing.activa ? "Activa" : "Inactiva"}</span>
                  </div>
                  {error && <p className="text-red-400 font-body text-xs">{error}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(null)} className="flex-1 border border-white/15 text-gray-400 font-heading text-xs tracking-widest py-2 rounded-lg transition-all hover:text-white">CANCELAR</button>
                    <button type="submit" disabled={saving} className="flex-1 bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 text-white font-heading text-xs tracking-widest py-2 rounded-lg transition-all">
                      {saving ? "..." : "GUARDAR"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading text-white font-bold">{sala.nombre}</p>
                      <span className="font-heading text-xs text-[#CC1244] tracking-widest">{sala.tipo}</span>
                    </div>
                    <button onClick={() => { setEditing(sala); setError(""); }}
                      className="border border-white/15 hover:border-white/40 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-3 py-1 rounded-lg transition-all">
                      EDITAR
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm font-body">
                    <div>
                      <p className="text-gray-600 text-xs">Filas × Columnas</p>
                      <p className="text-white">{sala.filas} × {sala.columnas}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Capacidad</p>
                      <p className="text-white">{sala.filas * sala.columnas} asientos</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Filas VIP</p>
                      <p className="text-white">{sala.filas_vip.length > 0 ? sala.filas_vip.join(", ") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Estado</p>
                      <p className={sala.activa ? "text-green-400" : "text-gray-500"}>{sala.activa ? "Activa" : "Inactiva"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
