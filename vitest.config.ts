import { defineConfig } from 'vitest/config';

// Testele acoperă logica pură din src/lib și src/i18n (fără Astro, fără DOM).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
