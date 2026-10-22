import { defineConfig, devices } from '@playwright/test'

// The journey runs against the production build served by `vite preview` on
// :3000. Vite forwards /api to a Conduit backend on :8080. When no backend is
// running, e2e/support/mock-api.mjs is started on :8080 instead, so the suite
// also runs in CI. Any real backend that is already listening is reused.
const PORT = Number(process.env.E2E_PORT ?? 3000)
const API_PORT = Number(process.env.MOCK_API_PORT ?? 8080)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/mock-api.mjs',
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: true,
      timeout: 30_000,
      env: { MOCK_API_PORT: String(API_PORT) },
    },
    {
      command: `npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
    },
  ],
})
