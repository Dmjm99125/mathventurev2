# MathVenture PWA Install and Responsive Offline Panel

## Goal

Allow users to install MathVenture as a PWA from the existing Free Play offline area, while keeping installation distinct from downloading the Free Play media library. Make the affected controls usable across phone, tablet, and desktop widths.

## Scope

- Register the generated service worker from the application entry point so the app shell can work offline and the browser can evaluate PWA installability.
- Add a shared PWA install state hook that handles the browser install prompt, app-installed state, and standalone display mode.
- Add an install action to the Free Play offline panel.
- Show a compact install action in `TopNav` only when the browser exposes an install prompt.
- Provide a clear manual-install fallback in the offline panel when programmatic installation is unavailable.
- Make the offline panel action rows, status content, two-column layout, and navigation actions responsive without changing the existing media-download protocol.

## User experience

The offline panel will present two separate actions:

1. Install MathVenture: adds the web app to the device when the browser supports the install prompt.
2. Download Free Play for offline: saves the media library for offline play.

The install action will be keyboard accessible, report prompt success or dismissal without blocking the page, and disappear after installation. Browsers without a prompt will receive instructions to use the browser's install or “Add to Home Screen” menu instead of a non-functional button. The top navigation will expose the same install action only while installation is available and will avoid crowding narrow mobile headers.

## Technical design

- `main.tsx` will call the Vite PWA registration helper once during startup.
- `usePwaInstall` will own `beforeinstallprompt`, `appinstalled`, and standalone detection. It will not assume a prompt exists on every browser.
- A small reusable install button/presentation component will be shared by `TopNav` and `FreePlayOfflinePanel`.
- Service-worker registration and install-prompt state will remain independent from the media service-worker message protocol.

## Responsive behavior

- Keep the existing two-column offline panel on medium and larger screens.
- Stack panel content and action groups on narrow screens.
- Make primary actions full-width when the available width is small, while allowing compact inline actions at larger widths.
- Ensure progress labels, byte counts, fallback messages, and error actions wrap without horizontal overflow.
- Keep the navigation brand and controls from colliding at mobile widths.

## Error handling and compatibility

- A missing or unsupported install prompt is a supported state, not an error.
- Prompt rejection or dismissal returns the UI to an available state without affecting offline media status.
- Existing offline download errors and progress states remain unchanged.
- Installation still requires the browser's normal secure-context/installability rules; the UI must not claim that media downloading alone installs the app.

## Verification

- Add unit tests for install-prompt capture, installation, dismissal, app-installed state, and standalone detection.
- Extend PWA configuration and panel tests for service-worker registration and install affordances.
- Run targeted Deno tests, typecheck, build, and the complete frontend test command.

