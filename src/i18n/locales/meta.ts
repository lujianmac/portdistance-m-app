/**
 * Locale registry.
 *
 * Add a new language by:
 *   1. adding an entry to `SUPPORTED_LOCALES`
 *   2. creating `src/i18n/locales/<code>/` with the same namespace files
 *   3. registering it in `src/i18n/index.ts` and `src/i18n/locales/<code>/index.ts`
 *
 * 新语言的做法：目录直接以 `en-US` 为基线复制，再逐命名空间翻译。未翻译的 key 保持
 * 英文值（而不是缺失），这样 `i18n:check` 的 key 对称校验仍然通过，落到的就是产品
 * 要求的「专业词汇/属性默认英文」；`scripts/i18n-progress.mjs` 可以看各语言进度。
 */

export interface LocaleOption {
  /**
   * BCP-47 locale code, also used as the vue-i18n message key.
   * Typed as `string` on purpose: `AppLocale` is derived FROM this registry, so referring
   * to it here would be circular. The registry is the single source of truth for the union.
   */
  code: string
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
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', htmlLang: 'ja', dayjsLocale: 'ja', apiLanguage: 'en' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', htmlLang: 'ko', dayjsLocale: 'ko', apiLanguage: 'en' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek', htmlLang: 'el', dayjsLocale: 'el', apiLanguage: 'en' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', htmlLang: 'ru', dayjsLocale: 'ru', apiLanguage: 'en' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', htmlLang: 'es', dayjsLocale: 'es', apiLanguage: 'en' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', htmlLang: 'tr', dayjsLocale: 'tr', apiLanguage: 'en' },
] as const satisfies readonly LocaleOption[]

/** Every locale code in the registry (derived, so adding a language cannot desync the type). */
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]['code']

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
