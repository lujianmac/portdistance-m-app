import * as L from 'leaflet'
import { t } from '@/i18n'
import type { MeteoGridQuery, MeteoGridQueryResult, MeteoPointQueryResult } from '@/components/map/modules/meteo'

export type MeteoLayerId = 'wind' | 'wave-height' | 'wave-direction' | 'current' | 'pressure'

interface MeteoLayerControllerOptions {
  map: L.Map
  vectorPane: string
  particlePane: string
  loadGrid: (query: MeteoGridQuery, signal: AbortSignal) => Promise<MeteoGridQueryResult>
  onLoadingChange?: (loading: boolean) => void
  onData?: (grid: MeteoGridQueryResult) => void
  onNotice?: (message: string) => void
}

interface ParticleVector {
  lon: number
  lat: number
  x: number
  y: number
  speedKn: number
  direction: number
}

interface Particle {
  x: number
  y: number
  age: number
  lifetime: number
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeBearing(value: number): number {
  return ((value % 360) + 360) % 360
}

function currentColor(speedKn: number): string {
  if (speedKn < 0.5) return '#168aad'
  if (speedKn < 1.5) return '#0077b6'
  if (speedKn < 2.5) return '#4361ee'
  return '#c44536'
}

function waveColor(heightM: number): string {
  if (heightM < 0.8) return '#9dd9d2'
  if (heightM < 1.8) return '#36a7a0'
  if (heightM < 3) return '#e0a458'
  return '#c44536'
}

function pressureColor(pressureHpa: number): string {
  if (pressureHpa < 990) return '#8e3b46'
  if (pressureHpa < 1005) return '#d9773f'
  if (pressureHpa < 1020) return '#3c8d9d'
  return '#486c3f'
}

function viewportEnvelope(map: L.Map): [number, number, number, number] {
  const bounds = map.getBounds()
  const south = Math.max(bounds.getSouth(), -85)
  const north = Math.min(bounds.getNorth(), 85)
  const longitudeSpan = bounds.getEast() - bounds.getWest()
  if (longitudeSpan >= 350) return [-180, south, 180, north]

  const west = ((bounds.getWest() + 180) % 360 + 360) % 360 - 180
  const east = ((bounds.getEast() + 180) % 360 + 360) % 360 - 180
  if (west >= east) return [-180, south, 180, north]
  return [west, south, east, north]
}

function gridDimensions(zoom: number): Pick<MeteoGridQuery, 'columns' | 'rows'> {
  if (zoom <= 2) return { columns: 6, rows: 4 }
  if (zoom <= 5) return { columns: 7, rows: 5 }
  return { columns: 8, rows: 6 }
}

class MeteoParticleLayer extends L.Layer {
  private readonly pane: string
  private map: L.Map | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private vectors: ParticleVector[] = []
  private particles: Particle[] = []
  private animationFrame: number | null = null
  private lastFrameAt = 0

  constructor(pane: string) {
    super()
    this.pane = pane
  }

  onAdd(map: L.Map): this {
    this.map = map
    const pane = map.getPane(this.pane)
    if (!pane) return this
    this.canvas = L.DomUtil.create('canvas', 'meteo-particle-canvas', pane) as HTMLCanvasElement
    this.canvas.setAttribute('aria-hidden', 'true')
    this.context = this.canvas.getContext('2d')
    map.on('moveend zoomend resize', this.resetCanvas, this)
    this.resetCanvas()
    this.start()
    return this
  }

  onRemove(map: L.Map): this {
    map.off('moveend zoomend resize', this.resetCanvas, this)
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame)
    this.animationFrame = null
    this.canvas?.remove()
    this.canvas = null
    this.context = null
    this.map = null
    this.lastFrameAt = 0
    return this
  }

  setPoints(points: MeteoPointQueryResult[]): void {
    this.vectors = []
    if (!this.map) return
    this.vectors = points.flatMap((point) => {
      const speedKn = point.marine?.currentSpeedKn
      const direction = point.marine?.currentDirection
      if (speedKn === null || speedKn === undefined || direction === null || direction === undefined || speedKn <= 0) return []
      const position = this.map?.latLngToContainerPoint([point.lat, point.lon])
      return position ? [{ lon: point.lon, lat: point.lat, x: position.x, y: position.y, speedKn, direction }] : []
    })
    this.seedParticles()
  }

