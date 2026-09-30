import * as L from 'leaflet'
import { t } from '@/i18n'
import { canonicalLongitude, nearestWrappedLongitude, unwrapCoordinates } from '@/components/map/core/coordinates'
import type { LeafletMapCallbacks, MapCoordinates } from '@/components/map/controllers/types'
import { createPortGraphics } from '@/components/map/modules/port'
import { createRoutePointGraphics } from '@/components/map/modules/routePoint'
import { createTurnPointGraphics } from '@/components/map/modules/turnPoint'
import { buildTrackHoverText } from '@/components/map/modules/track'
import type { RoutePointConfig } from '@/types/map'
import type { Port, RoutePathItem, RoutePoint } from '@/types/protocol'
import { deepClone } from '@/utils/common'
import { greatCircleDist } from '@/components/map/util/distanceUtil'

interface RouteLayerControllerOptions {
  map: L.Map
  callbacks: LeafletMapCallbacks
  coordinates: MapCoordinates
  panes: {
    route: string
    preview: string
    port: string
    edit: string
  }
}

function calcRouteDistanceNm(points: RoutePoint[]): number {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += greatCircleDist(points[index - 1].lon, points[index - 1].lat, points[index].lon, points[index].lat)
  }
  return total
}

function calcSegmentDistanceNm(segment: RoutePathItem): number {
  const parsed = Number(segment.distance)
  if (Number.isFinite(parsed)) return parsed

  let total = 0
  for (let index = 1; index < segment.route.length; index += 1) {
    const previous = segment.route[index - 1]
    const current = segment.route[index]
    if (!previous || !current) continue
    total += greatCircleDist(Number(previous[0]), Number(previous[1]), Number(current[0]), Number(current[1]))
  }
  return total
}

export class RouteLayerController {
  private readonly map: L.Map
  private readonly callbacks: LeafletMapCallbacks
  private readonly coordinates: MapCoordinates
  private readonly panes: RouteLayerControllerOptions['panes']
  private readonly portLayer = L.layerGroup()
  private readonly routeLayer = L.layerGroup()
  private readonly routePointLayer = L.layerGroup()
  private readonly turnPointLayer = L.layerGroup()
  private readonly turnPreviewLayer = L.layerGroup()
  private ports: Port[] = []
  private routePoints: RoutePoint[] = []
  private turningPoints: RoutePoint[] = []
  private trackSegments: RoutePathItem[] = []
  private routePointConfig: RoutePointConfig[] = []
  private routeEditEnabled = false
  private turnDragEnabled = false
  private selectedTurnPointRouteSeq: number | null = null
  private pendingTurnPointCreate: ReturnType<typeof setTimeout> | null = null
  private pendingTurnPointSelect: ReturnType<typeof setTimeout> | null = null
  private lastTurnPointTap: { routeSeq: number; at: number } | null = null
  private routeFitInFlight: Promise<void> | null = null
  private routeReferenceLongitude: number | null = null
  private hasCompletedInitialFit = false
  /** Bounds of a fit that was requested while the map container had no size yet. */
  private pendingFitBounds: L.LatLngBounds | null = null

  constructor(options: RouteLayerControllerOptions) {
    this.map = options.map
    this.callbacks = options.callbacks
    this.coordinates = options.coordinates
    this.panes = options.panes
    this.routeLayer.addTo(this.map)
    this.turnPreviewLayer.addTo(this.map)
    this.portLayer.addTo(this.map)
  }

  setPorts(ports: Port[]): void {
    this.ports = deepClone(ports)
    this.renderPorts()
  }

  drawRoute(points: RoutePoint[]): void {
    this.routePoints = deepClone(points)
    this.renderRouteGraphics()
  }

  setTurningPoints(points: RoutePoint[]): void {
    this.turningPoints = deepClone(points)
    this.renderRouteGraphics()
  }

  setTrackSegments(segments: RoutePathItem[]): void {
    this.trackSegments = deepClone(segments)
    this.renderRouteGraphics()
  }

