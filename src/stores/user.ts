import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { getUserInfo } from '@/api/user'
import { useDistanceStore } from '@/stores/distance'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { LoginReqVO, TokenRespVO, UserInfoVO } from '@/types'
import { clearSession, getAccessToken, getRefreshToken, hasSession, saveTokenResponse } from '@/utils/session'

export const useUserStore = defineStore('user', () => {
  const hydrated = ref(false)
  const loading = ref(false)
  const token = ref('')
  const refreshToken = ref('')
  const profile = ref<UserInfoVO>({})

  const isAuthenticated = computed(() => Boolean(token.value) || Boolean(refreshToken.value))

  async function restoreSession() {
    const shouldRefreshProfile = !hydrated.value
    token.value = getAccessToken()
    refreshToken.value = getRefreshToken()
    hydrated.value = true
    if (shouldRefreshProfile && hasSession()) {
      await refreshProfile().catch(() => undefined)
      token.value = getAccessToken()
      refreshToken.value = getRefreshToken()
    }
    return isAuthenticated.value
  }

  async function login(payload: LoginReqVO) {
    loading.value = true
    try {
      const response = await loginApi(payload)
      await completeAuthentication(response)
    } finally {
      loading.value = false
    }
  }

  async function completeAuthentication(response: TokenRespVO) {
    await saveTokenResponse(response)
    token.value = getAccessToken()
    refreshToken.value = getRefreshToken()
    if (response.userId) {
      await Promise.all([
        useDistanceStore().setUserScope(response.userId),
        useEstiDeployStore().setUserScope(response.userId),
      ])
    }
    await refreshProfile()
  }

  async function refreshProfile(): Promise<boolean> {
    if (!hasSession()) return false
    try {
      const user = await getUserInfo()
      profile.value = user || {}
      token.value = getAccessToken()
      refreshToken.value = getRefreshToken()
      if (profile.value.id) {
        await Promise.all([
          useDistanceStore().setUserScope(profile.value.id),
          useEstiDeployStore().setUserScope(profile.value.id),
        ])
      }
      return true
    } catch {
      if (!hasSession()) {
        token.value = ''
        refreshToken.value = ''
        profile.value = {}
      }
      return false
    }
  }

  async function logout() {
    try {
      if (token.value) await logoutApi()
    } catch {
      // Local sign out still succeeds when a remote logout request cannot finish.
    }
    await clearSession()
    token.value = ''
    refreshToken.value = ''
    profile.value = {}
    await Promise.all([
      useDistanceStore().setUserScope(),
      useEstiDeployStore().setUserScope(),
    ])
  }

  return {
    hydrated,
    loading,
    token,
    refreshToken,
    profile,
    isAuthenticated,
    restoreSession,
    login,
    completeAuthentication,
    refreshProfile,
    logout,
  }
})
