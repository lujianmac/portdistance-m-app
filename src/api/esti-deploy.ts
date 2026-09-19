import { http } from '@/api/client'
import type { DailyFuelTemplate, VoyageBudgetListItem } from '@/types'

export interface DailyFuelTemplateSavePayload {
  id?: number | string
  name: string
  seaLadenFuel: number
  seaBallastFuel: number
  seaAuxFuel: number
  portIdleFuel: number
  portWorkingFuel: number
  ballastFullSpeed: number
  ballastEcoSpeed: number
  ladenFullSpeed: number
  ladenEcoSpeed: number
}

export interface VoyageBudgetPageResult {
  list: VoyageBudgetListItem[]
  total?: number
}

export interface VoyageBudgetDetail extends VoyageBudgetListItem {
  contentStr?: string
}

export interface VoyageBudgetSavePayload {
  id?: number
  name: string
  shipId?: string
  deployDesc?: string
  content: string
  ttlIncome: number
  ttlRevenue: number
  opCost: number
  ttlExpense: number
  opProfit: number
  netProfit: number
  hirePerDayLevel: number
  dailyProfit: number
}

export interface ShipInfoMini {
  id: string
  shipName: string
}

export interface ShipSpecification {
  id: string
  shipName: string
  flag: string
  shipType: string
  buildYear: number
  dwt: number
  dwcc?: number
  grt?: number
  nrt?: number
  shipLength: number
  breadth: number
  depth: number
  draft: number
}

export interface ShipSpecificationPageResult {
  list: ShipSpecification[]
  total?: number
}

export type ShipSpecificationSavePayload = Omit<ShipSpecification, 'id'> & { id?: string }

export function getVoyageBudgetPage(params: { pageNo: number; pageSize: number; name?: string }) {
  return http.get<VoyageBudgetPageResult>('/portdist/estimation-deploy/page', params)
}

export function getVoyageBudget(id: number) {
  return http.get<VoyageBudgetDetail>('/portdist/estimation-deploy/get', { id })
}

export function createVoyageBudget(data: VoyageBudgetSavePayload) {
  return http.post<number>('/portdist/estimation-deploy/create', data)
}

export function updateVoyageBudget(data: VoyageBudgetSavePayload) {
  return http.put<boolean>('/portdist/estimation-deploy/update', data)
}

export function deleteVoyageBudget(id: number) {
  return http.del<boolean>('/portdist/estimation-deploy/delete', { id })
}

export function getShipInfoMiniList() {
  return http.get<ShipInfoMini[]>('/portdist/ship-info/get-all-mini')
}

export function getShipSpecificationPage(params: { pageNo: number; pageSize: number; shipName?: string }) {
  return http.get<ShipSpecificationPageResult>('/portdist/ship-info/page', params)
}

export function getShipSpecification(id: string) {
  return http.get<ShipSpecification>('/portdist/ship-info/get', { id })
}

export function createShipSpecification(data: ShipSpecificationSavePayload) {
  return http.post<string>('/portdist/ship-info/create', data)
}

export function updateShipSpecification(data: ShipSpecificationSavePayload) {
  return http.put<boolean>('/portdist/ship-info/update', data)
}

export function deleteShipSpecification(id: string) {
  return http.del<boolean>('/portdist/ship-info/delete', { id })
}

export function getDailyFuelTemplates() {
  return http.get<DailyFuelTemplate[]>('/portdist/daily-fuel-template/page')
}

export function createDailyFuelTemplate(data: DailyFuelTemplateSavePayload) {
  return http.post<number>('/portdist/daily-fuel-template/create', data)
}

export function updateDailyFuelTemplate(data: DailyFuelTemplateSavePayload) {
  return http.put<boolean>('/portdist/daily-fuel-template/update', data)
}

export function deleteDailyFuelTemplate(id: number | string) {
  return http.del<boolean>('/portdist/daily-fuel-template/delete', { id })
}
