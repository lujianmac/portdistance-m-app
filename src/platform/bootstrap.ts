import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { appStorage } from '@/utils/storage'
import { pinia } from '@/stores/pinia'
import { useNetworkStore } from '@/stores/network'

/**
 * 启动图兜底时长：从 start() 的第一步开始计时。
 * 取 6s 的理由：iOS 冷启动 + 弱网下 restoreSession() 会同步等待 /user/get（见 router 的 beforeEach），
 * 实测（headless 弱网模拟，2.5s 延迟）整段启动约 5.2s，真实弱网通常也在 2~4s 内返回，
 * 6s ≈ 1.5~2 倍余量，正常慢网不会触发兜底；同时又把「链路真卡死」的最差等待压到 6s。
 * 卡死的典型来源：原生插件不回调（Preferences.keys/get）、router.isReady() 永不 resolve。
 */
export const SPLASH_FALLBACK_MS = 6000

let splashHidden = false

/**
 * 收起原生启动图（capacitor.config.ts 里 launchAutoHide: false，只能由 JS 收）。
 * 正常路径（首屏画完）和超时兜底都会调到这里，因此做幂等，避免重复调用。
 */
export async function hideSplashScreen() {
  if (splashHidden) return
  splashHidden = true
  await SplashScreen.hide().catch(() => undefined)
}

export async function bootstrapNativeRuntime() {
  const network = useNetworkStore(pinia)
  await appStorage.init().catch(() => undefined)
  await network.start().catch(() => undefined)

  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void network.refresh()
  }).catch(() => undefined)
  // 注意：这里不收起启动图。收启动图的时机由 main.ts 控制——必须等首屏真的画上一帧之后，
  // 否则启动图先消失、内容后出现，中间那段就是白屏（弱网下会被 API 等待放大到几秒）。
}
