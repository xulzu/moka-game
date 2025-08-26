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
    port: 4080,
    host: "0.0.0.0",
    proxy: {
      "^/(api|sse)": {
        target: "http://localhost:51820",
        changeOrigin: true,
      },
    },
  },
});
