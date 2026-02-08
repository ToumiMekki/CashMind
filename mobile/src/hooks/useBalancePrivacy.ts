import { useCallback } from 'react';
import type { Language } from '../database/types';
import { maskMonetaryValue } from '../utils/format';
import { useAppStore } from '../stores/useAppStore';

/**
 * Global balance/amount privacy. When hidden, mask all amounts (balance + transactions) app-wide.
 */
export function useBalancePrivacy(options?: { language?: Language; defaultVisible?: boolean }) {
  const language = useAppStore((s) => s.language);
  const visible = useAppStore((s) => s.balanceVisible);
  const toggle = useAppStore((s) => s.toggleBalanceVisibility);
  const lang = options?.language ?? language;

  const mask = useCallback(
    (value: number) => maskMonetaryValue(value, lang, visible),
    [lang, visible]
  );

  return { visible, toggle, mask };
}
