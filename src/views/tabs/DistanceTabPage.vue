<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('distance.page.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="distance-tab-content">
      <main class="distance-page" :aria-label="t('distance.page.title')">
        <section class="top-search-area">
          <div class="search-row">
            <ion-item lines="none" class="search-field" :class="{ 'search-field-disabled': distance.hasDistanceResult }">
              <Search slot="start" :size="18" aria-hidden="true" />
              <ion-input
                :value="keyword"
                :disabled="distance.hasDistanceResult"
                :placeholder="t('distance.search.portPlaceholder')"
                :aria-label="t('distance.search.portPlaceholder')"
                type="text"
                inputmode="search"
                enterkeyhint="search"
                @ion-focus="onSearchFocus"
                @ion-blur="onSearchBlur"
                @ion-input="onSearchInput"
              />
              <button
                v-if="keyword"
                slot="end"
                class="search-clear"
                type="button"
                :aria-label="t('common.clear')"
                @click="clearKeyword"
              >
                <X :size="16" />
              </button>
            </ion-item>
            <ion-button
              class="coordinate-trigger"
              fill="clear"
              :aria-label="t('distance.coordinate.title')"
              :disabled="distance.hasDistanceResult"
              @click="openCoordinateEditor"
            >
              <Send :size="22" />
            </ion-button>
          </div>

          <ion-list v-if="showSuggestions" class="floating-panel search-popover" lines="full">
            <ion-item v-if="distance.searching">
              <ion-label color="medium">{{ t('common.searching') }}</ion-label>
            </ion-item>
            <ion-item v-else-if="!distance.suggestPorts.length">
              <ion-label color="medium">{{ t('distance.search.noSuggestions') }}</ion-label>
            </ion-item>
            <ion-item
              v-for="port in distance.suggestPorts"
              :key="String(port.portId)"
              button
              :detail="false"
              @click="selectPort(port)"
            >
              <ion-label class="suggest-label">{{ portName(port) }}<small v-if="portCountryName(port)">[{{ portCountryName(port) }}]</small></ion-label>
            </ion-item>
          </ion-list>

          <section v-if="showRecentPorts" class="floating-panel recent-port-panel" :aria-label="t('distance.recentPorts.ariaLabel')">
            <div class="recent-port-head">
              <span>{{ t('distance.recentPorts.title') }}</span>
              <div class="recent-port-ops">
                <ion-button fill="clear" :aria-label="t('distance.recentPorts.clear')" @click="distance.clearRecentPorts()">
                  <Trash2 :size="16" />
                </ion-button>
                <ion-button fill="clear" :aria-label="t('distance.recentPorts.close')" @click="closeRecentPorts">
                  <X :size="17" />
                </ion-button>
              </div>
            </div>
            <p v-if="!distance.recentPorts.length" class="empty-note">{{ t('distance.recentPorts.empty') }}</p>
            <div v-else class="recent-port-chips">
              <ion-chip
                v-for="port in distance.recentPorts"
                :key="`recent-${String(port.portId)}`"
                :class="{ selected: isPortInRoute(port) }"
                button
                @click="selectPort(port)"
              >
                <ion-label>{{ portName(port) }}</ion-label>
              </ion-chip>
            </div>
          </section>
        </section>

        <section class="result-panel" aria-live="polite">
          <header v-if="distance.portPoints.length" class="result-panel-header">
            <ion-item lines="full" class="speed-item">
              <ion-input
                :value="String(distance.speed)"
                :aria-label="t('distance.route.speedLabel')"
                inputmode="decimal"
                type="number"
                @ion-input="setSpeed"
              />
              <span class="speed-unit">{{ t('common.unit.knotShort') }}</span>
            </ion-item>
            <div class="result-panel-ops">
              <ion-button
                v-if="distance.portPoints.length >= 2 && !distance.hasDistanceResult"
                class="calculate-button"
                :disabled="distance.calculating"
                @click="calculate"
              >
                {{ distance.calculating ? t('distance.route.calculating') : t('distance.route.getDistance') }}
              </ion-button>
              <ion-button v-else-if="distance.hasDistanceResult" class="clear-result-button" @click="clearRoute">
                {{ t('distance.route.clearDistance') }}
              </ion-button>
              <ion-button
                v-if="distance.hasDistanceResult"
                class="clear-result-button"
                color="medium"
                @click="clearAllRoute"
              >
                {{ t('distance.route.clearAll') }}
              </ion-button>
            </div>
          </header>

          <div v-if="!distance.portPoints.length" class="panel-empty">
            <Navigation :size="28" />
            <p>{{ t('distance.route.emptyHint') }}</p>
          </div>

          <section
            v-if="!distance.portPoints.length && distance.recentCalculations.length"
            class="recent-calculations-panel"
            :aria-label="t('distance.recentCalculations.title')"
          >
            <h2>{{ t('distance.recentCalculations.title') }}</h2>
            <article
              v-for="item in distance.recentCalculations"
              :key="item.createdAt"
              class="recent-calculation-item"
            >
              <div class="recent-calculation-main">
                <strong>{{ item.routeLabel }}</strong>
                <span>
                  {{
                    t('distance.recentCalculations.summaryCompact', {
                      distance: item.totalDistanceNm.toFixed(2),
                      eca: item.totalEcaDistanceNm.toFixed(2),
                      days: item.sailingDays.toFixed(2),
                      speed: item.speed,
                    })
                  }}
                </span>
              </div>
              <ion-button fill="clear" size="small" @click="copyRecentCalculation(item)">
                {{ t('common.copy') }}
              </ion-button>
            </article>
          </section>

          <div v-if="distance.portPoints.length" class="result-panel-content">
            <ion-list class="port-list" lines="full">
              <ion-item v-for="(row, index) in distance.portPoints" :key="`${row.port.portId}-${index}`">
                <ion-label class="port-label">
                  <span class="port-name" :class="{ 'route-point-name': row.port.isWayPoint }">{{ portName(row.port) }}<small v-if="portCountryCode(row.port)">[{{ portCountryCode(row.port) }}]</small></span>
                </ion-label>
                <ion-buttons v-if="!distance.hasDistanceResult" slot="end">
                  <ion-button
                    :disabled="index === 0"
                    :aria-label="t('distance.route.moveUp')"
                    @click="distance.movePort(index, 'up')"
                  >
                    <ChevronUp :size="18" />
                  </ion-button>
                  <ion-button
                    :disabled="index === distance.portPoints.length - 1"
                    :aria-label="t('distance.route.moveDown')"
                    @click="distance.movePort(index, 'down')"
                  >
                    <ChevronDown :size="18" />
                  </ion-button>
                  <ion-button color="danger" :aria-label="t('distance.route.remove')" @click="distance.removePort(index)">
                    <Trash2 :size="18" />
                  </ion-button>
                </ion-buttons>
                <ion-note v-else-if="index > 0" slot="end" class="segment-total">
                  <span class="segment-value">{{ row.distance.toFixed(2) }}</span>
                  <small class="segment-unit">{{ t('common.unit.nauticalMileUpper') }}</small>
                  <span class="segment-sep">·</span>
                  <span class="segment-value">{{ segmentDays(row.distance) }}</span>
                  <small class="segment-unit">{{ t('common.unit.day') }}</small>
                </ion-note>
                <ion-note v-else slot="end" class="segment-origin">
                  {{ t('distance.route.originPort') }}
                </ion-note>
              </ion-item>
            </ion-list>

            <section v-if="distance.hasDistanceResult" class="distance-summary-card" :aria-label="t('distance.summary.ariaLabel')">
              <div>
                <span>{{ t('distance.summary.totalDistance') }}</span>
                <strong>
                  {{ distance.totalDistanceNm.toFixed(2) }}<small>{{ t('common.unit.nauticalMileUpper') }}</small>
                </strong>
              </div>
              <div>
                <span>
                  {{ t('distance.summary.eca') }}<em class="eca-rate">{{ t('distance.summary.ecaRate') }}</em>
                </span>
                <strong>
                  {{ distance.totalEcaDistanceNm.toFixed(2) }}<small>{{ t('common.unit.nauticalMileUpper') }}</small>
                </strong>
              </div>
              <div>
                <span>{{ t('distance.summary.sailingTime') }}</span>
                <strong>
                  {{ distance.sailingDays.toFixed(2) }}<small>{{ t('common.unit.day') }}</small>
                </strong>
              </div>
            </section>

            <section v-if="distance.hasDistanceResult" class="schedule-card" :aria-label="t('distance.schedule.ariaLabel')">
              <div class="schedule-row">
                <div class="time-block">
                  <div class="time-line">
                    <strong class="time-value">{{ departureDisplay }}</strong>
                    <button
                      class="time-action"
                      type="button"
                      :aria-label="t('distance.schedule.editDeparture')"
                      @click="departureEditorOpen = true"
                    >
                      <SquarePen :size="16" />
                    </button>
                  </div>
                  <small v-if="showDepartureZone" class="time-zone">{{ departureZoneDisplay }}</small>
                </div>

                <ArrowRight class="time-arrow" :size="12" aria-hidden="true" />

                <div class="time-block">
                  <div class="time-line">
                    <strong class="time-value">{{ arrivalBaseDisplay }}</strong>
                  </div>
                  <small v-if="showArrivalZone" class="time-zone">{{ arrivalZoneDisplay }}</small>
                </div>

                <button
                  class="time-action settings"
                  :class="{ active: timeZonePanelOpen }"
                  type="button"
                  :aria-label="t('distance.schedule.timeZoneSettings')"
                  @click="timeZonePanelOpen = !timeZonePanelOpen"
                >
                  <Settings2 :size="16" />
                </button>
              </div>

              <div v-if="timeZonePanelOpen" class="timezone-settings">
                <ion-item lines="full" class="timezone-item">
                  <ion-select
                    :value="departureTimeZone"
                    :label="t('distance.schedule.departureTimeZone')"
                    label-placement="stacked"
                    interface="popover"
                    :interface-options="timeZoneInterfaceOptions"
                    :ok-text="t('common.ok')"
                    :cancel-text="t('common.cancel')"
                    @ion-change="setTimeZone('departure', $event)"
                  >
                    <ion-select-option v-for="timeZone in timeZoneOptions" :key="`departure-${timeZone.value}`" :value="timeZone.value">
                      {{ timeZone.label }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item lines="full" class="timezone-item">
                  <ion-select
                    :value="arrivalTimeZone"
                    :label="t('distance.schedule.arrivalTimeZone')"
                    label-placement="stacked"
                    interface="popover"
                    :interface-options="timeZoneInterfaceOptions"
                    :ok-text="t('common.ok')"
                    :cancel-text="t('common.cancel')"
                    @ion-change="setTimeZone('arrival', $event)"
                  >
                    <ion-select-option v-for="timeZone in timeZoneOptions" :key="`arrival-${timeZone.value}`" :value="timeZone.value">
                      {{ timeZone.label }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
            </section>

            <section v-if="distance.hasDistanceResult" class="share-panel">
              <div class="share-toolbar">
                <ion-button fill="clear" @click="copyResult">{{ t('distance.share.copyResult') }}</ion-button>
                <ion-button fill="clear" @click="router.push('/tabs/map')">{{ t('distance.share.viewMap') }}</ion-button>
                <ion-button fill="clear" @click="shareOpen = true">{{ t('common.share') }}</ion-button>
              </div>
              <ion-button expand="block" class="budget-action" @click="createBudget">
                <Calculator :size="18" />{{ t('distance.share.budgetAction') }}
              </ion-button>
            </section>
          </div>

          <p v-if="distance.error" class="inline-error">{{ distance.error }}</p>
        </section>
      </main>
    </ion-content>

    <DistanceShareDialog :is-open="shareOpen" @close="shareOpen = false" />

    <ion-modal class="departure-modal" :is-open="departureEditorOpen" @did-dismiss="departureEditorOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ t('distance.schedule.departureTime') }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="departureEditorOpen = false">{{ t('common.done') }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="app-modal-content departure-modal-content">
        <ion-datetime
          class="departure-datetime"
          presentation="date-time"
          :locale="locale"
          :value="departurePickerValue"
          @ion-change="updateDepartureTime"
        />
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="coordinateOpen" @did-dismiss="coordinateOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ t('distance.coordinate.title') }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="coordinateOpen = false">{{ t('common.close') }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="app-modal-content coordinate-modal-content">
        <section class="coordinate-section">
          <h2 class="coordinate-section-title">{{ t('distance.coordinate.modeDecimal') }}</h2>
          <ion-list lines="full" class="coordinate-fields">
            <ion-item>
              <ion-input
                :value="coordinate.longitude"
                :label="t('distance.coordinate.longitude')"
                label-placement="floating"
                type="number"
                inputmode="decimal"
                :placeholder="t('distance.coordinate.longitudePlaceholder')"
                @ion-input="updateDecimal('longitude', $event)"
              />
            </ion-item>
            <ion-item>
              <ion-input
                :value="coordinate.latitude"
                :label="t('distance.coordinate.latitude')"
                label-placement="floating"
                type="number"
                inputmode="decimal"
                :placeholder="t('distance.coordinate.latitudePlaceholder')"
                @ion-input="updateDecimal('latitude', $event)"
              />
            </ion-item>
          </ion-list>
        </section>

        <section class="coordinate-section">
          <h2 class="coordinate-section-title">{{ t('distance.coordinate.modeDms') }}</h2>
          <ion-list lines="full" class="coordinate-fields">
            <h3 class="dms-axis">{{ t('distance.coordinate.longitude') }}</h3>
            <div class="dms-row">
              <ion-item>
                <ion-input
                  :value="dms.longitude.degree"
                  :label="t('distance.coordinate.degree')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.longitudeDegreePlaceholder')"
                  @ion-input="updateDms('longitude', 'degree', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  :value="dms.longitude.minute"
                  :label="t('distance.coordinate.minute')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.minutePlaceholder')"
                  @ion-input="updateDms('longitude', 'minute', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  :value="dms.longitude.second"
                  :label="t('distance.coordinate.second')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.secondPlaceholder')"
                  @ion-input="updateDms('longitude', 'second', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-select
                  :value="dms.longitude.direction"
                  :label="t('distance.coordinate.direction')"
                  label-placement="floating"
                  interface="popover"
                  :ok-text="t('common.ok')"
                  :cancel-text="t('common.cancel')"
                  @ion-change="updateDirection('longitude', $event)"
                >
                  <ion-select-option value="east">{{ t('distance.coordinate.east') }}</ion-select-option>
                  <ion-select-option value="west">{{ t('distance.coordinate.west') }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <h3 class="dms-axis">{{ t('distance.coordinate.latitude') }}</h3>
            <div class="dms-row">
              <ion-item>
                <ion-input
                  :value="dms.latitude.degree"
                  :label="t('distance.coordinate.degree')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.latitudeDegreePlaceholder')"
                  @ion-input="updateDms('latitude', 'degree', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  :value="dms.latitude.minute"
                  :label="t('distance.coordinate.minute')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.minutePlaceholder')"
                  @ion-input="updateDms('latitude', 'minute', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  :value="dms.latitude.second"
                  :label="t('distance.coordinate.second')"
                  label-placement="floating"
                  type="number"
                  inputmode="numeric"
                  :placeholder="t('distance.coordinate.secondPlaceholder')"
                  @ion-input="updateDms('latitude', 'second', $event)"
                />
              </ion-item>
              <ion-item>
                <ion-select
                  :value="dms.latitude.direction"
                  :label="t('distance.coordinate.direction')"
                  label-placement="floating"
                  interface="popover"
                  :ok-text="t('common.ok')"
                  :cancel-text="t('common.cancel')"
                  @ion-change="updateDirection('latitude', $event)"
                >
                  <ion-select-option value="north">{{ t('distance.coordinate.north') }}</ion-select-option>
                  <ion-select-option value="south">{{ t('distance.coordinate.south') }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </ion-list>
        </section>

        <p v-if="coordinateError" class="inline-error coordinate-error">{{ coordinateError }}</p>
        <div class="coordinate-actions">
          <ion-button fill="outline" @click="coordinateOpen = false">{{ t('common.cancel') }}</ion-button>
          <ion-button @click="addCoordinate">{{ t('common.confirm') }}</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
  toastController,
} from '@ionic/vue'
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Navigation,
  Search,
  Send,
  Settings2,
  SquarePen,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DistanceShareDialog from '@/components/distance/DistanceShareDialog.vue'
import { appRegion, defaultTimeZone as regionDefaultTimeZone } from '@/config/region'
import { useDistanceStore, type RecentDistanceCalculation } from '@/stores/distance'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import { useMapStore } from '@/stores/map'
import type { PortInfo } from '@/types'
import { portCountryCode, portCountryName, portDisplayName } from '@/utils/port'
import { copyText } from '@/utils/share'
import { appStorage } from '@/utils/storage'

type CoordinateAxis = 'longitude' | 'latitude'
type DmsPart = 'degree' | 'minute' | 'second'
type TimeZoneTarget = 'departure' | 'arrival'

interface ValueEvent {
  detail: { value?: unknown }
}

interface DateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
}

/**
 * Persisted departure time zone. Namespaced like `pd.app.locale` (see
 * `stores/locale.ts`) so the user's choice survives a restart.
 */
const TIME_ZONE_STORAGE_KEY = 'pd.app.distance.departureTimeZone'

const timeZones = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Asia/Shanghai', label: 'China (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Japan (GMT+9)' },
  { value: 'Europe/London', label: 'UK (GMT+0)' },
  { value: 'Europe/Paris', label: 'Europe (GMT+1)' },
  { value: 'America/New_York', label: 'US East (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'US West (GMT-8)' },
  { value: 'Australia/Sydney', label: 'Australia (GMT+10)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
]

/** `true` when `Intl` can format with `value`, i.e. it is a usable IANA time zone. */
function isUsableTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/**
 * Time zone reported by the device. An unknown IANA id makes the `Intl`
 * constructor throw, which is exactly the "cannot format with it" signal we
 * need, so the validation and the fallback share one try/catch.
 */
function deviceTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!zone) return ''
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return zone
  } catch {
    return ''
  }
}

/**
 * Base zone of the voyage times: device zone -> primary zone of the app region
 * -> `Asia/Shanghai`. Voyage times are typed and read in this zone; the pickers
 * only reformat the same instant, exactly like the mini program (`portdistance-mp`).
 */
function resolveBaseTimeZone() {
  return deviceTimeZone() || regionDefaultTimeZone(appRegion()) || 'Asia/Shanghai'
}

/** Fallback offsets keep the conversion working on WebViews without full time zone data. */
const fallbackTimeZoneOffsets: Record<string, number> = {
  UTC: 0,
  'Asia/Shanghai': 8,
  'Asia/Singapore': 8,
  'Asia/Tokyo': 9,
  'Europe/London': 0,
  'Europe/Paris': 1,
  'America/New_York': -5,
  'America/Los_Angeles': -8,
  'Australia/Sydney': 10,
  'Asia/Dubai': 4,
}

/**
 * `size: 'auto'` overrides the default `cover` Ionic uses for stacked labels, so
 * the dropdown is as wide as its content and long time zone names are not
 * truncated. The font comes from `.tz-select-popover` in app.css.
 */
const timeZoneInterfaceOptions = { cssClass: 'tz-select-popover', size: 'auto' }

/** `GMT+8` style offset label, used for zones outside the curated list. */
function zoneOffsetLabel(timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    const name = formatter.formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value
    if (name) return name.replace('UTC', 'GMT')
  } catch {
    // Fall through to the fixed offset table.
  }
  const offset = fallbackTimeZoneOffsets[timeZone]
  return typeof offset === 'number' ? `GMT${offset >= 0 ? '+' : ''}${offset}` : 'GMT'
}

const { t, locale } = useI18n()
const router = useRouter()
const distance = useDistanceStore()
const estimation = useEstiDeployStore()
const map = useMapStore()

const keyword = ref('')
const searchFocused = ref(false)
const coordinateOpen = ref(false)
const coordinateError = ref('')
const departureEditorOpen = ref(false)
const shareOpen = ref(false)
const timeZonePanelOpen = ref(false)
/** 基准时区：设备时区 → 地区主时区 → Asia/Shanghai */
const baseTimeZone = ref(resolveBaseTimeZone())
/** 上次选择的离港时区（appStorage 恢复），无效值直接忽略 */
const storedTimeZone = appStorage.getSync(TIME_ZONE_STORAGE_KEY)
const departureTimeZone = ref(isUsableTimeZone(storedTimeZone) ? storedTimeZone : baseTimeZone.value)
/** 用户显式选过到港时区后，到港不再跟随离港 */
const arrivalTimeZonePicked = ref(false)
const arrivalTimeZone = ref(departureTimeZone.value)
const departureDate = ref(dateValueInZone(new Date(), baseTimeZone.value))
const departureClock = ref(clockValueInZone(new Date(), baseTimeZone.value))
const coordinate = reactive({ latitude: '', longitude: '' })
const dms = reactive({
  longitude: { degree: '', minute: '', second: '', direction: 'east' },
  latitude: { degree: '', minute: '', second: '', direction: 'north' },
})

/**
 * 下拉项：固定列表 + 当前用到的列表外时区（设备时区等），
 * 否则 ion-select 会因为找不到匹配项而显示空白。
 */
const timeZoneOptions = computed(() => {
  const known = new Set(timeZones.map((timeZone) => timeZone.value))
  const extraValues = [baseTimeZone.value, departureTimeZone.value, arrivalTimeZone.value]
    .filter((value, index, list) => list.indexOf(value) === index && !known.has(value))
  return [
    ...extraValues.map((value) => ({ value, label: `${zoneShortName(value)} (${zoneOffsetLabel(value)})` })),
    ...timeZones,
  ]
})

const showSuggestions = computed(
  () => searchFocused.value && Boolean(keyword.value.trim()) && !distance.hasDistanceResult,
)
const showRecentPorts = computed(
  () => searchFocused.value && !keyword.value.trim() && !distance.hasDistanceResult,
)
const departureAt = computed(() => zonedDateTimeToUtc(departureDate.value, departureClock.value, baseTimeZone.value))
const arrivalAt = computed(() => new Date(departureAt.value.getTime() + distance.sailingDays * 86_400_000))
const departurePickerValue = computed(() => `${departureDate.value}T${departureClock.value}:00`)
const departureDisplay = computed(() => formatTimeInZone(departureAt.value, baseTimeZone.value))
const arrivalBaseDisplay = computed(() => formatTimeInZone(arrivalAt.value, baseTimeZone.value))
const showDepartureZone = computed(() => departureTimeZone.value !== baseTimeZone.value)
const showArrivalZone = computed(() => arrivalTimeZone.value !== baseTimeZone.value)
const departureZoneDisplay = computed(
  () => `${formatTimeInZone(departureAt.value, departureTimeZone.value)} (${zoneShortName(departureTimeZone.value)})`,
)
const arrivalZoneDisplay = computed(
  () => `${formatTimeInZone(arrivalAt.value, arrivalTimeZone.value)} (${zoneShortName(arrivalTimeZone.value)})`,
)

onIonViewWillEnter(() => {
  void distance.restoreRecents()
})

watch(
  () => distance.hasDistanceResult,
  (hasResult) => {
    timeZonePanelOpen.value = false
    departureEditorOpen.value = false
    if (!hasResult) return

    keyword.value = ''
    searchFocused.value = false
    const now = new Date()
    departureDate.value = dateValueInZone(now, baseTimeZone.value)
    departureClock.value = clockValueInZone(now, baseTimeZone.value)
  },
)

function textValue(event: ValueEvent) {
  const raw = event.detail.value
  return String(Array.isArray(raw) ? raw[0] || '' : raw || '')
}

function onSearchFocus() {
  if (!distance.hasDistanceResult) searchFocused.value = true
}

function onSearchBlur() {
  window.setTimeout(() => {
    searchFocused.value = false
  }, 160)
}

function closeRecentPorts() {
  searchFocused.value = false
}

function onSearchInput(event: ValueEvent) {
  keyword.value = textValue(event)
  void distance.searchPorts(keyword.value)
}

function clearKeyword() {
  keyword.value = ''
  void distance.searchPorts('')
}

function selectPort(port: PortInfo) {
  if (distance.hasDistanceResult) return
  distance.addPort(port)
  keyword.value = ''
  searchFocused.value = false
}

function setSpeed(event: ValueEvent) {
  distance.setSpeed(Number(event.detail.value || 0))
}

async function calculate() {
  await distance.calculate()
}

function closeSchedulePanels() {
  timeZonePanelOpen.value = false
  departureEditorOpen.value = false
}

/** Clear distance: keep the port list, only drop the calculated result. */
function clearRoute() {
  distance.clearResult()
  closeSchedulePanels()
}

/**
 * Clear all: empty the port list as well. The map markers are derived from
 * `distance.portPoints` (MapWorkspace -> PortDistanceMap), so the dots disappear too.
 */
function clearAllRoute() {
  distance.clearAll()
  closeSchedulePanels()
}

function segmentDays(value: number) {
  return (distance.speed > 0 ? value / distance.speed / 24 : 0).toFixed(2)
}

function portName(port: PortInfo) {
  return String(port.portName || port.fullName || port.portId || '').trim()
}

function isPortInRoute(port: PortInfo) {
  return distance.portPoints.some((row) => String(row.port.portId) === String(port.portId))
}

function resultText() {
  const route = distance.portPoints
    .map((row) => portDisplayName(row.port))
    .filter(Boolean)
    .join(' -> ')
  const distanceLine = distance.totalEcaDistanceNm > 0
    ? t('distance.share.distanceLineWithEca', {
        distance: distance.totalDistanceNm.toFixed(2),
        eca: distance.totalEcaDistanceNm.toFixed(2),
      })
    : t('distance.share.distanceLine', { distance: distance.totalDistanceNm.toFixed(2) })
  const timeLine = t('distance.share.timeLine', {
    days: distance.sailingDays.toFixed(2),
    speed: distance.speed,
  })
  return [t('distance.share.routeLine', { route }), distanceLine, timeLine].join('\n')
}

async function copyResult() {
  if (await copyText(resultText())) await presentToast(t('distance.share.copied'))
}

async function copyRecentCalculation(item: RecentDistanceCalculation) {
  const text = [
    t('distance.share.routeLine', { route: item.routeLabel }),
    t('distance.share.recentDistanceLine', {
      distance: item.totalDistanceNm.toFixed(2),
      eca: item.totalEcaDistanceNm.toFixed(2),
    }),
    t('distance.share.timeLine', { days: item.sailingDays.toFixed(2), speed: item.speed }),
  ].join('\n')
  if (await copyText(text)) await presentToast(t('distance.share.copied'))
}

function createBudget() {
  if (!distance.hasDistanceResult || distance.portPoints.length < 2) return
  estimation.initializeFromDistance(distance.portPoints, distance.speed, {
    rawRoutePoints: map.rawRoutePoints,
  })
  void router.push({ name: 'esti-deploy-editor', query: { fromDistance: '1' } })
}

function openCoordinateEditor() {
  coordinateError.value = ''
  coordinateOpen.value = true
}

function updateDecimal(axis: CoordinateAxis, event: ValueEvent) {
  coordinate[axis] = textValue(event)
  const value = Number(coordinate[axis])
  if (Number.isFinite(value) && Math.abs(value) <= maxFor(axis)) setDmsFromDecimal(axis, value)
}

function updateDms(axis: CoordinateAxis, part: DmsPart, event: ValueEvent) {
  dms[axis][part] = textValue(event)
  applyDmsToDecimal(axis)
}

function updateDirection(axis: CoordinateAxis, event: ValueEvent) {
  dms[axis].direction = textValue(event)
  applyDmsToDecimal(axis)
}

function setDmsFromDecimal(axis: CoordinateAxis, value: number) {
  const absolute = Math.abs(value)
  let degree = Math.floor(absolute)
  let minute = Math.floor((absolute - degree) * 60)
  let second = Math.round((absolute - degree - minute / 60) * 360000) / 100

  if (second >= 60) {
    second = 0
    minute += 1
  }
  if (minute >= 60) {
    minute = 0
    degree += 1
  }

  dms[axis].degree = String(degree)
  dms[axis].minute = String(minute)
  dms[axis].second = String(second)
  dms[axis].direction = axis === 'longitude'
    ? (value < 0 ? 'west' : 'east')
    : (value < 0 ? 'south' : 'north')
}

function applyDmsToDecimal(axis: CoordinateAxis) {
  const input = dms[axis]
  if (!input.degree.trim()) return

  const degree = Number(input.degree)
  const minute = Number(input.minute || 0)
  const second = Number(input.second || 0)
  const outOfRange = !Number.isInteger(degree)
    || !Number.isFinite(minute)
    || !Number.isFinite(second)
    || degree < 0
    || degree > maxFor(axis)
    || minute < 0
    || minute >= 60
    || second < 0
    || second >= 60
    || (degree === maxFor(axis) && (minute > 0 || second > 0))
  if (outOfRange) return

  const result = degree + minute / 60 + second / 3600
  const negative = axis === 'longitude' ? input.direction === 'west' : input.direction === 'south'
  coordinate[axis] = String(negative ? -result : result)
}

function maxFor(axis: CoordinateAxis) {
  return axis === 'longitude' ? 180 : 90
}

function addCoordinate() {
  const latitude = Number(coordinate.latitude)
  const longitude = Number(coordinate.longitude)
  const invalid = !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  if (invalid) {
    coordinateError.value = t('distance.coordinate.invalid')
    return
  }

  distance.addCoordinatePort(latitude, longitude)
  coordinateOpen.value = false
  coordinate.latitude = ''
  coordinate.longitude = ''
  dms.longitude = { degree: '', minute: '', second: '', direction: 'east' }
  dms.latitude = { degree: '', minute: '', second: '', direction: 'north' }
  coordinateError.value = ''
}

function updateDepartureTime(event: ValueEvent) {
  const raw = textValue(event).slice(0, 16)
  const [date, clock] = raw.split('T')
  if (!date || !clock) return
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(clock)) return

  departureDate.value = date
  departureClock.value = clock
}

