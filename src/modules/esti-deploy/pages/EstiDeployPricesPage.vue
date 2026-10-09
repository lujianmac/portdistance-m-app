<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.prices.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.mainFuelType') }}</h2></ion-card-header>
        <ion-card-content><ion-segment :value="mainFuelType" @ion-change="setMainFuelType"><ion-segment-button :value="'LSFO'"><ion-label>{{ t('budget.pages.prices.fuelTypeLsfo') }}</ion-label></ion-segment-button><ion-segment-button :value="'HSFO'"><ion-label>{{ t('budget.pages.prices.fuelTypeHsfo') }}</ion-label></ion-segment-button></ion-segment></ion-card-content>
      </ion-card>
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.unitPrices') }}</h2></ion-card-header>
        <ion-card-content class="field-grid">
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.prices.lsfoPrice)" :label="t('budget.pages.prices.fuelTypeLsfo')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('lsfoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.prices.hsfoPrice)" :label="t('budget.pages.prices.fuelTypeHsfo')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('hsfoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
          </div>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.prices.mgoPrice)" :label="t('budget.pages.prices.fuelTypeMgo')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('mgoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
          </div>
          <p class="field-hint">{{ t('budget.pages.prices.defaultNote') }}</p>
        </ion-card-content>
      </ion-card>
      <ion-card v-if="store.document.routeCalculated" class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.fuelCost') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.prices.mainFuelCost', { type: mainFuelType }) }}</small><strong>{{ amount(store.document.results.nonEcaFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.ecaMainEngineCost') }}</small><strong>{{ amount(store.document.results.ecaFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.seaAuxCost') }}</small><strong>{{ amount(store.document.results.seaAuxFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.portFuelCost') }}</small><strong>{{ amount(store.document.results.portFuelCost) }}</strong></div></div><div class="fuel-total"><span>{{ t('budget.pages.prices.total') }}</span><strong>{{ amount(store.document.results.totalFuelCost) }}</strong></div></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { computed } from 'vue'
import { IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useI18n } from 'vue-i18n'
import { formatAmount } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetFuelPrices, MainFuelType } from '@/types'

const { t } = useI18n()
const store = useEstiDeployStore()
const mainFuelType = computed<MainFuelType>(() => store.document.fuel.ladenFuelType === 'HSFO' || store.document.fuel.ballastFuelType === 'HSFO' ? 'HSFO' : 'LSFO')
function valueText(value: number) { return String(Number(value || 0)) }
function updatePrice(field: keyof BudgetFuelPrices, event: CustomEvent) { store.updatePrices({ [field]: Number(event.detail.value || 0) }) }
function setMainFuelType(event: CustomEvent) { const fuelType = event.detail.value as MainFuelType; if (fuelType !== 'HSFO' && fuelType !== 'LSFO') return; store.updateFuel({ ladenFuelType: fuelType, ballastFuelType: fuelType }) }
function amount(value: number) { return formatAmount(value) }
</script>

<style scoped>
/* 参考小程序 BudgetFuelPanel：页面左右 gutter 20~24rpx（这里取 12px），
   卡片内边距 22rpx（11px），单价两列成对、列表项不再叠加 16px 内边距 */
.page-content {
  --padding-top: 10px;
  --padding-bottom: calc(16px + env(safe-area-inset-bottom));
  --padding-start: 12px;
  --padding-end: 12px;
}

.page-card { margin: 0 0 10px; border: 1px solid #dce6ef; border-radius: 6px; box-shadow: none; }
.page-card ion-card-header { padding: 11px 11px 6px; }
.page-card ion-card-content { padding: 6px 11px 11px; }

.field-row { display: flex; align-items: flex-start; gap: 12px; }
.field-row + .field-row { margin-top: 2px; }
.field-row > .field-item { flex: 1 1 0; min-width: 0; }
.field-item { --min-height: 52px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.field-hint { margin: 8px 0 0; color: #98a2b3; font-size: 12px; line-height: 1.45; }
.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }
.fuel-total { display: flex; align-items: baseline; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e8ed; color: #173447; }
.fuel-total strong { color: #006c8c; font-size: 18px; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
