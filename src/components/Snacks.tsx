"use client";

import { useState } from "react";
import Image from "next/image";

type Categoria = "todos" | "combos" | "crispetas" | "comidas" | "bebidas" | "dulces";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=80&fit=crop&auto=format`;

const OXXO = (file: string) =>
  `https://prodcdnmobisoft.oxxodomicilios.com/${file}`;

const IMGS = {
  crispetaPeq:   IMG("photo-1682970468815-0db201b7804d"), // bol pequeño de palomitas
  crispetaMed:   IMG("photo-1548867688-231911e4ba3c"),    // palomitas medianas sirviéndose
  crispetaGde:   IMG("photo-1770597105062-648a2fbfa052"), // balde grande de cine
  crispetaDulce: IMG("photo-1709019651839-56148a2b2615"), // palomitas de colores dulces
  perro:         IMG("photo-1590759877531-559907fd23d6"),
  gaseosa:       IMG("photo-1562996506-7a4f75955d5a"),
  nachos:        IMG("photo-1564758565388-0d5da0cbb08c"),
  papas:         IMG("photo-1759465201025-0f4a876efa47"), // bolsa de papas fritas
  gomas:         IMG("photo-1703319953569-72084ac406b6"),
  granizados:    IMG("photo-1605116188480-2932cf9ace8b"),
  aguasab:       IMG("photo-1761864293808-dfb96001c534"),
  queso:         IMG("photo-1529566186297-155c18f9a434"),
  amadu:         IMG("photo-1464195085758-89f3e55e821e"), // placeholder
  // marcas reales desde OXXO Colombia
  chocolate:     OXXO("01HQJM6CS60DXG4ZGYN5JZHJBP.png"),  // Chocolatina Jumbo
  galleta:       OXXO("01GT6XF9RT8MZBYQH42VP5XZMN.webp"), // Galleta Wafer Jet (Noel)
  tea:           OXXO("01K5W02ZH6HQHTMANGZ83H0XGP.png"),  // Mr. Tea Limón
  gatorade:      OXXO("01J1WBTCAV6P9MPTS5R51FFEKQ.jpg"),  // Gatorade Blue Ice
  agua:          OXXO("01K5SPC6NATJP42SDNCAR0QZVS.jpg"),  // Agua Cristal
  jugo:          OXXO("01JE6QAS8RAJMM8VPMK8S790MB.png"),  // Jugo Hit Mora
};

// Imágenes reales de los combos (carpeta public/combos)
const COMBO_IMG: Record<number, string> = {
  1: "/combos/mi-combo.jpg",
  2: "/combos/combo-world.jpg",
  3: "/combos/mundo-para-dos.jpg",
  4: "/combos/mega-familiar.jpg",
  5: "/combos/cajita-kid.jpg",
  6: "/combos/combo-express.jpg",
  7: "/combos/combo-nachos.jpg",
};

const combos = [
  { id: 1, name: "Mi Combo",       tag: null,     desc: "Crispeta mediana, 1 perro, 1 gaseosa y 1 dulce",            precios: { salado: 33000, mixto: 36500, dulce: 39000 } },
  { id: 2, name: "Combo World",    tag: "POPULAR", desc: "Crispeta grande y 2 gaseosas",                             precios: { salado: 35000, mixto: 38500, dulce: 41000 } },
  { id: 3, name: "Mundo para Dos", tag: "DÚO",    desc: "Crispeta grande, 2 perros, 2 gaseosas y 1 dulce",           precios: { salado: 60000, mixto: 63500, dulce: 66000 } },
  { id: 4, name: "Mega Familiar",  tag: "FAMILIA", desc: "2 crispetas medianas, 3 perros, 3 gaseosas y papas",       precios: { salado: 90000, mixto: 93500, dulce: 96000 } },
  { id: 5, name: "Combo Kids",     tag: null,     desc: "Cajita feliz, chocolatina y 1 bebida",                      precios: { salado: 18000, mixto: 21500, dulce: 24000 } },
  { id: 6, name: "Combo Express",  tag: null,     desc: "Crispeta mediana y 2 gaseosas",                             precios: { salado: 28000, mixto: 31500, dulce: 34000 } },
  { id: 7, name: "Combo Nachos",   tag: null,     desc: "Nachos con queso, perro y bebida",                          precios: { salado: 30000 } },
];

