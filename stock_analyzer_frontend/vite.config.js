import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PUBLIC_INTERFACE
export default defineConfig({
  /** Vite configuration for the Stock Insights Analyzer SPA. */
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    host: true
  }
});
