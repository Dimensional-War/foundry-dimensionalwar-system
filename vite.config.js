import { resolve } from "path";
import SystemData from "./system.json";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import generateFile from "vite-plugin-generate-file";

// https://vitejs.dev/config/
export default defineConfig({
  // root: "src/", // Source location / esbuild root
  base: `/systems/${SystemData.id}/`, // Base module path that 30001 / served dev directory.
  // publicDir: resolve(__dirname + "public"), // No public resources to copy.

  resolve: {
    conditions: ["import", "browser"],
    alias: {
      "~": resolve(__dirname + "src")
    }
  },

  esbuild: {
    target: ["es2022"]
  },

  css: {
    // Creates a standard configuration for PostCSS with autoprefixer & postcss-preset-env.
    // postcss: postcssConfig({ compress: s_COMPRESS, sourceMap: s_SOURCEMAPS })
    devSourcemap: true
  },

  define: {
    "process.env": {}
  },

  server: {
    port: 30001,
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
        `systems/${SystemData.id}/src/`,
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
    port: 30001,
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
        `systems/${SystemData.id}/src/`,
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
  build: {
    outDir: resolve(__dirname + "/dist"),
    emptyOutDir: true,
    sourcemap: "inline",
    // Avoiding minification is important, because we don't want names of globals/etc. to be mangled.
    minify: false,
    target: ["es2022"],
    lib: {
      entry: "./src/dimensionalwar.js",
      formats: ["es"],
      fileName: "dimensionalwar",
      cssFileName: "styles/dimensionalwar"
    }
  },
  // Necessary when using the dev server for top-level await usage inside of TRL.
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022"
    }
  },
  plugins: [
    vue(),
    {
      name: "vite-plugin-prebuild",
      buildStart() {
        delete SystemData.scripts;
        SystemData.esmodules = ["dimensionalwar.js"];
        SystemData.styles = ["styles/dimensionalwar.css"];
      }
    },
    tailwindcss(),
    generateFile([
      {
        type: "template",
        template: "src/system.ejs",
        output: "system.json",
        data: { SystemData }
      }
    ])
    // viteStaticCopy({
    //   targets: [{ src: "lang", dest: "" }]
    // })
  ]
});
