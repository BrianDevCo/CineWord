import { createAdminClient } from "@/lib/supabase-admin";
import { crearReserva, getFuncionById } from "@/lib/db";
import { enviarEmailBoleto, type ScoreQRParams } from "@/lib/email";
import { scoreVenta, scoreGetSecuencia, toScoreHora, toScoreInicio, splitNombre, type AsientoScore } from "@/lib/score";
import type { WompiTransaction } from "@/lib/wompi";

const puntoVentaScore = process.env.SCORE_PUNTO_VENTA ?? "77";

export interface AsientoOrden { fila: string; columna: number; tipo: "regular" | "vip"; columnaLabel?: number }

export interface ScoreOrden {
  fecha?: string;
  sala?: string;
  hora?: string;
  pelicula?: string;
  secuencia?: string;
  ubicaciones?: AsientoScore[];
  descripcion?: string;
}

export interface Orden {
  id: number;
  referencia: string;
  funcion_id: number;
  email: string;
  nombre: string;
  telefono: string | null;
  asientos: AsientoOrden[];
  total: number;
  score: ScoreOrden | null;
  estado: "pendiente" | "procesando" | "pagado" | "rechazado" | "error";
  wompi_transaction_id: string | null;
  wompi_status: string | null;
  reserva_id: number | null;
  error: string | null;
  expires_at: string;
}

export type NuevaOrden = Pick<Orden, "referencia" | "funcion_id" | "email" | "nombre" | "telefono" | "asientos" | "total" | "score" | "expires_at">;

export async function crearOrden(orden: NuevaOrden): Promise<Orden> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("ordenes_pago").insert(orden).select().single();
  if (error || !data) throw error ?? new Error("No se pudo crear la orden");
  return data as Orden;
}

export async function getOrden(referencia: string): Promise<Orden | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("ordenes_pago").select("*").eq("referencia", referencia).maybeSingle();
  return (data as Orden | null) ?? null;
}

async function actualizarOrden(id: number, campos: Partial<Orden>) {
  const admin = createAdminClient();
  await admin.from("ordenes_pago").update({ ...campos, updated_at: new Date().toISOString() }).eq("id", id);
}

/**
 * Aplica el resultado de una transacción Wompi a su orden.
 * Idempotente: el webhook y la página de resultado pueden llamarla varias veces,
 * pero la venta en Score, la reserva y el email se ejecutan una sola vez.
 */
export async function procesarTransaccion(tx: WompiTransaction): Promise<Orden | null> {
  const orden = await getOrden(tx.reference);
  if (!orden) {
    console.error(`Wompi: transacción ${tx.id} con referencia desconocida ${tx.reference}`);
    return null;
  }

  if (tx.status === "PENDING") return orden;

  if (tx.status !== "APPROVED") {
    if (orden.estado === "pendiente") {
      await actualizarOrden(orden.id, { estado: "rechazado", wompi_transaction_id: tx.id, wompi_status: tx.status });
      return { ...orden, estado: "rechazado", wompi_status: tx.status };
    }
    return orden;
  }

  if (tx.currency !== "COP" || tx.amount_in_cents !== orden.total * 100) {
    const msg = `Monto no coincide: pagó ${tx.amount_in_cents} ${tx.currency}, esperado ${orden.total * 100} COP`;
    console.error(`Wompi ${tx.reference}: ${msg}`);
    await actualizarOrden(orden.id, { estado: "error", error: msg, wompi_transaction_id: tx.id, wompi_status: tx.status });
    return { ...orden, estado: "error", error: msg };
  }

  // Reclamar la orden de forma atómica: solo un proceso pasa de pendiente → procesando
  const admin = createAdminClient();
  const { data: reclamada } = await admin
    .from("ordenes_pago")
    .update({ estado: "procesando", wompi_transaction_id: tx.id, wompi_status: tx.status, updated_at: new Date().toISOString() })
    .eq("id", orden.id)
    .in("estado", ["pendiente", "rechazado"])
    .select()
    .maybeSingle();

  if (!reclamada) return getOrden(tx.reference); // ya procesada (o procesándose) por otra llamada

  try {
    const reservaId = await completarCompra(reclamada as Orden, tx.id);
    await actualizarOrden(orden.id, { estado: "pagado", reserva_id: reservaId, error: null });
    return { ...(reclamada as Orden), estado: "pagado", reserva_id: reservaId };
  } catch (err) {
    const msg = String(err);
    console.error(`Wompi ${tx.reference}: pago aprobado pero falló la reserva —`, err);
    await actualizarOrden(orden.id, { estado: "error", error: msg });
    return { ...(reclamada as Orden), estado: "error", error: msg };
  }
}

