import type { UserInfoVO } from '@/types'
import { http } from '@/api/client'

export function getUserInfo() {
  return http.get<UserInfoVO>('/portdist/user/get')
}

export function updateUsername(data: { username: string }) {
  return http.put<boolean>('/portdist/user/update-username', data)
}

export function updatePassword(data: { oldPassword: string; password: string }) {
  return http.put<boolean>('/portdist/user/update-passwd', data)
}

export function sendAccountEmailCode(data: { email: string; language: string; scene: number }) {
  return http.post<boolean>('/portdist/user/send-account-email-code', data)
}

export function updateAccountEmail(data: { email: string; code: string }) {
  return http.put<boolean>('/portdist/user/update-account-email', data)
}
