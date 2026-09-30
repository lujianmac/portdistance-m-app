import * as L from 'leaflet'
import { t } from '@/i18n'
import { basemaps, type BaseMapConfig } from '@/components/map/modules/base'
import { createRouteScreenshot } from '@/components/map/core/routeScreenshot'
import { EcaLayerController } from '@/components/map/controllers/ecaLayerController'
import { GraticuleController } from '@/components/map/controllers/graticuleController'
import { MaritimeLayerController } from '@/components/map/controllers/maritimeLayerController'
import { MeasurementController } from '@/components/map/controllers/measurementController'
import { MeteoLayerController, type MeteoLayerId } from '@/components/map/controllers/meteoLayerController'
import { RouteLayerController } from '@/components/map/controllers/routeLayerController'
import { TimezoneLayerController } from '@/components/map/controllers/timezoneLayerController'
import type { LeafletMapCallbacks, MapCoordinates, MeasureMode } from '@/components/map/controllers/types'
import type { MaritimeLayerId } from '@/components/map/modules/maritime'
import type { RoutePointConfig } from '@/types/map'
import type { Port, RoutePathItem, RoutePoint } from '@/types/protocol'
import { gcj02ToWgs84, wgs84ToGcj02, type MapCoordinateSystem } from '@/components/map/util/coordinate'
import { defaultMapSource, defaultMapView } from '@/config/region'

export type { LeafletMapCallbacks, MeasureMode } from '@/components/map/controllers/types'

export class LeafletMapAdapter {
  private readonly container: string | HTMLElement
  private callbacks: LeafletMapCallbacks = {}
  private map: L.Map | null = null
  private basemapConfigs: BaseMapConfig[] = []
  private baseLayers = new Map<string, L.Layer>()
  private activeBasemapId = 'domestic'
  private coordinateSystem: MapCoordinateSystem = 'gcj02'
  private meteoQueryMode = false
  private zoomControl: L.Control | null = null
  private zoomButtons: Array<{ button: HTMLButtonElement; titleKey: string }> = []

  private graticuleLayer = L.layerGroup()
  private measureLayer = L.layerGroup()
  private meteoQueryLayer = L.layerGroup()
  private meteoQueryPoint: [number, number] | null = null
  private ecaLayerController: EcaLayerController | null = null
  private routeLayerController: RouteLayerController | null = null
  private graticuleController: GraticuleController | null = null
  private measurementController: MeasurementController | null = null
  private meteoLayerController: MeteoLayerController | null = null
  private maritimeLayerController: MaritimeLayerController | null = null
  private timezoneLayerController: TimezoneLayerController | null = null

  constructor(container: string | HTMLElement) {
    this.container = container
  }

