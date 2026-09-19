import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createDailyFuelTemplate,
  createVoyageBudget,
  deleteDailyFuelTemplate,
  deleteVoyageBudget,
  getDailyFuelTemplates,
  getShipInfoMiniList,
  getVoyageBudget,
  getVoyageBudgetPage,
  updateDailyFuelTemplate,
  updateVoyageBudget,
  type DailyFuelTemplateSavePayload,
  type ShipInfoMini,
  type VoyageBudgetDetail,
  type VoyageBudgetSavePayload,
} from '@/api/esti-deploy'
import { getDistanceRoute, getSuggestPortList } from '@/api/distance'
import { DEFAULT_SPEED } from '@/config/runtime'
import { t } from '@/i18n'
import type {
  BudgetCargo,
  BudgetCosts,
  BudgetFuelInput,
  BudgetFuelLegDetail,
  BudgetFuelPrices,
  BudgetMargins,
  BudgetPort,
  BudgetPortTask,
  BudgetResults,
  BudgetSpeedProfile,
  DailyFuelTemplate,
  MainFuelType,
  PortInfo,
  VoyageBudgetContent,
  VoyageBudgetDocument,
  VoyageBudgetListItem,
  VoyageBudgetLocalDraft,
  VoyageBudgetLocalDraftMeta,
  WeatherMarginMode,
} from '@/types'
import { DEFAULT_EXCLUDED_ROUTE_POINT_IDS, buildLocalRouteGeometry, type LocalRouteGeometry } from '@/utils/route'
import { appStorage } from '@/utils/storage'
import type { Port as MapPort } from '@/types/protocol'

export interface DistancePortRow {
  port: PortInfo
  distance: number
  ecaDistance: number
}

interface DistanceRouteSnapshot {
  rawRoutePoints?: Record<string, unknown>[]
}

const PAGE_SIZE = 20
const MAX_LOCAL_DRAFTS = 5
const MAX_LOCAL_DRAFT_BYTES = 1_000_000
const LAST_FUEL_PRICES_KEY = 'PORTDIST_M_APP_LAST_FUEL_PRICES'
const LOCAL_DRAFT_INDEX_PREFIX = 'PORTDIST_M_APP_VOYAGE_BUDGET_DRAFTS_'
const LOCAL_DRAFT_ITEM_PREFIX = 'PORTDIST_M_APP_VOYAGE_BUDGET_DRAFT_'

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round2(value: unknown) {
  return Math.round(numberValue(value) * 100) / 100
}

