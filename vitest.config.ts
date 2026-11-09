import { defineConfig } from 'vitest/config';

// Testele acoperă logica pură din src/lib, src/i18n și src/scripts (fără Astro, fără DOM).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Implicit, Vitest înlocuiește CSS-ul importat cu un șir gol; src/lib/tokens.ts citește
    // tokens.css ca text (?raw), deci fișierul trebuie procesat.
    css: { include: [/tokens\.css/] },
  },
});
