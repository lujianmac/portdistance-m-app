<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.cargo.title') }}</ion-title><ion-buttons slot="end"><ion-button :aria-label="t('budget.pages.cargo.addLabel')" :disabled="store.document.ports.length < 2" @click="addCargo"><Plus :size="21" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="store.document.ports.length < 2" class="empty-state"><div class="empty-state-inner"><PackageOpen :size="34" color="#006c8c" /><h2>{{ t('budget.pages.cargo.needPortsTitle') }}</h2><p>{{ t('budget.pages.cargo.needPortsDesc') }}</p><ion-button @click="router.push('/esti-deploy/editor/ports')">{{ t('budget.pages.cargo.editPorts') }}</ion-button></div></section>
      <section v-else-if="!store.document.cargos.length" class="empty-state"><div class="empty-state-inner"><PackageOpen :size="34" color="#006c8c" /><h2>{{ t('budget.pages.cargo.emptyTitle') }}</h2><p>{{ t('budget.pages.cargo.emptyDesc') }}</p><ion-button @click="addCargo"><Plus :size="18" /> {{ t('budget.pages.cargo.add') }}</ion-button></div></section>
      <ion-accordion-group v-else :multiple="true" :value="[]">
        <ion-accordion v-for="(cargo, index) in store.document.cargos" :key="cargo.id" :value="cargo.id">
          <ion-item slot="header" color="light" class="cargo-header-item"><ion-label><strong>{{ cargo.name || t('budget.pages.cargo.numberedName', { index: index + 1 }) }}</strong><p>{{ portName(cargo.loadPortId) }} → {{ portName(cargo.dischargePortId) }}</p></ion-label><ion-note slot="end">{{ amount(cargo.income) }}</ion-note></ion-item>
          <!-- New cargo: name -> port hint -> load/discharge ports -> quantity/freight -> income -> commissions -> demurrage/dispatch (mirrors the mini program cargo sheet) -->
          <div slot="content" class="cargo-editor">
            <ion-item lines="full" class="field-item">
              <ion-input :value="cargo.name" :label="t('budget.pages.cargo.nameLabel')" label-placement="floating" :placeholder="t('budget.pages.cargo.namePlaceholder')" @ion-input="updateText(index, 'name', $event)" />
            </ion-item>
            <p class="field-hint">{{ t('budget.pages.cargo.portHint') }}</p>
            <div class="field-row">
              <ion-item lines="full" class="field-item"><ion-select :value="cargo.loadPortId" :label="t('budget.pages.cargo.loadPort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateText(index, 'loadPortId', $event)"><ion-select-option v-for="port in availablePorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item>
              <ion-item lines="full" class="field-item"><ion-select :value="cargo.dischargePortId" :label="t('budget.pages.cargo.dischargePort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateText(index, 'dischargePortId', $event)"><ion-select-option v-for="port in availablePorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item>
            </div>
            <div class="field-row">
              <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.quantity)" :label="t('budget.pages.cargo.quantity')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'quantity', $event)" /></ion-item>
              <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.freight)" :label="t('budget.pages.cargo.freight')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'freight', $event)" /></ion-item>
            </div>
            <div class="cargo-result"><span>{{ t('budget.pages.cargo.income') }}</span><strong>{{ amount(cargo.income) }}</strong></div>
            <div class="field-row charge-row">
              <div class="charge-field">
                <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.addCommRate)" :label="t('budget.pages.cargo.addressCommission')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'addCommRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
                <p class="charge-calculated"><span>{{ t('budget.pages.cargo.addCommAmount') }}</span><strong>{{ commission(cargo, 'addCommRate') }}</strong></p>
              </div>
              <div class="charge-field">
                <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.brokerageRate)" :label="t('budget.pages.cargo.brokerage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'brokerageRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
                <p class="charge-calculated"><span>{{ t('budget.pages.cargo.brokerageAmount') }}</span><strong>{{ commission(cargo, 'brokerageRate') }}</strong></p>
              </div>
              <div class="charge-field">
                <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.frtTaxRate)" :label="t('budget.pages.cargo.otherTaxes')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'frtTaxRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
                <p class="charge-calculated"><span>{{ t('budget.pages.cargo.taxAmount') }}</span><strong>{{ commission(cargo, 'frtTaxRate') }}</strong></p>
              </div>
            </div>
            <div class="field-row">
              <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.demurrage)" :label="t('budget.pages.cargo.demurrage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'demurrage', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
              <ion-item lines="full" class="field-item"><ion-input :value="String(cargo.dispatch)" :label="t('budget.pages.cargo.dispatch')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'dispatch', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
            </div>
            <ion-button expand="block" fill="clear" color="danger" class="cargo-remove" @click="store.removeCargo(index)"><Trash2 :size="17" /> {{ t('budget.pages.cargo.remove') }}</ion-button>
          </div>
        </ion-accordion>
      </ion-accordion-group>
      <ion-card v-if="store.document.cargos.length" class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.cargo.summary') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.cargo.totalIncome') }}</small><strong>{{ amount(store.document.results.totalIncome) }}</strong></div><div><small>{{ t('budget.pages.cargo.netIncome') }}</small><strong>{{ amount(store.document.results.netIncome) }}</strong></div></div></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { computed } from 'vue'
