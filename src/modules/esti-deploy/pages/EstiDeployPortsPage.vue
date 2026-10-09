<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.ports.title') }}</ion-title><ion-buttons slot="end"><ion-button :aria-label="t('budget.pages.ports.addLabel')" :disabled="store.document.routeCalculated" @click="pickerOpen = true"><Plus :size="21" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="!store.document.ports.length" class="empty-state"><div class="empty-state-inner"><MapPin :size="34" color="#006c8c" /><h2>{{ t('budget.pages.ports.emptyTitle') }}</h2><p>{{ t('budget.pages.ports.emptyDesc') }}</p><ion-button @click="pickerOpen = true"><Plus :size="18" /> {{ t('budget.pages.ports.addLabel') }}</ion-button></div></section>
      <ion-accordion-group v-else :multiple="true" :value="[]">
        <ion-accordion v-for="(port, index) in store.document.ports" :key="port.id" :value="port.id">
          <ion-item slot="header" color="light" class="port-header-item"><ion-label><strong>{{ index + 1 }}. {{ port.port.portName || t('budget.pages.ports.unnamedPort') }}</strong><p>{{ port.taskType === 'routing' ? t('budget.pages.ports.routing') : t('budget.pages.ports.legStatus', { task: taskLabel(port.taskType), status: port.isLaden ? t('budget.pages.ports.laden') : t('budget.pages.ports.ballast'), speed: port.speedMode === 'eco' ? t('budget.pages.ports.ecoSpeed') : t('budget.pages.ports.fullSpeed') }) }}</p></ion-label><ion-note slot="end" v-if="index > 0 && store.document.routeCalculated">{{ t('budget.pages.ports.distance', { value: formatNumber(port.distanceNm) }) }}</ion-note></ion-item>
          <div slot="content" class="port-editor">
            <ion-list lines="full">
              <ion-item><ion-select :value="port.taskType" :label="t('budget.pages.ports.taskType')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" :disabled="store.document.routeCalculated || port.taskType === 'routing'" @ion-change="updateTask(index, $event)"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
              <ion-item v-if="port.taskType !== 'routing'"><ion-select :value="port.isLaden ? 'laden' : 'ballast'" :label="t('budget.pages.ports.nextLegStatus')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" :disabled="store.document.routeCalculated || index === store.document.ports.length - 1" @ion-change="updateLaden(index, $event)"><ion-select-option value="laden">{{ t('budget.pages.ports.laden') }}</ion-select-option><ion-select-option value="ballast">{{ t('budget.pages.ports.ballast') }}</ion-select-option></ion-select></ion-item>
              <ion-item v-if="port.taskType !== 'routing'"><ion-select :value="port.speedMode" :label="t('budget.pages.ports.nextLegSpeed')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" :disabled="store.document.routeCalculated || index === store.document.ports.length - 1" @ion-change="updateSpeedMode(index, $event)"><ion-select-option value="full">{{ t('budget.pages.ports.fullSpeed') }}</ion-select-option><ion-select-option value="eco">{{ t('budget.pages.ports.ecoSpeed') }}</ion-select-option></ion-select></ion-item>
              <ion-item v-if="port.taskType !== 'routing'"><ion-input :value="String(port.idleDays)" :label="t('budget.pages.ports.idleDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'idleDays', $event)" /></ion-item>
              <ion-item v-if="port.taskType !== 'routing'"><ion-input :value="String(port.workDays)" :label="t('budget.pages.ports.workDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'workDays', $event)" /></ion-item>
              <ion-item v-if="port.taskType !== 'routing'"><ion-input :value="String(port.portCharge)" :label="t('budget.pages.ports.portCharge')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'portCharge', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
              <ion-item v-if="index > 0 && port.taskType !== 'routing'"><ion-select :value="port.weatherMarginMode" :label="t('budget.pages.ports.weatherMargin')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateWeatherMode(index, $event)"><ion-select-option value="none">{{ t('budget.pages.ports.weatherMarginNone') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.pages.ports.weatherMarginPercent') }}</ion-select-option><ion-select-option value="days">{{ t('budget.pages.ports.weatherMarginDays') }}</ion-select-option></ion-select></ion-item>
              <ion-item v-if="index > 0 && port.weatherMarginMode !== 'none'"><ion-input :value="String(port.weatherMarginValue)" :label="port.weatherMarginMode === 'percent' ? t('budget.pages.ports.weatherMarginPercentLabel') : t('budget.pages.ports.weatherMarginDaysLabel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'weatherMarginValue', $event)" /></ion-item>
            </ion-list>
            <div v-if="store.document.routeCalculated && index > 0" class="port-metrics"><span>{{ t('budget.pages.ports.distance', { value: formatNumber(port.distanceNm) }) }}</span><span>{{ t('budget.pages.ports.eca', { value: formatNumber(port.ecaDistanceNm) }) }}</span><span>{{ t('budget.pages.ports.seaDays', { value: formatNumber(port.seaDays) }) }}</span></div>
            <div class="port-actions"><ion-button fill="clear" color="medium" :disabled="store.document.routeCalculated || index === 0" @click="store.movePort(index, 'up')"><ChevronUp :size="17" /> {{ t('budget.pages.ports.moveUp') }}</ion-button><ion-button fill="clear" color="medium" :disabled="store.document.routeCalculated || index === store.document.ports.length - 1" @click="store.movePort(index, 'down')"><ChevronDown :size="17" /> {{ t('budget.pages.ports.moveDown') }}</ion-button><ion-button fill="clear" color="danger" :disabled="store.document.routeCalculated" @click="store.removePort(index)"><Trash2 :size="17" /> {{ t('budget.pages.ports.remove') }}</ion-button></div>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>
    <ion-footer v-if="store.document.ports.length"><ion-toolbar><div class="route-footer"><ion-button v-if="!store.document.routeCalculated" :disabled="!store.canCalculateRoute" @click="calculateRoute">{{ store.calculatingRoute ? t('budget.pages.ports.calculating') : t('budget.pages.ports.calculate') }}</ion-button><ion-button v-else fill="outline" color="medium" @click="store.resetRoute">{{ t('budget.pages.ports.resetRoute') }}</ion-button><ion-button v-if="store.document.routeCalculated" fill="outline" @click="router.push('/esti-deploy/map')"><Map :size="17" /> {{ t('budget.pages.ports.viewMap') }}</ion-button></div></ion-toolbar></ion-footer>

    <!-- Add port: task picker + search field + suggestion rows (mirrors the mini program port picker) -->
    <ion-modal :is-open="pickerOpen" @did-dismiss="pickerOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.pages.ports.addTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="pickerOpen = false">{{ t('common.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="page-content">
        <ion-item lines="full" class="field-item">
          <ion-select v-model="newTask" :label="t('budget.pages.ports.taskType')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select>
        </ion-item>
        <ion-item lines="none" class="search-field">
          <Search slot="start" :size="18" aria-hidden="true" />
          <ion-input :value="keyword" :placeholder="t('budget.pages.ports.searchPlaceholder')" :aria-label="t('budget.pages.ports.searchPlaceholder')" type="text" inputmode="search" enterkeyhint="search" @ion-input="onKeywordInput" />
          <button v-if="keyword" slot="end" class="search-clear" type="button" :aria-label="t('common.clear')" @click="clearKeyword"><X :size="16" /></button>
        </ion-item>
        <ion-list lines="full" class="port-results">
          <ion-item v-if="store.searchingPorts"><ion-label color="medium">{{ t('budget.pages.ports.searching') }}</ion-label></ion-item>
          <ion-item v-else-if="!keyword.trim()"><ion-label color="medium">{{ t('budget.pages.ports.searchHint') }}</ion-label></ion-item>
          <ion-item v-else-if="!store.portSuggestions.length"><ion-label color="medium">{{ t('budget.pages.ports.searchEmpty') }}</ion-label></ion-item>
          <template v-else>
            <ion-item v-for="port in store.portSuggestions" :key="port.portId" button :detail="false" @click="selectPort(port)">
              <ion-label><strong>{{ portName(port) }}</strong><p v-if="portSubtitle(port)">{{ portSubtitle(port) }}</p></ion-label>
            </ion-item>
          </template>
        </ion-list>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, Map, MapPin, Plus, Search, Trash2, X } from 'lucide-vue-next'
import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetPortTask, PortInfo } from '@/types'

