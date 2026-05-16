import { NextResponse } from "next/server";
import { createCipheriv, createDecipheriv } from "crypto";
import https from "node:https";
import http from "node:http";

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

// Usa node:https directamente (sin fetch) para descartar interceptación de Next.js
function postRaw(url: string, body: string, ct: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = Buffer.from(body, "utf8");
    const opts = {
      hostname: u.hostname,
      port: u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": ct,
        "Content-Length": bodyBuf.length,
      },
    };
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8").slice(0, 500) }));
    });
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

// Fetch normal para comparar
async function postFetch(url: string, body: string, ct: string) {
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
  const formBody = new URLSearchParams({ details: enc }).toString();

  return NextResponse.json({
    debug: { base, enc, formBody },
    // node:https directo (sin fetch de Next.js)
    node_https: await postRaw(svc, formBody, "application/x-www-form-urlencoded").catch(e => String(e)),
    // fetch normal (para comparar)
    fetch_form: await postFetch(svc, formBody, "application/x-www-form-urlencoded").catch(e => String(e)),
    // node:https con JSON string
    node_json:  await postRaw(svc, JSON.stringify(enc), "application/json").catch(e => String(e)),
  });
}