function setTimeZone(target: TimeZoneTarget, event: ValueEvent) {
  const value = textValue(event)
  if (!timeZoneOptions.value.some((timeZone) => timeZone.value === value)) return

  if (target === 'departure') {
    departureTimeZone.value = value
    // 到港时区默认跟随离港时区，用户显式选过之后才独立
    if (!arrivalTimeZonePicked.value) arrivalTimeZone.value = value
    void appStorage.set(TIME_ZONE_STORAGE_KEY, value)
    return
  }

  arrivalTimeZone.value = value
  // 选回与离港一致时，恢复"跟随离港"的默认行为
  arrivalTimeZonePicked.value = value !== departureTimeZone.value
}

function twoDigits(value: number) {
  return value < 10 ? `0${value}` : String(value)
}

function fallbackDateParts(date: Date, timeZone: string): DateTimeParts {
  const offset = typeof fallbackTimeZoneOffsets[timeZone] === 'number' ? fallbackTimeZoneOffsets[timeZone] : 0
  const shifted = new Date(date.getTime() + offset * 3_600_000)
  return {
    year: String(shifted.getUTCFullYear()),
    month: twoDigits(shifted.getUTCMonth() + 1),
    day: twoDigits(shifted.getUTCDate()),
    hour: twoDigits(shifted.getUTCHours()),
    minute: twoDigits(shifted.getUTCMinutes()),
  }
}

