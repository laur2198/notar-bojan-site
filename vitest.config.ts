import { defineConfig } from 'vitest/config';

// Testele acoperă logica pură din src/lib, src/i18n și scripturile de generare (fără Astro, fără DOM).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/semnatura/**/*.test.mjs'],
    environment: 'node',
  },
});