  setRouteData(
    points: RoutePoint[],
    segments: RoutePathItem[],
    turningPoints: RoutePoint[],
    autoFit = true,
  ): void {
    this.routePoints = deepClone(points)
    this.trackSegments = deepClone(segments)
    this.turningPoints = deepClone(turningPoints)
    this.renderRouteGraphics(autoFit)
  }

  clearRoute(): void {
    this.routePoints = []
    this.turningPoints = []
    this.trackSegments = []
    this.routeReferenceLongitude = null
    this.routeLayer.clearLayers()
    this.turnPointLayer.clearLayers()
    this.turnPreviewLayer.clearLayers()
    this.callbacks.onTrackHover?.(null)
    this.renderPorts()
  }

  setRoutePointConfig(config: RoutePointConfig[]): void {
    this.routePointConfig = deepClone(config)
    this.renderRoutePointGraphics()
  }

  setRouteEditMode(enabled: boolean): void {
    this.routeEditEnabled = enabled
    this.renderPorts()
    this.renderRoutePointGraphics()
  }

  setTurnDragMode(enabled: boolean): void {
    this.turnDragEnabled = enabled
    this.cancelPendingTurnPointSelect()
    this.lastTurnPointTap = null
    this.selectedTurnPointRouteSeq = null
    this.turnPreviewLayer.clearLayers()
    this.map.doubleClickZoom[enabled ? 'disable' : 'enable']()
    // Rebuild the route so the transparent hit line is only alive in edit mode
    // (autoFit = false keeps the current viewport).
    this.renderRouteGraphics(false)
    this.renderTurnPointGraphics()
  }

  handleMapClick(): void {
    if (!this.turnDragEnabled || this.selectedTurnPointRouteSeq === null) return
    this.cancelPendingTurnPointSelect()
    this.selectTurnPoint(null)
  }

  refresh(): void {
    this.renderPorts()
    this.renderRouteGraphics(false)
    this.renderRoutePointGraphics()
  }

  getRouteFitInFlight(): Promise<void> | null {
    return this.routeFitInFlight
  }

  collectRoutePoints(): Array<[number, number]> {
    if (this.trackSegments.length > 0) {
      const points: Array<[number, number]> = []
      let referenceLongitude: number | undefined
      this.trackSegments.forEach((segment) => {
        const rawPoints = segment.route.map((point) => [Number(point[0]), Number(point[1])] as [number, number])
        const unwrapped = unwrapCoordinates(rawPoints, referenceLongitude)
        referenceLongitude = unwrapped.endLongitude ?? referenceLongitude
        unwrapped.latLngs.forEach(([latitude, longitude]) => {
          const previous = points[points.length - 1]
          if (!previous || previous[0] !== latitude || previous[1] !== longitude) points.push([latitude, longitude])
        })
      })
      return points
    }
    return unwrapCoordinates(this.routePoints.map((point) => [point.lon, point.lat])).latLngs
  }

  getDiagnostics(): {
    routeEditEnabled: boolean
    turnDragEnabled: boolean
    routePointCount: number
    turnPointCount: number
  } {
    const countLayers = (group: L.LayerGroup) => {
      let count = 0
      group.eachLayer(() => { count += 1 })
      return count
    }
    return {
      routeEditEnabled: this.routeEditEnabled,
      turnDragEnabled: this.turnDragEnabled,
      routePointCount: countLayers(this.routePointLayer),
      turnPointCount: countLayers(this.turnPointLayer),
    }
  }

  reset(): void {
    this.cancelPendingTurnPointCreate()
    this.cancelPendingTurnPointSelect()
    this.ports = []
    this.routePoints = []
    this.turningPoints = []
    this.trackSegments = []
    this.routePointConfig = []
    this.routeEditEnabled = false
    this.turnDragEnabled = false
    this.selectedTurnPointRouteSeq = null
    this.routeReferenceLongitude = null
    this.portLayer.clearLayers()
    this.routeLayer.clearLayers()
    this.routePointLayer.clearLayers()
    this.turnPointLayer.clearLayers()
    this.turnPreviewLayer.clearLayers()
    this.map.doubleClickZoom.enable()
    this.callbacks.onTrackHover?.(null)
  }

