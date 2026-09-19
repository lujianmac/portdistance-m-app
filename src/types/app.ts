export interface CommonResp<T> {
  code: number
  msg: string
  data: T
}

export interface LoginReqVO {
  email: string
  password: string
}

export interface TokenRespVO {
  accessToken: string
  refreshToken?: string
  expiresTime?: number
  userId?: number
}

export interface UserInfoVO {
  id?: string | number
  name?: string
  email?: string
  operStatus?: string
  operType?: number
}

export interface PortInfo {
  portId: string
  portName: string
  countryCode?: string
  longitude: string
  latitude: string
  fullName?: string
  isCoordinate?: boolean
  isWayPoint?: boolean
}
