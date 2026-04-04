import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 240000,
  expect: {
    timeout: 20000
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1440, height: 900 }
  },
  reporter: [['list']]
});