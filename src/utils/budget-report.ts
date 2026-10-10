import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { t } from '@/i18n'
import { formatAmount, formatDateTime } from '@/i18n/format'
import type { BudgetPort, BudgetPortTask, VoyageBudgetDocument } from '@/types'

/**
 * 报告行的语义角色：决定字号、字重、左侧色条与分页间距。
 * 用角色而不是比对标题文案，翻译后才能保持标题/区块的视觉层级。
 */
type ReportLineRole = 'title' | 'section' | 'body' | 'item' | 'metrics' | 'blank'

interface ReportMetric {
  label: string
  value: string
}

interface ReportLine {
  role: ReportLineRole
  /** title / section / body 的整行文本 */
  text?: string
  /** item 行的标签与值（值独占右侧一列，与小程序报告一致） */
  label?: string
  value?: string
  emphasize?: boolean
  /** metrics 行的单元格；columns 控制每行的单元格数 */
  metrics?: ReportMetric[]
  columns?: number
  background?: string
  accent?: boolean
  /** blank 行的间距 */
  gap?: number
}

/** 拉丁字体兜底 + 中文字体，保证中英文都能正常渲染。 */
const FONT_STACK = '"Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", sans-serif'

/**
 * 小程序报告用 `|` 作为值的视觉分隔符。裸 `|` 会被 vue-i18n 当作复数分隔符，
 * 所以分隔符只在代码里拼接，消息值里只放带单位的片段。
 */
const VALUE_SEPARATOR = ' | '

/** 该燃料不是本航次主机用油时，单价单元格的占位符。 */
const PRICE_NOT_APPLICABLE = '#'

/** 区块之间的留白 */
const SECTION_GAP = 26

const TITLE = (text: string): ReportLine => ({ role: 'title', text })
const SECTION = (text: string): ReportLine => ({ role: 'section', text })
const BODY = (text: string): ReportLine => ({ role: 'body', text })
const ITEM = (label: string, value: string, emphasize = false): ReportLine => ({ role: 'item', label, value, emphasize })
const BLANK = (gap = SECTION_GAP): ReportLine => ({ role: 'blank', gap })
const METRICS = (metrics: ReportMetric[], columns: number, background?: string, accent = false): ReportLine =>
  ({ role: 'metrics', metrics, columns, background, accent })

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function amount(value: unknown) {
  return formatAmount(numberValue(value))
}

function scheduleTime(value: string | number | Date | null | undefined) {
  return formatDateTime(value, '-')
}

function taskLabel(task: BudgetPortTask) {
  const labels: Record<BudgetPortTask, string> = {
    ballast: t('report.task.ballast'),
    load: t('report.task.load'),
    discharge: t('report.task.discharge'),
    bunker: t('report.task.bunker'),
    canal: t('report.task.canal'),
    pass: t('report.task.pass'),
    routing: t('report.task.routing'),
    snug: t('report.task.snug'),
    repair: t('report.task.repair'),
    transit: t('report.task.transit'),
  }
  return labels[task]
}

function portName(port: BudgetPort) {
  return String(port.port.portName || port.port.fullName || t('report.fallback.portName'))
}

/** taskType 为 routing 或港口本身是航路点的，都按航路点渲染（与详情页保持一致）。 */
function isRoutingPort(port: BudgetPort) {
  return port.taskType === 'routing' || Boolean(port.port.isWayPoint)
}

function routeText(document: VoyageBudgetDocument) {
  return document.ports.map(portName).join(' -> ') || t('report.fallback.noPorts')
}

function cargoPortName(document: VoyageBudgetDocument, portId: string) {
  const port = document.ports.find((item) => item.id === portId)
  return port ? portName(port) : t('report.fallback.portNotSelected')
}

function cargoRoute(document: VoyageBudgetDocument, loadPortId: string, dischargePortId: string) {
  return t('report.cargo.routeValue', {
    load: cargoPortName(document, loadPortId),
    discharge: cargoPortName(document, dischargePortId),
  })
}

