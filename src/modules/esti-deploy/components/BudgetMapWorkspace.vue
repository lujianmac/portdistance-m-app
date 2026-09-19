<template>
  <div class="budget-map-workspace">
    <PortDistanceMap
      ref="mapView"
      :ports="mapPorts"
      :route-points="routePoints"
      :track-segments="trackSegments"
      :turning-points="turningPoints"
      :route-point-config="routePointConfig"
      :route-edit-enabled="routeEditEnabled"
      :turn-edit-enabled="turnEditEnabled"
      :route-edit-available="!readonly && hasRoute"
      :turn-edit-available="!readonly && hasRoute"
      :clear-available="false"
      @error="error = $event"
      @map-notice="showNotice"
      @route-edit-toggle="toggleRouteEdit"
      @turn-edit-toggle="toggleTurnEdit"
      @edit-modes-disabled="clearEditModes"
      @route-point-click="openRouteEditor"
      @turn-point-create="openTurnPointCreate"
      @turn-point-edit="openTurnPointEdit"
      @turn-point-drag-commit="commitTurnPointDrag"
    />
    <RoutePointEditorModal
      :visible="routeEditor.visible"
      :route-point-name="routeEditor.config?.rpName || ''"
      :state="routeEditor.config?.option || '0'"
      :pre-port-code="routeEditor.prePortCode"
      :available-ports="mapPorts"
      @cancel="closeRouteEditor"
      @confirm="applyRoutePointEdit"
    />
    <TurnPointEditorModal
      :visible="turnPointEditor.visible"
      :mode="turnPointEditor.mode"
      :can-delete="turnPointEditor.canDelete"
      :longitude="turnPointEditor.longitude"
      :latitude="turnPointEditor.latitude"
      @cancel="closeTurnPointEditor"
      @confirm="applyTurnPointEdit"
      @delete="deleteTurnPoint"
    />
    <p v-if="error" class="map-error">{{ error }}</p>
    <p v-else-if="notice" class="map-notice">{{ notice }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PortDistanceMap } from '@/components/map'
import RoutePointEditorModal from '@/components/map/RoutePointEditorModal.vue'
import TurnPointEditorModal from '@/components/map/TurnPointEditorModal.vue'
import { getRoutePoint } from '@/api/distance'
import { applyRoutePointStateChange, buildRouteEditorDraft, queryRoutePointByWayPoint } from '@/components/map/modules/routePoint'
import { setSeqRoutePoints } from '@/components/map/util/mapUtil'
import type { BudgetPort } from '@/types'
import type { RoutePointConfig, RouteState } from '@/types/map'
import type { Port } from '@/types/protocol'
import { deepClone } from '@/utils/common'
import { buildLocalRouteGeometry, type LocalRouteGeometry } from '@/utils/route'

const props = withDefaults(defineProps<{
  ports: BudgetPort[]
  rawRoutePoints: Record<string, unknown>[]
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  (event: 'route-recalculate', payload: { ports: Port[]; excludedRoutePointIds: number[] }): void
  (event: 'geometry-updated', geometry: LocalRouteGeometry): void
}>()

const { t } = useI18n()

function normalizedRawRoutePoints(points: Record<string, unknown>[]) {
  return setSeqRoutePoints(deepClone(points)) as Record<string, any>[]
}

const rawRoutePoints = ref<Record<string, any>[]>(normalizedRawRoutePoints(props.rawRoutePoints))
const geometry = computed(() => buildLocalRouteGeometry(rawRoutePoints.value))
const mapView = ref<{ invalidateSize: () => void } | null>(null)
const error = ref('')
const notice = ref('')
const routeEditEnabled = ref(false)
const turnEditEnabled = ref(false)
const routePointConfig = ref<RoutePointConfig[]>([])
const routeEditor = ref<{ visible: boolean; config: RoutePointConfig | null; prePortCode?: string }>({
  visible: false,
  config: null,
  prePortCode: undefined,
})
const turnPointEditor = ref<{
  visible: boolean
  mode: 'create' | 'edit'
  canDelete: boolean
  anchorRouteSeq: number | null
  routeSeq: number | null
  longitude: number
  latitude: number
}>({
  visible: false,
  mode: 'create',
  canDelete: false,
  anchorRouteSeq: null,
  routeSeq: null,
  longitude: 0,
  latitude: 0,
})

watch(() => props.rawRoutePoints, (points) => {
  rawRoutePoints.value = normalizedRawRoutePoints(points)
}, { deep: true })

watch(() => props.readonly, (readonly) => {
  if (readonly) clearEditModes()
})

const mapPorts = computed<Port[]>(() => props.ports.map((port) => ({
  portId: port.id,
  portCode: port.port.portId,
  portName: port.port.portName,
  lon: Number(port.port.longitude),
  lat: Number(port.port.latitude),
  isCoordinate: port.port.isCoordinate,
  isWayPoint: port.port.isWayPoint,
})))
const routePoints = computed(() => geometry.value.routePoints.flatMap((segment) => (
  Array.isArray(segment.route) ? segment.route : []
)))
const trackSegments = computed(() => [...geometry.value.routePaths, ...geometry.value.routePathsEca])
const turningPoints = computed(() => geometry.value.turningPoints)
const hasRoute = computed(() => trackSegments.value.length > 0)

function showNotice(message: string) {
  notice.value = message
  window.setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 2400)
}

