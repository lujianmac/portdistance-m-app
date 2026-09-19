import * as L from 'leaflet'
import { canonicalLongitude } from '@/components/map/core/coordinates'
import type { MapCoordinates } from '@/components/map/controllers/types'

interface GraticuleControllerOptions {
  map: L.Map
  layer: L.LayerGroup
  coordinates: MapCoordinates
  linePane: string
  labelPane: string
}

function intervalForZoom(zoom: number): number {
  if (zoom <= 2) return 30
  if (zoom <= 4) return 15
  if (zoom <= 6) return 5
  if (zoom <= 8) return 1
  if (zoom <= 10) return 0.5
  return 0.1
}

function formatLongitude(longitude: number): string {
  const normalized = canonicalLongitude(longitude)
  if (Math.abs(normalized) < 1e-8) return '0°'
  return `${Number(Math.abs(normalized).toFixed(6))}°${normalized > 0 ? 'E' : 'W'}`
}

function formatLatitude(latitude: number): string {
  if (Math.abs(latitude) < 1e-8) return '0°'
  return `${Number(Math.abs(latitude).toFixed(6))}°${latitude > 0 ? 'N' : 'S'}`
}

export class GraticuleController {
  private readonly map: L.Map
  private readonly layer: L.LayerGroup
  private readonly coordinates: MapCoordinates
  private readonly linePane: string
  private readonly labelPane: string
  private visible = false

  constructor(options: GraticuleControllerOptions) {
    this.map = options.map
    this.layer = options.layer
    this.coordinates = options.coordinates
    this.linePane = options.linePane
    this.labelPane = options.labelPane
  }

  toggle(): boolean {
    this.visible = !this.visible
    if (this.visible) {
      this.layer.addTo(this.map)
      this.map.on('moveend zoomend', this.handleMapMove)
      this.render()
    } else {
      this.map.off('moveend zoomend', this.handleMapMove)
      this.map.removeLayer(this.layer)
      this.layer.clearLayers()
    }
    return this.visible
  }

  isVisible(): boolean {
    return this.visible
  }

  refresh(): void {
    if (this.visible) this.render()
  }

  destroy(): void {
    this.visible = false
    this.map.off('moveend zoomend', this.handleMapMove)
    this.layer.clearLayers()
    this.map.removeLayer(this.layer)
  }

  private readonly handleMapMove = () => this.render()

  private render(): void {
    if (!this.visible) return
    this.layer.clearLayers()
    const displayBounds = this.map.getBounds()
    const interval = intervalForZoom(this.map.getZoom())
    const center = this.map.getCenter()
    const [centerLongitude] = this.coordinates.toBusinessCoordinate(center.lng, center.lat)
    const [southWestLongitude, southWestLatitude] = this.coordinates.toBusinessCoordinate(
      displayBounds.getWest(),
      displayBounds.getSouth(),
    )
    const [northEastLongitude, northEastLatitude] = this.coordinates.toBusinessCoordinate(
      displayBounds.getEast(),
      displayBounds.getNorth(),
    )
    const west = Math.max(Math.min(southWestLongitude, northEastLongitude), centerLongitude - 200)
    const east = Math.min(Math.max(southWestLongitude, northEastLongitude), centerLongitude + 200)
    const south = Math.max(Math.min(southWestLatitude, northEastLatitude), -85)
    const north = Math.min(Math.max(southWestLatitude, northEastLatitude), 85)
    const lineOptions: L.PolylineOptions = {
      pane: this.linePane,
      color: '#000000',
      weight: 1,
      opacity: 0.72,
      interactive: false,
    }

    for (let longitude = Math.ceil(west / interval) * interval; longitude <= east; longitude += interval) {
      const value = Number(longitude.toFixed(6))
      const path: L.LatLngExpression[] = []
      const sampleStep = Math.max(interval / 4, 0.1)
      for (let latitude = south; latitude <= north + sampleStep / 2; latitude += sampleStep) {
        path.push(this.coordinates.toDisplayLatLng(value, Math.min(latitude, north)))
      }
      L.polyline(path, lineOptions).addTo(this.layer)
      this.addLabel(this.coordinates.toDisplayLatLng(value, south), formatLongitude(value), 'longitude')
    }
    for (let latitude = Math.ceil(south / interval) * interval; latitude <= north; latitude += interval) {
      const value = Number(latitude.toFixed(6))
      const path: L.LatLngExpression[] = []
      const sampleStep = Math.max(interval / 4, 0.1)
      for (let longitude = west; longitude <= east + sampleStep / 2; longitude += sampleStep) {
        path.push(this.coordinates.toDisplayLatLng(Math.min(longitude, east), value))
      }
      L.polyline(path, lineOptions).addTo(this.layer)
      this.addLabel(this.coordinates.toDisplayLatLng(west, value), formatLatitude(value), 'latitude')
    }
  }

  private addLabel(position: L.LatLngExpression, text: string, kind: 'longitude' | 'latitude'): void {
    const icon = L.divIcon({
      className: `graticule-label graticule-label-${kind}`,
      html: `<span>${text}</span>`,
      iconSize: [48, 18],
      iconAnchor: kind === 'longitude' ? [24, 18] : [0, 9],
    })
    const marker = L.marker(position, { icon, pane: this.labelPane, interactive: false, keyboard: false })
    marker.on('add', () => marker.getElement()?.setAttribute('aria-hidden', 'true'))
    marker.addTo(this.layer)
  }
}