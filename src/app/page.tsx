import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Cartelera from "@/components/Cartelera";
import Promo from "@/components/Promo";
import ProximosEstrenos from "@/components/ProximosEstrenos";
import Horarios from "@/components/Horarios";
import Snacks from "@/components/Snacks";
import Contacto from "@/components/Contacto";
import Footer from "@/components/Footer";
import { getPeliculasEnCartelera, getPeliculasProximas, getHeroPeliculas } from "@/lib/db";

export const revalidate = 300; // refresca cada 5 minutos

export default async function Home() {
  const [enCartelera, proximas, heroPeliculas] = await Promise.all([
    getPeliculasEnCartelera(),
    getPeliculasProximas(),
    getHeroPeliculas(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <Hero peliculas={heroPeliculas} />
        <Cartelera peliculas={enCartelera} />
        <Promo />
        <ProximosEstrenos peliculas={proximas} />
        <Horarios />
        <Snacks />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