function datePartsInZone(date: Date, timeZone: string): DateTimeParts {
  try {
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return fallbackDateParts(date, timeZone)

    // Fixed numeric pattern: the value must read the same in every language.
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    if (typeof formatter.formatToParts !== 'function') return fallbackDateParts(date, timeZone)

    const values: Partial<DateTimeParts> = {}
    formatter.formatToParts(date).forEach((part) => {
      if (
        part.type === 'year'
        || part.type === 'month'
        || part.type === 'day'
        || part.type === 'hour'
        || part.type === 'minute'
      ) {
        values[part.type] = part.value
      }
    })
    if (values.year && values.month && values.day && values.hour && values.minute) {
      return values as DateTimeParts
    }
  } catch {
    // Fall through to the fixed offset table.
  }
  return fallbackDateParts(date, timeZone)
}

function formatTimeInZone(date: Date, timeZone: string) {
  const parts = datePartsInZone(date, timeZone)
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}/${parts.month}/${parts.day} ${hour}:${parts.minute}`
}

function dateValueInZone(date: Date, timeZone: string) {
  const parts = datePartsInZone(date, timeZone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function clockValueInZone(date: Date, timeZone: string) {
  const parts = datePartsInZone(date, timeZone)
  return `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
}

function zonedDateTimeToUtc(dateText: string, timeText: string, timeZone: string) {
  const [year, month, day] = dateText.split('-').map(Number)
  const [hour, minute] = timeText.split(':').map(Number)
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const values = datePartsInZone(new Date(localAsUtc), timeZone)
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
  )
  return new Date(localAsUtc - (zonedAsUtc - localAsUtc))
}

