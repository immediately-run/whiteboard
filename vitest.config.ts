import { defineConfig } from 'vitest/config';

// Vitest config for the whiteboard app's unit tests (R3-398, R3-399). Pure
// `src/lib/` logic tests run in the node environment; component tests opt into
// jsdom with a `// @vitest-environment jsdom` docblock (like file-explorer).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
