import { NextRequest, NextResponse } from "next/server";
import { scoreRegistrarCliente, splitNombre } from "@/lib/score";

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// POST /api/score/cliente
// Body: { email, nombreCompleto, clave, accion?, celular?, documento?, fechaNacimiento?, sexo? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nombreCompleto, clave, accion = "C", celular, documento, fechaNacimiento, sexo } = body;

    if (!email || !isValidEmail(String(email))) {
      return NextResponse.json({ error: "email inválido" }, { status: 400 });
    }
    if (!nombreCompleto || typeof nombreCompleto !== "string") {
      return NextResponse.json({ error: "nombreCompleto requerido" }, { status: 400 });
    }
    if (!clave || typeof clave !== "string" || clave.length < 4) {
      return NextResponse.json({ error: "clave inválida" }, { status: 400 });
    }

    const { nombre, apellido } = splitNombre(nombreCompleto);

    const result = await scoreRegistrarCliente({
      email,
      nombre,
      apellido,
      clave,
      accion: accion === "U" ? "U" : "C",
      celular,
      documento,
      fechaNacimiento,
      sexo,
    });

    const exitoso = result.raw.toLowerCase().includes("realizado con");
    return NextResponse.json({ ok: exitoso, raw: result.raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error Score";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
