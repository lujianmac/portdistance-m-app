<template>
  <ion-modal
    class="share-dialog"
    :is-open="isOpen"
    @will-present="prepareMiniMap"
    @did-present="prepareMiniMap"
    @did-dismiss="handleDismiss"
  >
    <ion-header class="share-dialog-header">
      <ion-toolbar>
        <ion-title>{{ t('distance.share.title') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :aria-label="t('common.close')" @click="closeDialog">{{ t('common.close') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!--
      The scroll container is a plain div: with `--height: auto` the modal wrapper has no
      bounded height, and `ion-content` is `contain: size` + `height: 100%`, so it would
      collapse to zero height instead of scrolling.
    -->
    <div class="share-dialog-body">
      <div ref="captureRef" class="share-capture">
        <div class="share-map-wrap">
          <div ref="mapContainerRef" class="share-map"></div>
        </div>

        <div class="share-result">
          <p class="share-card-title">{{ t('distance.share.title') }}</p>
          <p class="share-route" :class="{ 'share-route-empty': !routeLabel }">
            {{ routeLabel || t('distance.share.cardSketchNote') }}
          </p>

          <div v-if="hasPorts" class="share-metrics">
            <div v-for="metric in metricViews" :key="metric.key" class="share-metric">
              <span class="share-metric-label">{{ metric.label }}</span>
              <strong class="share-metric-value">{{ metric.value }}<small>{{ metric.unit }}</small></strong>
            </div>
          </div>

        </div>
      </div>
    </div>

    <ion-footer class="share-dialog-footer">
      <ion-toolbar>
        <div class="share-actions">
          <ion-button class="share-action-primary" :disabled="sharing" @click="share">
            <ion-spinner v-if="sharing" class="share-spinner" name="crescent" />
            <span>{{ sharing ? t('common.loading') : t('common.share') }}</span>
          </ion-button>
          <ion-button class="share-action" fill="outline" :disabled="sharing" @click="copyImage">
            {{ t('distance.share.copyImage') }}
          </ion-button>
          <ion-button class="share-action" fill="clear" color="medium" @click="closeDialog">
            {{ t('common.close') }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  IonButton,
  IonButtons,
  IonFooter,
  IonHeader,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import html2canvas from 'html2canvas'
import * as L from 'leaflet'
import { basemaps, type BaseMapConfig } from '@/components/map/modules/base'
import { wgs84ToGcj02 } from '@/components/map/util/coordinate'
import { useDistanceStore } from '@/stores/distance'
import { useMapStore } from '@/stores/map'
import { portCountryCode, portDisplayName } from '@/utils/port'
import { copyText, shareText } from '@/utils/share'
import { shareRouteCard } from '@/utils/share-card'

/** `routePaths` / `routePathsECA` entries: a polyline in business (WGS84) coordinates. */
interface RoutePathEntry {
  route: number[][]
  distance?: number
  idArr?: Array<number | string>
}

interface ShareMetricView {
  key: string
  label: string
  value: string
  unit: string
}

const BRAND_COLOR = '#006c8c'
const ECA_COLOR = '#e66b45'
const DEFAULT_CENTER: [number, number] = [120, 30]
const MINI_MAP_MAX_ZOOM = 7
const CAPTURE_SCALE = 2

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const distance = useDistanceStore()
const mapStore = useMapStore()

const captureRef = ref<HTMLElement | null>(null)
const mapContainerRef = ref<HTMLElement | null>(null)
const sharing = ref(false)
const copying = ref(false)

/** Leaflet instances are kept outside reactivity on purpose. */
let miniMap: L.Map | null = null
let miniMapConfig: BaseMapConfig | null = null
let miniMapLayers: L.Layer[] = []

const hasPorts = computed(() => distance.portPoints.length > 0)

const routeLabel = computed(() =>
  distance.portPoints
    .map((row) => portDisplayName(row.port))
    .filter(Boolean)
    .join(' -> '),
)

/** Port positions in business (WGS84) coordinates, invalid entries dropped. */
const portCoordinates = computed<number[][]>(() =>
  distance.portPoints
    .map((row) => [Number(row.port.longitude), Number(row.port.latitude)])
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1])),
)

/**
 * Route polylines in business coordinates. When the route geometry is missing
 * (e.g. the dialog is opened straight after restoring a stored result) the legs
 * are drawn as straight lines between the ports.
 */
const routeSegments = computed<number[][][]>(() => {
  const segments = ((mapStore.routePaths || []) as RoutePathEntry[])
    .map((path) => path.route)
    .filter((route) => Array.isArray(route) && route.length >= 2)
  if (segments.length) return segments
  return portCoordinates.value.length >= 2 ? [portCoordinates.value] : []
})

const ecaSegments = computed<number[][][]>(() =>
  ((mapStore.routePathsECA || []) as RoutePathEntry[])
    .map((path) => path.route)
    .filter((route) => Array.isArray(route) && route.length >= 2),
)

const metricViews = computed<ShareMetricView[]>(() => [
  {
    key: 'total-distance',
    label: t('distance.summary.totalDistance'),
    value: distance.totalDistanceNm.toFixed(2),
    unit: t('common.unit.nauticalMileUpper'),
  },
  {
    key: 'eca-distance',
    label: t('distance.summary.eca'),
    value: distance.totalEcaDistanceNm.toFixed(2),
    unit: t('common.unit.nauticalMileUpper'),
  },
  {
    key: 'sailing-time',
    label: t('distance.summary.sailingTime'),
    value: t('distance.summary.sailingTimeWithSpeed', {
      days: distance.sailingDays.toFixed(2),
      speed: distance.speed,
    }),
    unit: '',
  },
])

function portNameOf(port: { portName?: string; fullName?: string; portId?: string | number }) {
  return String(port.portName || port.fullName || port.portId || '').trim()
}

/** Result text shared next to the image and copied by the copy action. */
function resultText() {
  const distanceLine = distance.totalEcaDistanceNm > 0
    ? t('distance.share.distanceLineWithEca', {
        distance: distance.totalDistanceNm.toFixed(2),
        eca: distance.totalEcaDistanceNm.toFixed(2),
      })
    : t('distance.share.distanceLine', { distance: distance.totalDistanceNm.toFixed(2) })
  const timeLine = t('distance.share.timeLine', {
    days: distance.sailingDays.toFixed(2),
    speed: distance.speed,
  })
  return [t('distance.share.routeLine', { route: routeLabel.value }), distanceLine, timeLine].join('\n')
}

/* ------------------------------------------------------------------ *
 * Mini map
 * ------------------------------------------------------------------ */

/**
 * AMap tiles are GCJ-02 shifted, so every business (WGS84) coordinate has to be
 * converted before it is handed to Leaflet, otherwise Chinese waters drift.
 */
function toDisplayCoordinate(longitude: number, latitude: number): [number, number] {
  if (miniMapConfig?.coordinateSystem !== 'gcj02') return [longitude, latitude]
  return wgs84ToGcj02(longitude, latitude)
}

function toLatLng(point: number[]): L.LatLng {
  const [longitude, latitude] = toDisplayCoordinate(Number(point[0]), Number(point[1]))
  return L.latLng(latitude, longitude)
}

function initMiniMap() {
  const container = mapContainerRef.value
  if (miniMap || !container) return

  const config = basemaps()[0]
  if (!config) return
  miniMapConfig = config

  miniMap = L.map(container, {
    center: L.latLng(DEFAULT_CENTER[1], DEFAULT_CENTER[0]),
    zoom: 4,
    minZoom: 2,
    maxZoom: config.maxZoom ?? 18,
    zoomControl: false,
    attributionControl: false,
    // Vector layers are drawn on a canvas: html2canvas captures canvas content
    // reliably, while Leaflet's SVG overlay is dropped from the clone (that is
    // why the shared image was missing the route line and the port dots).
    preferCanvas: true,
    // A pure preview: no tool buttons and no gestures competing with the dialog scroll.
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
  })

  L.tileLayer(config.urlTemplate, {
    subdomains: '1234',
    crossOrigin: true,
    maxZoom: config.maxZoom,
  }).addTo(miniMap)
}

function refreshMiniMap() {
  if (!miniMap) return
  drawMiniMapLayers()
  // The container has no size while the modal animates in.
  miniMap.invalidateSize(false)
  fitMiniMap()
}

function drawMiniMapLayers() {
  if (!miniMap) return
  miniMapLayers.forEach((layer) => layer.remove())
  miniMapLayers = []

  routeSegments.value.forEach((segment) => drawPolyline(segment, BRAND_COLOR))
  ecaSegments.value.forEach((segment) => drawPolyline(segment, ECA_COLOR))

  const ports = portCoordinates.value
  ports.forEach((port, index) => {
    if (!miniMap) return
    const isEndpoint = index === 0 || index === ports.length - 1
    const marker = L.circleMarker(toLatLng(port), {
      radius: isEndpoint ? 4.5 : 3,
      color: BRAND_COLOR,
      weight: 1.5,
      fillColor: '#ffffff',
      fillOpacity: 1,
    })
    marker.addTo(miniMap)
    miniMapLayers.push(marker)
  })
}

function drawPolyline(segment: number[][], color: string) {
  if (!miniMap || segment.length < 2) return
  const line = L.polyline(segment.map((point) => toLatLng(point)), {
    color,
    weight: 3,
    lineJoin: 'round',
    lineCap: 'round',
  })
  line.addTo(miniMap)
  miniMapLayers.push(line)
}

function fitMiniMap() {
  if (!miniMap) return

  const points: L.LatLng[] = []
  routeSegments.value.forEach((segment) => segment.forEach((point) => points.push(toLatLng(point))))
  ecaSegments.value.forEach((segment) => segment.forEach((point) => points.push(toLatLng(point))))
  portCoordinates.value.forEach((port) => points.push(toLatLng(port)))

  if (!points.length) {
    miniMap.setView(L.latLng(DEFAULT_CENTER[1], DEFAULT_CENTER[0]), 4, { animate: false })
    return
  }
  miniMap.fitBounds(L.latLngBounds(points), { padding: [18, 18], maxZoom: MINI_MAP_MAX_ZOOM, animate: false })
}

function destroyMiniMap() {
  miniMapLayers = []
  miniMap?.remove()
  miniMap = null
  miniMapConfig = null
}

/** The modal mounts its slotted content only once it starts presenting. */
async function prepareMiniMap() {
  await nextTick()
  initMiniMap()
  refreshMiniMap()
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) destroyMiniMap()
  },
)

