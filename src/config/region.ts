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

const MAP_VIEWS: Record<AppRegion, DefaultMapView> = {
  // 中国：覆盖大陆全境
  CN: { center: [104, 35], zoom: 4 },
  // 欧洲：覆盖西欧到北欧
  EU: { center: [12, 50], zoom: 4 },
  // 亚太：覆盖东南亚到东北亚
  APAC: { center: [110, 15], zoom: 3 },
  // 美洲：覆盖北美东西海岸
  AMERICAS: { center: [-85, 35], zoom: 3 },
  // 兜底：以大西洋—欧洲—非洲为中心的全球视图，主要航线基本都在画面内
  GLOBAL: { center: [10, 25], zoom: 2 },
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
  return MAP_VIEWS[region] ?? MAP_VIEWS.GLOBAL
}

/**
 * `true` puts the domestic (AMap / GCJ-02) basemap first, `false` the global
 * WGS84 one. Only mainland China needs the domestic tiles: they are the ones
 * that line up with GCJ-02 coordinates.
 */
export function defaultMapSource(region: AppRegion = appRegion()): boolean {
  return region === 'CN'
}
