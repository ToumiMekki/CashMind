import { I18n } from 'i18n-js';
import type { Language } from '../database/types';
import ar from './locales/ar';
import en from './locales/en';
import fr from './locales/fr';

const i18n = new I18n({ ar, fr, en });

export const localeMap: Record<Language, string> = {
  ar: 'ar-DZ',
  fr: 'fr-DZ',
  en: 'en-DZ',
};

export function setI18nLanguage(lang: Language): void {
  i18n.locale = lang;
}

export function t(key: string): string {
  return i18n.t(key);
}

export { i18n };
