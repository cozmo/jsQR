import { copyFileSync, mkdirSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outDir: "dist",
    target: "es2020",
    outExtension({ format }) {
      if (format === "esm") return { js: ".mjs" };
      if (format === "cjs") return { js: ".cjs" };
      return { js: ".js" };
    },
  },
  {
    entry: { jsQR: "src/index.ts" },
    format: ["iife"],
    globalName: "jsQR",
    // Unwrap the IIFE's namespace object so `window.jsQR` is the function itself,
    // matching the legacy UMD `libraryExport: "default"` behavior.
    footer: { js: "jsQR = jsQR.default;" },
    sourcemap: true,
    outDir: "dist",
    target: "es2020",
    outExtension: () => ({ js: ".js" }),
    onSuccess: async () => {
      mkdirSync("docs", { recursive: true });
      copyFileSync("dist/jsQR.js", "docs/jsQR.js");
    },
  },
]);