  async init(callbacks: LeafletMapCallbacks = {}): Promise<void> {
    this.callbacks = callbacks
    // Domestic (GCJ-02) tiles first for mainland China, global WGS84 elsewhere,
    // and open the map over the user's own region instead of a fixed China view.
    this.basemapConfigs = basemaps(defaultMapSource())
    const firstMap = this.basemapConfigs[0]
    this.activeBasemapId = firstMap.id
    this.coordinateSystem = firstMap.coordinateSystem
    const initialView = defaultMapView()

    this.map = L.map(this.container, {
      center: this.toDisplayLatLng(initialView.center[0], initialView.center[1]),
      zoom: initialView.zoom,
      minZoom: 1,
      maxZoom: 16,
      worldCopyJump: true,
      preferCanvas: false,
      zoomControl: false,
      attributionControl: true,
      doubleClickZoom: true,
    })

    this.createPanes()
    const map = this.map
    if (!map) throw new Error('Leaflet map initialization failed')
    /*
     * The tab page can be created while the container still has no layout size
     * (fresh tab entry / after the iOS swipe-back destroyed the page). Leaflet
     * would then compute an absurd zoom for the first fitBounds, which shows up
     * as "zoomed in extremely far, then jumps back". Measuring first fixes it.
     */
    map.invalidateSize(false)
    const coordinates: MapCoordinates = {
      toDisplayCoordinate: (longitude, latitude) => this.toDisplayCoordinate(longitude, latitude),
      toDisplayLatLng: (longitude, latitude) => this.toDisplayLatLng(longitude, latitude),
      toBusinessCoordinate: (longitude, latitude) => this.toBusinessCoordinate(longitude, latitude),
    }
    this.measurementController = new MeasurementController({
      map,
      layer: this.measureLayer,
      coordinates,
      pane: 'measure-pane',
      isTurnDragEnabled: () => this.routeLayerController?.getDiagnostics().turnDragEnabled ?? false,
      onNotice: this.callbacks.onMapNotice,
      onMeasurementChange: (state) => this.callbacks.onMeasurementChange?.(state),
    })
    this.graticuleController = new GraticuleController({
      map,
      layer: this.graticuleLayer,
      coordinates,
      linePane: 'eca-pane',
      labelPane: 'port-pane',
    })
    this.routeLayerController = new RouteLayerController({
      map,
      callbacks: this.callbacks,
      coordinates,
      panes: {
        route: 'route-pane',
        preview: 'preview-pane',
        port: 'port-pane',
        edit: 'edit-pane',
      },
    })
    this.ecaLayerController = new EcaLayerController({ map, coordinates, pane: 'eca-pane' })
    this.meteoLayerController = new MeteoLayerController({
      map,
      vectorPane: 'meteo-vector-pane',
      particlePane: 'meteo-particle-pane',
      loadGrid: (query, signal) => {
        if (!this.callbacks.onMeteoGridRequest) return Promise.reject(new Error(t('map.layers.meteo.service.notConfigured')))
        return this.callbacks.onMeteoGridRequest(query, signal)
      },
      onLoadingChange: this.callbacks.onMeteoGridLoadingChange,
      onData: this.callbacks.onMeteoGridData,
      onNotice: this.callbacks.onMapNotice,
    })
    this.maritimeLayerController = new MaritimeLayerController({ map, pane: 'maritime-pane' })
    this.timezoneLayerController = new TimezoneLayerController({ map, onNotice: this.callbacks.onMapNotice })

    this.basemapConfigs.forEach((config) => {
      const layer = this.createTileLayer(config)
      this.baseLayers.set(config.id, layer)
    })
    this.baseLayers.get(firstMap.id)?.addTo(this.map)

    this.measureLayer.addTo(this.map)
    this.meteoQueryLayer.addTo(this.map)

    this.map.attributionControl.setPrefix(false)
    this.addZoomButtonControl()

    this.map.on('click', this.handleMapClick)
    this.map.on('mousemove', this.handleMeasureMouseMove)
    this.map.on('dblclick', this.handleMeasureDoubleClick)
    await new Promise<void>((resolve) => this.map?.whenReady(() => resolve()))
    this.map.invalidateSize()
  }

  private createPanes(): void {
    if (!this.map) return
    const paneOrder: Array<[string, number]> = [
      ['eca-pane', 320],
      ['maritime-pane', 340],
      ['timezone-pane', 350],
      ['meteo-particle-pane', 360],
      ['meteo-vector-pane', 370],
      ['route-pane', 410],
      ['preview-pane', 420],
      ['port-pane', 460],
      ['meteo-pane', 480],
      ['edit-pane', 620],
      ['measure-pane', 640],
    ]
    paneOrder.forEach(([name, zIndex]) => {
      const pane = this.map?.createPane(name)
      if (pane) pane.style.zIndex = String(zIndex)
    })
  }

  private toDisplayCoordinate(longitude: number, latitude: number): [number, number] {
    return this.coordinateSystem === 'gcj02'
      ? wgs84ToGcj02(longitude, latitude)
      : [longitude, latitude]
  }

  private toDisplayLatLng(longitude: number, latitude: number): L.LatLngExpression {
    const [displayLongitude, displayLatitude] = this.toDisplayCoordinate(longitude, latitude)
    return [displayLatitude, displayLongitude]
  }

  private toBusinessCoordinate(longitude: number, latitude: number): [number, number] {
    return this.coordinateSystem === 'gcj02'
      ? gcj02ToWgs84(longitude, latitude)
      : [longitude, latitude]
  }

