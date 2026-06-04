/**
 * Prueba todos los servicios Score contra http://189.168.10.245
 * Uso: node scripts/test-score.mjs
 */
import { createCipheriv, createDecipheriv } from "crypto";

const BASE     = process.env.SCORE_BASE_URL    ?? "http://189.168.10.245";
const TERCERO  = process.env.SCORE_TERCERO     ?? "1";
const TEATRO   = process.env.SCORE_TEATRO      ?? "2";
const PV       = process.env.SCORE_PUNTO_VENTA ?? "77";
const KEY_BUF  = Buffer.from("tHIrd!sc0R3Is.00", "utf8");
const IV_BUF   = Buffer.from("tHIrd!sc0R3Is.00", "utf8");

function encrypt(text) {
  const c = createCipheriv("aes-128-cbc", KEY_BUF, IV_BUF);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}
function decrypt(b64) {
  const d = createDecipheriv("aes-128-cbc", KEY_BUF, IV_BUF);
  return Buffer.concat([d.update(Buffer.from(b64, "base64")), d.final()]).toString("utf8");
}

async function call(service, payload, timeoutMs = 20000) {
  const url = `${BASE}/ThirdParty/api/SCOact/${service}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(encrypt(JSON.stringify(payload))),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    let dec = "";
    try {
      const j = JSON.parse(text);
      const item = Array.isArray(j) ? j[0] : j;
      if (item?.request) dec = decrypt(item.request);
    } catch { dec = text; }
    const bloqueado = dec.toLowerCase().includes("no hay tarifas") ||
                      dec.toLowerCase().includes("no autorizado") ||
                      dec.toLowerCase().includes("terceros") ||
                      dec.includes("no encontró");
    return { ok: res.status === 200 && !bloqueado, status: res.status, dec, elapsed };
  } catch (e) {
    return { ok: false, status: 0, dec: "", error: String(e), elapsed: Date.now() - start };
  }
}

async function callGet(path, timeoutMs = 20000) {
  const url = `${BASE}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    return { ok: res.status === 200, status: res.status, text, elapsed };
  } catch (e) {
    return { ok: false, status: 0, text: "", error: String(e), elapsed: Date.now() - start };
  }
}

function badge(ok) { return ok ? "✅ OK" : "❌ FALLO"; }
function preview(str, len = 200) {
  if (!str) return "(vacío)";
  const s = str.trim();
  return s.length <= len ? s : s.slice(0, len) + "…";
}

