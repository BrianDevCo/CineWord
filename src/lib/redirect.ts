/** Solo rutas internas ("/algo"). Bloquea "//evil.com", "/\evil.com", "javascript:..." */
export function safeRedirect(raw: string | null | undefined, fallback = "/cuenta"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  // Barras invertidas y caracteres de control: los navegadores los normalizan a "//"
  if (/[\u0000-\u001f\\]/.test(raw)) return fallback;
  return raw;
}
