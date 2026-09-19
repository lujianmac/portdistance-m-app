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