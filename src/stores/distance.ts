import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getDistanceRoute, getSuggestPortList } from '@/api/distance'
import { DEFAULT_SPEED } from '@/config/runtime'
import { t } from '@/i18n'
import { useMapStore } from '@/stores/map'
import type { PortInfo } from '@/types'
import { portDisplayName } from '@/utils/port'
import { DEFAULT_EXCLUDED_ROUTE_POINT_IDS } from '@/utils/route'
import type { LocalRouteGeometry } from '@/utils/route'
import { appStorage } from '@/utils/storage'
import type { Port } from '@/types/protocol'

interface DistanceRow {
  port: PortInfo
  distance: number
  ecaDistance: number
}

export interface RecentDistanceCalculation {
  routeLabel: string
  totalDistanceNm: number
  totalEcaDistanceNm: number
  sailingDays: number
  speed: number
  createdAt: number
}

const RECENT_PORTS_PREFIX = 'PORTDIST_M_APP_RECENT_PORTS_'
const RECENT_CALCULATIONS_PREFIX = 'PORTDIST_M_APP_RECENT_CALCULATIONS_'

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resetDistance(row: DistanceRow): DistanceRow {
  return { ...row, distance: 0, ecaDistance: 0 }
}

/**
 * 中文输入法（拼音）在字母还没上屏时会插入音节分隔符：想打 “dalian”，输入框里
 * 依次是 `da`、`da l`、`da'l`，后端按英文字母匹配就断在 `da` 上。
 * 因此只把发给接口的查询归一化：去掉全部空白（含全角空格与 NBSP）和撇号后转小写，
 * 让 `da l` / `da'l` / `DA L` 都按 `dal` 查询。输入框里显示的内容不受影响。
 */