function zoneShortName(timeZone: string) {
  const parts = timeZone.split('/')
  return (parts[parts.length - 1] || timeZone).replace(/_/g, ' ')
}

async function presentToast(message: string) {
  const toast = await toastController.create({ message, color: 'success', duration: 1500, position: 'top' })
  await toast.present()
}
</script>

<style scoped>
.distance-tab-content {
  --padding-top: 0;
  --padding-bottom: 0;
}

/*
 * 三处竖直间距共用同一个 --panel-gap，结构上保证一致（不再各写各的数值）：
 * 工具栏 ↔ 搜索栏、搜索栏 ↔ 结果面板、结果面板 ↔ 底部 tab 栏。
 * 底部 tab bar 自己已预留安全区，页面不再叠加；顶部安全区由 ion-header 承担。
 * 左右仍是 12px 的页面 gutter。
 * 注意：空态提示与「面板上沿」的间距是另一个量（.panel-empty 的 padding-top），
 * 它不计入 --panel-gap，调节两者互不影响。
 */
.distance-page {
  --panel-gap: 16px;
  /* 搜索面板与结果面板共用同一条边框，方便直接目视比对两条缝 */
  --panel-border: #cfdded;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: var(--panel-gap) 12px;
  background: #eef3f8;
}

/* ---------- 搜索区 ---------- */
.top-search-area {
  position: relative;
  z-index: 4;
}

