import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPelicula, getPeliculasEnCartelera, getFuncionesByPelicula } from "@/lib/db";
import BookingSection from "./BookingSection";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getPelicula(Number(id));
  if (!movie) return { title: "Película no encontrada" };

  return {
    title: movie.titulo,
    description: movie.sinopsis?.slice(0, 160) ?? `${movie.titulo} en CINEWORLD`,
    openGraph: {
      title: `${movie.titulo} | CINEWORLD`,
      description: movie.sinopsis?.slice(0, 160),
      images: movie.poster_url ? [{ url: movie.poster_url, width: 500, height: 750 }] : [],
    },
  };
}

export default async function PeliculaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const peliculaId = Number(id);

  const [movie, todasEnCartelera, funciones] = await Promise.all([
    getPelicula(peliculaId),
    getPeliculasEnCartelera(),
    getFuncionesByPelicula(peliculaId, 7),
  ]);

  if (!movie) notFound();

  const hasBackdrop = !!movie.backdrop_url;
  const otras = todasEnCartelera.filter((m) => m.id !== movie.id);

  return (
    <main className="bg-[#0a0a0a] min-h-screen">

      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        {hasBackdrop ? (
          <>
            <Image
              src={movie.backdrop_url!}
              alt={movie.titulo}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#110005] to-[#0a0a0a]" />
        )}

        <Link
          href="/#cartelera"
          className="absolute top-24 left-6 lg:left-10 flex items-center gap-2 text-white/60 hover:text-white font-heading text-sm tracking-widest transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          CARTELERA
        </Link>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-32 w-full flex flex-col sm:flex-row items-end gap-8">
          {movie.poster_url && (
            <div
              className="shrink-0 w-40 rounded-xl overflow-hidden relative shadow-2xl border border-white/10 hidden sm:block"
              style={{ height: "clamp(240px, 20vw, 312px)" }}
            >
              <Image src={movie.poster_url} alt={movie.titulo} fill className="object-cover" sizes="208px" />
            </div>
          )}

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`${movie.badge_color} text-white font-heading text-xs px-3 py-1 rounded-sm tracking-widest`}>
                {movie.badge}
              </span>
              <span className="text-gray-400 text-sm font-body">{movie.genero}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-sm font-body">{movie.duracion}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-sm font-body">{movie.clasificacion}</span>
            </div>

            <h1 className="font-heading font-bold text-5xl lg:text-7xl text-white tracking-wider leading-tight drop-shadow-2xl">
              {movie.titulo}
            </h1>

            {(movie.director || movie.reparto.length > 0) && (
              <div className="flex items-center gap-2 text-sm font-body text-gray-400">
                {movie.director && <span>Dir. {movie.director}</span>}
                {movie.director && movie.reparto.length > 0 && <span className="text-gray-600">•</span>}
                {movie.reparto.length > 0 && <span>{movie.reparto.slice(0, 3).join(", ")}</span>}
              </div>
            )}

            <a
              href="#comprar"
              className="w-fit bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest px-8 py-3.5 rounded-sm transition-all flex items-center gap-2 shadow-lg shadow-[#CC1244]/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
              </svg>
              COMPRAR BOLETO
            </a>
          </div>
        </div>
      </section>

      {/* ── SINOPSIS + TRAILER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <p className="text-[#CC1244] font-heading tracking-widest text-xs uppercase mb-1 flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-[#CC1244]" />
                Acerca de la película
              </p>
              <h2 className="font-heading text-3xl font-bold text-white tracking-wider">SINOPSIS</h2>
            </div>
            {movie.sinopsis && (
              <p className="text-gray-400 font-body leading-relaxed">{movie.sinopsis}</p>
            )}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
              {[
                { label: "Director", value: movie.director },
                { label: "Reparto", value: movie.reparto.join(", ") },
                { label: "Duración", value: movie.duracion },
                { label: "Clasificación", value: movie.clasificacion },
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div key={row.label} className="flex gap-4 text-sm font-body">
                    <span className="text-gray-600 w-24 shrink-0">{row.label}</span>
                    <span className="text-gray-300">{row.value}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div>
              <p className="text-[#CC1244] font-heading tracking-widest text-xs uppercase mb-1 flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-[#CC1244]" />
                Material audiovisual
              </p>
              <h2 className="font-heading text-3xl font-bold text-white tracking-wider">TRAILER</h2>
            </div>

            {movie.trailer_search && (
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.trailer_search)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-[#CC1244]/50 transition-all block"
              >
                {(movie.backdrop_url ?? movie.poster_url) && (
                  <Image
                    src={(movie.backdrop_url ?? movie.poster_url)!}
                    alt="Trailer"
                    fill
                    className={`object-cover ${!movie.backdrop_url ? "object-top" : ""}`}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#CC1244]/90 group-hover:bg-[#CC1244] group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl shadow-[#CC1244]/30">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="font-heading text-white text-sm tracking-widest bg-black/60 px-4 py-1.5 rounded-sm">
                    VER TRAILER OFICIAL
                  </span>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── COMPRAR BOLETO ── */}
      <section id="comprar" className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <p className="text-[#CC1244] font-heading tracking-widest text-xs uppercase mb-1 flex items-center gap-2">
              <span className="inline-block w-4 h-px bg-[#CC1244]" />
              Reserva tu lugar
            </p>
            <h2 className="font-heading text-4xl font-bold text-white tracking-wider">COMPRAR BOLETO</h2>
            <p className="text-gray-500 font-body text-sm mt-1">
              Funciones disponibles para los próximos 7 días.
            </p>
          </div>
          <BookingSection movie={movie} funciones={funciones} />
        </div>
      </section>

      {/* ── OTRAS PELÍCULAS ── */}
      {otras.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
          <h2 className="font-heading text-2xl font-bold text-white tracking-wider mb-6">
            TAMBIÉN EN CARTELERA
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {otras.map((m) => (
              <Link
                key={m.id}
                href={`/pelicula/${m.id}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {m.poster_url ? (
                    <Image
                      src={m.poster_url}
                      alt={m.titulo}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-gray-400 text-[10px] font-body">{m.genero}</p>
                    <p className="font-heading text-sm font-bold text-white leading-tight line-clamp-2">{m.titulo}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