function cargoCharge(income: unknown, rate: unknown) {
  return numberValue(income) * numberValue(rate) / 100
}

/** 回扣 / 经纪 / 税费：`费率% · 金额`。 */
function chargeText(income: unknown, rate: unknown) {
  return t('report.cargo.chargeValue', { rate: amount(rate), amount: amount(cargoCharge(income, rate)) })
}

/** 只要满载或压载用 HSFO，主机就按 HSFO 计价（与详情页一致）。 */
function mainFuelType(document: VoyageBudgetDocument) {
  return document.fuel.ladenFuelType === 'HSFO' || document.fuel.ballastFuelType === 'HSFO' ? 'HSFO' : 'LSFO'
}

/** 整体在港余量：等泊 / 作业天数 + 由此产生的额外 LSDO/MGO。 */
function portMarginSummary(document: VoyageBudgetDocument) {
  const { margins, fuel } = document
  const idleDays = numberValue(margins.portIdleDays)
  const workingDays = numberValue(margins.portWorkingDays)
  if (idleDays <= 0 && workingDays <= 0) return ''
  const values: string[] = []
  if (idleDays > 0) values.push(t('report.rotation.marginIdle', { value: amount(idleDays) }))
  if (workingDays > 0) values.push(t('report.rotation.marginWorking', { value: amount(workingDays) }))
  values.push(t('report.rotation.marginExtra', {
    value: amount(idleDays * numberValue(fuel.portIdleFuel) + workingDays * numberValue(fuel.portWorkingFuel)),
  }))
  return values.join(VALUE_SEPARATOR)
}

/** 第 N 港标题：港口 | 任务 [| 满载/压载 | 经济/全速]，航路点只显示「航路点」。 */
function portHeadline(document: VoyageBudgetDocument, port: BudgetPort, index: number) {
  const parts = [portName(port)]
  if (isRoutingPort(port)) {
    parts.push(t('report.rotation.waypoint'))
    return parts.join(VALUE_SEPARATOR)
  }
  parts.push(taskLabel(port.taskType))
  if (index < document.ports.length - 1) {
    parts.push(port.isLaden ? t('report.rotation.laden') : t('report.rotation.ballast'))
    parts.push(port.speedMode === 'eco' ? t('report.rotation.eco') : t('report.rotation.full'))
  }
  return parts.join(VALUE_SEPARATOR)
}

/** 本港（首港）或本航段油耗明细。 */
function fuelSummaryForPort(document: VoyageBudgetDocument, index: number) {
  const arrivalPort = document.ports[index]
  if (!arrivalPort) return '-'
  const { fuel } = document
  if (index === 0) {
    return [
      t('report.rotation.fuelPortIdle', {
        value: amount(numberValue(arrivalPort.idleDays) * numberValue(fuel.portIdleFuel)),
      }),
      t('report.rotation.fuelPortWorking', {
        value: amount(numberValue(arrivalPort.workDays) * numberValue(fuel.portWorkingFuel)),
      }),
    ].join(VALUE_SEPARATOR)
  }
  const departurePort = document.ports[index - 1]
  if (!departurePort) return '-'
  const ecaDays = Math.min(numberValue(arrivalPort.seaDays), numberValue(arrivalPort.ecaSeaDays))
  const weatherMarginDays = numberValue(arrivalPort.weatherMarginDays)
  const nonEcaDays = Math.max(0, numberValue(arrivalPort.seaDays) - ecaDays) + weatherMarginDays
  const mainFuelRate = departurePort.isLaden ? numberValue(fuel.seaLadenFuel) : numberValue(fuel.seaBallastFuel)
  const portFuel = numberValue(arrivalPort.idleDays) * numberValue(fuel.portIdleFuel)
    + numberValue(arrivalPort.workDays) * numberValue(fuel.portWorkingFuel)
  return [
    t('report.rotation.fuelLegMain', {
      type: departurePort.isLaden ? fuel.ladenFuelType : fuel.ballastFuelType,
      value: amount(nonEcaDays * mainFuelRate),
    }),
    t('report.rotation.fuelLegEca', { value: amount(ecaDays * mainFuelRate) }),
    t('report.rotation.fuelLegAuxiliary', {
      value: amount((numberValue(arrivalPort.seaDays) + weatherMarginDays) * numberValue(fuel.seaAuxFuel)),
    }),
    t('report.rotation.fuelLegPort', { value: amount(portFuel) }),
  ].join(VALUE_SEPARATOR)
}