function clearEditModes() {
  routeEditEnabled.value = false
  turnEditEnabled.value = false
}

async function loadRoutePointConfig() {
  const source = await getRoutePoint()
  const config = source.map((item: any) => ({
    rpId: String(item.routePointId || item.ROUTEPOINTID || ''),
    rpName: String(item.routePointName || item.ROUTEPOINTNAME || ''),
    longitude: Number(item.longitude ?? item.LONGITUDE),
    latitude: Number(item.latitude ?? item.LATITUDE),
    wayPointId: Number(item.wayPointId ?? item.WAYPOINTID),
    routePointId: String(item.routePointId || item.ROUTEPOINTID || ''),
    remark: Number(item.remark ?? item.REMARK),
    option: '0' as RouteState,
  })).filter((item: RoutePointConfig) => (
    item.rpId
    && Number.isFinite(item.longitude)
    && Number.isFinite(item.latitude)
    && Number.isFinite(item.wayPointId)
    && Number(item.remark) < 4
  ))
  if (!config.length) throw new Error(t('budget.map.workspace.noEditableRoutePoint'))
  routePointConfig.value = config
}

async function toggleRouteEdit() {
  if (props.readonly) return
  if (!hasRoute.value) {
    showNotice(t('budget.map.workspace.distanceRequired'))
    return
  }
  if (routeEditEnabled.value) {
    routeEditEnabled.value = false
    return
  }
  try {
    if (!routePointConfig.value.length) await loadRoutePointConfig()
    turnEditEnabled.value = false
    routeEditEnabled.value = true
    showNotice(t('budget.map.workspace.routeEditHint'))
  } catch (cause) {
    showNotice(cause instanceof Error ? cause.message : t('budget.map.workspace.routeLoadFailed'))
  }
}

function toggleTurnEdit() {
  if (props.readonly) return
  if (!hasRoute.value) {
    showNotice(t('budget.map.workspace.distanceRequired'))
    return
  }
  turnEditEnabled.value = !turnEditEnabled.value
  routeEditEnabled.value = false
  showNotice(turnEditEnabled.value ? t('budget.map.workspace.turnEditHint') : '')
}

function openRouteEditor(wayPointId: number) {
  if (props.readonly) return
  const config = queryRoutePointByWayPoint(routePointConfig.value, wayPointId)
  if (!config) return
  const draft = buildRouteEditorDraft(config, mapPorts.value)
  routeEditor.value = { visible: true, config, prePortCode: draft.prePortCode }
}

function closeRouteEditor() {
  routeEditor.value = { visible: false, config: null, prePortCode: undefined }
}

function applyRoutePointEdit(payload: { state: RouteState; prePortCode?: string }) {
  const config = routeEditor.value.config
  if (!config || props.readonly) return
  const change = applyRoutePointStateChange(routePointConfig.value, mapPorts.value, {
    config,
    nextState: payload.state,
    prePortCode: payload.prePortCode,
  })
  if (change.warning && payload.state !== '-1') {
    showNotice(change.warning)
    return
  }
  routePointConfig.value = change.routePointConfig
  closeRouteEditor()
  clearEditModes()
  emit('route-recalculate', {
    ports: change.ports,
    excludedRoutePointIds: routePointConfig.value
      .filter((item) => item.option === '-1')
      .map((item) => item.wayPointId),
  })
}

