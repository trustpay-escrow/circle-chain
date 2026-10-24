import '@testing-library/jest-dom/vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const zlib = require('node:zlib');

if (typeof zlib.createZstdDecompress !== 'function') {
  zlib.createZstdDecompress = () => {
    throw new Error('zstd compression is not supported on this Node version');
  };
}
