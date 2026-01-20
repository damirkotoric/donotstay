import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Copy manifest and icons after build
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // Copy manifest
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );
      // Copy icons
      const iconsDir = resolve(__dirname, 'dist/icons');
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      const iconSizes = ['16', '32', '48', '128'];
      for (const size of iconSizes) {
        const src = resolve(__dirname, `public/icons/icon${size}.png`);
        const dest = resolve(__dirname, `dist/icons/icon${size}.png`);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
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
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        sidebar: resolve(__dirname, 'src/sidebar/index.html'),
        button: resolve(__dirname, 'src/button/index.html'),
        badge: resolve(__dirname, 'src/badge/index.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content.js';
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
}));
