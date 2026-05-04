import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso del sitio web y servicio de venta de boletos de CINEWORLD.",
};

const SECTIONS = [
  {
    title: "1. Aceptación de los Términos",
    content: `Al acceder y usar este sitio web, o al realizar una compra de boletos, aceptas quedar vinculado por los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices nuestros servicios.`,
  },
  {
    title: "2. Descripción del Servicio",
    content: `CINEWORLD ofrece un sistema de venta en línea de boletos para las funciones de cine programadas en sus instalaciones ubicadas en el Centro Comercial MR Outlet, Cali, Colombia. El servicio incluye la selección de funciones, asientos y el pago a través de la plataforma MercadoPago.`,
  },
  {
    title: "3. Proceso de Compra",
    content: `3.1 Para comprar boletos debes crear una cuenta o iniciar sesión.\n3.2 Una vez seleccionada la función y los asientos, tienes 5 minutos para completar el pago. Pasado este tiempo, la reserva se libera.\n3.3 El pago se procesa a través de MercadoPago. CINEWORLD no almacena datos de tarjetas de crédito o débito.\n3.4 Al aprobarse el pago, recibirás un correo electrónico con el boleto y su código QR.`,
  },
  {
    title: "4. Precios y Pagos",
    content: `4.1 Todos los precios están expresados en pesos colombianos (COP) e incluyen impuestos aplicables.\n4.2 MercadoPago puede cobrar comisiones adicionales según el método de pago seleccionado.\n4.3 CINEWORLD se reserva el derecho de modificar los precios sin previo aviso, sin que esto afecte compras ya confirmadas.`,
  },
  {
    title: "5. Política de Devoluciones y Cancelaciones",
    content: `5.1 Los boletos comprados en línea no tienen devolución una vez confirmado el pago, salvo en los siguientes casos:\n• Cancelación o cambio de función por parte de CINEWORLD\n• Error técnico comprobable en el proceso de compra\n\n5.2 En los casos exceptuados, el reembolso se realizará al mismo método de pago utilizado, en el plazo que determine MercadoPago (generalmente 3 a 15 días hábiles).\n\n5.3 Para solicitar un reembolso, usa el formulario de PQR o comunícate con nosotros antes de la hora de la función.`,
  },
  {
    title: "6. Uso del Código QR",
    content: `6.1 El código QR recibido por correo es el único documento válido para acceder a la sala.\n6.2 Cada código QR es de uso único y personal.\n6.3 CINEWORLD no se hace responsable por la pérdida o reenvío no autorizado del código QR por parte del usuario.`,
  },
  {
    title: "7. Registro y Seguridad de la Cuenta",
    content: `7.1 Eres responsable de mantener la confidencialidad de tu contraseña.\n7.2 Toda actividad realizada desde tu cuenta es tu responsabilidad.\n7.3 En caso de acceso no autorizado, debes notificarnos de inmediato a través del formulario de PQR.`,
  },
  {
    title: "8. Conducta en el Cine",
    content: `El ingreso a las instalaciones de CINEWORLD implica la aceptación de las normas de convivencia del establecimiento, las cuales incluyen restricciones de clasificación por edades establecidas por el Ministerio de Cultura de Colombia. CINEWORLD puede negar el acceso a personas que no cumplan la clasificación de la película adquirida.`,
  },
  {
    title: "9. Propiedad Intelectual",
    content: `El diseño, logotipos, textos, imágenes y demás contenidos de este sitio web son propiedad de CINEWORLD o de sus respectivos titulares. Queda prohibida su reproducción total o parcial sin autorización escrita.`,
  },
  {
    title: "10. Limitación de Responsabilidad",
    content: `CINEWORLD no será responsable por daños indirectos, pérdida de datos o interrupciones del servicio causadas por terceros (proveedores de pago, servicios de internet, etc.). La responsabilidad máxima de CINEWORLD se limita al valor del boleto adquirido.`,
  },
  {
    title: "11. Ley Aplicable y Jurisdicción",
    content: `Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia será sometida a los jueces y tribunales competentes de la ciudad de Cali, Valle del Cauca.`,
  },
  {
    title: "12. Modificaciones",
    content: `CINEWORLD puede modificar estos Términos en cualquier momento. El uso continuado del sitio tras la publicación de cambios implica la aceptación de los nuevos términos.`,
  },
];

export default function TerminosPage() {
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
            TÉRMINOS Y CONDICIONES
          </h1>
          <p className="text-gray-500 font-body text-sm">
            Última actualización: mayo de 2025
          </p>
        </div>

        {/* Intro */}
        <p className="text-gray-400 font-body leading-relaxed mb-10">
          Estos Términos y Condiciones regulan el uso del sitio web de CINEWORLD y la compra de boletos a través de nuestra plataforma en línea. Por favor léelos antes de realizar una compra.
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
            ¿Tienes preguntas sobre nuestros términos?{" "}
            <Link href="/pqr" className="text-[#CC1244] hover:underline">
              Escríbenos a través del formulario de PQR
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
