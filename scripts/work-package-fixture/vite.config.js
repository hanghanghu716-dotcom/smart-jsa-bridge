import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^.*\/services\/workPackageService$/,
        replacement: fileURLToPath(new URL("./service.js", import.meta.url)),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
});