  private createTileLayer(config: BaseMapConfig): L.LayerGroup {
    const layers: L.Layer[] = [L.tileLayer(config.urlTemplate, {
      attribution: config.attribution,
      maxZoom: config.maxZoom ?? 20,
      crossOrigin: true,
      subdomains: ['1', '2', '3', '4'],
    })]
    if (config.overlayUrlTemplate) {
      layers.push(L.tileLayer(config.overlayUrlTemplate, {
        maxZoom: config.maxZoom ?? 20,
        crossOrigin: true,
        subdomains: ['1', '2', '3', '4'],
      }))
    }
    return L.layerGroup(layers)
  }

  setBasemap(id: string): string {
    if (!this.map || id === this.activeBasemapId) return this.activeBasemapId
    const nextConfig = this.basemapConfigs.find((config) => config.id === id)
    const nextLayer = this.baseLayers.get(id)
    if (!nextConfig || !nextLayer) return this.activeBasemapId
    if (nextConfig.coordinateSystem === 'gcj02' && (this.meteoLayerController?.hasVisibleLayers()
      || this.maritimeLayerController?.hasVisibleLayers() || this.timezoneLayerController?.isVisible())) {
      this.callbacks.onMapNotice?.(t('map.layers.shell.basemapNeedsWgs84'))
      return this.activeBasemapId
    }

    const currentCenter = this.map.getCenter()
    const [centerLongitude, centerLatitude] = this.toBusinessCoordinate(currentCenter.lng, currentCenter.lat)
    this.baseLayers.get(this.activeBasemapId)?.removeFrom(this.map)
    nextLayer.addTo(this.map)
    this.activeBasemapId = id
    this.coordinateSystem = nextConfig.coordinateSystem
    this.map.attributionControl.setPrefix(false)
    const nextCenter = this.toDisplayLatLng(centerLongitude, centerLatitude)
    this.map.setView(nextCenter, Math.min(this.map.getZoom(), nextConfig.maxZoom ?? 20), { animate: false })
    this.ecaLayerController?.render()
    this.routeLayerController?.refresh()
    this.measurementController?.refresh()
    this.graticuleController?.refresh()
    this.renderMeteoQueryPoint()
    return this.activeBasemapId
  }

