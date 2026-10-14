import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.marinecircle.portdistance',
  appName: 'PortDistance',
  webDir: 'dist',
  /** App/WebView 底色：白色，避免页面还没渲染时透出灰底（状态栏那条也跟着白） */
  backgroundColor: '#ffffff',
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
    /**
     * 状态栏：目标 SDK 是 36（Android 16），而 Android 15 起系统强制 edge-to-edge、
     * Android 16 起 `statusBarColor` 完全失效（见 @capacitor/status-bar 的 StatusBar.java
     * shouldSetStatusBarColor()：API≥35 且未 opt-out 时为 no-op），所以**不能再靠给状态栏上色**，
     * 只能让 WebView 铺到状态栏下面、由页面自己的白色 header 把那条画成白色
     * （这正是 iOS 上的行为，所以 iOS 一直看着一致）。
     * overlaysWebView: true = 内容铺到状态栏下；style: 'LIGHT' 在 Capacitor 里表示
     * “浅底用深色图标”（StatusBar.java: setAppearanceLightStatusBars(!style.equals("DARK"))）。
     * 另外在 Android 主题里把 windowBackground 也设成白色，兜住内容还没画上去的瞬间。
     */
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 250,
      backgroundColor: '#4c7be0',
      showSpinner: false,
    },
  },
}

export default config