import * as L from 'leaflet'
import { canonicalLongitude, formatCoordinateLabel } from '@/components/map/core/coordinates'
import type { MapCoordinates, MapPin } from '@/components/map/controllers/types'

interface PinControllerOptions {
  map: L.Map
  layer: L.LayerGroup
  coordinates: MapCoordinates
  pane: string
  /**
   * 透明命中圈单独用更高的 pane：标点加入港口列表后自身标记会被隐藏（避免重复点），
   * 若命中圈仍在 port-pane，港口点会盖住它，点正中就打不开信息框（实测确认）。
   * 放在 edit-pane(620) 后，命中圈位于港口点(460)之上、测量层(640)之下。
   */
  hitPane?: string
  /** 落点成功（已换算成业务坐标）后通知宿主显示信息框。 */
  onPinPlaced?: (pin: MapPin) => void
  /** 点中已放置的标点时通知宿主，按该标点重新显示信息框。 */
  onPinClick?: (pin: MapPin) => void
  /** 落点模式开关变化时同步按钮状态（模式不再因为落点而自动关闭）。 */
  onPlacingChange?: (placing: boolean) => void
  /** 标点数量变化时通知宿主（用于显示/隐藏「清除全部标点」按钮）。 */
  onPinCountChange?: (count: number) => void
}

/** 标点大小与港口坐标点一致（radius 5 + 2px 白描边）。 */
const PIN_RADIUS = 5
/**
 * 透明命中圈半径：标点本身只有 10px 直径，手指点不中。
 * 参考航线透明命中线 `leaflet-route-hit-line` 的做法，在同一图层里叠一个看不见的
 * 大圆专门接收点击（CSS 用 pointer-events 打开命中）。
 */
const PIN_HIT_RADIUS = 16
/** 当前标点（信息框对应的那个）外圈高亮环半径：多个标点叠在一起时用来区分。 */
const PIN_ACTIVE_RING_RADIUS = PIN_RADIUS + 4

/**
 * 地图标点工具：连续落点模式 + 多个标点图形 + 透明命中圈。
 * 落点模式一次点击进入、再点一次退出，中途可以连续放下任意多个标点。
 *
 * 标点被「加到港口列表」后（`markPinAdded`）只保留记录和透明命中圈：同一坐标上的港口坐标点
 * 已经代表了这个位置，再画标点图形/label 就会出现两个重叠的点；命中圈留着，用户仍能点回信息框。
 */
export class PinController {
  private readonly map: L.Map
  private readonly layer: L.LayerGroup
  private readonly coordinates: MapCoordinates
  private readonly pane: string
  private readonly hitPane: string
  private readonly onPinPlaced?: (pin: MapPin) => void
  private readonly onPinClick?: (pin: MapPin) => void
  private readonly onPlacingChange?: (placing: boolean) => void
  private readonly onPinCountChange?: (count: number) => void
  private placing = false
  /** 已放下的全部标点（业务坐标），同一个位置允许重复。 */
  private pins: MapPin[] = []
  /** 递增 id：宿主按 id 删除某一个标点，不受坐标重复影响。 */
  private pinSequence = 0
  /** 信息框当前对应的标点 id（最近放置或最近点中的那个）。 */
  private activePinId: number | null = null

  constructor(options: PinControllerOptions) {
    this.map = options.map
    this.layer = options.layer
    this.coordinates = options.coordinates
    this.pane = options.pane
    this.hitPane = options.hitPane ?? options.pane
    this.onPinPlaced = options.onPinPlaced
    this.onPinClick = options.onPinClick
    this.onPlacingChange = options.onPlacingChange
    this.onPinCountChange = options.onPinCountChange
  }

  setPlacing(placing: boolean): boolean {
    this.placing = placing
    this.map.getContainer().classList.toggle('pin-placing-mode-active', placing)
    this.onPlacingChange?.(this.placing)
    return this.placing
  }

  isPlacing(): boolean {
    return this.placing
  }

  getPinCount(): number {
    return this.pins.length
  }

  hasPins(): boolean {
    return this.pins.length > 0
  }

  /**
   * 标记某个标点「已经加到港口列表」：只影响绘制，不动记录。
   * 该坐标上出现了港口坐标点，标点自身的可见图形和 label 随之撤掉，避免重复；
   * 透明命中圈保留，点它仍然回到信息框（此时信息框里的「加到港口列表」由宿主置灰）。
   */
  markPinAdded(id: number): void {
    const pin = this.pins.find((item) => item.id === id)
    if (!pin || pin.added) return
    pin.added = true
    this.render()
  }

  /**
   * 地图点击：落点模式下放下标点，但**保持**落点模式（连续标点）。
   * 返回 true 表示本次点击已经被标点工具消费，地图其它点击逻辑不再处理。
   */
  handleMapClick(event: L.LeafletMouseEvent): boolean {
    if (!this.placing) return false
    this.placeAt(event.latlng.lng, event.latlng.lat)
    return true
  }

