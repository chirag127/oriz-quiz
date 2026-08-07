// @ts-check
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import AstroPWA from "@vite-pwa/astro"

export default defineConfig({
  site: "https://quiz.oriz.in",
  output: "static",
  integrations: [
    react(),
    sitemap(),
    AstroPWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icons/*.png", "icons/*.svg", ".well-known/assetlinks.json"],
      manifest: {
        name: "oriz Quiz",
        short_name: "Quiz",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        lang: "en",
        dir: "ltr",
        description: "Turn any topic into a quiz or flashcard deck, then drill it with spaced repetition. 100% client-side.",
        categories: ["education"],
        background_color: "#1f3d34",
        theme_color: "#e23b3b",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
          { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
        screenshots: [
          { src: "/screenshots/desktop.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "oriz Quiz — desktop" },
          { src: "/screenshots/mobile.png", sizes: "390x844", type: "image/png", label: "oriz Quiz — mobile" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}"],
        navigateFallback: "/",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-z0-9-]+\.)?pollinations\.ai\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "ai-pollinations",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/([a-z0-9-]+\.)?g4f\.(dev|icu)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "ai-g4f",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
