<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="budget-toolbar">
        <span slot="start" class="list-count">{{ t('budget.list.count', { count: store.list.length }) }}</span>
        <ion-buttons slot="end" class="toolbar-actions">
          <ion-button class="drafts-button" fill="outline" :aria-label="t('budget.list.draftsAria')" @click="openDrafts">
            <span>{{ t('budget.list.drafts') }}</span>
            <ion-badge v-if="store.localDrafts.length" color="primary">{{ store.localDrafts.length }}</ion-badge>
          </ion-button>
          <ion-button :aria-label="t('budget.list.createAria')" @click="createBudget">
            <Plus :size="26" />
          </ion-button>
          <ion-button :aria-label="t('budget.list.refreshAria')" :disabled="store.listLoading" @click="refresh">
            <RefreshCw :size="22" :class="{ spinning: store.listLoading }" />
          </ion-button>
          <ion-button :aria-label="t('budget.list.guideTitle')" @click="guideOpen = true">
            <Info :size="22" />
          </ion-button>
          <ion-button :aria-label="t('budget.list.legacyHistoryAria')" @click="router.push('/legacy-estimation')">
            <Archive :size="22" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="budget-list-content">
      <ion-refresher slot="fixed" @ion-refresh="refreshFromPull"><ion-refresher-content /></ion-refresher>
      <section v-if="store.listLoading && !store.list.length" class="state-page">
        <ion-spinner name="crescent" color="primary" />
        <span>{{ t('budget.list.loading') }}</span>
      </section>
      <section v-else-if="!store.list.length" class="empty-page">
        <div class="budget-guide">
          <div class="guide-head"><div><h2>{{ t('budget.list.title') }}</h2><span>{{ t('budget.list.newBadge') }}</span></div><small>{{ t('budget.list.tagline') }}</small></div>
          <p>{{ t('budget.list.intro') }}</p>
          <ul>
            <li><MapPin :size="17" />{{ t('budget.list.emptyPoint1') }}</li>
            <li><Fuel :size="17" />{{ t('budget.list.emptyPoint2') }}</li>
            <li><Calculator :size="17" />{{ t('budget.list.emptyPoint3') }}</li>
            <li><Clock3 :size="17" />{{ t('budget.list.emptyPoint4') }}</li>
          </ul>
          <ion-button expand="block" @click="createBudget"><Plus :size="18" /> {{ t('budget.list.createCta') }}</ion-button>
          <ion-button expand="block" fill="clear" @click="router.push('/legacy-estimation')">{{ t('budget.list.legacyCta') }}</ion-button>
        </div>
      </section>
      <section v-else class="budget-list">
        <article v-for="item in store.list" :key="item.id" class="budget-item">
          <div class="item-header">
            <button class="item-open-button" type="button" @click="openBudget(item.id)">
              <span class="item-name"><strong>{{ item.name || t('budget.list.unnamedBudget') }}</strong><span v-if="shipLabel(item)">{{ shipLabel(item) }}</span></span>
            </button>
          </div>
          <button class="budget-item-open" type="button" @click="openBudget(item.id)">
            <span v-if="item.deployDesc" class="budget-description">{{ item.deployDesc }}</span>
            <span v-if="item.routeSummary" class="budget-route">{{ item.routeSummary }}</span>
            <span class="budget-metrics"><span><span>{{ t('budget.list.totalIncome') }}</span><strong>{{ amount(item.ttlIncome) }}</strong></span><span><span>{{ t('budget.list.voyageCost') }}</span><strong>{{ amount(item.ttlExpense) }}</strong></span><span><span>{{ t('budget.list.netProfit') }}</span><strong :class="profitClass(item.netProfit)">{{ amount(item.netProfit) }}</strong></span><span><span>{{ t('budget.list.hireLevel') }}</span><strong>{{ amount(item.hirePerDayLevel) }}</strong></span></span>
            <span class="budget-footer"><span>{{ dateText(item.updateTime || item.createTime) }}</span><strong>{{ t('common.view') }}</strong></span>
          </button>
        </article>
        <ion-button v-if="store.hasMore" fill="clear" expand="block" :disabled="store.listLoading" @click="loadMore">{{ store.listLoading ? t('common.loadingMore') : t('common.loadMore') }}</ion-button>
        <ion-note v-else class="list-end">{{ t('budget.list.noMore') }}</ion-note>
      </section>
    </ion-content>

    <ion-modal :is-open="draftsOpen" @did-dismiss="draftsOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.list.draftsTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="draftsOpen = false">{{ t('common.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <ion-list v-if="store.localDrafts.length" inset>
          <ion-item v-for="draft in store.localDrafts" :key="draft.id">
            <ion-label><strong>{{ draft.name || t('budget.list.unnamedBudget') }}</strong><p>{{ draft.routeSummary || t('budget.list.noPorts') }}</p><p>{{ dateText(draft.updatedAt) }}</p></ion-label>
            <ion-buttons slot="end"><ion-button @click="continueDraft(draft.id)">{{ t('common.continue') }}</ion-button><ion-button color="danger" :aria-label="t('budget.list.deleteDraftTitle')" @click="deleteDraft(draft.id)"><Trash2 :size="18" /></ion-button></ion-buttons>
          </ion-item>
        </ion-list>
        <section v-else class="state-page"><FileClock :size="32" color="#6b7c8d" /><span>{{ t('budget.list.draftsEmpty') }}</span></section>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="guideOpen" @did-dismiss="guideOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.list.guideTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="guideOpen = false">{{ t('common.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content"><section class="guide-modal"><h2>{{ t('budget.list.title') }}</h2><p>{{ t('budget.list.guideSubtitle') }}</p><ion-list inset><ion-item><MapPin slot="start" :size="20" /><ion-label><strong>{{ t('budget.list.feature1Title') }}</strong><p>{{ t('budget.list.feature1Desc') }}</p></ion-label></ion-item><ion-item><Fuel slot="start" :size="20" /><ion-label><strong>{{ t('budget.list.feature2Title') }}</strong><p>{{ t('budget.list.feature2Desc') }}</p></ion-label></ion-item><ion-item><Clock3 slot="start" :size="20" /><ion-label><strong>{{ t('budget.list.feature3Title') }}</strong><p>{{ t('budget.list.feature3Desc') }}</p></ion-label></ion-item><ion-item><FileDown slot="start" :size="20" /><ion-label><strong>{{ t('budget.list.feature4Title') }}</strong><p>{{ t('budget.list.feature4Desc') }}</p></ion-label></ion-item></ion-list><ion-button expand="block" @click="createFromGuide">{{ t('budget.list.createCta') }}</ion-button></section></ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, Calculator, Clock3, FileClock, FileDown, Fuel, Info, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { alertController, IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonModal, IonNote, IonPage, IonRefresher, IonRefresherContent, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { formatAmount, formatDateTime } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { VoyageBudgetListItem } from '@/types'

const router = useRouter()
const { t } = useI18n()
const store = useEstiDeployStore()
const draftsOpen = ref(false)
const guideOpen = ref(false)

onIonViewWillEnter(() => {
  void store.loadLocalDrafts()
  if (store.shouldRefreshList()) void refresh()
})

async function refresh() { await store.loadPage(true).catch(() => undefined) }
async function loadMore() { await store.loadPage().catch(() => undefined) }
async function refreshFromPull(event: CustomEvent) { await refresh(); event.detail.complete() }
function createBudget() { store.resetDraft(); void router.push('/esti-deploy/editor') }
function createFromGuide() { guideOpen.value = false; createBudget() }
function openBudget(id: number) { void router.push(`/esti-deploy/detail/${id}`) }
function openDrafts() { void store.loadLocalDrafts(); draftsOpen.value = true }
async function continueDraft(id: string) { try { await store.loadLocalDraft(id); draftsOpen.value = false; await router.push({ name: 'esti-deploy-editor', query: { fromDraft: '1' } }) } catch { /* the list remains available if a corrupt draft cannot load */ } }
async function deleteDraft(id: string) { const alert = await alertController.create({ header: t('budget.list.deleteDraftTitle'), message: t('budget.list.deleteMessage'), buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'confirm', cssClass: 'alert-button-danger' }] }); await alert.present(); const result = await alert.onDidDismiss(); if (result.role === 'confirm') await store.deleteLocalDraft(id) }
function amount(value?: number | string) { const numeric = Number(value ?? 0); return formatAmount(Number.isFinite(numeric) ? numeric : 0) }
function profitClass(value?: number | string) { return Number(value || 0) < 0 ? 'profit-negative' : 'profit-positive' }
function dateText(value?: string | number) { return formatDateTime(value, t('budget.list.notSaved')) }
function shipLabel(item: VoyageBudgetListItem) { return String(item.shipName || item.shipId || '').trim() }
</script>

