import { NextResponse } from "next/server";
import { createCipheriv, createDecipheriv } from "crypto";

const KEY = Buffer.from("tHIrd!sc0R3Is.00", "utf8");
const IV  = Buffer.from("tHIrd!sc0R3Is.00", "utf8");

function encrypt(text: string): string {
  const c = createCipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}

function decrypt(b64: string): string {
  const d = createDecipheriv("aes-128-cbc", KEY, IV);
  return Buffer.concat([d.update(Buffer.from(b64, "base64")), d.final()]).toString("utf8");
}

async function callRaw(url: string, body: string, ct: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": ct },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  let dec = "";
  try { const j = JSON.parse(text) as { request?: string }; if (j.request) dec = decrypt(j.request); } catch { /**/ }
  return { status: res.status, body: text.slice(0, 400), dec };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);
  const svc = `${base}/ThirdParty/api/SCOact/scosec`;

  // Construir los bodies y mostrarlos en debug antes de enviar
  const bodyA = JSON.stringify(enc);                                           // "ZFHu6..."
  const bodyB = new URLSearchParams({ details: enc }).toString();              // details=ZFHu6...
  const bodyC = `XXXXXXXXXXX`;                                                 // hardcoded para ver qué recibe Score
  const bodyD = enc;                                                           // base64 crudo

  return NextResponse.json({
    debug: {
      base, enc,
      bodyA_sent: bodyA,
      bodyA_char0: bodyA[0],
      bodyA_code0: bodyA.charCodeAt(0),
      bodyB_sent: bodyB.slice(0, 80),
    },
    // A: JSON string puro — qué recibe el servidor?
    A_jsonString: await callRaw(svc, bodyA, "application/json").catch(e => String(e)),
    // B: form URLencoded — confirmación de error anterior
    B_form: await callRaw(svc, bodyB, "application/x-www-form-urlencoded").catch(e => String(e)),
    // C: hardcoded "XXXXXXXXXXX" — para ver qué carácter reporta Score
    C_hardcoded: await callRaw(svc, bodyC, "application/json").catch(e => String(e)),
    // D: base64 crudo sin JSON ni form
    D_rawB64: await callRaw(svc, bodyD, "application/json").catch(e => String(e)),
  });
}