const items = [
  { id: 101, name: "Crispeta Pequeña",   price: 9000,  cat: "crispetas", image: IMGS.crispetaPeq },
  { id: 102, name: "Crispeta Mediana",   price: 18000, cat: "crispetas", image: IMGS.crispetaMed },
  { id: 103, name: "Crispeta Grande",    price: 24000, cat: "crispetas", image: IMGS.crispetaGde },
  { id: 104, name: "Crispeta Mixta",     price: 3500,  cat: "crispetas", image: IMGS.crispetaMed },
  { id: 105, name: "Crispeta Dulce",     price: 6000,  cat: "crispetas", image: IMGS.crispetaDulce },
  { id: 106, name: "Perro",             price: 12000, cat: "comidas",   image: IMGS.perro },
  { id: 107, name: "Granizados",         price: 12000, cat: "comidas",   image: IMGS.granizados },
  { id: 108, name: "Nachos",            price: 19000, cat: "comidas",   image: IMGS.nachos },
  { id: 109, name: "Paquetes",          price: 14500, cat: "comidas",   image: IMGS.papas },
  { id: 110, name: "Gaseosa",           price: 7000,  cat: "bebidas",   image: IMGS.gaseosa },
  { id: 111, name: "Gatorade",          price: 8500,  cat: "bebidas",   image: IMGS.gatorade },
  { id: 112, name: "Mr. Tea",           price: 7000,  cat: "bebidas",   image: IMGS.tea },
  { id: 113, name: "Jugo Hit",          price: 6000,  cat: "bebidas",   image: IMGS.jugo },
  { id: 114, name: "Agua Saborizada",   price: 7000,  cat: "bebidas",   image: IMGS.aguasab },
  { id: 115, name: "Agua",             price: 5000,  cat: "bebidas",   image: IMGS.agua },
  { id: 116, name: "Galleta Wafer Jet", price: 3500,  cat: "dulces",    image: IMGS.galleta },
  { id: 117, name: "Galleta Amadu",     price: 6000,  cat: "dulces",    image: IMGS.amadu },
  { id: 118, name: "Chocolatina Jumbo", price: 8500,  cat: "dulces",    image: IMGS.chocolate },
  { id: 119, name: "Gomas",            price: 4000,  cat: "dulces",    image: IMGS.gomas },
  { id: 120, name: "Queso Cheddar",    price: 7000,  cat: "dulces",    image: IMGS.queso },
];

const categorias: { key: Categoria; label: string; emoji: string }[] = [
  { key: "todos",     label: "Todos",     emoji: "🍿" },
  { key: "combos",    label: "Combos",    emoji: "🎉" },
  { key: "crispetas", label: "Crispetas", emoji: "🍿" },
  { key: "comidas",   label: "Comidas",   emoji: "🌭" },
  { key: "bebidas",   label: "Bebidas",   emoji: "🥤" },
  { key: "dulces",    label: "Dulces",    emoji: "🍫" },
];

function fmt(n: number) { return `$${n.toLocaleString("es-CO")}`; }


export default function Snacks() {
  const [cat, setCat] = useState<Categoria>("todos");

  const showCombos = cat === "todos" || cat === "combos";
  const filteredItems =
    cat === "todos" || cat === "combos"
      ? cat === "combos" ? [] : items
      : items.filter((i) => i.cat === cat);

  return (
    <section id="snacks" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">— Dulcería y Confitería</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">CONFITERÍA</h2>
          <p className="text-gray-400 font-body mt-3 max-w-md mx-auto">
            Disfruta la mejor selección de combos, crispetas y bebidas mientras ves tu película.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center mb-10 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {categorias.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`flex items-center gap-1.5 font-heading text-xs tracking-widest px-4 py-2 rounded-sm border transition-all shrink-0 ${
                cat === c.key
                  ? "bg-[#CC1244] border-[#CC1244] text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
              }`}
            >
              {c.emoji} {c.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Combos */}
        {showCombos && (
          <div className="mb-10">
            {cat === "todos" && (
              <p className="font-heading text-gray-500 text-xs tracking-widest uppercase mb-5">— Combos</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {combos.map((combo) => {
                const hasSabores = combo.precios.mixto !== undefined;
                return (
                  <div
                    key={combo.id}
                    className="relative bg-[#111] rounded-xl border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {combo.tag && (
                      <span className="absolute top-2 right-2 z-20 bg-[#CC1244] text-white font-heading text-[9px] px-2 py-0.5 rounded-sm tracking-widest">
                        {combo.tag}
                      </span>
                    )}

                    {/* Imagen real del combo */}
                    <div className="relative h-44 overflow-hidden rounded-t-xl">
                      <Image
                        src={COMBO_IMG[combo.id]}
                        alt={combo.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>

                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div>
                        <h3 className="font-heading text-sm font-bold text-white">{combo.name}</h3>
                        <p className="text-gray-500 text-xs font-body leading-snug mt-1">{combo.desc}</p>
                      </div>

                      <div className={`grid gap-2 mt-auto pt-3 border-t border-white/10 ${hasSabores ? "grid-cols-3" : "grid-cols-1"}`}>
                        <div className="flex flex-col items-center bg-white/5 rounded-lg py-2 px-1">
                          <span className="font-heading text-[9px] text-gray-500 tracking-widest">SALADO</span>
                          <span className="font-heading text-white font-bold text-sm mt-0.5">{fmt(combo.precios.salado)}</span>
                        </div>
                        {hasSabores && (
                          <>
                            <div className="flex flex-col items-center bg-white/5 rounded-lg py-2 px-1">
                              <span className="font-heading text-[9px] text-gray-500 tracking-widest">MIXTO</span>
                              <span className="font-heading text-white font-bold text-sm mt-0.5">{fmt(combo.precios.mixto!)}</span>
                            </div>
                            <div className="flex flex-col items-center bg-[#CC1244]/10 border border-[#CC1244]/20 rounded-lg py-2 px-1">
                              <span className="font-heading text-[9px] text-[#CC1244] tracking-widest">DULCE</span>
                              <span className="font-heading text-white font-bold text-sm mt-0.5">{fmt(combo.precios.dulce!)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items individuales */}
        {filteredItems.length > 0 && (
          <div>
            {cat === "todos" && (
              <p className="font-heading text-gray-500 text-xs tracking-widest uppercase mb-5">— Individuales</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111] rounded-xl border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111]/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="font-heading text-sm font-bold text-white leading-snug">{item.name}</h3>
                    <span className="font-heading text-lg font-bold text-[#CC1244]">{fmt(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
