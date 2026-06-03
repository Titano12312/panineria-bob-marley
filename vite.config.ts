// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Use the cloudflare-pages preset when deploying to Cloudflare Pages so Nitro
// emits a `_worker.js` + `_routes.json` SSR bundle into `dist/` (fixes 404 on
// page refresh / deep links).
const isPagesBuild = process.env.CF_PAGES === "1" || process.env.NITRO_PRESET === "cloudflare-pages";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: isPagesBuild ? "cloudflare-pages" : "cloudflare-module",
  },
});
