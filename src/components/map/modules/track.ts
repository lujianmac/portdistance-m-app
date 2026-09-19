import type { RoutePoint } from '@/types/protocol'
import { t } from '@/i18n'
import { produceTrackPath } from '@/components/map/util/mapUtil'
import { formatNumber } from '@/utils/common'

export interface RoutePathItem {
  distance: string
  route: number[][]
  idArr: Array<number | string>
}

export interface TrackSegmentsResult {
  routePaths: RoutePathItem[]
  routePathsECA: RoutePathItem[]
}

export interface ClickTrackResult {
  id: number | null
  lon: number
  lat: number
  isCreate: boolean
}

export function buildTrackSegments(routePoints: Array<{ route: RoutePoint[]; eca?: boolean }>, turningPoints: RoutePoint[]) {
  return produceTrackPath(routePoints, turningPoints)
}

export function mergeTrackSegments(result: TrackSegmentsResult): RoutePathItem[] {
  return [...result.routePaths, ...result.routePathsECA]
}

export function buildTrackHoverText(distanceNm: number | string): string {
  const value = typeof distanceNm === 'string' ? Number(distanceNm) : distanceNm
  if (!Number.isFinite(value)) return t('map.layers.shell.trackHoverDistance', { value: formatNumber(0, 2) })
  return t('map.layers.shell.trackHoverDistance', { value: formatNumber(value, 2) })
}

export function eventClickTrack(
  payload: { lon: number; lat: number },
  line: RoutePathItem,
  turnPointHit = false
): ClickTrackResult {
  if (turnPointHit) {
    return { id: null, lon: 0, lat: 0, isCreate: false }
  }

  const anchor = line.idArr[0]
  const id = typeof anchor === 'number' ? anchor : null

  return {
    id,
    lon: payload.lon,
    lat: payload.lat,
    isCreate: true
  }
}

export function findTrackByTurnPointId(
  list: RoutePathItem[],
  turnPointId: number
): RoutePathItem | undefined {
  return list.find((item) => item.idArr.includes(turnPointId))
}
