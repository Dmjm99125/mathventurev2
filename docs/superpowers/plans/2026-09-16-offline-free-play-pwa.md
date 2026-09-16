# Offline Free Play PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MathVenture's public Free Play experience installable and usable offline after a parent explicitly downloads the complete static media library, without changing teacher, assigned-quiz, or API behavior.

**Architecture:** Add a build-integrated `vite-plugin-pwa` inject-manifest service worker. Workbox precaches only the application shell and route fallback; a generated media manifest describes every supported image, audio, and video file under `public/assets` while excluding the research PDF. The service worker downloads media into a versioned staging cache, reports progress through typed messages, atomically marks a completed cache active, and serves cached media first—including HTTP range responses for offline video seeking. The Free Play page owns the parent-facing download/update/retry UI and communicates with the worker through a small client protocol. No lesson/game API or attempt-persistence path is changed.

**Tech Stack:** React 19, TypeScript, Vite 6, `vite-plugin-pwa`/Workbox, Cache Storage, IndexedDB, existing Tailwind/Radix UI primitives, Deno tests, npm lockfile.

## Global Constraints

- Preserve all existing API endpoints and online behavior.
- Keep `/free-play` and its existing lesson links public; do not introduce authentication or offline attempt synchronization.
- Never auto-download the approximately 220 MB media library. Download starts only from an explicit parent-facing action.
- Do not report “Offline ready” until every generated media-manifest entry is present and verified in the active cache.
- Keep the previous active media cache usable until a replacement cache has completed.
- Preserve unrelated user files and changes, especially the existing untracked `.tmp-shape-matching-build/` directory and prior plan documents.
- After every implementation task, run the smallest relevant test/typecheck/build gate before committing that task.

---

## Task 1: Add PWA metadata, icons, and the build dependency

**Files:**

- Modify `package.json` to add `vite-plugin-pwa` as a dev dependency.
- Modify `package-lock.json` through the package manager so the dependency graph is reproducible.
- Modify `vite.config.ts` to register the PWA plugin in inject-manifest mode, configure app-shell-only precaching, retain the existing `dist/public` output, and include the generated media manifest in the build output without precaching the media files themselves.
- Modify `index.html` to reference the web manifest and retain the existing MathVenture metadata.
- Create `public/manifest.webmanifest` with MathVenture name, standalone display, theme/background colors, `/free-play` start URL, and icon declarations.
- Create `public/icons/mathventure-192.svg` and `public/icons/mathventure-512.svg` as lightweight MathVenture-style vector icons suitable for install prompts and shortcuts.
- Create or update `src/vite-env.d.ts` with the PWA client type reference required by the virtual registration module.
- Create `test/src/pwa/pwa-config.test.ts` to assert manifest fields, icon paths, `/free-play` start URL, and that the Vite configuration keeps media out of the app-shell precache pattern.

**Implementation details:**

1. Write the failing config/metadata tests first and run `deno test --allow-read --allow-env --import-map=deno.json test/src/pwa/pwa-config.test.ts` to confirm they fail for the missing files/config.
2. Install the pinned compatible `vite-plugin-pwa` version with `npm install -D vite-plugin-pwa` and preserve the resulting lockfile changes.
3. Configure `VitePWA({ strategies: 'injectManifest', srcDir: 'src/pwa', filename: 'sw.ts', registerType: 'prompt', manifest: false, injectManifest: { globPatterns: ['**/*.{html,js,css,svg,ico,webmanifest,json}'], globIgnores: ['assets/**'] } })`; keep the public media roots out of the app-shell list.
4. Run the focused test, `npm run typecheck`, and `npm run build`; commit as `feat: add installable MathVenture PWA shell`.

- [ ] Write the failing metadata/config tests.
- [ ] Add the manifest, icons, dependency, and Vite PWA configuration.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit the completed task.

## Task 2: Generate and validate the complete Free Play media manifest

**Files:**

