import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const NAVY = "#0C2340";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      includeAssets: [
        "icons/logo-icon.png",
        "logo-icon.png",
        "logo-horizontal.png",
        "apple-touch-icon.png",
        "offline.html",
      ],
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        globIgnores: ["**/mockups-v2/**"],
      },
      manifest: {
        id: "/",
        name: "Newsplus",
        short_name: "Newsplus",
        description: "AI-powered news monitoring, summarisation, translation & report writing",
        lang: "ar",
        dir: "rtl",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        background_color: NAVY,
        theme_color: NAVY,
        categories: ["news", "productivity"],
        icons: [
          {
            src: "pwa/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@newsplus/shared": path.resolve(rootDir, "../packages/shared/src"),
    },
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: 660_000,
        proxyTimeout: 660_000,
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    host: true,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(rootDir, "..")],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: 660_000,
        proxyTimeout: 660_000,
      },
    },
  },
});
