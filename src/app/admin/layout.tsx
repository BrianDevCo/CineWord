import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import AdminSidebar from "./AdminSidebar";

export const metadata = { title: { default: "Admin", template: "%s | Admin CINEWORLD" } };

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseReady()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center flex flex-col gap-4 max-w-md">
          <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl">⚙️</div>
          <h1 className="font-heading text-2xl text-white tracking-wider">SUPABASE NO CONFIGURADO</h1>
          <p className="text-gray-500 font-body text-sm">
            Configura las variables de entorno de Supabase en <code className="text-amber-400">.env.local</code> para acceder al panel de administración.
          </p>
        </div>
      </div>
    );
  }

  const user = await getUser();
  const adminEmails = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",").map(e => e.trim()).filter(Boolean);

  if (!user || !user.email || adminEmails.length === 0 || !adminEmails.includes(user.email)) {
    redirect(`/cuenta/login?redirect=/admin`);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <AdminSidebar />
      <div className="ml-60">
        {children}
      </div>
    </div>
  );
}
