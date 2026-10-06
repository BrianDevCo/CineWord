import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { esAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const metadata = { title: "PQR" };
export const dynamic = "force-dynamic";

interface PQR {
  id: number;
  radicado: string;
  tipo: string;
  nombre: string;
  email: string;
  mensaje: string;
  estado: string;
  created_at: string;
}

const TIPO: Record<string, string> = { peticion: "Petición", queja: "Queja", reclamo: "Reclamo" };

function diasHabilesDesde(iso: string): number {
  let dias = 0;
  const d = new Date(iso);
  const hoy = new Date();
  while (d < hoy) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && d <= hoy) dias++;
  }
  return dias;
}

// Las PQR se responden por correo; el plazo legal es de 15 días hábiles (Ley 1480 de 2011)
export default async function PQRAdminPage() {
  const user = await getUser();
  if (!user || !esAdmin(user.email)) redirect("/cuenta/login?redirect=/admin/pqr");

  const { data, error } = await createAdminClient()
    .from("pqr")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const pqrs = (data ?? []) as PQR[];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Atención al cliente</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">PQR</h1>
        <p className="text-gray-500 font-body text-sm mt-1">Responde cada solicitud al correo del cliente antes de 15 días hábiles.</p>
      </div>

      {error ? (
        <p className="text-red-400 font-body text-sm">No se pudieron cargar las PQR. ¿Ejecutaste supabase/migration_seguridad.sql?</p>
      ) : pqrs.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-heading tracking-widest text-sm">NO HAY PQR</div>
      ) : (
        <div className="flex flex-col gap-2">
          {pqrs.map((p) => {
            const dias = diasHabilesDesde(p.created_at);
            return (
              <div key={p.id} className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-white text-sm">{p.radicado}</span>
                  <span className="font-heading text-xs text-[#CC1244] tracking-widest">{TIPO[p.tipo] ?? p.tipo}</span>
                  <span className={`font-body text-xs ${dias >= 12 ? "text-red-400" : "text-gray-500"}`}>
                    {dias} día{dias === 1 ? "" : "s"} hábil{dias === 1 ? "" : "es"}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs font-body">
                  <span className="text-gray-400">{p.nombre}</span>
                  <a href={`mailto:${p.email}?subject=${encodeURIComponent(`Respuesta ${p.radicado}`)}`} className="text-gray-500 hover:text-white underline">{p.email}</a>
                </div>
                <p className="text-gray-300 font-body text-sm whitespace-pre-wrap break-words">{p.mensaje}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
