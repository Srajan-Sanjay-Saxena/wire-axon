import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lib': resolve(__dirname, './types'),
      '@hooks': resolve(__dirname, './hooks'),
      '@helper': resolve(__dirname, './helper'),
      '@schemas': resolve(__dirname, './schemas'),
      '@config': resolve(__dirname, './config'),
      '@base': resolve(__dirname, './base'),
      '@features': resolve(__dirname, './features'),
      '@options': resolve(__dirname, './options'),
      '@services': resolve(__dirname, './services'),
      '@auth': resolve(__dirname, './auth'),
    },
  },
  test: {
    environment: 'node',
  },
});