function findEditableRoutePoint(routeSeq: number, allowSegmentStart = false) {
  for (const segment of rawRoutePoints.value) {
    const route = Array.isArray(segment.route) ? segment.route : []
    const index = route.findIndex((point: any) => Number(point.routeSeq) === routeSeq)
    if (index < 0) continue
    const isEndpoint = index === 0 || index === route.length - 1
    if (isEndpoint && !(allowSegmentStart && index === 0)) return null
    if (route.length < 3 && !allowSegmentStart) return null
    return { route, index, point: route[index] }
  }
  return null
}

function canDeleteTurnPoint(routeSeq: number) {
  return Boolean(findEditableRoutePoint(routeSeq)?.point.userAdded)
}

function publishEditedGeometry() {
  rawRoutePoints.value = normalizedRawRoutePoints(rawRoutePoints.value)
  emit('geometry-updated', buildLocalRouteGeometry(rawRoutePoints.value))
}

function openTurnPointCreate(payload: { anchorRouteSeq: number; lon: number; lat: number }) {
  if (props.readonly) return
  turnPointEditor.value = {
    visible: true,
    mode: 'create',
    canDelete: false,
    anchorRouteSeq: payload.anchorRouteSeq,
    routeSeq: null,
    longitude: payload.lon,
    latitude: payload.lat,
  }
}

function openTurnPointEdit(payload: { routeSeq: number; lon: number; lat: number }) {
  if (props.readonly) return
  turnPointEditor.value = {
    visible: true,
    mode: 'edit',
    canDelete: canDeleteTurnPoint(payload.routeSeq),
    anchorRouteSeq: null,
    routeSeq: payload.routeSeq,
    longitude: payload.lon,
    latitude: payload.lat,
  }
}

function closeTurnPointEditor() {
  turnPointEditor.value = {
    visible: false,
    mode: 'create',
    canDelete: false,
    anchorRouteSeq: null,
    routeSeq: null,
    longitude: 0,
    latitude: 0,
  }
}

function applyTurnPointEdit(payload: { longitude: number; latitude: number }) {
  const editor = turnPointEditor.value
  const target = editor.mode === 'create'
    ? editor.anchorRouteSeq === null ? null : findEditableRoutePoint(editor.anchorRouteSeq, true)
    : editor.routeSeq === null ? null : findEditableRoutePoint(editor.routeSeq)
  if (!target) {
    showNotice(t('budget.map.workspace.turnUpdateFailed'))
    return
  }
  if (editor.mode === 'create') {
    const nextRouteSeq = rawRoutePoints.value.reduce((maximum, segment) => {
      const route = Array.isArray(segment.route) ? segment.route : []
      return Math.max(maximum, ...route.map((point: any) => Number(point.routeSeq) || 0))
    }, -1) + 1
    target.route.splice(target.index + 1, 0, {
      lon: payload.longitude,
      lat: payload.latitude,
      routeSeq: nextRouteSeq,
      wt: '1',
      userAdded: true,
    })
  } else {
    target.point.lon = payload.longitude
    target.point.lat = payload.latitude
  }
  closeTurnPointEditor()
  publishEditedGeometry()
}

function deleteTurnPoint() {
  const routeSeq = turnPointEditor.value.routeSeq
  const target = routeSeq === null ? null : findEditableRoutePoint(routeSeq)
  if (!target || !target.point.userAdded) {
    showNotice(t('budget.map.workspace.turnDeleteNotAllowed'))
    return
  }
  target.route.splice(target.index, 1)
  closeTurnPointEditor()
  publishEditedGeometry()
}

function commitTurnPointDrag(payload: { routeSeq: number; lon: number; lat: number }) {
  const target = findEditableRoutePoint(payload.routeSeq)
  if (!target || props.readonly) return
  target.point.lon = payload.lon
  target.point.lat = payload.lat
  publishEditedGeometry()
}

function invalidateSize() {
  mapView.value?.invalidateSize()
}

defineExpose({ invalidateSize })
</script>

<style scoped>
.budget-map-workspace { position: relative; width: 100%; height: 100%; }.map-error, .map-notice { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 900; margin: 0; padding: 8px 10px; border-radius: 6px; color: #fff; font-size: 13px; }.map-error { background: rgba(180, 35, 24, .94); }.map-notice { background: rgba(23, 52, 71, .9); }
</style>