  private readonly resetCanvas = () => {
    if (!this.map || !this.canvas || !this.context) return
    const size = this.map.getSize()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(size.x * pixelRatio)
    this.canvas.height = Math.round(size.y * pixelRatio)
    this.canvas.style.width = `${size.x}px`
    this.canvas.style.height = `${size.y}px`
    L.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]))
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    this.setPointsFromGrid()
    this.context.clearRect(0, 0, size.x, size.y)
  }

  private setPointsFromGrid(): void {
    if (!this.map || !this.vectors.length) return
    this.vectors = this.vectors.map((vector) => {
      const position = this.map?.latLngToContainerPoint([vector.lat, vector.lon])
      return position ? { ...vector, x: position.x, y: position.y } : vector
    })
    this.seedParticles()
  }

  private start(): void {
    if (this.animationFrame !== null) return
    this.animationFrame = requestAnimationFrame(this.render)
  }

  private readonly render = (timestamp: number) => {
    if (!this.map || !this.canvas || !this.context) {
      this.animationFrame = null
      return
    }
    const size = this.map.getSize()
    const elapsed = this.lastFrameAt ? clamp((timestamp - this.lastFrameAt) / 16.67, 0.5, 2) : 1
    this.lastFrameAt = timestamp
    const context = this.context
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.fillStyle = 'rgba(0, 0, 0, 0.13)'
    context.fillRect(0, 0, size.x, size.y)
    context.restore()

    for (const particle of this.particles) {
      const vector = this.nearestVector(particle.x, particle.y)
      if (!vector || particle.age >= particle.lifetime) {
        this.reseedParticle(particle)
        continue
      }
      const radians = vector.direction * Math.PI / 180
      const distance = clamp(vector.speedKn * 1.25, 0.5, 6.5) * elapsed
      const previousX = particle.x
      const previousY = particle.y
      particle.x += Math.sin(radians) * distance
      particle.y -= Math.cos(radians) * distance
      particle.age += elapsed
      if (particle.x < -8 || particle.y < -8 || particle.x > size.x + 8 || particle.y > size.y + 8) {
        this.reseedParticle(particle)
        continue
      }
      context.save()
      context.globalAlpha = 0.58
      context.strokeStyle = currentColor(vector.speedKn)
      context.lineWidth = 1.15
      context.beginPath()
      context.moveTo(previousX, previousY)
      context.lineTo(particle.x, particle.y)
      context.stroke()
      context.restore()
    }
    this.animationFrame = requestAnimationFrame(this.render)
  }

  private nearestVector(x: number, y: number): ParticleVector | null {
    let closest: ParticleVector | null = null
    let closestDistance = Number.POSITIVE_INFINITY
    for (const vector of this.vectors) {
      const distance = (vector.x - x) ** 2 + (vector.y - y) ** 2
      if (distance < closestDistance) {
        closest = vector
        closestDistance = distance
      }
    }
    return closest
  }

  private seedParticles(): void {
    if (!this.map || !this.canvas) return
    const count = this.vectors.length ? clamp(this.vectors.length * 3, 36, 120) : 0
    this.particles = Array.from({ length: count }, () => this.createParticle())
  }

  private createParticle(): Particle {
    const particle: Particle = { x: 0, y: 0, age: 0, lifetime: 36 }
    this.reseedParticle(particle)
    return particle
  }

  private reseedParticle(particle: Particle): void {
    const vector = this.vectors[Math.floor(Math.random() * this.vectors.length)]
    if (!vector) {
      particle.age = 0
      particle.lifetime = 0
      return
    }
    particle.x = vector.x + (Math.random() - 0.5) * 40
    particle.y = vector.y + (Math.random() - 0.5) * 40
    particle.age = Math.random() * 10
    particle.lifetime = 28 + Math.random() * 24
  }
}

export class MeteoLayerController {
  private readonly map: L.Map
  private readonly vectorPane: string
  private readonly loadGrid: MeteoLayerControllerOptions['loadGrid']
  private readonly onLoadingChange?: (loading: boolean) => void
  private readonly onData?: (grid: MeteoGridQueryResult) => void
  private readonly onNotice?: (message: string) => void
  private readonly layers: Record<MeteoLayerId, L.LayerGroup> = {
    wind: L.layerGroup(),
    'wave-height': L.layerGroup(),
    'wave-direction': L.layerGroup(),
    current: L.layerGroup(),
    pressure: L.layerGroup(),
  }
  private readonly visibleLayerIds = new Set<MeteoLayerId>()
  private readonly particleLayer: MeteoParticleLayer
  private request: AbortController | null = null
  private refreshTimer: ReturnType<typeof window.setTimeout> | null = null
  private requestVersion = 0
  private grid: MeteoGridQueryResult | null = null
  private particlesRequested = false

