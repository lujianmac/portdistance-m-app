<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.prices.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.mainFuelType') }}</h2></ion-card-header>
        <ion-card-content><ion-segment :value="mainFuelType" @ion-change="setMainFuelType"><ion-segment-button value="LSFO"><ion-label>LSFO</ion-label></ion-segment-button><ion-segment-button value="HSFO"><ion-label>HSFO</ion-label></ion-segment-button></ion-segment></ion-card-content>
      </ion-card>
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.unitPrices') }}</h2></ion-card-header>
        <ion-list lines="full"><ion-item><ion-input :value="valueText(store.document.prices.lsfoPrice)" label="LSFO" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('lsfoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.prices.hsfoPrice)" label="HSFO" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('hsfoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="valueText(store.document.prices.mgoPrice)" label="LSDO/MGO" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('mgoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></ion-list>
        <ion-card-content><ion-note>{{ t('budget.pages.prices.defaultNote') }}</ion-note></ion-card-content>
      </ion-card>
      <ion-card v-if="store.document.routeCalculated" class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.prices.fuelCost') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.prices.mainFuelCost', { type: mainFuelType }) }}</small><strong>{{ amount(store.document.results.nonEcaFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.ecaMainEngineCost') }}</small><strong>{{ amount(store.document.results.ecaFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.seaAuxCost') }}</small><strong>{{ amount(store.document.results.seaAuxFuelCost) }}</strong></div><div><small>{{ t('budget.pages.prices.portFuelCost') }}</small><strong>{{ amount(store.document.results.portFuelCost) }}</strong></div></div><div class="fuel-total"><span>{{ t('budget.pages.prices.total') }}</span><strong>{{ amount(store.document.results.totalFuelCost) }}</strong></div></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue'
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
.page-card ion-list { margin: 0; }.page-card ion-item { --padding-start: 16px; --padding-end: 16px; }.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }.fuel-total { display: flex; align-items: baseline; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e8ed; color: #173447; }.fuel-total strong { color: #006c8c; font-size: 18px; }
</style>
