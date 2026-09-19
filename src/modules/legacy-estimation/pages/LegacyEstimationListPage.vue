<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/esti-deploy" /></ion-buttons><ion-title>{{ t('legacy.listTitle') }}</ion-title><ion-buttons slot="end"><ion-button :aria-label="t('common.refresh')" :disabled="loading" @click="load(true)"><RefreshCw :size="20" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="loading && !items.length" class="empty-state"><ion-spinner name="crescent" color="primary" /></section>
      <section v-else-if="error && !items.length" class="empty-state"><div class="empty-state-inner"><AlertCircle :size="34" color="#b42318" /><h2>{{ t('legacy.loadFailed') }}</h2><p>{{ error }}</p><ion-button @click="load(true)">{{ t('common.reload') }}</ion-button></div></section>
      <section v-else-if="!items.length" class="empty-state"><div class="empty-state-inner"><Archive :size="34" color="#6b7c8d" /><h2>{{ t('legacy.emptyTitle') }}</h2><p>{{ t('legacy.emptyHint') }}</p></div></section>
      <ion-list v-else inset><ion-item v-for="item in items" :key="String(item.id)" button detail @click="router.push(`/legacy-estimation/${item.id}`)"><ion-label><strong>{{ item.title || t('legacy.unnamedBudget') }}</strong><p v-if="item.shipName">{{ item.shipName }}</p><p>{{ formatDateTime(item.createTime, t('legacy.noDate')) }}</p></ion-label><ion-note slot="end">{{ t('legacy.readOnly') }}</ion-note></ion-item></ion-list>
      <p v-if="error && items.length" class="inline-error">{{ error }}</p>
      <ion-button v-if="hasMore && items.length" expand="block" fill="clear" :disabled="loading" @click="load()">{{ loading ? t('common.loading') : t('common.loadMore') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle, Archive, RefreshCw } from 'lucide-vue-next'
import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getLegacyEstimationPage, type LegacyEstimationListItem } from '@/api/legacy-estimation'
import { formatDateTime } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const router = useRouter()
const items = ref<LegacyEstimationListItem[]>([])
const loading = ref(false)
const hasMore = ref(true)
const error = ref('')
let pageNo = 1
onIonViewWillEnter(() => { if (!items.value.length) void load(true) })
async function load(reset = false) { if (loading.value || (!reset && !hasMore.value)) return; if (reset) { pageNo = 1; hasMore.value = true }; loading.value = true; error.value = ''; try { const result = await getLegacyEstimationPage(pageNo, 20); const next = Array.isArray(result?.list) ? result.list : []; items.value = reset ? next : [...items.value, ...next]; hasMore.value = next.length >= 20; if (hasMore.value) pageNo += 1 } catch (cause) { error.value = cause instanceof Error ? cause.message : t('legacy.loadFailed') } finally { loading.value = false } }
</script>