watch([routeSegments, ecaSegments, portCoordinates], () => {
  refreshMiniMap()
})

onBeforeUnmount(() => {
  destroyMiniMap()
})

/* ------------------------------------------------------------------ *
 * Capture + share
 * ------------------------------------------------------------------ */

async function captureShareImage(): Promise<string> {
  const element = captureRef.value
  if (!element) throw new Error('share capture element unavailable')
  // Make sure the (canvas) vector layers are painted in their final position.
  refreshMiniMap()
  await nextTick()
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: CAPTURE_SCALE,
    useCORS: true,
    logging: false,
  })
  return canvas.toDataURL('image/png')
}

function isShareCancelled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /cancel|dismiss/i.test(message)
}

function downloadImage(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** Sends the screenshot through the share sheet; `false` means "not handled". */
async function shareCapturedImage(dataUrl: string, fileName: string, title: string, text: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const saved = await Filesystem.writeFile({
      path: fileName,
      data: dataUrl.split(',')[1],
      directory: Directory.Cache,
      recursive: true,
    })
    const capability = await Share.canShare()
    if (!capability.value) return false
    try {
      await Share.share({ title, text, files: [saved.uri], dialogTitle: title })
      return true
    } catch (error) {
      // Closing the share sheet is not a failure: do not open it a second time.
      if (isShareCancelled(error)) return true
      throw error
    }
  }

  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], fileName, { type: 'image/png' })
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, files: [file] })
      return true
    } catch (error) {
      if (isShareCancelled(error)) return true
      throw error
    }
  }

  downloadImage(dataUrl, fileName)
  return true
}

