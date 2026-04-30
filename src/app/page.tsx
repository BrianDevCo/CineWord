import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Cartelera from "@/components/Cartelera";
import Promo from "@/components/Promo";
import ProximosEstrenos from "@/components/ProximosEstrenos";
import Snacks from "@/components/Snacks";
import Salas from "@/components/Salas";
import Contacto from "@/components/Contacto";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Cartelera />
        <Promo />
        <ProximosEstrenos />
        <Salas />
        <Snacks />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
