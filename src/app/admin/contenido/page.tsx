"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IMAGENES_COMBOS, type Combo, type Tarifa } from "@/lib/contenido";

const inputClass = "bg-white/5 border border-white/10 focus:border-[#CC1244] text-white font-body text-sm px-3 py-2 rounded-lg outline-none transition-colors w-full";
const labelClass = "font-heading text-[10px] text-gray-500 tracking-widest";

function NumberInput({ value, onChange, opcional }: { value: number | undefined; onChange: (v: number | undefined) => void; opcional?: boolean }) {
  return (
    <input
      type="number"
      min={0}
      step={500}
      value={value ?? ""}
      placeholder={opcional ? "—" : "0"}
      onChange={(e) => onChange(e.target.value === "" ? (opcional ? undefined : 0) : Math.max(0, Math.round(Number(e.target.value))))}
      className={inputClass}
    />
  );
}

export default function ContenidoAdminPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"" | "tarifas" | "combos">("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/contenido")
      .then((r) => r.json())
      .then((d) => { setTarifas(d.tarifas ?? []); setCombos(d.combos ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function guardar(que: "tarifas" | "combos") {
    setSaving(que);
    setMsg(null);
    const res = await fetch("/api/admin/contenido", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(que === "tarifas" ? { tarifas } : { combos }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving("");
    setMsg(res.ok
      ? { tipo: "ok", texto: `${que === "tarifas" ? "Precios" : "Combos"} guardados. La página de inicio se actualiza en unos segundos.` }
      : { tipo: "error", texto: data.error ?? "No se pudo guardar" });
  }

  const setTarifa = (i: number, cambios: Partial<Tarifa>) =>
    setTarifas((prev) => prev.map((t, j) => (j === i ? { ...t, ...cambios } : t)));
  const setCombo = (i: number, cambios: Partial<Combo>) =>
    setCombos((prev) => prev.map((c, j) => (j === i ? { ...c, ...cambios } : c)));
  const moverCombo = (i: number, dir: -1 | 1) =>
    setCombos((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const n = [...prev];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  if (loading) {
    return <div className="p-8 flex flex-col gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#111] rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-8 flex flex-col gap-12 max-w-5xl">
      <div>
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Página de inicio</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">PRECIOS Y COMBOS</h1>
        <p className="text-gray-500 font-body text-sm mt-1">Lo que cambies aquí se muestra en las secciones de tarifas y confitería.</p>
      </div>

      {msg && (
        <p className={`font-body text-sm rounded-lg px-4 py-3 border ${msg.tipo === "ok" ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
          {msg.texto}
        </p>
      )}

      {/* ── TARIFAS ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-heading text-xl text-white tracking-wider">PRECIOS DE BOLETERÍA</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTarifas((p) => [...p, { dias: ["Lunes"], subtitulo: "", general: 0, premium: 0, tag: "", horario: "", destacada: false }])}
              disabled={tarifas.length >= 7}
              className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-30"
            >
              + GRUPO
            </button>
            <button
              onClick={() => guardar("tarifas")}
              disabled={saving !== ""}
              className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-xs tracking-widest px-5 py-2 rounded-lg transition-all"
            >
              {saving === "tarifas" ? "GUARDANDO..." : "GUARDAR PRECIOS"}
            </button>
          </div>
        </div>

        {tarifas.map((t, i) => (
          <div key={i} className="bg-[#111] border border-white/10 rounded-xl p-4 grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>DÍAS (separados por coma)</span>
              <input value={t.dias.join(", ")} onChange={(e) => setTarifa(i, { dias: e.target.value.split(",").map((d) => d.trim()).filter(Boolean) })} className={inputClass} />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>SUBTÍTULO</span>
              <input value={t.subtitulo} maxLength={40} onChange={(e) => setTarifa(i, { subtitulo: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>GENERAL</span>
              <NumberInput value={t.general} onChange={(v) => setTarifa(i, { general: v ?? 0 })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>PREMIUM</span>
              <NumberInput value={t.premium} onChange={(v) => setTarifa(i, { premium: v ?? 0 })} />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>ETIQUETA (opcional)</span>
              <input value={t.tag} maxLength={30} placeholder="MITAD DE PRECIO" onChange={(e) => setTarifa(i, { tag: e.target.value })} className={inputClass} />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>RESTRICCIÓN (opcional)</span>
              <input value={t.horario} maxLength={80} placeholder="Ej: Todo el día" onChange={(e) => setTarifa(i, { horario: e.target.value })} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-gray-400 font-body text-xs py-2">
              <input type="checkbox" checked={t.destacada} onChange={(e) => setTarifa(i, { destacada: e.target.checked })} className="accent-[#CC1244]" />
              Destacar
            </label>
            <button
              onClick={() => setTarifas((p) => p.filter((_, j) => j !== i))}
              disabled={tarifas.length <= 1}
              className="text-gray-600 hover:text-red-400 font-heading text-xs tracking-widest py-2 disabled:opacity-30"
            >
              ELIMINAR
            </button>
          </div>
        ))}
      </section>

      {/* ── COMBOS ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-heading text-xl text-white tracking-wider">COMBOS DE CONFITERÍA</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCombos((p) => [...p, { id: `combo-${Date.now()}`, nombre: "Nuevo combo", tag: "", desc: "", imagen: IMAGENES_COMBOS[0], precios: { salado: 0 }, activo: false }])}
              disabled={combos.length >= 30}
              className="border border-white/15 text-gray-400 hover:text-white font-heading text-xs tracking-widest px-4 py-2 rounded-lg transition-all disabled:opacity-30"
            >
              + COMBO
            </button>
            <button
              onClick={() => guardar("combos")}
              disabled={saving !== ""}
              className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-xs tracking-widest px-5 py-2 rounded-lg transition-all"
            >
              {saving === "combos" ? "GUARDANDO..." : "GUARDAR COMBOS"}
            </button>
          </div>
        </div>
        <p className="text-gray-600 font-body text-xs">Si un combo tiene un solo precio, deja vacíos Mixto y Dulce.</p>

        {combos.map((c, i) => (
          <div key={c.id} className={`bg-[#111] border rounded-xl p-4 flex gap-4 ${c.activo ? "border-white/10" : "border-white/5 opacity-60"}`}>
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-black">
              <Image src={c.imagen} alt={c.nombre} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <label className="col-span-2 flex flex-col gap-1">
                <span className={labelClass}>NOMBRE</span>
                <input value={c.nombre} maxLength={60} onChange={(e) => setCombo(i, { nombre: e.target.value })} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>ETIQUETA</span>
                <input value={c.tag} maxLength={20} placeholder="POPULAR" onChange={(e) => setCombo(i, { tag: e.target.value })} className={inputClass} />
              </label>
              <label className="col-span-2 lg:col-span-3 flex flex-col gap-1">
                <span className={labelClass}>IMAGEN</span>
                <select value={c.imagen} onChange={(e) => setCombo(i, { imagen: e.target.value })} className={inputClass}>
                  {IMAGENES_COMBOS.map((img) => <option key={img} value={img} className="bg-[#111]">{img.replace("/combos/", "")}</option>)}
                </select>
              </label>
              <label className="col-span-2 lg:col-span-3 flex flex-col gap-1">
                <span className={labelClass}>DESCRIPCIÓN</span>
                <input value={c.desc} maxLength={200} onChange={(e) => setCombo(i, { desc: e.target.value })} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>SALADO</span>
                <NumberInput value={c.precios.salado} onChange={(v) => setCombo(i, { precios: { ...c.precios, salado: v ?? 0 } })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>MIXTO</span>
                <NumberInput opcional value={c.precios.mixto} onChange={(v) => setCombo(i, { precios: { ...c.precios, mixto: v } })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>DULCE</span>
                <NumberInput opcional value={c.precios.dulce} onChange={(v) => setCombo(i, { precios: { ...c.precios, dulce: v } })} />
              </label>
              <div className="col-span-2 lg:col-span-6 flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-gray-400 font-body text-xs">
                  <input type="checkbox" checked={c.activo} onChange={(e) => setCombo(i, { activo: e.target.checked })} className="accent-[#CC1244]" />
                  Visible en la página
                </label>
                <div className="ml-auto flex gap-3 font-heading text-xs tracking-widest">
                  <button onClick={() => moverCombo(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-20" aria-label="Subir">↑</button>
                  <button onClick={() => moverCombo(i, 1)} disabled={i === combos.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20" aria-label="Bajar">↓</button>
                  <button onClick={() => setCombos((p) => p.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400">ELIMINAR</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
