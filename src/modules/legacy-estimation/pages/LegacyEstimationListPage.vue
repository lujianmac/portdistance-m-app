<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <AppBackButton default-href="/tabs/esti-deploy" />
        </ion-buttons>
        <ion-title>{{ t('legacy.listTitle') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :aria-label="t('common.refresh')" :disabled="loading" @click="refresh">
            <RefreshCw :size="20" :class="{ spinning: loading }" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refreshFromPull">
        <ion-refresher-content />
      </ion-refresher>

      <section v-if="loading && !items.length" class="empty-state">
        <ion-spinner name="crescent" color="primary" />
      </section>

      <section v-else-if="error && !items.length" class="empty-state">
        <div class="empty-state-inner">
          <AlertCircle :size="34" color="#b42318" />
          <h2>{{ t('legacy.loadFailed') }}</h2>
          <p>{{ error }}</p>
          <ion-button @click="refresh">{{ t('common.reload') }}</ion-button>
        </div>
      </section>

      <section v-else-if="!items.length" class="empty-state">
        <div class="empty-state-inner">
          <Archive :size="34" color="#6b7c8d" />
          <h2>{{ t('legacy.emptyTitle') }}</h2>
          <p>{{ t('legacy.emptyHint') }}</p>
        </div>
      </section>

      <template v-else>
        <ion-list inset>
          <ion-item v-for="item in items" :key="String(item.id)" button detail @click="openDetail(item)">
            <ion-label>
              <strong class="item-title">{{ item.title || t('legacy.unnamedBudget') }}</strong>
              <p v-if="item.shipName" class="item-ship">{{ t('legacy.shipName', { value: item.shipName }) }}</p>
              <p class="item-time">{{ formatDateTime(item.createTime, t('legacy.noDate')) }}</p>
            </ion-label>
            <ion-badge v-if="isLegacyEstimationRow(item)" slot="end" color="medium">
              {{ t('legacy.oldVersionBadge') }}
            </ion-badge>
          </ion-item>
        </ion-list>

        <p v-if="error" class="inline-error">{{ error }}</p>

        <ion-button v-if="hasMore" expand="block" fill="clear" :disabled="loading" @click="loadMore">
          {{ loading ? t('common.loadingMore') : t('common.loadMore') }}
        </ion-button>
        <ion-note v-else class="list-end">{{ t('common.noMore') }}</ion-note>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle, Archive, RefreshCw } from 'lucide-vue-next'
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getLegacyEstimationPage,
  isLegacyEstimationRow,
  type LegacyEstimationListItem,
} from '@/api/legacy-estimation'
import { formatDateTime } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

/** Rows per request; the endpoint is shared with the new budget list. */
const PAGE_SIZE = 10

const { t } = useI18n()
const router = useRouter()

const items = ref<LegacyEstimationListItem[]>([])
const loading = ref(false)
const hasMore = ref(true)
const error = ref('')
const nextPageNo = ref(1)

onIonViewWillEnter(() => {
  // Entering the detail page and coming back keeps the loaded rows untouched.
  if (!items.value.length) void refresh()
})

async function refresh() {
  await load(true)
}

async function loadMore() {
  await load(false)
}

async function refreshFromPull(event: CustomEvent) {
  await refresh()
  event.detail.complete()
}

function openDetail(item: LegacyEstimationListItem) {
  void router.push(`/legacy-estimation/${item.id}`)
}

function pageRows(page: { list?: LegacyEstimationListItem[] } | null | undefined) {
  return Array.isArray(page?.list) ? page.list : []
}

async function load(reset: boolean) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  error.value = ''
  const pageNo = reset ? 1 : nextPageNo.value

  try {
    const rows = pageRows(await getLegacyEstimationPage(pageNo, PAGE_SIZE))
    items.value = reset ? rows : [...items.value, ...rows]
    // Same rule as the old app: a short (or empty) page means the backend has no more.
    hasMore.value = rows.length >= PAGE_SIZE
    if (hasMore.value) nextPageNo.value = pageNo + 1
  } catch (cause) {
    // Keep the rows already on screen and surface the failure next to them.
    error.value = cause instanceof Error ? cause.message : t('legacy.loadFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.spinning {
  animation: spin 850ms linear infinite;
}

.item-title {
  display: block;
  color: #173447;
  font-size: 15px;
}

.item-ship,
.item-time {
  color: #6e8192;
  font-size: 12px;
}

.list-end {
  display: block;
  padding: 16px;
  color: #6e8192;
  font-size: 12px;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
