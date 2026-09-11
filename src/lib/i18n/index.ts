import { Locale, Dictionary } from "./types";
import { idDictionary } from "./dictionaries/id";
import { enDictionary } from "./dictionaries/en";
import { arDictionary } from "./dictionaries/ar";

export * from "./types";

export const DICTIONARIES: Record<Locale, Dictionary> = {
  id: idDictionary,
  en: enDictionary,
  ar: arDictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] || DICTIONARIES.id;
}
