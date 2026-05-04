"use client";

import { useEffect, useState } from "react";

interface TicketData {
  pelicula: string;
  fecha: string;
  hora: string;
  formato: string;
  asientos: string;
  total: string;
}

export default function TicketResumen() {
  const [ticket, setTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cw-last-ticket");
      if (raw) {
        setTicket(JSON.parse(raw));
        sessionStorage.removeItem("cw-last-ticket");
      }
    } catch {
      // sessionStorage no disponible o dato corrupto
    }
  }, []);

  if (!ticket) return null;

  const rows = [
    { label: "Película", value: ticket.pelicula },
    { label: "Fecha", value: ticket.fecha },
    { label: "Función", value: `${ticket.hora} — ${ticket.formato}` },
    { label: "Asientos", value: ticket.asientos },
  ];

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-6 py-5 w-full text-left flex flex-col gap-3">
      <p className="text-gray-600 font-heading text-xs tracking-widest">DETALLE DE TU COMPRA</p>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-sm font-body gap-4">
          <span className="text-gray-500 shrink-0">{r.label}</span>
          <span className="text-white font-medium text-right">{r.value}</span>
        </div>
      ))}
      <div className="border-t border-white/10 pt-3 flex justify-between items-center">
        <span className="text-gray-500 font-body text-sm">Total pagado</span>
        <span className="text-[#CC1244] font-heading text-xl font-bold">{ticket.total}</span>
      </div>
    </div>
  );
}