function identifier(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function isoNow() {
  return new Date().toISOString()
}

function addDays(dateValue: string, days: number) {
  const date = new Date(dateValue || isoNow())
  date.setTime(date.getTime() + numberValue(days) * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

function taskIsLaden(taskType: BudgetPortTask) {
  return taskType === 'load'
}

function nextPortTaskType(ports: BudgetPort[]): BudgetPortTask {
  return ports[ports.length - 1]?.taskType === 'load' ? 'discharge' : 'load'
}

function createEmptyCargo(loadPortId = '', dischargePortId = ''): BudgetCargo {
  return {
    id: identifier('cargo'),
    name: '',
    loadPortId,
    dischargePortId,
    quantity: 0,
    freight: 0,
    income: 0,
    addCommRate: 0,
    brokerageRate: 0,
    frtTaxRate: 0,
    demurrage: 0,
    dispatch: 0,
  }
}

function createEmptyPort(port: Partial<PortInfo>, taskType: BudgetPortTask = 'load'): BudgetPort {
  const now = isoNow()
  return {
    id: identifier('port'),
    port: {
      portId: String(port.portId || ''),
      portName: String(port.portName || port.fullName || ''),
      fullName: String(port.fullName || port.portName || ''),
      countryCode: String(port.countryCode || ''),
      longitude: String(port.longitude || ''),
      latitude: String(port.latitude || ''),
      isCoordinate: Boolean(port.isCoordinate),
      isWayPoint: Boolean(port.isWayPoint),
    },
    taskType,
    isLaden: taskIsLaden(taskType),
    speedMode: 'full',
    distanceNm: 0,
    ecaDistanceNm: 0,
    speed: DEFAULT_SPEED,
    seaDays: 0,
    ecaSeaDays: 0,
    idleDays: 0,
    workDays: 0,
    portCharge: 0,
    weatherMarginMode: 'none',
    weatherMarginValue: 0,
    weatherMarginDays: 0,
    eta: now,
    etd: now,
  }
}

function emptySpeeds(): BudgetSpeedProfile {
  return {
    ballastFullSpeed: DEFAULT_SPEED,
    ballastEcoSpeed: DEFAULT_SPEED,
    ladenFullSpeed: DEFAULT_SPEED,
    ladenEcoSpeed: DEFAULT_SPEED,
  }
}

function emptyFuel(): BudgetFuelInput {
  return {
    ladenFuelType: 'LSFO',
    ballastFuelType: 'LSFO',
    seaLadenFuel: 0,
    seaBallastFuel: 0,
    seaAuxFuel: 0,
    portIdleFuel: 0,
    portWorkingFuel: 0,
  }
}

function emptyPrices(): BudgetFuelPrices {
  try {
    const cached = JSON.parse(appStorage.getSync(LAST_FUEL_PRICES_KEY) || '{}') as Partial<BudgetFuelPrices>
    return {
      lsfoPrice: numberValue(cached.lsfoPrice),
      hsfoPrice: numberValue(cached.hsfoPrice),
      mgoPrice: numberValue(cached.mgoPrice),
    }
  } catch {
    return { lsfoPrice: 0, hsfoPrice: 0, mgoPrice: 0 }
  }
}

function emptyCosts(): BudgetCosts {
  return {
    hirePerDay: 0,
    hireCommPercent: 0,
    fixedCost: 0,
    ilohc: 0,
    cev: 0,
    opOther: 0,
    inspection: 0,
  }
}

function emptyMargins(): BudgetMargins {
  return {
    portIdleMode: 'days',
    portIdleValue: 0,
    portWorkingMode: 'days',
    portWorkingValue: 0,
    portIdleDays: 0,
    portWorkingDays: 0,
  }
}

function emptyResults(): BudgetResults {
  return {
    totalDistanceNm: 0,
    totalEcaDistanceNm: 0,
    totalSeaDays: 0,
    totalEcaSeaDays: 0,
    totalIdleDays: 0,
    totalWorkDays: 0,
    totalVoyageDays: 0,
    totalPortCharge: 0,
    seaMainFuel: 0,
    ecaMainFuel: 0,
    seaAuxFuel: 0,
    portIdleFuel: 0,
    portWorkingFuel: 0,
    portFuel: 0,
    totalFuel: 0,
    nonEcaFuelCost: 0,
    ecaFuelCost: 0,
    seaAuxFuelCost: 0,
    portFuelCost: 0,
    totalFuelCost: 0,
    totalIncome: 0,
    netIncome: 0,
    operatingCost: 0,
    totalExpense: 0,
    operatingProfit: 0,
    netProfit: 0,
    hirePerDayLevel: 0,
    dailyProfit: 0,
  }
}

export function createEmptyVoyageBudgetDocument(): VoyageBudgetDocument {
  return {
    schemaVersion: 3,
    startAt: isoNow(),
    routeCalculated: false,
    ports: [],
    cargos: [],
    speeds: emptySpeeds(),
    fuel: emptyFuel(),
    prices: emptyPrices(),
    costs: emptyCosts(),
    margins: emptyMargins(),
    results: emptyResults(),
  }
}

function weatherMarginMode(value: unknown, legacyDays: unknown): WeatherMarginMode {
  if (value === 'percent' || value === 'days' || value === 'none') return value
  return numberValue(legacyDays) > 0 ? 'days' : 'none'
}

function normalizePort(value: unknown, startAt: string): BudgetPort {
  const input = (value || {}) as Partial<BudgetPort>
  const port = (input.port || {}) as Partial<PortInfo>
  const taskType = port.isWayPoint || input.taskType === 'routing'
    ? 'routing'
    : isBudgetPortTask(input.taskType) ? input.taskType : 'load'
  const base = createEmptyPort(port, taskType)
  return {
    ...base,
    ...input,
    id: String(input.id || base.id),
    port: { ...base.port, ...port, isWayPoint: Boolean(port.isWayPoint || taskType === 'routing') },
    taskType,
    isLaden: typeof input.isLaden === 'boolean' ? input.isLaden : taskIsLaden(taskType),
    speedMode: input.speedMode === 'eco' ? 'eco' : 'full',
    distanceNm: numberValue(input.distanceNm),
    ecaDistanceNm: numberValue(input.ecaDistanceNm),
    speed: numberValue(input.speed) || DEFAULT_SPEED,
    seaDays: numberValue(input.seaDays),
    ecaSeaDays: numberValue(input.ecaSeaDays),
    idleDays: numberValue(input.idleDays),
    workDays: numberValue(input.workDays),
    portCharge: numberValue(input.portCharge),
    weatherMarginMode: weatherMarginMode(input.weatherMarginMode, input.weatherMarginDays),
    weatherMarginValue: numberValue(input.weatherMarginValue ?? input.weatherMarginDays),
    weatherMarginDays: numberValue(input.weatherMarginDays),
    eta: String(input.eta || startAt),
    etd: String(input.etd || startAt),
  }
}

function normalizeCargo(value: unknown): BudgetCargo {
  const input = (value || {}) as Partial<BudgetCargo>
  const quantity = numberValue(input.quantity)
  const freight = numberValue(input.freight)
  return {
    ...createEmptyCargo(),
    ...input,
    id: String(input.id || identifier('cargo')),
    name: String(input.name || ''),
    loadPortId: String(input.loadPortId || ''),
    dischargePortId: String(input.dischargePortId || ''),
    quantity,
    freight,
    income: round2(quantity * freight),
    addCommRate: numberValue(input.addCommRate),
    brokerageRate: numberValue(input.brokerageRate),
    frtTaxRate: numberValue(input.frtTaxRate),
    demurrage: numberValue(input.demurrage),
    dispatch: numberValue(input.dispatch),
  }
}

function isBudgetPortTask(value: unknown): value is BudgetPortTask {
  return ['ballast', 'load', 'discharge', 'bunker', 'canal', 'pass', 'routing', 'snug', 'repair', 'transit'].includes(String(value))
}

function normalizeDocument(value: unknown): VoyageBudgetDocument {
  const input = (value || {}) as Partial<VoyageBudgetContent>
  const startAt = String(input.portSequence?.startAt || isoNow())
  const base = createEmptyVoyageBudgetDocument()
  const document: VoyageBudgetDocument = {
    ...base,
    startAt,
    routeCalculated: Boolean(input.portSequence?.routeCalculated),
    mapRoute: input.portSequence?.mapRoute,
    speeds: { ...base.speeds, ...(input.dailyFuelSpeed?.speeds || {}) },
    fuel: { ...base.fuel, ...(input.dailyFuelSpeed?.fuel || {}) },
    prices: { ...base.prices, ...(input.fuelPrices?.prices || {}) },
    costs: { ...base.costs, ...(input.costs?.costs || {}) },
    margins: { ...base.margins, ...(input.portSequence?.margins || {}) },
    ports: Array.isArray(input.portSequence?.ports) ? input.portSequence.ports.map((port) => normalizePort(port, startAt)) : [],
    cargos: Array.isArray(input.cargos?.cargos) ? input.cargos.cargos.map(normalizeCargo) : [],
  }
  document.fuelTemplateId = input.dailyFuelSpeed?.templateId
  recalculateBudget(document)
  return document
}

function speedForPort(port: BudgetPort, speeds: BudgetSpeedProfile) {
  if (port.isLaden) return port.speedMode === 'eco' ? numberValue(speeds.ladenEcoSpeed) : numberValue(speeds.ladenFullSpeed)
  return port.speedMode === 'eco' ? numberValue(speeds.ballastEcoSpeed) : numberValue(speeds.ballastFullSpeed)
}

function priceForFuel(type: MainFuelType, prices: BudgetFuelPrices) {
  return type === 'HSFO' ? numberValue(prices.hsfoPrice) : numberValue(prices.lsfoPrice)
}

function marginDays(mode: 'days' | 'percent', value: number, baseDays: number) {
  return mode === 'percent' ? baseDays * numberValue(value) / 100 : numberValue(value)
}

function recalculateWeatherMargins(document: VoyageBudgetDocument) {
  document.ports.forEach((port, index) => {
    if (index === 0 || !document.routeCalculated || port.weatherMarginMode === 'none') {
      port.weatherMarginDays = 0
      return
    }
    port.weatherMarginDays = round2(port.weatherMarginMode === 'percent'
      ? numberValue(port.seaDays) * numberValue(port.weatherMarginValue) / 100
      : numberValue(port.weatherMarginValue))
  })
}

function recalculateSchedule(document: VoyageBudgetDocument) {
  const baseIdleDays = document.ports.reduce((sum, port) => sum + numberValue(port.idleDays), 0)
  const baseWorkDays = document.ports.reduce((sum, port) => sum + numberValue(port.workDays), 0)
  const idleMargin = marginDays(document.margins.portIdleMode, document.margins.portIdleValue, baseIdleDays)
  const workMargin = marginDays(document.margins.portWorkingMode, document.margins.portWorkingValue, baseWorkDays)
  document.margins.portIdleDays = round2(idleMargin)
  document.margins.portWorkingDays = round2(workMargin)
  let cursor = document.startAt || isoNow()
  document.ports.forEach((port, index) => {
    if (index > 0) cursor = addDays(cursor, numberValue(port.seaDays) + numberValue(port.weatherMarginDays))
    port.eta = cursor
    cursor = addDays(cursor, numberValue(port.idleDays) + numberValue(port.workDays))
    port.etd = cursor
  })
}

export function recalculateBudget(document: VoyageBudgetDocument) {
  recalculateWeatherMargins(document)
  recalculateSchedule(document)
  const { fuel, prices, costs, margins, ports } = document
  const baseIdleDays = ports.reduce((sum, port) => sum + numberValue(port.idleDays), 0)
  const baseWorkDays = ports.reduce((sum, port) => sum + numberValue(port.workDays), 0)
  let seaMainFuel = 0
  let ecaMainFuel = 0
  let seaAuxFuel = 0
  let portIdleFuel = 0
  let portWorkingFuel = 0
  let portFuelCost = 0
  let nonEcaFuelCost = 0
  let ecaFuelCost = 0
  let seaAuxFuelCost = 0

  ports.forEach((port, index) => {
    const idleFuel = numberValue(port.idleDays) * numberValue(fuel.portIdleFuel)
    const workFuel = numberValue(port.workDays) * numberValue(fuel.portWorkingFuel)
    portIdleFuel += idleFuel
    portWorkingFuel += workFuel
    portFuelCost += (idleFuel + workFuel) * numberValue(prices.mgoPrice)
    if (index === 0 || !document.routeCalculated) return

    const departure = ports[index - 1]
    const mainRate = departure.isLaden ? numberValue(fuel.seaLadenFuel) : numberValue(fuel.seaBallastFuel)
    const ecaDays = Math.min(numberValue(port.seaDays), numberValue(port.ecaSeaDays))
    const weatherDays = numberValue(port.weatherMarginDays)
    const nonEcaDays = Math.max(0, numberValue(port.seaDays) - ecaDays) + weatherDays
    const nonEcaFuel = nonEcaDays * mainRate
    const ecaFuel = ecaDays * mainRate
    const mainPrice = priceForFuel(departure.isLaden ? fuel.ladenFuelType : fuel.ballastFuelType, prices)
    seaMainFuel += nonEcaFuel
    ecaMainFuel += ecaFuel
    seaAuxFuel += (numberValue(port.seaDays) + weatherDays) * numberValue(fuel.seaAuxFuel)
    nonEcaFuelCost += nonEcaFuel * mainPrice
    ecaFuelCost += ecaFuel * numberValue(prices.mgoPrice)
    seaAuxFuelCost += (numberValue(port.seaDays) + weatherDays) * numberValue(fuel.seaAuxFuel) * numberValue(prices.mgoPrice)
  })

  const idleMarginFuel = numberValue(margins.portIdleDays) * numberValue(fuel.portIdleFuel)
  const workMarginFuel = numberValue(margins.portWorkingDays) * numberValue(fuel.portWorkingFuel)
  portIdleFuel += idleMarginFuel
  portWorkingFuel += workMarginFuel
  portFuelCost += (idleMarginFuel + workMarginFuel) * numberValue(prices.mgoPrice)

  let totalIncome = 0
  let netIncome = 0
  document.cargos.forEach((cargo) => {
    const income = numberValue(cargo.quantity) * numberValue(cargo.freight)
    cargo.income = round2(income)
    totalIncome += income
    netIncome += income
      - income * numberValue(cargo.addCommRate) / 100
      - income * numberValue(cargo.brokerageRate) / 100
      - income * numberValue(cargo.frtTaxRate) / 100
      + numberValue(cargo.demurrage)
      - numberValue(cargo.dispatch)
  })

  const totalDistanceNm = ports.reduce((sum, port) => sum + numberValue(port.distanceNm), 0)
  const totalEcaDistanceNm = ports.reduce((sum, port) => sum + numberValue(port.ecaDistanceNm), 0)
  const totalWeatherDays = document.routeCalculated ? ports.slice(1).reduce((sum, port) => sum + numberValue(port.weatherMarginDays), 0) : 0
  const totalSeaDays = document.routeCalculated ? ports.reduce((sum, port) => sum + numberValue(port.seaDays), 0) + totalWeatherDays : 0
  const totalEcaSeaDays = document.routeCalculated ? ports.reduce((sum, port) => sum + numberValue(port.ecaSeaDays), 0) : 0
  const totalIdleDays = baseIdleDays + numberValue(margins.portIdleDays)
  const totalWorkDays = baseWorkDays + numberValue(margins.portWorkingDays)
  const totalVoyageDays = totalSeaDays + totalIdleDays + totalWorkDays
  const totalPortCharge = ports.reduce((sum, port) => sum + numberValue(port.portCharge), 0)
  const portFuel = portIdleFuel + portWorkingFuel
  const totalFuelCost = nonEcaFuelCost + ecaFuelCost + seaAuxFuelCost + portFuelCost
  const operatingCost = totalFuelCost + totalPortCharge + numberValue(costs.ilohc) + numberValue(costs.cev) + numberValue(costs.opOther) + numberValue(costs.inspection)
  const hire = numberValue(costs.hirePerDay) * totalVoyageDays
  const hireCost = hire - hire * numberValue(costs.hireCommPercent) / 100
  const totalExpense = hireCost + numberValue(costs.fixedCost) + totalFuelCost + totalPortCharge + numberValue(costs.ilohc) + numberValue(costs.cev) + numberValue(costs.opOther) - numberValue(costs.inspection)
  const operatingProfit = netIncome - operatingCost
  const netProfit = netIncome - totalExpense

  document.results = {
    totalDistanceNm: round2(totalDistanceNm),
    totalEcaDistanceNm: round2(totalEcaDistanceNm),
    totalSeaDays: round2(totalSeaDays),
    totalEcaSeaDays: round2(totalEcaSeaDays),
    totalIdleDays: round2(totalIdleDays),
    totalWorkDays: round2(totalWorkDays),
    totalVoyageDays: round2(totalVoyageDays),
    totalPortCharge: round2(totalPortCharge),
    seaMainFuel: round2(seaMainFuel),
    ecaMainFuel: round2(ecaMainFuel),
    seaAuxFuel: round2(seaAuxFuel),
    portIdleFuel: round2(portIdleFuel),
    portWorkingFuel: round2(portWorkingFuel),
    portFuel: round2(portFuel),
    totalFuel: round2(seaMainFuel + ecaMainFuel + seaAuxFuel + portFuel),
    nonEcaFuelCost: round2(nonEcaFuelCost),
    ecaFuelCost: round2(ecaFuelCost),
    seaAuxFuelCost: round2(seaAuxFuelCost),
    portFuelCost: round2(portFuelCost),
    totalFuelCost: round2(totalFuelCost),
    totalIncome: round2(totalIncome),
    netIncome: round2(netIncome),
    operatingCost: round2(operatingCost),
    totalExpense: round2(totalExpense),
    operatingProfit: round2(operatingProfit),
    netProfit: round2(netProfit),
    hirePerDayLevel: totalVoyageDays > 0 ? round2(operatingProfit / totalVoyageDays) : 0,
    dailyProfit: totalVoyageDays > 0 ? round2(netProfit / totalVoyageDays) : 0,
  }
}

function contentPayload(document: VoyageBudgetDocument): VoyageBudgetContent {
  return {
    schemaVersion: 3,
    dailyFuelSpeed: {
      fuel: document.fuel,
      speeds: document.speeds,
      ...(document.fuelTemplateId ? { templateId: document.fuelTemplateId } : {}),
    },
    portSequence: {
      startAt: document.startAt,
      routeCalculated: document.routeCalculated,
      ports: document.ports,
      margins: document.margins,
      ...(document.mapRoute ? { mapRoute: document.mapRoute } : {}),
    },
    cargos: { cargos: document.cargos },
    fuelPrices: { prices: document.prices },
    costs: { costs: document.costs },
  }
}

function bytes(value: string) {
  return new TextEncoder().encode(value).length
}

export const useEstiDeployStore = defineStore('esti-deploy', () => {
  const list = ref<VoyageBudgetListItem[]>([])
  const pageNo = ref(1)
  const hasMore = ref(true)
  const listLoading = ref(false)
  const listLoadedAt = ref(0)
  const saving = ref(false)
  const calculatingRoute = ref(false)
  const searchingPorts = ref(false)
  const portSuggestions = ref<PortInfo[]>([])
  const fuelTemplates = ref<DailyFuelTemplate[]>([])
  const vessels = ref<ShipInfoMini[]>([])
  const currentId = ref<number | null>(null)
  const name = ref('')
  const shipId = ref('')
  const shipName = ref('')
  const deployDesc = ref('')
  const lastUpdatedAt = ref('')
  const document = ref<VoyageBudgetDocument>(createEmptyVoyageBudgetDocument())
  const localDrafts = ref<VoyageBudgetLocalDraftMeta[]>([])
  const currentLocalDraftId = ref<string | null>(null)
  const userScopeId = ref('anonymous')
  let searchRequestVersion = 0

  const editorMode = computed<'create' | 'edit'>(() => currentId.value ? 'edit' : 'create')
  const canCalculateRoute = computed(() => document.value.ports.length >= 2 && !calculatingRoute.value)
  const hasCalculatedRoute = computed(() => document.value.routeCalculated)
  const routeSummary = computed(() => document.value.ports.map((port) => port.port.portName || port.port.portId).filter(Boolean).join(' -> '))
  const hasUnsavedEditorState = computed(() => Boolean(name.value.trim() || document.value.ports.length || document.value.cargos.length))
  const fuelLegDetails = computed<BudgetFuelLegDetail[]>(() => {
    if (!document.value.routeCalculated) return []
    const { ports, fuel, prices } = document.value
    return ports.slice(1).map((arrival, index) => {
      const departure = ports[index]
      const ecaDays = Math.min(numberValue(arrival.seaDays), numberValue(arrival.ecaSeaDays))
      const weatherDays = numberValue(arrival.weatherMarginDays)
      const nonEcaDays = Math.max(0, numberValue(arrival.seaDays) - ecaDays) + weatherDays
      const mainRate = departure.isLaden ? numberValue(fuel.seaLadenFuel) : numberValue(fuel.seaBallastFuel)
      const nonEcaMainFuel = round2(nonEcaDays * mainRate)
      const ecaMainFuel = round2(ecaDays * mainRate)
      const auxiliaryFuel = round2((numberValue(arrival.seaDays) + weatherDays) * numberValue(fuel.seaAuxFuel))
      const portFuel = round2(numberValue(arrival.idleDays) * numberValue(fuel.portIdleFuel) + numberValue(arrival.workDays) * numberValue(fuel.portWorkingFuel))
      const mainPrice = priceForFuel(departure.isLaden ? fuel.ladenFuelType : fuel.ballastFuelType, prices)
      return {
        arrivalPortId: arrival.id,
        portName: arrival.port.portName || t('budget.editor.errors.generatedPortName', { index: index + 2 }),
        sailingDays: round2(arrival.seaDays),
        weatherMarginDays: round2(weatherDays),
        nonEcaMainFuel,
        ecaMainFuel,
        auxiliaryFuel,
        portFuel,
        nonEcaMainFuelCost: round2(nonEcaMainFuel * mainPrice),
        ecaMainFuelCost: round2(ecaMainFuel * numberValue(prices.mgoPrice)),
        mainFuelCost: round2(nonEcaMainFuel * mainPrice + ecaMainFuel * numberValue(prices.mgoPrice)),
        auxiliaryFuelCost: round2(auxiliaryFuel * numberValue(prices.mgoPrice)),
      }
    })
  })

  function draftIndexKey() {
    return `${LOCAL_DRAFT_INDEX_PREFIX}${userScopeId.value}`
  }

  function draftKey(id: string) {
    return `${LOCAL_DRAFT_ITEM_PREFIX}${userScopeId.value}_${id}`
  }

  async function setUserScope(userId?: string | number) {
    const next = String(userId || 'anonymous')
    if (next === userScopeId.value) return
    list.value = []
    pageNo.value = 1
    hasMore.value = true
    listLoading.value = false
    listLoadedAt.value = 0
    saving.value = false
    calculatingRoute.value = false
    searchingPorts.value = false
    portSuggestions.value = []
    fuelTemplates.value = []
    vessels.value = []
    localDrafts.value = []
    resetDraft()
    userScopeId.value = next
    await loadLocalDrafts()
  }

  function resetDraft() {
    currentId.value = null
    name.value = ''
    shipId.value = ''
    shipName.value = ''
    deployDesc.value = ''
    lastUpdatedAt.value = ''
    document.value = createEmptyVoyageBudgetDocument()
    portSuggestions.value = []
    currentLocalDraftId.value = null
  }

  function recalculate() {
    recalculateBudget(document.value)
  }

  function recalculateRouteDays() {
    document.value.ports.forEach((port, index) => {
      port.speed = round2(speedForPort(port, document.value.speeds)) || DEFAULT_SPEED
      if (index === 0) {
        port.seaDays = 0
        port.ecaSeaDays = 0
        return
      }
      const departureSpeed = numberValue(document.value.ports[index - 1]?.speed) || DEFAULT_SPEED
      port.seaDays = round2(numberValue(port.distanceNm) / departureSpeed / 24)
      port.ecaSeaDays = round2(numberValue(port.ecaDistanceNm) / departureSpeed / 24)
    })
  }

  function resetRoute() {
    document.value.routeCalculated = false
    document.value.mapRoute = undefined
    document.value.ports.forEach((port) => {
      port.distanceNm = 0
      port.ecaDistanceNm = 0
      port.seaDays = 0
      port.ecaSeaDays = 0
      port.weatherMarginDays = 0
    })
    recalculate()
  }

  function initializeFromDistance(rows: ReadonlyArray<DistancePortRow>, speed: number, snapshot?: DistanceRouteSnapshot) {
    resetDraft()
    const documentFromDistance = createEmptyVoyageBudgetDocument()
    const routeSpeed = numberValue(speed) || DEFAULT_SPEED
    documentFromDistance.speeds = {
      ballastFullSpeed: routeSpeed,
      ballastEcoSpeed: routeSpeed,
      ladenFullSpeed: routeSpeed,
      ladenEcoSpeed: routeSpeed,
    }
    documentFromDistance.ports = rows.map((row, index) => {
      const taskType: BudgetPortTask = row.port.isWayPoint ? 'routing' : index === 0 ? 'load' : index === rows.length - 1 ? 'discharge' : 'transit'
      const port = createEmptyPort(row.port, taskType)
      port.distanceNm = round2(row.distance)
      port.ecaDistanceNm = round2(row.ecaDistance)
      return port
    })
    documentFromDistance.routeCalculated = documentFromDistance.ports.length >= 2
    if (snapshot?.rawRoutePoints?.length) {
      documentFromDistance.mapRoute = {
        rawRoutePoints: snapshot.rawRoutePoints,
        processedDistanceResult: {
          ports: documentFromDistance.ports.map((port, index) => ({
            portId: port.id,
            portCode: port.port.portId,
            distance: numberValue(rows[index]?.distance),
            ecaDistance: numberValue(rows[index]?.ecaDistance),
          })),
          totals: {
            distance: rows.reduce((sum, row) => sum + numberValue(row.distance), 0),
            ecaDistance: rows.reduce((sum, row) => sum + numberValue(row.ecaDistance), 0),
          },
        },
      }
    }
    document.value = documentFromDistance
    recalculateRouteDays()
    recalculate()
  }

  function addPort(port: PortInfo, taskType?: BudgetPortTask) {
    document.value.ports.push(createEmptyPort(port, taskType || nextPortTaskType(document.value.ports)))
    resetRoute()
  }

  function updatePort(index: number, patch: Partial<BudgetPort>) {
    const target = document.value.ports[index]
    if (!target) return
    const geometryChanged = Object.prototype.hasOwnProperty.call(patch, 'port')
    Object.assign(target, patch)
    if (patch.taskType && patch.isLaden === undefined) target.isLaden = taskIsLaden(patch.taskType)
    if (geometryChanged) document.value.mapRoute = undefined
    if ((Object.prototype.hasOwnProperty.call(patch, 'speedMode') || Object.prototype.hasOwnProperty.call(patch, 'isLaden')) && document.value.routeCalculated) recalculateRouteDays()
    recalculate()
  }

  function movePort(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= document.value.ports.length) return
    const [port] = document.value.ports.splice(index, 1)
    document.value.ports.splice(target, 0, port)
    resetRoute()
  }

  function removePort(index: number) {
    if (index < 0 || index >= document.value.ports.length) return
    const [removed] = document.value.ports.splice(index, 1)
    if (removed) document.value.cargos = document.value.cargos.filter((cargo) => cargo.loadPortId !== removed.id && cargo.dischargePortId !== removed.id)
    resetRoute()
  }

  function addCargo() {
    if (document.value.ports.length < 2) return false
    document.value.cargos.push(createEmptyCargo(document.value.ports[0].id, document.value.ports[1].id))
    recalculate()
    return true
  }

  function updateCargo(index: number, patch: Partial<BudgetCargo>) {
    const cargo = document.value.cargos[index]
    if (!cargo) return
    Object.assign(cargo, patch)
    cargo.income = round2(numberValue(cargo.quantity) * numberValue(cargo.freight))
    recalculate()
  }

  function removeCargo(index: number) {
    if (index < 0 || index >= document.value.cargos.length) return
    document.value.cargos.splice(index, 1)
    recalculate()
  }

  function updateFuel(patch: Partial<BudgetFuelInput>) {
    Object.assign(document.value.fuel, patch)
    recalculate()
  }

  function updateSpeeds(patch: Partial<BudgetSpeedProfile>) {
    Object.assign(document.value.speeds, patch)
    recalculateRouteDays()
    recalculate()
  }

  function updatePrices(patch: Partial<BudgetFuelPrices>) {
    Object.assign(document.value.prices, patch)
    appStorage.setValue(LAST_FUEL_PRICES_KEY, JSON.stringify(document.value.prices))
    recalculate()
  }

  function updateCosts(patch: Partial<BudgetCosts>) {
    Object.assign(document.value.costs, patch)
    recalculate()
  }

  function updateMargins(patch: Partial<BudgetMargins>) {
    Object.assign(document.value.margins, patch)
    recalculate()
  }

  function updateStartAt(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return
    document.value.startAt = date.toISOString()
    recalculate()
  }

  function portFromMap(mapPort: MapPort, existingPorts: Map<string, BudgetPort>) {
    const mapPortId = String(mapPort.portId || '')
    const existing = existingPorts.get(mapPortId)
    if (existing) {
      const normalized = normalizePort(existing, document.value.startAt)
      normalized.port = {
        ...normalized.port,
        portId: String(mapPort.portCode || normalized.port.portId || mapPort.portId || ''),
        portName: String(mapPort.portName || normalized.port.portName || ''),
        fullName: String(mapPort.portName || normalized.port.fullName || ''),
        longitude: String(mapPort.lon),
        latitude: String(mapPort.lat),
        isCoordinate: Boolean(mapPort.isCoordinate),
        isWayPoint: Boolean(mapPort.isWayPoint),
      }
      if (mapPort.isWayPoint) {
        normalized.taskType = 'routing'
        normalized.isLaden = false
      }
      return normalized
    }

    const created = createEmptyPort({
      portId: String(mapPort.portCode || mapPort.portId || ''),
      portName: String(mapPort.portName || mapPort.portCode || mapPort.portId || ''),
      fullName: String(mapPort.portName || mapPort.portCode || mapPort.portId || ''),
      countryCode: mapPort.isCoordinate ? 'COORD' : '',
      longitude: String(mapPort.lon),
      latitude: String(mapPort.lat),
      isCoordinate: Boolean(mapPort.isCoordinate),
      isWayPoint: Boolean(mapPort.isWayPoint),
    }, mapPort.isWayPoint ? 'routing' : 'transit')
    return created
  }

  async function applyMapPortSequence(mapPorts: MapPort[], excludedRoutePointIds: readonly number[] = []) {
    if (mapPorts.length < 2) throw new Error(t('budget.editor.errors.routePointMin'))
    const existingPorts = new Map(document.value.ports.map((port) => [port.id, port]))
    const nextPorts = mapPorts.map((mapPort) => portFromMap(mapPort, existingPorts))
    if (new Set(nextPorts.map((port) => port.id)).size !== nextPorts.length) {
      throw new Error(t('budget.editor.errors.routeDuplicate'))
    }
    document.value.ports = nextPorts
    document.value.cargos = document.value.cargos.filter((cargo) => (
      nextPorts.some((port) => port.id === cargo.loadPortId)
      && nextPorts.some((port) => port.id === cargo.dischargePortId)
    ))
    resetRoute()
    return calculateRoute(excludedRoutePointIds)
  }

  function applyMapGeometry(geometry: LocalRouteGeometry) {
    if (geometry.legs.length !== document.value.ports.length) {
      throw new Error(t('budget.editor.errors.routePortMismatch'))
    }
    document.value.ports.forEach((port, index) => {
      port.distanceNm = index === 0 ? 0 : round2(geometry.legs[index]?.distance)
      port.ecaDistanceNm = index === 0 ? 0 : round2(geometry.legs[index]?.ecaDistance)
    })
    document.value.mapRoute = {
      rawRoutePoints: geometry.rawRoutePoints,
      processedDistanceResult: {
        ports: document.value.ports.map((port) => ({
          portId: port.id,
          portCode: port.port.portId,
          distance: port.distanceNm,
          ecaDistance: port.ecaDistanceNm,
        })),
        totals: {
          distance: geometry.totalDistanceNm,
          ecaDistance: geometry.totalEcaDistanceNm,
        },
      },
    }
    document.value.routeCalculated = true
    recalculateRouteDays()
    recalculate()
  }

  async function searchPorts(keyword: string) {
    const requestVersion = ++searchRequestVersion
    const query = keyword.trim()
    if (!query) {
      if (requestVersion === searchRequestVersion) portSuggestions.value = []
      return
    }
    searchingPorts.value = true
    try {
      const result = await getSuggestPortList(query)
      if (requestVersion === searchRequestVersion) {
        portSuggestions.value = Array.isArray(result) ? result : []
      }
    } catch {
      if (requestVersion === searchRequestVersion) portSuggestions.value = []
    } finally {
      if (requestVersion === searchRequestVersion) searchingPorts.value = false
    }
  }

  async function calculateRoute(excludedRoutePointIds: readonly number[] = []) {
    if (!canCalculateRoute.value) return false
    calculatingRoute.value = true
    try {
      const portStr = document.value.ports.map((port) => port.port.portId).filter(Boolean).join(',')
      const excluded = Array.from(new Set([...DEFAULT_EXCLUDED_ROUTE_POINT_IDS, ...excludedRoutePointIds]))
      const response = await getDistanceRoute(portStr, excluded.join(','))
      const rawRoutePoints = Array.isArray(response?.routePoints) ? response.routePoints : []
      if (!rawRoutePoints.length) throw new Error(t('budget.editor.errors.routeNotReturned'))
      const geometry = buildLocalRouteGeometry(rawRoutePoints)
      if (geometry.legs.length !== document.value.ports.length) throw new Error(t('budget.editor.errors.voyagePathMismatch'))
      document.value.ports.forEach((port, index) => {
        port.distanceNm = index === 0 ? 0 : round2(geometry.legs[index]?.distance)
        port.ecaDistanceNm = index === 0 ? 0 : round2(geometry.legs[index]?.ecaDistance)
      })
      document.value.mapRoute = {
        rawRoutePoints,
        processedDistanceResult: {
          ports: document.value.ports.map((port) => ({
            portId: port.id,
            portCode: port.port.portId,
            distance: port.distanceNm,
            ecaDistance: port.ecaDistanceNm,
          })),
          totals: { distance: geometry.totalDistanceNm, ecaDistance: geometry.totalEcaDistanceNm },
        },
      }
      document.value.routeCalculated = true
      recalculateRouteDays()
      recalculate()
      return true
    } finally {
      calculatingRoute.value = false
    }
  }

  async function loadFuelTemplates() {
    const result = await getDailyFuelTemplates()
    fuelTemplates.value = Array.isArray(result) ? result : []
  }

  async function loadVessels() {
    const result = await getShipInfoMiniList()
    vessels.value = Array.isArray(result) ? result : []
  }

  function setFuelTemplateId(id?: string | number) {
    const value = String(id || '').trim()
    document.value.fuelTemplateId = value || undefined
  }

  function applyFuelTemplate(template: DailyFuelTemplate) {
    setFuelTemplateId(template.id)
    updateFuel({
      seaLadenFuel: numberValue(template.seaLadenFuel),
      seaBallastFuel: numberValue(template.seaBallastFuel),
      seaAuxFuel: numberValue(template.seaAuxFuel),
      portIdleFuel: numberValue(template.portIdleFuel),
      portWorkingFuel: numberValue(template.portWorkingFuel),
    })
    updateSpeeds({
      ballastFullSpeed: numberValue(template.ballastFullSpeed) || DEFAULT_SPEED,
      ballastEcoSpeed: numberValue(template.ballastEcoSpeed) || DEFAULT_SPEED,
      ladenFullSpeed: numberValue(template.ladenFullSpeed) || DEFAULT_SPEED,
      ladenEcoSpeed: numberValue(template.ladenEcoSpeed) || DEFAULT_SPEED,
    })
  }

  function fuelTemplatePayload(template: DailyFuelTemplate): DailyFuelTemplateSavePayload {
    return {
      ...(template.id ? { id: template.id } : {}),
      name: template.name.trim(),
      seaLadenFuel: numberValue(template.seaLadenFuel),
      seaBallastFuel: numberValue(template.seaBallastFuel),
      seaAuxFuel: numberValue(template.seaAuxFuel),
      portIdleFuel: numberValue(template.portIdleFuel),
      portWorkingFuel: numberValue(template.portWorkingFuel),
      ballastFullSpeed: numberValue(template.ballastFullSpeed) || DEFAULT_SPEED,
      ballastEcoSpeed: numberValue(template.ballastEcoSpeed) || DEFAULT_SPEED,
      ladenFullSpeed: numberValue(template.ladenFullSpeed) || DEFAULT_SPEED,
      ladenEcoSpeed: numberValue(template.ladenEcoSpeed) || DEFAULT_SPEED,
    }
  }

  async function saveFuelTemplate(template: DailyFuelTemplate) {
    const payload = fuelTemplatePayload(template)
    if (!payload.name) throw new Error(t('budget.editor.errors.templateNameRequired'))
    if (template.id) await updateDailyFuelTemplate(payload)
    else await createDailyFuelTemplate(payload)
    await loadFuelTemplates()
  }

  async function removeFuelTemplate(id: string | number) {
    await deleteDailyFuelTemplate(id)
    fuelTemplates.value = fuelTemplates.value.filter((template) => String(template.id) !== String(id))
    if (String(document.value.fuelTemplateId) === String(id)) document.value.fuelTemplateId = undefined
  }

  async function loadPage(refresh = false) {
    if (listLoading.value || (!refresh && !hasMore.value)) return
    if (refresh) {
      pageNo.value = 1
      hasMore.value = true
    }
    listLoading.value = true
    try {
      const result = await getVoyageBudgetPage({ pageNo: pageNo.value, pageSize: PAGE_SIZE })
      const incoming = Array.isArray(result?.list) ? result.list : []
      list.value = refresh ? incoming : [...list.value, ...incoming]
      hasMore.value = incoming.length >= PAGE_SIZE
      if (hasMore.value) pageNo.value += 1
      listLoadedAt.value = Date.now()
    } finally {
      listLoading.value = false
    }
  }

  function shouldRefreshList() {
    return !listLoadedAt.value || Date.now() - listLoadedAt.value > 60_000
  }

  function applyDetail(detail: VoyageBudgetDetail) {
    currentId.value = numberValue(detail.id) || null
    name.value = String(detail.name || '')
    shipId.value = String(detail.shipId || '')
    shipName.value = String(detail.shipName || '')
    deployDesc.value = String(detail.deployDesc || '')
    lastUpdatedAt.value = String(detail.updateTime || detail.createTime || '')
    try {
      document.value = normalizeDocument(detail.contentStr ? JSON.parse(detail.contentStr) : {})
    } catch {
      document.value = createEmptyVoyageBudgetDocument()
    }
    currentLocalDraftId.value = null
  }

  async function loadDetail(id: number) {
    const detail = await getVoyageBudget(id)
    applyDetail(detail)
  }

  function buildSavePayload(): VoyageBudgetSavePayload {
    recalculate()
    const results = document.value.results
    return {
      ...(currentId.value ? { id: currentId.value } : {}),
      name: name.value.trim(),
      shipId: shipId.value.trim() || undefined,
      deployDesc: deployDesc.value.trim() || undefined,
      content: JSON.stringify(contentPayload(document.value)),
      ttlIncome: results.totalIncome,
      ttlRevenue: results.netIncome,
      opCost: results.operatingCost,
      ttlExpense: results.totalExpense,
      opProfit: results.operatingProfit,
      netProfit: results.netProfit,
      hirePerDayLevel: results.hirePerDayLevel,
      dailyProfit: results.dailyProfit,
    }
  }

  async function save() {
    if (!name.value.trim()) throw new Error(t('budget.editor.errors.budgetNameRequired'))
    if (!document.value.routeCalculated) throw new Error(t('budget.editor.errors.routeRequired'))
    saving.value = true
    try {
      const payload = buildSavePayload()
      if (currentId.value) await updateVoyageBudget(payload)
      else currentId.value = await createVoyageBudget(payload)
      lastUpdatedAt.value = isoNow()
      listLoadedAt.value = 0
      await clearSavedLocalDraft()
      return currentId.value
    } finally {
      saving.value = false
    }
  }

  function prepareSaveAs() {
    currentId.value = null
    name.value = name.value.trim() ? t('budget.editor.errors.copyName', { name: name.value.trim() }) : ''
  }

  async function remove(id: number) {
    await deleteVoyageBudget(id)
    list.value = list.value.filter((item) => item.id !== id)
    if (currentId.value === id) resetDraft()
  }

  async function loadLocalDrafts() {
    try {
      const raw = await appStorage.get(draftIndexKey())
      const parsed = JSON.parse(raw || '[]') as unknown[]
      localDrafts.value = (Array.isArray(parsed) ? parsed : [])
        .map(normalizeDraftMeta)
        .filter((item): item is VoyageBudgetLocalDraftMeta => item !== null)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, MAX_LOCAL_DRAFTS)
    } catch {
      localDrafts.value = []
    }
    return localDrafts.value
  }

  async function writeDraftIndex(items: VoyageBudgetLocalDraftMeta[]) {
    localDrafts.value = items
    await appStorage.set(draftIndexKey(), JSON.stringify(items))
  }

  async function saveLocalDraft() {
    if (!hasUnsavedEditorState.value) return null
    const id = currentLocalDraftId.value || identifier('draft')
    const storedDocument = JSON.parse(JSON.stringify(document.value)) as VoyageBudgetDocument
    let mapRouteOmitted = false
    let draft: VoyageBudgetLocalDraft = {
      id,
      updatedAt: isoNow(),
      ...(currentId.value ? { sourceDeployId: currentId.value } : {}),
      name: name.value,
      shipId: shipId.value,
      deployDesc: deployDesc.value,
      document: storedDocument,
    }
    let serialized = JSON.stringify(draft)
    if (bytes(serialized) > MAX_LOCAL_DRAFT_BYTES && storedDocument.mapRoute) {
      delete storedDocument.mapRoute
      mapRouteOmitted = true
      draft = { ...draft, document: storedDocument, mapRouteOmitted }
      serialized = JSON.stringify(draft)
    }
    if (bytes(serialized) > MAX_LOCAL_DRAFT_BYTES) throw new Error(t('budget.editor.errors.draftTooLarge'))
    await appStorage.set(draftKey(id), serialized)
    const metadata: VoyageBudgetLocalDraftMeta = {
      id,
      updatedAt: draft.updatedAt,
      ...(currentId.value ? { sourceDeployId: currentId.value } : {}),
      name: name.value.trim(),
      routeSummary: routeSummary.value,
      ...(mapRouteOmitted ? { mapRouteOmitted } : {}),
    }
    const next = [metadata, ...localDrafts.value.filter((item) => item.id !== id)]
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, MAX_LOCAL_DRAFTS)
    await writeDraftIndex(next)
    currentLocalDraftId.value = id
    return metadata
  }

  async function loadLocalDraft(id: string) {
    const raw = await appStorage.get(draftKey(id))
    let draft: VoyageBudgetLocalDraft
    try {
      draft = JSON.parse(raw || '') as VoyageBudgetLocalDraft
    } catch {
      throw new Error(t('budget.editor.errors.draftCorrupted'))
    }
    if (!draft || draft.id !== id || draft.document?.schemaVersion !== 3) throw new Error(t('budget.editor.errors.draftInvalid'))
    currentId.value = numberValue(draft.sourceDeployId) || null
    name.value = String(draft.name || '')
    shipId.value = String(draft.shipId || '')
    deployDesc.value = String(draft.deployDesc || '')
    document.value = normalizeDocument(contentPayload(draft.document))
    currentLocalDraftId.value = id
  }

  async function clearSavedLocalDraft(id = currentLocalDraftId.value) {
    if (!id) return
    await appStorage.remove(draftKey(id))
    await writeDraftIndex(localDrafts.value.filter((item) => item.id !== id))
    if (currentLocalDraftId.value === id) currentLocalDraftId.value = null
  }

  async function deleteLocalDraft(id: string) {
    await clearSavedLocalDraft(id)
  }

  return {
    list,
    pageNo,
    hasMore,
    listLoading,
    saving,
    calculatingRoute,
    searchingPorts,
    portSuggestions,
    fuelTemplates,
    vessels,
    currentId,
    editorMode,
    name,
    shipId,
    shipName,
    deployDesc,
    lastUpdatedAt,
    document,
    localDrafts,
    currentLocalDraftId,
    canCalculateRoute,
    hasCalculatedRoute,
    routeSummary,
    hasUnsavedEditorState,
    fuelLegDetails,
    setUserScope,
    resetDraft,
    recalculate,
    initializeFromDistance,
    addPort,
    updatePort,
    movePort,
    removePort,
    addCargo,
    updateCargo,
    removeCargo,
    updateFuel,
    updateSpeeds,
    updatePrices,
    updateCosts,
    updateMargins,
    updateStartAt,
    resetRoute,
    applyMapPortSequence,
    applyMapGeometry,
    searchPorts,
    calculateRoute,
    loadFuelTemplates,
    loadVessels,
    setFuelTemplateId,
    applyFuelTemplate,
    saveFuelTemplate,
    removeFuelTemplate,
    loadPage,
    shouldRefreshList,
    loadDetail,
    save,
    prepareSaveAs,
    remove,
    loadLocalDrafts,
    saveLocalDraft,
    loadLocalDraft,
    clearSavedLocalDraft,
    deleteLocalDraft,
  }
})

function normalizeDraftMeta(value: unknown): VoyageBudgetLocalDraftMeta | null {
  const input = value && typeof value === 'object' ? value as Partial<VoyageBudgetLocalDraftMeta> : null
  const id = String(input?.id || '').trim()
  if (!id) return null
  const sourceDeployId = numberValue(input?.sourceDeployId)
  return {
    id,
    updatedAt: String(input?.updatedAt || ''),
    ...(sourceDeployId > 0 ? { sourceDeployId } : {}),
    name: String(input?.name || ''),
    routeSummary: String(input?.routeSummary || ''),
    mapRouteOmitted: Boolean(input?.mapRouteOmitted),
  }
}
