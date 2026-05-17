import qwikdev from "@qwikdev/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import i18n from "astro-i18n-aut/integration";

import { defaultLocale, locales } from "./src/i18n";

export default defineConfig({
    prefetch: true,
    output: "static",
    base: process.env.PUBLIC_BASE_PATH || "/",

    trailingSlash: "never",
    build: { format: "file" },
    site: process.env.PUBLIC_SITE_URL || "http://localhost:4321",

    integrations: [
        qwikdev(),
        i18n({
            locales,
            defaultLocale,
        }),
    ],
    vite: { plugins: [tailwindcss()] },
});

// Sitemap: https://github.com/jlarmstrongiv/astro-i18n-aut#configure
