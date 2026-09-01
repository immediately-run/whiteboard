import { defineConfig } from 'vitest/config';

// Vitest config for the whiteboard app's unit tests (R3-398). Tests target pure
// `src/lib/` logic only — the node environment suffices, no jsdom/DOM needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
