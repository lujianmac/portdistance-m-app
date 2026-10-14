import { readonly, ref } from 'vue'
import { getBusinessErrorCode } from '@/api/client'
import { DISTANCE_DAILY_LIMIT_ERROR_CODE } from '@/api/distance'

/**
 * 「当天次数已用完」提示的统一出口。
 *
 * 三个入口共用同一个弹窗（`components/common/QuotaExhaustedDialog.vue`）：
 *   1. 航程计算 tab 的「获取航程」（`stores/distance.ts` -> `calculate`），
 *   2. 航次预算编辑器的「获取航程」（`stores/esti-deploy.ts` -> `calculateRoute`），
 *   3. 我的 -> 购买记录页的「购买」按钮。
 * 弹窗实例只在 `App.vue` 挂一次，各调用方只调用这里的开关函数。
 */

/** 官网地址：弹窗里原样展示、复制按钮复制的都是它，任何语言都不翻译。 */
export const QUOTA_PURCHASE_URL = 'https://www.portdistance.com'

/**
 * 两种文案来源，共用一个弹窗（不另建第二个弹窗，避免重复维护样式与复制按钮）：
 *   'exhausted' —— 航程计算 / 航次预算：确实因为「当天次数已用完」被拦下来；
 *   'purchase'  —— 我的 -> 购买记录里的「购买」按钮：用户只是想买，没有额度超限，
 *                  所以正文不能出现「当天次数已用完」。
 */
export type QuotaDialogSource = 'exhausted' | 'purchase'

/** 全局唯一的弹窗开关。 */
const quotaDialogOpen = ref(false)

/** 当前这次弹窗用哪套正文。 */
const quotaDialogSource = ref<QuotaDialogSource>('exhausted')

/**
 * 后端「当天次数已用完」的业务码。`api/distance.ts` 里的常量在本次改动前没有任何调用方，
 * 仓库历史里也查不到它的来源（见报告），这里按唯一的候选码处理。
 */
export function isQuotaExhaustedError(error: unknown) {
  return getBusinessErrorCode(error) === DISTANCE_DAILY_LIMIT_ERROR_CODE
}

export function openQuotaExhaustedDialog(source: QuotaDialogSource = 'exhausted') {
  quotaDialogSource.value = source
  quotaDialogOpen.value = true
}

export function closeQuotaExhaustedDialog() {
  quotaDialogOpen.value = false
}

/**
 * 调用方拿到 false（或捕获到异常）后用它判断「这次失败已经弹窗提示过了」，
 * 从而跳过 inline error / danger toast，避免同一件事提示两遍。
 */
export function isQuotaExhaustedDialogOpen() {
  return quotaDialogOpen.value
}

export function useQuotaExhaustedDialog() {
  return {
    isOpen: readonly(quotaDialogOpen),
    source: readonly(quotaDialogSource),
    open: openQuotaExhaustedDialog,
    close: closeQuotaExhaustedDialog,
  }
}
