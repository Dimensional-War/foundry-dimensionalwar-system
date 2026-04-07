import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import SystemData from "./system.json";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import { viteStaticCopy } from "vite-plugin-static-copy";
import zipPack from "vite-plugin-zip-pack";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // root: "src/", // Source location / esbuild root
  base: `/systems/${SystemData.id}/`, // Base module path that 30001 / served dev directory.
  // publicDir: resolve(__dirname + "public"), // No public resources to copy.

  resolve: {
    conditions: ["import", "browser"],
    alias: {
      "@": resolve(__dirname, "src")
    },
    tsconfigPaths: true
  },

  css: {
    // Creates a standard configuration for PostCSS with autoprefixer & postcss-preset-env.
    // postcss: postcssConfig({ compress: s_COMPRESS, sourceMap: s_SOURCEMAPS })
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["import"]
      }
    }
  },

  define: {
    "process.env": {}
  },

  server: {
    allowedHosts: ["fvtt-dev.dev", "localhost"],
    proxy: {
      // Serves static files from main Foundry server.
      [`^/(systems/${SystemData.id}/(images|assets|lang|packs|style\\.css))`]:
        "http://localhost:30000",

      // // All other paths besides package ID path are served from main Foundry server.
      [`^/(?!` +
      [
        `systems/${SystemData.id}/@vite\\/client`,
        `systems/${SystemData.id}/@id`,
        `systems/${SystemData.id}/.*?/env.mjs$`,
        `systems/${SystemData.id}/node_systems/.vite/.*`,
        `systems/${SystemData.id}/`,
        `/${SystemData.id}/`
      ].join("|") +
      ")"]: "http://localhost:30000",

      // [`^/systems/${SystemData.id}/src/`]: {
      //   target: "http://localhost:30001",
      //   rewrite: path => {
      //     return path.replace(`/systems/${SystemData.id}`, "");
      //   }
      // },

      // Enable socket.io from main Foundry server.
      "/socket.io": { target: "ws://localhost:30000", ws: true }
    }
  },
  preview: {
    allowedHosts: ["fvtt-dev.dev", "localhost"],
    port: 5173,
    proxy: {
      // Serves static files from main Foundry server.
      [`^/(systems/${SystemData.id}/(images|assets|lang|packs|style\\.css))`]:
        "http://localhost:30000",

      // // All other paths besides package ID path are served from main Foundry server.
      [`^/(?!` +
      [
        `systems/${SystemData.id}/@vite\\/client`,
        `systems/${SystemData.id}/@id`,
        `systems/${SystemData.id}/.*?/env.mjs$`,
        `systems/${SystemData.id}/node_systems/.vite/.*`,
        `systems/${SystemData.id}/src/`
      ].join("|") +
      ")"]: "http://localhost:30000",

      // [`^/systems/${SystemData.id}/src/`]: {
      //   target: "http://localhost:30001",
      //   rewrite: path => {
      //     return path.replace(`/systems/${SystemData.id}`, "");
      //   }
      // },

      // Enable socket.io from main Foundry server.
      "/socket.io": { target: "ws://localhost:30000", ws: true }
    }
  },
  build: {
    outDir: resolve(__dirname + "/dist"),
    sourcemap: true,
    // Use esbuild for minification but preserve function/class names for Foundry compatibility
    minify: "esbuild",
    target: ["es2022"],
    manifest: true, // Generate manifest.json for hashed filenames
    lib: {
      name: "dimensionalwar",
      entry: "./src/dimensionalwar.ts",
      formats: ["es"],
      fileName: format => `dimensionalwar.js`, //-[hash].js`, // Include hash in filename
      cssFileName: "styles/dimensionalwar" // Base name, hash added via assetFileNames
    },
    rollupOptions: {
      output: {
        // Include hash in CSS filename for cache busting
        // assetFileNames: assetInfo => {
        //   if (assetInfo.name && assetInfo.name.endsWith(".css")) {
        //     return "styles/dimensionalwar-[hash][extname]";
        //   }
        //   return "assets/[name]-[hash][extname]";
        // }
      },
      onwarn(warning, warn) {
        // Ignore sourcemap warnings
        if (warning.code === "SOURCEMAP_BROKEN") {
          return;
        }

        warn(warning);
      }
    }
  },
  plugins: [
    vue(),
    {
      name: "vite-plugin-system-json",
      closeBundle() {
        // Read the manifest to get hashed filenames
        const manifestPath = resolve(__dirname, "dist/.vite/manifest.json");
        let jsFile = "dimensionalwar.js";
        let cssFiles = ["styles/dimensionalwar.css"];

        // try {
        //   const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        //   // Find the main entry file
        //   const entry = manifest["src/dimensionalwar.ts"];
        //   if (entry) {
        //     jsFile = entry.file;
        //     // Check if CSS is embedded in entry (older Vite) or separate (newer Vite)
        //     if (entry.css && entry.css.length > 0) {
        //       cssFile = entry.css[0];
        //     }
        //   }
        //   // Check for separate style.css entry (Vite 7.x with assetFileNames)
        //   const styleEntry = manifest["style.css"];
        //   if (styleEntry && styleEntry.file) {
        //     cssFile = styleEntry.file;
        //   }
        // } catch (e) {
        //   console.warn(
        //     "Could not read manifest, using default filenames:",
        //     e.message
        //   );
        // }

        // Build system.json with hashed filenames
        const systemJson = { ...SystemData } as Record<string, unknown>;
        delete systemJson.scripts;
        systemJson.esmodules = [jsFile];
        systemJson.styles = cssFiles;
        systemJson.manifest = `https://download.fvtt-dev.dev/system.json`;
        systemJson.download = `https://download.fvtt-dev.dev/releases/download/v${SystemData.version}/system.zip`;

        // Write system.json
        const outputPath = resolve(__dirname, "dist/system.json");
        writeFileSync(outputPath, JSON.stringify(systemJson, null, 2));
      }
    },
    tailwindcss(),
    Components({
      resolvers: [PrimeVueResolver()]
    }),
    ...(mode === "production"
      ? viteStaticCopy({
          targets: [
            { src: "src/module/templates", dest: "" },
            { src: "lang", dest: "" }
            // { src: "packs", dest: "" }
          ]
        })
      : []),
    zipPack({
      inDir: "dist",
      outDir: `download/releases/v${SystemData.version}`,
      outFileName: `system.zip`
    })
  ]
}));
