import type * as L from 'leaflet'
import type { MeteoGridQuery, MeteoGridQueryResult } from '@/components/map/modules/meteo'

export interface LeafletMapCallbacks {
  onMeteoQueryRequest?: (payload: { lon: number; lat: number }) => void
  onMeteoGridRequest?: (query: MeteoGridQuery, signal: AbortSignal) => Promise<MeteoGridQueryResult>
  onMeteoGridLoadingChange?: (loading: boolean) => void
  onMeteoGridData?: (grid: MeteoGridQueryResult) => void
  onRoutePointClick?: (wayPointId: number) => void
  onTurnPointCreateRequest?: (payload: { anchorRouteSeq: number; lon: number; lat: number }) => void
  onTurnPointEditRequest?: (payload: { routeSeq: number; lon: number; lat: number; userAdded?: boolean }) => void
  /** Fired whenever the measurement tool gains or loses points, so the host can show a clear button. */
  onMeasurementChange?: (state: { mode: MeasureMode; pointCount: number }) => void
  /** Fired when the pin tool drops a pin (business coordinates), so the host can show its info box. */
  onPinPlaced?: (pin: MapPin) => void
  /** Fired when an already placed pin is tapped, so the host can re-show its info box for that pin. */
  onPinClick?: (pin: MapPin) => void
  /** Fired when the pin placing mode changes (it stays on until the tool is switched off again). */
  onPinPlacingChange?: (placing: boolean) => void
  /** Fired whenever the number of pins on the map changes, so the host can show its clear button. */
  onPinCountChange?: (count: number) => void
  onTurnPointDragCommit?: (payload: { routeSeq: number; lon: number; lat: number }) => void
  onTrackHover?: (text: string | null) => void
  onMapNotice?: (text: string) => void
}

export interface MapCoordinates {
  toDisplayCoordinate(longitude: number, latitude: number): [number, number]
  toDisplayLatLng(longitude: number, latitude: number): L.LatLngExpression
  toBusinessCoordinate(longitude: number, latitude: number): [number, number]
}

/**
 * 一个已放下的标点：业务坐标 + 稳定 id。
 * 同一位置允许存在多个标点，因此宿主一律按 id（而不是坐标）操作某一个标点。
 */
export interface MapPin {
  id: number
  lon: number
  lat: number
  /**
   * 该标点已经加到港口列表：同一坐标上已经画了港口坐标点，标点自身不再画可见图形和 label
   * （只保留透明命中圈），避免地图上出现两个重叠的点。
   */
  added?: boolean
}

export type MeasureMode = 'distance' | 'area' | null