  constructor(options: MeteoLayerControllerOptions) {
    this.map = options.map
    this.vectorPane = options.vectorPane
    this.loadGrid = options.loadGrid
    this.onLoadingChange = options.onLoadingChange
    this.onData = options.onData
    this.onNotice = options.onNotice
    this.particleLayer = new MeteoParticleLayer(options.particlePane)
  }

  async setVisible(id: MeteoLayerId, visible: boolean): Promise<boolean> {
    if (visible === this.visibleLayerIds.has(id)) return visible
    const layer = this.layers[id]
    if (!visible) {
      this.map.removeLayer(layer)
      this.visibleLayerIds.delete(id)
      if (id === 'current') {
        this.particlesRequested = false
        this.syncParticleLayer()
      }
      if (!this.visibleLayerIds.size) this.stopViewportUpdates()
      return false
    }

    layer.addTo(this.map)
    const isFirstVisibleLayer = !this.visibleLayerIds.size
    this.visibleLayerIds.add(id)
    const hadGrid = Boolean(this.grid)
    this.renderLayers()
    try {
      await this.renderViewport()
      if (isFirstVisibleLayer && this.visibleLayerIds.size) {
        this.map.on('moveend zoomend', this.handleMapMove)
      }
      return true
    } catch (error) {
      if (hadGrid) return true
      this.map.removeLayer(layer)
      this.visibleLayerIds.delete(id)
      if (!this.visibleLayerIds.size) this.stopViewportUpdates()
      throw error
    }
  }

  isVisible(id: MeteoLayerId): boolean {
    return this.visibleLayerIds.has(id)
  }

  getVisibleLayerIds(): MeteoLayerId[] {
    return Array.from(this.visibleLayerIds)
  }

  hasVisibleLayers(): boolean {
    return this.visibleLayerIds.size > 0
  }

  async setParticlesVisible(visible: boolean): Promise<boolean> {
    if (visible && !this.visibleLayerIds.has('current')) return false
    this.particlesRequested = visible
    this.syncParticleLayer()
    if (visible && !this.grid) await this.renderViewport()
    return this.isParticleVisible()
  }

  isParticleVisible(): boolean {
    return this.particlesRequested && this.visibleLayerIds.has('current') && this.map.hasLayer(this.particleLayer)
  }

  clear(): void {
    this.stopViewportUpdates()
    this.visibleLayerIds.clear()
    this.grid = null
    this.particlesRequested = false
    Object.values(this.layers).forEach((layer) => {
      layer.clearLayers()
      this.map.removeLayer(layer)
    })
    this.map.removeLayer(this.particleLayer)
  }

  destroy(): void {
    this.clear()
    this.particleLayer.setPoints([])
  }

