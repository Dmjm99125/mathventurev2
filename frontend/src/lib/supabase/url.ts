const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function validateSupabaseUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Supabase URL must be a valid URL.");
  }

  if (parsed.protocol === "https:") {
    return rawUrl.trim();
  }

  if (parsed.protocol === "http:" && LOOPBACK_HOSTNAMES.has(parsed.hostname)) {
    return rawUrl.trim();
  }

  throw new Error("Supabase URL must use HTTPS except for local loopback development.");
}
