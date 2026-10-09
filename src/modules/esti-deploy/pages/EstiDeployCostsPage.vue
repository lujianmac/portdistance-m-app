<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.costs.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.costs.hireTitle') }}</h2></ion-card-header><ion-list lines="full"><ion-item><ion-input :value="valueText(store.document.costs.hirePerDay)" :label="t('budget.pages.costs.hirePerDay')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hirePerDay', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.costs.hireCommPercent)" :label="t('budget.pages.costs.hireComm')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hireCommPercent', $event)" /></ion-item><ion-item><ion-input :value="valueText(store.document.costs.fixedCost)" :label="t('budget.pages.costs.fixedCost')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('fixedCost', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></ion-list></ion-card>
      <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.costs.operatingTitle') }}</h2></ion-card-header><ion-list lines="full"><ion-item><ion-input :value="valueText(store.document.costs.ilohc)" :label="t('budget.pages.costs.holdCleaning')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('ilohc', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.costs.cev)" :label="t('budget.pages.costs.crewAllowance')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('cev', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.costs.inspection)" :label="t('budget.pages.costs.inspection')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('inspection', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.costs.opOther)" :label="t('budget.pages.costs.otherOperating')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('opOther', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></ion-list></ion-card>
      <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.costs.marginTitle') }}</h2></ion-card-header><ion-list lines="full"><ion-item><ion-select :value="store.document.margins.portIdleMode" :label="t('budget.pages.costs.portIdleMode')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portIdleMode', $event)"><ion-select-option value="days">{{ t('budget.pages.costs.marginDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.pages.costs.portIdlePercent') }}</ion-select-option></ion-select></ion-item><ion-item><ion-input :value="valueText(store.document.margins.portIdleValue)" :label="store.document.margins.portIdleMode === 'percent' ? t('budget.pages.costs.portIdlePercentLabel') : t('budget.pages.costs.portIdleDaysLabel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portIdleValue', $event)" /></ion-item><ion-item><ion-select :value="store.document.margins.portWorkingMode" :label="t('budget.pages.costs.portWorkingMode')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portWorkingMode', $event)"><ion-select-option value="days">{{ t('budget.pages.costs.marginDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.pages.costs.portWorkingPercent') }}</ion-select-option></ion-select></ion-item><ion-item><ion-input :value="valueText(store.document.margins.portWorkingValue)" :label="store.document.margins.portWorkingMode === 'percent' ? t('budget.pages.costs.portWorkingPercentLabel') : t('budget.pages.costs.portWorkingDaysLabel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portWorkingValue', $event)" /></ion-item></ion-list><ion-card-content><ion-note>{{ t('budget.pages.costs.marginSummary', { idle: formatNumber(store.document.margins.portIdleDays), working: formatNumber(store.document.margins.portWorkingDays) }) }}</ion-note></ion-card-content></ion-card>
      <ion-card v-if="store.document.routeCalculated" class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.costs.summary') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.costs.fuelCost') }}</small><strong>{{ amount(store.document.results.totalFuelCost) }}</strong></div><div><small>{{ t('budget.pages.costs.portCharges') }}</small><strong>{{ amount(store.document.results.totalPortCharge) }}</strong></div><div><small>{{ t('budget.pages.costs.operatingCost') }}</small><strong>{{ amount(store.document.results.operatingCost) }}</strong></div><div><small>{{ t('budget.pages.costs.totalExpense') }}</small><strong>{{ amount(store.document.results.totalExpense) }}</strong></div></div></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useI18n } from 'vue-i18n'
import { formatAmount, formatNumber } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetCosts, BudgetMargins } from '@/types'

const { t } = useI18n()
const store = useEstiDeployStore()
function valueText(value: number) { return String(Number(value || 0)) }
function updateCost(field: keyof BudgetCosts, event: CustomEvent) { store.updateCosts({ [field]: Number(event.detail.value || 0) }) }
function updateMarginMode(field: 'portIdleMode' | 'portWorkingMode', event: CustomEvent) { const value = event.detail.value === 'percent' ? 'percent' : 'days'; store.updateMargins({ [field]: value } as Partial<BudgetMargins>) }
function updateMarginValue(field: 'portIdleValue' | 'portWorkingValue', event: CustomEvent) { store.updateMargins({ [field]: Number(event.detail.value || 0) }) }
function amount(value: number) { return formatAmount(value) }
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

.page-card { margin: 0 0 10px; border: 1px solid #dce6ef; border-radius: 6px; box-shadow: none; }
.page-card ion-card-header { padding: 11px 11px 6px; }
.page-card ion-card-content { padding: 6px 11px 11px; }
.page-card ion-list { margin: 0; padding: 0; }
.page-card ion-item { --min-height: 52px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
