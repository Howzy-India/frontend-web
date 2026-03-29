import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifestFilename: "manifest.json",
        manifest: {
          name: "Howzy Partner Dashboard",
          short_name: "Howzy",
          description: "The official Howzy Partner Dashboard for managing real estate leads, site visits, and property listings in real-time.",
          theme_color: "#4f46e5",
          background_color: "#ffffff",
          display: "standalone",
          categories: ["business", "productivity", "real estate"],
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
            "vendor-motion": ["motion/react"],
            "vendor-charts": ["recharts"],
            "vendor-icons": ["lucide-react"],
          },
        },
      },
    },
  };
});