- Create `src/lib/offline/mediaManifest.ts` with the shared media extension list, `MediaManifestEntry`, `MediaManifest`, deterministic version/hash helpers, and URL normalization helpers.
- Create `scripts/generate-free-play-media-manifest.mjs` with the Node filesystem scanner used by the Vite build plugin; it must recursively scan `public/assets`, include supported image/audio/video extensions case-insensitively, record URL and byte size, sort entries by URL, and exclude `public/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf` and other unsupported files.
- Modify `vite.config.ts` to invoke the scanner during production build and emit `free-play-media-manifest.json` containing schema version, media version, generated byte/file totals, and all entries.
- Create `test/src/pwa/media-manifest.test.ts` covering extension filtering, nested path normalization, deterministic ordering/versioning, byte totals, and exclusion of the PDF.
- Modify `test/src/pages/free-play.test.ts` to assert Free Play exposes the offline-download surface while keeping the existing public topic-menu assertions.

**Implementation details:**

1. Add tests for the pure extension/filter/version behavior and a fixture-based scan before implementing the scanner; run the focused tests to capture the red state.
2. Keep the manifest type browser-safe in `src/lib/offline/mediaManifest.ts`; keep Node-only directory traversal in the script/Vite plugin so the application bundle never imports filesystem APIs.
3. Use URL paths beginning with `/assets/`, preserve uppercase extensions such as `.MP3`, and calculate totals from actual file sizes rather than hardcoded estimates.
4. Run the focused manifest tests and `npm run build`; inspect `dist/public/free-play-media-manifest.json` to confirm every listed image/audio/video exists in `dist/public`.
5. Commit as `feat: generate complete free play media manifest`.

- [ ] Write the failing manifest tests.
- [ ] Implement the shared manifest model and build scanner.
- [ ] Emit and inspect the production manifest.
- [ ] Run focused tests and build.
- [ ] Commit the completed task.

## Task 3: Implement the versioned media-cache service worker

**Files:**

- Create `src/pwa/cacheProtocol.ts` with typed worker message names/payloads, download status states, progress payloads, cache metadata, and error codes shared by the worker and client.
- Create `src/pwa/mediaCache.ts` with pure helpers for cache naming, manifest validation, completed-entry accounting, retry-safe asset selection, and range-response slicing.
- Create `src/pwa/sw.ts` with Workbox `precacheAndRoute(self.__WB_MANIFEST)`, offline navigation handling for the app shell/Free Play route, media request routing, message handlers, and IndexedDB-backed active-cache metadata.
- Create `test/src/pwa/cache-protocol.test.ts` for state transitions, resumable retry selection, atomic activation rules, and range response behavior.
- Create `test/src/pwa/service-worker.test.ts` for worker message contracts and offline media-route decisions using the extracted helpers.

**Implementation details:**

1. Write red tests for a fresh download, interrupted download, retry, quota/request failure, update staging, and range slicing before the service-worker implementation.
2. On `DOWNLOAD_FREE_PLAY_MEDIA`, fetch the generated manifest, create `mathventure-free-play-media-staging-${version}`, skip and verify already-complete entries, fetch each missing entry, store successful responses, and post progress after each file/byte update.
3. On complete verification, write the active cache name/version in a small IndexedDB record and delete superseded staging/active caches only after the new cache is fully usable. A failure leaves the old active cache and completed staging entries intact.
4. On `GET_MEDIA_STATUS`, return not-downloaded/downloading/ready/update-available/error plus file/byte progress. On `CANCEL_DOWNLOAD`, stop scheduling new requests while keeping completed staging entries retryable.
5. Route supported media requests to the active media cache first. When a cached response receives a `Range` header, return a correct `206 Partial Content` slice with `Content-Range`, `Content-Length`, `Accept-Ranges`, and preserved content type; fall back to network only when online and not cached.
6. Precache the built application shell and provide an offline navigation fallback for `/free-play` and `/student/lessons/*`; do not fabricate teacher dashboard or assigned-quiz data offline.
7. Run focused worker tests, `npm run typecheck`, and `npm run build`; commit as `feat: add resumable offline media service worker`.