  destroy(): void {
    this.reset()
    this.portLayer.remove()
    this.routeLayer.remove()
    this.routePointLayer.remove()
    this.turnPointLayer.remove()
    this.turnPreviewLayer.remove()
  }

  private renderPorts(): void {
    this.portLayer.clearLayers()
    createPortGraphics(this.ports)
      .filter((port) => !(this.routeEditEnabled && port.symbol === 'route-point'))
      .forEach((port) => {
        const [rawLongitude, latitude] = this.coordinates.toDisplayCoordinate(port.lon, port.lat)
        const longitude = this.displayLongitude(rawLongitude)
        const style = port.symbol === 'coordinate'
          ? { radius: 5, color: '#ffffff', weight: 2, fillColor: '#e27728', fillOpacity: 1 }
          : port.symbol === 'route-point'
            ? { radius: 5, color: '#ffffff', weight: 2, fillColor: '#0d9488', fillOpacity: 1 }
            : { radius: 6, color: '#ffffff', weight: 2, fillColor: '#323cc8', fillOpacity: 0.9 }
        const marker = L.circleMarker([latitude, longitude], {
          ...style,
          pane: this.panes.port,
          bubblingMouseEvents: false,
        })
        marker.bindTooltip(String(port.portName || ''), {
          permanent: true,
          direction: 'top',
          offset: [0, -7],
          className: 'portdistance-map-label',
        })
        marker.addTo(this.portLayer)
      })
  }

  private renderRouteGraphics(autoFit = true): void {
    this.routeLayer.clearLayers()
    const allLatLngs: L.LatLngExpression[] = []
    let previousLongitude: number | undefined

    if (this.trackSegments.length > 0) {
      this.trackSegments.forEach((segment) => {
        const points = segment.route
          .filter((point) => Array.isArray(point) && point.length >= 2)
          .map((point) => this.coordinates.toDisplayCoordinate(Number(point[0]), Number(point[1])))
        const unwrapped = unwrapCoordinates(points, previousLongitude)
        previousLongitude = unwrapped.endLongitude ?? previousLongitude
        if (unwrapped.latLngs.length < 2) return
        allLatLngs.push(...unwrapped.latLngs)
        this.addTrackLine(unwrapped.latLngs, calcSegmentDistanceNm(segment), segment.idArr)
      })
    } else if (this.routePoints.length >= 2) {
      const points = this.routePoints.map((point) => this.coordinates.toDisplayCoordinate(Number(point.lon), Number(point.lat)))
      const unwrapped = unwrapCoordinates(points)
      allLatLngs.push(...unwrapped.latLngs)
      this.addTrackLine(unwrapped.latLngs, calcRouteDistanceNm(this.routePoints), [])
    }

    if (allLatLngs.length > 1) {
      const bounds = L.latLngBounds(allLatLngs)
      this.routeReferenceLongitude = bounds.getCenter().lng
      this.renderPorts()
      if (autoFit) this.fitRoute(bounds)
    }
    this.renderTurnPointGraphics()
  }

