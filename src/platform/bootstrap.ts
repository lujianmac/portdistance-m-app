import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { appStorage } from '@/utils/storage'
import { pinia } from '@/stores/pinia'
import { useNetworkStore } from '@/stores/network'

export async function bootstrapNativeRuntime() {
  const network = useNetworkStore(pinia)
  await appStorage.init().catch(() => undefined)
  await network.start().catch(() => undefined)

  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void network.refresh()
  }).catch(() => undefined)

  await SplashScreen.hide().catch(() => undefined)
}
