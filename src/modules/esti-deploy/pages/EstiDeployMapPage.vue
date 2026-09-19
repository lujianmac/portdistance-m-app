<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ readonly ? t('budget.map.title.readonly') : t('budget.map.title.edit') }}</ion-title></ion-toolbar></ion-header>
    <ion-content :scroll-y="false"><div v-if="!document.mapRoute?.rawRoutePoints.length" class="map-empty"><MapPinned :size="34" /><h2>{{ t('budget.map.empty.title') }}</h2><p>{{ t('budget.map.empty.description') }}</p><ion-button @click="router.push('/esti-deploy/editor')">{{ t('budget.map.empty.action') }}</ion-button></div><BudgetMapWorkspace v-else ref="mapWorkspace" :ports="document.ports" :raw-route-points="document.mapRoute.rawRoutePoints" :readonly="readonly" @route-recalculate="recalculateFromMap" @geometry-updated="applyGeometry" /><div v-if="updating" class="map-updating"><ion-spinner name="crescent" /><span>{{ t('budget.map.updating') }}</span></div></ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewDidEnter, toastController } from '@ionic/vue'
import { MapPinned } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppBackButton from '@/components/AppBackButton.vue'
import BudgetMapWorkspace from '@/modules/esti-deploy/components/BudgetMapWorkspace.vue'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { LocalRouteGeometry } from '@/utils/route'
import type { Port } from '@/types/protocol'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const store = useEstiDeployStore()
const document = computed(() => store.document)
const readonly = computed(() => String(route.query.readonly || '') === '1')
const updating = ref(false)
const mapWorkspace = ref<{ invalidateSize: () => void } | null>(null)

onIonViewDidEnter(async () => {
  await nextTick()
  requestAnimationFrame(() => mapWorkspace.value?.invalidateSize())
})

async function recalculateFromMap(payload: { ports: Port[]; excludedRoutePointIds: number[] }) {
  if (readonly.value || updating.value) return
  updating.value = true
  try {
    const updated = await store.applyMapPortSequence(payload.ports, payload.excludedRoutePointIds)
    if (!updated) throw new Error(t('budget.map.updateFailed'))
    const toast = await toastController.create({ message: t('budget.map.updated'), color: 'success', duration: 2000, position: 'top' })
    await toast.present()
  } catch (cause) {
    const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.map.updateFailed'), color: 'danger', duration: 2400, position: 'top' })
    await toast.present()
  } finally {
    updating.value = false
  }
}

async function applyGeometry(geometry: LocalRouteGeometry) {
  if (readonly.value) return
  try {
    store.applyMapGeometry(geometry)
    const toast = await toastController.create({ message: t('budget.map.geometryUpdated'), duration: 1800, position: 'top' })
    await toast.present()
  } catch (cause) {
    const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.map.updateFailed'), color: 'danger', duration: 2400, position: 'top' })
    await toast.present()
  }
}
</script>

<style scoped>
.map-empty { display: grid; height: 100%; place-items: center; align-content: center; gap: 10px; padding: 28px; color: #64748b; text-align: center; }.map-empty h2 { margin: 0; color: #173447; font-size: 20px; }.map-empty p { margin: 0 0 10px; }.map-updating { position: absolute; inset: 0; z-index: 1000; display: grid; place-content: center; gap: 12px; color: #fff; background: rgba(23, 52, 71, .35); text-align: center; }
</style>
