/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : l'application fonctionne depuis n'importe quel dossier (local ou GitHub Pages).
// Le build est écrit dans ../dietes pour être servi sur https://marieugc.github.io/landing-impact/dietes/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: '../dietes', emptyOutDir: true },
  test: { environment: 'node' },
});
