import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { collectFreePlayMediaManifest } from './scripts/generate-free-play-media-manifest';

function freePlayMediaManifestPlugin() {
  return {
    name: 'mathventure-free-play-media-manifest',
    async generateBundle() {
      const manifest = await collectFreePlayMediaManifest(path.resolve(import.meta.dirname, 'public/assets'));
      this.emitFile({
        type: 'asset' as const,
        fileName: 'free-play-media-manifest.json',
        source: JSON.stringify(manifest, null, 2),
      });
    },
    configureServer(server) {
      let manifestPromise: ReturnType<typeof collectFreePlayMediaManifest> | null = null;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/free-play-media-manifest.json') {
          next();
          return;
        }

        manifestPromise ??= collectFreePlayMediaManifest(path.resolve(import.meta.dirname, 'public/assets'));
        void manifestPromise
          .then((manifest) => {
            response.statusCode = 200;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify(manifest, null, 2));
          })
          .catch(next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const port = Number(env.PORT || '5173');
  const basePath = env.BASE_PATH || '/';
  
  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      freePlayMediaManifestPlugin(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src/pwa',
        filename: 'sw.ts',
        registerType: 'prompt',
        manifest: false,
        devOptions: {
          enabled: true,
          type: 'module',
        },
        injectManifest: {
          globPatterns: ['**/*.{html,js,css,svg,ico,webmanifest,json}'],
          globIgnores: ['assets/**'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