import { PackageOpen, Plus, Trash2 } from 'lucide-vue-next'
import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatAmount } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetCargo } from '@/types'

const { t } = useI18n()
const router = useRouter()
const store = useEstiDeployStore()
const availablePorts = computed(() => store.document.ports.filter((port) => port.taskType !== 'routing'))
function addCargo() { store.addCargo() }
function updateText(index: number, field: 'name' | 'loadPortId' | 'dischargePortId', event: CustomEvent) { store.updateCargo(index, { [field]: String(event.detail.value || '') } as Partial<BudgetCargo>) }
function updateNumber(index: number, field: 'quantity' | 'freight' | 'addCommRate' | 'brokerageRate' | 'frtTaxRate' | 'demurrage' | 'dispatch', event: CustomEvent) { store.updateCargo(index, { [field]: Number(event.detail.value || 0) } as Partial<BudgetCargo>) }
function portName(id: string) { return availablePorts.value.find((port) => port.id === id)?.port.portName || t('common.notSelected') }
function amount(value: number) { return formatAmount(value) }
/** Same formula as the detail page: the store keeps `income = quantity × freight`. */
function commission(cargo: BudgetCargo, field: 'addCommRate' | 'brokerageRate' | 'frtTaxRate') { return formatAmount((Number(cargo.income) || 0) * (Number(cargo[field]) || 0) / 100) }
</script>

<style scoped>
/* 参考小程序：页面左右 gutter 20~24rpx（这里取 12px），卡片内边距 22rpx（11px），
   字段成对排布，列表项不再叠加 16px 内边距 */
.page-content {
  --padding-top: 10px;
  --padding-bottom: calc(16px + env(safe-area-inset-bottom));
  --padding-start: 12px;
  --padding-end: 12px;
}

.empty-state { padding: 24px 12px; }

.page-card { margin: 0 0 10px; border: 1px solid #dce6ef; border-radius: 6px; box-shadow: none; }
.page-card ion-card-header { padding: 11px 11px 6px; }
.page-card ion-card-content { padding: 6px 11px 11px; }

ion-accordion { margin-bottom: 8px; overflow: hidden; border: 1px solid #dce6ef; border-radius: 6px; }
.cargo-header-item { --padding-start: 10px; --padding-end: 10px; }
.cargo-editor { padding: 4px 10px 8px; background: #fff; }
.field-row { display: flex; align-items: flex-start; gap: 12px; }
.field-row + .field-row { margin-top: 2px; }
.field-row > .field-item { flex: 1 1 0; min-width: 0; }
.field-item { --min-height: 52px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.field-hint { margin: 4px 0 6px; color: #98a2b3; font-size: 12px; line-height: 1.45; }
/* 三列佣金/税费，与小程序 charge-calculated 一致：费率一格、计算金额一行 */
.charge-row { gap: 8px; }
.charge-field { flex: 1 1 0; min-width: 0; }
.charge-calculated { display: flex; align-items: center; justify-content: space-between; gap: 3px; min-height: 27px; margin: 6px 0 0; padding: 0 5px; border-radius: 3px; background: #f2f7fc; }
.charge-calculated span { color: #667085; font-size: 12px; }
.charge-calculated strong { color: #0058a2; font-size: 13px; font-weight: 700; }
.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }
.cargo-result { display: flex; align-items: baseline; justify-content: space-between; margin: 10px 0; padding: 10px 12px; border-radius: 6px; background: #f2f7fc; color: #365268; }
.cargo-result strong { color: #006c8c; }
.cargo-remove { margin: 4px 0 0; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
