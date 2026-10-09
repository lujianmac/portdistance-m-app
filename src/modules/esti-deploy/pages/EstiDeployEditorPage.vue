<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/tabs/esti-deploy" /></ion-buttons>
        <ion-title>{{ store.editorMode === 'edit' ? t('budget.pages.editor.titleEdit') : t('budget.pages.editor.titleCreate') }}</ion-title>
        <ion-buttons slot="end"><ion-button :aria-label="t('budget.pages.editor.saveDraftLabel')" @click="saveDraft"><FileDown :size="20" /></ion-button><ion-button :aria-label="t('budget.pages.editor.saveLabel')" :disabled="store.saving" @click="save"><Save :size="20" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <ion-list lines="full">
        <ion-item><ion-input v-model.trim="store.name" :label="t('budget.pages.editor.nameLabel')" label-placement="floating" :maxlength="80" :placeholder="t('budget.pages.editor.namePlaceholder')" /></ion-item>
        <ion-item><ion-select :value="store.shipId" :label="t('budget.pages.editor.shipLabel')" label-placement="floating" interface="popover" :placeholder="t('budget.pages.editor.shipPlaceholder')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectShip"><ion-select-option value="">{{ t('budget.pages.editor.shipNone') }}</ion-select-option><ion-select-option v-for="ship in store.vessels" :key="ship.id" :value="ship.id">{{ ship.shipName }}</ion-select-option></ion-select></ion-item>
        <ion-item><ion-textarea v-model="store.deployDesc" :label="t('budget.pages.editor.notesLabel')" label-placement="floating" :auto-grow="true" :maxlength="300" :placeholder="t('budget.pages.editor.notesPlaceholder')" /></ion-item>
      </ion-list>
      <ion-modal :keep-contents-mounted="true"><ion-datetime id="budget-start-at" presentation="date-time" :locale="locale" :value="store.document.startAt" @ion-change="updateStartAt" /></ion-modal>
      
      <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.editor.sections') }}</h2></ion-card-header><ion-list lines="full"><ion-item button detail @click="router.push('/esti-deploy/editor/ports')"><MapPin slot="start" :size="20" /><ion-label>{{ t('budget.pages.editor.ports') }}<p>{{ store.routeSummary || t('budget.pages.editor.portsHint') }}</p></ion-label><ion-note slot="end">{{ store.document.routeCalculated ? t('budget.pages.ports.distance', { value: formatNumber(store.document.results.totalDistanceNm) }) : t('budget.pages.editor.notCalculated') }}</ion-note></ion-item><ion-item button detail @click="router.push('/esti-deploy/editor/cargo')"><PackageOpen slot="start" :size="20" /><ion-label>{{ t('budget.pages.editor.cargo') }}<p>{{ store.document.cargos.length ? t('budget.pages.editor.cargoCount', { count: store.document.cargos.length }) : t('budget.pages.editor.cargoEmpty') }}</p></ion-label></ion-item><ion-item button detail @click="router.push('/esti-deploy/editor/fuel')"><Fuel slot="start" :size="20" /><ion-label>{{ t('budget.pages.editor.fuel') }}<p>{{ t('budget.pages.editor.fuelHint') }}</p></ion-label></ion-item><ion-item button detail @click="router.push('/esti-deploy/editor/prices')"><CircleDollarSign slot="start" :size="20" /><ion-label>{{ t('budget.pages.editor.prices') }}<p>LSFO、HSFO、LSDO/MGO</p></ion-label></ion-item><ion-item button detail @click="router.push('/esti-deploy/editor/costs')"><ReceiptText slot="start" :size="20" /><ion-label>{{ t('budget.pages.editor.costs') }}<p>{{ t('budget.pages.editor.costsHint') }}</p></ion-label></ion-item></ion-list></ion-card>
      <ion-item><ion-label>{{ t('budget.pages.editor.startAt') }}</ion-label><ion-datetime-button datetime="budget-start-at" /></ion-item>

      <ion-card class="page-card"><ion-card-header><div class="result-head"><h2 class="page-card-title">{{ t('budget.pages.editor.results') }}</h2><ion-note>{{ t('budget.pages.editor.autoCalculated') }}</ion-note></div></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.editor.totalIncome') }}</small><strong>{{ amount(store.document.results.totalIncome) }}</strong></div><div><small>{{ t('budget.pages.editor.totalExpense') }}</small><strong>{{ amount(store.document.results.totalExpense) }}</strong></div><div><small>{{ t('budget.pages.editor.operatingProfit') }}</small><strong :class="profitClass(store.document.results.operatingProfit)">{{ amount(store.document.results.operatingProfit) }}</strong></div><div><small>{{ t('budget.pages.editor.netProfit') }}</small><strong :class="profitClass(store.document.results.netProfit)">{{ amount(store.document.results.netProfit) }}</strong></div></div><ion-button v-if="store.document.mapRoute?.rawRoutePoints.length" expand="block" fill="outline" class="map-preview-button" @click="router.push('/esti-deploy/map')"><Map :size="18" /> {{ t('budget.pages.editor.viewMap') }}</ion-button></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { ref } from 'vue'
import { CircleDollarSign, FileDown, Fuel, Map, MapPin, PackageOpen, ReceiptText, Save } from 'lucide-vue-next'
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, onIonViewWillEnter, toastController } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatAmount, formatNumber } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'

const { t, locale } = useI18n()
const store = useEstiDeployStore()
const router = useRouter()
const route = useRoute()
const loadedId = ref('')
const initialized = ref(false)

function preservesCurrentDocument() {
  return route.query.fromDistance === '1'
    || route.query.fromDraft === '1'
    || route.query.fromDetail === '1'
}

onIonViewWillEnter(async () => {
  await Promise.all([store.loadFuelTemplates().catch(() => undefined), store.loadVessels().catch(() => undefined)])
  const id = String(route.query.id || '')
  if (id && id !== loadedId.value) {
    await store.loadDetail(Number(id))
    loadedId.value = id
  } else if (!id && !initialized.value && !preservesCurrentDocument()) {
    store.resetDraft()
  }
  initialized.value = true
})

function selectShip(event: CustomEvent) { const id = String(event.detail.value || ''); store.shipId = id; store.shipName = store.vessels.find((ship) => ship.id === id)?.shipName || '' }
function updateStartAt(event: CustomEvent) { const value = event.detail.value; if (typeof value === 'string') store.updateStartAt(value) }
function amount(value: number) { return formatAmount(value) }
function profitClass(value: number) { return value < 0 ? 'profit-negative' : 'profit-positive' }
async function saveDraft() { try { const draft = await store.saveLocalDraft(); const toast = await toastController.create({ message: draft ? t('budget.pages.editor.draftSaved') : t('budget.pages.editor.draftEmpty'), duration: 1800, position: 'top' }); await toast.present() } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.editor.draftFailed'), duration: 2200, color: 'danger', position: 'top' }); await toast.present() } }
async function save() { try { const id = await store.save(); const toast = await toastController.create({ message: t('budget.pages.editor.saved'), duration: 1500, color: 'success', position: 'top' }); await toast.present(); await router.replace(`/esti-deploy/detail/${id}`) } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.editor.saveFailed'), duration: 2200, color: 'danger', position: 'top' }); await toast.present() } }
</script>

<style scoped>
.result-head { display: flex; justify-content: space-between; align-items: baseline; }.map-preview-button { margin: 16px 0 0; }.page-card ion-item p { margin: 4px 0 0; color: #6b7c8d; font-size: 12px; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
