import { createApp, nextTick } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import { SPLASH_FALLBACK_MS, bootstrapNativeRuntime, hideSplashScreen } from '@/platform/bootstrap'
import { i18n, t } from '@/i18n'
import router from '@/router'
import { pinia } from '@/stores/pinia'
import { useLocaleStore } from '@/stores/locale'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'
import 'leaflet/dist/leaflet.css'
import '@/theme/variables.css'
import '@/styles/app.css'
import '@/styles/leaflet-map.css'

/** 等两帧：第一帧把新 DOM 交给合成器，第二帧回调触发时说明首屏这一帧已经上屏。 */
function waitForFirstPaintedFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	})
}

/** 首屏挂载后移除 index.html 里的启动占位背景（正常流程它一直躲在启动图下面，看不见）。 */
function removeBootPlaceholder() {
	document.getElementById('boot-placeholder')?.remove()
}

async function start() {
	// 兜底计时必须在第一步就起来：启动链路卡死时也不能让用户永远停在启动图上。
	const splashFallback = window.setTimeout(() => void hideSplashScreen(), SPLASH_FALLBACK_MS)
	try {
		await bootstrapNativeRuntime()
		// The stored language preference is available once the native storage is hydrated.
		const locale = useLocaleStore(pinia)
		locale.initLocale()

		const app = createApp(App)
			.use(pinia)
			.use(i18n)
			.use(IonicVue, { backButtonText: t('common.back') })
			.use(router)

		// Follow the device language while the user keeps the "system" preference.
		window.addEventListener('languagechange', () => locale.refreshSystemLocale())

		await router.isReady()
		app.mount('#app')
		removeBootPlaceholder()
		// 关键：mount 只代表 DOM 建好了，此刻浏览器还没画过一帧。等首屏真的上屏后再收启动图，
		// 否则启动图先消失、内容后出现，中间的白屏就是用户看到的那段空白（弱网下 = 整个 API 等待时间）。
		await nextTick()
		await waitForFirstPaintedFrame()
	} finally {
		// 正常路径在这里收启动图；启动抛错时也走这里，保证启动图不会一直挂着。
		window.clearTimeout(splashFallback)
		await hideSplashScreen()
	}
}

void start()