/** 预算结果区块（与小程序 addBudgetResults 一致）。 */
function addBudgetResults(lines: ReportLine[], document: VoyageBudgetDocument, gapBefore = 0) {
  const { results } = document
  lines.push(BLANK(gapBefore))
  lines.push(SECTION(t('report.section.result')))
  lines.push(METRICS([
    { label: t('report.result.totalIncome'), value: amount(results.totalIncome) },
    { label: t('report.result.netIncome'), value: amount(results.netIncome) },
    { label: t('report.result.operatingCost'), value: amount(results.operatingCost) },
    { label: t('report.result.totalExpense'), value: amount(results.totalExpense) },
    { label: t('report.result.operatingProfit'), value: amount(results.operatingProfit) },
    { label: t('report.result.netProfit'), value: amount(results.netProfit) },
    { label: t('report.result.hirePerDayLevel'), value: amount(results.hirePerDayLevel) },
    { label: t('report.result.dailyProfit'), value: amount(results.dailyProfit) },
  ], 2, '#f8fcff', true))
}

/**
 * 报告正文：区块顺序与字段完全对齐小程序
 * （货物 → 日油耗与航速 → 港序 → 油价与油耗 → 费用 → 预算结果）。
 */
function createFullLines(name: string, shipName: string, document: VoyageBudgetDocument): ReportLine[] {
  const lines: ReportLine[] = []
  const { costs, fuel, prices, results, speeds } = document

  lines.push(TITLE(t('report.title')))
  lines.push(BODY(t('report.field.budgetName', { name: name || t('report.fallback.budgetName') })))
  if (shipName) lines.push(BODY(t('report.field.shipName', { name: shipName })))
  lines.push(BODY(t('report.field.generatedAt', { value: scheduleTime(new Date()) })))

  // 货物
  lines.push(SECTION(t('report.section.cargo')))
  if (document.cargos.length === 0) {
    lines.push(ITEM(t('report.section.cargo'), t('report.fallback.noCargo')))
  } else {
    document.cargos.forEach((cargo, index) => {
      lines.push(ITEM(t('report.cargo.item', { index: index + 1 }), cargo.name || t('report.fallback.cargoName')))
      lines.push(ITEM(t('report.cargo.route'), cargoRoute(document, cargo.loadPortId, cargo.dischargePortId)))
      lines.push(ITEM(t('report.cargo.quantityRateIncome'), [
        t('report.cargo.quantityValue', { value: amount(cargo.quantity) }),
        t('report.cargo.freightValue', { value: amount(cargo.freight) }),
        amount(cargo.income),
      ].join(VALUE_SEPARATOR)))
      lines.push(ITEM(t('report.cargo.charges'), [
        chargeText(cargo.income, cargo.addCommRate),
        chargeText(cargo.income, cargo.brokerageRate),
        chargeText(cargo.income, cargo.frtTaxRate),
      ].join(VALUE_SEPARATOR)))
      lines.push(ITEM(t('report.cargo.demurrageDispatch'), [
        amount(cargo.demurrage),
        amount(cargo.dispatch),
      ].join(VALUE_SEPARATOR)))
    })
    if (document.cargos.length > 1) {
      const subtotal = document.cargos.reduce((total, cargo) => ({
        income: total.income + numberValue(cargo.income),
        addComm: total.addComm + cargoCharge(cargo.income, cargo.addCommRate),
        brokerage: total.brokerage + cargoCharge(cargo.income, cargo.brokerageRate),
        tax: total.tax + cargoCharge(cargo.income, cargo.frtTaxRate),
        demurrage: total.demurrage + numberValue(cargo.demurrage),
        dispatch: total.dispatch + numberValue(cargo.dispatch),
      }), { income: 0, addComm: 0, brokerage: 0, tax: 0, demurrage: 0, dispatch: 0 })
      lines.push(BLANK(18))
      lines.push(ITEM(t('report.cargo.subtotal'), ''))
      lines.push(METRICS([
        { label: t('report.cargo.income'), value: amount(subtotal.income) },
        { label: t('report.cargo.addComm'), value: amount(subtotal.addComm) },
        { label: t('report.cargo.brokerage'), value: amount(subtotal.brokerage) },
        { label: t('report.cargo.tax'), value: amount(subtotal.tax) },
        { label: t('report.cargo.demurrage'), value: amount(subtotal.demurrage) },
        { label: t('report.cargo.dispatch'), value: amount(subtotal.dispatch) },
      ], 3, '#f2f7fc'))
    }
  }

  // 日油耗与航速
  lines.push(BLANK())
  lines.push(SECTION(t('report.section.fuelSpeed')))
  lines.push(METRICS([
    { label: t('report.fuelSpeed.mainLaden'), value: t('report.fuelSpeed.tonnesPerDayValue', { value: amount(fuel.seaLadenFuel) }) },
    { label: t('report.fuelSpeed.mainBallast'), value: t('report.fuelSpeed.tonnesPerDayValue', { value: amount(fuel.seaBallastFuel) }) },
    { label: t('report.fuelSpeed.seaAuxiliary'), value: t('report.fuelSpeed.tonnesPerDayValue', { value: amount(fuel.seaAuxFuel) }) },
    { label: t('report.fuelSpeed.portIdle'), value: t('report.fuelSpeed.tonnesPerDayValue', { value: amount(fuel.portIdleFuel) }) },
    { label: t('report.fuelSpeed.portWorking'), value: t('report.fuelSpeed.tonnesPerDayValue', { value: amount(fuel.portWorkingFuel) }) },
  ], 5))
  lines.push(METRICS([
    { label: t('report.fuelSpeed.ballastFull'), value: t('report.fuelSpeed.knotsValue', { value: amount(speeds.ballastFullSpeed) }) },
    { label: t('report.fuelSpeed.ballastEco'), value: t('report.fuelSpeed.knotsValue', { value: amount(speeds.ballastEcoSpeed) }) },
    { label: t('report.fuelSpeed.ladenFull'), value: t('report.fuelSpeed.knotsValue', { value: amount(speeds.ladenFullSpeed) }) },
    { label: t('report.fuelSpeed.ladenEco'), value: t('report.fuelSpeed.knotsValue', { value: amount(speeds.ladenEcoSpeed) }) },
  ], 4))

  // 港序
  lines.push(BLANK())
  lines.push(SECTION(t('report.section.rotation')))
  lines.push(ITEM(t('report.rotation.route'), routeText(document)))
  lines.push(ITEM(t('report.rotation.startAt'), scheduleTime(document.startAt)))
  lines.push(ITEM(t('report.rotation.summary'), [
    t('report.rotation.summaryDistance', { value: amount(results.totalDistanceNm) }),
    t('report.rotation.summaryEcaDistance', { value: amount(results.totalEcaDistanceNm) }),
    t('report.rotation.summarySeaDays', { value: amount(results.totalSeaDays) }),
    t('report.rotation.summaryEcaDays', { value: amount(results.totalEcaSeaDays) }),
    t('report.rotation.summaryPortDays', { value: amount(numberValue(results.totalIdleDays) + numberValue(results.totalWorkDays)) }),
    t('report.rotation.summaryVoyageDays', { value: amount(results.totalVoyageDays) }),
  ].join(VALUE_SEPARATOR)))
  const marginSummary = portMarginSummary(document)
  if (marginSummary) lines.push(ITEM(t('report.rotation.margin'), marginSummary))
  document.ports.forEach((port, index) => {
    lines.push(ITEM(t('report.rotation.port', { index: index + 1 }), portHeadline(document, port, index), true))
    if (index > 0) {
      const sailingItems = [
        t('report.rotation.legDistance', { value: amount(port.distanceNm) }),
      ]
      if (!isRoutingPort(port)) {
        sailingItems.push(
          t('report.rotation.legEcaDistance', { value: amount(port.ecaDistanceNm) }),
          t('report.rotation.legEcaSeaDays', { value: amount(port.ecaSeaDays) }),
        )
      }
      sailingItems.push(t('report.rotation.legSeaDays', { value: amount(port.seaDays) }))
      if (!isRoutingPort(port) && numberValue(port.weatherMarginDays) > 0) {
        sailingItems.push(t('report.rotation.legWeatherMargin', { value: amount(port.weatherMarginDays) }))
      }
      lines.push(ITEM(t('report.rotation.leg'), sailingItems.join(VALUE_SEPARATOR)))
    }
    if (!isRoutingPort(port)) {
      lines.push(ITEM(
        index === 0 ? t('report.rotation.portFuel') : t('report.rotation.legFuel'),
        fuelSummaryForPort(document, index),
      ))
      lines.push(ITEM(t('report.rotation.portStay'), [
        t('report.rotation.stayIdle', { value: amount(port.idleDays) }),
        t('report.rotation.stayWorking', { value: amount(port.workDays) }),
        t('report.rotation.stayCharge', { value: amount(port.portCharge) }),
      ].join(VALUE_SEPARATOR)))
      lines.push(ITEM(t('report.rotation.etaEtd'), t('report.rotation.etaEtdValue', {
        eta: scheduleTime(port.eta),
        etd: scheduleTime(port.etd),
      })))
    }
  })

  // 油价与油耗
  lines.push(BLANK())
  lines.push(SECTION(t('report.section.fuelPrices')))
  const fuelType = mainFuelType(document)
  lines.push(METRICS([
    {
      label: t('report.fuelPrices.lsfo'),
      value: fuelType === 'LSFO' ? t('report.fuelPrices.unitPriceValue', { value: amount(prices.lsfoPrice) }) : PRICE_NOT_APPLICABLE,
    },
    {
      label: t('report.fuelPrices.hsfo'),
      value: fuelType === 'HSFO' ? t('report.fuelPrices.unitPriceValue', { value: amount(prices.hsfoPrice) }) : PRICE_NOT_APPLICABLE,
    },
    { label: t('report.fuelPrices.mgo'), value: t('report.fuelPrices.unitPriceValue', { value: amount(prices.mgoPrice) }) },
  ], 3))
  lines.push(METRICS([
    {
      label: t('report.fuelPrices.mainConsumption', { type: fuelType }),
      value: t('report.fuelPrices.consumptionValue', { value: amount(results.seaMainFuel) }),
    },
    { label: t('report.fuelPrices.mgoEca'), value: t('report.fuelPrices.consumptionValue', { value: amount(results.ecaMainFuel) }) },
    { label: t('report.fuelPrices.mgoAuxiliary'), value: t('report.fuelPrices.consumptionValue', { value: amount(results.seaAuxFuel) }) },
    { label: t('report.fuelPrices.mgoPort'), value: t('report.fuelPrices.consumptionValue', { value: amount(results.portFuel) }) },
    { label: t('report.fuelPrices.total'), value: t('report.fuelPrices.consumptionValue', { value: amount(results.totalFuel) }) },
  ], 3))

  // 费用
  lines.push(BLANK())
  lines.push(SECTION(t('report.section.cost')))
  const hire = numberValue(costs.hirePerDay) * numberValue(results.totalVoyageDays)
  const hireCost = hire - hire * numberValue(costs.hireCommPercent) / 100
  lines.push(METRICS([
    { label: t('report.cost.fuelCost'), value: amount(results.totalFuelCost) },
    { label: t('report.cost.portCharge'), value: amount(results.totalPortCharge) },
    { label: t('report.cost.holdCleaning'), value: amount(costs.ilohc) },
    { label: t('report.cost.cev'), value: amount(costs.cev) },
    { label: t('report.cost.inspection'), value: amount(costs.inspection) },
    { label: t('report.cost.otherOperating'), value: amount(costs.opOther) },
    { label: t('report.cost.hirePerDay'), value: amount(costs.hirePerDay) },
    { label: t('report.cost.hire'), value: amount(hire) },
    { label: t('report.cost.hireCommPercent'), value: amount(costs.hireCommPercent) },
    { label: t('report.cost.hireCost'), value: amount(hireCost) },
    { label: t('report.cost.fixedCost'), value: amount(costs.fixedCost) },
  ], 3))

  addBudgetResults(lines, document, SECTION_GAP)
  return lines
}

