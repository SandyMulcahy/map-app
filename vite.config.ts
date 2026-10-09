import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths, so the build works both at a domain root (Vercel)
  // and in a sub-folder (GitHub Pages serves it at /map-app/).
  base: './',
  plugins: [react()],
});
