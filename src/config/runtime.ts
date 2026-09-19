import { Capacitor } from '@capacitor/core'

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://www.portdistance.com/app-api'
const DEFAULT_BROWSER_DEVELOPMENT_API_BASE_URL = '/app-api'
const DEFAULT_ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:48080/app-api'

function configuredApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  if (!Capacitor.isNativePlatform()) {
    return import.meta.env.DEV
      ? DEFAULT_BROWSER_DEVELOPMENT_API_BASE_URL
      : DEFAULT_PRODUCTION_API_BASE_URL
  }

  const nativeConfigured = import.meta.env.VITE_NATIVE_API_BASE_URL?.trim()
  if (nativeConfigured) return nativeConfigured.replace(/\/$/, '')

  if (Capacitor.getPlatform() === 'android' && import.meta.env.DEV) {
    return DEFAULT_ANDROID_EMULATOR_API_BASE_URL
  }

  return DEFAULT_PRODUCTION_API_BASE_URL
}

export const API_BASE_URL = configuredApiBaseUrl()
export const API_TIMEOUT_MS = 20_000
export const TENANT_ID = '1'
export const DEFAULT_SPEED = 12
