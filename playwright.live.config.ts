import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL;

if (!baseURL) {
  throw new Error("E2E_BASE_URL is required for live Preview verification.");
}

export default defineConfig({
  testDir: "./tests/live-e2e",
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
});
