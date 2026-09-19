import type { Port, RoutePoint } from './protocol'

export type RouteState = '-1' | '0' | '1'

export interface RoutePointConfig {
  rpId: string
  rpName: string
  longitude: number
  latitude: number
  wayPointId: number
  routePointId: string
  remark?: number
  option: RouteState
}

export interface MapState {
  currentPorts: Port[]
  currentRoutePoints: RoutePoint[]
  currentTrackSegments: Array<{
    distance: string
    route: number[][]
    idArr: Array<number | string>
  }>
  currentEditMode: 'none' | 'route' | 'turn'
  routePointConfig: RoutePointConfig[]
}

export const defaultMapState: MapState = {
  currentPorts: [],
  currentRoutePoints: [],
  currentTrackSegments: [],
  currentEditMode: 'none',
  routePointConfig: []
}
