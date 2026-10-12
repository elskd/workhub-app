import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/workhub-app/' : '/',
  build: { outDir: 'dist', sourcemap: false },
});
