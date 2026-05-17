import qwikdev from "@qwikdev/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import i18n from "astro-i18n-aut/integration";

import { defaultLocale, locales } from "./src/i18n";

export default defineConfig({
  prefetch: true,
  output: "static",
  site: "https://victor-apostol.github.io",
  base: "/msaharna",

  integrations: [
    qwikdev(),
    i18n({
      locales,
      defaultLocale,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
