import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// The sidebar is built as one IIFE script. React, ReactDOM and jsPDF load from a CDN in Sidebar.html,
// which keeps the Apps Script file small. JSX uses the classic React.createElement transform for the same reason.
export default defineConfig({
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: {
    outDir: 'build', emptyOutDir: true, cssCodeSplit: false, minify: true,
    lib: { entry: resolve(__dirname, 'src/sidebar/main.tsx'), name: 'Gridline', formats: ['iife'], fileName: () => 'sidebar.js' },
    rollupOptions: {
      external: ['react', 'react-dom/client', 'jspdf'],
      output: { globals: { react: 'React', 'react-dom/client': 'ReactDOM', jspdf: 'jspdf' }, assetFileNames: 'sidebar.[ext]' }
    }
  }
});
