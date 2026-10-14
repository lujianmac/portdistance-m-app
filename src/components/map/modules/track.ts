import type { RoutePoint } from '@/types/protocol'
import { t } from '@/i18n'
import { produceTrackPath } from '@/components/map/util/mapUtil'
import { formatNumber } from '@/utils/common'

export interface RoutePathItem {
  distance: string
  route: number[][]
  idArr: Array<number | string>
  /**
   * 这一段是否落在 ECA（排放控制区）里。
   * `produceTrackPath()` 会把航线拆成 routePaths / routePathsECA 两组，边界处已插入与
   * ECA 多边形的交点，所以合并回一个数组时用这个标记保留分组，供地图分段上色。
   */
  eca?: boolean
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
