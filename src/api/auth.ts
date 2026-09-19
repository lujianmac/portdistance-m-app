import { apiLanguage } from '@/i18n'
import type { LoginReqVO, TokenRespVO } from '@/types'
import { http } from '@/api/client'

export interface RegisterReqVO extends LoginReqVO {
  code: string
  nickname?: string
}

export interface ResetPasswordReqVO {
  email: string
  password: string
  code: string
}

export function login(data: LoginReqVO) {
  return http.post<TokenRespVO>('/portdist/auth/login', data, false)
}

export function register(data: RegisterReqVO) {
  return http.post<TokenRespVO>('/portdist/auth/register', data, false)
}

export function logout() {
  return http.post<boolean>('/portdist/auth/logout')
}

export function sendEmailCode(email: string, scene = 1) {
  return http.post<boolean>('/portdist/auth/send-email-code', { email, language: apiLanguage(), scene }, false)
}

export function sendResetPasswordCode(email: string) {
  return http.post<boolean>('/portdist/auth/send-reset-passwd-code', { email, language: apiLanguage() }, false)
}

export function resetPassword(data: ResetPasswordReqVO) {
  return http.post<boolean>('/portdist/auth/reset-passwd', data, false)
}