function safeFileName(value: string) {
  return (value || 'voyage-budget').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || 'voyage-budget'
}

const PAGE_WIDTH = 1240
const PAGE_HEIGHT = 1754
const PAGE_MARGIN = 74
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const CONTENT_TOP = 92
const BODY_LINE_HEIGHT = 31
const SECTION_LINE_HEIGHT = 39
const SECTION_BAR_HEIGHT = 27
const LABEL_COLUMN_WIDTH = 300
const COLUMN_GAP = 26
const VALUE_COLUMN_X = PAGE_MARGIN + LABEL_COLUMN_WIDTH + COLUMN_GAP
const VALUE_COLUMN_WIDTH = CONTENT_WIDTH - LABEL_COLUMN_WIDTH - COLUMN_GAP
const BLOCK_PADDING = 10
const METRIC_LABEL_SIZE = 16
const METRIC_LABEL_LINE_HEIGHT = 22
const METRIC_VALUE_LINE_HEIGHT = 27
const METRIC_ROW_GAP = 20

const TITLE_FONT = `700 32px ${FONT_STACK}`
const SECTION_FONT = `700 23px ${FONT_STACK}`
const BODY_FONT = `400 18px ${FONT_STACK}`
const LABEL_FONT = `400 18px ${FONT_STACK}`
const VALUE_FONT = `400 19px ${FONT_STACK}`
const VALUE_EMPHASIS_FONT = `700 19px ${FONT_STACK}`
const METRIC_LABEL_FONT = `400 ${METRIC_LABEL_SIZE}px ${FONT_STACK}`
const METRIC_VALUE_FONT = `400 19px ${FONT_STACK}`
const METRIC_ACCENT_FONT = `700 19px ${FONT_STACK}`