function normalizePortQuery(keyword: string) {
  return keyword.replace(/[\s\u3000\u00a0'’`]/g, '').toLowerCase()
}

function rowFor(port: PortInfo): DistanceRow {
  return {
    port: {
      ...port,
      portId: String(port.portId || ''),
      portName: String(port.portName || port.fullName || ''),
      fullName: String(port.fullName || port.portName || ''),
      countryCode: String(port.countryCode || ''),
      longitude: String(port.longitude || ''),
      latitude: String(port.latitude || ''),
      isCoordinate: Boolean(port.isCoordinate),
      isWayPoint: Boolean(port.isWayPoint),
    },
    distance: 0,
    ecaDistance: 0,
  }
}

function routeLabel(rows: DistanceRow[]) {
  return rows
    .map((row) => portDisplayName(row.port))
    .filter(Boolean)
    .join(' -> ')
}

export const useDistanceStore = defineStore('distance', () => {
  const userScopeId = ref('anonymous')
  const speed = ref(DEFAULT_SPEED)
  const searching = ref(false)
  const calculating = ref(false)
  const portPoints = ref<DistanceRow[]>([])
  const suggestPorts = ref<PortInfo[]>([])
  const recentPorts = ref<PortInfo[]>([])
  const recentCalculations = ref<RecentDistanceCalculation[]>([])
  const totalDistanceNm = ref(0)
  const totalEcaDistanceNm = ref(0)
  const hasDistanceResult = ref(false)
  const error = ref('')
  let searchRequestVersion = 0

  const canCalculate = computed(() => portPoints.value.length >= 2 && !calculating.value)
  const sailingDays = computed(() => speed.value > 0 ? totalDistanceNm.value / speed.value / 24 : 0)

  function storageKey(prefix: string) {
    return `${prefix}${userScopeId.value}`
  }

  async function restoreRecents() {
    const [portsRaw, calculationsRaw] = await Promise.all([
      appStorage.get(storageKey(RECENT_PORTS_PREFIX)),
      appStorage.get(storageKey(RECENT_CALCULATIONS_PREFIX)),
    ])
    try {
      const parsed = JSON.parse(portsRaw || '[]')
      recentPorts.value = Array.isArray(parsed) ? parsed.filter((item) => item && !item.isCoordinate && !item.isWayPoint).slice(0, 10) : []
    } catch {
      recentPorts.value = []
    }
    try {
      const parsed = JSON.parse(calculationsRaw || '[]')
      recentCalculations.value = Array.isArray(parsed) ? parsed.slice(0, 3) : []
    } catch {
      recentCalculations.value = []
    }
  }

  function persistRecents() {
    appStorage.setValue(storageKey(RECENT_PORTS_PREFIX), JSON.stringify(recentPorts.value.slice(0, 10)))
    appStorage.setValue(storageKey(RECENT_CALCULATIONS_PREFIX), JSON.stringify(recentCalculations.value.slice(0, 3)))
  }

  async function setUserScope(userId?: string | number) {
    const nextScopeId = String(userId || 'anonymous')
    if (nextScopeId === userScopeId.value) return
    speed.value = DEFAULT_SPEED
    searching.value = false
    calculating.value = false
    portPoints.value = []
    suggestPorts.value = []
    recentPorts.value = []
    recentCalculations.value = []
    totalDistanceNm.value = 0
    totalEcaDistanceNm.value = 0
    hasDistanceResult.value = false
    error.value = ''
    useMapStore().clearRouteGeometry()
    userScopeId.value = nextScopeId
    await restoreRecents()
  }

  function clearResult() {
    portPoints.value = portPoints.value.map(resetDistance)
    totalDistanceNm.value = 0
    totalEcaDistanceNm.value = 0
    hasDistanceResult.value = false
    useMapStore().clearRouteGeometry()
  }

  function addPort(port: PortInfo) {
    portPoints.value = [...portPoints.value.map(resetDistance), rowFor(port)]
    clearResult()
    if (!port.isCoordinate && !port.isWayPoint) {
      const portId = String(port.portId)
      const alreadyRecent = recentPorts.value.some((item) => String(item.portId) === portId)
      // Keep the existing order so a chip does not jump to the front when the
      // user re-selects a port that is already in the recent list.
      if (!alreadyRecent) {
        recentPorts.value = [port, ...recentPorts.value].slice(0, 10)
      }
      persistRecents()
    }
  }

  function addCoordinatePort(latitude: number, longitude: number, name?: string) {
    const label = name?.trim() || `${longitude.toFixed(4)}, ${latitude.toFixed(4)}`
    addPort({
      portId: `${longitude}~${latitude}`,
      portName: label,
      fullName: label,
      countryCode: 'COORD',
      longitude: String(longitude),
      latitude: String(latitude),
      isCoordinate: true,
    })
  }

  function removePort(index: number) {
    if (index < 0 || index >= portPoints.value.length) return
    portPoints.value = portPoints.value.filter((_, rowIndex) => rowIndex !== index)
    clearResult()
  }

  function movePort(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= portPoints.value.length) return
    const rows = [...portPoints.value]
    const [row] = rows.splice(index, 1)
    rows.splice(targetIndex, 0, row)
    portPoints.value = rows
    clearResult()
  }

  function clearAll() {
    portPoints.value = []
    suggestPorts.value = []
    clearResult()
  }

  function clearRecentPorts() {
    recentPorts.value = []
    persistRecents()
  }

  function applyRouteGeometry(geometry: LocalRouteGeometry) {
    if (geometry.legs.length !== portPoints.value.length) {
      error.value = t('distance.errors.legMismatch')
      return false
    }

    portPoints.value = portPoints.value.map((row, index) => ({
      ...row,
      distance: index === 0 ? 0 : number(geometry.legs[index]?.distance),
      ecaDistance: index === 0 ? 0 : number(geometry.legs[index]?.ecaDistance),
    }))
    totalDistanceNm.value = number(geometry.totalDistanceNm)
    totalEcaDistanceNm.value = number(geometry.totalEcaDistanceNm)
    hasDistanceResult.value = true
    const calculation: RecentDistanceCalculation = {
      routeLabel: routeLabel(portPoints.value),
      totalDistanceNm: totalDistanceNm.value,
      totalEcaDistanceNm: totalEcaDistanceNm.value,
      sailingDays: sailingDays.value,
      speed: speed.value,
      createdAt: Date.now(),
    }
    recentCalculations.value = [calculation, ...recentCalculations.value.filter((item) => item.routeLabel !== calculation.routeLabel)].slice(0, 3)
    persistRecents()
    return true
  }

  function replacePortsFromMap(ports: Port[]) {
    portPoints.value = ports.map((port) => rowFor({
      portId: String(port.portId || port.portCode || ''),
      portName: String(port.portName || port.portId || port.portCode || ''),
      fullName: String(port.portName || port.portId || port.portCode || ''),
      countryCode: port.isCoordinate ? 'COORD' : '',
      longitude: String(port.lon),
      latitude: String(port.lat),
      isCoordinate: Boolean(port.isCoordinate),
      isWayPoint: Boolean(port.isWayPoint),
    }))
    clearResult()
  }

  async function searchPorts(keyword: string) {
    const requestVersion = ++searchRequestVersion
    // 只归一化发给接口的查询；输入框仍显示用户原始输入（含输入法分隔符）
    const query = normalizePortQuery(keyword)
    if (!query) {
      if (requestVersion === searchRequestVersion) suggestPorts.value = []
      return
    }
    searching.value = true
    try {
      const result = await getSuggestPortList(query)
      if (requestVersion === searchRequestVersion) {
        suggestPorts.value = Array.isArray(result) ? result : []
      }
    } catch {
      if (requestVersion === searchRequestVersion) suggestPorts.value = []
    } finally {
      if (requestVersion === searchRequestVersion) searching.value = false
    }
  }

  function setSpeed(value: number) {
    speed.value = number(value) > 0 ? number(value) : DEFAULT_SPEED
  }

  async function calculate(excludedRoutePointIds: readonly number[] = []) {
    if (!canCalculate.value) return false
    calculating.value = true
    error.value = ''
    try {
      const ports = portPoints.value.map((row) => row.port)
      const portStr = ports.map((port) => port.portId).filter(Boolean).join(',')
      const excluded = Array.from(new Set([...DEFAULT_EXCLUDED_ROUTE_POINT_IDS, ...excludedRoutePointIds]))
      const response = await getDistanceRoute(portStr, excluded.join(','))
      const rawRoutePoints = Array.isArray(response?.routePoints) ? response.routePoints : []
      if (!rawRoutePoints.length) throw new Error(t('distance.errors.noRoutePoints'))

      const geometry = useMapStore().setRouteGeometry(rawRoutePoints)
      return applyRouteGeometry(geometry)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : t('distance.errors.calculateFailed')
      return false
    } finally {
      calculating.value = false
    }
  }

  return {
    speed,
    searching,
    calculating,
    portPoints,
    suggestPorts,
    recentPorts,
    recentCalculations,
    totalDistanceNm,
    totalEcaDistanceNm,
    hasDistanceResult,
    error,
    canCalculate,
    sailingDays,
    setUserScope,
    restoreRecents,
    setSpeed,
    addPort,
    addCoordinatePort,
    removePort,
    movePort,
    clearAll,
    clearResult,
    clearRecentPorts,
    applyRouteGeometry,
    replacePortsFromMap,
    searchPorts,
    calculate,
  }
})
