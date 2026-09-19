import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { i18n } from '@/i18n'
import { appStorage } from '@/utils/storage'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isAppLocale,
  localeOption,
  type AppLocale,
  type LocalePreference,
} from '@/i18n/locales/meta'

/** Best supported match for the device languages, otherwise the default locale. */
export function detectDeviceLocale(): AppLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean) as string[]
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase()
    const exact = SUPPORTED_LOCALES.find((item) => item.code.toLowerCase() === normalized)
    if (exact) return exact.code
    const language = normalized.split('-')[0]
    const partial = SUPPORTED_LOCALES.find((item) => item.code.split('-')[0].toLowerCase() === language)
    if (partial) return partial.code
  }
  return DEFAULT_LOCALE
}

export const useLocaleStore = defineStore('locale', () => {
  /** Persisted user choice: `system` follows the device, otherwise an explicit locale. */
  const preference = ref<LocalePreference>('system')
  const systemLocale = ref<AppLocale>(detectDeviceLocale())

  const locale = computed<AppLocale>(() => (preference.value === 'system' ? systemLocale.value : preference.value))
  const option = computed(() => localeOption(locale.value))

  function apply(code: AppLocale) {
    const meta = localeOption(code)
    i18n.global.locale.value = code
    dayjs.locale(meta.dayjsLocale)
    if (typeof document !== 'undefined') document.documentElement.lang = meta.htmlLang
  }

  function setPreference(next: LocalePreference) {
    preference.value = next
    apply(locale.value)
    void appStorage.set(LOCALE_STORAGE_KEY, next)
  }

  /** Read the persisted preference and apply it. Call once, before mounting the app. */
  function initLocale() {
    const stored = appStorage.getSync(LOCALE_STORAGE_KEY)
    preference.value = stored === 'system' || isAppLocale(stored) ? stored : 'system'
    systemLocale.value = detectDeviceLocale()
    apply(locale.value)
  }

  /** Re-evaluate the device language (e.g. after a `languagechange` event). */
  function refreshSystemLocale() {
    systemLocale.value = detectDeviceLocale()
    if (preference.value === 'system') apply(locale.value)
  }

  return { preference, locale, systemLocale, option, setPreference, initLocale, refreshSystemLocale }
})
