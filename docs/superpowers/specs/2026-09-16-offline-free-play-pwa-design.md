# Offline Free Play PWA Design

## Purpose

Make MathVenture's public Free Play experience usable during unreliable internet access in the Philippines. A parent should be able to install the app, download the complete Free Play media library while online, and let a child play the games later without a network connection.

## Scope

### In scope

- Installable PWA metadata and service worker registration.
- Offline launch for the app shell and `/free-play` route.
- An explicit full-library download action from Free Play.
- Offline caching of the complete static media library: images, audio, and videos.
- Download progress, retry, cancellation/recovery, and an Offline ready state.
- Versioned cache cleanup when a new application build is installed.
- Offline Free Play gameplay with no API calls and no attempt recording.

### Out of scope

- Offline teacher dashboard functionality.
- Offline assigned quizzes, classroom progress, reports, or account actions.
- Offline synchronization or conflict resolution.
- Changes to the existing quiz/assignment APIs.

## Recommended architecture

Use a service worker-backed PWA with two cache layers:

1. An app-shell cache for the built HTML, JavaScript, CSS, icons, and route fallback needed to open Free Play offline.
2. A versioned Free Play media cache containing every asset under `public/assets` required by the current Free Play experience, including the approximately 137 MB video library, 41 MB audio library, and 41 MB image library.

The app shell is available after the normal online visit/install. The media cache is populated only after the parent explicitly selects “Download Free Play for offline.” This avoids silently consuming roughly 220 MB of data while still making the entire library available once requested.

Use a build-integrated service-worker approach so hashed application assets and the media manifest are generated from the same build. Media downloads must be resumable or safely retryable. Video requests must support HTTP range semantics when served from cache so offline playback and seeking work correctly.

## User flow

The Free Play page exposes a clearly labeled offline section:

- Not downloaded: explain that the full game library can be saved for offline play and show the approximate size.
- Downloading: show byte/file progress, allow the parent to leave and return, and retain completed assets.
- Offline ready: confirm that Free Play can be opened without internet.
- Update available: when a newer media/app version exists, offer a fresh download while keeping the previous usable cache until the new one completes.

If storage, quota, or an individual asset request fails, show a human-readable error with Retry. Do not mark the library ready until every required asset has completed successfully.

## Offline behavior

- `/free-play` and lesson routes used by Free Play resolve from the app-shell cache while offline.
- Static media resolves from the versioned media cache first, then from the network when online.
- Free Play never submits `attempts-submit`; gameplay remains local and temporary.
- If the user opens a network-dependent teacher or assigned-quiz route offline, show the existing application error/loading behavior rather than fabricating data.
- Service-worker updates activate only after the new cache is complete, preventing a partial media library from replacing a working one.

## Testing and verification

- Unit-test the media manifest and cache-state/progress reducer, including retry and interrupted-download recovery.
- Test service-worker registration and offline route fallback with a production build.
- Verify all listed image/audio/video assets resolve from the generated manifest.
- Verify Free Play completion never invokes an API persistence path.
- Run the existing teacher, game, typecheck, build, and full test gates without weakening unrelated coverage.
- Manually verify install, download, offline reload, video playback/seeking, audio playback, and cache update on a supported mobile browser.

## Acceptance criteria

- A parent can install MathVenture and explicitly download the full Free Play library.
- After download completes, Free Play opens and all games' required media work with network access disabled.
- Download state is understandable and recoverable after interruption.
- No Free Play attempt is sent to the API.
- Teacher and assigned-quiz online behavior remains unchanged.
