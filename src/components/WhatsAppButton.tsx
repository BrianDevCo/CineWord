"use client";

import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/cine";

// Botón flotante de WhatsApp. Solo aparece si NEXT_PUBLIC_CINE_WHATSAPP está configurado
// y nunca en el panel admin ni en el flujo de pago.
export default function WhatsAppButton() {
  const pathname = usePathname();
  const url = whatsappUrl();
  if (!url || pathname.startsWith("/admin") || pathname.startsWith("/pago")) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      // En la página de película se oculta en celular para no tapar la barra de compra
      className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] shadow-lg shadow-black/40 items-center justify-center transition-transform hover:scale-105 ${pathname.startsWith("/pelicula") ? "hidden sm:flex" : "flex"}`}
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" aria-hidden="true">
        <path d="M16.004 3C8.832 3 3 8.832 3 16.004c0 2.293.6 4.53 1.74 6.505L3 29l6.66-1.708A12.95 12.95 0 0 0 16.004 29C23.172 29 29 23.168 29 16.004 29 8.832 23.172 3 16.004 3Zm0 23.64c-1.996 0-3.95-.537-5.656-1.552l-.405-.24-3.953 1.013 1.055-3.852-.264-.395a10.6 10.6 0 0 1-1.633-5.61c0-5.868 4.776-10.643 10.656-10.643 5.868 0 10.64 4.775 10.64 10.643 0 5.88-4.772 10.636-10.44 10.636Zm5.832-7.973c-.32-.16-1.89-.932-2.184-1.038-.293-.107-.506-.16-.72.16-.213.32-.826 1.038-1.013 1.252-.186.213-.373.24-.693.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.894-1.778-2.214-.187-.32-.02-.493.14-.652.144-.143.32-.373.48-.56.16-.186.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.624-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.094-1.12 2.668 0 1.573 1.147 3.094 1.307 3.307.16.214 2.257 3.447 5.468 4.833.764.33 1.36.527 1.825.674.767.244 1.465.21 2.017.127.615-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373Z" />
      </svg>
    </a>
  );
}
