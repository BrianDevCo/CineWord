-- ================================================================
-- CINEWORLD — Schema
-- ================================================================

-- Salas
create table if not exists salas (
  id serial primary key,
  nombre text not null,
  tipo text not null check (tipo in ('2D', '3D', 'VIP')),
  filas integer not null default 8,
  columnas integer not null default 10,
  filas_vip text[] default '{}',
  activa boolean default true,
  score_sala_id text
);

-- Películas
create table if not exists peliculas (
  id serial primary key,
  titulo text not null,
  genero text not null,
  filter_genres text[] not null default '{}',
  duracion text not null,
  clasificacion text not null,
  poster_url text,
  backdrop_url text,
  badge text not null default 'EN CARTELERA',
  badge_color text not null default 'bg-emerald-600',
  sinopsis text,
  director text,
  reparto text[] default '{}',
  trailer_search text,
  estado text not null default 'en_cartelera' check (estado in ('en_cartelera', 'proximo', 'retirada')),
  fecha_estreno date,
  activa boolean default true,
  orden integer default 0,
  accent_color text default '#CC1244',
  score_pelicula_id text,
  created_at timestamptz default now()
);

-- Funciones (funciones individuales: fecha + hora + sala + formato)
create table if not exists funciones (
  id serial primary key,
  pelicula_id integer not null references peliculas(id) on delete cascade,
  sala_id integer not null references salas(id),
  fecha date not null,
  hora time not null,
  formato text not null check (formato in ('2D', '3D', 'VIP')),
  precio_regular integer not null default 15000,
  precio_vip integer not null default 25000,
  activa boolean default true,
  score_pelicula_id text,
  score_sala_id text,
  score_tarifa_regular text,
  score_tarifa_vip text,
  created_at timestamptz default now()
);

create index if not exists idx_funciones_pelicula_fecha on funciones(pelicula_id, fecha);

-- Reservas
create table if not exists reservas (
  id serial primary key,
  funcion_id integer not null references funciones(id),
  email text not null,
  nombre text not null,
  telefono text,
  asientos jsonb not null default '[]',
  total integer not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado')),
  referencia_pago text,
  qr_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

-- Asientos ocupados por función
create table if not exists asientos_ocupados (
  id serial primary key,
  funcion_id integer not null references funciones(id) on delete cascade,
  fila text not null,
  columna integer not null,
  reserva_id integer references reservas(id),
  unique(funcion_id, fila, columna)
);

create index if not exists idx_asientos_funcion on asientos_ocupados(funcion_id);

-- Notificaciones de próximos estrenos
create table if not exists notificaciones_estreno (
  id serial primary key,
  pelicula_id integer not null references peliculas(id) on delete cascade,
  email text not null,
  created_at timestamptz default now(),
  unique(pelicula_id, email)
);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================
alter table peliculas enable row level security;
alter table salas enable row level security;
alter table funciones enable row level security;
alter table reservas enable row level security;
alter table asientos_ocupados enable row level security;
alter table notificaciones_estreno enable row level security;

-- Lectura pública para catálogo
create policy "peliculas_read" on peliculas for select using (activa = true);
create policy "salas_read" on salas for select using (activa = true);
create policy "funciones_read" on funciones for select using (activa = true);
create policy "asientos_read" on asientos_ocupados for select using (true);

-- Insertar reservas y asientos (anon puede comprar)
create policy "reservas_insert" on reservas for insert with check (true);
create policy "asientos_insert" on asientos_ocupados for insert with check (true);

-- Notificaciones
create policy "notificaciones_insert" on notificaciones_estreno for insert with check (true);
create policy "notificaciones_read" on notificaciones_estreno for select using (true);
