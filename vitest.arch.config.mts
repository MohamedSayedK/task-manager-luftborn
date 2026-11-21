import { defineConfig } from 'vitest/config';

// Architecture tests run in plain Node, outside the Angular builder: `npm run test:arch`.
export default defineConfig({
  test: {
    include: ['arch/**/*.spec.ts'],
    environment: 'node',
  },
});
