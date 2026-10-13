import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.marinecircle.portdistance',
  appName: 'PortDistance',
  webDir: 'dist',
  /**
   * 关掉原生桥的调试日志：官方默认（debug）会把每次插件调用的完整返回值打到控制台，
   * 启动时读本地草稿（Preferences.get）就会把整份航次预算 JSON 刷屏（⚡️ TO JS {...}）。
   * 'none' 只关日志，不影响插件行为（iOS: CAPInstanceConfiguration.m → loggingEnabled=false，
   * Android: CapConfig → LOG_BEHAVIOR_NONE）。
   */
  loggingBehavior: 'none',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 250,
      backgroundColor: '#f5f7fa',
      showSpinner: false,
    },
  },
}

export default config