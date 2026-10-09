import { activeLocale } from '@/i18n'

/**
 * Locale-aware Intl helpers.
 *
 * Never hardcode `'zh-CN'` in a component: pass the active locale so dates and
 * numbers follow the language the user picked.
 */

export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 },
): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return '-'
  return new Intl.NumberFormat(activeLocale(), options).format(numeric)
}

/** Amounts (money / tonnage / distance) with 2 decimals at most. */
export function formatAmount(value: number | string | null | undefined): string {
  return formatNumber(value, { maximumFractionDigits: 2 })
}

/** `2026-07-29 14:05:00` -> `2026-07-29T14:05:00` (WKWebView/Safari cannot parse the space form). */
function normalizeDateInput(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) return trimmed.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00`
  return trimmed
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  // A numeric string is an epoch timestamp; `Number('2026-07-29 14:05')` is NaN so
  // the two cases cannot collide. `new Date('1753790700000')` is Invalid Date in every
  // engine, which is why the API's timestamp has to be detected numerically first.
  const numeric = typeof value === 'number' ? value : Number(value)
  const date = Number.isFinite(numeric) && String(value).trim() !== ''
    // Seconds-precision timestamps (10 digits) are still accepted as such.
    ? new Date(Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric)
    : new Date(normalizeDateInput(String(value)))
  return Number.isNaN(date.getTime()) ? null : date
}

/** `2026/07/29 14:05` in the active locale, with an optional fallback text. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = '-',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
): string {
  const date = toDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(activeLocale(), options).format(date)
}

/** Date only (no time). */
export function formatDate(
  value: string | number | Date | null | undefined,
  fallback = '-',
): string {
  return formatDateTime(value, fallback, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** Time only (24h clock). */
export function formatTime(
  value: string | number | Date | null | undefined,
  fallback = '-',
): string {
  return formatDateTime(value, fallback, { hour: '2-digit', minute: '2-digit', hour12: false })
}
