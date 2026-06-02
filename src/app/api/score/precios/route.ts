import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.SCORE_BASE_URL;
  const teatro = process.env.SCORE_TEATRO ?? "2";
  if (!base) return NextResponse.json({ error: "SCORE_BASE_URL no configurado" }, { status: 500 });

  const res = await fetch(`${base}/MobileComJson/variable41.json`, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) return NextResponse.json({ error: `Score devolvió HTTP ${res.status}` }, { status: 502 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  const arr = <T>(x: T | T[]): T[] => Array.isArray(x) ? x : (x != null ? [x] : []);

  type PrecioFila = {
    pelicula_id: string;
    pelicula: string;
    sala: string;
    fecha: string;
    hora: string;
    zona: string;
    tipo_silla: string;
    codigo_tarifa: string;
    valor: number;
    valido_terceros: string;
    ventas_online: string;
  };

  const precios: PrecioFila[] = [];

  for (const peli of arr(json?.Peliculas?.pelicula)) {
    const peliId  = String(peli?.["@id"]     ?? "");
    const peliNom = String(peli?.["@nombre"] ?? "");

    for (const cinema of arr(peli?.cinemas?.cinema)) {
      if (String(cinema?.["@id"] ?? "") !== teatro) continue;

      for (const sala of arr(cinema?.salas?.sala)) {
        const salaId = String(sala?.["@numeroSala"] ?? sala?.["@id"] ?? "");

        for (const fecha of arr(sala?.Fecha)) {
          const fechaUniv = String(fecha?.["@univ"] ?? "");

          for (const hora of arr(fecha?.hora)) {
            const militar     = String(hora?.["@militar"]     ?? "");
            const ventasOnline = String(hora?.["@ventasONline"] ?? "false");

            for (const zona of arr(hora?.TipoZona)) {
              const nombreZona = String(zona?.["@nombreZona"] ?? "");

              for (const silla of arr(zona?.TipoSilla)) {
                const tipoSilla = String(silla?.["@nombreSilla"] ?? silla?.["@tipo"] ?? "");

                for (const tarifa of arr(silla?.Tarifa)) {
                  precios.push({
                    pelicula_id:   peliId,
                    pelicula:      peliNom,
                    sala:          salaId,
                    fecha:         fechaUniv,
                    hora:          militar,
                    zona:          nombreZona,
                    tipo_silla:    tipoSilla,
                    codigo_tarifa: String(tarifa?.["@codigoTarifa"] ?? ""),
                    valor:         parseInt(tarifa?.["@valor"] ?? tarifa?.["@Valor"] ?? "0"),
                    valido_terceros: String(tarifa?.["@validoTeceros"] ?? ""),
                    ventas_online: ventasOnline,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // Agrupa por película + zona para resumen
  const resumen: Record<string, { valor: number; codigo: string; valido_terceros: string }[]> = {};
  for (const p of precios) {
    const key = `${p.pelicula} | Sala ${p.sala} | ${p.zona}`;
    if (!resumen[key]) resumen[key] = [];
    const yaExiste = resumen[key].some(r => r.codigo === p.codigo_tarifa);
    if (!yaExiste && p.codigo_tarifa) {
      resumen[key].push({ valor: p.valor, codigo: p.codigo_tarifa, valido_terceros: p.valido_terceros });
    }
  }

  return NextResponse.json({
    total_registros: precios.length,
    resumen,
    detalle: precios,
  });
}
