import * as L from 'leaflet'
import turfArea from '@turf/area'
import turfBearing from '@turf/bearing'
import turfDistance from '@turf/distance'
import { point, polygon } from '@turf/helpers'
import { t } from '@/i18n'
import { canonicalLongitude, nearestWrappedLongitude, unwrapCoordinates } from '@/components/map/core/coordinates'
import { escapeHtml } from '@/components/map/core/html'
import type { MapCoordinates, MeasureMode } from '@/components/map/controllers/types'

interface MeasurementControllerOptions {
  map: L.Map
  layer: L.LayerGroup
  coordinates: MapCoordinates
  pane: string
  isTurnDragEnabled: () => boolean
  onNotice?: (message: string) => void
}

function formatDistance(distanceNm: number): string {
  return `${distanceNm < 1 ? distanceNm.toFixed(3) : distanceNm.toFixed(2)} nm`
}

function formatBearing(value: number): string {
  return `${String(Math.round((value + 360) % 360)).padStart(3, '0')}°`
}

export class MeasurementController {
  private readonly map: L.Map
  private readonly layer: L.LayerGroup
  private readonly coordinates: MapCoordinates
  private readonly pane: string
  private readonly isTurnDragEnabled: () => boolean
  private readonly onNotice?: (message: string) => void
  private mode: MeasureMode = null
  private points: Array<[number, number]> = []
  private cursor: [number, number] | null = null
  private finished = false

  constructor(options: MeasurementControllerOptions) {
    this.map = options.map
    this.layer = options.layer
    this.coordinates = options.coordinates
    this.pane = options.pane
    this.isTurnDragEnabled = options.isTurnDragEnabled
    this.onNotice = options.onNotice
  }

  setMode(mode: MeasureMode): MeasureMode {
    this.mode = mode
    this.points = []
    this.cursor = null
    this.finished = false
    this.layer.clearLayers()
    this.map.getContainer().classList.toggle('measure-mode-active', mode !== null)
    if (mode) {
      this.map.doubleClickZoom.disable()
      this.onNotice?.(mode === 'distance'
        ? t('map.layers.shell.measureDistanceHint')
        : t('map.layers.shell.measureAreaHint'))
    } else if (!this.isTurnDragEnabled()) {
      this.map.doubleClickZoom.enable()
    }
    return this.mode
  }

  getMode(): MeasureMode {
    return this.mode
  }

  getPointCount(): number {
    return this.points.length
  }

  handleMapClick(event: L.LeafletMouseEvent): boolean {
    if (!this.mode) return false
    this.addPoint(event)
    return true
  }

  handleMouseMove(event: L.LeafletMouseEvent): void {
    if (!this.mode || this.finished || this.points.length === 0) return
    this.cursor = this.coordinates.toBusinessCoordinate(canonicalLongitude(event.latlng.lng), event.latlng.lat)
    this.render()
  }

  handleDoubleClick(event: L.LeafletMouseEvent): boolean {
    if (!this.mode) return false
    L.DomEvent.stop(event)
    this.points = this.points.filter((current, index, points) => {
      const previous = points[index - 1]
      return !previous || Math.abs(previous[0] - current[0]) > 1e-8 || Math.abs(previous[1] - current[1]) > 1e-8
    })
    const enoughPoints = this.mode === 'distance' ? this.points.length >= 2 : this.points.length >= 3
    if (!enoughPoints) return true
    this.cursor = null
    this.finished = true
    this.render()
    return true
  }

  refresh(): void {
    this.render()
  }

  reset(): void {
    this.setMode(null)
  }

  destroy(): void {
    this.setMode(null)
    this.layer.clearLayers()
  }

  private addPoint(event: L.LeafletMouseEvent): void {
    if (this.finished) {
      this.points = []
      this.finished = false
    }
    this.cursor = null
    this.points.push(this.coordinates.toBusinessCoordinate(canonicalLongitude(event.latlng.lng), event.latlng.lat))
    this.render()
  }

  private addLabel(position: L.LatLngExpression, text: string, total = false): void {
    L.marker(position, {
      pane: this.pane,
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: total ? 'measure-total-label' : 'measure-label',
        html: `<span>${escapeHtml(text)}</span>`,
        iconSize: total ? [210, 24] : [150, 22],
        iconAnchor: total ? [105, 12] : [75, 11],
      }),
    }).addTo(this.layer)
  }

  private render(): void {
    this.layer.clearLayers()
    if (!this.mode || this.points.length === 0) return

    const businessPoints = [...this.points]
    if (this.cursor && !this.finished) businessPoints.push(this.cursor)
    const displayPath = unwrapCoordinates(
      businessPoints.map(([longitude, latitude]) => this.coordinates.toDisplayCoordinate(longitude, latitude)),
    ).latLngs
    const lineOptions: L.PolylineOptions = {
      pane: this.pane,
      color: '#ed7d31',
      weight: 3,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
      smoothFactor: 0,
    }

    if (this.mode === 'area' && businessPoints.length >= 3) {
      L.polygon(displayPath, {
        ...lineOptions,
        fillColor: '#ed7d31',
        fillOpacity: 0.14,
      }).addTo(this.layer)
    } else if (displayPath.length >= 2) {
      L.polyline(displayPath, lineOptions).addTo(this.layer)
    }

    this.points.forEach(([longitude, latitude]) => {
      L.marker(this.coordinates.toDisplayLatLng(longitude, latitude), {
        pane: this.pane,
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'measure-point-icon',
          html: '<span></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(this.layer)
    })

    let totalDistance = 0
    for (let index = 1; index < businessPoints.length; index += 1) {
      const previous = businessPoints[index - 1]
      const current = businessPoints[index]
      const segmentDistance = turfDistance(point(previous), point(current), { units: 'nauticalmiles' })
      totalDistance += segmentDistance
      const segmentBearing = turfBearing(point(previous), point(current))
      const previousDisplay = L.latLng(displayPath[index - 1])
      const currentDisplay = L.latLng(displayPath[index])
      const midpoint = L.latLng(
        (previousDisplay.lat + currentDisplay.lat) / 2,
        (previousDisplay.lng + currentDisplay.lng) / 2,
      )
      this.addLabel(midpoint, `${formatDistance(segmentDistance)} ${formatBearing(segmentBearing)}`)
    }

    if (this.mode === 'distance' && businessPoints.length >= 2) {
      this.addLabel(
        L.latLng(displayPath[displayPath.length - 1]),
        t('map.layers.shell.totalDistanceLabel', { value: formatDistance(totalDistance) }),
        true,
      )
    }

    if (this.mode === 'area' && businessPoints.length >= 3) {
      let previousLongitude: number | null = null
      const ring = businessPoints.map(([longitude, latitude]) => {
        const unwrappedLongitude = previousLongitude === null
          ? longitude
          : nearestWrappedLongitude(longitude, previousLongitude)
        previousLongitude = unwrappedLongitude
        return [unwrappedLongitude, latitude] as [number, number]
      })
      ring.push([...ring[0]] as [number, number])
      const squareMeters = turfArea(polygon([ring]))
      const squareKilometers = squareMeters / 1_000_000
      const squareNauticalMiles = squareMeters / (1852 * 1852)
      this.addLabel(
        L.latLngBounds(displayPath).getCenter(),
        t('map.layers.shell.areaLabel', {
          nm: squareNauticalMiles.toFixed(2),
          km: squareKilometers.toFixed(2),
        }),
        true,
      )
    }
  }
}