import type { Port } from '@/types/protocol'

// 合并港口集合：相同 portCode 以后来的数据为准。
export function upsertPorts(current: Port[], incoming: Port[]): Port[] {
  const dict = new Map<string, Port>()
  current.forEach((item) => dict.set(item.portCode, item))
  incoming.forEach((item) => dict.set(item.portCode, item))
  return Array.from(dict.values())
}

// 按 portCode 批量删除港口。
export function removePorts(current: Port[], willDelete: Array<Pick<Port, 'portCode'>>): Port[] {
  const deleteSet = new Set(willDelete.map((item) => item.portCode))
  return current.filter((item) => !deleteSet.has(item.portCode))
}

export interface PortGraphicLike {
  id: string
  lon: number
  lat: number
  portCode: string
  portName: string
  isCoordinate: boolean
  isWayPoint: boolean
  symbol: 'port' | 'coordinate' | 'route-point'
}

// 将港口业务对象转换成地图可绘制图形数据。
export function createPortGraphics(list: Port[]): PortGraphicLike[] {
  return list
    .filter((item) => Number.isFinite(item.lon) && Number.isFinite(item.lat))
    .map((item, index) => ({
      id: `${item.portCode}-${index}`,
      lon: Number(item.lon),
      lat: Number(item.lat),
      portCode: item.portCode,
      portName: item.portName,
      isCoordinate: Boolean(item.isCoordinate),
      isWayPoint: Boolean(item.isWayPoint),
      symbol: item.isWayPoint ? 'route-point' : item.isCoordinate ? 'coordinate' : 'port'
    }))
}

export function appendPort(current: Port[], target: Port): Port[] {
  return upsertPorts(current, [target])
}

export function deletePort(current: Port[], portCode: string): Port[] {
  return current.filter((item) => item.portCode !== portCode)
}

export function clearPorts(): Port[] {
  return []
}

export function reloadPorts(_current: Port[], incoming: Port[]): Port[] {
  return createPortGraphics(incoming).map((item) => ({
    portCode: item.portCode,
    portName: item.portName,
    lon: item.lon,
    lat: item.lat,
    isCoordinate: item.isCoordinate,
    isWayPoint: item.isWayPoint
  }))
}
