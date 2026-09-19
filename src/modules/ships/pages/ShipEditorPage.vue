<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/ships" /></ion-buttons><ion-title>{{ shipId ? t('ships.editTitle') : t('ships.addTitle') }}</ion-title><ion-buttons slot="end"><ion-button :disabled="saving" @click="save">{{ t('common.save') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <section v-if="loading" class="empty-state"><ion-spinner name="crescent" color="primary" /></section>
      <template v-else>
        <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('ships.basicInfo') }}</h2></ion-card-header><ion-list lines="full"><ion-item><ion-input v-model.trim="form.shipName" :label="t('ships.shipName')" fill="outline" label-placement="floating" :maxlength="80" :placeholder="t('ships.shipNamePlaceholder')" /></ion-item><ion-item><ion-input v-model.trim="form.flag" :label="t('ships.flag')" fill="outline" label-placement="floating" :placeholder="t('ships.flagPlaceholder')" /></ion-item><ion-item><ion-input v-model.trim="form.shipType" :label="t('ships.shipType')" fill="outline" label-placement="floating" :placeholder="t('ships.shipTypePlaceholder')" /></ion-item><ion-item><ion-input :value="valueText(form.buildYear)" :label="t('ships.buildYear')" fill="outline" label-placement="floating" type="number" inputmode="numeric" @ion-input="updateNumber('buildYear', $event)" /></ion-item></ion-list></ion-card>
        <ion-card class="page-card"><ion-card-header><h2 class="page-card-title">{{ t('ships.tonnage') }}</h2></ion-card-header><ion-list lines="full"><ion-item><ion-input :value="valueText(form.dwt)" :label="t('ships.dwt')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('dwt', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.dwcc || 0)" :label="t('ships.dwcc')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('dwcc', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.grt || 0)" :label="t('ships.grt')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('grt', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.nrt || 0)" :label="t('ships.nrt')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('nrt', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.shipLength)" :label="t('ships.length')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('shipLength', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.breadth)" :label="t('ships.breadth')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('breadth', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.depth)" :label="t('ships.depth')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('depth', $event)" /></ion-item><ion-item><ion-input :value="valueText(form.draft)" :label="t('ships.draft')" fill="outline" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateNumber('draft', $event)" /></ion-item></ion-list></ion-card>
        <p v-if="error" class="inline-error">{{ error }}</p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IonButton, IonButtons, IonCard, IonCardHeader, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonSpinner, IonTitle, IonToolbar, onIonViewWillEnter, toastController } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createShipSpecification, getShipSpecification, updateShipSpecification, type ShipSpecificationSavePayload } from '@/api/esti-deploy'
import AppBackButton from '@/components/AppBackButton.vue'

type NumericField = 'buildYear' | 'dwt' | 'dwcc' | 'grt' | 'nrt' | 'shipLength' | 'breadth' | 'depth' | 'draft'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const shipId = ref('')
const form = reactive<ShipSpecificationSavePayload>({ shipName: '', flag: '', shipType: '', buildYear: 0, dwt: 0, dwcc: 0, grt: 0, nrt: 0, shipLength: 0, breadth: 0, depth: 0, draft: 0 })
onIonViewWillEnter(() => { void load() })
async function load() { const id = String(route.query.id || ''); shipId.value = id; if (!id) return; loading.value = true; try { const ship = await getShipSpecification(id); Object.assign(form, ship) } catch (cause) { error.value = cause instanceof Error ? cause.message : t('ships.loadFailed') } finally { loading.value = false } }
function valueText(value: number) { return value ? String(value) : '' }
function updateNumber(field: NumericField, event: CustomEvent) { form[field] = Math.max(0, Number(event.detail.value || 0)) }
function validate() { if (!form.shipName) return t('ships.nameRequired'); if (!form.flag) return t('ships.flagRequired'); if (!form.shipType) return t('ships.typeRequired'); if (form.buildYear < 1900 || form.buildYear > new Date().getFullYear()) return t('ships.buildYearInvalid'); if (!(form.dwt > 0) || !(form.shipLength > 0) || !(form.breadth > 0) || !(form.depth > 0) || !(form.draft > 0)) return t('ships.dimensionsRequired'); return '' }
async function save() { const message = validate(); if (message || saving.value) { error.value = message; return }; saving.value = true; error.value = ''; try { if (shipId.value) await updateShipSpecification({ ...form, id: shipId.value }); else await createShipSpecification(form); const toast = await toastController.create({ message: t('ships.saved'), color: 'success', duration: 1600, position: 'top' }); await toast.present(); await router.back() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('common.saveFailed') } finally { saving.value = false } }
</script>
