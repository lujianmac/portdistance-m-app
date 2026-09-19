<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('ships.list.title') }}</ion-title><ion-buttons slot="end"><ion-button :aria-label="t('common.refresh')" :disabled="loading" @click="load(true)"><RefreshCw :size="20" /></ion-button><ion-button :aria-label="t('ships.addTitle')" @click="router.push('/ships/editor')"><Plus :size="21" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="loading && !ships.length" class="empty-state"><ion-spinner name="crescent" color="primary" /></section>
      <section v-else-if="!ships.length" class="empty-state"><div class="empty-state-inner"><ShipWheel :size="34" color="#006c8c" /><h2>{{ t('ships.list.emptyTitle') }}</h2><p>{{ t('ships.list.emptyHint') }}</p><ion-button @click="router.push('/ships/editor')"><Plus :size="18" /> {{ t('ships.addTitle') }}</ion-button></div></section>
      <ion-list v-else inset><ion-item v-for="ship in ships" :key="ship.id" button detail @click="router.push({ name: 'ship-editor', query: { id: ship.id } })"><ion-label><strong>{{ ship.shipName }}</strong><p>{{ t('ships.list.meta', { flag: ship.flag, type: ship.shipType, year: ship.buildYear }) }}</p><p>{{ t('ships.list.dimensions', { dwt: formatAmount(ship.dwt), length: formatAmount(ship.shipLength), breadth: formatAmount(ship.breadth) }) }}</p></ion-label></ion-item></ion-list>
      <ion-button v-if="hasMore && ships.length" expand="block" fill="clear" :disabled="loading" @click="load()">{{ loading ? t('common.loading') : t('common.loadMore') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, RefreshCw, ShipWheel } from 'lucide-vue-next'
import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getShipSpecificationPage, type ShipSpecification } from '@/api/esti-deploy'
import { formatAmount } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const router = useRouter()
const ships = ref<ShipSpecification[]>([])
const loading = ref(false)
const hasMore = ref(true)
let pageNo = 1
onIonViewWillEnter(() => { void load(true) })
async function load(reset = false) { if (loading.value || (!reset && !hasMore.value)) return; if (reset) { pageNo = 1; hasMore.value = true }; loading.value = true; try { const result = await getShipSpecificationPage({ pageNo, pageSize: 20 }); const incoming = Array.isArray(result?.list) ? result.list : []; ships.value = reset ? incoming : [...ships.value, ...incoming]; hasMore.value = incoming.length >= 20; if (hasMore.value) pageNo += 1 } finally { loading.value = false } }
</script>
