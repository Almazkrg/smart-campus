import { defineConfig } from 'vite';

// Builds both pages: index.html (Smart Campus checker) and practice12.html (Practice #12). Tests use vitest.config.js.
export default defineConfig({
  build: { rollupOptions: { input: { main: 'index.html', practice12: 'practice12.html' } } },
});
