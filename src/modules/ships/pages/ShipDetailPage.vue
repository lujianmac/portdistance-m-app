<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/ships" /></ion-buttons>
        <ion-title />
        <ion-buttons slot="end" class="detail-actions">
          <ion-button :aria-label="t('common.delete')" :disabled="deleting" @click="confirmDelete"><Trash2 :size="20" /></ion-button>
          <ion-button :aria-label="t('ships.editLabel')" @click="openEditor"><Pencil :size="20" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <section v-if="loading" class="state-page">
        <ion-spinner name="crescent" color="primary" />
        <span>{{ t('ships.loading') }}</span>
      </section>
      <template v-else>
        <!-- Basic / other details: label (+ unit) above the value, two cells per row -->
        <ion-accordion-group v-if="ship" :multiple="true" :value="openSections">
          <ion-accordion value="base">
            <ion-item slot="header" color="light">
              <ion-label><strong>{{ t('ships.basic') }}</strong></ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="field-grid two">
                <div v-for="cell in basicCells" :key="cell.label" class="field">
                  <small>{{ cellLabel(cell) }}</small>
                  <strong>{{ cell.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>
          <ion-accordion value="other">
            <ion-item slot="header" color="light">
              <ion-label><strong>{{ t('ships.other') }}</strong></ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="field-grid two">
                <div v-for="cell in otherCells" :key="cell.label" class="field" :class="{ wide: cell.wide }">
                  <small>{{ cellLabel(cell) }}</small>
                  <strong>{{ cell.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>
        </ion-accordion-group>
        <p v-if="error" class="inline-error">{{ error }}</p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonPage, IonSpinner, IonTitle, IonToolbar, alertController, onIonViewWillEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { deleteShipSpecification, getShipSpecification, type ShipSpecification } from '@/api/esti-deploy'
import { getBusinessErrorCode } from '@/api/client'
import { getDictionaryList, SHIP_TYPE_DICT_TYPE_ID, type DictionaryItem } from '@/api/reference'
import { formatAmount, formatDate } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

interface SpecCell {
  label: string
  value: string
  unit?: string
  wide?: boolean
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const ship = ref<ShipSpecification | null>(null)
const shipTypes = ref<DictionaryItem[]>([])
const openSections = ['base', 'other']

onIonViewWillEnter(() => { void load() })

function openEditor() { void router.push({ name: 'ship-editor', query: { id: shipId() } }) }

function shipId() { return String(route.query.id || '') }

function cellLabel(cell: SpecCell) { return cell.unit ? `${cell.label} (${cell.unit})` : cell.label }

function text(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value)
}

/** Zero stays visible (the legacy view printed it as-is); only empty values are blank. */
function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return ''
  return formatAmount(value)
}

function dateText(value: number | string | null | undefined) {
  return value ? formatDate(value, '') : ''
}

/**
 * The stored `shipType` is a dictionary id, but records created by the new app's
 * previous free-text editor (or a dictionary row that disappeared) keep the raw
 * value, so fall back to it instead of rendering a blank cell.
 */
function vesselTypeName(value: string | number | null | undefined) {
  const key = String(value ?? '').trim()
  if (!key) return ''
  const found = shipTypes.value.find((item) => String(item.dictId) === key)
  return found?.dictName || key
}

const basicCells = computed<SpecCell[]>(() => {
  const item = ship.value
  if (!item) return []
  return [
    { label: t('ships.fields.shipName'), value: text(item.shipName) },
    { label: t('ships.fields.shipType'), value: vesselTypeName(item.shipType) },
    { label: t('ships.fields.flag'), value: text(item.flag) },
    { label: t('ships.fields.buildYear'), value: text(item.buildYear) },
    { label: t('ships.fields.dwt'), value: numberText(item.dwt), unit: t('ships.units.mt') },
    { label: t('ships.fields.dwcc'), value: numberText(item.dwcc), unit: t('ships.units.mt') },
    { label: t('ships.fields.grt'), value: numberText(item.grt), unit: t('ships.units.mt') },
    { label: t('ships.fields.nrt'), value: numberText(item.nrt), unit: t('ships.units.mt') },
    { label: t('ships.fields.draft'), value: numberText(item.draft), unit: t('ships.units.m') },
    { label: t('ships.fields.shipLength'), value: numberText(item.shipLength), unit: t('ships.units.m') },
    { label: t('ships.fields.breadth'), value: numberText(item.breadth), unit: t('ships.units.m') },
    { label: t('ships.fields.depth'), value: numberText(item.depth), unit: t('ships.units.m') },
  ]
})

const otherCells = computed<SpecCell[]>(() => {
  const item = ship.value
  if (!item) return []
  // The legacy detail view printed the raw literal `cbm` for both capacities.
  const cbm = t('ships.units.cbmShort')
  return [
    { label: t('ships.fields.imoCode'), value: text(item.imoCode) },
    { label: t('ships.fields.callSign'), value: text(item.callSign) },
    { label: t('ships.fields.pandi'), value: text(item.pandi) },
    { label: t('ships.fields.shipClass'), value: text(item.shipClass) },
    { label: t('ships.fields.grainCapacity'), value: numberText(item.grainCapacity), unit: cbm },
    { label: t('ships.fields.baleCapacity'), value: numberText(item.baleCapacity), unit: cbm },
    { label: t('ships.fields.holdNum'), value: numberText(item.holdNum) },
    { label: t('ships.fields.hatchNum'), value: numberText(item.hatchNum) },
    { label: t('ships.fields.deckNum'), value: numberText(item.deckNum) },
    { label: t('ships.fields.ssDate'), value: dateText(item.ssDate) },
    { label: t('ships.fields.ddDate'), value: dateText(item.ddDate) },
    // Long free-text fields span the full width, one per row, and keep the line
    // breaks typed by the user (`.field.wide strong` renders white-space: pre-line).
    { label: t('ships.fields.mainEngine'), value: text(item.mainEngine), wide: true },
    { label: t('ships.fields.shipYard'), value: text(item.shipYard), wide: true },
    { label: t('ships.fields.hatchType'), value: text(item.hatchType), wide: true },
    { label: t('ships.fields.hatchSize'), value: text(item.hatchSize), wide: true },
    { label: t('ships.fields.holdSize'), value: text(item.holdSize), wide: true },
    { label: t('ships.fields.gearDesc'), value: text(item.gearDesc), wide: true },
  ]
})

async function load() {
  const id = shipId()
  if (!id) return
  loading.value = true
  try {
    const [detail, dictionary] = await Promise.all([
      getShipSpecification(id),
      // The type name is decoration only: a failed lookup must not hide the vessel.
      getDictionaryList().catch(() => [] as DictionaryItem[]),
    ])
    ship.value = detail
    shipTypes.value = (Array.isArray(dictionary) ? dictionary : [])
      .filter((entry) => Number(entry.dictTypeId) === SHIP_TYPE_DICT_TYPE_ID)
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : ''
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: t('common.warning'),
    message: t('ships.deleteConfirm'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      {
        text: t('common.confirm'),
        role: 'destructive',
        handler: () => { void removeShip() },
      },
    ],
  })
  await alert.present()
}

async function removeShip() {
  const id = shipId()
  if (!id || deleting.value) return
  deleting.value = true
  try {
    await deleteShipSpecification(id)
    router.back()
  } catch (cause) {
    // The server rejects the delete when the vessel is referenced by an estimation;
    // the legacy app showed the same message for every rejected delete.
    const message = getBusinessErrorCode(cause) === undefined
      ? (cause instanceof Error ? cause.message : t('errors.requestFailed'))
      : t('ships.vesselInUse')
    const alert = await alertController.create({
      header: t('common.warning'),
      message,
      buttons: [{ text: t('common.ok'), role: 'cancel' }],
    })
    await alert.present()
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.state-page {
  display: grid;
  min-height: 50vh;
  align-content: center;
  place-items: center;
  gap: 12px;
  color: #718293;
}

.section-body {
  padding: 10px 14px 14px;
  background: #ffffff;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  min-width: 0;
}

.field.wide {
  grid-column: 1 / -1;
}

.field small,
.field strong {
  display: block;
  overflow-wrap: anywhere;
}

.field small {
  color: #6e8192;
  font-size: 13px;
}

.field strong {
  margin-top: 4px;
  color: #173447;
  font-size: 16px;
  font-weight: 500;
}

/* 六个长文本字段（主机/船厂/舱口/舱口尺寸/货舱尺寸/起重设备）整行铺满（.wide），
   pre-line 只折叠多余空格、不折叠用户输入的 \n；不设省略号，超长串靠 anywhere 换行而非截断。 */
.field.wide strong {
  line-height: 1.5;
  overflow: visible;
  text-overflow: clip;
  white-space: pre-line;
}

/* 工具栏右侧两个操作按钮：Ionic 默认每个按钮自带 margin-inline 2px（相邻两键实际间隔 4px），
   这里再加 12px（原来 6px，+6px）；整组再离工具栏最右端多 18px（原来 6px，+12px；
   md --padding-end 为 0、ios 为 4px） */
.detail-actions {
  gap: 12px;
  margin-inline-end: 18px;
}
</style>
