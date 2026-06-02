"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  enCartelera: number;
  proximas: number;
  reservasHoy: number;
  ingresoHoy: number;
  reservasMes: number;
  ingresoMes: number;
  funcionesProximas: number;
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

function StatCard({ label, value, sub, href, color = "white" }: {
  label: string; value: string | number; sub?: string; href?: string; color?: string;
}) {
  const content = (
    <div className={`bg-[#111] border border-white/10 rounded-xl p-5 flex flex-col gap-2 transition-all ${href ? "hover:border-white/30 cursor-pointer" : ""}`}>
      <p className="font-heading text-xs text-gray-500 tracking-widest uppercase">{label}</p>
      <p className={`font-heading text-3xl font-bold ${color === "red" ? "text-[#CC1244]" : color === "green" ? "text-green-400" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="font-body text-xs text-gray-600">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  const syncCartelera = async () => {
    setSyncing(true);
    setSyncLog([]);
    try {
      const res = await fetch("/api/score/sync-cartelera?dry_run=false");
      const d = await res.json() as { pelUpdated?: number; funcUpdated?: number; log?: string[]; error?: string };
      if (d.error) setSyncLog([`❌ ${d.error}`]);
      else setSyncLog([
        `✅ ${d.pelUpdated ?? 0} películas · ${d.funcUpdated ?? 0} funciones sincronizadas`,
        ...(d.log ?? []),
      ]);
    } catch (e) {
      setSyncLog([`❌ Error: ${String(e)}`]);
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Panel de Control</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">DASHBOARD</h1>
        <p className="text-gray-600 font-body text-sm mt-1">
          {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-[#111] border border-white/10 rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Películas en cartelera" value={stats.enCartelera} href="/admin/peliculas" />
            <StatCard label="Próximos estrenos" value={stats.proximas} href="/admin/peliculas" />
            <StatCard label="Funciones próximas 7d" value={stats.funcionesProximas} href="/admin/funciones" />
            <StatCard label="Reservas hoy" value={stats.reservasHoy} href="/admin/reservas" color="green" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ingresos hoy"
              value={fmt(stats.ingresoHoy)}
              sub={`${stats.reservasHoy} reservas pagadas`}
              color="red"
            />
            <StatCard
              label="Ingresos del mes"
              value={fmt(stats.ingresoMes)}
              sub={`${stats.reservasMes} reservas pagadas`}
              color="red"
            />
          </div>
        </>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-amber-400 font-body text-sm">
          No se pudieron cargar las estadísticas. Verifica que Supabase esté configurado.
        </div>
      )}

      {/* Sync Score */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-sm text-gray-500 tracking-widest uppercase">Sincronización Score</h2>
          <button
            onClick={syncCartelera}
            disabled={syncing}
            className="flex items-center gap-2 bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 text-white font-heading text-xs tracking-widest px-5 py-2.5 rounded-lg transition-all"
          >
            {syncing
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span>🔄</span>}
            {syncing ? "SINCRONIZANDO..." : "SYNC CARTELERA"}
          </button>
        </div>

        {syncLog.length > 0 && (
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto flex flex-col gap-1">
            {syncLog.map((line, i) => (
              <p key={i} className="font-body text-xs text-gray-400">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="mt-4">
        <h2 className="font-heading text-sm text-gray-500 tracking-widest uppercase mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/peliculas/nueva", label: "Nueva película", icon: "🎬" },
            { href: "/admin/funciones", label: "Agregar función", icon: "🗓️" },
            { href: "/admin/reservas", label: "Ver reservas", icon: "🎟️" },
            { href: "/admin/salas", label: "Gestionar salas", icon: "🏛️" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-[#111] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/30 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="font-heading text-xs text-white tracking-wider">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
