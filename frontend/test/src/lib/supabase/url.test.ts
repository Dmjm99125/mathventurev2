import { assertEquals, assertThrows } from "jsr:@std/assert";
import { validateSupabaseUrl } from "../../../../src/lib/supabase/url.ts";

Deno.test("validateSupabaseUrl accepts hosted HTTPS Supabase URLs", () => {
  assertEquals(
    validateSupabaseUrl("https://pnylrdcrsjjovingigab.supabase.co"),
    "https://pnylrdcrsjjovingigab.supabase.co",
  );
});

Deno.test("validateSupabaseUrl accepts loopback HTTP for local development", () => {
  for (const url of [
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://[::1]:54321",
  ]) {
    assertEquals(validateSupabaseUrl(url), url);
  }
});

Deno.test("validateSupabaseUrl rejects non-loopback HTTP", () => {
  assertThrows(
    () => validateSupabaseUrl("http://supabase.example.com"),
    Error,
    "Supabase URL must use HTTPS except for local loopback development.",
  );
});

Deno.test("validateSupabaseUrl rejects non-HTTP protocols", () => {
  assertThrows(
    () => validateSupabaseUrl("ftp://supabase.example.com"),
    Error,
    "Supabase URL must use HTTPS except for local loopback development.",
  );
});

Deno.test("validateSupabaseUrl rejects malformed URLs", () => {
  assertThrows(
    () => validateSupabaseUrl("not a url"),
    Error,
    "Supabase URL must be a valid URL.",
  );
});
