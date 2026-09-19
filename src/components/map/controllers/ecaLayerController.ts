import * as L from 'leaflet'
import { unwrapCoordinates } from '@/components/map/core/coordinates'
import type { MapCoordinates } from '@/components/map/controllers/types'
import { getEcaAreaPaths, getEcaLinePaths } from '@/components/map/modules/eca'

const ECA_BOUNDARY_STYLE = {
  color: '#0a7c72',
  weight: 0.8,
  opacity: 0.58,
  dashArray: '3 3',
}

interface EcaLayerControllerOptions {
  map: L.Map
  coordinates: MapCoordinates
  pane: string
}

export class EcaLayerController {
  private readonly map: L.Map
  private readonly coordinates: MapCoordinates
  private readonly pane: string
  private readonly layer = L.layerGroup()

  constructor(options: EcaLayerControllerOptions) {
    this.map = options.map
    this.coordinates = options.coordinates
    this.pane = options.pane
    this.layer.addTo(this.map)
    this.render()
  }

  render(): void {
    this.layer.clearLayers()
    getEcaAreaPaths().forEach((path) => {
      const { latLngs } = unwrapCoordinates(path.map(([longitude, latitude]) => this.coordinates.toDisplayCoordinate(longitude, latitude)))
      if (latLngs.length < 3) return
      L.polygon(latLngs, {
        pane: this.pane,
        ...ECA_BOUNDARY_STYLE,
        fillColor: '#f28c45',
        fillOpacity: 0.06,
        interactive: false,
        smoothFactor: 1.5,
      }).addTo(this.layer)
    })
    getEcaLinePaths().forEach((path) => {
      const { latLngs } = unwrapCoordinates(path.map(([longitude, latitude]) => this.coordinates.toDisplayCoordinate(longitude, latitude)))
      if (latLngs.length < 2) return
      L.polyline(latLngs, {
        pane: this.pane,
        ...ECA_BOUNDARY_STYLE,
        interactive: false,
        smoothFactor: 1.5,
      }).addTo(this.layer)
    })
  }

  destroy(): void {
    this.layer.clearLayers()
    this.map.removeLayer(this.layer)
  }
}