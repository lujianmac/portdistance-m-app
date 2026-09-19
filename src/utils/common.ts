export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Lite compatibility alias.
 */
export const cloneDeep = deepClone

/**
 * Minimal numeral-compatible formatter used by migrated lite utilities.
 */
export function numeral(value: number | string) {
  const parsed = Number(value)
  return {
    format(pattern: string): string {
      if (!Number.isFinite(parsed)) return '0'

      if (pattern === '0,0.00') {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(parsed)
      }

      if (pattern === '0.[0]') {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(parsed)
      }

      if (pattern === '0.[00]') {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(parsed)
      }

      if (pattern === '0.[000]') {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3
        }).format(parsed)
      }

      if (pattern === '0,0') {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(parsed)
      }

      return String(parsed)
    }
  }
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // structuredClone 在遇到不可克隆对象（如 Window/Proxy）时会抛 DataCloneError
      // 这里降级到 JSON 克隆，避免运行时中断。
    }
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    // 最后兜底：至少保证调用方不会因为克隆异常而崩溃。
    return value
  }
}

export function formatNumber(value: number, decimals = 2): string {
  return round(value, decimals).toFixed(decimals)
}
