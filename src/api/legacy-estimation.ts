import { http } from '@/api/client'
import type {
  LegacyEstimationDetail,
  LegacyEstimationListItem,
  LegacyEstimationPayload,
  LegacyRotationOrderVO,
} from '@/types'

/**
 * Voyage estimation ("legacy budget") endpoints.
 *
 * The list comes from the same mixed endpoint the new budget list uses, so it returns
 * every version — the caller renders all rows and only badges the version-2 ones, the
 * same way the old app's normal `EstimationList.vue` did. The detail payload keeps the
 * backend field names (`contentStr` plus the payload's own keys), so it is typed as-is
 * and only unwrapped here — never renamed or recalculated.
 */

/** `EstiVersionEnum.OldVersion` in the old app: 1 = normal version, 2 = old version. */
export const LEGACY_ESTIMATION_VERSION = 2

export type { LegacyEstimationDetail, LegacyEstimationListItem, LegacyEstimationPayload, LegacyRotationOrderVO }

export interface LegacyEstimationPage {
  list: LegacyEstimationListItem[]
  total?: number
}

export function isLegacyEstimationRow(item: LegacyEstimationListItem) {
  return Number(item.version) === LEGACY_ESTIMATION_VERSION
}

export function getLegacyEstimationPage(pageNo: number, pageSize: number) {
  return http.get<LegacyEstimationPage>('/portdist/estimation/page-mobile', { pageNo, pageSize })
}

export function getLegacyEstimation(id: string | number) {
  return http.get<LegacyEstimationDetail>('/portdist/estimation/get', { id })
}

/**
 * `contentStr` is a JSON string holding the whole estimation document.
 * Returns an empty document instead of throwing so a corrupt record still renders the
 * header (title / ship name / create time) the list already showed.
 */
export function parseLegacyEstimationContent(contentStr?: string | null): LegacyEstimationPayload {
  if (!contentStr) return {}
  try {
    const parsed: unknown = JSON.parse(contentStr)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as LegacyEstimationPayload
  } catch {
    return {}
  }
}

/**
 * True when the payload is a *normal* estimation (`EstimationView.vue` shape).
 *
 * Version-2 rows carry the much older `cargoData` / `portData` / `vesselData` /
 * `resultData` document and expose none of these keys, which is exactly what selects
 * the fallback rendering.
 */
export function hasNormalEstimationContent(content: LegacyEstimationPayload | null | undefined): boolean {
  if (!content) return false
  return Array.isArray(content.cargoArr)
    || Array.isArray(content.rotationOrderArr)
    || Boolean(content.rotationTopVO)
    || Boolean(content.fuelVO)
    || Boolean(content.incomeVO)
    || Boolean(content.costVO)
    || Boolean(content.resultVO)
}
