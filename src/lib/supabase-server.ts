import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // En Server Components no se puede setear cookies, es seguro ignorarlo
          }
        },
      },
    }
  );
}

export async function getSession() {
  if (!supabaseReady()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  if (!supabaseReady()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("TU_PROYECTO");
}
