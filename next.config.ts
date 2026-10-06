import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP que se aplica ya: directivas que no pueden romper nada del sitio
const cspEnforced = [
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.wompi.co",
].join("; ");

// CSP completa en modo "solo reporte": avisa en la consola del navegador lo que
// bloquearía. Tras probar el pago con Wompi sin avisos, moverla a cspEnforced.
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.wompi.co`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.wompi.co",
  "frame-src https://*.wompi.co https://maps.google.com https://www.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.wompi.co",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspEnforced },
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.themoviedb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "prodcdnmobisoft.oxxodomicilios.com",
      },
    ],
  },
};

export default nextConfig;
