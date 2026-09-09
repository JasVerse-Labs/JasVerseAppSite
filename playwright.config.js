// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false, // the upgrade-regression test manages its own servers sequentially
  reporter: "line",
  use: {
    headless: true,
  },
});
