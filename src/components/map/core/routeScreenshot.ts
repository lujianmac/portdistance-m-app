export function createRouteScreenshot(points: Array<[number, number]>): string | null {
  if (points.length < 2) return null
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 400
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = '#e9f2f4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const latitudes = points.map((point) => point[0])
  const longitudes = points.map((point) => point[1])
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const latSpan = Math.max(maxLat - minLat, 1)
  const lonSpan = Math.max(maxLon - minLon, 1)
  const padding = 34
  const project = ([latitude, longitude]: [number, number]) => ({
    x: padding + ((longitude - minLon) / lonSpan) * (canvas.width - padding * 2),
    y: padding + ((maxLat - latitude) / latSpan) * (canvas.height - padding * 2),
  })

  context.strokeStyle = 'rgba(53, 88, 108, 0.16)'
  context.lineWidth = 1
  for (let index = 1; index < 6; index += 1) {
    const x = (canvas.width / 6) * index
    const y = (canvas.height / 6) * index
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, canvas.height)
    context.stroke()
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(canvas.width, y)
    context.stroke()
  }

  context.strokeStyle = '#a1443b'
  context.lineWidth = 4
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.beginPath()
  points.forEach((point, index) => {
    const projected = project(point)
    if (index === 0) context.moveTo(projected.x, projected.y)
    else context.lineTo(projected.x, projected.y)
  })
  context.stroke()

  const endpoints = [points[0], points[points.length - 1]]
  endpoints.forEach((point) => {
    const projected = project(point)
    context.beginPath()
    context.fillStyle = '#323cc8'
    context.strokeStyle = '#ffffff'
    context.lineWidth = 3
    context.arc(projected.x, projected.y, 7, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  })
  return canvas.toDataURL('image/jpeg', 0.72)
}