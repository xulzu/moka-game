import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src") + "/",
    },
  },

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
