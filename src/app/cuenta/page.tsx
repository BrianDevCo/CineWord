import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/supabase-server";
import { getReservasByEmail } from "@/lib/db";
import LogoutButton from "./LogoutButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi Cuenta" };

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fechaDisplay(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`;
}

function horaDisplay(horaStr: string) {
  const [h, m] = horaStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function fmt(n: number) { return `$${n.toLocaleString("es-CO")}`; }

export default async function CuentaPage() {
  const user = await getUser();
  if (!user) redirect("/cuenta/login");

  const nombre =
    user.user_metadata?.nombre_completo ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario";

  const inicial = nombre.charAt(0).toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reservas: any[] = user.email ? await getReservasByEmail(user.email) : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#0a0a0a] to-black pointer-events-none" />

      <div className="relative max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CC1244] flex items-center justify-center text-white font-heading text-2xl font-bold shrink-0">
            {inicial}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-wider">
              {nombre.toUpperCase()}
            </h1>
            <p className="text-gray-500 font-body text-sm">{user.email}</p>
          </div>
        </div>

        {/* Acción rápida */}
        <Link
          href="/#cartelera"
          className="group bg-[#CC1244] hover:bg-[#a00e35] rounded-xl p-5 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-white text-sm tracking-wider">COMPRAR BOLETOS</p>
              <p className="text-white/60 font-body text-xs">Ver películas disponibles hoy</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Mis reservas */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-bold text-white tracking-wider flex items-center gap-2">
            MIS RESERVAS
            {reservas.length > 0 && (
              <span className="bg-[#CC1244] text-white font-heading text-xs px-2 py-0.5 rounded-sm">
                {reservas.length}
              </span>
            )}
          </h2>

          {reservas.length === 0 ? (
            <div className="bg-[#111] border border-white/10 rounded-xl p-10 text-center flex flex-col items-center gap-4">
              <span className="text-4xl">🎬</span>
              <div>
                <p className="font-heading text-white text-sm tracking-wider mb-1">AÚN NO TIENES RESERVAS</p>
                <p className="text-gray-600 font-body text-sm">Compra tu primer boleto y aparecerá aquí.</p>
              </div>
              <Link
                href="/#cartelera"
                className="bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-xs tracking-widest px-6 py-2.5 rounded-sm transition-all"
              >
                VER CARTELERA
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reservas.map((r) => {
                const funcion = r.funcion;
                const pelicula = funcion?.pelicula;
                const asientos: Array<{ fila: string; columna: number }> = r.asientos ?? [];

                return (
                  <div key={r.id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                    <div className="flex gap-4 p-4">
                      {/* Poster */}
                      {pelicula?.poster_url && (
                        <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <Image src={pelicula.poster_url} alt={pelicula.titulo} fill className="object-cover" sizes="56px" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-heading text-white text-sm font-bold leading-tight line-clamp-2">
                            {pelicula?.titulo ?? "Película"}
                          </p>
                          <span className={`shrink-0 font-heading text-[10px] tracking-widest px-2 py-0.5 rounded-sm ${
                            r.estado === "pagado"
                              ? "bg-green-500/15 text-green-400 border border-green-500/30"
                              : r.estado === "cancelado"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}>
                            {r.estado?.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs font-body text-gray-500">
                          {funcion?.fecha && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {fechaDisplay(funcion.fecha)} · {horaDisplay(funcion.hora)}
                            </span>
                          )}
                          {funcion?.formato && (
                            <span className={`px-1.5 py-0.5 rounded-sm border font-heading tracking-wider ${
                              funcion.formato === "VIP"
                                ? "border-yellow-500/40 text-yellow-400"
                                : "border-white/20 text-white/50"
                            }`}>
                              {funcion.formato}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs font-body">
                            {asientos.map((a) => `${a.fila}${a.columna}`).join(", ")}
                          </span>
                          <span className="text-[#CC1244] font-heading text-sm font-bold">
                            {fmt(r.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info cuenta */}
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <p className="font-heading text-xs text-gray-500 tracking-widest">INFORMACIÓN DE CUENTA</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Nombre", value: nombre },
              { label: "Correo", value: user.email ?? "" },
              { label: "Miembro desde", value: new Date(user.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm font-body">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-white text-right max-w-[60%]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer de cuenta */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-gray-600 hover:text-white font-heading text-xs tracking-widest transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            VOLVER AL INICIO
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
