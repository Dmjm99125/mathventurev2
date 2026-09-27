# Secure App-Data Transport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce HTTPS/TLS as MathVenture's app-data transport boundary without exposing an encryption key in the frontend or changing request/response payloads.

**Architecture:** Validate the Supabase origin once when the frontend creates its clients, allowing HTTPS everywhere and HTTP only for loopback development. Add shared no-store and MIME-sniffing response headers to every Supabase Edge Function response while preserving existing CORS, status, and JSON behavior. Document the boundary so future work does not reintroduce a frontend transport key.

**Tech Stack:** React 19, TypeScript, Vite, Supabase JS, Supabase Edge Functions on Deno, Deno tests.

## Global Constraints

- Do not add `VITE_TRANSPORT_ENCRYPTION_KEY` or any other transport secret to frontend code, `.env`, or the built bundle.
- Do not add an application-level AES request/response envelope, handshake, database migration, or extra network round trip.
- Keep Supabase Auth traffic out of scope; it continues through the existing Supabase SDK.
- Preserve all existing request methods, query parameters, response payload shapes, status codes, and error messages.
- Preserve the existing CORS policy and allow local loopback HTTP only for development.
- Run the repository CI-equivalent checks after the edits; Deno tests may be run by GitHub Actions if Deno is unavailable locally.

---

### Task 1: Enforce a secure Supabase URL at frontend initialization

**Files:**
- Create: `frontend/src/lib/supabase/url.ts`
- Create: `frontend/test/src/lib/supabase/url.test.ts`
- Modify: `frontend/src/lib/supabase/client.ts`

**Interfaces:**
- Produces `validateSupabaseUrl(rawUrl: string): string`.
- The helper accepts any valid `https:` URL and valid `http:` URLs whose hostname is `localhost`, `127.0.0.1`, `::1`, or `[::1]`.
- The helper throws `Error("Supabase URL must be a valid URL.")` for malformed values and `Error("Supabase URL must use HTTPS except for local loopback development.")` for disallowed protocols/hosts.

- [ ] **Step 1: Write the failing tests**

Create `frontend/test/src/lib/supabase/url.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```text
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/supabase/url.test.ts
```

Expected: FAIL because `frontend/src/lib/supabase/url.ts` does not exist.

- [ ] **Step 3: Implement the validator**

Create `frontend/src/lib/supabase/url.ts`:

```ts
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
```

Modify `frontend/src/lib/supabase/client.ts`:

```ts
import { validateSupabaseUrl } from './url';
```

Replace the current URL export setup with:

```ts
if (!rawSupabaseUrl || !rawSupabaseAnonKey) {
  throw new Error('Supabase URL/anon key are missing from the client build.');
}

export const supabaseUrl: string = validateSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey: string = rawSupabaseAnonKey;
```

Leave `student-client.ts` unchanged because it consumes the already-validated `supabaseUrl` export.

- [ ] **Step 4: Run the focused test to verify it passes**

Run the same focused Deno command. Expected: all five URL validation tests pass.

- [ ] **Step 5: Run frontend typecheck**

Run:

```text
npm run typecheck --prefix frontend
```

Expected: exit code 0.

- [ ] **Step 6: Commit the task**

```text
git add frontend/src/lib/supabase/client.ts frontend/src/lib/supabase/url.ts frontend/test/src/lib/supabase/url.test.ts
git commit -m "security: require HTTPS for hosted Supabase clients"
```

### Task 2: Harden Supabase Edge Function response transport headers

**Files:**
- Modify: `supabase/functions/_shared/cors.ts`
- Create: `test/supabase/functions/_shared/cors.test.ts`

**Interfaces:**
- `corsHeaders` remains the shared header object used by JSON responses and OPTIONS responses.
- `jsonResponse(body, status)` continues to return the same JSON body and status, with these additional headers: `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- `errorResponse(message, status)` continues to delegate to `jsonResponse`.

- [ ] **Step 1: Write the failing tests**

Create `test/supabase/functions/_shared/cors.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```text
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/_shared/cors.test.ts
```

Expected: FAIL because the two new headers are absent.

- [ ] **Step 3: Add the shared headers**

Modify `supabase/functions/_shared/cors.ts` by adding these entries to `corsHeaders`:

```ts
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
```

Do not change the CORS values, JSON serialization, or response status handling.

- [ ] **Step 4: Run the focused test to verify it passes**

Run the same focused Deno command. Expected: both tests pass.

- [ ] **Step 5: Commit the task**

```text
git add supabase/functions/_shared/cors.ts test/supabase/functions/_shared/cors.test.ts
git commit -m "security: harden edge function response headers"
```

### Task 3: Document the transport boundary and run the complete gate

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documentation states that hosted app-data traffic uses HTTPS/TLS through Supabase Edge Functions.
- Documentation explicitly forbids putting transport encryption keys in `VITE_*` variables.

- [ ] **Step 1: Add the transport security documentation**

Add this section after the environment-variable setup in `README.md`:

```markdown
### App-data transport security

Application data is sent through Supabase Edge Functions over HTTPS/TLS. Hosted builds must use an `https://` Supabase URL; only loopback HTTP URLs are accepted for local development.

The frontend does not contain a transport encryption key and does not wrap app-data requests or responses in a second AES envelope. Do not add a `VITE_TRANSPORT_ENCRYPTION_KEY` or copy any Supabase Function Secret into frontend environment variables. Sensitive database fields requiring AES-256-GCM at rest must be handled inside Edge Functions as a separate, field-specific design.
```

- [ ] **Step 2: Check documentation formatting**

Run:

```text
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Run the complete frontend gate**

Run:

```text
npm run typecheck --prefix frontend
timeout 110s npm test --prefix frontend
npm run build --prefix frontend
```

Expected: typecheck, tests, and build exit 0. The build requires a valid local `frontend/.env`; do not commit that file.

- [ ] **Step 4: Run the complete Supabase gate**

Run:

```text
timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

Expected: all Supabase tests pass. If Deno is unavailable locally, record the exact blocker and rely on the GitHub Actions Supabase job for remote verification.

- [ ] **Step 5: Verify the security boundary and worktree**

Run:

```text
rg -n "VITE_TRANSPORT_ENCRYPTION_KEY|encryptTransportPayload|decryptTransportPayload|X-Payload-Encryption" frontend supabase README.md
git diff --check
git status --short
```

Expected: the search finds only the explicit documentation warning, no frontend or Edge Function implementation reference, and the worktree contains only the files for this feature.

- [ ] **Step 6: Commit the documentation**

```text
git add README.md
git commit -m "docs: define HTTPS app-data transport boundary"
```

