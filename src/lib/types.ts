export interface Sala {
  id: number;
  nombre: string;
  tipo: "2D" | "3D" | "VIP";
  filas: number;
  columnas: number;
  filas_vip: string[];
  activa: boolean;
}

export interface Pelicula {
  id: number;
  titulo: string;
  genero: string;
  filter_genres: string[];
  duracion: string;
  clasificacion: string;
  poster_url: string | null;
  backdrop_url: string | null;
  badge: string;
  badge_color: string;
  sinopsis: string | null;
  director: string | null;
  reparto: string[];
  trailer_search: string | null;
  estado: "en_cartelera" | "proximo" | "retirada";
  fecha_estreno: string | null;
  activa: boolean;
  orden: number;
  accent_color: string;
  created_at: string;
}

export interface Funcion {
  id: number;
  pelicula_id: number;
  sala_id: number;
  fecha: string;       // "YYYY-MM-DD"
  hora: string;        // "HH:MM:SS"
  formato: "2D" | "3D" | "VIP";
  precio_regular: number;
  precio_vip: number;
  activa: boolean;
  sala?: Sala;
}

export interface AsientoOcupado {
  id: number;
  funcion_id: number;
  fila: string;
  columna: number;
  reserva_id: number | null;
}

export interface Reserva {
  id: number;
  funcion_id: number;
  email: string;
  nombre: string;
  telefono: string | null;
  asientos: Array<{ fila: string; columna: number; tipo: "regular" | "vip" }>;
  total: number;
  estado: "pendiente" | "pagado" | "cancelado";
  referencia_pago: string | null;
  qr_token: string;
  created_at: string;
}

export interface NotificacionEstreno {
  id: number;
  pelicula_id: number;
  email: string;
  created_at: string;
}

// Supabase Database type (mínimo para el cliente tipado)
export interface Database {
  public: {
    Tables: {
      peliculas: { Row: Pelicula; Insert: Omit<Pelicula, "id" | "created_at">; Update: Partial<Pelicula> };
      salas: { Row: Sala; Insert: Omit<Sala, "id">; Update: Partial<Sala> };
      funciones: { Row: Funcion; Insert: Omit<Funcion, "id">; Update: Partial<Funcion> };
      reservas: { Row: Reserva; Insert: Omit<Reserva, "id" | "created_at" | "qr_token">; Update: Partial<Reserva> };
      asientos_ocupados: { Row: AsientoOcupado; Insert: Omit<AsientoOcupado, "id">; Update: Partial<AsientoOcupado> };
      notificaciones_estreno: { Row: NotificacionEstreno; Insert: Omit<NotificacionEstreno, "id" | "created_at">; Update: Partial<NotificacionEstreno> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