/** Second chance: the canvas route card, then the plain text share. */
async function shareCardFallback(title: string, text: string) {
  const shared = await shareRouteCard({
    title,
    route: routeLabel.value,
    ports: distance.portPoints.map((row) => ({
      name: portNameOf(row.port),
      country: portCountryCode(row.port),
      lon: Number(row.port.longitude),
      lat: Number(row.port.latitude),
    })),
    segments: routeSegments.value,
    ecaSegments: ecaSegments.value,
    metrics: metricViews.value.map((metric) => ({
      label: metric.label,
      value: `${metric.value} ${metric.unit}`,
    })),
    sketchNote: t('distance.share.cardSketchNote'),
    footer: t('distance.share.cardTagline'),
    text,
    fileName: `portdistance-route-${Date.now()}.png`,
  })
  if (shared) return true
  return shareText(title, text)
}

async function share() {
  if (sharing.value) return
  sharing.value = true
  const title = t('distance.share.title')
  const text = resultText()
  try {
    const dataUrl = await captureShareImage()
    const handled = await shareCapturedImage(dataUrl, `portdistance-route-${Date.now()}.png`, title, text)
    if (!handled) throw new Error('share unavailable')
  } catch {
    const shared = await shareCardFallback(title, text)
    if (!shared) await presentToast(t('common.shareFailed'), 'danger')
  } finally {
    sharing.value = false
  }
}

