<template>
  <div class="map-workspace">
    <PortDistanceMap
      ref="mapView"
      :ports="ports"
      :route-points="routePoints"
      :track-segments="trackSegments"
      :turning-points="turningPoints"
      :route-point-config="routePointConfig"
      :route-edit-enabled="routeEditEnabled"
      :turn-edit-enabled="turnEditEnabled"
      :route-edit-available="true"
      :turn-edit-available="true"
      :clear-available="true"
      @error="error = $event"
      @route-edit-toggle="toggleRouteEdit"
      @turn-edit-toggle="toggleTurnEdit"
      @edit-modes-disabled="clearEditModes"
      @clear-route="confirmClearRoute"
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
      :available-ports="ports"
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { alertController } from '@ionic/vue'
import { PortDistanceMap } from '@/components/map'
import RoutePointEditorModal from '@/components/map/RoutePointEditorModal.vue'
import TurnPointEditorModal from '@/components/map/TurnPointEditorModal.vue'
import { getRoutePoint } from '@/api/distance'
import { applyRoutePointStateChange, buildRouteEditorDraft, queryRoutePointByWayPoint } from '@/components/map/modules/routePoint'
import { useDistanceStore } from '@/stores/distance'
import { useMapStore } from '@/stores/map'
import type { RoutePointConfig, RouteState } from '@/types/map'

const { t } = useI18n()
const distance = useDistanceStore()
const map = useMapStore()
const error = ref('')
const mapView = ref<{ invalidateSize: () => void } | null>(null)
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
const ports = computed(() => distance.portPoints.map((row) => ({ portId: row.port.portId, portCode: row.port.portId, portName: row.port.portName, lon: Number(row.port.longitude), lat: Number(row.port.latitude), isCoordinate: row.port.isCoordinate, isWayPoint: row.port.isWayPoint })))
const routePoints = computed(() => map.routePoints.flatMap((segment) => Array.isArray(segment.route) ? segment.route : []))
const trackSegments = computed(() => [...map.routePaths, ...map.routePathsECA])
const turningPoints = computed(() => map.turningPoints)

function invalidateSize() {
  mapView.value?.invalidateSize()
}

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
  })).filter((item: RoutePointConfig) => item.rpId && Number.isFinite(item.longitude) && Number.isFinite(item.latitude) && Number.isFinite(item.wayPointId) && Number(item.remark) < 4)
  if (!config.length) throw new Error(t('map.core.workspace.noEditableRoutePoint'))
  routePointConfig.value = config
}

async function toggleRouteEdit() {
  if (!distance.hasDistanceResult) {
    showNotice(t('map.core.workspace.distanceRequired'))
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
    showNotice(t('map.core.workspace.routeEditHint'))
  } catch (cause) {
    showNotice(cause instanceof Error ? cause.message : t('map.core.workspace.routeLoadFailed'))
  }
}

function toggleTurnEdit() {
  if (!distance.hasDistanceResult) {
    showNotice(t('map.core.workspace.distanceRequired'))
    return
  }
  turnEditEnabled.value = !turnEditEnabled.value
  routeEditEnabled.value = false
  showNotice(turnEditEnabled.value ? t('map.core.workspace.turnEditHint') : '')
}

function openRouteEditor(wayPointId: number) {
  const config = queryRoutePointByWayPoint(routePointConfig.value, wayPointId)
  if (!config) return
  const draft = buildRouteEditorDraft(config, ports.value)
  routeEditor.value = { visible: true, config, prePortCode: draft.prePortCode }
}

function closeRouteEditor() {
  routeEditor.value = { visible: false, config: null, prePortCode: undefined }
}

async function applyRoutePointEdit(payload: { state: RouteState; prePortCode?: string }) {
  const config = routeEditor.value.config
  if (!config) return
  const change = applyRoutePointStateChange(routePointConfig.value, ports.value, {
    config,
    nextState: payload.state,
    prePortCode: payload.prePortCode,
  })
  if (change.warning && payload.state !== '-1') {
    showNotice(change.warning)
    return
  }
  routePointConfig.value = change.routePointConfig
  distance.replacePortsFromMap(change.ports)
  closeRouteEditor()
  clearEditModes()
  const excluded = routePointConfig.value.filter((item) => item.option === '-1').map((item) => item.wayPointId)
  const ok = await distance.calculate(excluded)
  if (!ok) showNotice(distance.error || t('map.core.workspace.recalcFailed'))
}

function openTurnPointCreate(payload: { anchorRouteSeq: number; lon: number; lat: number }) {
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
  turnPointEditor.value = {
    visible: true,
    mode: 'edit',
    canDelete: map.canDeleteTurnPoint(payload.routeSeq),
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

function applyEditedGeometry(geometry: ReturnType<typeof map.updateTurnPoint>) {
  if (!geometry || !distance.applyRouteGeometry(geometry)) {
    showNotice(distance.error || t('map.core.workspace.turnUpdateFailed'))
  }
}

function applyTurnPointEdit(payload: { longitude: number; latitude: number }) {
  const editor = turnPointEditor.value
  const geometry = editor.mode === 'create'
    ? editor.anchorRouteSeq === null ? null : map.addTurnPoint(editor.anchorRouteSeq, payload.longitude, payload.latitude)
    : editor.routeSeq === null ? null : map.updateTurnPoint(editor.routeSeq, payload.longitude, payload.latitude)
  applyEditedGeometry(geometry)
  closeTurnPointEditor()
}

function deleteTurnPoint() {
  applyEditedGeometry(turnPointEditor.value.routeSeq === null ? null : map.deleteTurnPoint(turnPointEditor.value.routeSeq))
  closeTurnPointEditor()
}

function commitTurnPointDrag(payload: { routeSeq: number; lon: number; lat: number }) {
  applyEditedGeometry(map.updateTurnPoint(payload.routeSeq, payload.lon, payload.lat))
}

async function confirmClearRoute() {
  const alert = await alertController.create({
    header: t('map.core.workspace.clearTitle'),
    message: t('map.core.workspace.clearMessage'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('common.clear'), role: 'destructive', handler: () => { distance.clearAll(); routePointConfig.value = []; clearEditModes() } },
    ],
  })
  await alert.present()
}

defineExpose({ invalidateSize })
</script>

<style scoped>
.map-workspace { position: relative; width: 100%; height: 100%; }.map-error, .map-notice { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 900; margin: 0; padding: 8px 10px; border-radius: 6px; color: #fff; font-size: 13px; }.map-error { background: rgba(180, 35, 24, .94); }.map-notice { background: rgba(23, 52, 71, .9); }
</style>
