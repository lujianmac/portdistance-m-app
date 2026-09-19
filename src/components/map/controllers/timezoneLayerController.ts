import * as L from 'leaflet'
import { t } from '@/i18n'
import {
  TIMEZONE_FEATURE_SERVICE_URL,
  timezoneLayerMetadata as timezoneLayerMetadataFn,
  type TimezoneFeatureProperties,
} from '@/components/map/modules/timezone'

interface TimezoneLayerControllerOptions {
  map: L.Map
  onNotice?: (message: string) => void
}

function normalizeOffset(offset: string | undefined): string {
  if (!offset) return t('map.layers.timezone.offsetUnavailable')
  return `UTC${offset}`
}

function offsetHours(offset: string | undefined): number {
  const matched = offset?.match(/^([+-])(\d{2}):(\d{2})$/)
  if (!matched) return 0
  const hours = Number(matched[2]) + Number(matched[3]) / 60
  return matched[1] === '-' ? -hours : hours
}

function offsetColor(offset: string | undefined): string {
  const value = offsetHours(offset)
  const normalized = Math.round((value + 12) * 4)
  const hue = (normalized * 19 + 166) % 360
  return `hsl(${hue} 54% 39%)`
}

function maxAllowableOffset(zoom: number): number {
  if (zoom <= 2) return 0.75
  if (zoom <= 4) return 0.2
  if (zoom <= 6) return 0.06
  if (zoom <= 8) return 0.015
  return 0.004
}

function queryEnvelope(map: L.Map): [number, number, number, number] {
  const bounds = map.getBounds()
  const latitudeSouth = Math.max(bounds.getSouth(), -85)
  const latitudeNorth = Math.min(bounds.getNorth(), 85)
  const longitudeSpan = bounds.getEast() - bounds.getWest()
  if (longitudeSpan >= 350) return [-180, latitudeSouth, 180, latitudeNorth]

  const west = ((bounds.getWest() + 180) % 360 + 360) % 360 - 180
  const east = ((bounds.getEast() + 180) % 360 + 360) % 360 - 180
  if (west > east) return [-180, latitudeSouth, 180, latitudeNorth]
  return [west, latitudeSouth, east, latitudeNorth]
}

export class TimezoneLayerController {
  private readonly map: L.Map
  private readonly onNotice?: (message: string) => void
  private readonly layer = L.layerGroup()
  private request: AbortController | null = null
  private refreshTimer: ReturnType<typeof window.setTimeout> | null = null
  private requestVersion = 0
  private visible = false

  constructor(options: TimezoneLayerControllerOptions) {
    this.map = options.map
    this.onNotice = options.onNotice
  }

  async setVisible(visible: boolean): Promise<boolean> {
    if (visible === this.visible) return this.visible
    this.visible = visible
    if (!visible) {
      this.cancelScheduledRefresh()
      this.request?.abort()
      this.request = null
      this.layer.clearLayers()
      this.map.removeLayer(this.layer)
      this.map.off('moveend zoomend', this.handleMapMove)
      return false
    }

    this.layer.addTo(this.map)
    this.map.on('moveend zoomend', this.handleMapMove)
    try {
      await this.renderViewport()
      return true
    } catch (error) {
      this.visible = false
      this.layer.clearLayers()
      this.map.removeLayer(this.layer)
      this.map.off('moveend zoomend', this.handleMapMove)
      throw error
    }
  }

  isVisible(): boolean {
    return this.visible
  }

  private readonly handleMapMove = () => {
    this.cancelScheduledRefresh()
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null
      void this.renderViewport().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.warn('[portdistance-map] unable to refresh timezone boundaries', error)
        this.onNotice?.(t('map.layers.timezone.refreshFailed'))
      })
    }, 140)
  }

  private async renderViewport(): Promise<void> {
    if (!this.visible) return
    this.request?.abort()
    const request = new AbortController()
    this.request = request
    const version = ++this.requestVersion
    const [west, south, east, north] = queryEnvelope(this.map)
    const query = new URLSearchParams({
      where: '1=1',
      geometry: `${west},${south},${east},${north}`,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'UTC_offset_ST,UTC_offset_DST',
      returnGeometry: 'true',
      outSR: '4326',
      geometryPrecision: '5',
      maxAllowableOffset: String(maxAllowableOffset(this.map.getZoom())),
      f: 'geojson',
    })
    const response = await fetch(`${TIMEZONE_FEATURE_SERVICE_URL}?${query.toString()}`, {
      signal: request.signal,
    })
    if (!response.ok) throw new Error(t('map.layers.timezone.loadFailed', { status: response.status }))
    const data = await response.json() as GeoJSON.FeatureCollection<GeoJSON.Geometry, TimezoneFeatureProperties>
    if (!this.visible || version !== this.requestVersion) return

    this.layer.clearLayers()
    L.geoJSON(data, {
      pane: 'timezone-pane',
      style: (feature) => {
        const standardOffset = feature?.properties?.UTC_offset_ST
        const color = offsetColor(standardOffset)
        return {
          color,
          weight: 1,
          opacity: 0.82,
          fillColor: color,
          fillOpacity: 0.16,
        }
      },
      onEachFeature: (feature, featureLayer) => {
        const timezoneLayerMetadata = timezoneLayerMetadataFn()
        const standardOffset = normalizeOffset(feature.properties?.UTC_offset_ST)
        const daylightOffset = normalizeOffset(feature.properties?.UTC_offset_DST)
        featureLayer.bindPopup(
          `<strong>${timezoneLayerMetadata.name}</strong><br>${t('map.layers.timezone.standardTime')}: ${standardOffset}<br>${t('map.layers.timezone.daylightTime')}: ${daylightOffset}<br>${timezoneLayerMetadata.version}<br>${timezoneLayerMetadata.source}`,
          { className: 'maritime-popup' },
        )
      },
    }).addTo(this.layer)
  }

  destroy(): void {
    this.visible = false
    this.cancelScheduledRefresh()
    this.request?.abort()
    this.request = null
    this.map.off('moveend zoomend', this.handleMapMove)
    this.layer.clearLayers()
    this.map.removeLayer(this.layer)
  }

  private cancelScheduledRefresh(): void {
    if (!this.refreshTimer) return
    window.clearTimeout(this.refreshTimer)
    this.refreshTimer = null
  }
}