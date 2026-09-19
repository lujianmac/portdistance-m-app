import type { MapState } from '@/types/map'
import { defaultMapState } from '@/types/map'
import type { Port, RoutePathItem } from '@/types/protocol'
import { deepClone } from '@/utils/common'

export type ReduceAction =
  | { type: 'SET_PORTS'; payload: Port[] }
  | { type: 'DRAW_TRACK'; payload: { routePaths: RoutePathItem[] } }
  | { type: 'CLEAR_ROUTE' }
  | { type: 'RESET_MAP' }

export function createInitialState(): MapState {
  return deepClone(defaultMapState)
}

export function mapStateReducer(state: MapState, action: ReduceAction): MapState {
  switch (action.type) {
    case 'SET_PORTS':
      return { ...state, currentPorts: [...action.payload] }
    case 'DRAW_TRACK':
      return { ...state, currentTrackSegments: [...action.payload.routePaths] }
    case 'CLEAR_ROUTE':
      return { ...state, currentRoutePoints: [], currentTrackSegments: [] }
    case 'RESET_MAP':
      return createInitialState()
    default:
      return state
  }
}