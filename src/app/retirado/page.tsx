"use client";

import Image from "next/image";

export default function RetiradoPage() {
  return (
    <main className="min-h-screen bg-[#1a1208] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Luz ambiental de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3a2a0a_0%,_#0e0a04_60%,_#000_100%)]" />

      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* TV */}
        <div className="relative">

          {/* Antena */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-10">
            <div
              className="w-[3px] h-16 bg-gradient-to-t from-[#888] to-[#bbb] rounded-full origin-bottom"
              style={{ transform: "rotate(-18deg)" }}
            />
            <div
              className="w-[3px] h-16 bg-gradient-to-t from-[#888] to-[#bbb] rounded-full origin-bottom"
              style={{ transform: "rotate(18deg)" }}
            />
          </div>

          {/* Cuerpo del televisor */}
          <div
            className="relative rounded-[2rem] p-5 pb-8 shadow-2xl"
            style={{
              background: "linear-gradient(145deg, #6b5a3e 0%, #4a3d28 40%, #3a2e1a 100%)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.5)",
              border: "3px solid #2a2010",
            }}
          >
            {/* Pantalla con marco interior */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), inset 0 0 6px rgba(0,0,0,0.6)",
                border: "6px solid #1a1408",
              }}
            >
              {/* La imagen */}
              <div className="relative w-[520px] max-w-[85vw] aspect-[970/770]">
                <Image
                  src="/problemas.jpg"
                  alt="Technical Difficulties"
                  fill
                  className="object-cover"
                  priority
                />

                {/* Scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
                  }}
                />

                {/* Brillo de pantalla (reflejo curvo) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.08) 0%, transparent 60%)",
                  }}
                />

                {/* Parpadeo */}
                <div
                  className="absolute inset-0 pointer-events-none animate-flicker"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                />
              </div>
            </div>

            {/* Panel inferior: perilla + altavoz */}
            <div className="flex items-center justify-between mt-4 px-3">
              {/* Altavoz (rejilla) */}
              <div className="flex gap-[4px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] h-10 rounded-full"
                    style={{ background: "linear-gradient(to bottom, #2a2010, #1a1408)" }}
                  />
                ))}
              </div>

              {/* Perillas */}
              <div className="flex gap-4">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #8a7a5a, #3a2e1a)",
                    boxShadow: "2px 2px 4px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(0,0,0,0.4)",
                  }}
                />
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #8a7a5a, #3a2e1a)",
                    boxShadow: "2px 2px 4px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Patas del TV */}
          <div className="flex justify-between px-10 -mt-1">
            <div
              className="w-6 h-5 rounded-b-md"
              style={{ background: "linear-gradient(to bottom, #3a2e1a, #2a2010)" }}
            />
            <div
              className="w-6 h-5 rounded-b-md"
              style={{ background: "linear-gradient(to bottom, #3a2e1a, #2a2010)" }}
            />
          </div>
        </div>

        {/* Texto debajo */}
        <p className="text-[#5a4a2a] text-xs tracking-widest uppercase mt-2 select-none">
          Volvemos pronto &mdash; Please stand by
        </p>
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 0; }
          92% { opacity: 0; }
          93% { opacity: 1; }
          94% { opacity: 0; }
          96% { opacity: 0.5; }
          97% { opacity: 0; }
        }
        .animate-flicker {
          animation: flicker 4s infinite;
        }
      `}</style>
    </main>
  );
}
