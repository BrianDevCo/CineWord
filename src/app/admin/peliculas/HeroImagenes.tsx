"use client";

import { useEffect, useState } from "react";

interface Opcion { url: string; thumb: string; idioma: string | null }

// Galería de fondos de TMDB: el cine elige 2 que se muestran mitad y mitad en el hero
export default function HeroImagenes({ peliculaId }: { peliculaId: number }) {
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/admin/peliculas/${peliculaId}/imagenes`)
      .then(async (r) => {
        const d = await r.json();
        if (cancelado) return;
        if (!r.ok) { setEstado("error"); setMensaje(d.error ?? "Error"); return; }
        setOpciones(d.opciones ?? []);
        setElegidas(d.seleccionadas ?? []);
        setEstado("listo");
      })
      .catch(() => { if (!cancelado) { setEstado("error"); setMensaje("No se pudieron cargar las imágenes"); } });
    return () => { cancelado = true; };
  }, [peliculaId]);

  const alternar = (url: string) => {
    setMensaje("");
    setElegidas((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url)
        : prev.length >= 2 ? [prev[1], url]      // al elegir una tercera, se descarta la más antigua
        : [...prev, url],
    );
  };

  async function guardar() {
    setGuardando(true);
    const r = await fetch(`/api/admin/peliculas/${peliculaId}/imagenes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero_imagenes: elegidas }),
    });
    const d = await r.json().catch(() => ({}));
    setGuardando(false);
    setMensaje(r.ok ? "Guardado. El inicio se actualiza en unos segundos." : d.error ?? "No se pudo guardar");
  }

  const miniatura = (url: string) => opciones.find((o) => o.url === url)?.thumb ?? url;

  return (
    <section className="mt-10 bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col gap-5 max-w-5xl">
      <div>
        <h2 className="font-heading text-lg text-white tracking-wider">IMÁGENES DEL HERO</h2>
        <p className="text-gray-500 font-body text-sm">
          Elige 2 imágenes: se muestran mitad y mitad en el banner principal del inicio. Las marcadas como &quot;sin texto&quot; quedan mejor.
        </p>
      </div>

      {estado === "cargando" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      )}

      {estado === "error" && <p className="text-amber-400 font-body text-sm">{mensaje}</p>}

      {estado === "listo" && (
        <>
          {/* Vista previa mitad y mitad */}
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden aspect-[32/9] bg-black">
            {[0, 1].map((i) => (
              <div key={i} className="relative bg-white/5 flex items-center justify-center">
                {elegidas[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={miniatura(elegidas[i])} alt={`Imagen ${i + 1} del hero`} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-heading text-xs tracking-widest">IMAGEN {i + 1}</span>
                )}
              </div>
            ))}
          </div>

          {opciones.length === 0 ? (
            <p className="text-gray-500 font-body text-sm">TMDB no tiene imágenes de fondo para esta película.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {opciones.map((o) => {
                const pos = elegidas.indexOf(o.url);
                return (
                  <button
                    key={o.url}
                    type="button"
                    onClick={() => alternar(o.url)}
                    aria-pressed={pos >= 0}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${pos >= 0 ? "border-[#CC1244]" : "border-transparent hover:border-white/30"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    {pos >= 0 && (
                      <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#CC1244] text-white font-heading text-xs flex items-center justify-center">
                        {pos + 1}
                      </span>
                    )}
                    {o.idioma === null && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-gray-300 font-body text-[10px] px-1.5 py-0.5 rounded-sm">sin texto</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-50 text-white font-heading text-xs tracking-widest px-5 py-2.5 rounded-lg transition-all"
            >
              {guardando ? "GUARDANDO..." : "GUARDAR IMÁGENES"}
            </button>
            <span className="text-gray-500 font-body text-xs">{elegidas.length}/2 elegidas</span>
            {mensaje && <span className="text-gray-300 font-body text-xs">{mensaje}</span>}
          </div>
        </>
      )}
    </section>
  );
}