- [ ] Write the failing protocol/cache/service-worker tests.
- [ ] Implement typed cache protocol and pure cache helpers.
- [ ] Implement the worker download, activation, media routing, range handling, and app-shell fallback.
- [ ] Run focused tests, typecheck, and build.
- [ ] Commit the completed task.

## Task 4: Add the browser client for registration, status, progress, and recovery

**Files:**

- Create `src/lib/offline/freePlayOfflineClient.ts` with service-worker registration, typed `getStatus`, `subscribe`, `download`, `cancel`, `retry`, and update-check functions; it must handle unsupported browsers and controller changes without throwing.
- Create `src/hooks/useFreePlayOffline.ts` with a React hook that subscribes/unsubscribes exactly once, exposes stable status/progress/error values, and refreshes status after visibility/online events.
- Create `test/src/lib/free-play-offline-client.test.ts` using mocked service-worker/message ports to cover registration failure, progress delivery, cancellation, retry, reload/controller changes, and cleanup.
- Create `test/src/hooks/useFreePlayOffline.test.ts` to cover mount/unmount listener cleanup and state updates.

**Implementation details:**

1. Write tests around a small fake `navigator.serviceWorker` before implementing the client; run the focused tests to verify the missing behavior.
2. Register the generated worker only in secure contexts or localhost, use a single message listener per client instance, and resolve request/response messages with timeouts and human-readable errors.
3. Keep worker state durable: a page reload must recover status from the worker rather than reset progress to zero. Online/offline events should refresh status but must not auto-start a download.
4. Run focused tests and `npm run typecheck`; commit as `feat: expose offline free play cache state`.

- [ ] Write the failing client and hook tests.
- [ ] Implement the service-worker client and React hook.
- [ ] Run focused tests and typecheck.
- [ ] Commit the completed task.

## Task 5: Build the parent-friendly Free Play offline controls

**Files:**

- Create `src/components/offline/FreePlayOfflinePanel.tsx` with the MathVenture-styled not-downloaded, downloading, ready, update-available, error, and unsupported-browser states.
- Modify `src/pages/free-play.tsx` to render the panel in the existing Free Play layout, preserve the current topic links/back navigation, and never trigger a download on page load.
- Modify `test/src/pages/free-play.test.tsx` to cover the explicit download copy, approximate/actual size display, progress semantics, retry/cancel/update actions, ready confirmation, and unchanged `freePlay=1` links.
- Create `test/src/components/free-play-offline-panel.test.tsx` for state-specific accessible labels, button behavior, and no-clutter layout contracts.

**Implementation details:**

1. Add component tests first with a mocked hook state and verify the new states fail before implementation.
2. Use clear parent-facing language such as “Download Free Play for offline,” show file and byte progress, explain the full-library size, distinguish “Downloaded” from “Offline ready,” and surface retry/cancel actions without technical error strings.
3. Keep the panel visually consistent with MathVenture’s playful colors while following the approved restrained layout: one clear section, readable numbers, strong alignment, minimal shadows, and no duplicated topic cards.
4. Use semantic progress markup (`role="progressbar"`, `aria-valuenow`, `aria-valuemax`, and status text), disable conflicting actions while downloading, and preserve keyboard/touch usability.
5. Run focused page/component tests and `npm run typecheck`; commit as `feat: add parent friendly offline download controls`.

- [ ] Write the failing panel/page tests.
- [ ] Implement the offline panel and Free Play integration.
- [ ] Run focused tests and typecheck.
- [ ] Commit the completed task.

## Task 6: Wire offline route/media behavior and protect existing functionality

**Files:**

