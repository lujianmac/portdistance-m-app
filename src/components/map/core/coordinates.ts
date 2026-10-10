export type LongitudeLatitude = [number, number]
export type LatitudeLongitude = [number, number]

export interface UnwrappedPath {
  latLngs: LatitudeLongitude[]
  endLongitude: number | null
}

export function nearestWrappedLongitude(longitude: number, reference: number): number {
  return longitude + Math.round((reference - longitude) / 360) * 360
}

export function canonicalLongitude(longitude: number): number {
  const wrapped = ((longitude + 180) % 360 + 360) % 360 - 180
  return wrapped === -180 ? 180 : wrapped
}

/**
 * 单个经纬度分量的统一文本（三位小数 + 半球字母）：`24.500°N`。
 * 地图点查与标点信息框共用，避免各处自己拼格式。
 */
export function formatCoordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(3)}°${value >= 0 ? positive : negative}`
}

/** 经纬度对文本：`24.500°N / 118.100°E`（与地图点查信息顺序一致）。 */
export function formatCoordinateLabel(longitude: number, latitude: number): string {
  return `${formatCoordinate(latitude, 'N', 'S')} / ${formatCoordinate(longitude, 'E', 'W')}`
}

export function unwrapCoordinates(points: LongitudeLatitude[], referenceLongitude?: number): UnwrappedPath {
  const latLngs: LatitudeLongitude[] = []
  let previousLongitude = referenceLongitude ?? null

  points.forEach(([rawLongitude, rawLatitude]) => {
    const longitude = Number(rawLongitude)
    const latitude = Number(rawLatitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return
    const unwrappedLongitude = previousLongitude === null
      ? longitude
      : nearestWrappedLongitude(longitude, previousLongitude)
    latLngs.push([latitude, unwrappedLongitude])
    previousLongitude = unwrappedLongitude
  })

  return { latLngs, endLongitude: previousLongitude }
}