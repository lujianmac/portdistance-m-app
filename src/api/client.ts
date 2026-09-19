import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { t } from '@/i18n'
import { API_BASE_URL, API_TIMEOUT_MS, TENANT_ID } from '@/config/runtime'
import type { CommonResp, TokenRespVO } from '@/types'
import { clearSession, getAccessToken, getRefreshToken, saveTokenResponse } from '@/utils/session'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestConfig {
  url: string
  method: HttpMethod
  data?: unknown
  params?: Record<string, unknown>
  auth?: boolean
}

type RequestWithMeta = InternalAxiosRequestConfig & {
  __portdistAuth?: boolean
  __portdistRetried?: boolean
}

export class ApiError extends Error {
  readonly code?: number
  readonly status?: number
  readonly connection: boolean

  constructor(message: string, options: { code?: number; status?: number; connection?: boolean } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.connection = Boolean(options.connection)
  }
}

export function getBusinessErrorCode(error: unknown) {
  return error instanceof ApiError ? error.code : undefined
}

const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'tenant-id': TENANT_ID,
    'Content-Type': 'application/json',
  },
})

let refreshingToken: Promise<TokenRespVO | null> | null = null

function isSuccessCode(code: unknown) {
  return Number(code) === 0 || Number(code) === 200
}

async function refreshAccessToken() {
  if (refreshingToken) return refreshingToken
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshingToken = axios.post<CommonResp<TokenRespVO>>(
    `${API_BASE_URL}/portdist/auth/refresh-token`,
    undefined,
    {
      timeout: API_TIMEOUT_MS,
      headers: { 'tenant-id': TENANT_ID, 'Content-Type': 'application/json' },
      params: { refreshToken },
    },
  ).then(async ({ data }) => {
    if (!isSuccessCode(data?.code) || !data?.data?.accessToken) return null
    await saveTokenResponse(data.data)
    return data.data
  }).catch(() => null).finally(() => {
    refreshingToken = null
  })

  return refreshingToken
}

service.interceptors.request.use((config) => {
  const request = config as RequestWithMeta
  const auth = request.__portdistAuth !== false
  if (auth) {
    const token = getAccessToken()
    if (token) request.headers.Authorization = `Bearer ${token}`
  }
  return request
})

service.interceptors.response.use(async (response): Promise<AxiosResponse> => {
  const body = response.data as CommonResp<unknown>
  const request = response.config as RequestWithMeta
  if (body && typeof body === 'object' && isSuccessCode(body.code)) return response

  const code = Number(body?.code)
  if (code === 401 && request.__portdistAuth !== false && !request.__portdistRetried) {
    request.__portdistRetried = true
    const nextToken = await refreshAccessToken()
    if (nextToken?.accessToken) {
      request.headers.Authorization = `Bearer ${nextToken.accessToken}`
      return service.request(request)
    }
    await clearSession()
  }

  throw new ApiError(String(body?.msg || t('errors.requestFailed')), {
    code: Number.isFinite(code) ? code : undefined,
    status: response.status,
  })
}, async (error: AxiosError<CommonResp<unknown>>) => {
  const status = error.response?.status
  const request = error.config as RequestWithMeta | undefined
  const responseCode = Number(error.response?.data?.code)
  if (request && (status === 401 || responseCode === 401) && request.__portdistAuth !== false && !request.__portdistRetried) {
    request.__portdistRetried = true
    const nextToken = await refreshAccessToken()
    if (nextToken?.accessToken) {
      request.headers.Authorization = `Bearer ${nextToken.accessToken}`
      return service.request(request)
    }
    await clearSession()
  }
  const message = status
    ? String(error.response?.data?.msg || t('errors.requestFailedWithStatus', { status }))
    : t('errors.networkUnreachable')
  throw new ApiError(message, { status, connection: !status })
})

async function request<T>(config: RequestConfig) {
  const response = await service.request<CommonResp<T>>({
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
    __portdistAuth: config.auth !== false,
  } as RequestWithMeta)
  const body = response.data
  if (!body || !isSuccessCode(body.code)) {
    throw new ApiError(String(body?.msg || t('errors.requestFailed')), {
      code: Number.isFinite(Number(body?.code)) ? Number(body.code) : undefined,
      status: response.status,
    })
  }
  return body.data
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>, auth = true) => request<T>({ url, params, method: 'GET', auth }),
  post: <T>(url: string, data?: unknown, auth = true) => request<T>({ url, data, method: 'POST', auth }),
  put: <T>(url: string, data?: unknown, auth = true) => request<T>({ url, data, method: 'PUT', auth }),
  del: <T>(url: string, params?: Record<string, unknown>, auth = true) => request<T>({ url, params, method: 'DELETE', auth }),
}
