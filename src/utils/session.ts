import { t } from '@/i18n'
import type { TokenRespVO } from '@/types'
import { appStorage } from '@/utils/storage'

export const ACCESS_TOKEN_KEY = 'PORTDIST_ACCESS_TOKEN'
export const REFRESH_TOKEN_KEY = 'PORTDIST_REFRESH_TOKEN'
export const ACCESS_TOKEN_EXPIRE_AT_KEY = 'PORTDIST_ACCESS_TOKEN_EXPIRE_AT'

const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MIN_TOKEN_TTL_MS = 60 * 1000

function resolveExpireAt(expiresTime?: number) {
  const value = Number(expiresTime || 0)
  if (!Number.isFinite(value) || value <= 0) return Date.now() + DEFAULT_TOKEN_TTL_MS
  if (value > 10 ** 12) return Math.max(Date.now() + MIN_TOKEN_TTL_MS, value)
  return Date.now() + Math.max(MIN_TOKEN_TTL_MS, value)
}

export function getAccessToken() {
  return appStorage.getSync(ACCESS_TOKEN_KEY) || ''
}

export function getRefreshToken() {
  return appStorage.getSync(REFRESH_TOKEN_KEY) || ''
}

export function getAccessTokenExpireAt() {
  return Number(appStorage.getSync(ACCESS_TOKEN_EXPIRE_AT_KEY) || 0)
}

export function hasUsableAccessToken() {
  const token = getAccessToken()
  if (!token) return false
  const expireAt = getAccessTokenExpireAt()
  return !expireAt || expireAt > Date.now()
}

export function hasSession() {
  return hasUsableAccessToken() || Boolean(getRefreshToken())
}

export async function saveTokenResponse(token: TokenRespVO) {
  if (!token?.accessToken) throw new Error(t('errors.loginResponseInvalid'))
  await Promise.all([
    appStorage.set(ACCESS_TOKEN_KEY, token.accessToken),
    appStorage.set(ACCESS_TOKEN_EXPIRE_AT_KEY, String(resolveExpireAt(token.expiresTime))),
    token.refreshToken
      ? appStorage.set(REFRESH_TOKEN_KEY, token.refreshToken)
      : Promise.resolve(),
  ])
}

export async function clearSession() {
  await Promise.all([
    appStorage.remove(ACCESS_TOKEN_KEY),
    appStorage.remove(REFRESH_TOKEN_KEY),
    appStorage.remove(ACCESS_TOKEN_EXPIRE_AT_KEY),
  ])
}