const COLOR_BRAND = '#006c8c'
const COLOR_HEADING = '#173447'
const COLOR_BODY = '#3c5364'
const COLOR_LABEL = '#6b7c8d'

interface ReportPage {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}

interface MetricCellLayout {
  x: number
  labelRows: string[]
  valueRows: string[]
}

interface MetricRowLayout {
  cells: MetricCellLayout[]
  height: number
}

type ReportLineLayout =
  | { role: 'title' | 'section' | 'body'; rows: string[]; height: number }
  | { role: 'item'; labelRows: string[]; valueRows: string[]; height: number }
  | { role: 'metrics'; rows: MetricRowLayout[]; height: number }

type ReportBlockLayout = ReportLineLayout | { role: 'blank'; height: number }

function wrapLine(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const text = String(value || '')
  if (!text) return ['']
  const rows: string[] = []
  let row = ''
  for (const character of text) {
    const candidate = `${row}${character}`
    if (row && context.measureText(candidate).width > maxWidth) {
      rows.push(row)
      row = character
    } else {
      row = candidate
    }
  }
  if (row) rows.push(row)
  return rows
}

function createReportPage(): ReportPage {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error(t('report.error.canvas'))

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  context.fillStyle = COLOR_BRAND
  context.fillRect(0, 0, PAGE_WIDTH, 10)
  context.font = `700 22px ${FONT_STACK}`
  context.fillText('PORTDISTANCE', PAGE_MARGIN, 48)
  context.fillStyle = COLOR_LABEL
  context.font = `400 18px ${FONT_STACK}`
  const subtitle = t('report.subtitle')
  context.fillText(subtitle, PAGE_WIDTH - PAGE_MARGIN - context.measureText(subtitle).width, 48)
  return { canvas, context }
}

