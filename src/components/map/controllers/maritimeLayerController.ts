import * as L from 'leaflet'
import { t } from '@/i18n'
import { escapeHtml } from '@/components/map/core/html'
import {
  getMaritimeLayerOption,
  jwcDefinedBoundaryGeoJson,
  majorSeaAreaLabels,
  MARINE_REGIONS_WMS_URL,
  type MaritimeLayerId,
  type MaritimeLayerOption,
} from '@/components/map/modules/maritime'

interface MaritimeLayerControllerOptions {
  map: L.Map
  pane: string
}

export class MaritimeLayerController {
  private readonly map: L.Map
  private readonly pane: string
  private readonly layers = new Map<MaritimeLayerId, L.Layer>()
  private readonly visibleLayerIds = new Set<MaritimeLayerId>()

  constructor(options: MaritimeLayerControllerOptions) {
    this.map = options.map
    this.pane = options.pane
  }

  async setVisible(id: MaritimeLayerId, visible: boolean): Promise<boolean> {
    if (!visible) {
      const layer = this.layers.get(id)
      if (layer) this.map.removeLayer(layer)
      this.visibleLayerIds.delete(id)
      return false
    }

    let layer = this.layers.get(id)
    if (!layer) {
      layer = this.createLayer(id)
      this.layers.set(id, layer)
    }
    layer.addTo(this.map)
    this.visibleLayerIds.add(id)
    return true
  }

  hasVisibleLayers(): boolean {
    return this.visibleLayerIds.size > 0
  }

  isVisible(id: MaritimeLayerId): boolean {
    return this.visibleLayerIds.has(id)
  }

  getVisibleLayerIds(): MaritimeLayerId[] {
    return Array.from(this.visibleLayerIds)
  }

  clear(): void {
    this.layers.forEach((layer) => this.map.removeLayer(layer))
    this.visibleLayerIds.clear()
  }

  destroy(): void {
    this.clear()
    this.layers.clear()
  }

  private createLayer(id: MaritimeLayerId): L.Layer {
    const option = getMaritimeLayerOption(id)
    if (option.kind === 'wms' && option.wmsLayers) {
      if (id === 'sea-areas') return L.layerGroup([
        this.createWmsLayer(option),
        this.createSeaAreaLabelLayer(),
      ])
      return this.createWmsLayer(option)
    }
    if (option.kind === 'jwc' && option.wmsLayers) {
      return L.layerGroup([
        this.createWmsLayer(option),
        L.geoJSON(jwcDefinedBoundaryGeoJson(), {
          pane: this.pane,
          style: {
            color: option.color,
            weight: 2,
            opacity: 0.96,
            dashArray: '8 5',
            fillOpacity: 0,
          },
          onEachFeature: (feature, featureLayer) => {
            const properties = feature.properties || {}
            const note = properties.note ? `<br>${escapeHtml(properties.note)}` : ''
            featureLayer.bindPopup(
              `<strong>${escapeHtml(properties.name || option.name)}</strong><br>${escapeHtml(option.version)}<br>${escapeHtml(properties.source || option.source)}${note}`,
              { className: 'maritime-popup' },
            )
          },
        }),
      ])
    }
    throw new Error(t('map.layers.maritime.missingData', { name: option.shortName }))
  }

  private createSeaAreaLabelLayer(): L.LayerGroup {
    const labels = L.layerGroup()
    const refresh = () => {
      labels.clearLayers()
      const zoom = this.map.getZoom()
      majorSeaAreaLabels()
        .filter((label) => zoom >= label.minZoom)
        .forEach((label) => {
          L.marker([label.latitude, label.longitude], {
            pane: this.pane,
            interactive: false,
            icon: L.divIcon({
              className: 'sea-area-label',
              html: label.name,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
          }).addTo(labels)
        })
    }
    refresh()
    this.map.on('zoomend', refresh)
    labels.on('remove', () => this.map.off('zoomend', refresh))
    return labels
  }

  private createWmsLayer(option: MaritimeLayerOption): L.TileLayer.WMS {
    const wmsOptions: L.WMSOptions & {
      CQL_FILTER?: string
      SLD_BODY?: string
    } = {
      layers: option.wmsLayers || '',
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      pane: this.pane,
      opacity: 1,
      attribution: '&copy; Marine Regions / VLIZ',
    }
    if (option.wmsSldBody) wmsOptions.SLD_BODY = option.wmsSldBody
    if (option.wmsCqlFilter) wmsOptions.CQL_FILTER = option.wmsCqlFilter
    return L.tileLayer.wms(MARINE_REGIONS_WMS_URL, wmsOptions)
  }
}