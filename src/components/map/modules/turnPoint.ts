import type { RoutePoint } from '@/types/protocol'

export interface TurnPointDragPayload {
  routeSeq: number
  lon: number
  lat: number
}

export interface TurnPointGraphicLike {
  routeSeq: number
  lon: number
  lat: number
  symbol: 'default' | 'selected'
}

export interface TurnPointDialogPoint {
  id: number | null
  lon: number
  lat: number
  isCreate: boolean
}

// 根据路由点构建可拖拽的转向点集合（过滤起终点等不可拖拽点）。
export function createTurnPointGraphics(turningPoints: RoutePoint[]): TurnPointGraphicLike[] {
  return turningPoints
    .filter((item) => String(item.wt) !== '0' && String(item.wt) !== '2')
    .map((item) => ({
      routeSeq: item.routeSeq,
      lon: Number(item.lon),
      lat: Number(item.lat),
      symbol: 'default'
    }))
}

export function resetTurnPointStyles(points: TurnPointGraphicLike[]): TurnPointGraphicLike[] {
  return points.map((item) => ({ ...item, symbol: 'default' }))
}

export function selectTurnPoint(
  points: TurnPointGraphicLike[],
  routeSeq: number
): TurnPointGraphicLike[] {
  return points.map((item) => ({
    ...item,
    symbol: item.routeSeq === routeSeq ? 'selected' : 'default'
  }))
}

export function eventDoubleClickTurnPoint(
  turningPoints: RoutePoint[],
  routeSeq: number
): TurnPointDialogPoint {
  const turnPoint = turningPoints.find((item) => item.routeSeq === routeSeq)
  if (!turnPoint) {
    return { id: null, lon: 0, lat: 0, isCreate: false }
  }

  return {
    id: routeSeq,
    lon: turnPoint.lon,
    lat: turnPoint.lat,
    isCreate: false
  }
}

export function createTurnPointOnMap(points: RoutePoint[], point: TurnPointDialogPoint): RoutePoint[] {
  if (point.id === null || !Number.isFinite(point.lon) || !Number.isFinite(point.lat)) {
    return points
  }

  return points.map((item) => {
    if (item.routeSeq !== point.id) return item
    return {
      ...item,
      lon: point.lon,
      lat: point.lat
    }
  })
}

export function updateTurnPointOnMap(points: RoutePoint[], point: TurnPointDialogPoint): RoutePoint[] {
  return createTurnPointOnMap(points, point)
}

export function deleteTurnPointOnMap(points: RoutePoint[], id: number): RoutePoint[] {
  return points.filter((item) => item.routeSeq !== id)
}

// 将地图拖拽后的经纬度写回 route points。
export function applyTurnPointDrag(points: RoutePoint[], drag: TurnPointDragPayload): RoutePoint[] {
  return points.map((point) => {
    if (point.routeSeq !== drag.routeSeq) return point
    return {
      ...point,
      lon: drag.lon,
      lat: drag.lat
    }
  })
}