// ── Extraer primera función válida de la cartelera XML (regex simple, sin xml2js) ──
function extraerFuncionXml(xmlText) {
  try {
    // Busca la primera pelicula con id
    const peliMatch = xmlText.match(/<pelicula[^>]+id="(\d+)"[^>]*>/i);
    const peliId = peliMatch?.[1] ?? "";
    // Busca cinema con id=TEATRO
    const cinemaRe = new RegExp(`<cinema[^>]+id="${TEATRO}"[\\s\\S]*?</cinema>`, "i");
    const cinemaBlock = xmlText.match(cinemaRe)?.[0] ?? "";
    // Busca primera sala
    const salaMatch = cinemaBlock.match(/<sala[^>]+(?:numeroSala|id)="(\d+)"/i);
    const salaId = salaMatch?.[1] ?? "";
    // Busca primera fecha univ
    const fechaMatch = cinemaBlock.match(/univ="(\d{8})"/i);
    const fechaUniv = fechaMatch?.[1] ?? "";
    // Busca primera hora militar
    const horaMatch = cinemaBlock.match(/militar="(\d+)"/i);
    const militar = horaMatch?.[1] ?? "";
    if (!peliId || !salaId || !fechaUniv || !militar) return null;
    const hh = String(Math.floor(parseInt(militar) / 100)).padStart(2, "0");
    const mm = String(parseInt(militar) % 100).padStart(2, "0");
    // Busca nombre pelicula
    const nombreMatch = xmlText.match(/<pelicula[^>]+id="${peliId}"[^>]*nombre="([^"]+)"/i)
      ?? xmlText.match(/<nombre>([^<]+)<\/nombre>/i);
    return {
      pelicula: peliId, sala: salaId,
      funcion: hh, inicioFuncion: hh + mm, fecha: fechaUniv,
      titulo: nombreMatch?.[1] ?? "desconocido",
    };
  } catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n━━━━ TEST SERVICIOS SCORE ━━━━`);
console.log(`Base: ${BASE} | Teatro: ${TEATRO} | Tercero: ${TERCERO} | PV: ${PV}\n`);

// 1. SCOCAR — cartelera XML (GET sin encriptar)
process.stdout.write("1. SCOCAR (variable41.xml)... ");
const scocar = await callGet("/MobileComJson/variable41.xml");
console.log(`${badge(scocar.ok)} [${scocar.elapsed}ms]`);
if (!scocar.ok) console.log(`   → ${scocar.error ?? `HTTP ${scocar.status}`}`);
else console.log(`   → ${scocar.text.length} bytes XML recibidos`);

// Intentar también JSON
process.stdout.write("   SCOCAR JSON (variable41.json)... ");
const scocarJson = await callGet("/MobileComJson/variable41.json");
console.log(`${badge(scocarJson.ok)} [${scocarJson.elapsed}ms]`);
if (scocarJson.ok) console.log(`   → ${scocarJson.text.length} bytes JSON recibidos`);

// Extraer función real para otros tests
let funcion = null;
if (scocar.ok) funcion = extraerFuncionXml(scocar.text);
if (!funcion && scocarJson.ok) {
  try {
    const j = JSON.parse(scocarJson.text);
    // intento rápido de extracción
    const peli = Array.isArray(j?.Peliculas?.pelicula) ? j.Peliculas.pelicula[0] : j?.Peliculas?.pelicula;
    const peliId = peli?.["@id"] ?? peli?.id ?? "";
    if (peliId) funcion = {
      pelicula: String(peliId), sala: "2",
      funcion: "13", inicioFuncion: "1300",
      fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      titulo: "desde JSON",
    };
  } catch { /**/ }
}
const ref = funcion ?? {
  pelicula: "55", sala: "2", funcion: "13", inicioFuncion: "1300",
  fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
  titulo: "fallback hardcoded",
};
console.log(`   → Función de referencia: pelicula=${ref.pelicula} sala=${ref.sala} fecha=${ref.fecha} hora=${ref.funcion} (${ref.titulo})\n`);

// 2. SCOSEC — secuencia + recargo
process.stdout.write("2. SCOSEC (secuencia + recargo)... ");
const scosec = await call("scosec", { Punto: PV, teatro: TEATRO, tercero: TERCERO });
console.log(`${badge(scosec.ok)} [${scosec.elapsed}ms]`);
console.log(`   → ${preview(scosec.dec)}`);
let secuencia = "1";
try { secuencia = String(JSON.parse(scosec.dec)[0]?.Secuencia ?? "1"); } catch { /**/ }
console.log(`   → Secuencia: ${secuencia}\n`);

// 3. SCOMAP — mapa de sillas
process.stdout.write("3. SCOMAP (mapa de sillas)... ");
const scomap = await call("scomap", { Sala: ref.sala, FechaFuncion: ref.fecha, Funcion: ref.funcion, teatro: TEATRO, tercero: TERCERO });
console.log(`${badge(scomap.ok)} [${scomap.elapsed}ms]`);
const mapaLen = (() => { try { const j = JSON.parse(scomap.dec); return Array.isArray(j.FilaTotal) ? j.FilaTotal.length : "?"; } catch { return "?"; } })();
console.log(`   → ${mapaLen} posiciones en el mapa`);
if (!scomap.ok) console.log(`   → ${preview(scomap.dec)}\n`);
else console.log();

// 4. SCOESG — ocupación real (mismos params que SCOMAP)
process.stdout.write("4. SCOESG (ocupación real)... ");
const scoesg = await call("scoesg", { FechaFuncion: ref.fecha, Sala: ref.sala, Funcion: ref.funcion, teatro: TEATRO, tercero: TERCERO });
console.log(`${badge(scoesg.ok)} [${scoesg.elapsed}ms]`);
const esgLen = (() => { try { return JSON.parse(scoesg.dec).length + " filas"; } catch { return preview(scoesg.dec, 100); } })();
console.log(`   → ${esgLen}\n`);

// 5. SCOPLA — tarifas para terceros (era bloqueado)
process.stdout.write("5. SCOPLA (tarifas terceros)... ");
const scopla = await call("scopla", { FechaFuncion: ref.fecha, Pelicula: parseInt(ref.pelicula), Sala: parseInt(ref.sala), InicioFuncion: parseInt(ref.inicioFuncion), teatro: parseInt(TEATRO), tercero: TERCERO });
console.log(`${badge(scopla.ok)} [${scopla.elapsed}ms]`);
console.log(`   → ${preview(scopla.dec, 300)}\n`);

// 6. SCOGRU — hold de sillas (era bloqueado)
process.stdout.write("6. SCOGRU (hold/preventa sillas)... ");
const scogru = await call("scogru", {
  FechaFuncion: ref.fecha, Sala: parseInt(ref.sala), HoraFuncion: ref.funcion,
  Pelicula: parseInt(ref.pelicula), Descripcion: ref.titulo,
  InicioFuncion: parseInt(ref.inicioFuncion), PuntoVenta: parseInt(PV),
  Secuencia: parseInt(secuencia), Telefono: "3000000000",
  Nombre: "TEST", Apellido: "PRUEBA",
  Ubicaciones: [{ Fila: "A", Columna: 4, Tarifa: "2" }],
  teatro: parseInt(TEATRO), tercero: TERCERO,
});
console.log(`${badge(scogru.ok)} [${scogru.elapsed}ms]`);
console.log(`   → ${preview(scogru.dec)}\n`);

// 7. SCOSIL — liberar hold (si SCOGRU funcionó)
if (scogru.ok) {
  process.stdout.write("7. SCOSIL (liberar hold)... ");
  const scosil = await call("scosil", {
    FechaFuncion: ref.fecha, Sala: parseInt(ref.sala),
    Funcion: parseInt(ref.funcion), Fila: "A", Columna: 4,
    Usuario: parseInt(PV), teatro: parseInt(TEATRO), tercero: TERCERO,
  });
  console.log(`${badge(scosil.ok)} [${scosil.elapsed}ms]`);
  console.log(`   → ${preview(scosil.dec)}\n`);
} else {
  console.log("7. SCOSIL (liberar hold)... ⏭ OMITIDO (SCOGRU falló)\n");
}

// 8. SCOCYA — registrar/actualizar cliente
process.stdout.write("8. SCOCYA (registrar cliente)... ");
const scocya = await call("scocya", {
  Login: "test-score@cineworld.co", Nombre: "Test", Apellido: "Score",
  Correo: "test-score@cineworld.co", Cinema: TEATRO, Clave: "Test1234",
  Celular: "3000000000", Telefono: "3000000000", Documento: "0",
  Fecha_Nacimiento: "19900101", Sexo: "M", Edad: "", Genero: "",
  Direccion: "", Barrio: "", Municipio: "",
  Reservas: "N", Noticias: "N", Cartelera: "N", Otras_Salas: "N",
  Contacto: "Correo Electrónico", Accion: "C", tercero: TERCERO,
});
console.log(`${badge(scocya.ok)} [${scocya.elapsed}ms]`);
console.log(`   → ${preview(scocya.dec)}\n`);

// 9. SCOLOG — login cliente
process.stdout.write("9. SCOLOG (login cliente)... ");
const scolog = await call("scolog", { Correo: "test-score@cineworld.co", Clave: "Test1234", tercero: TERCERO });
console.log(`${badge(scolog.ok)} [${scolog.elapsed}ms]`);
console.log(`   → ${preview(scolog.dec)}\n`);

// 10. SCOCED — consultar por documento
process.stdout.write("10. SCOCED (consultar por documento)... ");
const scoced = await call("scoced", { Documento: "1234567890", tercero: TERCERO });
console.log(`${badge(scoced.ok)} [${scoced.elapsed}ms]`);
console.log(`   → ${preview(scoced.dec)}\n`);

// ── Resumen ────────────────────────────────────────────────────────────────────
console.log("━━━━ RESUMEN ━━━━");
const results = [
  ["SCOCAR XML",  scocar.ok],
  ["SCOCAR JSON", scocarJson.ok],
  ["SCOSEC",      scosec.ok],
  ["SCOMAP",      scomap.ok],
  ["SCOESG",      scoesg.ok],
  ["SCOPLA",      scopla.ok],
  ["SCOGRU",      scogru.ok],
  ["SCOCYA",      scocya.ok],
  ["SCOLOG",      scolog.ok],
  ["SCOCED",      scoced.ok],
];
for (const [name, ok] of results) {
  console.log(`  ${badge(ok)}  ${name}`);
}
const passed = results.filter(([,ok]) => ok).length;
console.log(`\nTotal: ${passed}/${results.length} servicios OK\n`);