/**
 * Copies the card image to the clipboard. The Web Clipboard API is the only way
 * to put an image on the clipboard (`@capacitor/clipboard` handles strings only);
 * where it is unavailable the text result is copied instead.
 */
async function copyImage() {
  if (copying.value) return
  copying.value = true
  try {
    const dataUrl = await captureShareImage()
    const blob = await (await fetch(dataUrl)).blob()
    const ClipboardItemCtor = (window as unknown as { ClipboardItem?: new (items: Record<string, Blob>) => ClipboardItem })
      .ClipboardItem
    if (!navigator.clipboard?.write || !ClipboardItemCtor) throw new Error('clipboard image unsupported')
    await navigator.clipboard.write([new ClipboardItemCtor({ 'image/png': blob })])
    await presentToast(t('distance.share.imageCopied'), 'success')
  } catch {
    const copied = await copyText(resultText())
    await presentToast(copied ? t('common.copied') : t('common.copyFailed'), copied ? 'success' : 'danger')
  } finally {
    copying.value = false
  }
}

async function presentToast(message: string, color: string) {
  const toast = await toastController.create({ message, color, duration: 1800, position: 'top' })
  await toast.present()
}

function closeDialog() {
  emit('close')
}

function handleDismiss() {
  destroyMiniMap()
  closeDialog()
}
</script>

<style scoped>
/* Dialog sized like the app's other dialogs, not a full page modal. */
.share-dialog {
  --width: min(92vw, 420px);
  --max-width: 92vw;
  --height: auto;
  --max-height: 88vh;
  --border-radius: 14px;
  --box-shadow: 0 18px 40px rgba(23, 43, 58, 0.28);
  --backdrop-opacity: 0.42;
}

/*
 * The slotted content root Ionic renders inside the modal is a `.ion-page`
 * (`height: 100%` + size containment). With `--height: auto` that percentage has
 * no definite parent height, so keep it explicitly content sized.
 */
.share-dialog :deep(.ion-delegate-host) {
  height: auto;
  contain: layout style;
}

.share-dialog-header ion-toolbar,
.share-dialog-footer ion-toolbar {
  --background: #ffffff;
  --border-color: #dce6ef;
  --min-height: 52px;
}

.share-dialog-header ion-title {
  color: #173447;
  font-size: 15px;
  font-weight: 600;
}

.share-dialog-header ion-button {
  --color: #006c8c;
  font-size: 14px;
}

/* Scrolls instead of ion-content, which collapses under `--height: auto`. */
.share-dialog-body {
  max-height: calc(88vh - 128px);
  overflow-y: auto;
  background: #ffffff;
  -webkit-overflow-scrolling: touch;
}

/* Captured by html2canvas: opaque, no scrollbars, no viewport dependent sizes. */
.share-capture {
  width: 100%;
  overflow: hidden;
  background: #ffffff;
  color: #173447;
}

.share-map-wrap {
  position: relative;
  height: 220px;
  background: #f5f9fb;
}

.share-map {
  width: 100%;
  height: 100%;
  background: #f5f9fb;
}



.share-result {
  padding: 14px 16px 16px;
  border-top: 1px solid #dce6ef;
}

.share-card-title {
  margin: 0;
  color: #006c8c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.share-route {
  margin: 6px 0 0;
  color: #173447;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.share-route-empty {
  color: #6e8192;
  font-size: 13px;
  font-weight: 400;
}








.share-metrics {
  display: flex;
  margin-top: 12px;
  padding: 10px 4px;
  border-radius: 10px;
  background: #f5f9fb;
}

.share-metric {
  width: 25%;
  min-width: 0;
  padding: 0 4px;
  text-align: center;
}

.share-metric-label,
.share-metric-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-metric-label {
  color: #6e8192;
  font-size: 11px;
}

.share-metric-value {
  margin-top: 3px;
  color: #173447;
  font-size: 14px;
  font-weight: 600;
}

.share-metric-value small {
  margin-left: 2px;
  color: #4b5f70;
  font-size: 10px;
  font-weight: 400;
}


.share-actions {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.share-actions ion-button {
  margin: 0;
  font-size: 14px;
}

.share-action-primary {
  flex: 1;
  font-weight: 600;
}

.share-actions .share-action {
  margin-left: 6px;
}

.share-spinner {
  width: 15px;
  height: 15px;
  margin-right: 6px;
  --color: #ffffff;
}
</style>