<style scoped>
.list-count { padding-left: 16px; color: #667085; font-size: 14px; white-space: nowrap; }/* 工具栏右侧按钮之间的间距 */ .toolbar-actions { gap: 8px; }/* 草稿按钮线框：`fill` 是 DOM property（不反射成 attribute），Ionic 又只在 md 模式下绘制 outline 边框，所以显式声明边框变量并给 iOS 单独补一条 1px 线框 */ .drafts-button { min-width: 72px; --color: #0058a2; --border-width: 1px; --border-style: solid; --border-color: #0058a2; --border-radius: 7px; font-size: 13px; }.drafts-button:not(.md) { --border-width: 0; box-sizing: border-box; border: 1px solid var(--border-color, #0058a2); border-radius: var(--border-radius); }.drafts-button ion-badge { margin-left: 4px; }.spinning { animation: spin 850ms linear infinite; }.budget-list { padding: 12px 12px calc(18px + env(safe-area-inset-bottom)); }.budget-item { display: block; margin-bottom: 10px; padding: 13px; border: 1px solid #dce6ef; border-radius: 8px; background: #fff; }.item-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }.item-open-button, .budget-item-open { min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; }.item-open-button { flex: 1; }.item-open-button:active, .budget-item-open:active { opacity: .72; }.budget-item-open { display: block; width: 100%; }.item-name { display: block; min-width: 0; }.item-name strong, .item-name span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.item-name strong { color: #1d2939; font-size: 16px; }.item-name span { margin-top: 4px; color: #667085; font-size: 13px; }.budget-description, .budget-route { display: block; margin: 10px 0 0; overflow: hidden; color: #667085; font-size: 14px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }.budget-route { margin-top: 4px; color: #005f88; }.budget-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 12px; padding: 11px 0; border-top: 1px solid #edf1f5; border-bottom: 1px solid #edf1f5; }.budget-metrics > span { min-width: 0; padding: 0 7px; }.budget-metrics > span + span { border-left: 1px solid #edf1f5; }.budget-metrics span, .budget-metrics strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.budget-metrics > span > span { color: #718293; font-size: 11px; }.budget-metrics strong { margin-top: 5px; color: #263f51; font-size: 13px; }.budget-footer { display: flex; justify-content: space-between; margin-top: 11px; color: #8a98a6; font-size: 13px; }.budget-footer strong { color: #005f88; font-weight: 600; }.list-end { display: block; padding: 18px; color: #789; text-align: center; }.state-page { display: grid; min-height: 50vh; place-items: center; align-content: center; gap: 12px; color: #718293; }.empty-page { display: grid; min-height: calc(100% - 4px); place-items: center; padding: 18px 14px calc(20px + env(safe-area-inset-bottom)); }.budget-guide { width: min(100%, 420px); padding: 18px; border: 1px solid #d8e5ef; border-radius: 8px; background: #fff; }.guide-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }.guide-head h2 { margin: 0; color: #173447; font-size: 19px; }.guide-head span { display: block; margin-top: 4px; color: #005f88; font-size: 12px; font-weight: 700; }.guide-head small { color: #087443; font-size: 11px; text-align: right; }.budget-guide > p { margin: 14px 0; color: #526879; font-size: 14px; line-height: 1.55; }.budget-guide ul { display: grid; gap: 10px; margin: 0 0 16px; padding: 0; list-style: none; }.budget-guide li { display: flex; align-items: center; gap: 9px; color: #344d60; font-size: 13px; }.budget-guide li svg { color: #005f88; }.budget-guide ion-button { margin: 7px 0 0; }.modal-content { --padding-top: 14px; --padding-bottom: calc(20px + env(safe-area-inset-bottom)); --padding-start: 12px; --padding-end: 12px; }.guide-modal { padding: 4px 2px; }.guide-modal h2 { margin: 0; color: #173447; font-size: 19px; }.guide-modal > p { margin: 10px 0 14px; color: #64778a; font-size: 14px; line-height: 1.5; }.guide-modal ion-button { margin: 12px 0 0; } @keyframes spin { to { transform: rotate(360deg); } }
</style>
