import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Cartelera from "@/components/Cartelera";
import ProximosEstrenos from "@/components/ProximosEstrenos";
import Horarios from "@/components/Horarios";
import Precios from "@/components/Precios";
import Snacks from "@/components/Snacks";
import Contacto from "@/components/Contacto";
import Footer from "@/components/Footer";
import { getPeliculasEnCartelera, getPeliculasProximas, getHeroPeliculas, getHorariosHoy } from "@/lib/db";
import { getContenido } from "@/lib/contenido";

export const revalidate = 300; // refresca cada 5 minutos

export default async function Home() {
  const [enCartelera, proximas, heroPeliculas, horariosHoy, contenido] = await Promise.all([
    getPeliculasEnCartelera(),
    getPeliculasProximas(),
    getHeroPeliculas(),
    getHorariosHoy(),
    getContenido(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <Hero peliculas={heroPeliculas} />
        <Cartelera peliculas={enCartelera} horariosHoy={horariosHoy} />
        <ProximosEstrenos peliculas={proximas} />
        <Horarios />
        <Precios tarifas={contenido.tarifas} />
        <Snacks combos={contenido.combos} />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
