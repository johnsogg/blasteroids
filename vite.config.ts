import { resolve } from "path";

import { defineConfig } from "vite";

export default defineConfig({
    server: {
        open: true,
    },
    resolve: {
        alias: {
            "~": resolve(__dirname, "./src"),
        },
    },
    build: {
        sourcemap: true,
        target: "es2020",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
});