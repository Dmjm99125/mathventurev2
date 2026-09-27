import { assertEquals } from "jsr:@std/assert";
import { errorResponse, jsonResponse } from "../../../../supabase/functions/_shared/cors.ts";

Deno.test("jsonResponse preserves JSON body/status and adds security headers", async () => {
  const response = jsonResponse({ ok: true }, 201);

  assertEquals(response.status, 201);
  assertEquals(response.headers.get("content-type"), "application/json");
  assertEquals(response.headers.get("cache-control"), "no-store");
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(await response.json(), { ok: true });
});

Deno.test("errorResponse keeps the shared security headers", async () => {
  const response = errorResponse("Invalid request", 422);

  assertEquals(response.status, 422);
  assertEquals(response.headers.get("cache-control"), "no-store");
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(await response.json(), { error: "Invalid request" });
});
