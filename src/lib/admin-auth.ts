import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
}

export async function requireAdmin(): Promise<
  { email: string; error: null } | { email: null; error: NextResponse }
> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { email: null, error: NextResponse.json({ error: "ADMIN_EMAIL no configurado" }, { status: 503 }) };
  }
  if (!supabaseReady()) {
    return { email: null, error: NextResponse.json({ error: "Supabase no configurado" }, { status: 503 }) };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== adminEmail) {
    return { email: null, error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  return { email: user.email, error: null };
}
