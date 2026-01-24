import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

// Copy manifest and icons after build
function copyManifestPlugin(outDir: string, mode: string) {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // Read and process manifest
      const manifestPath = resolve(__dirname, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // In production, remove localhost permissions
      if (mode !== 'development') {
        manifest.host_permissions = manifest.host_permissions.filter(
          (p: string) => !p.includes('localhost')
        );
        manifest.content_scripts = manifest.content_scripts.map(
          (script: { matches: string[] }) => ({
            ...script,
            matches: script.matches.filter((m: string) => !m.includes('localhost')),
          })
        );
      }

      writeFileSync(
        resolve(__dirname, `${outDir}/manifest.json`),
        JSON.stringify(manifest, null, 2)
      );
      // Copy icons
      const iconsDir = resolve(__dirname, `${outDir}/icons`);
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      const iconSizes = ['16', '32', '48', '128'];
      for (const size of iconSizes) {
        const src = resolve(__dirname, `public/icons/icon${size}.png`);
        const dest = resolve(__dirname, `${outDir}/icons/icon${size}.png`);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const outDir = mode === 'development' ? 'dist-dev' : 'dist';

  return {
    plugins: [react(), tailwindcss(), copyManifestPlugin(outDir, mode)],
    base: './',
    define: {
      __DEV__: mode === 'development',
    },
    // Dev server config for HMR on iframe content
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
      cors: true,
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          sidebar: resolve(__dirname, 'src/sidebar/index.html'),
          button: resolve(__dirname, 'src/button/index.html'),
          badge: resolve(__dirname, 'src/badge/index.html'),
          content: resolve(__dirname, 'src/content/index.ts'),
          'auth-listener': resolve(__dirname, 'src/content/auth-listener.ts'),
          background: resolve(__dirname, 'src/background/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'content') return 'content.js';
            if (chunkInfo.name === 'auth-listener') return 'auth-listener.js';
            if (chunkInfo.name === 'background') return 'background.js';
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
});
