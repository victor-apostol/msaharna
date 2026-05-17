import qwikdev from "@qwikdev/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import i18n from "astro-i18n-aut/integration";

import { defaultLocale, locales } from "./src/i18n";

const siteBase = "/msaharna/";

export default defineConfig({
    prefetch: true,
    output: "static",
    site: "https://victor-apostol.github.io",
    base: siteBase,

    trailingSlash: "never",
    build: { format: "file" },

    integrations: [
        qwikdev(),
        i18n({
            locales,
            defaultLocale,
        }),
    ],
    vite: {
        base: siteBase,
        plugins: [tailwindcss()],
    },
});

// Sitemap: https://github.com/jlarmstrongiv/astro-i18n-aut#configure
