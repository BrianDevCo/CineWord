import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://cineworld.com.co";

export const metadata: Metadata = {
  title: {
    template: "%s | CINEWORLD",
    default: "CINEWORLD — Vive la Magia del Cine",
  },
  description:
    "Compra tus boletos en línea, consulta la cartelera, horarios y promociones de CINEWORLD. Ubicado en el Centro Comercial MR Outlet.",
  keywords: ["cine", "boletos", "cartelera", "CINEWORLD", "MR Outlet", "películas Colombia"],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: BASE_URL,
    siteName: "CINEWORLD",
    title: "CINEWORLD — Vive la Magia del Cine",
    description: "Compra tus boletos en línea. Cartelera, horarios y promociones en CINEWORLD.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CINEWORLD — Vive la Magia del Cine",
    description: "Compra tus boletos en línea. Cartelera, horarios y promociones.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${oswald.variable} ${inter.variable}`} suppressHydrationWarning>
      {/* Script inline para evitar flash de tema incorrecto al cargar */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('cw-theme');if(t)document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
