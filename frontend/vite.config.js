import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // host: true binds every interface, so other devices on the same WiFi can reach it.
    host: true,
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
