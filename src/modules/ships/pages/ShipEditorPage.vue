<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button @click="cancel">{{ t('common.cancel') }}</ion-button></ion-buttons>
        <ion-title>{{ shipId ? t('ships.editLabel') : t('ships.addLabel') }}</ion-title>
        <ion-buttons slot="end" class="toolbar-actions">
          <ion-button v-if="shipId" :disabled="saving" @click="resetForm">{{ t('common.reset') }}</ion-button>
          <ion-button class="save-button" fill="outline" :disabled="saving" @click="save">{{ t('common.save') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <section v-if="loading" class="state-page">
        <ion-spinner name="crescent" color="primary" />
        <span>{{ t('ships.loading') }}</span>
      </section>
      <template v-else>
        <!-- Basic specification. Labels sit on the left and values on the right
             (label-placement="start"); the underline is painted by ion-item with
             lines="full", so the inputs must not set `fill`. -->
        <ion-card class="page-card">
          <ion-card-header><h2 class="page-card-title">{{ t('ships.basic') }}</h2></ion-card-header>
          <ion-list lines="full">
            <ion-item>
              <ion-input v-model.trim="form.shipName" :label="t('ships.fields.shipName')" label-placement="start" :maxlength="50" />
            </ion-item>
            <!-- Vessel type / flag / built year are picked, never typed -->
            <ion-item>
              <ion-input class="picker-input" readonly :value="vesselTypeName" :label="t('ships.fields.shipType')" label-placement="start" @click="openTypePicker">
                <ChevronDown slot="end" :size="17" aria-hidden="true" />
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input class="picker-input" readonly :value="form.flag || ''" :label="t('ships.fields.flag')" label-placement="start" @click="openFlagPicker">
                <ChevronDown slot="end" :size="17" aria-hidden="true" />
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input class="picker-input" readonly :value="form.buildYear ? String(form.buildYear) : ''" :label="t('ships.fields.buildYear')" label-placement="start" @click="openYearPicker">
                <ChevronDown slot="end" :size="17" aria-hidden="true" />
              </ion-input>
            </ion-item>
            <ion-item v-for="field in basicNumberFields" :key="field.name">
              <ion-input :value="numberDraft[field.name] || ''" :label="field.label" label-placement="start" type="number" inputmode="decimal" enterkeyhint="next" :maxlength="10" @ion-input="updateNumber(field.name, $event)">
                <ion-label slot="end" class="field-unit">{{ field.unit }}</ion-label>
              </ion-input>
            </ion-item>
          </ion-list>
        </ion-card>

        <!-- Other details -->
        <ion-card class="page-card">
          <ion-card-header><h2 class="page-card-title">{{ t('ships.other') }}</h2></ion-card-header>
          <ion-list lines="full">
            <ion-item v-for="field in otherTextFields" :key="field.name">
              <ion-input :value="form[field.name] || ''" :label="field.label" label-placement="start" type="text" enterkeyhint="next" @ion-input="updateText(field.name, $event)" />
            </ion-item>
            <ion-item v-for="field in otherNumberFields" :key="field.name">
              <ion-input :value="numberDraft[field.name] || ''" :label="field.label" label-placement="start" type="number" inputmode="decimal" enterkeyhint="next" :maxlength="10" @ion-input="updateNumber(field.name, $event)">
                <ion-label v-if="field.unit" slot="end" class="field-unit">{{ field.unit }}</ion-label>
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input class="picker-input" readonly :value="dateText(form.ssDate)" :label="t('ships.fields.ssDate')" label-placement="start" @click="openDate('ssDate')">
                <ChevronDown slot="end" :size="17" aria-hidden="true" />
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input class="picker-input" readonly :value="dateText(form.ddDate)" :label="t('ships.fields.ddDate')" label-placement="start" @click="openDate('ddDate')">
                <ChevronDown slot="end" :size="17" aria-hidden="true" />
              </ion-input>
            </ion-item>
            <!-- Main engine / shipyard / hatch / hold / gear description: still plain text,
                 but multi-line (Enter inserts a break). `auto-grow` + `:rows="1"` starts at one
                 row and grows with the content instead of scrolling inside the field. -->
            <ion-item v-for="field in otherLongTextFields" :key="field.name">
              <ion-textarea
                :value="form[field.name] || ''"
                :label="field.label"
                label-placement="start"
                :auto-grow="true"
                :rows="1"
                enterkeyhint="enter"
                @ion-input="updateText(field.name, $event)"
              />
            </ion-item>
          </ion-list>
        </ion-card>
        <p v-if="error" class="inline-error">{{ error }}</p>
      </template>
    </ion-content>

    <!-- Vessel type picker: `/portdist/dictionary/list` rows with dictTypeId 16004 -->
    <ion-modal :is-open="typePickerOpen" @did-dismiss="typePickerOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start"><ion-button @click="typePickerOpen = false">{{ t('common.cancel') }}</ion-button></ion-buttons>
          <ion-title>{{ t('ships.fields.shipType') }}</ion-title>
          <ion-buttons slot="end"><ion-button @click="confirmType">{{ t('common.finish') }}</ion-button></ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="page-content">
        <ion-list lines="full">
          <ion-item v-if="!shipTypes.length"><ion-label color="medium">{{ t('common.empty') }}</ion-label></ion-item>
          <ion-radio-group v-else allow-empty-selection :value="draftType" @ion-change="onTypeChange">
            <ion-item v-for="item in shipTypes" :key="String(item.dictId)">
              <ion-radio :value="String(item.dictId)">{{ item.dictName }}</ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Flag picker: `/portdist/country/list` filtered by country code (at most 20 rows) -->
    <ion-modal :is-open="flagPickerOpen" @did-dismiss="flagPickerOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start"><ion-button @click="flagPickerOpen = false">{{ t('common.cancel') }}</ion-button></ion-buttons>
          <ion-title>{{ t('ships.fields.flag') }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="page-content">
        <ion-item lines="full">
          <Search slot="start" :size="18" aria-hidden="true" />
          <ion-input :value="flagKeyword" :placeholder="t('ships.flagSearchPlaceholder')" :aria-label="t('ships.flagSearchPlaceholder')" type="text" inputmode="search" enterkeyhint="search" @ion-input="onFlagKeyword" />
          <button v-if="flagKeyword" slot="end" class="search-clear" type="button" :aria-label="t('common.clear')" @click="flagKeyword = ''"><X :size="16" /></button>
        </ion-item>
        <ion-list lines="full">
          <ion-item v-for="item in flagSuggestions" :key="item.countryCode" button :detail="false" @click="selectFlag(item.countryCode)">
            <ion-label>{{ item.countryCode }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Built year picker: the current year and the 59 years before it -->
    <ion-modal :is-open="yearPickerOpen" @did-dismiss="yearPickerOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start"><ion-button @click="yearPickerOpen = false">{{ t('common.cancel') }}</ion-button></ion-buttons>
          <ion-title>{{ t('ships.fields.buildYear') }}</ion-title>
          <ion-buttons slot="end"><ion-button @click="confirmYear">{{ t('common.finish') }}</ion-button></ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="page-content">
        <ion-list lines="full">
          <ion-radio-group :value="draftYear" @ion-change="onYearChange">
            <ion-item v-for="year in years" :key="year">
              <ion-radio :value="year">{{ year }}</ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- SS / DD calendar (date only), presented as a bottom sheet so the calendar stays below the status bar -->
    <ion-modal
      class="date-sheet"
      :keep-contents-mounted="true"
      :is-open="datePickerOpen"
      :breakpoints="DATE_SHEET_BREAKPOINTS"
      :initial-breakpoint="DATE_SHEET_INITIAL_BREAKPOINT"
      @did-dismiss="datePickerOpen = false"
    >
      <ion-datetime presentation="date" :locale="locale" :value="dateDraft" :show-default-buttons="true" :done-text="t('common.confirm')" :cancel-text="t('common.cancel')" @ion-change="updateDate" @ion-cancel="cancelDate" />
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ChevronDown, Search, X } from 'lucide-vue-next'
import { IonButton, IonButtons, IonCard, IonCardHeader, IonContent, IonDatetime, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonPage, IonRadio, IonRadioGroup, IonSpinner, IonTextarea, IonTitle, IonToolbar, alertController, onIonViewWillEnter } from '@ionic/vue'
import type { DatetimeCustomEvent, RadioGroupCustomEvent } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createShipSpecification, getShipSpecification, updateShipSpecification, type ShipSpecificationSavePayload } from '@/api/esti-deploy'
import { getCountryList, getDictionaryList, SHIP_TYPE_DICT_TYPE_ID, type CountryItem, type DictionaryItem } from '@/api/reference'
import { formatDate } from '@/i18n/format'

type BasicNumberField = 'dwt' | 'dwcc' | 'grt' | 'nrt' | 'draft' | 'shipLength' | 'breadth' | 'depth'
type OtherTextField = 'imoCode' | 'callSign' | 'pandi' | 'shipClass'
type OtherNumberField = 'grainCapacity' | 'baleCapacity' | 'holdNum' | 'hatchNum' | 'deckNum'
/** 主机 / 船厂 / 舱口与货舱描述：老 app 是长文本框，这里用可自动增高的多行 textarea */
type OtherLongTextField = 'mainEngine' | 'shipYard' | 'hatchType' | 'hatchSize' | 'holdSize' | 'gearDesc'
type NumberField = BasicNumberField | OtherNumberField
type DateField = 'ssDate' | 'ddDate'

interface FieldSpec<T extends string> {
  name: T
  label: string
  unit?: string
}

/** `ion-input` / `ion-textarea` carry the raw new value in `detail.value`. */
interface InputValueEvent {
  detail: { value?: string | number | null }
}

/**
 * 日期选择用底部 sheet 弹层（普通全屏 ion-modal 会把日历顶到状态栏下面）：
 * 0 = 关闭、0.5 = 半屏、0.9 = 展开；initialBreakpoint 必须是 breakpoints 里的值。
 */
const DATE_SHEET_BREAKPOINTS = [0, 0.5, 0.9]
const DATE_SHEET_INITIAL_BREAKPOINT = 0.9

/** Every numeric input, so the draft text can be re-synced on load / reset. */
const NUMBER_FIELDS: NumberField[] = ['dwt', 'dwcc', 'grt', 'nrt', 'draft', 'shipLength', 'breadth', 'depth', 'grainCapacity', 'baleCapacity', 'holdNum', 'hatchNum', 'deckNum']

/** The legacy editor refused to save unless every basic field was filled in. */
const REQUIRED_FIELDS: (keyof ShipSpecificationSavePayload)[] = ['shipName', 'shipType', 'flag', 'buildYear', 'dwt', 'dwcc', 'grt', 'nrt', 'draft', 'shipLength', 'breadth', 'depth']

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const shipId = computed(() => String(route.query.id || ''))
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive<ShipSpecificationSavePayload>(emptyForm())
/** Snapshot of the loaded record, restored by the Reset button. */
const original = ref<ShipSpecificationSavePayload | null>(null)
/**
 * Raw text of each numeric input. Binding the inputs to the number itself would
 * rewrite `0` to `''` (the legacy "hide zero" rule) while the user is typing the
 * first digit of `0.5`, so the draft text is kept separately.
 */
const numberDraft = reactive<Record<string, string>>({})
const shipTypes = ref<DictionaryItem[]>([])
const countries = ref<CountryItem[]>([])

// 选择弹窗
const typePickerOpen = ref(false)
const draftType = ref('')
const flagPickerOpen = ref(false)
const flagKeyword = ref('')
const yearPickerOpen = ref(false)
const draftYear = ref(0)
const datePickerOpen = ref(false)
const dateField = ref<DateField | null>(null)
/** Value the field had when the calendar was opened, so Cancel can revert the live ionChange. */
let dateSnapshot = 0

onIonViewWillEnter(() => { void load() })

function emptyForm(): ShipSpecificationSavePayload {
  return {
    shipName: '',
    flag: '',
    shipType: '',
    buildYear: 0,
    dwt: 0,
    dwcc: 0,
    grt: 0,
    nrt: 0,
    draft: 0,
    shipLength: 0,
    breadth: 0,
    depth: 0,
    imoCode: '',
    callSign: '',
    pandi: '',
    shipClass: '',
    grainCapacity: 0,
    baleCapacity: 0,
    holdNum: 0,
    hatchNum: 0,
    deckNum: 0,
    ssDate: 0,
    ddDate: 0,
    mainEngine: '',
    shipYard: '',
    hatchType: '',
    hatchSize: '',
    holdSize: '',
    gearDesc: '',
  }
}

const basicNumberFields = computed<FieldSpec<BasicNumberField>[]>(() => [
  { name: 'dwt', label: t('ships.fields.dwt'), unit: t('ships.units.mt') },
  { name: 'dwcc', label: t('ships.fields.dwcc'), unit: t('ships.units.mt') },
  { name: 'grt', label: t('ships.fields.grt'), unit: t('ships.units.mt') },
  { name: 'nrt', label: t('ships.fields.nrt'), unit: t('ships.units.mt') },
  { name: 'draft', label: t('ships.fields.draft'), unit: t('ships.units.m') },
  { name: 'shipLength', label: t('ships.fields.shipLength'), unit: t('ships.units.m') },
  { name: 'breadth', label: t('ships.fields.breadth'), unit: t('ships.units.m') },
  { name: 'depth', label: t('ships.fields.depth'), unit: t('ships.units.m') },
])

const otherTextFields = computed<FieldSpec<OtherTextField>[]>(() => [
  { name: 'imoCode', label: t('ships.fields.imoCode') },
  { name: 'callSign', label: t('ships.fields.callSign') },
  { name: 'pandi', label: t('ships.fields.pandi') },
  { name: 'shipClass', label: t('ships.fields.shipClass') },
])

const otherNumberFields = computed<FieldSpec<OtherNumberField>[]>(() => [
  { name: 'grainCapacity', label: t('ships.fields.grainCapacity'), unit: t('ships.units.cbm') },
  { name: 'baleCapacity', label: t('ships.fields.baleCapacity'), unit: t('ships.units.cbm') },
  { name: 'holdNum', label: t('ships.fields.holdNum') },
  { name: 'hatchNum', label: t('ships.fields.hatchNum') },
  { name: 'deckNum', label: t('ships.fields.deckNum') },
])

const otherLongTextFields = computed<FieldSpec<OtherLongTextField>[]>(() => [
  { name: 'mainEngine', label: t('ships.fields.mainEngine') },
  { name: 'shipYard', label: t('ships.fields.shipYard') },
  { name: 'hatchType', label: t('ships.fields.hatchType') },
  { name: 'hatchSize', label: t('ships.fields.hatchSize') },
  { name: 'holdSize', label: t('ships.fields.holdSize') },
  { name: 'gearDesc', label: t('ships.fields.gearDesc') },
])

const vesselTypeName = computed(() => {
  const key = String(form.shipType ?? '').trim()
  if (!key) return ''
  return shipTypes.value.find((item) => String(item.dictId) === key)?.dictName || key
})

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 60 }, (_, index) => current - index)
})

