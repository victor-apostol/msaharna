import { component$ } from "@builder.io/qwik";

import type { Locale } from "@i18n";
import { getLocalizedPath, useTranslations } from "@i18n/utils";
import { stripBasePath } from "@utils/paths";

type NavbarProps = {
  path: string;
  lang: Locale;
};

const Navbar = component$<NavbarProps>(({ path, lang }) => {
  const t = useTranslations(lang);
  const normalizedPath = stripBasePath(path).replace(/\.html$/, "") || "/";
  const isHome = normalizedPath === "/" || normalizedPath === `/${lang}`;
  const newsPath = getLocalizedPath("/posts", lang);
  const donationsPath = getLocalizedPath("/donations", lang);
  const isNews =
    normalizedPath === "/news" ||
    normalizedPath === "/posts" ||
    normalizedPath === `/${lang}/news` ||
    normalizedPath === `/${lang}/posts` ||
    normalizedPath.includes("/news/") ||
    normalizedPath.includes("/posts/");
  const isDonations = normalizedPath === "/donations" || normalizedPath === `/${lang}/donations`;
  const navItems = [
    { key: "nav.home", href: getLocalizedPath("/", lang), active: isHome },
    { key: "nav.news", href: newsPath, active: isNews },
  ] as const;
  const languageItems = [
    { locale: "ro", flagClass: "flag-ro", label: "RO" },
    { locale: "ru", flagClass: "flag-ru", label: "RU" },
    { locale: "en", flagClass: "flag-us", label: "EN" },
  ] as const;

  return (
    <header class="sticky top-0 z-50 shadow-[0_1px_0_rgb(0_0_0_/_8%)]">
      <div class="bg-[#006610] font-sans text-sm font-bold text-white">
        <div class="mx-auto flex min-h-[34px] w-[min(1120px,calc(100%_-_20px))] items-center justify-end gap-[22px] py-1 max-sm:w-[calc(100%_-_32px)] max-sm:justify-center max-sm:gap-4">
          <nav class="flex items-center gap-[18px]" aria-label={t("language.label")}>
            {languageItems.map((item) => (
              <a
                key={item.locale}
                href={getLocalizedPath(path, item.locale)}
                aria-label={t(`language.${item.locale}`)}
                aria-current={lang === item.locale ? "true" : undefined}>
                <span class={`flag ${item.flagClass}`} /> {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div class="bg-white">
        <input id="primary-menu-toggle" class="peer sr-only" type="checkbox" aria-hidden="true" />
        <div class="mx-auto grid h-[82px] w-[min(1120px,calc(100%_-_20px))] grid-cols-[150px_1fr] items-center max-lg:grid-cols-[70px_1fr_auto] max-sm:h-[66px] max-sm:w-[calc(100%_-_32px)] max-sm:grid-cols-[52px_1fr_auto] peer-checked:[&_.burger-bottom]:top-[7px] peer-checked:[&_.burger-bottom]:-rotate-45 peer-checked:[&_.burger-middle]:opacity-0 peer-checked:[&_.burger-top]:top-[7px] peer-checked:[&_.burger-top]:rotate-45 max-sm:peer-checked:[&_.burger-bottom]:top-[6px] max-sm:peer-checked:[&_.burger-top]:top-[6px]">
          <a class="cathedral-mark" href={getLocalizedPath("/", lang)} aria-label={t("main.title")}>
            <span class="mark-dome mark-dome-left" />
            <span class="mark-dome mark-dome-center" />
            <span class="mark-dome mark-dome-right" />
            <span class="mark-body" />
          </a>

          <nav
            class="relative z-[1] flex w-full items-center justify-end gap-[31px] text-sm font-bold text-[#3f3f3f] max-lg:hidden"
            aria-label={t("nav.home")}>
            {navItems.map((item) => (
              <a
                key={item.key}
                class={`whitespace-nowrap hover:text-[#f23b2f] hover:underline ${item.active ? "text-[#f23b2f]" : ""}`}
                href={item.href}>
                {t(item.key)}
              </a>
            ))}
            <a
              class={`whitespace-nowrap hover:text-[#f23b2f] hover:underline ${isDonations ? "text-[#f23b2f]" : ""}`}
              href={donationsPath}>
              {t("nav.donations")}
            </a>
            <a
              class="bg-church-green inline-flex min-h-10 items-center justify-center rounded-md px-4 font-bold whitespace-nowrap text-white shadow-[0_8px_20px_rgb(8_115_61_/_20%)] transition hover:bg-[#065f32]"
              href="#pomelnic-modal">
              {t("nav.pomelnic")}
            </a>
          </nav>

          <label
            for="primary-menu-toggle"
            class="text-church-green col-start-3 hidden h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-neutral-200 bg-white transition marker:hidden hover:bg-neutral-50 max-lg:inline-flex max-sm:h-9 max-sm:w-9 [&::-webkit-details-marker]:hidden"
            aria-label={t("nav.openMenu")}
            aria-controls="primary-menu">
            <span class="sr-only">{t("nav.menu")}</span>
            <span class="relative block h-4 w-5 max-sm:h-3.5 max-sm:w-4" aria-hidden="true">
              <span class="burger-top absolute top-0 left-0 h-0.5 w-5 bg-current transition max-sm:w-4" />
              <span class="burger-middle absolute top-[7px] left-0 h-0.5 w-5 bg-current transition max-sm:top-[6px] max-sm:w-4" />
              <span class="burger-bottom absolute top-3.5 left-0 h-0.5 w-5 bg-current transition max-sm:top-3 max-sm:w-4" />
            </span>
          </label>
        </div>

        <nav
          id="primary-menu"
          class="hidden border-t border-neutral-200 bg-white peer-checked:block lg:hidden"
          aria-label={t("nav.menu")}>
          <div class="mx-auto grid w-[min(1120px,calc(100%_-_20px))] gap-1 py-3 text-base font-bold text-[#3f3f3f] max-sm:w-[calc(100%_-_32px)]">
            {navItems.map((item) => (
              <a
                key={item.key}
                class={`rounded-md px-3 py-3 ${item.active ? "bg-[#f7efee] text-[#f23b2f]" : "hover:bg-neutral-50"}`}
                href={item.href}>
                {t(item.key)}
              </a>
            ))}
            <a
              class={`rounded-md px-3 py-3 ${isDonations ? "bg-[#f7efee] text-[#f23b2f]" : "hover:bg-neutral-50"}`}
              href={donationsPath}>
              {t("nav.donations")}
            </a>
            <a
              class="bg-church-green mt-2 inline-flex min-h-11 items-center justify-center rounded-md px-4 font-bold text-white shadow-[0_8px_20px_rgb(8_115_61_/_18%)] transition hover:bg-[#065f32]"
              href="#pomelnic-modal">
              {t("nav.pomelnic")}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
});

export default Navbar;
