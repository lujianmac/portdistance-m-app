import { http } from '@/api/client'

export interface LegacyEstimationListItem {
  id: string | number
  title?: string
  shipName?: string
  createTime?: string | number
  version?: string | number
}

export interface LegacyEstimationPage {
  list: LegacyEstimationListItem[]
  total?: number
}

export interface LegacyEstimationDetail extends LegacyEstimationListItem {
  content?: string
}

export function getLegacyEstimationPage(pageNo: number, pageSize: number) {
  return http.get<LegacyEstimationPage>('/portdist/estimation/page-mobile', { pageNo, pageSize })
}

export function getLegacyEstimation(id: string | number) {
  return http.get<LegacyEstimationDetail>('/portdist/estimation/get', { id })
}
