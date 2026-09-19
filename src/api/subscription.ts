import { http } from '@/api/client'

export interface PayRecord {
  id?: number
  orderNo?: string
  productNo?: number
  channelId?: number
  amount?: number
  currency?: string
  no?: string
  createTime?: string | number
}

export interface SubscriptionRecord {
  id?: number
  functionId?: string
  subStartDate?: string | number
  subEndDate?: string | number
  subPeriod?: string
  remark?: string
}

export interface SubscriptionAndRecordResponse {
  recordList?: PayRecord[]
  subList?: SubscriptionRecord[]
}

export function getSubscriptionAndRecords() {
  return http.get<SubscriptionAndRecordResponse>('/portdist/pay/sub-record/get')
}
