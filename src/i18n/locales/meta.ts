/**
 * Locale registry.
 *
 * Add a new language by:
 *   1. adding an entry to `SUPPORTED_LOCALES`
 *   2. creating `src/i18n/locales/<code>/` with the same namespace files
 *   3. registering it in `src/i18n/index.ts` and `src/i18n/locales/<code>/index.ts`
 */

export interface LocaleOption {
  /** BCP-47 locale code, also used as the vue-i18n message key. */
  code: AppLocale
  /** Name shown in the language picker, always written in that language. */
  nativeName: string
  /** English name, used in logs and fallback contexts. */
  englishName: string
  /** Value applied to `document.documentElement.lang`. */
  htmlLang: string
  /** Locale used by dayjs (see `dayjs/locale/*`). */
  dayjsLocale: string
  /** Language code expected by the backend `language` request parameter (e-mail templates). */
  apiLanguage: 'zh' | 'en'
}

export const SUPPORTED_LOCALES = [
  { code: 'zh-CN', nativeName: '简体中文', englishName: 'Chinese (Simplified)', htmlLang: 'zh-CN', dayjsLocale: 'zh-cn', apiLanguage: 'zh' },
  { code: 'en-US', nativeName: 'English', englishName: 'English', htmlLang: 'en-US', dayjsLocale: 'en', apiLanguage: 'en' },
] as const satisfies readonly LocaleOption[]

export type AppLocale = 'zh-CN' | 'en-US'

/** Locale used when the device language is not supported and nothing is stored yet. */
export const DEFAULT_LOCALE: AppLocale = 'en-US'

/** Locale used when a translation key is missing in the active locale. */
export const FALLBACK_LOCALE: AppLocale = 'en-US'

/** Persisted user preference: an explicit locale, or `system` to follow the device. */
export type LocalePreference = AppLocale | 'system'

export const LOCALE_STORAGE_KEY = 'pd.app.locale'

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.some((item) => item.code === value)
}

export function localeOption(code: AppLocale): LocaleOption {
  return SUPPORTED_LOCALES.find((item) => item.code === code) ?? SUPPORTED_LOCALES[0]
}
