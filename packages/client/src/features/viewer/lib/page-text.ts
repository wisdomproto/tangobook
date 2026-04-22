import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';

export function getPageText(page: Page, lang: LangCode): string {
  if (lang === 'ko') return page.text;
  return page.translations?.[lang]?.text ?? page.text;
}

export function getPageTtsUrl(page: Page, lang: LangCode): string | undefined {
  if (lang === 'ko') return page.ttsUrl;
  return page.translations?.[lang]?.ttsUrl ?? page.ttsUrl;
}
