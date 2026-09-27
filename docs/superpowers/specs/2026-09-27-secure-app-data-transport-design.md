# Secure App-Data Transport Design

## Goal

Keep MathVenture app-data traffic protected by HTTPS/TLS without putting an AES key in the frontend, adding a second request/response encryption layer, or changing application data-fetching performance.

## Context

MathVenture sends application data through `supabase.functions.invoke` and receives responses from Supabase Edge Functions. Supabase Auth is a separate SDK path and is out of scope. The ExamHub reference confirms that a literal AES-256-GCM request/response envelope requires a browser-visible key; its current safe implementation relies on HTTPS and keeps AES keys backend-only.

## Architecture

- The browser uses the configured Supabase HTTPS origin for all hosted app-data requests.
- The frontend rejects non-local, non-HTTPS Supabase URLs at client initialization so a production build cannot silently use plaintext HTTP.
- Supabase Edge Function responses include cache-prevention and content-type hardening headers. Existing CORS behavior and response payload shapes remain unchanged.
- No `VITE_TRANSPORT_ENCRYPTION_KEY`, frontend AES helper, encrypted envelope, extra handshake, database migration, or Edge Function private key is introduced.
- AES-256-GCM remains appropriate for backend-only sensitive data-at-rest work, but data-at-rest field encryption is a separate change and is not added without an identified field/key-rotation design.

## Components

### Frontend URL validation

Add a small pure helper that validates the Supabase URL:

- Accept `https:` for hosted environments.
- Accept `http:` only for loopback development hosts (`localhost`, `127.0.0.1`, and `::1`).
- Reject all other schemes and all non-loopback HTTP hosts with a clear configuration error.
- Keep the existing required URL and anon-key checks.

Use the helper before creating either the main or student Supabase client. This is initialization-time validation only and adds no per-request work.

### Edge Function response headers

Extend the shared response headers with:

- `Cache-Control: no-store` to keep authenticated app-data responses out of browser/proxy caches.
- `X-Content-Type-Options: nosniff` to prevent MIME sniffing.

Keep `Content-Type: application/json`, current CORS headers, status codes, and JSON body shapes intact. OPTIONS responses use the shared headers as well.

### Tests and documentation

- Add frontend tests for accepted and rejected URL forms.
- Add Supabase tests for the shared security headers and unchanged JSON response behavior.
- Document that hosted deployment must use an HTTPS Supabase URL and that no transport key belongs in frontend environment variables.

## Error handling

- Invalid Supabase URL configuration fails fast during client initialization.
- Existing Edge Function error payloads remain ordinary JSON because HTTPS protects them in transit and the application has no browser-side app encryption key.
- No sensitive key material is logged or returned.

## Performance

- No cryptographic operation is added to individual requests.
- No additional network round trip is added.
- No response shape or payload encoding changes.
- URL validation occurs once at module initialization; security headers are negligible response metadata.

## Verification

Run the repository CI-equivalent checks:

```text
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

The Supabase test lane requires Deno. Remote GitHub Actions remains the authoritative check when local Deno is unavailable.
