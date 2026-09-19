import { t } from '@/i18n'

export interface MeteoPointQuery {
  lon: number
  lat: number
}

export interface MeteoGridQuery {
  west: number
  south: number
  east: number
  north: number
  columns: number
  rows: number
}

export interface MeteoApiOptions {
  apiBaseUrl: string
  accessToken?: string
}

export interface MeteoWeatherObservation {
  observedAt: string | null
  temperatureC: number | null
  pressureHpa: number | null
  windSpeedKn: number | null
  windDirection: number | null
  windGustKn: number | null
}

export interface MeteoMarineObservation {
  observedAt: string | null
  waveHeightM: number | null
  waveDirection: number | null
  wavePeriodS: number | null
  currentSpeedKn: number | null
  currentDirection: number | null
}

export interface MeteoPointQueryResult extends MeteoPointQuery {
  provider?: string | null
  weather: MeteoWeatherObservation | null
  marine: MeteoMarineObservation | null
}

export interface MeteoGridQueryResult extends MeteoGridQuery {
  provider?: string | null
  points: MeteoPointQueryResult[]
}

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function normalizeWeather(value: unknown): MeteoWeatherObservation | null {
  if (!isJsonObject(value)) return null
  return {
    observedAt: stringOrNull(value.observedAt),
    temperatureC: numberOrNull(value.temperatureC),
    pressureHpa: numberOrNull(value.pressureHpa),
    windSpeedKn: numberOrNull(value.windSpeedKn),
    windDirection: numberOrNull(value.windDirection),
    windGustKn: numberOrNull(value.windGustKn),
  }
}

function normalizeMarine(value: unknown): MeteoMarineObservation | null {
  if (!isJsonObject(value)) return null
  return {
    observedAt: stringOrNull(value.observedAt),
    waveHeightM: numberOrNull(value.waveHeightM),
    waveDirection: numberOrNull(value.waveDirection),
    wavePeriodS: numberOrNull(value.wavePeriodS),
    currentSpeedKn: numberOrNull(value.currentSpeedKn),
    currentDirection: numberOrNull(value.currentDirection),
  }
}

function normalizePoint(value: unknown): MeteoPointQueryResult | null {
  if (!isJsonObject(value)) return null
  const lon = numberOrNull(value.longitude)
  const lat = numberOrNull(value.latitude)
  if (lon === null || lat === null) return null
  return {
    lon,
    lat,
    provider: stringOrNull(value.provider),
    weather: normalizeWeather(value.weather),
    marine: normalizeMarine(value.marine),
  }
}

function apiHeaders(accessToken?: string): HeadersInit {
  return {
    'tenant-id': '1',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}

async function requestApi(path: string, parameters: URLSearchParams, options: MeteoApiOptions, signal?: AbortSignal): Promise<unknown> {
  if (!options.apiBaseUrl) throw new Error(t('map.layers.meteo.service.missingBaseUrl'))
  const response = await fetch(`${options.apiBaseUrl}${path}?${parameters.toString()}`, {
    headers: apiHeaders(options.accessToken),
    signal,
  })
  if (!response.ok) throw new Error(t('map.layers.meteo.service.queryFailedWithStatus', { status: response.status }))
  const body = await response.json() as unknown
  if (!isJsonObject(body)) throw new Error(t('map.layers.meteo.service.invalidResponse'))
  const code = numberOrNull(body.code)
  if (code !== null && code !== 0 && code !== 200) {
    throw new Error(stringOrNull(body.msg) || t('map.layers.meteo.service.queryFailed'))
  }
  return body.data ?? body
}

export async function queryMeteoPoint(
  query: MeteoPointQuery,
  options: MeteoApiOptions,
  signal?: AbortSignal,
): Promise<MeteoPointQueryResult> {
  if (!Number.isFinite(query.lon) || !Number.isFinite(query.lat) || Math.abs(query.lon) > 180 || Math.abs(query.lat) > 90) {
    throw new Error(t('map.layers.meteo.service.invalidCoordinate'))
  }
  const data = await requestApi('/portdist/metocean/point', new URLSearchParams({
    longitude: query.lon.toFixed(5),
    latitude: query.lat.toFixed(5),
  }), options, signal)
  const result = normalizePoint(data)
  if (!result) throw new Error(t('map.layers.meteo.service.invalidPoint'))
  return result
}

export async function queryMeteoGrid(
  query: MeteoGridQuery,
  options: MeteoApiOptions,
  signal?: AbortSignal,
): Promise<MeteoGridQueryResult> {
  if (!Number.isFinite(query.west) || !Number.isFinite(query.south)
    || !Number.isFinite(query.east) || !Number.isFinite(query.north)
    || query.west >= query.east || query.south >= query.north) {
    throw new Error(t('map.layers.meteo.service.invalidViewport'))
  }
  const data = await requestApi('/portdist/metocean/grid', new URLSearchParams({
    west: query.west.toFixed(5),
    south: query.south.toFixed(5),
    east: query.east.toFixed(5),
    north: query.north.toFixed(5),
    columns: String(query.columns),
    rows: String(query.rows),
  }), options, signal)
  if (!isJsonObject(data) || !Array.isArray(data.points)) {
    throw new Error(t('map.layers.meteo.service.invalidGrid'))
  }
  const points = data.points.map(normalizePoint).filter((point): point is MeteoPointQueryResult => point !== null)
  if (!points.length) throw new Error(t('map.layers.meteo.service.emptyViewport'))
  return {
    west: numberOrNull(data.west) ?? query.west,
    south: numberOrNull(data.south) ?? query.south,
    east: numberOrNull(data.east) ?? query.east,
    north: numberOrNull(data.north) ?? query.north,
    columns: Math.round(numberOrNull(data.columns) ?? query.columns),
    rows: Math.round(numberOrNull(data.rows) ?? query.rows),
    provider: stringOrNull(data.provider),
    points,
  }
}