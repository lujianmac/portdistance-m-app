import { dealEcaAreaArr, dealEcaPolyArr, webMercator2LngLat } from '@/components/map/util/ecaUtil'

export const ecaArea = dealEcaAreaArr()
export const ecaLine = dealEcaPolyArr()

export type GeographicPath = Array<[number, number]>

function toGeographicPath(path: number[][]): GeographicPath {
  return path
    .map((point) => webMercator2LngLat(Number(point[0]), Number(point[1])))
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1])) as GeographicPath
}

export function getEcaLinePaths(): GeographicPath[] {
  return ecaLine.map(toGeographicPath).filter((path) => path.length > 1)
}

export function getEcaAreaPaths(): GeographicPath[] {
  return ecaArea.map(toGeographicPath).filter((path) => path.length > 2)
}
