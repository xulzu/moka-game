import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 8080,
    proxy: {
      "^/(api|sse)": {
        target: "http://localhost:4004",
        changeOrigin: true,
      },
    },
  },
});
