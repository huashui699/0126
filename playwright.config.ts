import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], channel: "msedge" } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], channel: "msedge" } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `"${process.execPath}" node_modules/next/dist/bin/next dev`,
    url: "http://localhost:3000/onboarding/teams",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

