import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import type { Orden } from "@/lib/ordenes";

export const metadata = { title: "Pagos" };
export const dynamic = "force-dynamic";

const ESTADO_COLOR: Record<string, string> = {
  error:      "text-red-400 bg-red-400/10 border-red-400/30",
  procesando: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  pendiente:  "text-gray-400 bg-white/5 border-white/10",
  rechazado:  "text-gray-500 bg-white/5 border-white/10",
  pagado:     "text-green-400 bg-green-400/10 border-green-400/30",
};

function dateTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Órdenes de Wompi que necesitan atención: pagadas sin boleto (error) o atascadas (procesando)
export default async function PagosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ todos?: string }>;
}) {
  const user = await getUser();
  if (!user || !esAdmin(user.email)) redirect("/cuenta/login?redirect=/admin/pagos");

  const { todos } = await searchParams;
  let query = createAdminClient()
    .from("ordenes_pago")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!todos) query = query.in("estado", ["error", "procesando"]);
  const { data, error } = await query;
  const ordenes = (data ?? []) as (Orden & { created_at: string })[];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Wompi</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">PAGOS</h1>
        <p className="text-gray-500 font-body text-sm mt-1">
          {todos ? "Últimas 100 órdenes de pago." : "Pagos aprobados que no generaron boleto o que siguen procesándose. Revísalos en el panel de Wompi y contacta al cliente."}
        </p>
        <Link href={todos ? "/admin/pagos" : "/admin/pagos?todos=1"} className="text-[#CC1244] font-heading text-xs tracking-widest hover:underline mt-2 inline-block">
          {todos ? "VER SOLO CON PROBLEMAS" : "VER TODAS LAS ÓRDENES"}
        </Link>
      </div>

      {error ? (
        <p className="text-red-400 font-body text-sm">No se pudieron cargar las órdenes. ¿Ejecutaste supabase/migration_ordenes_pago.sql?</p>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">SIN PAGOS CON PROBLEMAS</div>
      ) : (
        <div className="flex flex-col gap-2">
          {ordenes.map((o) => (
            <div key={o.id} className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-white text-sm">{o.referencia}</span>
                  <span className="text-gray-500 font-body text-xs">{dateTimeLabel(o.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs font-body">
                  <span className="text-gray-400">{o.nombre}</span>
                  <span className="text-gray-600">{o.email}</span>
                  {o.telefono && <span className="text-gray-600">{o.telefono}</span>}
                </div>
                <div className="text-xs font-body text-gray-600">
                  Función #{o.funcion_id} · Asientos: {o.asientos.map((a) => `${a.fila}${a.columna}`).join(", ")}
                  {o.wompi_transaction_id && <> · Transacción Wompi: <span className="font-mono">{o.wompi_transaction_id}</span></>}
                </div>
                {o.error && <p className="text-red-400/80 font-body text-xs break-all">{o.error}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-heading text-xs px-2.5 py-1 rounded-full border ${ESTADO_COLOR[o.estado] ?? ESTADO_COLOR.pendiente}`}>
                  {o.estado}
                </span>
                <span className="font-heading text-white font-bold">${o.total.toLocaleString("es-CO")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
