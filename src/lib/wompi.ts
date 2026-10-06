import crypto from "crypto";

// Llaves: https://comercios.wompi.co → Desarrolladores
// El ambiente (sandbox / producción) se deduce del prefijo de la llave privada.
const publicKey      = () => process.env.WOMPI_PUBLIC_KEY ?? "";
const privateKey     = () => process.env.WOMPI_PRIVATE_KEY ?? "";
const eventsSecret   = () => process.env.WOMPI_EVENTS_SECRET ?? "";
const integritySecret = () => process.env.WOMPI_INTEGRITY_SECRET ?? "";

export function wompiReady() {
  return Boolean(publicKey() && privateKey() && eventsSecret() && integritySecret());
}

export function wompiPublicKey() {
  return publicKey();
}

function apiUrl() {
  return privateKey().startsWith("prv_prod_")
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

export type WompiStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export interface WompiTransaction {
  id: string;
  reference: string;
  status: WompiStatus;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
  status_message?: string | null;
}

/** sha256(referencia + montoEnCentavos + moneda + [expiracion] + secretoIntegridad) */
export function firmaIntegridad(referencia: string, amountInCents: number, expirationTime?: string) {
  const cadena = `${referencia}${amountInCents}COP${expirationTime ?? ""}${integritySecret()}`;
  return crypto.createHash("sha256").update(cadena).digest("hex");
}

export function nuevaReferencia() {
  return `CW-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

/** GET /transactions/{id} — fuente de verdad del estado de un pago */
export async function getTransaccion(id: string): Promise<WompiTransaction | null> {
  if (!/^[\w-]+$/.test(id)) return null;
  const res = await fetch(`${apiUrl()}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${privateKey()}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json() as { data?: WompiTransaction };
  return json.data ?? null;
}

export interface WompiEvento {
  event: string;
  data: { transaction?: WompiTransaction } & Record<string, unknown>;
  environment: string;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
  sent_at: string;
}

/**
 * Verifica el checksum de un evento:
 * sha256(valores de signature.properties en orden + timestamp + secretoEventos)
 */
export function verificarEvento(evento: WompiEvento): boolean {
  const secret = eventsSecret();
  if (!secret || !evento?.signature?.properties || !evento.signature.checksum) return false;

  const valores = evento.signature.properties.map((path) => {
    const valor = path.split(".").reduce<unknown>(
      (obj, key) => (obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined),
      evento.data,
    );
    return valor === undefined || valor === null ? "" : String(valor);
  });

  const hash = crypto
    .createHash("sha256")
    .update(`${valores.join("")}${evento.timestamp}${secret}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(evento.signature.checksum.toLowerCase(), "hex"));
  } catch {
    return false;
  }
}
