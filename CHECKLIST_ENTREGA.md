# CINEWORLD — Checklist de Entrega al Cliente

> Código 100% terminado. Solo falta configurar infraestructura.
> Tiempo estimado: 2–3 horas si todas las credenciales están a mano.

---

## 1. Supabase (base de datos)

- [ ] Crear proyecto gratis en https://supabase.com
- [ ] SQL Editor → pegar y ejecutar `supabase/schema.sql`
- [ ] SQL Editor → pegar y ejecutar `supabase/seed.sql`
- [ ] Copiar **Project URL** → pegar en `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copiar **anon public key** → pegar en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copiar **service_role key** → pegar en `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Autenticación

- [ ] Supabase → Authentication → Providers → activar **Google OAuth**
- [ ] Crear app en https://console.cloud.google.com → copiar Client ID y Secret → pegarlos en Supabase
- [ ] Llenar `ADMIN_EMAIL` con el correo del administrador del cine

---

## 3. Resend (emails con QR)

- [ ] Crear cuenta en https://resend.com
- [ ] Verificar el dominio del cine (puede tardar unas horas en propagarse)
- [ ] Copiar API Key → pegar en `RESEND_API_KEY`
- [ ] Llenar `RESEND_FROM_EMAIL` con el remitente (ej: `CINEWORLD <noreply@tudominio.com>`)

---

## 4. MercadoPago — Producción

- [ ] En el panel de MP → cambiar tokens **TEST** por los de **producción**
- [ ] Actualizar `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY`
- [ ] Configurar webhook en MP apuntando a: `https://tudominio.com/api/pagos/webhook`
- [ ] Copiar **webhook secret** → pegar en `MP_WEBHOOK_SECRET`

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
MP_ACCESS_TOKEN=
NEXT_PUBLIC_MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_BASE_URL=
ADMIN_EMAIL=
```

---

## 7. Contenido real (desde el panel /admin)

- [ ] Ingresar al panel en `https://tudominio.com/admin` con el correo admin
- [ ] Crear películas reales: imágenes, sinopsis, director, reparto
- [ ] Programar funciones de la semana (sala, fecha, hora, formato, precios)
- [ ] Verificar configuración de salas (filas, columnas, filas VIP)

---

## 8. Prueba final antes de entregar

- [ ] Hacer una compra completa con tarjeta de prueba de MercadoPago
  → Tarjetas de prueba: https://www.mercadopago.com.co/developers/es/docs/checkout-bricks/additional-content/your-integrations/test/cards
- [ ] Verificar que llega el email con el código QR al correo
- [ ] Verificar que la reserva aparece en `/cuenta` del usuario
- [ ] Verificar que la reserva aparece en `/admin/reservas`
- [ ] Probar recuperación de contraseña
- [ ] Revisar que el sitio se ve bien en celular (mobile)

---

## Pendiente del contrato (fase 2)

- [ ] **Integración con Score POS** — bloqueado hasta que el cliente gestione acceso a la API de Score con el proveedor

---

*Desarrollado por Brian López Garzón — brian280499@gmail.com — 3128599206*
