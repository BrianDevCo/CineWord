-- Agrega campo en_hero a peliculas para el carousel del Hero
ALTER TABLE peliculas ADD COLUMN IF NOT EXISTS en_hero boolean DEFAULT false;

-- Agrega campo edad_minima (0 = todo público, 7, 12, 15, 18)
ALTER TABLE peliculas ADD COLUMN IF NOT EXISTS edad_minima integer DEFAULT 0;

-- Por defecto marca la primera pelicula en cartelera como hero
UPDATE peliculas SET en_hero = true WHERE id = (
  SELECT id FROM peliculas WHERE estado = 'en_cartelera' AND activa = true ORDER BY orden LIMIT 1
);
