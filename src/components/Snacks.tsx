"use client";

import { useState } from "react";

type Categoria = "todos" | "combos" | "crispetas" | "comidas" | "bebidas" | "dulces";
type Sabor = "salado" | "mixto" | "dulce";

interface Combo {
  id: number;
  name: string;
  desc: string;
  emoji: string;
  tag: string | null;
  precios: { salado: number; mixto?: number; dulce?: number };
}

interface Item {
  id: number;
  name: string;
  price: number;
  emoji: string;
  cat: "crispetas" | "comidas" | "bebidas" | "dulces";
  tag: string | null;
}

const combos: Combo[] = [
  {
    id: 1, name: "Mi Combo", emoji: "🎉", tag: null,
    desc: "Crispeta mediana, 1 perro, 1 gaseosa y 1 dulce",
    precios: { salado: 33000, mixto: 36500, dulce: 39000 },
  },
  {
    id: 2, name: "Combo World", emoji: "🌎", tag: "POPULAR",
    desc: "Crispeta grande y 2 gaseosas",
    precios: { salado: 35000, mixto: 38500, dulce: 41000 },
  },
  {
    id: 3, name: "Mundo para Dos", emoji: "👫", tag: "DÚO",
    desc: "Crispeta grande, 2 perros, 2 gaseosas y 1 dulce",
    precios: { salado: 60000, mixto: 63500, dulce: 66000 },
  },
  {
    id: 4, name: "Mega Familiar", emoji: "🏆", tag: "FAMILIA",
    desc: "2 crispetas medianas, 3 perros, 3 gaseosas y papas",
    precios: { salado: 90000, mixto: 93500, dulce: 96000 },
  },
  {
    id: 5, name: "Combo Kids", emoji: "🧒", tag: null,
    desc: "Cajita feliz, chocolatina y 1 bebida",
    precios: { salado: 18000, mixto: 21500, dulce: 24000 },
  },
  {
    id: 6, name: "Combo Express", emoji: "⚡", tag: null,
    desc: "Crispeta mediana y 2 gaseosas",
    precios: { salado: 28000, mixto: 31500, dulce: 34000 },
  },
  {
    id: 7, name: "Combo Nachos", emoji: "🧀", tag: null,
    desc: "Nachos con queso, perro y bebida",
    precios: { salado: 30000 },
  },
];

