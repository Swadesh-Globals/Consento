import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";

/**
 * Console UI string catalogue — English only. Principal-facing translations (notices,
 * banner, privacy policy) are tenant content managed in language packs (CFG-11), not here.
 */
export function createI18n(): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    defaultNS: "translation",
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance;
}

export type { Resources } from "./locales/en";
