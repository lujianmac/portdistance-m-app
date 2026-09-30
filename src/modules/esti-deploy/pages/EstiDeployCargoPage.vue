<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons><ion-title>{{ t('budget.pages.cargo.title') }}</ion-title><ion-buttons slot="end"><ion-button :aria-label="t('budget.pages.cargo.addLabel')" :disabled="store.document.ports.length < 2" @click="addCargo"><Plus :size="21" /></ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="store.document.ports.length < 2" class="empty-state"><div class="empty-state-inner"><PackageOpen :size="34" color="#006c8c" /><h2>{{ t('budget.pages.cargo.needPortsTitle') }}</h2><p>{{ t('budget.pages.cargo.needPortsDesc') }}</p><ion-button @click="router.push('/esti-deploy/editor/ports')">{{ t('budget.pages.cargo.editPorts') }}</ion-button></div></section>
      <section v-else-if="!store.document.cargos.length" class="empty-state"><div class="empty-state-inner"><PackageOpen :size="34" color="#006c8c" /><h2>{{ t('budget.pages.cargo.emptyTitle') }}</h2><p>{{ t('budget.pages.cargo.emptyDesc') }}</p><ion-button @click="addCargo"><Plus :size="18" /> {{ t('budget.pages.cargo.add') }}</ion-button></div></section>
      <ion-accordion-group v-else :multiple="true" :value="[]">
        <ion-accordion v-for="(cargo, index) in store.document.cargos" :key="cargo.id" :value="cargo.id">
          <ion-item slot="header" color="light"><ion-label><strong>{{ cargo.name || t('budget.pages.cargo.numberedName', { index: index + 1 }) }}</strong><p>{{ portName(cargo.loadPortId) }} → {{ portName(cargo.dischargePortId) }}</p></ion-label><ion-note slot="end">{{ amount(cargo.income) }}</ion-note></ion-item>
          <div slot="content" class="cargo-editor"><ion-list lines="full"><ion-item><ion-input :value="cargo.name" :label="t('budget.pages.cargo.nameLabel')" label-placement="floating" :placeholder="t('budget.pages.cargo.namePlaceholder')" @ion-input="updateText(index, 'name', $event)" /></ion-item><ion-item><ion-select :value="cargo.loadPortId" :label="t('budget.pages.cargo.loadPort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateText(index, 'loadPortId', $event)"><ion-select-option v-for="port in availablePorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item><ion-item><ion-select :value="cargo.dischargePortId" :label="t('budget.pages.cargo.dischargePort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateText(index, 'dischargePortId', $event)"><ion-select-option v-for="port in availablePorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item><ion-item><ion-input :value="String(cargo.quantity)" :label="t('budget.pages.cargo.quantity')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'quantity', $event)" /></ion-item><ion-item><ion-input :value="String(cargo.freight)" :label="t('budget.pages.cargo.freight')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'freight', $event)" /></ion-item><ion-item><ion-input :value="String(cargo.addCommRate)" :label="t('budget.pages.cargo.addressCommission')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'addCommRate', $event)" /></ion-item><ion-item><ion-input :value="String(cargo.brokerageRate)" :label="t('budget.pages.cargo.brokerage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'brokerageRate', $event)" /></ion-item><ion-item><ion-input :value="String(cargo.frtTaxRate)" :label="t('budget.pages.cargo.otherTaxes')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'frtTaxRate', $event)" /></ion-item><ion-item><ion-input :value="String(cargo.demurrage)" :label="t('budget.pages.cargo.demurrage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'demurrage', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="String(cargo.dispatch)" :label="t('budget.pages.cargo.dispatch')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber(index, 'dispatch', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></ion-list><div class="cargo-result"><span>{{ t('budget.pages.cargo.income') }}</span><strong>{{ amount(cargo.income) }}</strong></div><ion-button expand="block" fill="clear" color="danger" @click="store.removeCargo(index)"><Trash2 :size="17" /> {{ t('budget.pages.cargo.remove') }}</ion-button></div>
        </ion-accordion>
      </ion-accordion-group>
      <ion-card v-if="store.document.cargos.length" class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('budget.pages.cargo.summary') }}</h2></ion-card-header><ion-card-content><div class="metric-grid"><div><small>{{ t('budget.pages.cargo.totalIncome') }}</small><strong>{{ amount(store.document.results.totalIncome) }}</strong></div><div><small>{{ t('budget.pages.cargo.netIncome') }}</small><strong>{{ amount(store.document.results.netIncome) }}</strong></div></div></ion-card-content></ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PackageOpen, Plus, Trash2 } from 'lucide-vue-next'
import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/vue'
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
</script>

<style scoped>
ion-accordion { margin-bottom: 8px; overflow: hidden; border: 1px solid #dce5eb; border-radius: 8px; }.cargo-editor { padding: 5px 8px 12px; background: #fff; }.cargo-editor ion-list { margin: 0; }.field-unit { flex: none; align-self: center; margin-inline-start: 6px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }.cargo-result { display: flex; justify-content: space-between; margin: 12px; padding: 12px; border-radius: 6px; background: #edf7f7; color: #365268; }.cargo-result strong { color: #006c8c; }.cargo-editor ion-button { margin: 0; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
