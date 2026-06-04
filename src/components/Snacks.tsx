import Image from "next/image";

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
  { id: 1, name: "Mi Combo",       tag: null,      desc: "Crispeta mediana, 1 perro, 1 gaseosa y 1 dulce",       precios: { salado: 33000, mixto: 36500, dulce: 39000 } },
  { id: 2, name: "Combo World",    tag: "POPULAR", desc: "Crispeta grande y 2 gaseosas",                         precios: { salado: 35000, mixto: 38500, dulce: 41000 } },
  { id: 3, name: "Mundo para Dos", tag: "DÚO",     desc: "Crispeta grande, 2 perros, 2 gaseosas y 1 dulce",      precios: { salado: 60000, mixto: 63500, dulce: 66000 } },
  { id: 4, name: "Mega Familiar",  tag: "FAMILIA", desc: "2 crispetas medianas, 3 perros, 3 gaseosas y papas",   precios: { salado: 90000, mixto: 93500, dulce: 96000 } },
  { id: 5, name: "Combo Kids",     tag: null,      desc: "Cajita feliz, chocolatina y 1 bebida",                 precios: { salado: 18000, mixto: 21500, dulce: 24000 } },
  { id: 6, name: "Combo Express",  tag: null,      desc: "Crispeta mediana y 2 gaseosas",                        precios: { salado: 28000, mixto: 31500, dulce: 34000 } },
  { id: 7, name: "Combo Nachos",   tag: null,      desc: "Nachos con queso, perro y bebida",                     precios: { salado: 30000 } },
];

function fmt(n: number) { return `$${n.toLocaleString("es-CO")}`; }

export default function Snacks() {
  return (
    <section id="snacks" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">— Confitería</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">NUESTROS COMBOS</h2>
          <p className="text-gray-400 font-body mt-3 max-w-md mx-auto">
            Elige tu combo favorito y disfruta la experiencia completa del cine.
          </p>
        </div>

        {/* Combos */}
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
    </section>
  );
}
