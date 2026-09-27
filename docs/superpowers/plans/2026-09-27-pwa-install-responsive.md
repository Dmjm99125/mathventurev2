# MathVenture PWA Install and Responsive Offline Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Let users install MathVenture as a PWA from Free Play, register the app shell for offline use, and keep install/offline controls responsive on small screens.

**Architecture:** A browser-only PWA install client owns the beforeinstallprompt, appinstalled, and standalone-display lifecycle. A React hook exposes that state to a shared install action used by TopNav and FreePlayOfflinePanel; the existing media-download service-worker protocol remains separate. The app entry point explicitly calls the Vite PWA registration helper.

**Tech Stack:** React 19, TypeScript, Vite 6, vite-plugin-pwa injectManifest, Tailwind utility classes, Deno tests with @std/assert.

## Global Constraints

- Installation and media downloading are separate actions and must use separate copy.
- The install UI must not pretend that a browser without beforeinstallprompt can be installed programmatically.
- Existing offline media protocol, status states, and test coverage must remain intact.
- Primary controls must wrap or stack without horizontal overflow on narrow screens.
- Run targeted checks first, then typecheck, build, and the complete frontend test command before completion.
- Preserve unrelated dirty-worktree changes; stage only files belonging to this feature.

---

## File map

- Create frontend/src/lib/pwa/install.ts: browser-agnostic install-prompt client and state types.
- Create frontend/src/hooks/usePwaInstall.ts: React lifecycle adapter for the install client.
- Create frontend/src/components/pwa/InstallAppAction.tsx: shared install button and manual-install fallback.
- Modify frontend/src/main.tsx: register the generated service worker once at startup.
- Modify frontend/src/vite-env.d.ts only if vite-plugin-pwa client typings are missing.
- Modify frontend/src/components/layout.tsx: add the compact install action to responsive top navigation.
- Modify frontend/src/components/offline/FreePlayOfflinePanel.tsx: add install status/action and narrow-screen layout classes.
- Modify frontend/test/src/pwa/pwa-config.test.ts: assert explicit registration wiring.
- Create frontend/test/src/lib/pwa-install.test.ts: exercise install lifecycle behavior.
- Create frontend/test/src/components/install-app-action.test.ts: assert shared action contracts.
- Modify frontend/test/src/components/free-play-offline-panel.test.ts: assert install copy and responsive contracts.
- Create frontend/test/src/components/top-nav-install.test.ts: assert top-navigation install integration.

### Task 1: Add a testable install-prompt client

**Files:**
- Create: frontend/src/lib/pwa/install.ts
- Test: frontend/test/src/lib/pwa-install.test.ts

**Interfaces:**
- InstallOutcome is accepted | dismissed | unavailable.
- PwaInstallState is { isReady: boolean; canInstall: boolean; isInstalled: boolean }.
- createPwaInstallClient(target?: PwaInstallTarget): PwaInstallClient.
- PwaInstallClient.subscribe(listener) returns an unsubscribe function.
- PwaInstallClient.install() returns Promise<InstallOutcome>.

- [ ] Step 1: Write the failing lifecycle tests.

Use a fake EventTarget and prompt event. Cover accepted install, dismissed prompt, standalone/appinstalled detection, and unavailable browsers:

~~~ts
const prompt = new Event("beforeinstallprompt") as InstallPromptEvent;
prompt.preventDefault = () => undefined;
prompt.prompt = async () => undefined;
prompt.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
target.dispatchEvent(prompt);
assertEquals(client.getState().canInstall, true);
assertEquals(await client.install(), "accepted");
assertEquals(client.getState().canInstall, false);
~~~

The dismissed case must return dismissed and keep isInstalled false. The standalone case must initialize isInstalled true from matchMedia("(display-mode: standalone)"). The no-prompt case must return unavailable.

- [ ] Step 2: Run the test to verify it fails.

Run:

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/lib/pwa-install.test.ts
~~~

Expected: FAIL because src/lib/pwa/install.ts does not exist.

- [ ] Step 3: Implement the minimal install client.

