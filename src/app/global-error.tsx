"use client";

// Se muestra solo si falla el layout raíz; debe incluir <html> y <body> propios
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16 }}>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ letterSpacing: 2 }}>CINEWORLD</h1>
          <p style={{ color: "#aaa" }}>El sitio tuvo un problema inesperado. Intenta de nuevo en unos segundos.</p>
          {error.digest && <p style={{ color: "#555", fontFamily: "monospace", fontSize: 12 }}>Código: {error.digest}</p>}
          <button
            onClick={() => unstable_retry()}
            style={{ background: "#CC1244", color: "#fff", border: 0, padding: "12px 32px", borderRadius: 2, cursor: "pointer", letterSpacing: 2 }}
          >
            REINTENTAR
          </button>
        </div>
      </body>
    </html>
  );
}
