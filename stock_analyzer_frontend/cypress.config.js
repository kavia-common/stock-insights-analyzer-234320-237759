import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 1200,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    retries: {
      runMode: 1,
      openMode: 0
    }
  }
});
