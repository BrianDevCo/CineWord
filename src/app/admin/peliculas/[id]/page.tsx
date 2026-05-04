import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient, adminReady } from "@/lib/supabase-admin";
import PeliculaForm from "../PeliculaForm";
import type { Pelicula } from "@/lib/types";

export const metadata = { title: "Editar Película" };

export default async function EditarPeliculaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!adminReady()) {
    return (
      <div className="p-8">
        <p className="text-amber-400 font-body text-sm">Supabase no configurado.</p>
      </div>
    );
  }

  const db = createAdminClient();
  const { data } = await db.from("peliculas").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/peliculas" className="text-gray-600 hover:text-white font-heading text-xs tracking-widest flex items-center gap-1 mb-4 transition-colors">
          ← Películas
        </Link>
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">EDITAR PELÍCULA</h1>
        <p className="text-gray-500 font-body text-sm mt-1">{data.titulo}</p>
      </div>
      <PeliculaForm pelicula={data as Pelicula} />
    </div>
  );
}