/** 先量高度再分页，避免区块标题落在页尾。 */
function layoutLine(page: ReportPage, line: ReportLine): ReportLineLayout {
  const { context } = page
  if (line.role === 'title' || line.role === 'section' || line.role === 'body') {
    const section = line.role === 'section'
    context.font = line.role === 'title' ? TITLE_FONT : section ? SECTION_FONT : BODY_FONT
    const lineHeight = section ? SECTION_LINE_HEIGHT : BODY_LINE_HEIGHT
    const rows = wrapLine(context, line.text || '', CONTENT_WIDTH - (section ? 15 : 0))
    return { role: line.role, rows, height: Math.max(lineHeight, rows.length * lineHeight) }
  }
  if (line.role === 'item') {
    context.font = LABEL_FONT
    const labelRows = wrapLine(context, line.label || '', LABEL_COLUMN_WIDTH)
    context.font = line.emphasize ? VALUE_EMPHASIS_FONT : VALUE_FONT
    const valueRows = wrapLine(context, line.value || '', VALUE_COLUMN_WIDTH)
    const rows = Math.max(labelRows.length, valueRows.length)
    return { role: 'item', labelRows, valueRows, height: rows * BODY_LINE_HEIGHT + BLOCK_PADDING }
  }

  const columns = Math.max(1, Math.round(line.columns || 1))
  const entries = line.metrics || []
  const cellWidth = (CONTENT_WIDTH - COLUMN_GAP * (columns - 1)) / columns
  const rows: MetricRowLayout[] = []
  for (let start = 0; start < entries.length; start += columns) {
    const cells = entries.slice(start, start + columns).map((metric, column) => {
      context.font = METRIC_LABEL_FONT
      const labelRows = wrapLine(context, metric.label, cellWidth)
      context.font = line.accent ? METRIC_ACCENT_FONT : METRIC_VALUE_FONT
      const valueRows = wrapLine(context, metric.value, cellWidth)
      return { x: PAGE_MARGIN + column * (cellWidth + COLUMN_GAP), labelRows, valueRows }
    })
    const rowHeight = Math.max(...cells.map((cell) => cell.labelRows.length * METRIC_LABEL_LINE_HEIGHT + cell.valueRows.length * METRIC_VALUE_LINE_HEIGHT))
    rows.push({ cells, height: rowHeight })
  }
  const height = rows.reduce((total, row) => total + row.height + METRIC_ROW_GAP, BLOCK_PADDING)
  return { role: 'metrics', rows, height }
}

