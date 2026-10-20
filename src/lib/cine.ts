// Datos del establecimiento: un solo lugar para footer, contacto, legales y correos.
// Los datos legales se configuran con variables de entorno (Vercel → Environment Variables);
// si están vacíos, simplemente no se muestran.

const env = (v: string | undefined) => (v ?? "").trim();

export const CINE = {
  nombre: "CINEWORLD",
  razonSocial: env(process.env.NEXT_PUBLIC_CINE_RAZON_SOCIAL),
  nit: env(process.env.NEXT_PUBLIC_CINE_NIT),
  telefono: env(process.env.NEXT_PUBLIC_CINE_TELEFONO),
  email: env(process.env.NEXT_PUBLIC_CINE_EMAIL),
  /** Número de WhatsApp con indicativo, solo dígitos. Ej: 573001234567 */
  whatsapp: env(process.env.NEXT_PUBLIC_CINE_WHATSAPP).replace(/\D/g, ""),

  lugar: "Centro Comercial MR Outlet",
  direccion: "Finca Veracruz, Autopista Cali – Candelaria, Lote 5",
  ciudad: "Candelaria, Valle del Cauca",
  mapsQuery: "3.4161865,-76.4573024",

  /** Horario de atención: se muestra en la sección Horarios y en Contacto */
  apertura: { hora: "2", min: "15", ampm: "PM" },
  cierre:   { hora: "9", min: "30", ampm: "PM" },
  instagram: { usuario: "@cineworldmr", url: "https://www.instagram.com/cineworldmr/" },
};

export function whatsappUrl(mensaje = "Hola CINEWORLD, tengo una pregunta") {
  return CINE.whatsapp ? `https://wa.me/${CINE.whatsapp}?text=${encodeURIComponent(mensaje)}` : null;
}

export const HORARIO_ATENCION =
  `Todos los días · ${CINE.apertura.hora}:${CINE.apertura.min} ${CINE.apertura.ampm} — ${CINE.cierre.hora}:${CINE.cierre.min} ${CINE.cierre.ampm}`;

export const DIRECCION_COMPLETA = `${CINE.lugar} — ${CINE.direccion}, ${CINE.ciudad}`;