  private addTrackLine(latLngs: L.LatLngExpression[], distanceNm: number, idArr: Array<number | string>): void {
    const line = L.polyline(latLngs, {
      pane: this.panes.route,
      color: '#a1443b',
      weight: 2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      smoothFactor: 0,
      bubblingMouseEvents: false,
    })
    /*
     * The visible route is a 2px stroke, which is nearly impossible to tap on a
     * phone. A second, transparent polyline with the same coordinates widens the
     * touch target. Because it is a normal map layer it pans, zooms and re-renders
     * together with the visible line, and the tap is projected back onto the
     * route so the new turn point always lands exactly on the line.
     */
    const hitLine = L.polyline(latLngs, {
      pane: this.panes.route,
      color: '#a1443b',
      weight: 24,
      opacity: 0,
      lineCap: 'round',
      lineJoin: 'round',
      smoothFactor: 0,
      bubblingMouseEvents: false,
      // Only an active touch target while the turn point editor is on.
      interactive: this.turnDragEnabled,
      className: 'leaflet-route-hit-line',
    })
    const bindHover = (target: L.Polyline) => {
      target.on('mouseover', () => this.callbacks.onTrackHover?.(buildTrackHoverText(distanceNm)))
      target.on('mouseout', () => this.callbacks.onTrackHover?.(null))
    }
    bindHover(line)
    bindHover(hitLine)

    const requestTurnPointCreate = (event: L.LeafletMouseEvent, snapToRoute: boolean) => {
      if (!this.turnDragEnabled) return
      const anchorRouteSeq = Number(idArr[0])
      if (!Number.isFinite(anchorRouteSeq)) return
      this.cancelPendingTurnPointCreate()
      this.pendingTurnPointCreate = window.setTimeout(() => {
        this.pendingTurnPointCreate = null
        const latLng = snapToRoute ? this.snapToPolyline(hitLine, event.latlng) : event.latlng
        const [longitude, latitude] = this.coordinates.toBusinessCoordinate(
          canonicalLongitude(latLng.lng),
          latLng.lat,
        )
        this.callbacks.onTurnPointCreateRequest?.({ anchorRouteSeq, lon: longitude, lat: latitude })
      }, 220)
    }

    line.on('click', (event) => requestTurnPointCreate(event, true))
    hitLine.on('click', (event) => requestTurnPointCreate(event, true))

    line.addTo(this.routeLayer)
    hitLine.addTo(this.routeLayer)
  }

  /** Project a tap onto the polyline so the created turn point sits on the route. */
  private snapToPolyline(line: L.Polyline, latLng: L.LatLng): L.LatLng {
    const layerPoint = this.map.latLngToLayerPoint(latLng)
    const closest = line.closestLayerPoint(layerPoint)
    return closest ? this.map.layerPointToLatLng(closest) : latLng
  }

  /** Re-apply a fit that could not run because the container was not measured yet. */
  applyPendingFit(): void {
    if (!this.pendingFitBounds) return
    const bounds = this.pendingFitBounds
    this.pendingFitBounds = null
    if (this.map.getSize().x === 0 || this.map.getSize().y === 0) {
      this.pendingFitBounds = bounds
      return
    }
    this.hasCompletedInitialFit = false
    this.fitRoute(bounds)
  }

  private fitRoute(bounds: L.LatLngBounds): void {
    if (!bounds.isValid()) return
    // A tab page can be created before the container has a layout size; Leaflet
    // would then compute an absurd zoom. Remember the bounds and fit after the
    // host has measured the container instead.
    const size = this.map.getSize()
    if (size.x === 0 || size.y === 0) {
      this.pendingFitBounds = bounds
      return
    }
    // The very first fit of a freshly created map is applied instantly: animating
    // it from the placeholder view is what produced the "zoom in, then settle"
    // flicker when the map tab is entered again.
    const animate = this.hasCompletedInitialFit
    this.hasCompletedInitialFit = true
    this.map.fitBounds(bounds, {
      paddingTopLeft: [72, 96],
      paddingBottomRight: [84, 96],
      maxZoom: 7,
      animate,
      duration: animate ? 0.5 : 0,
    })
    this.routeFitInFlight = new Promise<void>((resolve) => {
      const finish = () => {
        window.clearTimeout(timer)
        resolve()
      }
      const timer = window.setTimeout(finish, 650)
      this.map.once('moveend', finish)
    }).finally(() => {
      this.routeFitInFlight = null
    })
  }

