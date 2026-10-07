import SeatIcon, { SEAT_COLORS } from "./SeatIcon";

interface Props {
  filas: string[];
  /** Rango completo de columnas (con huecos = pasillos) o null para usar colsEnFila */
  allCols: number[] | null;
  colsEnFila: (fila: string) => number[];
  seatExists: (fila: string, col: number) => boolean;
  mirrorCols: boolean;
  ocupados: Set<string>;
  seleccionados: Set<string>;
  isVipRow: (fila: string) => boolean;
  precioVip: string;
  onToggle: (id: string) => void;
}

export default function SeatMap({
  filas, allCols, colsEnFila, seatExists, mirrorCols,
  ocupados, seleccionados, isVipRow, precioVip, onToggle,
}: Props) {
  const colores = (id: string) => {
    if (ocupados.has(id))      return SEAT_COLORS.ocupado;
    if (seleccionados.has(id)) return SEAT_COLORS.seleccionado;
    if (isVipRow(id[0]))       return SEAT_COLORS.vip;
    return SEAT_COLORS.disponible;
  };

  return (
    <>
      <p className="sm:hidden text-center text-gray-600 font-body text-xs -mb-2">Desliza para ver toda la sala →</p>

      {/* min-w-fit + mx-auto: centra en pantallas grandes y permite desplazar en celular sin cortar el lado izquierdo */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4" role="group" aria-label="Mapa de sillas">
        <div className="flex flex-col gap-2 min-w-fit mx-auto w-fit">
          {[...filas].reverse().map(row => (
            <div key={row} className={`flex items-center gap-2 justify-center ${mirrorCols ? "flex-row-reverse" : ""}`}>
              <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
              <div className="flex gap-1.5 items-center">
                {(allCols ?? colsEnFila(row)).map(col => {
                  const id = `${row}${col}`;
                  if (allCols && !seatExists(row, col)) {
                    if (col === 3) {
                      return (
                        <div key="aisle" className="w-6 h-8 flex items-center justify-center shrink-0">
                          <span className="text-[7px] text-gray-700 font-heading" style={{ writingMode: "vertical-rl" }}>ESC</span>
                        </div>
                      );
                    }
                    return <div key={`gap-${col}`} className="w-8 h-8 shrink-0" />;
                  }
                  const occupied = ocupados.has(id);
                  const selected = seleccionados.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onToggle(id)}
                      title={occupied ? `${id} ocupada` : id}
                      aria-label={`Silla ${id}${occupied ? ", ocupada" : isVipRow(row) ? ", VIP" : ""}`}
                      aria-pressed={selected}
                      disabled={occupied}
                      className={`shrink-0 transition-all duration-150 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${selected ? "scale-110" : !occupied ? "hover:scale-105" : ""} ${occupied ? "cursor-not-allowed" : "cursor-pointer"}`}
                      style={{ background: "none", border: "none", padding: 0, filter: selected ? "drop-shadow(0 0 4px rgba(59,130,246,0.7))" : "none" }}
                    >
                      <SeatIcon colors={colores(id)} occupied={occupied} costura />
                    </button>
                  );
                })}
              </div>
              <span className="w-5 text-center text-gray-600 text-xs font-heading shrink-0">{row}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        <div className="w-4/5 h-4 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-sm" style={{ boxShadow: "0 0 18px 4px rgba(255,255,255,0.15)" }} />
        <span className="text-white/60 text-sm font-heading tracking-[0.3em] uppercase">— Pantalla —</span>
      </div>

      <div className="flex flex-wrap justify-center gap-5 text-xs font-body text-gray-500">
        {[
          { colors: SEAT_COLORS.disponible,   occ: false, label: "Disponible" },
          { colors: SEAT_COLORS.seleccionado, occ: false, label: "Seleccionado" },
          { colors: SEAT_COLORS.ocupado,      occ: true,  label: "Ocupado" },
          { colors: SEAT_COLORS.vip,          occ: false, label: `VIP — ${precioVip}` },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <SeatIcon colors={l.colors} occupied={l.occ} size={18} />
            {l.label}
          </span>
        ))}
      </div>
    </>
  );
}
