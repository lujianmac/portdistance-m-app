import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import { bootstrapNativeRuntime } from '@/platform/bootstrap'
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

async function start() {
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
}

void start()
