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
    default: "CINEWORLD — Cine en Cali | Cartelera y Horarios",
  },
  description:
    "CINEWORLD Cali — Consulta la cartelera actualizada, horarios, combos y promociones. Ubicado en el Centro Comercial MR Outlet, Cali, Valle del Cauca.",
  keywords: [
    "cine Cali",
    "cine en Cali",
    "CINEWORLD",
    "CINEWORLD Cali",
    "cartelera Cali",
    "cartelera de cine Cali",
    "películas Cali",
    "cine MR Outlet",
    "Centro Comercial MR Outlet",
    "cine Valle del Cauca",
    "cine Colombia",
    "horarios cine Cali",
    "estrenos Cali",
    "cine cerca de mí",
    "cineworldmr",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: BASE_URL,
    siteName: "CINEWORLD Cali",
    title: "CINEWORLD — Cine en Cali | Cartelera y Horarios",
    description: "Cartelera actualizada, horarios y combos en CINEWORLD, Centro Comercial MR Outlet, Cali.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CINEWORLD Cali — Cartelera y Horarios",
    description: "Cartelera actualizada y horarios en CINEWORLD Cali, MR Outlet.",
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
