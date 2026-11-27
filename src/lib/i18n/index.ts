import { Locale, Dictionary } from "./types";
import { idDictionary } from "./dictionaries/id";

export * from "./types";
export * from "./LanguageContext";

const LOADED_DICTIONARIES: Partial<Record<Locale, Dictionary>> = {
  id: idDictionary,
};

export const DICTIONARIES: Partial<Record<Locale, Dictionary>> & { id: Dictionary } = LOADED_DICTIONARIES as Partial<
  Record<Locale, Dictionary>
> & { id: Dictionary };

export function getDictionary(locale: Locale): Dictionary {
  return LOADED_DICTIONARIES[locale] || idDictionary;
}

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  if (LOADED_DICTIONARIES[locale]) {
    return LOADED_DICTIONARIES[locale]!;
  }

  if (locale === "en") {
    const mod = await import("./dictionaries/en");
    LOADED_DICTIONARIES.en = mod.enDictionary;
    return mod.enDictionary;
  }

  if (locale === "ar") {
    const mod = await import("./dictionaries/ar");
    LOADED_DICTIONARIES.ar = mod.arDictionary;
    return mod.arDictionary;
  }

  return idDictionary;
}
