import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { t } from '@/i18n'
import { formatAmount, formatDateTime } from '@/i18n/format'
import type { BudgetPortTask, VoyageBudgetDocument } from '@/types'

/**
 * 报告行的语义角色：决定字号、字重、左侧色条与分页间距。
 * 用角色而不是比对标题文案，翻译后才能保持标题的大号/加粗样式。
 */
type ReportLineRole = 'title' | 'section' | 'body'

interface ReportLine {
  text: string
  role: ReportLineRole
}

/** 拉丁字体兜底 + 中文字体，保证中英文都能正常渲染。 */
const FONT_STACK = '"Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", sans-serif'

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

function reportLines(name: string, shipName: string, document: VoyageBudgetDocument): ReportLine[] {
  const { results, fuel, prices, costs } = document
  const body = (text: string): ReportLine => ({ text, role: 'body' })
  const section = (text: string): ReportLine => ({ text, role: 'section' })
  const cargoLines = document.cargos.map((cargo, index) =>
    body(
      t('report.cargoLine', {
        index: index + 1,
        name: cargo.name || t('report.fallback.cargoName'),
        quantity: formatAmount(cargo.quantity),
        freight: formatAmount(cargo.freight),
        income: formatAmount(cargo.income),
      }),
    ),
  )

  return [
    { text: t('report.title'), role: 'title' },
    body(t('report.field.budgetName', { name: name || t('report.fallback.budgetName') })),
    ...(shipName ? [body(t('report.field.shipName', { name: shipName }))] : []),
    body(
      t('report.field.generatedAt', {
        value: formatDateTime(new Date(), t('report.fallback.generatedAt')),
      }),
    ),
    body(''),
    section(t('report.section.rotation')),
    body(t('report.field.route', { value: document.ports.map((port) => port.port.portName).join(' -> ') || '-' })),
    body(t('report.field.totalDistance', { value: formatAmount(results.totalDistanceNm) })),
    body(t('report.field.ecaDistance', { value: formatAmount(results.totalEcaDistanceNm) })),
    body(t('report.field.sailingDays', { value: formatAmount(results.totalSeaDays) })),
    body(t('report.field.voyageDays', { value: formatAmount(results.totalVoyageDays) })),
    body(''),
    section(t('report.section.cargo')),
    ...(cargoLines.length ? cargoLines : [body(t('report.fallback.noCargo'))]),
    body(''),
    section(t('report.section.fuel')),
    body(
      t('report.field.mainEngineFuel', {
        laden: formatAmount(fuel.seaLadenFuel),
        ballast: formatAmount(fuel.seaBallastFuel),
      }),
    ),
    body(
      t('report.field.fuelPrices', {
        lsfo: formatAmount(prices.lsfoPrice),
        hsfo: formatAmount(prices.hsfoPrice),
        mgo: formatAmount(prices.mgoPrice),
      }),
    ),
    body(t('report.field.fuelCost', { value: formatAmount(results.totalFuelCost) })),
    body(t('report.field.portCharge', { value: formatAmount(results.totalPortCharge) })),
    body(t('report.field.hirePerDay', { value: formatAmount(costs.hirePerDay) })),
    body(''),
    section(t('report.section.result')),
    body(t('report.field.totalIncome', { value: formatAmount(results.totalIncome) })),
    body(t('report.field.netIncome', { value: formatAmount(results.netIncome) })),
    body(t('report.field.operatingCost', { value: formatAmount(results.operatingCost) })),
    body(t('report.field.totalExpense', { value: formatAmount(results.totalExpense) })),
    body(t('report.field.operatingProfit', { value: formatAmount(results.operatingProfit) })),
    body(t('report.field.netProfit', { value: formatAmount(results.netProfit) })),
    body(t('report.field.hirePerDayLevel', { value: formatAmount(results.hirePerDayLevel) })),
    body(t('report.field.dailyProfit', { value: formatAmount(results.dailyProfit) })),
    body(''),
    section(t('report.section.portDetail')),
    ...document.ports.map((port, index) =>
      body(
        t('report.portLine', {
          index: index + 1,
          name: port.port.portName || '-',
          task: taskLabel(port.taskType),
          distance: formatAmount(port.distanceNm),
          days: formatAmount(port.seaDays),
        }),
      ),
    ),
  ]
}

function safeFileName(value: string) {
  return (value || 'voyage-budget').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || 'voyage-budget'
}

const PAGE_WIDTH = 1240
const PAGE_HEIGHT = 1754
const PAGE_MARGIN = 74
const BODY_LINE_HEIGHT = 31

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

function createReportCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error(t('report.error.canvas'))

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  context.fillStyle = '#006c8c'
  context.fillRect(0, 0, PAGE_WIDTH, 10)
  context.fillStyle = '#006c8c'
  context.font = `700 22px ${FONT_STACK}`
  context.fillText('PORTDISTANCE', PAGE_MARGIN, 48)
  context.fillStyle = '#6b7c8d'
  context.font = `400 18px ${FONT_STACK}`
  const subtitle = t('report.subtitle')
  context.fillText(subtitle, PAGE_WIDTH - PAGE_MARGIN - context.measureText(subtitle).width, 48)
  return { canvas, context }
}

function renderReportPages(lines: ReportLine[]) {
  const pages: HTMLCanvasElement[] = []
  let page = createReportCanvas()
  let cursorY = 92
  pages.push(page.canvas)

  const beginPage = () => {
    page = createReportCanvas()
    cursorY = 92
    pages.push(page.canvas)
  }

  lines.forEach((line) => {
    const section = line.role === 'section'
    const title = line.role === 'title'
    const fontSize = title ? 32 : section ? 23 : 18
    const lineHeight = section ? 39 : BODY_LINE_HEIGHT
    const font = `${section || title ? '700' : '400'} ${fontSize}px ${FONT_STACK}`
    page.context.font = font
    const wrapped = wrapLine(page.context, line.text, PAGE_WIDTH - PAGE_MARGIN * 2)
    const requiredHeight = Math.max(lineHeight, wrapped.length * lineHeight) + (line.text === '' ? 14 : section ? 9 : 0)
    if (cursorY + requiredHeight > PAGE_HEIGHT - PAGE_MARGIN) {
      beginPage()
      page.context.font = font
    }

    if (section) {
      page.context.fillStyle = '#006c8c'
      page.context.fillRect(PAGE_MARGIN, cursorY - 24, 5, 27)
      page.context.fillStyle = '#173447'
    } else if (title) {
      page.context.fillStyle = '#173447'
    } else {
      page.context.fillStyle = '#3c5364'
    }
    wrapped.forEach((row, index) => page.context.fillText(row, PAGE_MARGIN + (section ? 15 : 0), cursorY + index * lineHeight))
    cursorY += requiredHeight
  })

  return pages
}

export async function exportVoyageBudgetPdf(options: {
  name: string
  shipName?: string
  document: VoyageBudgetDocument
}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  renderReportPages(reportLines(options.name, options.shipName || '', options.document)).forEach((canvas, index) => {
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
