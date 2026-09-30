/**
 * Port label helpers shared by the voyage page, the distance store (recent
 * calculations) and the clipboard / share text.
 */

interface PortLike {
  portId?: string | number
  portName?: string
  fullName?: string
  countryCode?: string
  isCoordinate?: boolean
  isWayPoint?: boolean
}

interface DisplayNameOptions {
  countryStyle?: 'code' | 'name'
}

type DisplayNamesCtor = new (locales: string[], options: { type: 'region' }) => { of(code: string): string | undefined }

/**
 * Country names are always English here (one fixed set, never translated), with
 * a few overrides because CLDR spells some of them longer than shipping users
 * expect — `CN` comes back as "China mainland", `HK` as "Hong Kong SAR China".
 */
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  CN: 'China',
  HK: 'Hong Kong',
  MO: 'Macao',
}

/**
 * Two-letter country code for a port.
 *
 * The business rule is that the first two characters of `portId` are the ISO
 * country code (`CNSHA…` -> `CN`); anything that is not two A–Z letters (a
 * coordinate id such as `121.5~25.1`, a numeric id…) falls back to the
 * `countryCode` field when that one looks valid.
 */
export function portCountryCode(port: PortLike): string {
  if (port.isCoordinate || port.isWayPoint) return ''

  const fromId = String(port.portId ?? '').slice(0, 2)
  if (/^[A-Za-z]{2}$/.test(fromId)) return fromId.toUpperCase()

  const fallback = String(port.countryCode ?? '').trim()
  return /^[A-Za-z]{2}$/.test(fallback) ? fallback.toUpperCase() : ''
}

/**
 * English country name for the two-letter code (`CN` -> `China`).
 * Falls back to the raw code when `Intl.DisplayNames` is unavailable.
 */
export function portCountryName(port: PortLike): string {
  const code = portCountryCode(port)
  if (!code) return ''

  const override = COUNTRY_NAME_OVERRIDES[code]
  if (override) return override

  const DisplayNames = (Intl as unknown as { DisplayNames?: DisplayNamesCtor }).DisplayNames
  if (!DisplayNames) return code

  try {
    const display = new DisplayNames(['en'], { type: 'region' })
    const name = display.of(code)
    // `Intl` answers "Unknown Region" for a code outside ISO 3166-1; keep the raw code then.
    const unknown = display.of('ZZ')
    return name && name !== unknown ? name : code
  } catch {
    return code
  }
}

/**
 * `Shanghai [CN]` by default; pass `{ countryStyle: 'name' }` for
 * `Shanghai [China]`. The bracket part is omitted when no country is known.
 */
export function portDisplayName(port: PortLike, options: DisplayNameOptions = {}): string {
  const name = String(port.portName || port.fullName || port.portId || '').trim()
  const country = options.countryStyle === 'name' ? portCountryName(port) : portCountryCode(port)
  return country ? `${name} [${country}]` : name
}
