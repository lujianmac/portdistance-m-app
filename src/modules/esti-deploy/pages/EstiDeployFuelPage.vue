<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/esti-deploy/editor" /></ion-buttons>
        <ion-title>{{ t('budget.pages.fuel.title') }}</ion-title>
        <ion-buttons slot="end"><ion-button :aria-label="t('budget.pages.fuel.manageLabel')" @click="templatesOpen = true"><Settings2 :size="20" /></ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card">
        <ion-card-header><div class="section-heading"><h2 class="page-card-title">{{ t('budget.pages.fuel.templateTitle') }}</h2><ion-button fill="clear" size="small" @click="templatesOpen = true">{{ t('budget.pages.fuel.manage') }}</ion-button></div></ion-card-header>
        <ion-card-content>
          <ion-select :value="store.document.fuelTemplateId || ''" :label="t('budget.pages.fuel.selectTemplateLabel')" fill="outline" label-placement="floating" interface="popover" :placeholder="t('budget.pages.fuel.templateNone')" :aria-label="t('budget.pages.fuel.selectTemplateLabel')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectTemplate">
            <ion-select-option value="">{{ t('budget.pages.fuel.templateNone') }}</ion-select-option>
            <ion-select-option v-for="template in store.fuelTemplates" :key="template.id" :value="String(template.id)">{{ template.name }}</ion-select-option>
          </ion-select>
          <div class="template-save-row">
            <ion-input v-model.trim="templateName" :label="t('budget.pages.fuel.templateNameLabel')" fill="outline" label-placement="floating" :placeholder="t('budget.pages.fuel.templateNamePlaceholder')" :aria-label="t('budget.pages.fuel.templateNameLabel')" />
            <ion-button fill="outline" :disabled="!templateName" @click="saveTemplate">{{ t('common.save') }}</ion-button>
          </div>
          <ion-button v-if="selectedTemplate" fill="clear" size="small" @click="updateTemplate">{{ t('budget.pages.fuel.updateTemplate', { name: selectedTemplate.name }) }}</ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.fuel.daily') }}</h2></ion-card-header>
        <ion-list lines="full">
          <ion-item><ion-input :value="valueText(store.document.fuel.seaLadenFuel)" :label="t('budget.pages.fuel.seaLadenFuel')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaLadenFuel', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.fuel.seaBallastFuel)" :label="t('budget.pages.fuel.seaBallastFuel')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaBallastFuel', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.fuel.seaAuxFuel)" :label="t('budget.pages.fuel.seaAuxFuel')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaAuxFuel', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.fuel.portIdleFuel)" :label="t('budget.pages.fuel.portIdleFuel')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portIdleFuel', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.fuel.portWorkingFuel)" :label="t('budget.pages.fuel.portWorkingFuel')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portWorkingFuel', $event)" /></ion-item>
        </ion-list>
      </ion-card>

      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.fuel.speeds') }}</h2></ion-card-header>
        <ion-list lines="full">
          <ion-item><ion-input :value="valueText(store.document.speeds.ballastFullSpeed)" :label="t('budget.pages.fuel.ballastFullSpeed')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastFullSpeed', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.speeds.ballastEcoSpeed)" :label="t('budget.pages.fuel.ballastEcoSpeed')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastEcoSpeed', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.speeds.ladenFullSpeed)" :label="t('budget.pages.fuel.ladenFullSpeed')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenFullSpeed', $event)" /></ion-item>
          <ion-item><ion-input :value="valueText(store.document.speeds.ladenEcoSpeed)" :label="t('budget.pages.fuel.ladenEcoSpeed')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenEcoSpeed', $event)" /></ion-item>
        </ion-list>
      </ion-card>
    </ion-content>

    <ion-modal :is-open="templatesOpen" @did-dismiss="templatesOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.pages.fuel.templateTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="templatesOpen = false">{{ t('common.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="page-content">
        <ion-list v-if="store.fuelTemplates.length" inset>
          <ion-item v-for="template in store.fuelTemplates" :key="template.id">
            <ion-label><strong>{{ template.name }}</strong><p>{{ t('budget.pages.fuel.templateSummary', { laden: template.seaLadenFuel, ballast: template.seaBallastFuel, aux: template.seaAuxFuel }) }}</p></ion-label>
            <ion-buttons slot="end"><ion-button @click="applyTemplate(template)">{{ t('budget.pages.fuel.use') }}</ion-button><ion-button color="danger" :aria-label="t('budget.pages.fuel.removeLabel')" @click="confirmRemoveTemplate(template.id)"><Trash2 :size="18" /></ion-button></ion-buttons>
          </ion-item>
        </ion-list>
        <section v-else class="empty-state"><div class="empty-state-inner"><Fuel :size="32" color="#6b7c8d" /><h2>{{ t('budget.pages.fuel.templateEmptyTitle') }}</h2><p>{{ t('budget.pages.fuel.templateEmptyDesc') }}</p></div></section>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Fuel, Settings2, Trash2 } from 'lucide-vue-next'
