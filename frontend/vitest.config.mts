import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const zlib = require('node:zlib');

// Polyfill createZstdDecompress for Node environments < 22.19 where undici expects zstd
if (typeof zlib.createZstdDecompress !== 'function') {
  zlib.createZstdDecompress = () => {
    throw new Error('zstd compression is not supported on this Node version');
  };
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
});
