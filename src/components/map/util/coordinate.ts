export type MapCoordinateSystem = 'wgs84' | 'gcj02'

const PI = Math.PI
const AXIS = 6378245
const ECCENTRICITY = 0.006693421622965943

function outsideChina(longitude: number, latitude: number): boolean {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271
}

function transformLatitude(longitude: number, latitude: number): number {
  let result = -100 + 2 * longitude + 3 * latitude + 0.2 * latitude * latitude
    + 0.1 * longitude * latitude + 0.2 * Math.sqrt(Math.abs(longitude))
  result += (20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * 2 / 3
  result += (20 * Math.sin(latitude * PI) + 40 * Math.sin(latitude / 3 * PI)) * 2 / 3
  result += (160 * Math.sin(latitude / 12 * PI) + 320 * Math.sin(latitude * PI / 30)) * 2 / 3
  return result
}

function transformLongitude(longitude: number, latitude: number): number {
  let result = 300 + longitude + 2 * latitude + 0.1 * longitude * longitude
    + 0.1 * longitude * latitude + 0.1 * Math.sqrt(Math.abs(longitude))
  result += (20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) * 2 / 3
  result += (20 * Math.sin(longitude * PI) + 40 * Math.sin(longitude / 3 * PI)) * 2 / 3
  result += (150 * Math.sin(longitude / 12 * PI) + 300 * Math.sin(longitude / 30 * PI)) * 2 / 3
  return result
}

export function wgs84ToGcj02(longitude: number, latitude: number): [number, number] {
  if (outsideChina(longitude, latitude)) return [longitude, latitude]
  let latitudeDelta = transformLatitude(longitude - 105, latitude - 35)
  let longitudeDelta = transformLongitude(longitude - 105, latitude - 35)
  const radianLatitude = latitude / 180 * PI
  let magic = Math.sin(radianLatitude)
  magic = 1 - ECCENTRICITY * magic * magic
  const rootMagic = Math.sqrt(magic)
  latitudeDelta = latitudeDelta * 180 / ((AXIS * (1 - ECCENTRICITY)) / (magic * rootMagic) * PI)
  longitudeDelta = longitudeDelta * 180 / (AXIS / rootMagic * Math.cos(radianLatitude) * PI)
  return [longitude + longitudeDelta, latitude + latitudeDelta]
}

export function gcj02ToWgs84(longitude: number, latitude: number): [number, number] {
  if (outsideChina(longitude, latitude)) return [longitude, latitude]
  const [convertedLongitude, convertedLatitude] = wgs84ToGcj02(longitude, latitude)
  return [longitude * 2 - convertedLongitude, latitude * 2 - convertedLatitude]
}