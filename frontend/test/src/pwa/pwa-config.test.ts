import { assertEquals, assertMatch } from "jsr:@std/assert";

const root = new URL("../../../", import.meta.url);

async function readProjectFile(path: string) {
  return await Deno.readTextFile(new URL(path, root));
}

Deno.test("PWA manifest opens Free Play as an installable MathVenture app", async () => {
  const manifest = JSON.parse(await readProjectFile("public/manifest.webmanifest"));

  assertEquals(manifest.name, "MathVenture");
  assertEquals(manifest.display, "standalone");
  assertEquals(manifest.start_url, "/free-play");
  assertEquals(manifest.icons, [
    { src: "/icons/mathventure-192.svg", sizes: "192x192", type: "image/svg+xml" },
    { src: "/icons/mathventure-512.svg", sizes: "512x512", type: "image/svg+xml" },
  ]);
});

Deno.test("PWA config precaches the app shell without silently precaching the media library", async () => {
  const config = await readProjectFile("vite.config.ts");

  assertMatch(config, /vite-plugin-pwa/);
  assertMatch(config, /strategies:\s*['"]injectManifest['"]/);
  assertMatch(config, /globIgnores:\s*\[['"]assets\/\*\*['"]\]/);
  assertMatch(config, /filename:\s*['"]sw\.ts['"]/);
  assertMatch(config, /devOptions:\s*\{[\s\S]*enabled:\s*true/);
  assertMatch(config, /devOptions:\s*\{[\s\S]*type:\s*['"]module['"]/);
  assertMatch(config, /configureServer/);
  assertMatch(config, /free-play-media-manifest\.json/);
});

Deno.test("PWA manifest icons exist in public assets", async () => {
  for (const path of ["public/icons/mathventure-192.svg", "public/icons/mathventure-512.svg"]) {
    const stat = await Deno.stat(new URL(`../../../${path}`, import.meta.url));
    assertEquals(stat.isFile, true);
  }
});

Deno.test("PWA worker has an app-shell precache entry point", async () => {
  const worker = await readProjectFile("src/pwa/sw.ts");

  assertMatch(worker, /precacheAndRoute/);
  assertMatch(worker, /self\.__WB_MANIFEST/);
  assertMatch(worker, /GET_MEDIA_STATUS/);
  assertMatch(worker, /checkForMediaUpdate/);
});
