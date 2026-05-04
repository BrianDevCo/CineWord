import Link from "next/link";
import PeliculaForm from "../PeliculaForm";

export const metadata = { title: "Nueva Película" };

export default function NuevaPeliculaPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/peliculas" className="text-gray-600 hover:text-white font-heading text-xs tracking-widest flex items-center gap-1 mb-4 transition-colors">
          ← Películas
        </Link>
        <p className="text-[#CC1244] font-heading text-xs tracking-widest uppercase mb-1">Gestión</p>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wider">NUEVA PELÍCULA</h1>
      </div>
      <PeliculaForm />
    </div>
  );
}