Define InstallPromptEvent, PwaInstallTarget, PwaInstallState, and PwaInstallClient. Initialize isInstalled from display-mode standalone or the iOS-style navigator.standalone value. Listen for beforeinstallprompt and appinstalled. The first listener must call preventDefault, retain the event, set canInstall true, and publish state. install() must return unavailable without an event; otherwise call prompt(), await userChoice, clear the event, publish canInstall false, and return accepted or dismissed. appinstalled must set isInstalled true and clear the event. dispose() must remove listeners and clear subscribers.

- [ ] Step 4: Run the test to verify it passes.

Run the same targeted Deno command. Expected: all install-client tests PASS.

- [ ] Step 5: Commit.

~~~bash
git add frontend/src/lib/pwa/install.ts frontend/test/src/lib/pwa-install.test.ts
git commit -m "feat: add PWA install prompt client"
~~~

### Task 2: Expose install state through React and register the app shell

**Files:**
- Create: frontend/src/hooks/usePwaInstall.ts
- Modify: frontend/src/main.tsx
- Modify: frontend/src/vite-env.d.ts if required
- Modify: frontend/test/src/pwa/pwa-config.test.ts

**Interfaces:**
- usePwaInstall(): PwaInstallState & { install: () => Promise<InstallOutcome> }.
- Consumes createPwaInstallClient from Task 1.

- [ ] Step 1: Add failing PWA wiring assertions.

Extend pwa-config.test.ts with:

~~~ts
assertMatch(source, /virtual:pwa-register/);
assertMatch(source, /registerSW\(\{[\s\S]*immediate:\s*true/);
assertMatch(source, /usePwaInstall/);
~~~

- [ ] Step 2: Run the PWA test to verify it fails.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/pwa/pwa-config.test.ts
~~~

Expected: FAIL because main.tsx does not explicitly register the service worker.

- [ ] Step 3: Implement the hook and registration.

If needed, add these references to vite-env.d.ts:

~~~ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
~~~

Create usePwaInstall.ts with a useEffect that creates the client, mirrors getState into React state, subscribes to updates, and disposes on cleanup. install() must return unavailable when called before the client is ready.

Add this once at the top of main.tsx, before createRoot:

~~~ts
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });
~~~

- [ ] Step 4: Run the PWA test and typecheck.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/pwa/pwa-config.test.ts
npm --prefix frontend run typecheck
~~~

Expected: the PWA test passes and TypeScript exits 0.

- [ ] Step 5: Commit.

~~~bash
git add frontend/src/hooks/usePwaInstall.ts frontend/src/main.tsx frontend/src/vite-env.d.ts frontend/test/src/pwa/pwa-config.test.ts
git commit -m "feat: register and expose PWA installation"
~~~

### Task 3: Build the shared install action

**Files:**
- Create: frontend/src/components/pwa/InstallAppAction.tsx
- Test: frontend/test/src/components/install-app-action.test.ts

**Interfaces:**
- Renders InstallAppAction with compact?, showFallback?, and className? props.
- Consumes usePwaInstall from Task 2.
- compact mode renders a navigation-sized Install button only when canInstall is true.
- showFallback mode renders installed status or browser-menu instructions when no prompt exists.

- [ ] Step 1: Write the failing source-contract test.

Read the component source and assert:

~~~ts
assertMatch(source, /usePwaInstall/);
assertMatch(source, /Install MathVenture/);
assertMatch(source, /Add to Home Screen/);
assertMatch(source, /aria-live/);
assertMatch(source, /canInstall/);
~~~

- [ ] Step 2: Run the test to verify it fails.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/components/install-app-action.test.ts
~~~

Expected: FAIL because the component does not exist.

- [ ] Step 3: Implement the shared action.

Use a lucide icon and Button. handleInstall calls install(), renders a concise accepted/dismissed status with aria-live="polite", and never throws into the page. Render no compact button when canInstall is false. In showFallback mode render:

~~~tsx
Open your browser menu and choose Install MathVenture or Add to Home Screen.
~~~