function drawLine(page: ReportPage, line: ReportLine, layout: ReportLineLayout, cursorY: number) {
  const { context } = page
  if (layout.role === 'title') {
    context.font = TITLE_FONT
    context.fillStyle = COLOR_HEADING
    layout.rows.forEach((row, index) => context.fillText(row, PAGE_MARGIN, cursorY + index * BODY_LINE_HEIGHT))
    return
  }
  if (layout.role === 'section') {
    context.fillStyle = COLOR_BRAND
    context.fillRect(PAGE_MARGIN, cursorY - SECTION_BAR_HEIGHT + 3, 5, SECTION_BAR_HEIGHT)
    context.font = SECTION_FONT
    context.fillStyle = COLOR_HEADING
    layout.rows.forEach((row, index) => context.fillText(row, PAGE_MARGIN + 15, cursorY + index * SECTION_LINE_HEIGHT))
    return
  }
  if (layout.role === 'body') {
    context.font = BODY_FONT
    context.fillStyle = COLOR_BODY
    layout.rows.forEach((row, index) => context.fillText(row, PAGE_MARGIN, cursorY + index * BODY_LINE_HEIGHT))
    return
  }
  if (layout.role === 'item') {
    context.font = LABEL_FONT
    context.fillStyle = COLOR_LABEL
    layout.labelRows.forEach((row, index) => context.fillText(row, PAGE_MARGIN, cursorY + index * BODY_LINE_HEIGHT))
    context.font = line.emphasize ? VALUE_EMPHASIS_FONT : VALUE_FONT
    context.fillStyle = line.emphasize ? COLOR_HEADING : COLOR_BODY
    layout.valueRows.forEach((row, index) => context.fillText(row, VALUE_COLUMN_X, cursorY + index * BODY_LINE_HEIGHT))
    return
  }

  if (layout.role !== 'metrics') return

  if (line.background) {
    context.fillStyle = line.background
    context.fillRect(PAGE_MARGIN, cursorY - METRIC_LABEL_SIZE - 8, CONTENT_WIDTH, layout.height)
  }
  let rowY = cursorY
  layout.rows.forEach((row) => {
    row.cells.forEach((cell) => {
      context.font = METRIC_LABEL_FONT
      context.fillStyle = COLOR_LABEL
      cell.labelRows.forEach((text, index) => context.fillText(text, cell.x, rowY + index * METRIC_LABEL_LINE_HEIGHT))
      const valueTop = rowY + cell.labelRows.length * METRIC_LABEL_LINE_HEIGHT
      context.font = line.accent ? METRIC_ACCENT_FONT : METRIC_VALUE_FONT
      context.fillStyle = line.accent ? COLOR_BRAND : COLOR_HEADING
      cell.valueRows.forEach((text, index) => context.fillText(text, cell.x, valueTop + index * METRIC_VALUE_LINE_HEIGHT))
    })
    rowY += row.height + METRIC_ROW_GAP
  })
}

