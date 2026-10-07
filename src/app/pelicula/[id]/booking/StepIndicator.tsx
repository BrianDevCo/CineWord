const PASOS = ["Fecha", "Formato", "Horario", "Asientos", "Pago"];

export default function StepIndicator({ step, ventaOnline }: { step: number; ventaOnline: boolean }) {
  return (
    <ol className="flex items-center gap-0 mb-8 sm:mb-10" aria-label="Pasos de la compra">
      {PASOS.map((label, i) => {
        const n = i + 1;
        const locked = !ventaOnline && n > 3;
        const active = step === n && !locked;
        const done = step > n && !locked;
        return (
          <li key={label} className="flex items-center flex-1 sm:flex-none" aria-current={active ? "step" : undefined}>
            <div className={`flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-4 py-2 rounded-sm transition-all w-full sm:w-auto ${active ? "bg-[#CC1244] text-white" : done ? "text-[#CC1244]" : locked ? "text-gray-700 opacity-50" : "text-gray-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-heading border shrink-0 ${active ? "border-white text-white" : done ? "border-[#CC1244] bg-[#CC1244] text-white" : locked ? "border-gray-700" : "border-gray-600"}`}>
                {done ? "✓" : locked ? "🔒" : n}
              </span>
              {/* En celular solo se muestra el nombre del paso activo */}
              <span className={`font-heading text-[9px] sm:text-xs tracking-widest ${active ? "inline" : "hidden sm:inline"}`}>{label.toUpperCase()}</span>
            </div>
            {i < PASOS.length - 1 && <div className={`w-3 sm:w-8 h-px shrink-0 ${done ? "bg-[#CC1244]" : "bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
