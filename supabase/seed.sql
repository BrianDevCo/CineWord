-- ================================================================
-- CINEWORLD — Seed
-- Ejecutar DESPUÉS de schema.sql
-- ================================================================

-- ── SALAS ──────────────────────────────────────────────────────
insert into salas (nombre, tipo, filas, columnas, filas_vip) values
  ('Sala 1', '2D', 8, 10, '{}'),
  ('Sala 2', '3D', 8, 10, '{}'),
  ('Sala VIP', 'VIP', 8, 10, array['G','H']);

-- ── PELÍCULAS EN CARTELERA ──────────────────────────────────────
insert into peliculas
  (titulo, genero, filter_genres, duracion, clasificacion, poster_url, backdrop_url,
   badge, badge_color, sinopsis, director, reparto, trailer_search, estado, orden)
values
  (
    'Michael', 'Biopic / Drama', array['Drama'], '138 min', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/j57QWe3OoaXL9Idi9gLtsAybWLP.jpg',
    'https://image.tmdb.org/t/p/original/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg',
    'ESTRENO', 'bg-[#CC1244]',
    'La historia épica de Michael Jackson, el artista más grande de todos los tiempos. Desde sus comienzos con los Jackson 5 hasta convertirse en el Rey del Pop, esta película revela los momentos más íntimos, las batallas personales y el legado imborrable de un hombre que cambió la música para siempre. Protagonizada por Jaafar Jackson, sobrino de Michael, y dirigida por Antoine Fuqua.',
    'Antoine Fuqua', array['Jaafar Jackson','Nia Long','Colman Domingo','Miles Teller'],
    'Michael Jackson biopic 2025 trailer oficial', 'en_cartelera', 1
  ),
  (
    'El Diablo Viste a la Moda 2', 'Comedia / Drama', array['Drama','Comedia'], '115 min', 'PG',
    'https://media.themoviedb.org/t/p/w500/sRTYF65JvbHLoC3LoBj4UKYqIlA.jpg',
    null,
    'EN CARTELERA', 'bg-emerald-600',
    'Miranda Priestly regresa más implacable que nunca al mundo de la moda de lujo. Años después de los eventos de la primera película, Andy Sachs se ha convertido en una destacada periodista de investigación. Cuando sus caminos se cruzan de nuevo, una revelación explosiva pondrá en jaque los cimientos de la industria de la moda.',
    'David Frankel', array['Meryl Streep','Anne Hathaway','Emily Blunt','Stanley Tucci'],
    'The Devil Wears Prada 2 trailer oficial 2025', 'en_cartelera', 2
  ),
  (
    'La Momia', 'Terror / Aventura', array['Terror'], '112 min', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/8L8efNkz8rUmwR7sV0g3vnC9yjn.jpg',
    null,
    'EN CARTELERA', 'bg-emerald-600',
    'Una expedición arqueológica en el desierto de Egipto desentierra accidentalmente a una poderosa sacerdotisa que fue sepultada viva hace miles de años. Al despertar, la criatura trae consigo una oscuridad y un poder destructivo sin precedentes.',
    'Lee Cronin', array['Tom Hiddleston','Sofia Boutella','Annabelle Wallis','Russell Crowe'],
    'La Momia 2025 trailer oficial', 'en_cartelera', 3
  ),
  (
    'Te Van a Matar', 'Thriller / Suspenso', array['Acción'], '98 min', 'R',
    'https://media.themoviedb.org/t/p/w500/6oI4oQKTWMVUlr8Ivqydp28Ruu6.jpg',
    null,
    'EN CARTELERA', 'bg-emerald-600',
    'Un detective retirado recibe un misterioso mensaje que lo obliga a regresar al caso que arruinó su carrera. Lo que comienza como una simple investigación se convierte en una pesadilla de traición, mentiras y violencia.',
    'James Wan', array['Josh Hartnett','Maika Monroe','Ben Mendelsohn','Fionn Whitehead'],
    'They Will Kill You 2025 trailer oficial', 'en_cartelera', 4
  ),
  (
    'Turbulencia', 'Acción / Suspenso', array['Acción'], '105 min', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/jRuiKL4S9UpLma2ZlM47xIu2gbe.jpg',
    null,
    'EN CARTELERA', 'bg-emerald-600',
    'A bordo de un vuelo transatlántico, una amenaza invisible comienza a afectar a los pasajeros uno a uno. La piloto a cargo deberá mantener la calma y resolver el misterio antes de que el avión llegue a su destino.',
    'Roland Emmerich', array['Taron Egerton','Naomi Watts','Jamie Foxx','Lucy Boynton'],
    'Turbulence 2025 movie trailer oficial', 'en_cartelera', 5
  ),
  (
    'Soy Múcura', 'Comedia / Familiar', array['Comedia','Familiar'], '95 min', 'G',
    'https://media.themoviedb.org/t/p/w500/srfONbR9dDLxKVxAqqVOU7OA9Ij.jpg',
    null,
    'NACIONAL', 'bg-yellow-600',
    'Múcura es un simpático duende colombiano que vive en los cerros de Bogotá y tiene una misión especial: proteger los secretos de la naturaleza. Cuando una empresa constructora amenaza su hogar, Múcura deberá hacer equipo con una familia de la ciudad para salvar el bosque encantado.',
    'Carlos Moreno', array['Sebastián Eslava','María Cecilia Botero','Frank Ramírez','Carolina Gaitán'],
    'Soy Múcura pelicula colombiana trailer', 'en_cartelera', 6
  );