const { t } = useI18n()
const store = useEstiDeployStore()
const router = useRouter()
const pickerOpen = ref(false)
const keyword = ref('')
const newTask = ref<BudgetPortTask>('load')
const taskKeys: Array<{ value: BudgetPortTask; key: string }> = [
  { value: 'ballast', key: 'budget.pages.task.ballast' },
  { value: 'load', key: 'budget.pages.task.load' },
  { value: 'discharge', key: 'budget.pages.task.discharge' },
  { value: 'bunker', key: 'budget.pages.task.bunker' },
  { value: 'canal', key: 'budget.pages.task.canal' },
  { value: 'pass', key: 'budget.pages.task.pass' },
  { value: 'snug', key: 'budget.pages.task.snug' },
  { value: 'repair', key: 'budget.pages.task.repair' },
  { value: 'transit', key: 'budget.pages.task.transit' },
]
const taskOptions = computed(() => taskKeys.map((item) => ({ value: item.value, label: t(item.key) })))
function taskLabel(value: BudgetPortTask) { const item = taskKeys.find((option) => option.value === value); return item ? t(item.key) : t('budget.pages.ports.routing') }
function portName(port: PortInfo) { return port.portName || t('budget.pages.ports.unnamedPort') }
function portSubtitle(port: PortInfo) {
  const country = String(port.countryCode || '').trim().toUpperCase()
  const fullName = String(port.fullName || '').trim()
  return [fullName && fullName !== port.portName ? fullName : '', country].filter(Boolean).join(' · ')
}
function onKeywordInput(event: CustomEvent) { keyword.value = String(event.detail?.value || ''); void store.searchPorts(keyword.value) }
function clearKeyword() { keyword.value = ''; void store.searchPorts('') }
function selectPort(port: PortInfo) { store.addPort(port, newTask.value); keyword.value = ''; void store.searchPorts(''); pickerOpen.value = false }
function updateTask(index: number, event: CustomEvent) { store.updatePort(index, { taskType: event.detail.value as BudgetPortTask }) }
function updateLaden(index: number, event: CustomEvent) { store.updatePort(index, { isLaden: event.detail.value === 'laden' }) }
function updateSpeedMode(index: number, event: CustomEvent) { store.updatePort(index, { speedMode: event.detail.value === 'eco' ? 'eco' : 'full' }) }
function updateWeatherMode(index: number, event: CustomEvent) { store.updatePort(index, { weatherMarginMode: event.detail.value }) }
function updateNumber(index: number, field: 'idleDays' | 'workDays' | 'portCharge' | 'weatherMarginValue', event: CustomEvent) { store.updatePort(index, { [field]: Number(event.detail.value || 0) }) }
async function calculateRoute() { try { const ok = await store.calculateRoute(); if (!ok) throw new Error(t('budget.pages.ports.calculateFailed')) } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.ports.calculateFailed'), color: 'danger', duration: 2200, position: 'top' }); await toast.present() } }
</script>

<style scoped>
/* 参考小程序：页面左右 gutter 20~24rpx（这里取 12px），卡片内边距 22rpx（11px），
   列表项不再叠加 16px 内边距 */
.page-content {
  --padding-top: 10px;
  --padding-bottom: calc(16px + env(safe-area-inset-bottom));
  --padding-start: 12px;
  --padding-end: 12px;
}

.empty-state { padding: 24px 12px; }

ion-accordion { margin-bottom: 8px; border: 1px solid #dce6ef; border-radius: 6px; overflow: hidden; }
.port-header-item { --padding-start: 10px; --padding-end: 10px; }
.port-editor { padding: 4px 10px 10px; background: #fff; }
.port-editor ion-list { margin: 0; }
.port-editor ion-item { --min-height: 56px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.port-editor ion-label p { margin: 4px 0 0; color: #65778a; font-size: 12px; }
.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }
.port-metrics { display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 11px 0; color: #496070; font-size: 12px; }
.port-actions { display: flex; justify-content: flex-end; gap: 2px; }
.route-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 6px 12px; }
.route-footer ion-button { margin: 0; }

/* 搜索字段与结果列表 */
.field-item { --min-height: 52px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.port-results { margin: 10px 0 0; border-top: 1px solid #edf1f5; }
.port-results ion-item { --min-height: 56px; --padding-start: 2px; --padding-end: 2px; --inner-padding-end: 0; }
.port-results ion-label p { margin: 3px 0 0; color: #98a2b3; font-size: 12px; }

/*
 * 搜索框用 ion-item + ion-input 而不是 ion-searchbar：iOS 下 ion-searchbar 的
 * 可视输入框高度被 shadow DOM 固定在 36px（--min-height，无 part / 变量可覆盖）。
 * 这里与航程页保持一致：56px、无边框、圆角 8px。
 */
.search-field {
  height: 56px;
  margin-top: 10px;
  --min-height: 56px;
  --background: #ffffff;
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 4px;
  --inner-border-width: 0;
  border: 1px solid #d6e2ef;
  border-radius: 8px;
}

.search-field svg { flex: none; color: #1d4b7f; }

.search-field ion-input {
  min-width: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 8px;
  --padding-end: 4px;
}

.search-clear {
  display: grid;
  flex: none;
  width: 26px;
  height: 26px;
  margin-right: 4px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #eef3f8;
  color: #64748b;
}

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
