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
      <!-- Daily fuel template: select / save as template / save changes (mirrors the mini program panel) -->
      <ion-card class="page-card">
        <ion-card-header>
          <div class="section-heading">
            <h2 class="page-card-title">{{ t('budget.pages.fuel.templateTitle') }}</h2>
            <ion-button fill="clear" size="small" class="heading-action" @click="templatesOpen = true">{{ t('budget.pages.fuel.manage') }}</ion-button>
          </div>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="full" class="field-item template-select-item">
            <ion-select :value="store.document.fuelTemplateId || ''" :label="t('budget.pages.fuel.selectTemplateLabel')" label-placement="floating" interface="popover" :placeholder="t('budget.pages.fuel.templateNone')" :aria-label="t('budget.pages.fuel.selectTemplateLabel')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectTemplate">
              <ion-select-option value="">{{ t('budget.pages.fuel.templateNone') }}</ion-select-option>
              <ion-select-option v-for="template in store.fuelTemplates" :key="template.id" :value="String(template.id)">{{ template.name }}</ion-select-option>
            </ion-select>
          </ion-item>
          <div v-if="!selectedTemplate" class="template-save-row">
            <ion-item lines="full" class="field-item template-name-item">
              <ion-input v-model.trim="templateName" :label="t('budget.pages.fuel.templateNameLabel')" label-placement="floating" :placeholder="t('budget.pages.fuel.templateNamePlaceholder')" :aria-label="t('budget.pages.fuel.templateNameLabel')" />
            </ion-item>
            <ion-button :disabled="!templateName" @click="saveTemplate">{{ t('budget.pages.fuel.saveTemplate') }}</ion-button>
          </div>
          <ion-button v-else fill="clear" size="small" class="template-update" @click="updateTemplate">{{ t('budget.pages.fuel.updateTemplate', { name: selectedTemplate.name }) }}</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Daily consumption: laden/ballast main engine pair, ECA hint, auxiliary engine, idle/work pair -->
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.fuel.daily') }}</h2></ion-card-header>
        <ion-card-content class="field-grid">
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.fuel.seaLadenFuel)" :label="t('budget.pages.fuel.seaLadenFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaLadenFuel')" @ion-input="updateFuel('seaLadenFuel', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.fuel.seaBallastFuel)" :label="t('budget.pages.fuel.seaBallastFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaBallastFuel')" @ion-input="updateFuel('seaBallastFuel', $event)" /></ion-item>
          </div>
          <p class="field-hint">{{ t('budget.pages.fuel.ecaHint') }}</p>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.fuel.seaAuxFuel)" :label="t('budget.pages.fuel.seaAuxFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaAuxFuel')" @ion-input="updateFuel('seaAuxFuel', $event)" /></ion-item>
          </div>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.fuel.portIdleFuel)" :label="t('budget.pages.fuel.portIdleFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.portIdleFuel')" @ion-input="updateFuel('portIdleFuel', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.fuel.portWorkingFuel)" :label="t('budget.pages.fuel.portWorkingFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.portWorkingFuel')" @ion-input="updateFuel('portWorkingFuel', $event)" /></ion-item>
          </div>
          <p class="field-hint">{{ t('budget.pages.fuel.portFuelHint') }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Common speeds: one ballast pair and one laden pair -->
      <ion-card class="page-card">
        <ion-card-header><h2 class="page-card-title">{{ t('budget.pages.fuel.speeds') }}</h2></ion-card-header>
        <ion-card-content class="field-grid">
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.speeds.ballastFullSpeed)" :label="t('budget.pages.fuel.ballastFullSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ballastFullSpeed')" @ion-input="updateSpeed('ballastFullSpeed', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.speeds.ballastEcoSpeed)" :label="t('budget.pages.fuel.ballastEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ballastEcoSpeed')" @ion-input="updateSpeed('ballastEcoSpeed', $event)" /></ion-item>
          </div>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.speeds.ladenFullSpeed)" :label="t('budget.pages.fuel.ladenFullSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ladenFullSpeed')" @ion-input="updateSpeed('ladenFullSpeed', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="valueText(store.document.speeds.ladenEcoSpeed)" :label="t('budget.pages.fuel.ladenEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ladenEcoSpeed')" @ion-input="updateSpeed('ladenEcoSpeed', $event)" /></ion-item>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <!-- Template manager: list (apply/edit/delete) plus the new/edit form, mirrors the mini program sheet -->
    <ion-modal :is-open="templatesOpen" @did-dismiss="closeManager">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button v-if="draft" fill="clear" :aria-label="t('budget.pages.fuel.backToListLabel')" @click="draft = null"><ArrowLeft :size="18" /></ion-button>
          </ion-buttons>
          <ion-title>{{ draft ? t('budget.pages.fuel.templateEditTitle') : t('budget.pages.fuel.templateTitle') }}</ion-title>
          <ion-buttons slot="end">
            <ion-button v-if="!draft" fill="clear" :aria-label="t('budget.pages.fuel.newTemplateLabel')" @click="openNewDraft"><Plus :size="20" /></ion-button>
            <ion-button fill="clear" @click="templatesOpen = false">{{ t('common.close') }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="page-content">
        <ion-list v-if="!draft && store.fuelTemplates.length" lines="full" class="template-list">
          <ion-item v-for="template in store.fuelTemplates" :key="template.id" button :detail="false" @click="applyTemplate(template)">
            <ion-label><strong>{{ template.name }}</strong><p>{{ t('budget.pages.fuel.templateSummary', { laden: template.seaLadenFuel, ballast: template.seaBallastFuel, aux: template.seaAuxFuel }) }}</p></ion-label>
            <div slot="end" class="row-actions">
              <span class="apply-label">{{ t('budget.pages.fuel.use') }}</span>
              <ion-button fill="clear" size="small" :aria-label="t('budget.pages.fuel.editLabel')" @click.stop="openDraft(template)"><Pencil :size="17" /></ion-button>
              <ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.pages.fuel.removeLabel')" @click.stop="confirmRemoveTemplate(template.id)"><Trash2 :size="17" /></ion-button>
            </div>
          </ion-item>
        </ion-list>
        <section v-if="!draft && !store.fuelTemplates.length" class="empty-state"><div class="empty-state-inner"><Fuel :size="32" color="#6b7c8d" /><h2>{{ t('budget.pages.fuel.templateEmptyTitle') }}</h2><p>{{ t('budget.pages.fuel.templateEmptyDesc') }}</p></div></section>

        <div v-if="draft" class="template-form">
          <ion-item lines="full" class="field-item">
            <ion-input v-model.trim="draft.name" :label="t('budget.pages.fuel.templateNameLabel')" label-placement="floating" :placeholder="t('budget.pages.fuel.templateNamePlaceholder')" :aria-label="t('budget.pages.fuel.templateNameLabel')" />
          </ion-item>
          <h3 class="group-title">{{ t('budget.pages.fuel.daily') }}</h3>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('seaLadenFuel')" :label="t('budget.pages.fuel.seaLadenFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaLadenFuel')" @ion-input="updateDraft('seaLadenFuel', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('seaBallastFuel')" :label="t('budget.pages.fuel.seaBallastFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaBallastFuel')" @ion-input="updateDraft('seaBallastFuel', $event)" /></ion-item>
          </div>
          <p class="field-hint">{{ t('budget.pages.fuel.ecaHint') }}</p>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('seaAuxFuel')" :label="t('budget.pages.fuel.seaAuxFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.seaAuxFuel')" @ion-input="updateDraft('seaAuxFuel', $event)" /></ion-item>
          </div>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('portIdleFuel')" :label="t('budget.pages.fuel.portIdleFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.portIdleFuel')" @ion-input="updateDraft('portIdleFuel', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('portWorkingFuel')" :label="t('budget.pages.fuel.portWorkingFuel')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.portWorkingFuel')" @ion-input="updateDraft('portWorkingFuel', $event)" /></ion-item>
          </div>
          <h3 class="group-title">{{ t('budget.pages.fuel.speeds') }}</h3>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('ballastFullSpeed')" :label="t('budget.pages.fuel.ballastFullSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ballastFullSpeed')" @ion-input="updateDraft('ballastFullSpeed', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('ballastEcoSpeed')" :label="t('budget.pages.fuel.ballastEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ballastEcoSpeed')" @ion-input="updateDraft('ballastEcoSpeed', $event)" /></ion-item>
          </div>
          <div class="field-row">
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('ladenFullSpeed')" :label="t('budget.pages.fuel.ladenFullSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ladenFullSpeed')" @ion-input="updateDraft('ladenFullSpeed', $event)" /></ion-item>
            <ion-item lines="full" class="field-item"><ion-input :value="draftText('ladenEcoSpeed')" :label="t('budget.pages.fuel.ladenEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" :aria-label="t('budget.pages.fuel.ladenEcoSpeed')" @ion-input="updateDraft('ladenEcoSpeed', $event)" /></ion-item>
          </div>
          <div class="form-footer">
            <ion-button fill="outline" color="medium" @click="draft = null">{{ t('common.cancel') }}</ion-button>
            <ion-button :disabled="!draft.name.trim()" @click="saveDraft">{{ t('budget.pages.fuel.saveTemplate') }}</ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
// NOT ROUTED: /esti-deploy/editor/... redirects to /esti-deploy/editor in src/router/index.ts,
// so the live UI for this screen is the matching modal inside VoyageBudgetEditor.vue.
// Editing this file has no user-visible effect until the route is re-pointed here.
import { computed, ref } from 'vue'
import { ArrowLeft, Fuel, Pencil, Plus, Settings2, Trash2 } from 'lucide-vue-next'
import { alertController, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import AppBackButton from '@/components/AppBackButton.vue'
import { useI18n } from 'vue-i18n'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type { BudgetFuelInput, BudgetSpeedProfile, DailyFuelTemplate } from '@/types'

type FuelDraftField = Exclude<keyof DailyFuelTemplate, 'id' | 'name'>

const { t } = useI18n()
const store = useEstiDeployStore()
const templatesOpen = ref(false)
const templateName = ref('')
const draft = ref<DailyFuelTemplate | null>(null)
const selectedTemplate = computed(() => store.fuelTemplates.find((item) => String(item.id) === String(store.document.fuelTemplateId || '')))

function valueText(value: number | string) { return String(Number(value || 0)) }
function draftText(field: FuelDraftField) { return String(Number(draft.value?.[field] || 0)) }
function updateFuel(field: Exclude<keyof BudgetFuelInput, 'ladenFuelType' | 'ballastFuelType'>, event: CustomEvent) { store.updateFuel({ [field]: Number(event.detail.value || 0) }) }
function updateSpeed(field: keyof BudgetSpeedProfile, event: CustomEvent) { store.updateSpeeds({ [field]: Number(event.detail.value || 0) }) }
function selectTemplate(event: CustomEvent) { const id = String(event.detail.value || ''); const template = store.fuelTemplates.find((item) => String(item.id) === id); if (template) store.applyFuelTemplate(template); else store.setFuelTemplateId() }
function currentTemplate(name: string): DailyFuelTemplate { const { fuel, speeds } = store.document; return { id: '', name, seaLadenFuel: fuel.seaLadenFuel, seaBallastFuel: fuel.seaBallastFuel, seaAuxFuel: fuel.seaAuxFuel, portIdleFuel: fuel.portIdleFuel, portWorkingFuel: fuel.portWorkingFuel, ballastFullSpeed: speeds.ballastFullSpeed, ballastEcoSpeed: speeds.ballastEcoSpeed, ladenFullSpeed: speeds.ladenFullSpeed, ladenEcoSpeed: speeds.ladenEcoSpeed } }
function updateDraft(field: FuelDraftField, event: CustomEvent) { if (!draft.value) return; draft.value[field] = Number(event.detail.value || 0) }
function openNewDraft() { draft.value = currentTemplate('') }
function openDraft(template: DailyFuelTemplate) { draft.value = { ...template } }
function closeManager() { templatesOpen.value = false; draft.value = null }
function applyTemplate(template: DailyFuelTemplate) { store.applyFuelTemplate(template); closeManager() }
async function saveTemplate() { try { await store.saveFuelTemplate(currentTemplate(templateName.value)); templateName.value = ''; const toast = await toastController.create({ message: t('budget.pages.fuel.templateSaved'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.fuel.templateSaveFailed'), color: 'danger', duration: 2200, position: 'top' }); await toast.present() } }
async function updateTemplate() { if (!selectedTemplate.value) return; try { await store.saveFuelTemplate({ ...currentTemplate(selectedTemplate.value.name), id: selectedTemplate.value.id }); const toast = await toastController.create({ message: t('budget.pages.fuel.templateUpdated'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { const toast = await toastController.create({ message: cause instanceof Error ? cause.message : t('budget.pages.fuel.templateUpdateFailed'), color: 'danger', duration: 2200, position: 'top' }); await toast.present() } }
async function saveDraft() {
  const current = draft.value
  if (!current || !current.name.trim()) return
  const updating = Boolean(current.id)
  try {
    await store.saveFuelTemplate({ ...current, name: current.name.trim() })
    draft.value = null
    const toast = await toastController.create({ message: updating ? t('budget.pages.fuel.templateUpdated') : t('budget.pages.fuel.templateSaved'), color: 'success', duration: 1600, position: 'top' })
    await toast.present()
  } catch (cause) {
    const toast = await toastController.create({ message: cause instanceof Error ? cause.message : updating ? t('budget.pages.fuel.templateUpdateFailed') : t('budget.pages.fuel.templateSaveFailed'), color: 'danger', duration: 2200, position: 'top' })
    await toast.present()
  }
}
async function confirmRemoveTemplate(id: number | string) { const alert = await alertController.create({ header: t('budget.pages.fuel.removeTitle'), message: t('budget.pages.fuel.removeConfirm'), buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'destructive', handler: () => store.removeFuelTemplate(id) }] }); await alert.present() }
</script>

<style scoped>
/* 参考小程序：页面左右 gutter 20~24rpx（这里取 12px），卡片内边距 22rpx（11px），
   列表项不再叠加 16px 内边距，字段文字与卡片内边缘对齐 */
.page-content {
  --padding-top: 10px;
  --padding-bottom: calc(16px + env(safe-area-inset-bottom));
  --padding-start: 12px;
  --padding-end: 12px;
}

.page-card {
  margin: 0 0 10px;
  border: 1px solid #dce6ef;
  border-radius: 6px;
  box-shadow: none;
}

.page-card ion-card-header { padding: 11px 11px 6px; }
.page-card ion-card-content { padding: 6px 11px 11px; }

.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.heading-action { margin: 0; --padding-start: 6px; --padding-end: 6px; }

.field-item { --min-height: 50px; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0; }
.field-row { display: flex; align-items: flex-start; gap: 12px; }
.field-row > .field-item { flex: 1 1 0; min-width: 0; }
.field-hint { margin: 2px 0 8px; color: #98a2b3; font-size: 12px; line-height: 1.45; }
.group-title { margin: 14px 0 2px; color: #344054; font-size: 14px; font-weight: 700; }

.template-save-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.template-save-row ion-button { flex: none; margin: 0; }
.template-name-item { flex: 1 1 auto; min-width: 0; }
.template-update { margin: 6px 0 0; --padding-start: 0; }

.template-list { margin: 0; padding: 0; }
.template-list ion-item { --min-height: 56px; --padding-start: 4px; --padding-end: 0; --inner-padding-end: 0; }
.template-list ion-label p { margin: 3px 0 0; color: #98a2b3; font-size: 12px; }
.row-actions { display: flex; align-items: center; gap: 2px; }
.row-actions ion-button { margin: 0; --padding-start: 6px; --padding-end: 6px; }
.apply-label { color: #006c8c; font-size: 13px; }

.template-form { padding: 4px 0 8px; }
.form-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
.form-footer ion-button { margin: 0; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}
</style>
