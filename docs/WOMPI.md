# Integración Wompi — notas técnicas

Fuente: https://docs.wompi.co/docs/colombia/ (revisado 2026-10-06)

## Ambientes y llaves

| | Sandbox | Producción |
|---|---|---|
| API base | `https://sandbox.wompi.co/v1` | `https://production.wompi.co/v1` |
| Llave pública (navegador) | `pub_test_...` | `pub_prod_...` |
| Llave privada (servidor) | `prv_test_...` | `prv_prod_...` |
| Secreto de eventos (webhook) | `test_events_...` | `prod_events_...` |
| Secreto de integridad (firma) | `test_integrity_...` | `prod_integrity_...` |

Las llaves se sacan en https://comercios.wompi.co. Las llaves de un ambiente solo sirven con la URL de ese ambiente.

Variables de entorno (el ambiente se deduce del prefijo de `WOMPI_PRIVATE_KEY`):

```
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_SECRET=
WOMPI_INTEGRITY_SECRET=
```

## Checkout (Widget)

Script: `https://checkout.wompi.co/widget.js`

```js
const checkout = new WidgetCheckout({
  currency: "COP",
  amountInCents: 2490000,          // $24.900 → x100
  reference: "CW-123-abc",         // única, [A-Za-z0-9_-]
  publicKey: "pub_test_...",
  signature: { integrity: "<sha256 calculado en el servidor>" },
  redirectUrl: "https://dominio/pago/resultado",
  expirationTime: "2026-10-06T20:15:00.000Z", // opcional, ISO8601
  customerData: { email, fullName, phoneNumber },
});
checkout.open((result) => { result.transaction.id; result.transaction.status; });
```

Alternativa sin JS: Web Checkout, un `<form method="GET" action="https://checkout.wompi.co/p/">` con los mismos campos en guiones (`public-key`, `amount-in-cents`, `signature:integrity`, `redirect-url`, `expiration-time`, `customer-data:email`, ...).

## Firma de integridad (SIEMPRE en el servidor)

```
sha256( reference + amountInCents + currency + [expirationTime] + WOMPI_INTEGRITY_SECRET )
```

Ejemplo de la cadena: `sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_...`

## Consultar transacción

`GET {WOMPI_API_URL}/transactions/{id}` con `Authorization: Bearer prv_...`

Campos: `id`, `reference`, `status`, `amount_in_cents`, `currency`, `payment_method_type`, `status_message`.
Estados: `PENDING`, `APPROVED`, `DECLINED`, `VOIDED` (solo tarjetas), `ERROR`.

No hay un endpoint documentado para buscar por referencia, así que hay que guardar `transaction.id` cuando llega.

## Webhook (eventos)

- Se configura la URL en el panel de comercios, por ejemplo `https://dominio/api/pagos/wompi/webhook`.
- Evento relevante: `transaction.updated`. Llega cuando la transacción queda en estado final.
- Cuerpo: `{ event, data: { transaction: {...} }, environment, signature: { properties: [...], checksum }, timestamp, sent_at }`
- Verificación: concatenar los valores de `signature.properties` (rutas dentro de `data`, ej. `transaction.id`, `transaction.status`, `transaction.amount_in_cents`) en orden, luego `timestamp` y luego `WOMPI_EVENTS_SECRET`, y aplicar SHA256. Comparar contra `signature.checksum` (también viene en el header `X-Event-Checksum`).
- Responder **200**. Si no, Wompi reintenta a los 30 min, 3 h y 24 h (máximo 3 reintentos), así que el handler debe ser **idempotente**.

## Datos de prueba (sandbox)

| Medio | Aprobado | Rechazado |
|---|---|---|
| Tarjeta | `4242 4242 4242 4242` | `4111 1111 1111 1111` |
| Nequi | `3991111111` | `3992222222` |
| PSE (API) | `financial_institution_code: "1"` | `"2"` |
| Daviplata (OTP) | `574829` | `932015` |
| Botón Bancolombia | se elige el resultado en `async_payment_url` | |

Cualquier otro número da `ERROR`.

## Cómo encaja en CineWorld

Flujo actual (MercadoPago): `BookingSection` → `/api/pagos/crear-preferencia` → Brick paga en la página → el navegador llama a `/api/pagos/confirmar` con todos los datos → Score venta + reserva Supabase + email QR.

Flujo implementado (Wompi):

1. **`POST /api/pagos/wompi/iniciar`**: valida el monto contra la BD, guarda la **orden pendiente** en `ordenes_pago` y devuelve `reference`, `amountInCents`, `signature`, `expirationTime` (10 min) y `redirectUrl`.
2. **`WompiCheckout.tsx`** abre el widget. Al terminar, el navegador va a `/pago/resultado?id=<tx>`.
3. **`POST /api/pagos/wompi/webhook`** verifica el checksum y llama a `procesarTransaccion` (`src/lib/ordenes.ts`).
4. **`/pago/resultado`** consulta la transacción en Wompi, llama a `procesarTransaccion` como respaldo y redirige a `/pago/exito`, `/pago/pendiente?id=` (se reconsulta cada 5 s) o `/pago/fallo`. Si el pago fue aprobado pero falló la reserva, muestra "PAGO RECIBIDO" con el número de pago.
5. **`procesarTransaccion`** es idempotente: reclama la orden con un `UPDATE ... WHERE estado IN ('pendiente','rechazado')` atómico; solo quien la reclama hace la venta en Score, la reserva y el email. Si el monto no coincide o algo falla, la orden queda en `estado = 'error'` con el detalle en `error` para revisión manual.
6. **Migración**: `supabase/migration_ordenes_pago.sql`.

### Riesgo: hold de sillas en Score

- Hoy el apartado es un temporizador de 5 min **en el navegador** (`BookingSection.tsx`), que llama a `/api/score/liberar` al expirar.
- Con PSE, Nequi o Bancolombia el usuario sale de la página, así que ese temporizador se pierde.
- Opciones a evaluar:
  - Usar `expirationTime` del widget igual al vencimiento del hold, para que Wompi no deje pagar después.
  - Ampliar el tiempo del hold durante el pago (por ejemplo 10–15 min).
  - Liberar las sillas desde el servidor cuando la orden vence sin pago.
  - Si llega un pago aprobado con la orden ya vencida y las sillas ocupadas, marcarlo para reembolso o anulación manual.
- Pendiente: confirmar con Score cuánto dura una preventa (SCOGRU con acción "R") si nadie la libera.

### Pendiente

- Probar en sandbox con las llaves del cine.
- Panel admin `/admin/pagos` lista las órdenes en `error` o `procesando` para resolverlas a mano.
- `middleware.ts` redirige todo a `/retirado` con `SITIO_ACTIVO = false`, incluido el webhook; hay que activar el sitio para recibir eventos.