  private addZoomButtonControl(): void {
    if (!this.map) return
    const control = new L.Control({ position: 'topleft' })
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'portdistance-zoom-buttons')
      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)
      const createButton = (label: string, titleKey: string, handler: () => void) => {
        const button = L.DomUtil.create('button', 'portdistance-zoom-button', container) as HTMLButtonElement
        button.type = 'button'
        button.textContent = label
        button.title = t(titleKey)
        button.setAttribute('aria-label', t(titleKey))
        this.zoomButtons.push({ button, titleKey })
        L.DomEvent.on(button, 'click', (event) => {
          L.DomEvent.preventDefault(event)
          handler()
        })
      }
      createButton('+', 'map.layers.shell.zoomIn', () => this.map?.zoomIn())
      createButton('−', 'map.layers.shell.zoomOut', () => this.map?.zoomOut())
      return container
    }
    this.zoomControl = control
    control.addTo(this.map)
  }

  /** Re-apply translated Leaflet control labels after the language changes. */
  updateLocale(): void {
    this.zoomButtons.forEach(({ button, titleKey }) => {
      const title = t(titleKey)
      button.title = title
      button.setAttribute('aria-label', title)
    })
  }

  setPorts(ports: Port[]): void {
    this.routeLayerController?.setPorts(ports)
  }

  drawRoute(points: RoutePoint[]): void {
    this.routeLayerController?.drawRoute(points)
  }

  setTurningPoints(points: RoutePoint[]): void {
    this.routeLayerController?.setTurningPoints(points)
  }

  setTrackSegments(segments: RoutePathItem[]): void {
    this.routeLayerController?.setTrackSegments(segments)
  }

  setRouteData(
    points: RoutePoint[],
    segments: RoutePathItem[],
    turningPoints: RoutePoint[],
    autoFit = true,
  ): void {
    this.routeLayerController?.setRouteData(points, segments, turningPoints, autoFit)
  }

  clearRoute(): void {
    this.routeLayerController?.clearRoute()
  }

  setRoutePointConfig(config: RoutePointConfig[]): void {
    this.routeLayerController?.setRoutePointConfig(config)
  }

  setRouteEditMode(enabled: boolean): void {
    this.routeLayerController?.setRouteEditMode(enabled)
  }

  setTurnDragMode(enabled: boolean): void {
    this.routeLayerController?.setTurnDragMode(enabled)
  }

  reset(): void {
    this.routeLayerController?.reset()
    this.setMeasureMode(null)
  }

  private readonly handleMapClick = (event: L.LeafletMouseEvent) => {
    // Buttons floating over the map (e.g. "clear measurement") must never be
    // treated as a map click by the measurement tool.
    const target = event.originalEvent?.target as HTMLElement | null
    if (target && typeof target.closest === 'function' && target.closest('.map-overlay')) return
    if (this.measurementController?.handleMapClick(event)) return
    if (this.meteoQueryMode) {
      const [lon, lat] = this.toBusinessCoordinate(event.latlng.lng, event.latlng.lat)
      this.callbacks.onMeteoQueryRequest?.({ lon, lat })
      return
    }
    this.routeLayerController?.handleMapClick()
  }

  private readonly handleMeasureMouseMove = (event: L.LeafletMouseEvent) => {
    this.measurementController?.handleMouseMove(event)
  }

  private readonly handleMeasureDoubleClick = (event: L.LeafletMouseEvent) => {
    this.measurementController?.handleDoubleClick(event)
  }

  async setMaritimeLayerVisible(id: MaritimeLayerId, visible: boolean): Promise<{
    visible: boolean
    activeBasemapId: string
  }> {
    if (!this.map || !this.maritimeLayerController) return { visible: false, activeBasemapId: this.activeBasemapId }
    if (visible && this.coordinateSystem !== 'wgs84') this.setBasemap('topo-vector')
    return {
      visible: await this.maritimeLayerController.setVisible(id, visible),
      activeBasemapId: this.activeBasemapId,
    }
  }

  clearMaritimeLayers(): void {
    this.maritimeLayerController?.clear()
  }

  async setMeteoLayerVisible(id: MeteoLayerId, visible: boolean): Promise<{
    visible: boolean
    activeBasemapId: string
  }> {
    if (!this.map || !this.meteoLayerController) return { visible: false, activeBasemapId: this.activeBasemapId }
    if (visible && this.coordinateSystem !== 'wgs84') this.setBasemap('topo-vector')
    return {
      visible: await this.meteoLayerController.setVisible(id, visible),
      activeBasemapId: this.activeBasemapId,
    }
  }

  async setMeteoParticlesVisible(visible: boolean): Promise<boolean> {
    return this.meteoLayerController?.setParticlesVisible(visible) ?? false
  }

  isMeteoParticleVisible(): boolean {
    return this.meteoLayerController?.isParticleVisible() ?? false
  }

  clearMeteoLayers(): void {
    this.meteoLayerController?.clear()
  }

  async setTimezoneLayerVisible(visible: boolean): Promise<{
    visible: boolean
    activeBasemapId: string
  }> {
    if (!this.map || !this.timezoneLayerController) {
      return { visible: false, activeBasemapId: this.activeBasemapId }
    }
    if (visible && this.coordinateSystem !== 'wgs84') this.setBasemap('topo-vector')
    return {
      visible: await this.timezoneLayerController.setVisible(visible),
      activeBasemapId: this.activeBasemapId,
    }
  }

  isTimezoneLayerVisible(): boolean {
    return this.timezoneLayerController?.isVisible() ?? false
  }

  setMeasureMode(mode: MeasureMode): MeasureMode {
    return this.measurementController?.setMode(mode) ?? null
  }

  clearMeasurement(): void {
    this.measurementController?.clearMeasurement()
  }

  setMeteoQueryMode(enabled: boolean): boolean {
    this.meteoQueryMode = enabled
    this.map?.getContainer().classList.toggle('meteo-query-mode-active', enabled)
    return this.meteoQueryMode
  }

  setMeteoQueryPoint(longitude: number, latitude: number): void {
    this.meteoQueryPoint = [longitude, latitude]
    this.renderMeteoQueryPoint()
  }

  clearMeteoQueryPoint(): void {
    this.meteoQueryPoint = null
    this.meteoQueryLayer.clearLayers()
  }

  private renderMeteoQueryPoint(): void {
    this.meteoQueryLayer.clearLayers()
    if (!this.meteoQueryPoint) return
    const [longitude, latitude] = this.meteoQueryPoint
    L.circleMarker(this.toDisplayLatLng(longitude, latitude), {
      pane: 'meteo-pane',
      radius: 7,
      color: '#005e70',
      weight: 2,
      opacity: 1,
      fillColor: '#ffffff',
      fillOpacity: 0.95,
    }).addTo(this.meteoQueryLayer)
  }

  toggleGraticule(): boolean {
    return this.graticuleController?.toggle() ?? false
  }

  async takeRouteScreenshot(): Promise<string | null> {
    const points = this.routeLayerController?.collectRoutePoints() || []
    await this.whenRendered()
    return createRouteScreenshot(points)
  }

  async whenRendered(): Promise<void> {
    if (!this.map) return
    await new Promise<void>((resolve) => this.map?.whenReady(() => resolve()))
    await this.routeLayerController?.getRouteFitInFlight()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }

  invalidateSize(): void {
    this.map?.invalidateSize({ animate: false, pan: false })
    this.routeLayerController?.applyPendingFit()
  }

  getDiagnostics() {
    const routeDiagnostics = this.routeLayerController?.getDiagnostics()
    return {
      routeEditEnabled: routeDiagnostics?.routeEditEnabled ?? false,
      turnDragEnabled: routeDiagnostics?.turnDragEnabled ?? false,
      routePointCount: routeDiagnostics?.routePointCount ?? 0,
      turnPointCount: routeDiagnostics?.turnPointCount ?? 0,
      maritimeLayerIds: this.maritimeLayerController?.getVisibleLayerIds() ?? [],
      meteoLayerIds: this.meteoLayerController?.getVisibleLayerIds() ?? [],
      meteoParticlesVisible: this.meteoLayerController?.isParticleVisible() ?? false,
      timezoneLayerVisible: this.timezoneLayerController?.isVisible() ?? false,
      graticuleVisible: this.graticuleController?.isVisible() ?? false,
      measureMode: this.measurementController?.getMode() ?? null,
      measurePointCount: this.measurementController?.getPointCount() ?? 0,
      activeBasemapId: this.activeBasemapId,
      zoom: this.map?.getZoom() ?? null,
    }
  }

  destroy(): void {
    this.map?.off('click', this.handleMapClick)
    this.map?.off('mousemove', this.handleMeasureMouseMove)
    this.map?.off('dblclick', this.handleMeasureDoubleClick)
    this.map?.getContainer().classList.remove('meteo-query-mode-active')
    this.map?.stop()
    this.zoomControl?.remove()
    this.zoomControl = null
    this.zoomButtons = []
    this.ecaLayerController?.destroy()
    this.routeLayerController?.destroy()
    this.graticuleController?.destroy()
    this.measurementController?.destroy()
    this.meteoLayerController?.destroy()
    this.maritimeLayerController?.destroy()
    this.timezoneLayerController?.destroy()
    this.meteoQueryLayer.clearLayers()
    this.map?.removeLayer(this.meteoQueryLayer)
    this.meteoQueryPoint = null
    this.graticuleController = null
    this.measurementController = null
    this.routeLayerController = null
    this.ecaLayerController = null
    this.meteoLayerController = null
    this.maritimeLayerController = null
    this.timezoneLayerController = null
    this.graticuleLayer.clearLayers()
    this.measureLayer.clearLayers()
    this.map?.remove()
    this.map = null
  }
}
