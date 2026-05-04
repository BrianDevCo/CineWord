import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de tratamiento de datos personales de CINEWORLD, conforme a la Ley 1581 de 2012.",
};

const SECTIONS = [
  {
    title: "1. Responsable del Tratamiento",
    content: `CINEWORLD, establecimiento comercial ubicado en el Centro Comercial MR Outlet, Cali, Valle del Cauca, Colombia, es el responsable del tratamiento de los datos personales recolectados a través de este sitio web.`,
  },
  {
    title: "2. Datos que Recolectamos",
    content: `Recolectamos los siguientes datos cuando usas nuestros servicios:\n• Nombre completo\n• Correo electrónico\n• Número de teléfono (opcional)\n• Información de pago (procesada directamente por MercadoPago — no almacenamos datos de tarjetas)\n• Historial de reservas y compras realizadas en el sitio`,
  },
  {
    title: "3. Finalidad del Tratamiento",
    content: `Utilizamos tus datos para:\n• Procesar y confirmar la compra de boletos\n• Enviar el boleto con código QR al correo electrónico registrado\n• Notificarte sobre el estreno de películas que marcaste\n• Enviarte información sobre cartelera y promociones (si te suscribiste)\n• Cumplir con obligaciones legales y fiscales`,
  },
  {
    title: "4. Base Legal",
    content: `El tratamiento de tus datos se realiza con base en:\n• Tu consentimiento expreso al registrarte o realizar una compra\n• La ejecución del contrato de compraventa de boletos\n• El cumplimiento de obligaciones legales aplicables\n\nEsta política se rige por la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.`,
  },
  {
    title: "5. Conservación de Datos",
    content: `Conservamos tus datos personales mientras mantengas una cuenta activa en nuestro sitio y por el tiempo adicional necesario para cumplir obligaciones legales (máximo 5 años tras la última transacción).`,
  },
  {
    title: "6. Compartición con Terceros",
    content: `Tus datos pueden ser compartidos únicamente con:\n• MercadoPago: para procesar pagos de forma segura\n• Resend: para el envío de correos electrónicos transaccionales\n• Supabase: como proveedor de base de datos segura\n\nNo vendemos, alquilamos ni compartimos tus datos con terceros para fines publicitarios.`,
  },
  {
    title: "7. Tus Derechos",
    content: `Como titular de los datos tienes derecho a:\n• Conocer, actualizar y rectificar tus datos personales\n• Solicitar la supresión de tus datos cuando no sean necesarios\n• Revocar la autorización de tratamiento\n• Acceder gratuitamente a tus datos\n\nPara ejercer estos derechos, escríbenos a través de nuestra sección de Contacto o a través del formulario de PQR.`,
  },
  {
    title: "8. Seguridad",
    content: `Implementamos medidas técnicas y administrativas para proteger tus datos, incluyendo cifrado en tránsito (HTTPS), autenticación segura y acceso restringido a la información.`,
  },
  {
    title: "9. Cookies",
    content: `Nuestro sitio utiliza cookies de sesión estrictamente necesarias para el funcionamiento de la autenticación. No utilizamos cookies de rastreo publicitario.`,
  },
  {
    title: "10. Cambios a esta Política",
    content: `Podemos actualizar esta política en cualquier momento. Los cambios significativos serán comunicados por correo electrónico a los usuarios registrados. La versión vigente siempre estará disponible en esta página.`,
  },
];

export default function PrivacidadPage() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-heading text-xs tracking-widest transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          VOLVER AL INICIO
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[#CC1244] font-heading tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-[#CC1244]" />
            Legal
          </p>
          <h1 className="font-heading text-4xl font-bold text-white tracking-wider mb-4">
            POLÍTICA DE PRIVACIDAD
          </h1>
          <p className="text-gray-500 font-body text-sm">
            Última actualización: mayo de 2025 · Ley 1581 de 2012 — Colombia
          </p>
        </div>

        {/* Intro */}
        <p className="text-gray-400 font-body leading-relaxed mb-10">
          En CINEWORLD nos comprometemos a proteger tu privacidad. Esta política explica qué datos recolectamos, cómo los usamos y cuáles son tus derechos como titular de la información.
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="border-l-2 border-white/10 pl-6">
              <h2 className="font-heading text-base font-bold text-white tracking-wider mb-3">
                {section.title}
              </h2>
              <div className="text-gray-400 font-body text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 p-6 bg-[#111] border border-white/10 rounded-xl">
          <p className="text-gray-500 font-body text-sm text-center">
            ¿Tienes preguntas sobre el manejo de tus datos?{" "}
            <Link href="/pqr" className="text-[#CC1244] hover:underline">
              Contáctanos a través del formulario de PQR
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
