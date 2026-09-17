import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 240_000,
  workers: 1,
  reporter: [['line'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { channel: process.env.CI ? undefined : 'chrome', baseURL: 'http://127.0.0.1:5173', viewport: { width: 1600, height: 1000 }, launchOptions: { args: ['--autoplay-policy=user-gesture-required'] } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
})
