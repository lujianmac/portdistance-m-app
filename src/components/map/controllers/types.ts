import type * as L from 'leaflet'
import type { MeteoGridQuery, MeteoGridQueryResult } from '@/components/map/modules/meteo'

export interface LeafletMapCallbacks {
  onMeteoQueryRequest?: (payload: { lon: number; lat: number }) => void
  onMeteoGridRequest?: (query: MeteoGridQuery, signal: AbortSignal) => Promise<MeteoGridQueryResult>
  onMeteoGridLoadingChange?: (loading: boolean) => void
  onMeteoGridData?: (grid: MeteoGridQueryResult) => void
  onRoutePointClick?: (wayPointId: number) => void
  onTurnPointCreateRequest?: (payload: { anchorRouteSeq: number; lon: number; lat: number }) => void
  onTurnPointEditRequest?: (payload: { routeSeq: number; lon: number; lat: number }) => void
  onTurnPointDragCommit?: (payload: { routeSeq: number; lon: number; lat: number }) => void
  onTrackHover?: (text: string | null) => void
  onMapNotice?: (text: string) => void
}

export interface MapCoordinates {
  toDisplayCoordinate(longitude: number, latitude: number): [number, number]
  toDisplayLatLng(longitude: number, latitude: number): L.LatLngExpression
  toBusinessCoordinate(longitude: number, latitude: number): [number, number]
}

export type MeasureMode = 'distance' | 'area' | null