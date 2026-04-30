"use client";

import { useState } from "react";

const combos = [
  { id: 1, name: "Crispetas Pequeñas", description: "Crispetas en sabor natural o caramelo", price: 8000, emoji: "🍿", tag: null },
  { id: 2, name: "Crispetas Medianas", description: "Crispetas medianas + bebida personal 12oz", price: 14000, emoji: "🍿", tag: null },
  { id: 3, name: "Crispetas Grandes", description: "Crispetas grandes + bebida grande 22oz", price: 20000, emoji: "🍿", tag: "POPULAR" },
  { id: 4, name: "Combo Pareja", description: "2 crispetas medianas + 2 bebidas grandes", price: 38000, emoji: "🥤", tag: "DÚO" },
  { id: 5, name: "Combo Familiar", description: "4 crispetas medianas + 4 bebidas + nachos", price: 68000, emoji: "🎉", tag: "FAMILIA" },
  { id: 6, name: "Hot Dog Premium", description: "Hot dog con papas medianas + bebida grande", price: 22000, emoji: "🌭", tag: null },
  { id: 7, name: "Nachos con Queso", description: "Nachos crujientes con salsa de queso y jalapeños", price: 16000, emoji: "🧀", tag: null },
  { id: 8, name: "Bebida Grande", description: "Gaseosa o agua 22oz a tu elección", price: 9000, emoji: "🥤", tag: null },
];

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default function Snacks() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCart, setShowCart] = useState(false);

  const add = (id: number) =>
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const remove = (id: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = combos.find((c) => c.id === Number(id));
    return acc + (item?.price || 0) * qty;
  }, 0);

  return (
    <section id="snacks" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">
              — Dulcería y Combos
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
              NUESTROS COMBOS
            </h2>
            <p className="text-gray-400 font-body mt-3 max-w-md">
              Haz tu experiencia en el cine aún más deliciosa. Pide al comprar tu boleto y recógelo sin filas.
            </p>
          </div>

          {/* Mini carrito */}
          {totalItems > 0 && (
            <button
              onClick={() => setShowCart(!showCart)}
              className="flex items-center gap-3 bg-[#CC1244]/10 hover:bg-[#CC1244]/20 border border-[#CC1244]/50 rounded-lg px-5 py-3 transition-all shrink-0"
            >
              <span className="text-2xl">🛒</span>
              <div className="text-left">
                <p className="font-heading text-white text-sm tracking-widest">
                  {totalItems} ITEM{totalItems > 1 ? "S" : ""}
                </p>
                <p className="font-heading text-[#CC1244] text-lg font-bold">
                  {fmt(totalPrice)}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-white/50 transition-transform ${showCart ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Detalle del carrito desplegable */}
        {showCart && totalItems > 0 && (
          <div className="mb-8 bg-[#1a1a1a] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="font-heading text-white tracking-wider text-sm">TU PEDIDO</h3>
            {Object.entries(cart).map(([id, qty]) => {
              const item = combos.find((c) => c.id === Number(id))!;
              return (
                <div key={id} className="flex items-center justify-between gap-4">
                  <span className="text-gray-300 font-body text-sm flex-1">
                    {item.emoji} {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => remove(item.id)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center transition-colors">−</button>
                    <span className="text-white font-heading w-4 text-center">{qty}</span>
                    <button onClick={() => add(item.id)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center transition-colors">+</button>
                  </div>
                  <span className="text-white font-heading text-sm w-20 text-right">{fmt(item.price * qty)}</span>
                </div>
              );
            })}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-gray-400 font-body text-sm">Total</span>
              <span className="text-[#CC1244] font-heading text-xl font-bold">{fmt(totalPrice)}</span>
            </div>
            <button className="w-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all">
              AGREGAR AL BOLETO
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {combos.map((item) => {
            const qty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="group relative bg-[#111] hover:bg-[#141414] rounded-xl p-5 border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50 flex flex-col gap-4"
              >
                {item.tag && (
                  <span className="absolute top-3 right-3 bg-[#CC1244] text-white font-heading text-[10px] px-2 py-0.5 rounded-sm tracking-widest">
                    {item.tag}
                  </span>
                )}

                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                  {item.emoji}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="font-heading text-base font-bold text-white">{item.name}</h3>
                  <p className="text-gray-500 text-sm font-body leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                  <span className="font-heading text-xl font-bold text-white">{fmt(item.price)}</span>

                  {qty === 0 ? (
                    <button
                      onClick={() => add(item.id)}
                      className="bg-[#CC1244]/20 hover:bg-[#CC1244] border border-[#CC1244]/50 hover:border-[#CC1244] text-[#CC1244] hover:text-white font-heading text-xs px-3 py-1.5 rounded-sm transition-all duration-200 tracking-widest"
                    >
                      + AGREGAR
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => remove(item.id)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className="text-white font-heading text-sm w-4 text-center">{qty}</span>
                      <button
                        onClick={() => add(item.id)}
                        className="w-7 h-7 rounded-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-bold flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