  /** 删除单个标点（信息框里的「删除」），其余标点保持不动。 */
  removePin(id: number): void {
    const previousCount = this.pins.length
    this.pins = this.pins.filter((pin) => pin.id !== id)
    if (this.pins.length === previousCount) return
    if (this.activePinId === id) this.activePinId = null
    this.render()
    this.onPinCountChange?.(this.pins.length)
  }

  /** 清除全部标点（地图右侧的「清除全部标点」按钮）。 */
  clearPins(): void {
    if (!this.pins.length) return
    this.pins = []
    this.activePinId = null
    this.render()
    this.onPinCountChange?.(0)
  }

  /** 底图坐标系变化后按新的显示坐标重绘。 */
  refresh(): void {
    this.render()
  }

  reset(): void {
    this.setPlacing(false)
    this.clearPins()
  }

  destroy(): void {
    this.placing = false
    this.pins = []
    this.activePinId = null
    this.layer.clearLayers()
  }

  private render(): void {
    this.layer.clearLayers()
    // 当前标点最后绘制：两个标点重叠时，信息框对应的那个连同高亮环显示在最上面。
    const ordered = [...this.pins].sort(
      (first, second) => Number(first.id === this.activePinId) - Number(second.id === this.activePinId),
    )
    // 命中圈先画、标点后画：两个标点靠得很近时，点在标点圆点上命中的是它自己，
    // 而不是叠在上面的另一个标点的透明命中圈。
    ordered.forEach((pin) => this.renderPinHitArea(pin))
    ordered.forEach((pin) => this.renderPinMarker(pin))
  }

  private renderPinMarker(pin: MapPin): void {
    // 已加到港口列表的标点：同一坐标上已经有港口坐标点，这里不再画圆点、label 和高亮环，
    // 否则地图上就是两个重叠的点。透明命中圈不受影响（见 renderPinHitArea）。
    if (pin.added) return

    const latLng = this.coordinates.toDisplayLatLng(pin.lon, pin.lat)

    // 与港口坐标点保持一致的图形和 label 样式（label 文本就是经纬度）。
    const marker = L.circleMarker(latLng, {
      pane: this.pane,
      radius: PIN_RADIUS,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillColor: '#e27728',
      fillOpacity: 1,
      bubblingMouseEvents: false,
    })
    marker.bindTooltip(formatCoordinateLabel(pin.lon, pin.lat), {
      permanent: true,
      direction: 'top',
      offset: [0, -7],
      className: 'portdistance-map-label',
    })
    marker.on('click', (event) => this.handlePinTap(pin, event))
    marker.addTo(this.layer)

    // 信息框对应的标点：外圈再加一道高亮环，多个标点并存时用户能看出信息框说的是哪一个。
    if (pin.id === this.activePinId) {
      L.circleMarker(latLng, {
        pane: this.pane,
        radius: PIN_ACTIVE_RING_RADIUS,
        color: '#e27728',
        weight: 1.5,
        opacity: 0.9,
        fill: false,
        interactive: false,
      }).addTo(this.layer)
    }
  }

  /** 透明命中圈：只负责扩大点击区域，点中后同样重新显示信息框。 */
  private renderPinHitArea(pin: MapPin): void {
    const hitCircle = L.circleMarker(this.coordinates.toDisplayLatLng(pin.lon, pin.lat), {
      pane: this.hitPane,
      radius: PIN_HIT_RADIUS,
      color: '#e27728',
      weight: 0,
      opacity: 0,
      fillColor: '#e27728',
      fillOpacity: 0,
      interactive: true,
      bubblingMouseEvents: false,
      className: 'leaflet-pin-hit-circle',
    })
    hitCircle.on('click', (event) => this.handlePinTap(pin, event))
    hitCircle.addTo(this.layer)
  }

  /**
   * 点中已有标点：把它设为当前标点并重新显示信息框。
   *
   * 落点模式**也**走这条分支：早期实现在落点模式下点已有标点会再落一个新点，
   * 导致「想再看一次信息框却总是又多出一个点」（实测反馈）。命中圈半径只有 16px，
   * 想在附近继续落点，点圈外即可。
   */
  private handlePinTap(pin: MapPin, event: L.LeafletMouseEvent): void {
    L.DomEvent.stop(event)
    this.activePinId = pin.id
    this.render()
    this.onPinClick?.(pin)
  }

  /**
   * 放下一个标点（入参是显示坐标）。落点模式保持开启，用户可以连续标点；
   * 新标点成为当前标点，信息框随之切换。
   */
  private placeAt(rawLongitude: number, rawLatitude: number): void {
    const [longitude, latitude] = this.coordinates.toBusinessCoordinate(
      canonicalLongitude(rawLongitude),
      rawLatitude,
    )
    const pin: MapPin = { id: (this.pinSequence += 1), lon: longitude, lat: latitude }
    this.pins.push(pin)
    this.activePinId = pin.id
    this.render()
    this.onPinCountChange?.(this.pins.length)
    this.onPinPlaced?.(pin)
  }
}
