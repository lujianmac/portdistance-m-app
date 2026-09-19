import { dealEcaAreaArr, dealEcaPolyArr } from '@/components/map/util/ecaUtil'
import { buildNewRoutePoints, calDistanceResult, produceTrackPath, setSeqRoutePoints } from '@/components/map/util/mapUtil'

export const DEFAULT_EXCLUDED_ROUTE_POINT_IDS = [-2, 19665, 53829, 13567, 25091, 22445, 61705]

let ecaArea: unknown[] | null = null

export interface LocalRouteGeometry {
  rawRoutePoints: Record<string, unknown>[]
  routePoints: Record<string, any>[]
  routePaths: any[]
  routePathsEca: any[]
  turningPoints: any[]
  totalDistanceNm: number
  totalEcaDistanceNm: number
  legs: Array<{ distance: number; ecaDistance: number }>
}

export function buildLocalRouteGeometry(rawRoutePoints: Record<string, unknown>[]): LocalRouteGeometry {
  if (!ecaArea) {
    ecaArea = dealEcaAreaArr()
    dealEcaPolyArr()
  }

  const rawClone = JSON.parse(JSON.stringify(rawRoutePoints)) as Record<string, unknown>[]
  const routePoints = buildNewRoutePoints(true, ecaArea, setSeqRoutePoints(rawClone)) as Record<string, any>[]
  const result = calDistanceResult(routePoints)
  const turningPoints = routePoints.flatMap((segment) => Array.isArray(segment.route) ? segment.route : [])
    .filter((point) => point && point.wn !== 'eca')
  const paths = produceTrackPath(routePoints, turningPoints)
  const portsDistanceArr = Array.isArray(result.portsDistanceArr) ? result.portsDistanceArr : []

  return {
    rawRoutePoints,
    routePoints,
    routePaths: paths.routePaths || [],
    routePathsEca: paths.routePathsECA || [],
    turningPoints,
    totalDistanceNm: Number(result.ttlDistance || 0),
    totalEcaDistanceNm: Number(result.ttlEcaDistance || 0),
    legs: portsDistanceArr.map((item: Record<string, unknown>) => ({
      distance: Number(item.gVal || 0),
      ecaDistance: Number(item.ecaVal || 0),
    })),
  }
}
