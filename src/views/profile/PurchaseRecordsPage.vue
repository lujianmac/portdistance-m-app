<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons>
        <ion-title>{{ t('profile.purchases.title') }}</ion-title>
        <ion-buttons slot="end"><ion-button :aria-label="t('profile.purchases.refresh')" :disabled="loading" @click="load"><RefreshCw :size="20" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <section v-if="loading" class="empty-state"><ion-spinner name="crescent" color="primary" /></section>
      <section v-else-if="error" class="empty-state"><div class="empty-state-inner"><AlertCircle :size="34" color="#b42318" /><h2>{{ t('profile.purchases.loadFailed') }}</h2><p>{{ error }}</p><ion-button @click="load">{{ t('common.reload') }}</ion-button></div></section>
      <template v-else>
        <ion-card class="page-card">
          <ion-card-header><h2 class="page-card-title">{{ t('profile.purchases.currentSubscription') }}</h2></ion-card-header>
          <ion-card-content>
            <div v-if="activeSubscription" class="subscription-summary">
              <small>{{ t('profile.purchases.validity') }}</small>
              <strong>{{ t('profile.purchases.dateRange', { start: dateText(activeSubscription.subStartDate), end: dateText(activeSubscription.subEndDate) }) }}</strong>
              <ion-note>{{ activeSubscription.subPeriod || activeSubscription.remark || t('profile.purchases.defaultPlan') }}</ion-note>
            </div>
            <div v-else class="empty-copy">{{ t('profile.purchases.noActiveSubscription') }}</div>
          </ion-card-content>
        </ion-card>
        <ion-card class="page-card">
          <ion-card-header><h2 class="page-card-title">{{ t('profile.purchases.paymentRecords') }}</h2></ion-card-header>
          <ion-list lines="full">
            <ion-item v-if="!records.length"><ion-label color="medium">{{ t('profile.purchases.empty') }}</ion-label></ion-item>
            <ion-item v-for="record in records" :key="String(record.orderNo || record.no || record.id)">
              <ion-label><strong>{{ t('profile.purchases.orderNo', { no: record.orderNo || record.no || record.id || '-' }) }}</strong><p>{{ channelName(record.channelId) }} · {{ dateTimeText(record.createTime) }}</p></ion-label>
              <ion-note slot="end">{{ amount(record.amount) }} {{ String(record.currency || 'CNY').toUpperCase() }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { getSubscriptionAndRecords, type PayRecord, type SubscriptionRecord } from '@/api/subscription'
import { formatAmount, formatDate, formatDateTime } from '@/i18n/format'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const subscriptions = ref<SubscriptionRecord[]>([])
const records = ref<PayRecord[]>([])
const activeSubscription = computed(() => subscriptions.value.find((item) => {
  const end = toDate(item.subEndDate)
  return end && end.getTime() >= Date.now()
}) || subscriptions.value[0])

onIonViewWillEnter(() => { void load() })

async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await getSubscriptionAndRecords()
    subscriptions.value = Array.isArray(result?.subList) ? result.subList : []
    records.value = Array.isArray(result?.recordList) ? result.recordList : []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('profile.purchases.loadFailed')
  } finally {
    loading.value = false
  }
}

function toDate(value?: string | number) {
  if (value === undefined || value === null || value === '') return null
  const raw = String(value).trim()
  const numeric = /^\d+$/.test(raw) ? Number(raw) : NaN
  const date = Number.isFinite(numeric) ? new Date(raw.length <= 10 ? numeric * 1000 : numeric) : new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateText(value?: string | number) {
  const date = toDate(value)
  return formatDate(date, '-')
}

function dateTimeText(value?: string | number) {
  const date = toDate(value)
  return formatDateTime(date, t('profile.purchases.notRecorded'))
}

function amount(value?: number) {
  return formatAmount(value)
}

function channelName(channelId?: number) {
  if (channelId === 1) return t('profile.purchases.alipay')
  if (channelId === 3) return t('profile.purchases.wechatPay')
  if (channelId === 5) return 'PayPal'
  return t('profile.purchases.payment')
}
</script>

<style scoped>
.subscription-summary { display: grid; gap: 6px; }.subscription-summary small { color: #718294; font-size: 12px; }.subscription-summary strong { color: #173447; font-size: 16px; }.subscription-summary ion-note { font-size: 13px; }.empty-copy { color: #718294; font-size: 14px; }.page-card ion-item p { margin: 4px 0 0; color: #65778a; font-size: 12px; }.page-card ion-note { max-width: 38%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