import { alertController, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useI18n } from 'vue-i18n'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetFuelInput, BudgetSpeedProfile, DailyFuelTemplate } from '@/types'

const { t } = useI18n()
const store = useEstiDeployStore()
const templatesOpen = ref(false)
const templateName = ref('')
const selectedTemplate = computed(() => store.fuelTemplates.find((item) => String(item.id) === String(store.document.fuelTemplateId || '')))

function valueText(value: number) { return String(Number(value || 0)) }
function updateFuel(field: Exclude<keyof BudgetFuelInput, 'ladenFuelType' | 'ballastFuelType'>, event: CustomEvent) { store.updateFuel({ [field]: Number(event.detail.value || 0) }) }
function updateSpeed(field: keyof BudgetSpeedProfile, event: CustomEvent) { store.updateSpeeds({ [field]: Number(event.detail.value || 0) }) }
function selectTemplate(event: CustomEvent) { const id = String(event.detail.value || ''); const template = store.fuelTemplates.find((item) => String(item.id) === id); if (template) store.applyFuelTemplate(template); else store.setFuelTemplateId() }
function currentTemplate(name: string): DailyFuelTemplate { const { fuel, speeds } = store.document; return { id: '', name, seaLadenFuel: fuel.seaLadenFuel, seaBallastFuel: fuel.seaBallastFuel, seaAuxFuel: fuel.seaAuxFuel, portIdleFuel: fuel.portIdleFuel, portWorkingFuel: fuel.portWorkingFuel, ballastFullSpeed: speeds.ballastFullSpeed, ballastEcoSpeed: speeds.ballastEcoSpeed, ladenFullSpeed: speeds.ladenFullSpeed, ladenEcoSpeed: speeds.ladenEcoSpeed } }
async function saveTemplate() { try { await store.saveFuelTemplate(currentTemplate(templateName.value)); templateName.value = ''; const toast = await toastController.create({ message: t('budget.pages.fuel.templateSaved'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.fuel.templateSaveFailed'), color: 'danger', duration: 2200, position: 'top' }); await toast.present() } }
async function updateTemplate() { if (!selectedTemplate.value) return; try { await store.saveFuelTemplate({ ...currentTemplate(selectedTemplate.value.name), id: selectedTemplate.value.id }); const toast = await toastController.create({ message: t('budget.pages.fuel.templateUpdated'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.fuel.templateUpdateFailed'), color: 'danger', duration: 2200, position: 'top' }); await toast.present() } }
function applyTemplate(template: DailyFuelTemplate) { store.applyFuelTemplate(template); templatesOpen.value = false }
async function confirmRemoveTemplate(id: number | string) { const alert = await alertController.create({ header: t('budget.pages.fuel.removeTitle'), message: t('budget.pages.fuel.removeConfirm'), buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'destructive', handler: () => store.removeFuelTemplate(id) }] }); await alert.present() }
</script>

<style scoped>
.section-heading, .template-save-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.template-save-row { margin-top: 12px; }.template-save-row ion-input { min-width: 0; --padding-start: 10px; }.template-save-row ion-button { margin: 0; }.page-card ion-list { margin: 0; }.page-card ion-item { --padding-start: 16px; --padding-end: 16px; }.page-card ion-card-content > ion-select { width: 100%; max-width: 100%; color: #173447; }
</style>
