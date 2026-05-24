import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  define: {
    // Consumers override __APP_VERSION__ in their own vite.config define block.
    // The fallback keeps the build from erroring when the kit is built standalone.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AINDYUiKit",
      formats: ["es", "cjs"],
      fileName: (format) => format === "cjs" ? "index.cjs" : "index.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-dom/client", "react-router-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-router-dom": "ReactRouterDOM",
        },
      },
    },
    sourcemap: true,
  },
});
