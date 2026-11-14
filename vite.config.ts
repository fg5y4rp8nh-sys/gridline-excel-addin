import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Office add-ins must be served over HTTPS. `npm run dev` uses the dev certs from office-addin-dev-certs if present.
export default defineConfig({
  root: 'src',
  base: './',   // relative URLs, so dist/ works from any folder (GitHub Pages, Azure, Vercel…)
  publicDir: resolve(__dirname, 'public'),
  plugins: [react()],
  server: { port: 3000, https: undefined },
  build: {
    outDir: resolve(__dirname, 'dist'), emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'assets/[name].js' }, input: {
      taskpane: resolve(__dirname, 'src/taskpane/taskpane.html')
    } }
  }
});
