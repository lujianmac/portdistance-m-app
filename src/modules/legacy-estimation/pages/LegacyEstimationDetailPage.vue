<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/legacy-estimation" /></ion-buttons><ion-title>{{ t('legacy.detailTitle') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="loading" class="empty-state"><ion-spinner name="crescent" color="primary" /></section>
      <section v-else-if="error" class="empty-state"><div class="empty-state-inner"><AlertCircle :size="34" color="#b42318" /><h2>{{ t('legacy.detailLoadFailed') }}</h2><p>{{ error }}</p><ion-button @click="load">{{ t('common.reload') }}</ion-button></div></section>
      <template v-else>
        <ion-card class="page-card"><ion-card-header><ion-card-title>{{ detail?.title || t('legacy.unnamedBudget') }}</ion-card-title><ion-card-subtitle>{{ t('legacy.viewOnly') }}</ion-card-subtitle></ion-card-header><ion-card-content><ion-note>{{ formatDateTime(detail?.createTime, t('legacy.noDate')) }}</ion-note></ion-card-content></ion-card>
        <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('legacy.resultsTitle') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div v-for="metric in resultMetrics" :key="metric.label"><small>{{ metric.label }}</small><strong>{{ metric.value }}</strong></div></div></ion-card-content></ion-card>
        <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('legacy.portRotation') }}</h2></ion-card-header><ion-list lines="full"><ion-item v-if="!ports.length"><ion-label color="medium">{{ t('legacy.noPorts') }}</ion-label></ion-item><ion-item v-for="(port, index) in ports" :key="index"><ion-label><strong>{{ index + 1 }}. {{ port.PortName || port.portName || '-' }}</strong><p>{{ port.taskTypeName || port.TaskTypeName || '' }}</p><p v-if="index > 0">{{ t('legacy.legSummary', { distance: port.Distance || port.distance || 0, days: port.SeaDays || port.seaDays || 0 }) }}</p></ion-label></ion-item></ion-list></ion-card>
        <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('legacy.cargoTitle') }}</h2></ion-card-header><ion-list lines="full"><ion-item v-if="!cargoes.length"><ion-label color="medium">{{ t('legacy.noCargoes') }}</ion-label></ion-item><ion-item v-for="(cargo, index) in cargoes" :key="index"><ion-label><strong>{{ cargo.Cargo || cargo.name || t('legacy.cargoFallback', { index: index + 1 }) }}</strong><p>{{ cargo.FromName || '-' }} → {{ cargo.ToName || '-' }}</p><p>{{ t('legacy.cargoSummary', { quantity: cargo.Quantity || 0, freight: cargo.Freight || 0, income: cargo.Income || 0 }) }}</p></ion-label></ion-item></ion-list></ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getLegacyEstimation, type LegacyEstimationDetail } from '@/api/legacy-estimation'
import { formatAmount, formatDateTime } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const route = useRoute()
const detail = ref<LegacyEstimationDetail | null>(null)
const content = ref<Record<string, any>>({})
const loading = ref(true)
const error = ref('')
const cargoes = computed<any[]>(() => Array.isArray(content.value.cargoData) ? content.value.cargoData : [])
const ports = computed<any[]>(() => Array.isArray(content.value.portData?.portOrder) ? content.value.portData.portOrder : [])
const result = computed<Record<string, any>>(() => content.value.resultData || {})
const resultMetrics = computed(() => [{ label: t('legacy.metrics.hireLevelPerDay'), value: formatAmount(result.value.HireLevelPerDay) }, { label: t('legacy.metrics.totalIncome'), value: formatAmount(result.value.TTLRevenue) }, { label: t('legacy.metrics.operatingCost'), value: formatAmount(result.value.getOpExpense) }, { label: t('legacy.metrics.operatingProfit'), value: formatAmount(result.value.OpProfit) }, { label: t('legacy.metrics.totalExpenses'), value: formatAmount(result.value.TTLExpense) }, { label: t('legacy.metrics.netProfit'), value: formatAmount(result.value.Profit) }])
onIonViewWillEnter(() => { void load() })
async function load() { const id = String(route.params.id || ''); if (!id) { error.value = t('legacy.invalidId'); loading.value = false; return }; loading.value = true; error.value = ''; try { detail.value = await getLegacyEstimation(id); const raw = detail.value.content; content.value = raw ? JSON.parse(raw) : {} } catch (cause) { error.value = cause instanceof Error ? cause.message : t('legacy.detailLoadFailed') } finally { loading.value = false } }
</script>
