export default function AgeModal({ edad, onConfirm, onCancel }: { edad: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-[#CC1244]/15 border border-[#CC1244]/30 flex items-center justify-center">
            <span className="font-heading text-[#CC1244] text-2xl font-bold">+{edad}</span>
          </div>
          <h3 id="age-modal-title" className="font-heading text-white text-lg font-bold tracking-wide">
            Restricción de edad
          </h3>
          <p className="font-body text-gray-400 text-sm leading-relaxed">
            Esta película tiene restricción para menores de{" "}
            <span className="text-white font-semibold">{edad} años</span>.
            Al continuar, confirmas que eres consciente de que{" "}
            <span className="text-[#CC1244] font-semibold">cualquier persona menor de {edad} años no podrá ingresar a la sala</span>, independientemente de si tiene boleta.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full bg-[#CC1244] hover:bg-[#a00e35] text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
          >
            ENTIENDO — CONTINUAR AL PAGO
          </button>
          <button
            onClick={onCancel}
            className="w-full border border-white/15 hover:border-white/30 text-gray-400 hover:text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}
