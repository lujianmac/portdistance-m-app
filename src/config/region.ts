/**
 * Device region detection.
 *
 * Only the map defaults use this (initial centre/zoom and which basemap is
 * offered first). The UI language deliberately keeps following the *language*
 * reported by the device, not the region — see `stores/locale.ts`.
 */

export type AppRegion = 'CN' | 'EU' | 'APAC' | 'AMERICAS' | 'GLOBAL'

export interface DefaultMapView {
  /** `[longitude, latitude]` in business (WGS84) coordinates. */
  center: [number, number]
  zoom: number
}

/**
 * Chinese mainland time zones only. Hong Kong / Macao / Taiwan intentionally
 * fall into APAC: the GCJ-02 offset of the domestic basemap does not apply
 * there, so those users are better served by the WGS84 global basemap.
 */
const MAINLAND_CHINA_ZONES = new Set([
  'Asia/Shanghai',
  'Asia/Urumqi',
  'Asia/Chongqing',
  'Asia/Harbin',
  'Asia/Kashgar',
  'PRC',
])

const EUROPE_ZONE = /^Europe\//
const AMERICAS_ZONE = /^(America|US|Canada|Brazil|Chile|Mexico|Argentina)\//
const APAC_ZONE = /^(Asia|Australia|Pacific|Indian)\//

const EU_REGIONS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH', 'IS',
])

const AMERICAS_REGIONS = new Set([
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'CR', 'PA',
  'CU', 'DO', 'GT', 'HN', 'NI', 'SV',
])

const APAC_REGIONS = new Set([
  'CN', 'HK', 'MO', 'TW', 'JP', 'KR', 'SG', 'MY', 'ID', 'TH', 'VN', 'PH', 'IN', 'PK', 'BD',
  'LK', 'AU', 'NZ', 'AE', 'SA', 'QA', 'OM', 'KW', 'BH',
])

/**
 * Only two default views are left (product rule): China/Asia-Pacific users look
 * at the China Sea, everybody else at the Atlantic.
 *
 * - China Sea: the basin spans roughly 99..141 E / 3..41 N (Beibu Gulf to the
 *   Sea of Japan). `[122, 30]` is its centre of mass for shipping, and zoom 4
 *   frames the East China Sea / Yellow Sea / South China Sea plus Japan and the
 *   Philippines without wasting the screen on the Pacific.
 * - Atlantic: the basin spans roughly -80 (Gulf of Mexico / Panama) .. 20 E
 *   (west coast of Europe/Africa). `[-30, 20]` keeps the mid-Atlantic — where
 *   the Europe-Americas and the Europe-Asia (Cape) lanes cross — in the middle
 *   and stays north of the equator so the North Atlantic trunk routes are fully
 *   in frame. Zoom 3 (~2048 px world) shows the basin with both continental
 *   margins on a phone in landscape and does not crop one of them the way zoom
 *   4 would; zoom 2 (the old GLOBAL fallback) would spend half the screen on the
 *   Pacific.
 */
const CHINA_SEA_VIEW: DefaultMapView = { center: [122, 30], zoom: 4 }
const ATLANTIC_VIEW: DefaultMapView = { center: [-30, 20], zoom: 3 }

/**
 * Primary time zone of each region, used as the fallback when the device time
 * zone cannot be resolved (see the voyage page). Deliberately a fixed zone per
 * region: the region is only a coarse signal, so a wrong guess must stay close
 * to the user's actual offset.
 */
const REGION_TIME_ZONES: Record<AppRegion, string> = {
  CN: 'Asia/Shanghai',
  EU: 'Europe/London',
  APAC: 'Asia/Singapore',
  AMERICAS: 'America/New_York',
  GLOBAL: 'UTC',
}

let cachedRegion: AppRegion | null = null

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

/** Region subtag of the device language (`en-GB` -> `GB`). */
function deviceLocaleRegion(): string {
  if (typeof navigator === 'undefined') return ''
  const language = navigator.languages?.[0] || navigator.language || ''
  if (!language) return ''

  try {
    const Locale = (Intl as unknown as { Locale?: new (tag: string) => { region?: string } }).Locale
    const region = Locale ? new Locale(language).region : undefined
    if (region) return region.toUpperCase()
  } catch {
    // fall through to the manual parse
  }

  const parts = language.split('-')
  const region = parts.length > 1 ? parts[parts.length - 1] : ''
  return /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : ''
}

/**
 * Region of the device. The time zone is the strongest signal of where the
 * device actually is (a Chinese user with an English phone still gets `CN`),
 * the language region is only the fallback.
 */
export function detectRegion(): AppRegion {
  const zone = deviceTimeZone()
  if (MAINLAND_CHINA_ZONES.has(zone)) return 'CN'
  if (EUROPE_ZONE.test(zone)) return 'EU'
  if (AMERICAS_ZONE.test(zone)) return 'AMERICAS'
  if (APAC_ZONE.test(zone)) return 'APAC'

  const region = deviceLocaleRegion()
  if (region === 'CN') return 'CN'
  if (EU_REGIONS.has(region)) return 'EU'
  if (AMERICAS_REGIONS.has(region)) return 'AMERICAS'
  if (APAC_REGIONS.has(region)) return 'APAC'
  return 'GLOBAL'
}

export function appRegion(): AppRegion {
  if (!cachedRegion) cachedRegion = detectRegion()
  return cachedRegion
}

export function defaultMapView(region: AppRegion = appRegion()): DefaultMapView {
  // 中国与亚太（新加坡、日本等）统一看中国海，其它地区（欧洲 / 美洲 / 兜底）看大西洋。
  return region === 'CN' || region === 'APAC' ? CHINA_SEA_VIEW : ATLANTIC_VIEW
}

/**
 * Primary time zone of `region` (`GLOBAL` -> `UTC`). Only a fallback: callers
 * that can read the device time zone should prefer it, because a user in
 * `Asia/Kolkata` is not served well by `Asia/Singapore`. Unknown input falls
 * back to `Asia/Shanghai`, the zone the project used before device detection.
 */
export function defaultTimeZone(region: AppRegion = appRegion()): string {
  return REGION_TIME_ZONES[region] ?? REGION_TIME_ZONES.CN
}

/**
 * `true` puts the domestic (AMap / GCJ-02) basemap first, `false` the global
 * WGS84 one. Only mainland China needs the domestic tiles: they are the ones
 * that line up with GCJ-02 coordinates.
 */
export function defaultMapSource(region: AppRegion = appRegion()): boolean {
  return region === 'CN'
}