const flagSuggestions = computed(() => {
  const keyword = flagKeyword.value.trim().toLowerCase()
  if (!keyword) return []
  return countries.value
    .filter((item) => String(item.countryCode || '').toLowerCase().includes(keyword))
    .slice(0, 20)
})

const dateDraft = computed(() => {
  const field = dateField.value
  const value = field ? form[field] : 0
  return value ? dayjs(value).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
})

function syncNumberDraft() {
  for (const field of NUMBER_FIELDS) {
    const value = form[field]
    numberDraft[field] = !value ? '' : String(value)
  }
}

function dateText(value: number | string | null | undefined) {
  return value ? formatDate(value, '') : ''
}

function cancel() { router.back() }

function resetForm() {
  Object.assign(form, original.value ?? emptyForm())
  syncNumberDraft()
  error.value = ''
}

function updateNumber(field: NumberField, event: InputValueEvent) {
  const raw = String(event.detail.value ?? '')
  numberDraft[field] = raw
  const numeric = Number(raw)
  form[field] = raw.trim() === '' || !Number.isFinite(numeric) ? 0 : numeric
}

function updateText(field: OtherTextField | OtherLongTextField, event: InputValueEvent) {
  form[field] = String(event.detail.value ?? '')
}

// 船舶类型 / 船旗 / 建造年代
function openTypePicker() {
  draftType.value = form.shipType ? String(form.shipType) : ''
  typePickerOpen.value = true
}

