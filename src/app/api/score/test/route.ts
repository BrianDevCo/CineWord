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

async function req(url: string, method: string, body?: string, ct?: string) {
  const opts: RequestInit = { method, signal: AbortSignal.timeout(10000) };
  if (body !== undefined) {
    opts.body = body;
    opts.headers = { "Content-Type": ct ?? "application/x-www-form-urlencoded" };
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let dec = "";
  try { const j = JSON.parse(text) as { request?: string }; if (j.request) dec = decrypt(j.request); } catch { /**/ }
  return { status: res.status, body: text.slice(0, 200), dec: dec.slice(0, 200) };
}

export async function GET() {
  const base = process.env.SCORE_BASE_URL ?? "NO CONFIGURADO";
  const tercero = process.env.SCORE_TERCERO ?? "1";
  const teatro  = process.env.SCORE_TEATRO  ?? "2";
  const pv      = process.env.SCORE_PUNTO_VENTA ?? "77";
  const plaintext = `Punto:${pv},teatro:${teatro},tercero:${tercero}`;
  const enc = encrypt(plaintext);

  // Verificar round-trip local
  let roundTrip = "";
  try { roundTrip = decrypt(enc); } catch (e) { roundTrip = `ERROR: ${e}`; }

  const debug = { base, plaintext, enc, roundTrip, ok: roundTrip === plaintext };

  const svc = `${base}/ThirdParty/api/SCOact/scosec`;
  const qs  = `?details=${encodeURIComponent(enc)}`;

  return NextResponse.json({
    debug,
    // GET con query string
    t1_GET_qs:      await req(`${svc}${qs}`, "GET").catch(e => e.message),
    // POST con query string (body vacío)
    t2_POST_qs:     await req(`${svc}${qs}`, "POST", "").catch(e => e.message),
    // POST form + + literal sin encodear (el server puede estar esperando + crudo)
    t3_POST_rawPlus: await req(svc, "POST", `details=${enc.replace(/\+/g, "%2B").replace(/=/g, "%3D")}`).catch(e => e.message),
    // POST form + solo el base64 como body (sin "details=")
    t4_POST_justB64: await req(svc, "POST", enc).catch(e => e.message),
    // POST JSON con campo "request" en vez de "details"
    t5_POST_jsonReq: await req(svc, "POST", JSON.stringify({ request: enc }), "application/json").catch(e => e.message),
    // Double base64
    t6_POST_double:  await req(svc, "POST", new URLSearchParams({ details: btoa(enc) }).toString()).catch(e => e.message),
  });
}
