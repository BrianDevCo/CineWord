export interface SeatColors { back: string; cushion: string; arm: string }

export const SEAT_COLORS = {
  disponible:   { back: "#CC1244", cushion: "#E8154F", arm: "#A50F36" },
  seleccionado: { back: "#3B82F6", cushion: "#60A5FA", arm: "#2563EB" },
  ocupado:      { back: "#ffffff", cushion: "#ffffff", arm: "#ffffff" },
  vip:          { back: "#EAB308", cushion: "#FDE047", arm: "#CA8A04" },
} satisfies Record<string, SeatColors>;

/** Silla de cine en SVG (mapa y leyenda) */
export default function SeatIcon({ colors, occupied = false, size = 30, costura = false }: {
  colors: SeatColors;
  occupied?: boolean;
  size?: number;
  costura?: boolean;
}) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Respaldo */}
      <rect x="4" y="1" width="22" height="17" rx="5" fill={colors.back} opacity={occupied ? 0.18 : 0.85} />
      {/* Apoyabrazos */}
      <rect x="0" y="13" width="5.5" height="15" rx="2.5" fill={colors.arm} opacity={occupied ? 0.14 : 0.75} />
      <rect x="24.5" y="13" width="5.5" height="15" rx="2.5" fill={colors.arm} opacity={occupied ? 0.14 : 0.75} />
      {/* Cojín */}
      <rect x="4" y="15" width="22" height="13" rx="4" fill={colors.cushion} opacity={occupied ? 0.14 : 0.95} />
      {costura && !occupied && <rect x="7" y="18" width="16" height="7" rx="2.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />}
    </svg>
  );
}
