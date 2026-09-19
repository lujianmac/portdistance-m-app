import type { RoutePointConfig, RouteState } from '@/types/map'
import type { Port } from '@/types/protocol'
import { RouteStateEnum } from '@/components/map/util/constants'

export interface RoutePointEditInput {
  config: RoutePointConfig
  nextState: RouteState
  prePortCode?: string
}

export interface RoutePointEditResult {
  routePointConfig: RoutePointConfig[]
  ports: Port[]
  prePortCode?: string
  warning?: string
}

export interface RoutePointSymbolStyle {
  kind: 'allow-pass' | 'pass' | 'no-pass'
  size: number
}

export interface RoutePointGraphicLike {
  wayPointId: number
  routePointId: string
  rpId: string
  rpName: string
  lon: number
  lat: number
  remark?: number
  option: RouteState
  symbol: RoutePointSymbolStyle
}

export interface OpenEditorDraft {
  wayPointId: number
  routePointName: string
  routeState: RouteState
  wayPortIndex: number
  prePortCode?: string
}

// 根据路由点状态返回对应符号样式，供地图渲染层消费。
function createRoutePointSymbol(option: RouteState): RoutePointSymbolStyle {
  if (option === RouteStateEnum.NoPass.value) {
    return { kind: 'no-pass', size: 8 }
  }
  if (option === RouteStateEnum.Pass.value) {
    return { kind: 'pass', size: 14 }
  }
  return { kind: 'allow-pass', size: 11 }
}

// 将路由点配置转换成地图图形对象。
export function createRoutePointGraphics(config: RoutePointConfig[]): RoutePointGraphicLike[] {
  return config.map((item) => ({
    wayPointId: item.wayPointId,
    routePointId: item.routePointId,
    rpId: item.rpId,
    rpName: item.rpName,
    lon: Number(item.longitude),
    lat: Number(item.latitude),
    remark: item.remark,
    option: item.option,
    symbol: createRoutePointSymbol(item.option)
  }))
}

// 打开编辑器前构建初始草稿（当前状态、前置港口等）。
export function buildRouteEditorDraft(
  config: RoutePointConfig,
  ports: Port[]
): OpenEditorDraft {
  const wayPortIndex = ports.findIndex((ele) => ele.portCode === config.rpId || ele.portId === config.rpId)
  const prePortCode = wayPortIndex > 0 ? ports[wayPortIndex - 1]?.portId || ports[wayPortIndex - 1]?.portCode : undefined

  return {
    wayPointId: config.wayPointId,
    routePointName: config.rpName,
    routeState: config.option,
    wayPortIndex,
    prePortCode
  }
}

export function setRouteState(
  allConfig: RoutePointConfig[],
  wayPointId: number,
  state: RouteState
): RoutePointConfig[] {
  return allConfig.map((item) =>
    item.wayPointId === wayPointId
      ? {
          ...item,
          option: state
        }
      : item
  )
}

export function queryRoutePointByWayPoint(
  config: RoutePointConfig[],
  wayPointId: number
): RoutePointConfig | undefined {
  return config.find((item) => item.wayPointId === wayPointId)
}

export function eventClickRoutePoint(
  config: RoutePointConfig[],
  wayPointId: number
): { state: RouteState | null; name: string | null; wayPointId: number | null } {
  const current = queryRoutePointByWayPoint(config, wayPointId)
  if (!current) {
    return { state: null, name: null, wayPointId: null }
  }

  return {
    state: current.option,
    name: current.rpName,
    wayPointId: current.wayPointId
  }
}

function toWaypointPort(config: RoutePointConfig): Port {
  return {
    portId: config.rpId,
    portCode: config.rpId,
    portName: config.rpName,
    lon: config.longitude,
    lat: config.latitude,
    isWayPoint: true
  }
}

// 核心业务：根据“不经过/可经过/必须经过”计算新港口序列与路由点状态。
export function applyRoutePointStateChange(
  allConfig: RoutePointConfig[],
  ports: Port[],
  input: RoutePointEditInput
): RoutePointEditResult {
  const nextConfig = allConfig.map((item) =>
    item.wayPointId === input.config.wayPointId ? { ...item, option: input.nextState } : item
  )

  const currentPortIndex = ports.findIndex((p) => p.portCode === input.config.rpId || p.portId === input.config.rpId)
  const waypointPort = toWaypointPort(input.config)
  const nextPorts = [...ports]

  if (input.nextState === RouteStateEnum.NoPass.value) {
    if (currentPortIndex >= 0) nextPorts.splice(currentPortIndex, 1)
    return {
      routePointConfig: nextConfig,
      ports: nextPorts,
      warning: `${input.config.rpName} is blocked`
    }
  }

  if (input.nextState === RouteStateEnum.AllowPass.value) {
    if (currentPortIndex >= 0) nextPorts.splice(currentPortIndex, 1)
    return {
      routePointConfig: nextConfig,
      ports: nextPorts,
      prePortCode: undefined
    }
  }

  if (!input.prePortCode) {
    return {
      routePointConfig: nextConfig,
      ports: nextPorts,
      warning: 'prePortCode is required for pass state'
    }
  }

  const prePortIndex = nextPorts.findIndex((p) => p.portCode === input.prePortCode || p.portId === input.prePortCode)
  if (prePortIndex < 0) {
    return {
      routePointConfig: nextConfig,
      ports: nextPorts,
      warning: `prePortCode ${input.prePortCode} not found`
    }
  }

  if (currentPortIndex >= 0) nextPorts.splice(currentPortIndex, 1)
  nextPorts.splice(prePortIndex + 1, 0, waypointPort)

  return {
    routePointConfig: nextConfig,
    ports: nextPorts,
    prePortCode: input.prePortCode
  }
}

export function changeRouteState(
  allConfig: RoutePointConfig[],
  graphicWayPointId: number,
  state: RouteState
): RoutePointConfig[] {
  if (state === RouteStateEnum.Pass.value) {
    return allConfig
  }
  return setRouteState(allConfig, graphicWayPointId, state)
}

export function changeRoutePosition(
  allConfig: RoutePointConfig[],
  ports: Port[],
  input: { wayPointId: number; prePortCode: string }
): RoutePointEditResult {
  const current = queryRoutePointByWayPoint(allConfig, input.wayPointId)
  if (!current) {
    return {
      routePointConfig: allConfig,
      ports,
      warning: `wayPointId ${input.wayPointId} not found`
    }
  }

  return applyRoutePointStateChange(allConfig, ports, {
    config: current,
    nextState: RouteStateEnum.Pass.value,
    prePortCode: input.prePortCode
  })
}
