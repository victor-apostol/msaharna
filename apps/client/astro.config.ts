import qwikdev from "@qwikdev/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import i18n from "astro-i18n-aut/integration";

import { defaultLocale, locales } from "./src/i18n";

const configuredSiteUrl = process.env.PUBLIC_SITE_URL || "http://localhost:4321";
const siteUrl = new URL(configuredSiteUrl);
const configuredBasePath = process.env.PUBLIC_BASE_PATH;
const inferredBasePath = siteUrl.pathname === "/" ? "/" : siteUrl.pathname.replace(/\/$/, "");
const basePath = configuredBasePath || inferredBasePath;

export default defineConfig({
    prefetch: true,
    output: "static",
    base: basePath.startsWith("/") ? basePath : `/${basePath}`,

    trailingSlash: "never",
    build: { format: "file" },
    site: siteUrl.origin,

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
