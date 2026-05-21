"use client";

import { useState } from "react";

type Categoria = "todos" | "combos" | "crispetas" | "comidas" | "bebidas" | "dulces";

const items = [
  // Combos
  { id: 1,  name: "Mi Combo",       price: 33000, emoji: "🎉", cat: "combos",    tag: null },
  { id: 2,  name: "Combo World",    price: 43000, emoji: "🎉", cat: "combos",    tag: "POPULAR" },
  { id: 3,  name: "Mundo para Dos", price: 60000, emoji: "👫", cat: "combos",    tag: "DÚO" },
  { id: 4,  name: "Mega World",     price: 90000, emoji: "🏆", cat: "combos",    tag: "GRANDE" },
  { id: 5,  name: "Combo Kids",     price: 18000, emoji: "🧒", cat: "combos",    tag: null },
  { id: 6,  name: "Combo Express",  price: 28000, emoji: "⚡", cat: "combos",    tag: null },
  { id: 7,  name: "Combo Nacho",    price: 30000, emoji: "🧀", cat: "combos",    tag: null },
  // Crispetas
  { id: 8,  name: "Crispeta Pequeña",  price: 9000,  emoji: "🍿", cat: "crispetas", tag: null },
  { id: 9,  name: "Crispeta Mediana",  price: 18000, emoji: "🍿", cat: "crispetas", tag: null },
  { id: 10, name: "Crispeta Grande",   price: 24000, emoji: "🍿", cat: "crispetas", tag: "POPULAR" },
  { id: 11, name: "Crispeta Mixta",    price: 3500,  emoji: "🍿", cat: "crispetas", tag: null },
  { id: 12, name: "Crispeta Dulce",    price: 6000,  emoji: "🍿", cat: "crispetas", tag: null },
  // Comidas
  { id: 13, name: "Perro",       price: 12000, emoji: "🌭", cat: "comidas", tag: null },
  { id: 14, name: "Granizados",  price: 12000, emoji: "🧊", cat: "comidas", tag: null },
  { id: 15, name: "Nachos",      price: 19000, emoji: "🧀", cat: "comidas", tag: null },
  { id: 16, name: "Paquetes",    price: 14500, emoji: "🥨", cat: "comidas", tag: null },
  // Bebidas
  { id: 17, name: "Gaseosa",         price: 7000, emoji: "🥤", cat: "bebidas", tag: null },
  { id: 18, name: "Gatorade",        price: 8500, emoji: "⚡", cat: "bebidas", tag: null },
  { id: 19, name: "Téa",            price: 7000, emoji: "🫖", cat: "bebidas", tag: null },
  { id: 20, name: "Jugo Hit",        price: 6000, emoji: "🍊", cat: "bebidas", tag: null },
  { id: 21, name: "Agua Saborizada", price: 7000, emoji: "💧", cat: "bebidas", tag: null },
  { id: 22, name: "Agua",            price: 5000, emoji: "💧", cat: "bebidas", tag: null },
  // Dulces
  { id: 23, name: "Galleta Wafer",      price: 3500, emoji: "🍪", cat: "dulces", tag: null },
  { id: 24, name: "Galleta Amadu",      price: 6000, emoji: "🍪", cat: "dulces", tag: null },
  { id: 25, name: "Chocolatina Jumbo",  price: 8500, emoji: "🍫", cat: "dulces", tag: null },
  { id: 26, name: "Gomas",             price: 4000, emoji: "🍬", cat: "dulces", tag: null },
  { id: 27, name: "Queso Cheddar",     price: 7000, emoji: "🧀", cat: "dulces", tag: null },
];

const categorias: { key: Categoria; label: string; emoji: string }[] = [
  { key: "todos",     label: "Todos",     emoji: "🍿" },
  { key: "combos",    label: "Combos",    emoji: "🎉" },
  { key: "crispetas", label: "Crispetas", emoji: "🍿" },
  { key: "comidas",   label: "Comidas",   emoji: "🌭" },
  { key: "bebidas",   label: "Bebidas",   emoji: "🥤" },
  { key: "dulces",    label: "Dulces",    emoji: "🍫" },
];

function fmt(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default function Snacks() {
  const [cat, setCat] = useState<Categoria>("todos");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCart, setShowCart] = useState(false);

  const filtered = cat === "todos" ? items : items.filter((i) => i.cat === cat);

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
    const item = items.find((c) => c.id === Number(id));
    return acc + (item?.price || 0) * qty;
  }, 0);

  return (
    <section id="snacks" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">
              — Dulcería y Confitería
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">
              CONFITERÍA
            </h2>
            <p className="text-gray-400 font-body mt-3 max-w-md">
              Disfruta la mejor selección de combos, crispetas y bebidas mientras ves tu película.
            </p>
          </div>

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
                <p className="font-heading text-[#CC1244] text-lg font-bold">{fmt(totalPrice)}</p>
              </div>
              <svg className={`w-4 h-4 text-white/50 transition-transform ${showCart ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Carrito */}
        {showCart && totalItems > 0 && (
          <div className="mb-8 bg-[#1a1a1a] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="font-heading text-white tracking-wider text-sm">TU PEDIDO</h3>
            {Object.entries(cart).map(([id, qty]) => {
              const item = items.find((c) => c.id === Number(id))!;
              return (
                <div key={id} className="flex items-center justify-between gap-4">
                  <span className="text-gray-300 font-body text-sm flex-1">{item.emoji} {item.name}</span>
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
            <div className="flex items-start gap-3 bg-[#CC1244]/10 border border-[#CC1244]/30 rounded-sm px-4 py-3">
              <span className="text-lg shrink-0 mt-0.5">🎟️</span>
              <p className="text-gray-300 font-body text-xs leading-relaxed">
                Muestra este resumen al llegar a taquilla y recoge tu pedido sin hacer fila.
              </p>
            </div>
          </div>
        )}

        {/* Filtros por categoría */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categorias.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`flex items-center gap-1.5 font-heading text-xs tracking-widest px-4 py-2 rounded-sm border transition-all ${
                cat === c.key
                  ? "bg-[#CC1244] border-[#CC1244] text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
              }`}
            >
              <span>{c.emoji}</span>
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const qty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="group relative bg-[#111] hover:bg-[#141414] rounded-xl p-4 border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50 flex flex-col gap-3"
              >
                {item.tag && (
                  <span className="absolute top-2 right-2 bg-[#CC1244] text-white font-heading text-[9px] px-1.5 py-0.5 rounded-sm tracking-widest">
                    {item.tag}
                  </span>
                )}

                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                  {item.emoji}
                </div>

                <div className="flex flex-col gap-0.5 flex-1">
                  <h3 className="font-heading text-sm font-bold text-white leading-snug">{item.name}</h3>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                  <span className="font-heading text-base font-bold text-white">{fmt(item.price)}</span>

                  {qty === 0 ? (
                    <button
                      onClick={() => add(item.id)}
                      className="bg-[#CC1244]/20 hover:bg-[#CC1244] border border-[#CC1244]/50 hover:border-[#CC1244] text-[#CC1244] hover:text-white font-heading text-[10px] px-2 py-1 rounded-sm transition-all tracking-widest"
                    >
                      + ADD
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => remove(item.id)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors text-sm">−</button>
                      <span className="text-white font-heading text-sm w-4 text-center">{qty}</span>
                      <button onClick={() => add(item.id)} className="w-6 h-6 rounded-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-bold flex items-center justify-center transition-colors text-sm">+</button>
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
