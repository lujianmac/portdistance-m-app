import { http } from '@/api/client'
import type { PortInfo } from '@/types'

export const DISTANCE_DAILY_LIMIT_ERROR_CODE = 1_020_005_001

export interface RawDistanceRoute {
  routePoints?: Record<string, unknown>[]
}

export function getSuggestPortList(name: string) {
  return http.get<PortInfo[]>('/portdist/distance/get-suggest-port-list', { name })
}

export function getDistanceRoute(portStr: string, excRoutePoint?: string) {
  return http.get<RawDistanceRoute>('/portdist/distance/get', {
    portStr,
    ...(excRoutePoint ? { excRoutePoint } : {}),
  })
}

export function getRoutePoint() {
  return http.get<unknown[]>('/portdist/distance/get-route-point')
}