-- ── PRÓXIMOS ESTRENOS ──────────────────────────────────────────
insert into peliculas
  (titulo, genero, filter_genres, duracion, clasificacion, poster_url, sinopsis,
   badge, badge_color, estado, fecha_estreno, accent_color, orden)
values
  (
    'Venom: El Último Baile', 'Acción / Superhéroes', array['Acción'], 'Por confirmar', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg',
    'El capítulo final de la saga más oscura del universo de los superhéroes.',
    'PRÓXIMAMENTE', 'bg-blue-600', 'proximo', '2026-05-16', '#4488ff', 7
  ),
  (
    'Núremberg', 'Drama / Historia', array['Drama'], 'Por confirmar', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/7cWTGH2svfNHWVRjsfKIBob9pDj.jpg',
    'El juicio que cambió la historia del mundo, llevado al cine con épica precisión.',
    'PRÓXIMAMENTE', 'bg-yellow-600', 'proximo', '2026-05-30', '#cc9900', 8
  ),
  (
    'Suerte, Diviértete, No Mueras', 'Comedia / Aventura', array['Comedia'], 'Por confirmar', 'PG-13',
    'https://media.themoviedb.org/t/p/w500/rWcfOdY7TU6lTdazWj0ebDZnAfO.jpg',
    'Una comedia de aventuras que redefine el género con un humor explosivo.',
    'PRÓXIMAMENTE', 'bg-green-600', 'proximo', '2026-06-06', '#44cc88', 9
  ),
  (
    'ChaO', 'Drama / Thriller', array['Drama'], 'Por confirmar', 'R',
    'https://media.themoviedb.org/t/p/w500/m723xGi6lyklfsTPdtgEtYJSKcw.jpg',
    'Un thriller psicológico que te mantendrá adivinando hasta el último segundo.',
    'PRÓXIMAMENTE', 'bg-pink-600', 'proximo', '2026-06-20', '#cc4488', 10
  );

-- ── FUNCIONES ─────────────────────────────────────────────────
-- Genera funciones para los próximos 7 días
-- Sala 1 (id=1) = 2D | Sala 2 (id=2) = 3D | Sala VIP (id=3) = VIP
-- Pelicula IDs asumidos según orden de insert: Michael=1, DiabloModa=2, Momia=3, TeVanMatar=4, Turbulencia=5, Mucura=6

do $$
declare
  d date;
  dow integer; -- 0=Sun, 1=Mon, ... 6=Sat
  is_weekend boolean;
