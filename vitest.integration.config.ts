import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/integration/**/*.test.ts',
      'tests/fuzz/**/*.test.ts',
    ],
    setupFiles: ['tests/integration/setup.ts'],
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
