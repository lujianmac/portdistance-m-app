import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Network } from '@capacitor/network'
import type { PluginListenerHandle } from '@capacitor/core'

export const useNetworkStore = defineStore('network', () => {
  const connected = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  let nativeListener: PluginListenerHandle | null = null
  let started = false
  let browserListenersAttached = false

  const markOnline = () => { connected.value = true }
  const markOffline = () => { connected.value = false }

  const isOffline = computed(() => !connected.value)

  async function refresh() {
    const status = await Network.getStatus()
    connected.value = status.connected
    return connected.value
  }

  async function start() {
    if (started) return
    started = true
    await refresh().catch(() => undefined)
    nativeListener = await Network.addListener('networkStatusChange', (status) => {
      connected.value = status.connected
    }).catch(() => null)
    if (!browserListenersAttached && typeof window !== 'undefined') {
      window.addEventListener('online', markOnline)
      window.addEventListener('offline', markOffline)
      browserListenersAttached = true
    }
  }

  async function stop() {
    await nativeListener?.remove()
    nativeListener = null
    if (browserListenersAttached && typeof window !== 'undefined') {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
      browserListenersAttached = false
    }
    started = false
  }

  return { connected, isOffline, refresh, start, stop }
})
