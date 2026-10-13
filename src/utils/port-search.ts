import type { PortInfo } from '@/types'

/**
 * 港口搜索的查询串与结果合并规则。
 *
 * 背景（用户报的问题）：原来只把「去掉所有空白与撇号」的归一化串发给接口，
 * 目的是宽容用户误打的空格（"band ar" → "Bandar"）；但这样用户**主动**打的空格
 * 也被吃掉，"dalia f" 变成 "daliaf"，接口就再也匹配不到 "Dalia FPSO" 这类名字里
 * 本身带空格/多词的港口。
 *
 * 现在的做法：查询里出现空白时发两次请求——
 * 1. 原样串（只 trim + 把连续空白折叠成一个空格）优先，保证 "dalia f" → Dalia FPSO；
 * 2. 归一化串兜底，保留原来对误打空格的宽容。
 * 两份结果按 portId 去重合并，原样串的结果排在前面。没有空白时只发一次请求（行为不变）。
 */

/** 去空白/撇号后的查询：宽容误打空格（"band ar" → "bandar"）。 */
export function normalizePortQuery(keyword: string) {
  return keyword.replace(/[\s\u3000\u00a0'’`]/g, '').toLowerCase()
}

/**
 * 原样查询：保留用户主动打的空格，只做首尾去空白与连续空白折叠
 * （输入法/粘贴常带全角空格，折叠成半角单空格）。
 */
export function literalPortQuery(keyword: string) {
  return keyword.replace(/[\s\u3000\u00a0]+/g, ' ').trim()
}

/** 依次需要请求的查询串（去重，原样串在前）。 */
export function portQueryVariants(keyword: string): string[] {
  const literal = literalPortQuery(keyword)
  const normalized = normalizePortQuery(keyword)
  if (!literal) return normalized ? [normalized] : []
  return literal === normalized ? [literal] : [literal, normalized]
}

/** 合并两次查询的结果：按 portId 去重，先前一组优先。 */
export function mergePortSuggestions(first: PortInfo[], second: PortInfo[]): PortInfo[] {
  if (!second.length) return first
  if (!first.length) return second
  const seen = new Set(first.map((port) => String(port.portId)))
  return [...first, ...second.filter((port) => !seen.has(String(port.portId)))]
}