- Modify `src/main.tsx` to use the generated PWA registration/client entry point without changing application routing or Supabase initialization.
- Modify `src/pages/QuizPage.tsx` only if needed to make cached Free Play lesson media work offline; preserve the existing `isPublicFreePlay` branch and teacher/assigned-quiz persistence behavior exactly.
- Modify `src/components/LessonSlideCard.tsx` only if needed to preserve video `Range` requests and audio playback when assets come from the service-worker cache.
- Add or update `test/src/pages/QuizPage.test.tsx` and `test/src/components/LessonSlideCard.test.tsx` with explicit assertions that public Free Play makes no attempts API request while assigned quizzes still use their current endpoint.
- Create `test/src/pwa/production-offline.test.ts` to build/inspect the production output and verify the worker, manifest, app shell, `/free-play` fallback, and every supported media URL are present.

**Implementation details:**

1. Add regression tests before any route/media wiring changes and run the focused existing QuizPage/LessonSlideCard suites.
2. Keep all API endpoints unchanged. Do not add an offline submission queue. The browser should serve cached static lesson media transparently while Free Play gameplay remains local and temporary.
3. Ensure network-dependent teacher and assigned-quiz pages continue to show their existing loading/error behavior when offline; only the app shell and public Free Play lesson routes receive an offline fallback.
4. Run the affected existing suites, the production offline test, `npm run typecheck`, and `npm run build`; commit as `test: protect free play offline and quiz boundaries`.

- [ ] Write the regression and production-output tests.
- [ ] Wire registration/media behavior without changing APIs.
- [ ] Run affected suites, production checks, typecheck, and build.
- [ ] Commit the completed task.

## Task 7: Document deployment requirements and complete CI verification

**Files:**

- Create `docs/offline-free-play.md` documenting HTTPS/localhost requirements, install flow, explicit download flow, storage expectations, retry/update behavior, supported offline routes, and the fact that teacher/assigned-quiz functionality remains online-only.
- Modify `README.md` only if the project’s existing setup section needs a concise PWA/offline note.
- Add or update `netlify.toml` only if production headers are required for service-worker scope or media range requests; retain the SPA redirect and do not alter API routing.
- Create `test/src/pwa/offline-documentation.test.ts` only if documentation is needed to lock down user-facing operational guarantees that are not already covered by the feature tests.

**Implementation details:**

1. Verify the production server serves `sw.js`, `manifest.webmanifest`, icons, and media with the expected same-origin paths and byte-range behavior; do not rely on the Vite dev server as the final check.
2. Run the complete relevant local gate: `npm run typecheck`, `npm run build`, the focused PWA suites, the existing teacher/QuizPage/LessonSlideCard suites, and then `npm test`.
3. If unrelated pre-existing tests fail, record their exact failures separately; do not weaken or skip them. Run `git diff --check` and inspect `git status --short` to ensure only task files are staged.
4. Manually verify on a supported mobile browser: install, visit Free Play online, start/interrupt/retry the download, confirm “Offline ready,” disable network, reload `/free-play`, open representative image/audio/video lessons, seek in a cached video, and confirm no `attempts-submit` request occurs.
5. Commit as `docs: document offline free play deployment and verification`.

- [ ] Document operational/deployment behavior.
- [ ] Run production and full local CI-equivalent checks.
- [ ] Perform the manual offline verification checklist.
- [ ] Commit the completed task.

## Completion Checklist

- [ ] PWA install metadata and app-shell service worker are built from the same production build.
- [ ] The generated manifest lists every supported image/audio/video asset under `public/assets` and excludes the research PDF.
- [ ] The explicit parent download is resumable, progress-aware, retryable, and atomic.
- [ ] Cached video supports offline seeking/range requests.
- [ ] `/free-play` and Free Play lesson routes open offline after completion.
- [ ] Free Play does not submit attempts; assigned quizzes and teacher behavior remain unchanged.
- [ ] Production build, typecheck, focused tests, and the full existing test gate have fresh verification output.
- [ ] No unrelated files are staged or modified.