  private renderRoutePointGraphics(): void {
    this.routePointLayer.clearLayers()
    if (!this.routeEditEnabled) {
      this.map.removeLayer(this.routePointLayer)
      return
    }
    createRoutePointGraphics(this.routePointConfig).forEach((point) => {
      const [rawLongitude, latitude] = this.coordinates.toDisplayCoordinate(point.lon, point.lat)
      const longitude = this.displayLongitude(rawLongitude)
      const marker = L.marker([latitude, longitude], {
        pane: this.panes.edit,
        bubblingMouseEvents: false,
        keyboard: true,
        title: point.rpName,
        icon: L.divIcon({
          className: `route-point-icon route-point-icon-${point.option === '-1' ? 'blocked' : point.option === '1' ? 'required' : 'allowed'}`,
          html: point.option === '-1' ? '<span aria-hidden="true">×</span>' : '<span aria-hidden="true"></span>',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      })
      marker.on('click', (event) => {
        L.DomEvent.stop(event)
        this.callbacks.onRoutePointClick?.(point.wayPointId)
      })
      marker.bindTooltip(point.rpName, {
        permanent: true,
        direction: 'top',
        offset: [0, -5],
        className: 'portdistance-map-label route-point-label',
      })
      marker.addTo(this.routePointLayer)
    })
    this.routePointLayer.addTo(this.map)
  }

  private renderTurnPointGraphics(): void {
    this.turnPointLayer.clearLayers()
    if (!this.turnDragEnabled) {
      this.map.removeLayer(this.turnPointLayer)
      return
    }

    const source = this.turningPoints.length ? this.turningPoints : this.routePoints
    createTurnPointGraphics(source).forEach((point) => {
      const selected = point.routeSeq === this.selectedTurnPointRouteSeq
      const [rawLongitude, latitude] = this.coordinates.toDisplayCoordinate(point.lon, point.lat)
      const marker = L.marker([latitude, this.displayLongitude(rawLongitude)], {
        pane: this.panes.edit,
        draggable: true,
        bubblingMouseEvents: false,
        keyboard: true,
        title: t('map.layers.shell.turnPointTitle'),
        icon: this.createTurnPointIcon(selected, point.userAdded),
      }) as L.Marker & { turnPointRouteSeq?: number }
      marker.turnPointRouteSeq = point.routeSeq
      marker.on('click', (event) => {
        L.DomEvent.stop(event)
        this.cancelPendingTurnPointCreate()
        /*
         * Own double-tap detection: iOS/WebView does not reliably emit `dblclick`
         * for a double tap, and the click below only marks the point as selected
         * (it no longer re-renders the layer, which used to replace the DOM node
         * between the two taps and swallow the native dblclick as well).
         */
        const now = Date.now()
        const isDoubleTap = this.lastTurnPointTap !== null
          && this.lastTurnPointTap.routeSeq === point.routeSeq
          && now - this.lastTurnPointTap.at < 400
        if (isDoubleTap) {
          this.openTurnPointEditor(point.routeSeq, marker)
          return
        }
        this.lastTurnPointTap = { routeSeq: point.routeSeq, at: now }
        this.cancelPendingTurnPointSelect()
        this.pendingTurnPointSelect = window.setTimeout(() => {
          this.pendingTurnPointSelect = null
          this.selectTurnPoint(this.selectedTurnPointRouteSeq === point.routeSeq ? null : point.routeSeq, false)
        }, 260)
      })
      marker.on('dblclick', (event) => {
        L.DomEvent.stop(event)
        this.openTurnPointEditor(point.routeSeq, marker)
      })
      marker.on('dragstart', () => {
        this.cancelPendingTurnPointSelect()
        this.selectTurnPoint(point.routeSeq, false)
        this.map.dragging.disable()
      })
      marker.on('drag', () => {
        const latLng = marker.getLatLng()
        this.renderTurnDragPreview(point.routeSeq, latLng.lng, latLng.lat)
      })
      marker.on('dragend', () => {
        this.map.dragging.enable()
        this.turnPreviewLayer.clearLayers()
        const latLng = marker.getLatLng()
        const [longitude, latitude] = this.coordinates.toBusinessCoordinate(canonicalLongitude(latLng.lng), latLng.lat)
        this.callbacks.onTurnPointDragCommit?.({ routeSeq: point.routeSeq, lon: longitude, lat: latitude })
      })
      marker.addTo(this.turnPointLayer)
    })
    this.turnPointLayer.addTo(this.map)
  }

  private createTurnPointIcon(selected: boolean, userAdded = false): L.DivIcon {
    const variant = `${selected ? ' selected' : ''}${userAdded ? ' turn-point-icon-user' : ''}`
    return L.divIcon({
      className: `turn-point-icon${variant}`,
      html: '<span></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  private selectTurnPoint(routeSeq: number | null, rerender = true): void {
    this.selectedTurnPointRouteSeq = routeSeq
    if (rerender) this.renderTurnPointGraphics()
    else this.applyTurnPointSelection()
  }

  /** Update the selected style in place, without rebuilding the marker elements. */
  private applyTurnPointSelection(): void {
    this.turnPointLayer.eachLayer((layer) => {
      const marker = layer as L.Marker & { turnPointRouteSeq?: number }
      const element = marker.getElement()
      if (!element) return
      element.classList.toggle('selected', marker.turnPointRouteSeq === this.selectedTurnPointRouteSeq)
    })
  }

  /** Opens the turn point dialog; shared by the double-tap, dblclick and drag paths. */
  private openTurnPointEditor(routeSeq: number, marker: L.Marker): void {
    this.cancelPendingTurnPointCreate()
    this.cancelPendingTurnPointSelect()
    this.lastTurnPointTap = null
    this.selectTurnPoint(routeSeq, false)
    const latLng = marker.getLatLng()
    const [longitude, latitude] = this.coordinates.toBusinessCoordinate(canonicalLongitude(latLng.lng), latLng.lat)
    const source = this.turningPoints.find((point) => point.routeSeq === routeSeq)
    this.callbacks.onTurnPointEditRequest?.({
      routeSeq,
      lon: longitude,
      lat: latitude,
      userAdded: Boolean(source?.userAdded),
    })
  }

  private renderTurnDragPreview(routeSeq: number, longitude: number, latitude: number): void {
    this.turnPreviewLayer.clearLayers()
    const source = this.turningPoints.length ? this.turningPoints : this.routePoints
    const index = source.findIndex((point) => point.routeSeq === routeSeq)
    const previous = source[index - 1]
    const next = source[index + 1]
    if (!previous || !next) return

    const target: L.LatLngExpression = [latitude, longitude]
    const options: L.PolylineOptions = {
      pane: this.panes.preview,
      color: '#a1443b',
      weight: 2,
      dashArray: '7 7',
      opacity: 1,
      interactive: false,
    }
    const [previousLongitude, previousLatitude] = this.coordinates.toDisplayCoordinate(previous.lon, previous.lat)
    const [nextLongitude, nextLatitude] = this.coordinates.toDisplayCoordinate(next.lon, next.lat)
    L.polyline([[previousLatitude, nearestWrappedLongitude(previousLongitude, longitude)], target], options).addTo(this.turnPreviewLayer)
    L.polyline([[nextLatitude, nearestWrappedLongitude(nextLongitude, longitude)], target], options).addTo(this.turnPreviewLayer)
  }

  private displayLongitude(longitude: number): number {
    if (this.routeReferenceLongitude === null) return longitude
    return nearestWrappedLongitude(longitude, this.routeReferenceLongitude)
  }

  private cancelPendingTurnPointCreate(): void {
    if (!this.pendingTurnPointCreate) return
    window.clearTimeout(this.pendingTurnPointCreate)
    this.pendingTurnPointCreate = null
  }

  private cancelPendingTurnPointSelect(): void {
    if (!this.pendingTurnPointSelect) return
    window.clearTimeout(this.pendingTurnPointSelect)
    this.pendingTurnPointSelect = null
  }
}