const items: Item[] = [
  { id: 101, name: "Crispeta Pequeña",  price: 9000,  emoji: "🍿", cat: "crispetas", tag: null },
  { id: 102, name: "Crispeta Mediana",  price: 18000, emoji: "🍿", cat: "crispetas", tag: null },
  { id: 103, name: "Crispeta Grande",   price: 24000, emoji: "🍿", cat: "crispetas", tag: "POPULAR" },
  { id: 104, name: "Crispeta Mixta",    price: 3500,  emoji: "🍿", cat: "crispetas", tag: null },
  { id: 105, name: "Crispeta Dulce",    price: 6000,  emoji: "🍿", cat: "crispetas", tag: null },
  { id: 106, name: "Perro",            price: 12000, emoji: "🌭", cat: "comidas",   tag: null },
  { id: 107, name: "Granizados",        price: 12000, emoji: "🧊", cat: "comidas",   tag: null },
  { id: 108, name: "Nachos",           price: 19000, emoji: "🧀", cat: "comidas",   tag: null },
  { id: 109, name: "Paquetes",         price: 14500, emoji: "🥨", cat: "comidas",   tag: null },
  { id: 110, name: "Gaseosa",          price: 7000,  emoji: "🥤", cat: "bebidas",   tag: null },
  { id: 111, name: "Gatorade",         price: 8500,  emoji: "⚡", cat: "bebidas",   tag: null },
  { id: 112, name: "Téa",             price: 7000,  emoji: "🫖", cat: "bebidas",   tag: null },
  { id: 113, name: "Jugo Hit",         price: 6000,  emoji: "🍊", cat: "bebidas",   tag: null },
  { id: 114, name: "Agua Saborizada",  price: 7000,  emoji: "💧", cat: "bebidas",   tag: null },
  { id: 115, name: "Agua",            price: 5000,  emoji: "💧", cat: "bebidas",   tag: null },
  { id: 116, name: "Galleta Wafer",    price: 3500,  emoji: "🍪", cat: "dulces",    tag: null },
  { id: 117, name: "Galleta Amadu",    price: 6000,  emoji: "🍪", cat: "dulces",    tag: null },
  { id: 118, name: "Chocolatina Jumbo",price: 8500,  emoji: "🍫", cat: "dulces",    tag: null },
  { id: 119, name: "Gomas",           price: 4000,  emoji: "🍬", cat: "dulces",    tag: null },
  { id: 120, name: "Queso Cheddar",   price: 7000,  emoji: "🧀", cat: "dulces",    tag: null },
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
  const [sabores, setSabores] = useState<Record<number, Sabor>>({});
  const [cart, setCart] = useState<Record<string, { name: string; price: number; qty: number }>>({});
  const [showCart, setShowCart] = useState(false);

  const getSabor = (id: number) => sabores[id] ?? "salado";

  const getComboPrice = (combo: Combo, sabor: Sabor) =>
    combo.precios[sabor] ?? combo.precios.salado;

  const addCombo = (combo: Combo) => {
    const sabor = getSabor(combo.id);
    const price = getComboPrice(combo, sabor);
    const key = `combo-${combo.id}-${sabor}`;
    setCart((prev) => ({
      ...prev,
      [key]: { name: `${combo.name} (${sabor})`, price, qty: (prev[key]?.qty || 0) + 1 },
    }));
  };

  const addItem = (item: Item) => {
    const key = `item-${item.id}`;
    setCart((prev) => ({
      ...prev,
      [key]: { name: item.name, price: item.price, qty: (prev[key]?.qty || 0) + 1 },
    }));
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[key]?.qty || 0) <= 1) delete next[key];
      else next[key] = { ...next[key], qty: next[key].qty - 1 };
      return next;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b.qty, 0);
  const totalPrice = Object.values(cart).reduce((a, b) => a + b.price * b.qty, 0);

  const showCombos  = cat === "todos" || cat === "combos";
  const filteredItems = cat === "todos" || cat === "combos"
    ? (cat === "combos" ? [] : items)
    : items.filter((i) => i.cat === cat);

  return (
    <section id="snacks" className="py-20 lg:py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#CC1244] font-heading tracking-widest text-sm uppercase mb-2">— Dulcería y Confitería</p>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-wider">CONFITERÍA</h2>
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
                <p className="font-heading text-white text-sm tracking-widest">{totalItems} ITEM{totalItems > 1 ? "S" : ""}</p>
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
            {Object.entries(cart).map(([key, entry]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-gray-300 font-body text-sm flex-1">{entry.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(key)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center">−</button>
                  <span className="text-white font-heading w-4 text-center">{entry.qty}</span>
                  <button onClick={() => {
                    setCart((prev) => ({ ...prev, [key]: { ...prev[key], qty: prev[key].qty + 1 } }));
                  }} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center">+</button>
                </div>
                <span className="text-white font-heading text-sm w-24 text-right">{fmt(entry.price * entry.qty)}</span>
              </div>
            ))}
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

        {/* Filtros */}
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
              {c.emoji} {c.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Combos */}
        {showCombos && (
          <div className="mb-8">
            {cat === "todos" && (
              <p className="font-heading text-gray-500 text-xs tracking-widest uppercase mb-4">— Combos</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {combos.map((combo) => {
                const sabor = getSabor(combo.id);
                const precio = getComboPrice(combo, sabor);
                const hasSabores = combo.precios.mixto !== undefined;

                return (
                  <div key={combo.id} className="group relative bg-[#111] hover:bg-[#141414] rounded-xl p-5 border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50 flex flex-col gap-4">
                    {combo.tag && (
                      <span className="absolute top-3 right-3 bg-[#CC1244] text-white font-heading text-[9px] px-2 py-0.5 rounded-sm tracking-widest">{combo.tag}</span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                        {combo.emoji}
                      </div>
                      <div>
                        <h3 className="font-heading text-sm font-bold text-white">{combo.name}</h3>
                        <p className="text-gray-500 text-xs font-body leading-snug mt-0.5">{combo.desc}</p>
                      </div>
                    </div>

                    {/* Selector de sabor */}
                    {hasSabores && (
                      <div className="flex gap-1.5">
                        {(["salado", "mixto", "dulce"] as Sabor[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSabores((prev) => ({ ...prev, [combo.id]: s }))}
                            className={`flex-1 font-heading text-[10px] tracking-widest py-1.5 rounded-sm border transition-all capitalize ${
                              sabor === s
                                ? "bg-[#CC1244] border-[#CC1244] text-white"
                                : "bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                      <span className="font-heading text-xl font-bold text-white">{fmt(precio)}</span>
                      <button
                        onClick={() => addCombo(combo)}
                        className="bg-[#CC1244]/20 hover:bg-[#CC1244] border border-[#CC1244]/50 hover:border-[#CC1244] text-[#CC1244] hover:text-white font-heading text-[10px] px-3 py-1.5 rounded-sm transition-all tracking-widest"
                      >
                        + AGREGAR
                      </button>
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
              <p className="font-heading text-gray-500 text-xs tracking-widest uppercase mb-4">— Individuales</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => {
                const key = `item-${item.id}`;
                const qty = cart[key]?.qty || 0;
                return (
                  <div key={item.id} className="group relative bg-[#111] hover:bg-[#141414] rounded-xl p-4 border border-white/5 hover:border-[#CC1244]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/50 flex flex-col gap-3">
                    {item.tag && (
                      <span className="absolute top-2 right-2 bg-[#CC1244] text-white font-heading text-[9px] px-1.5 py-0.5 rounded-sm tracking-widest">{item.tag}</span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">{item.emoji}</div>
                    <h3 className="font-heading text-sm font-bold text-white leading-snug flex-1">{item.name}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                      <span className="font-heading text-base font-bold text-white">{fmt(item.price)}</span>
                      {qty === 0 ? (
                        <button onClick={() => addItem(item)} className="bg-[#CC1244]/20 hover:bg-[#CC1244] border border-[#CC1244]/50 hover:border-[#CC1244] text-[#CC1244] hover:text-white font-heading text-[10px] px-2 py-1 rounded-sm transition-all tracking-widest">
                          + ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => removeFromCart(key)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-sm">−</button>
                          <span className="text-white font-heading text-sm w-4 text-center">{qty}</span>
                          <button onClick={() => addItem(item)} className="w-6 h-6 rounded-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-bold flex items-center justify-center text-sm">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