function renderReportPages(lines: ReportLine[]) {
  const measure = createReportPage()
  const layouts: ReportBlockLayout[] = lines.map((line) => (
    line.role === 'blank' ? { role: 'blank', height: line.gap || SECTION_GAP } : layoutLine(measure, line)
  ))

  const pages: ReportPage[] = [createReportPage()]
  let page = pages[0]
  let cursorY = CONTENT_TOP
  const pageLimit = PAGE_HEIGHT - PAGE_MARGIN

  lines.forEach((line, index) => {
    const layout = layouts[index]
    if (layout.role === 'blank') {
      if (cursorY + layout.height <= pageLimit) cursorY += layout.height
      return
    }
    const next = layouts[index + 1]
    const keepWithNext = line.role === 'section' && next && next.role !== 'blank' ? next.height : 0
    if (cursorY + layout.height + keepWithNext > pageLimit) {
      page = createReportPage()
      pages.push(page)
      cursorY = CONTENT_TOP
    }
    drawLine(page, line, layout, cursorY)
    cursorY += layout.height
  })

  return pages.map((item) => item.canvas)
}

export async function exportVoyageBudgetPdf(options: {
  name: string
  shipName?: string
  document: VoyageBudgetDocument
}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  renderReportPages(createFullLines(options.name, options.shipName || '', options.document)).forEach((canvas, index) => {
    if (index > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 595.28, 841.89, undefined, 'FAST')
  })

  const filename = `${safeFileName(options.name)}-voyage-budget.pdf`
  if (!Capacitor.isNativePlatform()) {
    pdf.save(filename)
    return { filename, uri: '' }
  }

  const base64 = pdf.output('datauristring').split(',')[1]
  const saved = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  })
  const canShare = await Share.canShare()
  if (canShare.value) {
    try {
      await Share.share({ title: options.name || t('report.shareTitle'), files: [saved.uri] })
    } catch {
      // Targets such as WeChat reject file items, and cancelling the sheet
      // rejects too. The PDF is already written to Documents, so a failed share
      // must not be reported as a failed export.
    }
  }
  return { filename, uri: saved.uri }
}