When isInstalled is true, render an installed status instead. Keep the action copy distinct from the media-download copy.

- [ ] Step 4: Run the test and typecheck.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/components/install-app-action.test.ts
npm --prefix frontend run typecheck
~~~

Expected: the source test passes and typecheck exits 0.

- [ ] Step 5: Commit.

~~~bash
git add frontend/src/components/pwa/InstallAppAction.tsx frontend/test/src/components/install-app-action.test.ts
git commit -m "feat: add shared PWA install action"
~~~

### Task 4: Integrate controls and responsive layout

**Files:**
- Modify: frontend/src/components/layout.tsx
- Modify: frontend/src/components/offline/FreePlayOfflinePanel.tsx
- Modify: frontend/test/src/components/free-play-offline-panel.test.ts
- Create: frontend/test/src/components/top-nav-install.test.ts

**Interfaces:**
- Consumes InstallAppAction from Task 3.
- Leaves useFreePlayOffline and the media status protocol unchanged.

- [ ] Step 1: Add failing UI source assertions.

Add these assertions:

~~~ts
assertMatch(panelSource, /InstallAppAction/);
assertMatch(panelSource, /showFallback/);
assertMatch(panelSource, /Install MathVenture/);
assertMatch(panelSource, /w-full sm:w-auto/);
assertMatch(panelSource, /flex-col sm:flex-row/);
assertMatch(panelSource, /min-w-0/);
assertMatch(navSource, /InstallAppAction/);
assertMatch(navSource, /hidden sm:inline-flex/);
~~~

- [ ] Step 2: Run the UI tests to verify they fail.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/components/free-play-offline-panel.test.ts test/src/components/top-nav-install.test.ts
~~~

Expected: FAIL because the components have no install integration.

- [ ] Step 3: Integrate the install action and responsive classes.

In TopNav, add InstallAppAction with className="hidden sm:inline-flex" before the language button. Keep it visible only when the component detects canInstall. Add min-w-0 to the brand wrapper, truncate the brand label, and retain the existing language/user controls.

In FreePlayOfflinePanel, render InstallAppAction with showFallback and className="w-full sm:w-auto" beside the media-download button. Do not change download callbacks or status text. Use flex-col sm:flex-row for action groups, w-full sm:w-auto for primary buttons, min-w-0 on text-bearing children, and stacked progress/error rows at narrow widths. Keep the existing md two-column breakpoint.

- [ ] Step 4: Run targeted UI tests.

~~~bash
cd frontend && deno test --allow-read --allow-env --import-map=deno.json test/src/components/free-play-offline-panel.test.ts test/src/components/top-nav-install.test.ts
~~~

Expected: all targeted UI tests PASS.

- [ ] Step 5: Run typecheck and build.

~~~bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
~~~

Expected: both commands exit 0 and the build emits the PWA service-worker bundle.

- [ ] Step 6: Commit.

~~~bash
git add frontend/src/components/layout.tsx frontend/src/components/offline/FreePlayOfflinePanel.tsx frontend/test/src/components/free-play-offline-panel.test.ts frontend/test/src/components/top-nav-install.test.ts
git commit -m "feat: add responsive PWA install controls"
~~~

### Task 5: Run the complete verification gate

**Files:** None unless a verification failure identifies a root-cause defect in this feature.

- [ ] Step 1: Run all frontend tests.

~~~bash
npm test
~~~

Expected: Deno exits 0 with no skipped or focused tests.

- [ ] Step 2: Re-run typecheck and build.

~~~bash
npm run typecheck
npm run build
~~~

Expected: both commands exit 0.

- [ ] Step 3: Inspect the final diff and status.

~~~bash
git diff --check
git status --short
git log -5 --oneline
~~~

Expected: no whitespace errors; feature files are committed; unrelated dirty-worktree changes remain untouched.

- [ ] Step 4: Report exact verification evidence.

Report test, typecheck, and build exit results. If remote GitHub Actions is unavailable because this repository has no workflow or credentials are unavailable, state that remote CI is unverified.

