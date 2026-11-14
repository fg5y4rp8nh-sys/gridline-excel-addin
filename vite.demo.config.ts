// Builds the demo page (spreadsheet window + real task pane on a mock Office API) as one classic script,
// so it opens straight from disk. Not needed for the real add-in.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  publicDir: false,
  build: {
    outDir: '../gridline', emptyOutDir: false, cssCodeSplit: false,
    lib: { entry: 'demo/main.ts', name: 'GridlineDemo', formats: ['iife'], fileName: () => 'demo.js' },
    rollupOptions: { output: { assetFileNames: 'demo.[ext]' } }
  }
});