function onTypeChange(event: RadioGroupCustomEvent) {
  draftType.value = String(event.detail.value ?? '')
}

function confirmType() {
  form.shipType = draftType.value
  typePickerOpen.value = false
}

function openFlagPicker() {
  flagKeyword.value = ''
  flagPickerOpen.value = true
}

function onFlagKeyword(event: InputValueEvent) {
  flagKeyword.value = String(event.detail.value ?? '')
}

function selectFlag(countryCode: string) {
  form.flag = String(countryCode || '')
  flagPickerOpen.value = false
}

function openYearPicker() {
  draftYear.value = Number(form.buildYear) || new Date().getFullYear()
  yearPickerOpen.value = true
}

function onYearChange(event: RadioGroupCustomEvent) {
  draftYear.value = Number(event.detail.value || 0)
}

function confirmYear() {
  form.buildYear = Number(draftYear.value) || 0
  yearPickerOpen.value = false
}

// 特检 / 坞检日期
function openDate(field: DateField) {
  dateField.value = field
  dateSnapshot = Number(form[field] || 0)
  datePickerOpen.value = true
}

/** The calendar updates the field on every scroll (ionChange); Cancel restores the previous value. */
function cancelDate() {
  const field = dateField.value
  if (field) form[field] = dateSnapshot
  datePickerOpen.value = false
}

