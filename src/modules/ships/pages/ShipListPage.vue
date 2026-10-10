<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons>
        <ion-title>{{ t('ships.list.title') }}</ion-title>
        <ion-buttons slot="end" class="toolbar-actions">
          <ion-button :aria-label="t('common.refresh')" :disabled="loading" @click="load(true)"><RefreshCw :size="20" /></ion-button>
          <ion-button class="add-button" :aria-label="t('ships.addTitle')" @click="openEditor"><Plus :size="26" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <section v-if="loading && !ships.length" class="state-page">
        <ion-spinner name="crescent" color="primary" />
        <span>{{ t('ships.loading') }}</span>
      </section>
      <section v-else-if="!ships.length" class="empty-state">
        <div class="empty-state-inner">
          <h2>{{ t('ships.list.empty') }}</h2>
          <ion-button fill="clear" @click="openEditor"><Plus :size="18" /> {{ t('ships.addTitle') }}</ion-button>
        </div>
      </section>
      <ion-list v-else lines="full">
        <ion-item v-for="ship in ships" :key="ship.id" button :detail="false" @click="openDetail(ship.id)">
          <ion-label>
            <div class="ship-name">{{ ship.shipName }}</div>
            <div class="ship-time">{{ shipTime(ship.createTime) }}</div>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-button v-if="hasMore && ships.length" expand="block" fill="clear" :disabled="loading" @click="load()">{{ loading ? t('common.loading') : t('common.loadMore') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getShipSpecificationPage, type ShipSpecification } from '@/api/esti-deploy'
import { formatDateTime } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const router = useRouter()
const ships = ref<ShipSpecification[]>([])
const loading = ref(false)
const hasMore = ref(true)
let pageNo = 1

onIonViewWillEnter(() => { void load(true) })

function openEditor() { void router.push({ name: 'ship-editor' }) }

function openDetail(id: string) { void router.push({ name: 'ship-view', query: { id } }) }

/** `YYYY-MM-DD HH:MM` for the active locale; empty when the server sent no timestamp. */
function shipTime(value?: string | number) { return value ? formatDateTime(value, '') : '' }

async function load(reset = false) {
  if (loading.value || (!reset && !hasMore.value)) return
  if (reset) { pageNo = 1; hasMore.value = true }
  loading.value = true
  try {
    const result = await getShipSpecificationPage({ pageNo, pageSize: 20 })
    const incoming = Array.isArray(result?.list) ? result.list : []
    ships.value = reset ? incoming : [...ships.value, ...incoming]
    hasMore.value = incoming.length >= 20
    if (hasMore.value) pageNo += 1
  } catch {
    // 接口失败时保留已有列表（与老 app 一致）
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.state-page {
  display: grid;
  min-height: 50vh;
  align-content: center;
  place-items: center;
  gap: 12px;
  color: #718293;
}

/* 工具栏右侧按钮之间的间距：Ionic 默认每个按钮自带 margin-inline 2px（相邻两键实际 4px），
   这里再加 6px（原来 0px，+6px） */
.toolbar-actions {
  gap: 6px;
}

/* 新增按钮与工具栏最右端的留白：md 工具栏 --padding-end 0、ios 4px，按钮自带 2px，
   这里补 18px（原来 6px，+12px） */
.add-button {
  margin-inline-end: 18px;
}

.ship-name {
  margin: 4px 0;
  color: #1d2939;
  font-weight: 500;
}

.ship-time {
  color: #667085;
  font-size: 13px;
}
</style>
