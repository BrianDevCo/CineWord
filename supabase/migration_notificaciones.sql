-- Tabla para avisos de próximos estrenos
CREATE TABLE IF NOT EXISTS notificaciones_estreno (
  id          bigserial PRIMARY KEY,
  email       text NOT NULL,
  pelicula_id integer NOT NULL REFERENCES peliculas(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (email, pelicula_id)
);

-- RLS: solo el servidor puede insertar (anon no puede leer)
ALTER TABLE notificaciones_estreno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_notificaciones" ON notificaciones_estreno
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
