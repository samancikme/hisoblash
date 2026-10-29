import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          katex: ['katex'],
          nerdamer: ['nerdamer', 'nerdamer/Calculus.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