.search-row {
  display: flex;
  /* 行高锁死 46px：任何一个子元素被内容撑高都会把「搜索框 ↔ 结果面板」的缝顶开 */
  height: 46px;
  align-items: center;
  gap: 4px;
}

/*
 * 搜索框用 ion-item + ion-input 而不是 ion-searchbar：iOS 下 ion-searchbar 的
 * 可视输入框高度被 shadow DOM 固定在 36px（--min-height，无 part / 变量可覆盖），
 * 无法与 46px 的坐标按钮等高。这里自己做，高度完全可控。
 */
.search-field {
  flex: 1;
  min-width: 0;
  height: 46px;
  --min-height: 46px;
  --background: #ffffff;
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 4px;
  --inner-border-width: 0;
  border: 1px solid var(--panel-border, #cfdded);
  border-radius: 8px;
}

.search-field svg {
  flex: none;
  color: #1d4b7f;
}

.search-field-disabled {
  opacity: 0.6;
}

.search-field ion-input {
  min-width: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 8px;
  --padding-end: 4px;
}

.search-clear {
  display: grid;
  flex: none;
  width: 26px;
  height: 26px;
  margin-right: 4px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #eef3f8;
  color: #64748b;
}

/* 与搜索框等高（46px），但更窄、图标更小，视觉上更轻 */
/* 无边框正方形按钮，高度与搜索框一致 */
.coordinate-trigger {
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  margin: 0;
  --color: #1d4b7f;
  --padding-start: 0;
  --padding-end: 0;
  /* 与搜索框同高：按钮原生 min-height 若大于 46px 会把整行撑高，缝就被顶开 */
  --min-height: 46px;
  max-height: 46px;
}

/* 浮层面板：绝对定位，不再把结果面板往下挤 */
.floating-panel {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 6;
  margin: 0;
  overflow: hidden;
  border: 1px solid #d9e4ed;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(26, 48, 66, 0.14);
}

.search-popover {
  max-height: 340px;
  overflow-y: auto;
}

.search-popover ion-item {
  --min-height: 46px;
  --padding-start: 14px;
  --padding-end: 14px;
}

.suggest-label {
  overflow: hidden;
  color: #243748;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 国家名比港口名轻一号 */
.suggest-label small {
  margin-left: 4px;
  color: #6e8192;
  font-size: 13px;
  font-weight: 400;
}

.recent-port-panel {
  padding: 5px 10px 8px;
}

.recent-port-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.recent-port-ops {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recent-port-ops ion-button {
  width: 28px;
  min-width: 28px;
  height: 28px;
  margin: 0;
  --color: #64748b;
  --padding-start: 0;
  --padding-end: 0;
}

.recent-port-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.recent-port-chips ion-chip {
  height: 30px;
  margin: 0;
  padding: 0 11px;
  border: 1px solid #d6e2ef;
  --background: #ffffff;
  --color: #334155;
  font-size: 13px;
}

.recent-port-chips ion-chip ion-label {
  font-size: 13px;
}

.recent-port-chips ion-chip.selected {
  --background: #e7f3fb;
  --color: #005f88;
  border-color: #9dc9df;
}

.empty-note {
  margin: 6px 0 0;
  color: #8a99a7;
  font-size: 13px;
}

/* ---------- 结果面板 ---------- */
.result-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  /* 与工具栏 ↔ 搜索栏、结果面板 ↔ 底部 tab 栏共用 --panel-gap */
  margin-top: var(--panel-gap);
  overflow: hidden;
  border: 1px solid var(--panel-border, #cfdded);
  border-radius: 8px;
  background: #ffffff;
}

.result-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 12px 8px 12px 12px;
  border-bottom: 1px solid #e6edf3;
}

/* 航速：ion-item + ion-input 的紧凑风格，不使用 outline */
.speed-item {
  flex: none;
  width: 92px;
  --min-height: 34px;
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
  font-size: 13px;
}

.speed-item ion-input {
  min-width: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  font-size: 16px;
}

.speed-unit {
  padding-left: 4px;
  color: #526579;
  white-space: nowrap;
}

.result-panel-ops {
  display: flex;
  align-items: center;
  gap: 6px;
}

.result-panel-ops ion-button {
  min-height: 34px;
  margin: 0;
  font-size: 14px;
}

/* 选择器带上父级：否则会被上面 .result-panel-ops ion-button 的 min-height/font-size 覆盖 */
.result-panel-ops ion-button.calculate-button {
  min-height: 38px;
  --border-radius: 6px;
  --padding-start: 30px;
  --padding-end: 30px;
  font-size: 16px;
}

.clear-result-button {
  --border-radius: 6px;
  --background: #dbeef6;
  --color: #1c5878;
  --padding-start: 14px;
  --padding-end: 14px;
}

.panel-empty {
  display: grid;
  flex: 1;
  min-height: 240px;
  /* 空态内容靠上：面板被 flex 拉伸时不再把提示推到面板正中（否则会上百像素空白）。
     这里的 padding-top 是「提示 ↔ 面板上沿」的距离，独立于 --panel-gap：
     面板边框到搜索框仍是 --panel-gap(16px)，提示再往里 40px。 */
  justify-items: center;
  align-content: start;
  gap: 12px;
  padding: 40px 24px 24px;
  color: #94a3b8;
  text-align: center;
}

.panel-empty p {
  margin: 0;
  font-size: 14px;
}

.result-panel-content {
  flex: 1;
}

/* ---------- 港口列表 ---------- */
.port-list {
  margin: 0;
}

.port-list ion-item {
  --min-height: 52px;
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-end: 0;
}

.port-name {
  display: block;
  overflow: hidden;
  color: #243748;
  font-size: 15px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.port-name small {
  margin-left: 3px;
  color: #6e8192;
  font-size: 11px;
  font-weight: 400;
}

.port-name.route-point-name {
  color: #315c7b;
  font-style: italic;
}

.segment-total {
  color: #111827;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* 数值比单位大一号，单位保持原尺寸 */
.segment-value {
  font-size: 15px;
}

/* 与汇总卡片里的单位保持一致（字号/颜色），并与数值空开一格 */
.segment-unit {
  margin-left: 3px;
  color: #4b5f70;
  font-size: 12px;
  font-weight: 400;
}

.segment-sep {
  margin: 0 2px;
  color: #94a3b8;
}

.segment-origin {
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
}

.port-list ion-button {
  margin: 0;
  --padding-start: 4px;
  --padding-end: 4px;
}

.port-list ion-button[color='danger'] {
  --color: #cf8179;
}

/* ---------- 航程汇总 ---------- */
.distance-summary-card {
  display: grid;
  /* 航行时间列窄一些 */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 30%;
  margin: 8px 4px 0;
  background: transparent;
}

.distance-summary-card > div {
  min-width: 0;
  padding: 12px 4px;
  text-align: center;
}

.distance-summary-card span,
.distance-summary-card strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.distance-summary-card span {
  color: #6c7e8d;
  font-size: 12px;
  font-weight: 400;
}

.distance-summary-card strong {
  margin-top: 4px;
  color: #173447;
  font-size: 17px;
  font-weight: 600;
}

.distance-summary-card strong small {
  margin-left: 3px;
  color: #4b5f70;
  font-size: 12px;
  font-weight: 400;
}

.eca-rate {
  margin-left: 0;
  color: var(--ion-color-success, #17815d);
  font-style: normal;
  font-weight: 500;
}

/* ---------- 航程时间 ---------- */
.schedule-card {
  margin: 0;
  padding: 18px 10px;
  border: 0;
  border-top: 1px solid #e2eaf0;
  border-radius: 0;
  background: #f5f9fb;
}

.schedule-row {
  display: grid;
  /*
   * 离港列吃掉剩余宽度（日期 "2026/07/29 14:05" 在 15px 字号下实测约 119px，
   * 加上按钮后强行走等宽分列会被省略号截断），到港列按内容宽度，箭头保持窄；
   * 两个操作按钮（离港"设置时间"、到港"时区设置"）共用 --schedule-action-size，
   * 因此左右宽度完全一致，包括各自所在的网格列。
   */
  grid-template-columns: minmax(0, 1fr) auto auto var(--schedule-action-size);
  align-items: center;
  gap: 5px;
  --schedule-action-size: 28px;
}

.time-block {
  min-width: 0;
}

.time-line {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-value {
  overflow: hidden;
  color: #111827;
  font-size: 15px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-action {
  display: grid;
  flex: none;
  width: var(--schedule-action-size, 28px);
  height: var(--schedule-action-size, 28px);
  padding: 0;
  place-items: center;
  border: 1px solid #d6e2ef;
  border-radius: 6px;
  background: #ffffff;
  color: #315c7b;
}

/* 时区按钮固定贴到该列右端，与离港侧的设置时间按钮保持同样的宽度 */
.time-action.settings {
  justify-self: end;
}

.time-action.settings.active {
  border-color: #005f88;
  background: #005f88;
  color: #ffffff;
}

.time-zone {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #718293;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-arrow {
  color: #94a3b8;
}

/* 出发/到达时区：同一行、下划线风格（ion-item），不使用 outline */
.timezone-settings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #d7e3ec;
}

.timezone-item {
  min-width: 0;
  --min-height: 52px;
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
}

/* 让完整时区名显示得下（app.css 为防 iOS 聚焦缩放把控件字号锁在 16px） */
.timezone-item ion-select {
  min-width: 0;
  font-size: 14px !important;
}

/* 出发时间用居中的对话框，而不是整页 modal */
.departure-modal {
  --width: 340px;
  --max-width: 92vw;
  /* 固定高度：ion-content 需要一个有界高度才能正常滚动 */
  --height: 520px;
  --max-height: 86vh;
  --border-radius: 14px;
  --box-shadow: 0 18px 40px rgba(23, 43, 58, 0.28);
  --backdrop-opacity: 0.42;
}

.departure-modal-content {
  /* 日期上下留白稍微大一点 */
  --padding-top: 22px;
  --padding-bottom: 26px;
}

.departure-datetime {
  display: block;
  margin: 0 auto;
}

/* ---------- 分享 ---------- */
.share-panel {
  margin: 16px 10px 20px;
}

.share-toolbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.share-toolbar ion-button {
  min-height: 40px;
  margin: 0;
  --color: #275b80;
  --padding-start: 2px;
  --padding-end: 2px;
  font-size: 14px;
  font-weight: 600;
}

.budget-action {
  margin: 10px 0 0;
  --border-radius: 7px;
  --background: #0058a2;
  font-weight: 700;
}

/* ---------- 最近航程 ---------- */
.recent-calculations-panel {
  padding: 12px;
  border-top: 1px solid #e8eef5;
  background: #fbfdff;
}

.recent-calculations-panel h2 {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 12px;
}

.recent-calculation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-top: 1px solid #edf2f7;
}

.recent-calculation-item:first-of-type {
  border-top: 0;
}

.recent-calculation-main {
  min-width: 0;
  flex: 1;
}

.recent-calculation-main strong,
.recent-calculation-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-calculation-main strong {
  color: #334155;
  font-size: 13px;
  font-weight: 500;
}

.recent-calculation-main span {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.recent-calculation-item ion-button {
  margin: 0;
  --color: #0058a2;
  /* 右侧留白收紧：文字与面板内边距对齐 */
  --padding-start: 8px;
  --padding-end: 0;
  font-size: 13px;
}

/* ---------- 弹窗：出发时间 / 坐标输入 ---------- */
.app-modal-content {
  --padding-top: 12px;
  --padding-bottom: calc(16px + env(safe-area-inset-bottom));
  --padding-start: 10px;
  --padding-end: 10px;
}

.coordinate-section-title {
  margin: 4px 0 8px;
  color: #334155;
  font-size: 15px;
  font-weight: 700;
}

.coordinate-section + .coordinate-section {
  margin-top: 18px;
}

.dms-axis {
  margin: 10px 0 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
}

/*
 * 经纬度输入用 Ionic 官方的下划线风格：ion-list lines="full" + ion-item +
 * label-placement="floating"，不写 fill。md 模式下 ion-input 默认的 solid fill
 * 会画一层灰底和自带的底部边框，这里清掉，只留 item 的下划线。
 */
.coordinate-fields ion-input,
.coordinate-fields ion-select {
  --background: transparent;
  --border-width: 0;
  /* md 的 solid fill 会加 16px 内边距，4 列格子放不下 */
  --padding-start: 4px;
  --padding-end: 4px;
}

.coordinate-fields ion-item {
  --min-height: 52px;
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
}

.dms-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 1.05fr;
  gap: 10px;
}

.dms-row ion-item {
  --min-height: 48px;
}

.coordinate-error {
  margin: 10px 0 0;
}

.coordinate-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
  margin-top: 14px;
}

.coordinate-actions ion-button {
  margin: 0;
}

@media (min-width: 620px) {
  .distance-page {
    max-width: 680px;
    margin: 0 auto;
  }
}
</style>
