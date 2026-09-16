# Offline Free Play

MathVenture can be installed as a PWA and used for public Free Play when the internet is unavailable.

## Parent setup

1. Open MathVenture online and visit **Free Play**.
2. In the **Offline library** section, choose **Download Free Play for offline**.
3. Keep the page open while the library downloads. The progress indicator shows files and bytes saved.
4. Wait for **Offline ready** before turning off the connection.

The download includes every supported image, audio, and video under `public/assets`. The current library is about 234 MB, so use Wi-Fi and make sure the device has enough storage. Nothing is downloaded automatically.

If the download is interrupted, choose **Retry download**. Completed files remain available to the retry, and the previous ready library remains active while an update is being prepared. Video seeking works from the cached library after the device goes offline.

## Offline behavior

- `/free-play` and its Free Play lesson routes open from the app shell after the library is ready.
- Free Play gameplay stays local and never submits an attempt to the API.
- Teacher dashboards, assigned quizzes, reports, classroom progress, and account actions remain online-only.
- A newer media build appears as **Update available**. Downloading the update does not replace the previous working library until the new version is complete.

## Deployment requirements

- Service workers require HTTPS in production; `localhost` is also supported for local testing.
- The deployed origin must serve `/sw.js`, `/manifest.webmanifest`, `/icons/mathventure-192.svg`, `/icons/mathventure-512.svg`, and `/free-play-media-manifest.json` from the same origin as the app.
- The production build generates the media manifest from the actual `public/assets` files. Do not hand-edit the generated manifest or move media behind a different origin without updating the worker design.
- Verify the production build manually on a supported mobile browser: install the PWA, download the library, disable network access, reload Free Play, play audio, open images, and seek in a cached video.
