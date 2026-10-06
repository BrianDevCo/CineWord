import crypto from "crypto";
import type { User } from "@supabase/supabase-js";
import { scoreRegistrarCliente, splitNombre } from "@/lib/score";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Registra al usuario como cliente en Score una sola vez (SCOCYA, acción C).
 * Se ejecuta en el servidor con el correo verificado de la sesión: nadie puede
 * crear ni modificar clientes de otros correos, y la contraseña del sitio
 * nunca se envía a Score (se usa una clave aleatoria).
 */
export async function asegurarClienteScore(user: User): Promise<void> {
  if (!process.env.SCORE_BASE_URL || !user.email) return;
  if (user.app_metadata?.score_cliente) return;

  const nombreCompleto =
    user.user_metadata?.nombre_completo || user.user_metadata?.full_name || user.email.split("@")[0];
  const { nombre, apellido } = splitNombre(String(nombreCompleto));

  try {
    const result = await scoreRegistrarCliente({
      email: user.email,
      nombre,
      apellido,
      clave: crypto.randomBytes(12).toString("base64url"),
      accion: "C",
    });

    const raw = result.raw.toLowerCase();
    // "realizado con éxito" o el cliente ya existía en Score
    if (raw.includes("realizado con") || raw.includes("existe")) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, score_cliente: true },
      });
    } else {
      console.error("Score SCOCYA:", result.raw);
    }
  } catch (err) {
    console.error("Score registro de cliente falló:", err);
  }
}
