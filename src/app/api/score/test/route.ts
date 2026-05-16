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

async function post(url: string, body: string, ct: string) {
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
  return { status: res.status, body: text.slice(0, 500), dec };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);
  const svc = `${base}/ThirdParty/api/SCOact/scosec`;

  // Hipótesis: Cloudflare decodifica %2B→+ y %3D→= antes de reenviar al servidor.
  // Fix: doble-encodear para que después de un nivel de decode quede %2B y %3D.
  const doubleEncodedBody = `details=${enc.replace(/\+/g, "%252B").replace(/=/g, "%253D")}`;

  // También probar: doble encode solo del +, dejando = como %3D normal
  const halfDoubleBody = `details=${enc.replace(/\+/g, "%252B").replace(/=/g, "%3D")}`;

  // Y probar: + como %2B normal pero = literal (sin encodear)
  const noEqualEncode = `details=${enc.replace(/\+/g, "%2B")}`;

  // Teoría alternativa: mandar solo el base64 sin form, pero como form-data boundary
  const rawPlusBody = `details=${enc}`;  // + literal y = literal, sin ningún encode

  return NextResponse.json({
    debug: { base, plaintext, enc, doubleEncodedBody, halfDoubleBody },
    // Doble-encode completo: + → %252B, = → %253D
    A_doubleEncode: await post(svc, doubleEncodedBody, "application/x-www-form-urlencoded").catch(e => String(e)),
    // Doble-encode solo del +, = como %3D
    B_halfDouble: await post(svc, halfDoubleBody, "application/x-www-form-urlencoded").catch(e => String(e)),
    // + como %2B pero = sin encodear (literal)
    C_noEqualEncode: await post(svc, noEqualEncode, "application/x-www-form-urlencoded").catch(e => String(e)),
    // Todo literal sin encodear
    D_rawPlus: await post(svc, rawPlusBody, "application/x-www-form-urlencoded").catch(e => String(e)),
  });
}
