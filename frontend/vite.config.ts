/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // In development the Rails API runs on :3000; in production Rails serves this build itself.
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    clearMocks: true,
    // Threads start faster than forked processes, and one file at a time keeps
    // slow CI/Windows machines from timing out worker startup.
    pool: 'threads',
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
