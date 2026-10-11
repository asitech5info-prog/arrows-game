import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 412, height: 915 } // Modern mobile viewport (e.g. Pixel 7 / Galaxy)
  },
  webServer: {
    command: 'npm.cmd run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