begin
  for i in 0..6 loop
    d := current_date + i;
    dow := extract(dow from d);
    is_weekend := (dow = 0 or dow = 6);

    -- MICHAEL (pelicula 1) — 2D + VIP
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (1, 1, d, '12:00', '2D', 15000, 15000),
        (1, 1, d, '14:30', '2D', 15000, 15000),
        (1, 1, d, '17:00', '2D', 15000, 15000),
        (1, 1, d, '20:00', '2D', 15000, 15000),
        (1, 1, d, '22:30', '2D', 15000, 15000),
        (1, 3, d, '16:00', 'VIP', 15000, 25000),
        (1, 3, d, '19:00', 'VIP', 15000, 25000),
        (1, 3, d, '22:00', 'VIP', 15000, 25000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (1, 1, d, '14:00', '2D', 15000, 15000),
        (1, 1, d, '17:00', '2D', 15000, 15000),
        (1, 1, d, '20:00', '2D', 15000, 15000),
        (1, 3, d, '18:30', 'VIP', 15000, 25000),
        (1, 3, d, '21:30', 'VIP', 15000, 25000);
    end if;

    -- EL DIABLO VISTE A LA MODA 2 (pelicula 2) — 2D + 3D + VIP
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (2, 1, d, '12:00', '2D', 15000, 15000),
        (2, 1, d, '14:30', '2D', 15000, 15000),
        (2, 1, d, '17:00', '2D', 15000, 15000),
        (2, 1, d, '19:30', '2D', 15000, 15000),
        (2, 1, d, '22:00', '2D', 15000, 15000),
        (2, 2, d, '13:00', '3D', 18000, 18000),
        (2, 2, d, '15:30', '3D', 18000, 18000),
        (2, 2, d, '18:30', '3D', 18000, 18000),
        (2, 2, d, '21:00', '3D', 18000, 18000),
        (2, 3, d, '16:00', 'VIP', 15000, 25000),
        (2, 3, d, '19:00', 'VIP', 15000, 25000),
        (2, 3, d, '21:30', 'VIP', 15000, 25000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (2, 1, d, '13:30', '2D', 15000, 15000),
        (2, 1, d, '16:30', '2D', 15000, 15000),
        (2, 1, d, '19:30', '2D', 15000, 15000),
        (2, 2, d, '15:00', '3D', 18000, 18000),
        (2, 2, d, '18:00', '3D', 18000, 18000),
        (2, 3, d, '20:30', 'VIP', 15000, 25000);
    end if;

    -- LA MOMIA (pelicula 3) — 2D + 3D
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (3, 1, d, '13:00', '2D', 15000, 15000),
        (3, 1, d, '15:30', '2D', 15000, 15000),
        (3, 1, d, '18:00', '2D', 15000, 15000),
        (3, 1, d, '21:00', '2D', 15000, 15000),
        (3, 1, d, '23:30', '2D', 15000, 15000),
        (3, 2, d, '14:30', '3D', 18000, 18000),
        (3, 2, d, '17:30', '3D', 18000, 18000),
        (3, 2, d, '20:30', '3D', 18000, 18000),
        (3, 2, d, '23:00', '3D', 18000, 18000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (3, 1, d, '15:30', '2D', 15000, 15000),
        (3, 1, d, '18:30', '2D', 15000, 15000),
        (3, 1, d, '21:30', '2D', 15000, 15000),
        (3, 2, d, '17:00', '3D', 18000, 18000),
        (3, 2, d, '20:00', '3D', 18000, 18000);
    end if;

    -- TE VAN A MATAR (pelicula 4) — 2D
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (4, 1, d, '11:00', '2D', 15000, 15000),
        (4, 1, d, '13:30', '2D', 15000, 15000),
        (4, 1, d, '15:30', '2D', 15000, 15000),
        (4, 1, d, '17:30', '2D', 15000, 15000),
        (4, 1, d, '19:30', '2D', 15000, 15000),
        (4, 1, d, '21:30', '2D', 15000, 15000),
        (4, 1, d, '23:30', '2D', 15000, 15000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (4, 1, d, '12:00', '2D', 15000, 15000),
        (4, 1, d, '14:30', '2D', 15000, 15000),
        (4, 1, d, '17:00', '2D', 15000, 15000),
        (4, 1, d, '19:30', '2D', 15000, 15000),
        (4, 1, d, '22:00', '2D', 15000, 15000);
    end if;

    -- TURBULENCIA (pelicula 5) — 2D + VIP
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (5, 1, d, '12:30', '2D', 15000, 15000),
        (5, 1, d, '15:00', '2D', 15000, 15000),
        (5, 1, d, '17:30', '2D', 15000, 15000),
        (5, 1, d, '20:00', '2D', 15000, 15000),
        (5, 1, d, '22:30', '2D', 15000, 15000),
        (5, 3, d, '16:30', 'VIP', 15000, 25000),
        (5, 3, d, '19:30', 'VIP', 15000, 25000),
        (5, 3, d, '22:00', 'VIP', 15000, 25000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (5, 1, d, '14:00', '2D', 15000, 15000),
        (5, 1, d, '17:00', '2D', 15000, 15000),
        (5, 1, d, '20:00', '2D', 15000, 15000),
        (5, 3, d, '21:00', 'VIP', 15000, 25000);
    end if;

    -- SOY MÚCURA (pelicula 6) — 2D
    if is_weekend then
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (6, 1, d, '10:00', '2D', 15000, 15000),
        (6, 1, d, '12:30', '2D', 15000, 15000),
        (6, 1, d, '15:00', '2D', 15000, 15000),
        (6, 1, d, '17:30', '2D', 15000, 15000),
        (6, 1, d, '20:00', '2D', 15000, 15000);
    else
      insert into funciones (pelicula_id, sala_id, fecha, hora, formato, precio_regular, precio_vip) values
        (6, 1, d, '13:00', '2D', 15000, 15000),
        (6, 1, d, '15:30', '2D', 15000, 15000),
        (6, 1, d, '18:00', '2D', 15000, 15000);
    end if;
  end loop;
end;
$$;
