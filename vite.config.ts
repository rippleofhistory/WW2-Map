import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cesiumEngine } from "vite-plugin-cesium-engine";

export default defineConfig({
  plugins: [react(), cesiumEngine()],
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
  preview: { host: "127.0.0.1", port: 5199, strictPort: true },
});
