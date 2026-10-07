# CINEWORLD — Checklist de Entrega al Cliente

> Código 100% terminado. Solo falta configurar infraestructura.
> Tiempo estimado: 2–3 horas si todas las credenciales están a mano.

---

## 1. Supabase (base de datos)

- [ ] Crear proyecto gratis en https://supabase.com
- [ ] SQL Editor → pegar y ejecutar `supabase/schema.sql`
- [ ] SQL Editor → pegar y ejecutar `supabase/seed.sql`
- [ ] SQL Editor → ejecutar `supabase/migration_seguridad.sql` (cierra permisos públicos y crea la tabla de PQR)
- [ ] SQL Editor → ejecutar `supabase/migration_contenido.sql` (precios/combos editables y suscriptores del boletín)
- [ ] Database → Advisors → Security Advisor: sin alertas
- [ ] Authentication → Sign In / Providers → Email: **Confirm email** activado
- [ ] Authentication → activar MFA para las cuentas admin (recomendado)
- [ ] Plan **Pro** (el plan gratis pausa el proyecto por inactividad y no tiene backups diarios)
- [ ] Copiar **Project URL** → pegar en `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copiar **anon public key** → pegar en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copiar **service_role key** → pegar en `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Autenticación

- [ ] Supabase → Authentication → Providers → activar **Google OAuth**
- [ ] Crear app en https://console.cloud.google.com → copiar Client ID y Secret → pegarlos en Supabase
- [ ] Llenar `ADMIN_EMAILS` con los correos de los administradores (separados por coma)

---

## 3. Resend (emails con QR)

- [ ] Crear cuenta en https://resend.com
- [ ] Verificar el dominio del cine (puede tardar unas horas en propagarse)
- [ ] Copiar API Key → pegar en `RESEND_API_KEY`
- [ ] Llenar `RESEND_FROM_EMAIL` con el remitente (ej: `CINEWORLD <noreply@tudominio.com>`)

---

## 4. Wompi (pagos)

- [ ] El cine crea su cuenta de comercio en https://comercios.wompi.co
- [ ] Supabase → SQL Editor → ejecutar `supabase/migration_ordenes_pago.sql`
- [ ] Desarrolladores → copiar las 4 llaves en `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` (primero las de sandbox, luego las de producción)
- [ ] Configurar la URL de eventos apuntando a: `https://tudominio.com/api/pagos/wompi/webhook`

---

## 5. Dominio + Deploy en Vercel

- [ ] Comprar dominio (ej: `cineworld.com.co`)
- [ ] Subir el proyecto a un repositorio GitHub
- [ ] Crear proyecto en https://vercel.com → conectar el repositorio
- [ ] En Vercel → Settings → Environment Variables → pegar **todas** las variables de `.env.local`
- [ ] Cambiar `NEXT_PUBLIC_BASE_URL` a `https://tudominio.com`
- [ ] En Vercel → Domains → conectar el dominio comprado

---

## 6. Variables de entorno completas (referencia)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_SECRET=
WOMPI_INTEGRITY_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PQR_EMAIL=
SCORE_BASE_URL=
SCORE_AES_KEY=
SCORE_TERCERO=
SCORE_PUNTO_VENTA=
SCORE_TEATRO=
NEXT_PUBLIC_CINE_RAZON_SOCIAL=
NEXT_PUBLIC_CINE_NIT=
NEXT_PUBLIC_CINE_TELEFONO=
NEXT_PUBLIC_CINE_EMAIL=
NEXT_PUBLIC_CINE_WHATSAPP=
NEXT_PUBLIC_BASE_URL=
ADMIN_EMAILS=
```

---

## 7. Contenido real (desde el panel /admin)

- [ ] Ingresar al panel en `https://tudominio.com/admin` con el correo admin
- [ ] Crear películas reales: imágenes, sinopsis, director, reparto
- [ ] Programar funciones de la semana (sala, fecha, hora, formato, precios)
- [ ] Verificar configuración de salas (filas, columnas, filas VIP)

---

## 8. Prueba final antes de entregar

- [ ] Hacer compras de prueba en sandbox de Wompi (tarjeta `4242 4242 4242 4242`, Nequi `3991111111`, y un pago rechazado) — ver `docs/WOMPI.md`
- [ ] Verificar que llega el email con el código QR al correo
- [ ] Verificar que la reserva aparece en `/cuenta` del usuario
- [ ] Verificar que la reserva aparece en `/admin/reservas`
- [ ] Probar recuperación de contraseña
- [ ] Revisar que el sitio se ve bien en celular (mobile)

---

## Pendiente del contrato (fase 2)

- [ ] **Integración con Score POS** — bloqueado hasta que el cliente gestione acceso a la API de Score con el proveedor

---

*Desarrollado por Brian López Garzón*