function updateDate(event: DatetimeCustomEvent) {
  const field = dateField.value
  if (!field) return
  const raw = event.detail.value
  const value = Array.isArray(raw) ? raw[0] : raw
  // 老 app 存的是 new Date('YYYY-MM-DD').getTime()（UTC 零点），保持一致
  form[field] = value ? new Date(value).getTime() : 0
}

function isBlank(value: unknown) {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return value === 0
  return String(value).trim() === ''
}

async function save() {
  if (saving.value) return
  if (REQUIRED_FIELDS.some((field) => isBlank(form[field]))) {
    const alert = await alertController.create({
      header: t('ships.completeBase'),
      buttons: [{ text: t('common.ok'), role: 'cancel' }],
    })
    await alert.present()
    return
  }
  saving.value = true
  error.value = ''
  try {
    if (shipId.value) await updateShipSpecification({ ...form, id: shipId.value })
    else await createShipSpecification({ ...form })
    router.back()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('errors.requestFailed')
  } finally {
    saving.value = false
  }
}

async function load() {
  const id = shipId.value
  loading.value = Boolean(id)
  // 每次进入都从空白开始，避免上一次编辑（或新增）的值残留
  original.value = null
  resetForm()
  // 船舶类型 / 船旗列表只是选项来源，取不到也不阻塞页面
  const [dictionary, country] = await Promise.all([
    getDictionaryList().catch(() => [] as DictionaryItem[]),
    getCountryList().catch(() => [] as CountryItem[]),
  ])
  shipTypes.value = (Array.isArray(dictionary) ? dictionary : [])
    .filter((entry) => Number(entry.dictTypeId) === SHIP_TYPE_DICT_TYPE_ID)
  countries.value = Array.isArray(country) ? country : []

  if (!id) return
  try {
    const ship = await getShipSpecification(id)
    Object.assign(form, emptyForm(), ship)
    original.value = { ...form }
    syncNumberDraft()
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('errors.requestFailed')
  } finally {
    loading.value = false
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

.field-unit {
  color: #667085;
  font-size: 13px;
}

.picker-input {
  cursor: pointer;
}

/* 工具栏右侧按钮之间的间距：Ionic 默认每个按钮自带 margin-inline 2px（相邻两键实际 4px），
   这里再加 6px（原来 0px，+6px）；新增船舶时只有保存按钮，此间距不生效 */
.toolbar-actions {
  gap: 6px;
}

/* 保存按钮：老 app 的保存键是纯文字，这里改成描边按钮提高区分度。
   Ionic 的 .button-outline 边框宽度在 md 是 2px、ios 是 1px、ios 圆角 14px，
   这里用 --border-* 变量统一固定成 1px + 7px 圆角，并给 iOS 补一条 host 边框兜底
   （与 EstiDeployListPage 草稿按钮同一套写法：fill 不反射成 attribute，光靠它不保险）。
   margin-inline-end：工具栏最右端再多留 18px（原来 6px，+12px；md --padding-end 0、ios 4px，外加按钮自带 2px） */
.save-button {
  --color: var(--ion-color-primary, #006c8c);
  --border-color: var(--ion-color-primary, #006c8c);
  --border-width: 1px;
  --border-style: solid;
  --border-radius: 7px;
  margin-inline-end: 18px;
}

/* iOS 下再补一条真实边框：iOS 的 .button-outline 圆角是 14px，靠变量覆盖后再加一层保证视觉一致 */
.save-button:not(.md) {
  --border-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--border-color, var(--ion-color-primary, #006c8c));
  border-radius: var(--border-radius);
}

/* sheet 弹层顶部 5px 处有抓手（.modal-handle），给日历留出一点上边距避免压到月份标题 */
.date-sheet ion-datetime {
  padding-top: 10px;
}

.search-clear {
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #eef2f6;
  color: #526879;
}
</style>
