import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Route share card.
 *
 * WeChat's iOS share extension ignores plain text items, so a share is sent as
 * `text + url + image`. The image is drawn here on a canvas from the route
 * coordinates only — no map tiles, so the canvas can never be tainted by a
 * cross-origin basemap and the result is identical on every device.
 */

export interface ShareCardPort {
  name: string
  country?: string
  lon: number
  lat: number
}

export interface ShareCardMetric {
  label: string
  value: string
}

export interface ShareCardInput {
  title: string
  route: string
  ports: ShareCardPort[]
  /** Main route polylines in `[lon, lat]` pairs. */
  segments: number[][][]
  /** ECA portions of the route, drawn in the secondary colour. */
  ecaSegments?: number[][][]
  metrics: ShareCardMetric[]
  /** Small print under the sketch (e.g. "route sketch, for reference only"). */
  sketchNote: string
  footer: string
  /** Message shared together with the image. */
  text: string
  fileName: string
}

const WIDTH = 1080
const HEIGHT = 1350
const PADDING = 72

const COLOR = {
  brand: '#006c8c',
  ink: '#173447',
  body: '#526879',
  muted: '#6e8192',
  line: '#dce6ef',
  soft: '#f5f9fb',
  accent: '#e66b45',
} as const

const FONT_STACK = '"PingFang SC", "Hiragino Sans GB", "Helvetica Neue", Arial, sans-serif'

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FONT_STACK}`
}

function mercatorY(latitude: number) {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, latitude))
  const radians = (clamped * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + radians / 2))
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function clipText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (context.measureText(value).width <= maxWidth) return value
  let text = value
  while (text.length > 1 && context.measureText(`${text}…`).width > maxWidth) {
    text = text.slice(0, -1)
  }
  return `${text}…`
}

/** Draws the route onto the card and returns a `data:image/png` URL. */
export function drawShareCard(input: ShareCardInput): string {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas unavailable')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = COLOR.brand
  context.fillRect(0, 0, WIDTH, 12)

  // ---------- header ----------
  context.textBaseline = 'alphabetic'
  context.fillStyle = COLOR.brand
  context.font = font(700, 30)
  context.fillText('PORTDISTANCE', PADDING, 108)

  context.fillStyle = COLOR.ink
  context.font = font(700, 46)
  context.fillText(clipText(context, input.title, WIDTH - PADDING * 2), PADDING, 176)

  context.fillStyle = COLOR.body
  context.font = font(400, 28)
  context.fillText(clipText(context, input.route, WIDTH - PADDING * 2), PADDING, 226)

  // ---------- route sketch ----------
  const box = { x: PADDING, y: 268, width: WIDTH - PADDING * 2, height: 548 }
  roundedRect(context, box.x, box.y, box.width, box.height, 20)
  context.fillStyle = COLOR.soft
  context.fill()
  context.strokeStyle = COLOR.line
  context.lineWidth = 2
  context.stroke()

  context.save()
  roundedRect(context, box.x, box.y, box.width, box.height, 20)
  context.clip()

  const segments = input.segments.filter((segment) => Array.isArray(segment) && segment.length >= 2)
  const points = [...segments, ...(input.ecaSegments ?? [])].flat()
  const portPoints = input.ports.filter((port) => Number.isFinite(port.lon) && Number.isFinite(port.lat))

  if (points.length >= 2) {
    const xs = [...points.map((point) => point[0]), ...portPoints.map((port) => port.lon)]
    const ys = [...points.map((point) => mercatorY(point[1])), ...portPoints.map((port) => mercatorY(port.lat))]
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = Math.max(maxX - minX, 1e-6)
    const spanY = Math.max(maxY - minY, 1e-6)
    const inner = 56
    const scale = Math.min((box.width - inner * 2) / spanX, (box.height - inner * 2) / spanY)
    const offsetX = box.x + (box.width - spanX * scale) / 2
    const offsetY = box.y + (box.height - spanY * scale) / 2

    const project = (lon: number, lat: number): [number, number] => [
      offsetX + (lon - minX) * scale,
      offsetY + (maxY - mercatorY(lat)) * scale,
    ]

    // faint graticule
    context.strokeStyle = '#e6eef5'
    context.lineWidth = 1
    for (let index = 1; index < 5; index += 1) {
      const y = box.y + (box.height / 5) * index
      context.beginPath()
      context.moveTo(box.x, y)
      context.lineTo(box.x + box.width, y)
      context.stroke()
      const x = box.x + (box.width / 5) * index
      context.beginPath()
      context.moveTo(x, box.y)
      context.lineTo(x, box.y + box.height)
      context.stroke()
    }

    const strokePolylines = (list: number[][][], color: string, width: number) => {
      context.strokeStyle = color
      context.lineWidth = width
      context.lineJoin = 'round'
      context.lineCap = 'round'
      list.forEach((segment) => {
        if (!Array.isArray(segment) || segment.length < 2) return
        context.beginPath()
        segment.forEach((point, index) => {
          const [x, y] = project(Number(point[0]), Number(point[1]))
          if (index === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        })
        context.stroke()
      })
    }

    const ecaSegments = (input.ecaSegments ?? []).filter((segment) => Array.isArray(segment) && segment.length >= 2)
    strokePolylines(segments, COLOR.brand, 7)
    if (ecaSegments.length) strokePolylines(ecaSegments, COLOR.accent, 7)

    // ports: dot + short label
    context.font = font(600, 26)
    portPoints.forEach((port, index) => {
      const [x, y] = project(port.lon, port.lat)
      const isEnd = index === 0 || index === portPoints.length - 1
      context.beginPath()
      context.arc(x, y, isEnd ? 13 : 9, 0, Math.PI * 2)
      context.fillStyle = '#ffffff'
      context.fill()
      context.lineWidth = 5
      context.strokeStyle = COLOR.brand
      context.stroke()

      const label = port.country ? `${port.name} [${port.country}]` : port.name
      const text = clipText(context, label, 300)
      const textWidth = context.measureText(text).width
      const preferLeft = x + 22 + textWidth > box.x + box.width - 16
      const textX = preferLeft ? Math.max(box.x + 16, x - 22 - textWidth) : x + 22
      const textY = Math.min(Math.max(y + 9, box.y + 34), box.y + box.height - 16)
      context.lineWidth = 6
      context.strokeStyle = 'rgba(255, 255, 255, 0.92)'
      context.strokeText(text, textX, textY)
      context.fillStyle = COLOR.ink
      context.fillText(text, textX, textY)
    })
  } else {
    context.fillStyle = COLOR.muted
    context.font = font(400, 28)
    context.textAlign = 'center'
    context.fillText(input.sketchNote, box.x + box.width / 2, box.y + box.height / 2)
    context.textAlign = 'left'
  }
  context.restore()

  context.fillStyle = COLOR.muted
  context.font = font(400, 24)
  context.fillText(clipText(context, input.sketchNote, box.width), PADDING, box.y + box.height + 42)

  // ---------- metrics ----------
  const metricsTop = box.y + box.height + 112
  const columnWidth = (WIDTH - PADDING * 2) / 2
  input.metrics.slice(0, 6).forEach((metric, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = PADDING + column * columnWidth
    const y = metricsTop + row * 130

    context.fillStyle = COLOR.muted
    context.font = font(400, 26)
    context.fillText(clipText(context, metric.label, columnWidth - 40), x, y)

    context.fillStyle = COLOR.ink
    context.font = font(700, 44)
    context.fillText(clipText(context, metric.value, columnWidth - 40), x, y + 56)
  })

  // ---------- footer ----------
  context.strokeStyle = COLOR.line
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(PADDING, HEIGHT - 128)
  context.lineTo(WIDTH - PADDING, HEIGHT - 128)
  context.stroke()

  context.fillStyle = COLOR.muted
  context.font = font(400, 26)
  context.fillText(clipText(context, input.footer, WIDTH - PADDING * 2 - 240), PADDING, HEIGHT - 76)

  context.fillStyle = COLOR.brand
  context.font = font(700, 30)
  context.textAlign = 'right'
  context.fillText('PortDistance', WIDTH - PADDING, HEIGHT - 76)
  context.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  link.click()
}

/**
 * Shares the card image together with the result text.
 * Returns false when nothing could be shared, so the caller can fall back to a
 * plain text share.
 */
export async function shareRouteCard(input: ShareCardInput): Promise<boolean> {
  let dataUrl = ''
  try {
    dataUrl = drawShareCard(input)
  } catch {
    return false
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const saved = await Filesystem.writeFile({
        path: input.fileName,
        data: dataUrl.split(',')[1],
        directory: Directory.Cache,
        recursive: true,
      })
      const canShare = await Share.canShare()
      if (!canShare.value) return false
      await Share.share({
        title: input.title,
        text: input.text,
        files: [saved.uri],
        dialogTitle: input.title,
      })
      return true
    } catch {
      return false
    }
  }

  // Browser: share the file when the Web Share API accepts files, otherwise
  // download the card so the user can attach it manually.
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], input.fileName, { type: 'image/png' })
    const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
    if (canShareFiles && typeof navigator.share === 'function') {
      await navigator.share({ title: input.title, text: input.text, files: [file] })
      return true
    }
  } catch {
    // fall through to the download
  }

  downloadDataUrl(dataUrl, input.fileName)
  return true
}