/** Registra la venta en Score, crea la reserva y envía el boleto. Devuelve el id de la reserva. */
async function completarCompra(orden: Orden, transactionId: string): Promise<number> {
  const score = orden.score ?? {};

  // Registrar venta en Score (no bloqueante — si falla no cancela la reserva)
  if (process.env.SCORE_BASE_URL && score.sala && score.pelicula && score.ubicaciones?.length && score.fecha && score.hora) {
    try {
      const secuencia = score.secuencia ?? (await scoreGetSecuencia()).secuencia;
      const { nombre: pNombre, apellido: pApellido } = splitNombre(orden.nombre);
      const scoreResult = await scoreVenta({
        puntoVenta:    String(puntoVentaScore),
        factura:       secuencia,
        correoCliente: orden.email,
        nombre:        pNombre,
        apellido:      pApellido,
        telefono:      orden.telefono ?? "",
        sala:          String(score.sala),
        fechaFun:      score.fecha,
        funcion:       toScoreHora(score.hora),
        inicioFun:     toScoreInicio(score.hora),
        pelicula:      String(score.pelicula),
        ubicaciones:   score.ubicaciones,
        totalVenta:    orden.total,
      });
      score.secuencia = secuencia;
      console.log("Score SCOINT V respuesta:", scoreResult.raw);
    } catch (scoreErr) {
      console.error("Score venta fallida (reserva guardada igualmente):", scoreErr);
    }
  }

  const reserva = await crearReserva({
    funcion_id: orden.funcion_id,
    email: orden.email,
    nombre: orden.nombre,
    telefono: orden.telefono ?? "",
    asientos: orden.asientos.map(({ fila, columna, tipo }) => ({ fila, columna, tipo })),
    total: orden.total,
    referencia_pago: transactionId,
  });

  // Enviar email con QR (no bloqueante — si falla no cancela la reserva)
  try {
    const funcion = await getFuncionById(orden.funcion_id);
    if (funcion) {
      const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const [, mes, dia] = funcion.fecha.split("-");
      const fechaLabel = `${parseInt(dia)} ${MESES[parseInt(mes) - 1]}`;

      const [h] = funcion.hora.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const horaLabel = `${h12}:${funcion.hora.split(":")[1]} ${ampm}`;

      const scoreQR: ScoreQRParams | undefined =
        score.secuencia && score.sala && score.fecha && score.hora
          ? {
              puntoVenta: process.env.SCORE_PUNTO_VENTA ?? "77",
              teatro:     process.env.SCORE_TEATRO      ?? "2",
              secuencia:  String(score.secuencia),
              fecha:      score.fecha,
              sala:       String(score.sala),
              hora:       score.hora,
              asientos:   orden.asientos.map(a => ({
                fila:            a.fila,
                columnaRelativa: a.columnaLabel ?? a.columna,
              })),
            }
          : undefined;

      await enviarEmailBoleto({
        to:       orden.email,
        nombre:   orden.nombre,
        pelicula: funcion.pelicula?.titulo ?? "Película",
        fecha:    fechaLabel,
        hora:     horaLabel,
        formato:  funcion.formato,
        asientos: orden.asientos.map(a => `${a.fila}${a.columna}`),
        total:    orden.total,
        qr_token: reserva.qr_token ?? "demo",
        scoreQR,
      });
    }
  } catch (emailErr) {
    console.error("Error enviando email (reserva guardada igualmente):", emailErr);
  }

  return reserva.id;
}