  private readonly handleMapMove = () => {
    if (!this.visibleLayerIds.size) return
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer)
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null
      void this.renderViewport().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        this.onNotice?.(t('map.layers.meteo.layerRefreshFailed'))
      })
    }, 220)
  }

  private async renderViewport(): Promise<void> {
    if (!this.visibleLayerIds.size) return
    this.request?.abort()
    const request = new AbortController()
    this.request = request
    const version = ++this.requestVersion
    const [west, south, east, north] = viewportEnvelope(this.map)
    this.onLoadingChange?.(true)
    try {
      const dimensions = gridDimensions(this.map.getZoom())
      const grid = await this.loadGrid({ west, south, east, north, ...dimensions }, request.signal)
      if (version !== this.requestVersion || !this.visibleLayerIds.size) return
      this.grid = grid
      this.renderLayers()
      this.onData?.(grid)
    } finally {
      if (version === this.requestVersion) {
        this.request = null
        this.onLoadingChange?.(false)
      }
    }
  }

  private renderLayers(): void {
    const points = this.grid?.points || []
    Object.values(this.layers).forEach((layer) => layer.clearLayers())
    if (this.visibleLayerIds.has('wind')) this.renderDirectionLayer(this.layers.wind, points, 'wind')
    if (this.visibleLayerIds.has('wave-height')) this.renderWaveHeightLayer(points)
    if (this.visibleLayerIds.has('wave-direction')) this.renderDirectionLayer(this.layers['wave-direction'], points, 'wave')
    if (this.visibleLayerIds.has('current')) this.renderDirectionLayer(this.layers.current, points, 'current')
    if (this.visibleLayerIds.has('pressure')) this.renderPressureLayer(points)
    this.particleLayer.setPoints(points)
    this.syncParticleLayer()
  }

  private renderDirectionLayer(layer: L.LayerGroup, points: MeteoPointQueryResult[], type: 'wind' | 'wave' | 'current'): void {
    for (const point of points) {
      const observation = type === 'wind' ? point.weather : point.marine
      const direction = type === 'wind'
        ? point.weather?.windDirection
        : type === 'wave'
          ? point.marine?.waveDirection
          : point.marine?.currentDirection
      const speed = type === 'wind'
        ? point.weather?.windSpeedKn
        : type === 'wave'
          ? point.marine?.waveHeightM
          : point.marine?.currentSpeedKn
      if (!observation || direction === null || direction === undefined || speed === null || speed === undefined) continue
      const bearing = type === 'current' ? direction : direction + 180
      const color = type === 'wind' ? '#0f766e' : type === 'wave' ? '#226da8' : currentColor(speed)
      const scale = clamp(0.78 + speed / 18, 0.78, 1.3)
      const marker = L.marker([point.lat, point.lon], {
        pane: this.vectorPane,
        interactive: false,
        icon: L.divIcon({
          className: 'meteo-vector-marker',
          html: `<span class="meteo-vector-arrow" style="--meteo-angle:${normalizeBearing(bearing)}deg;--meteo-color:${color};--meteo-scale:${scale.toFixed(2)}"></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      })
      marker.addTo(layer)
    }
  }

  private renderWaveHeightLayer(points: MeteoPointQueryResult[]): void {
    const layer = this.layers['wave-height']
    for (const point of points) {
      const heightM = point.marine?.waveHeightM
      if (heightM === null || heightM === undefined) continue
      const color = waveColor(heightM)
      L.circleMarker([point.lat, point.lon], {
        pane: this.vectorPane,
        radius: clamp(4 + heightM * 2.5, 5, 15),
        color: '#ffffff',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.74,
      }).bindTooltip(t('map.layers.meteo.waveHeightTooltip', { value: heightM.toFixed(1) }), { direction: 'top', opacity: 0.92 }).addTo(layer)
    }
  }

  private renderPressureLayer(points: MeteoPointQueryResult[]): void {
    const layer = this.layers.pressure
    const renderLabels = this.map.getZoom() >= 4
    for (const point of points) {
      const pressureHpa = point.weather?.pressureHpa
      if (pressureHpa === null || pressureHpa === undefined) continue
      const color = pressureColor(pressureHpa)
      L.circleMarker([point.lat, point.lon], {
        pane: this.vectorPane,
        radius: 4,
        color: '#ffffff',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.88,
      }).bindTooltip(t('map.layers.meteo.pressureTooltip', { value: pressureHpa.toFixed(1) }), { direction: 'top', opacity: 0.92 }).addTo(layer)
      if (renderLabels) {
        L.marker([point.lat, point.lon], {
          pane: this.vectorPane,
          interactive: false,
          icon: L.divIcon({
            className: 'meteo-pressure-label',
            html: `<span>${Math.round(pressureHpa)}</span>`,
            iconSize: [40, 18],
            iconAnchor: [20, 9],
          }),
        }).addTo(layer)
      }
    }
  }

  private syncParticleLayer(): void {
    const shouldShow = this.particlesRequested && this.visibleLayerIds.has('current') && this.grid?.points.length
    if (shouldShow && !this.map.hasLayer(this.particleLayer)) {
      this.particleLayer.addTo(this.map)
      this.particleLayer.setPoints(this.grid?.points || [])
    } else if (!shouldShow && this.map.hasLayer(this.particleLayer)) {
      this.map.removeLayer(this.particleLayer)
    }
  }

  private stopViewportUpdates(): void {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer)
    this.refreshTimer = null
    this.request?.abort()
    this.request = null
    this.map.off('moveend zoomend', this.handleMapMove)
    this.onLoadingChange?.(false)
  }
}
