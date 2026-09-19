export interface Port {
  portId?: string
  portCode: string
  portName: string
  lon: number
  lat: number
  isCoordinate?: boolean
  isWayPoint?: boolean
}

export interface RoutePathItem {
  distance: string
  route: number[][]
  idArr: Array<number | string>
}

export interface DistanceResultPort extends Port {
  index: number
  distance: number
  ecaDistance: number
  seaDays: number
  ecaSeaDays: number
}

export interface DistanceResultPayload {
  resultVersion?: number
  ports: DistanceResultPort[]
  totals: {
    distance: number
    ecaDistance: number
    seaDays: number
    ecaSeaDays: number
  }
}

export interface RoutePoint {
  routeSeq: number
  lon: number
  lat: number
  wt?: string
  userAdded?: boolean
}