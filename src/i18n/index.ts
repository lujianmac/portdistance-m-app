import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import ja from './locales/ja'
import ko from './locales/ko'
import el from './locales/el'
import ru from './locales/ru'
import es from './locales/es'
import tr from './locales/tr'
import { DEFAULT_LOCALE, FALLBACK_LOCALE, isAppLocale, localeOption, type AppLocale } from './locales/meta'

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  ja,
  ko,
  el,
  ru,
  es,
  tr,
}

/**
 * Single vue-i18n instance (Composition API mode).
 *
 * - Component code: `const { t, locale } = useI18n()` from `vue-i18n`.
 * - Plain TS modules: `import { t } from '@/i18n'`.
 */
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages,
  warnHtmlMessage: false,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

type TranslateFn = (key: string, named?: Record<string, unknown>) => string

/** Translation for plain TS modules (stores, api, utils). */
export function t(key: string, named?: Record<string, unknown>): string {
  const translate = i18n.global.t as unknown as TranslateFn
  return named ? translate(key, named) : translate(key)
}

/** Current active locale code. */
export function activeLocale(): AppLocale {
  const value = String(i18n.global.locale.value)
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

/** Language code for backend requests that localise server-side content (e-mail templates). */
export function apiLanguage(): 'zh' | 'en' {
  return localeOption(activeLocale()).apiLanguage
}
