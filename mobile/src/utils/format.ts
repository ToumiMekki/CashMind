import type { Language } from '../database/types';
import { localeMap } from '../i18n';

export const MASK_PLACEHOLDER = '•••••';

export function formatNumber(value: number, language: Language): string {
  const locale = localeMap[language];
  return value.toLocaleString(locale, { maximumFractionDigits: 0 });
}

/**
 * Returns formatted monetary value or masked placeholder based on visibility.
 * Use for balance, totals, and any sensitive financial display.
 */
export function maskMonetaryValue(
  value: number,
  language: Language,
  visible: boolean
): string {
  if (visible) return formatNumber(value, language);
  return MASK_PLACEHOLDER;
}

export function formatDateLong(timestamp: number, language: Language): string {
  const locale = localeMap[language];
  return new Date(timestamp).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Short date e.g. "15 Jan" for compact display. */
export function formatDateShort(timestamp: number, language: Language): string {
  const locale = localeMap[language];
  return new Date(timestamp).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(timestamp: number, language: Language): string {
  const locale = localeMap[language];
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeWithSeconds(timestamp: number, language: Language): string {
  const locale = localeMap[language];
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatLedgerDate(
  timestamp: number,
  language: Language
): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const locale = localeMap[language];

  if (date.toDateString() === today.toDateString()) {
    return language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return language === 'ar' ? 'أمس' : language === 'fr' ? 'Hier' : 'Yesterday';
  }
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function formatWeekday(timestamp: number, language: Language): string {
  const locale = localeMap[language];
  return new Date(timestamp).toLocaleDateString(locale, { weekday: 'short' });
}
