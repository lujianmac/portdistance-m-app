<template>
  <ion-page>
    <ion-content class="distance-tab-content">
      <main class="distance-page" :aria-label="t('distance.page.title')">
        <section class="top-search-area">
          <div class="search-row">
            <ion-searchbar :model-value="keyword" class="port-search" :disabled="distance.hasDistanceResult" :placeholder="t('distance.search.portPlaceholder')" :cancel-button-text="t('common.cancel')" @ion-focus="onSearchFocus" @ion-blur="onSearchBlur" @ion-input="onSearchInput" />
            <ion-button class="coordinate-trigger" fill="outline" :aria-label="t('distance.coordinate.title')" :disabled="distance.hasDistanceResult" @click="openCoordinateEditor"><Send :size="18" /></ion-button>
          </div>
          <ion-list v-if="showSuggestions" class="floating-panel search-popover" lines="full">
            <ion-item v-if="distance.searching"><ion-label color="medium">{{ t('common.searching') }}</ion-label></ion-item>
            <ion-item v-else-if="!distance.suggestPorts.length"><ion-label color="medium">{{ t('distance.search.noSuggestions') }}</ion-label></ion-item>
            <ion-item v-for="port in distance.suggestPorts" :key="String(port.portId)" button :detail="false" @click="selectPort(port)"><ion-label class="suggest-label">{{ formatSuggestLabel(port) }}</ion-label></ion-item>
          </ion-list>
          <section v-if="showRecentPorts" class="floating-panel recent-port-panel" :aria-label="t('distance.recentPorts.ariaLabel')">
            <div class="recent-port-head">
              <span>{{ t('distance.recentPorts.title') }}</span>
              <div class="recent-port-ops">
                <ion-button fill="clear" :aria-label="t('distance.recentPorts.clear')" @click="distance.clearRecentPorts()"><Trash2 :size="16" /></ion-button>
                <ion-button fill="clear" :aria-label="t('distance.recentPorts.close')" @click="closeRecentPorts"><X :size="17" /></ion-button>
              </div>
            </div>
            <p v-if="!distance.recentPorts.length" class="empty-note">{{ t('distance.recentPorts.empty') }}</p>
            <div v-else class="recent-port-chips">
              <ion-chip v-for="port in distance.recentPorts" :key="`recent-${String(port.portId)}`" :class="{ selected: isPortInRoute(port) }" button @click="selectPort(port)"><ion-label>{{ formatPortLabel(port) }}</ion-label></ion-chip>
            </div>
          </section>
        </section>

        <section class="result-panel" aria-live="polite">
          <header v-if="distance.portPoints.length" class="result-panel-header">
            <div class="speed-box">
              <ion-input :value="String(distance.speed)" :aria-label="t('distance.route.speedLabel')" inputmode="decimal" type="number" @ion-input="setSpeed" /><span>{{ t('common.unit.knot') }}</span></div>
            <div class="result-panel-ops">
              <ion-button v-if="distance.portPoints.length >= 2 && !distance.hasDistanceResult" class="calculate-button" :disabled="distance.calculating" @click="calculate">{{ distance.calculating ? t('distance.route.calculating') : t('distance.route.getDistance') }}</ion-button>
              <ion-button v-else-if="distance.hasDistanceResult" class="clear-result-button" @click="clearRoute">{{ t('distance.route.clearDistance') }}</ion-button>
              <ion-button v-if="distance.hasDistanceResult" class="clear-result-button" color="medium" @click="clearRoute">{{ t('distance.route.clearAll') }}</ion-button>
            </div>
          </header>
          <div v-if="!distance.portPoints.length" class="panel-empty"><Navigation :size="28" /><p>{{ t('distance.route.emptyHint') }}</p></div>
          <section v-if="!distance.portPoints.length && distance.recentCalculations.length" class="recent-calculations-panel" :aria-label="t('distance.recentCalculations.title')">
            <h2>{{ t('distance.recentCalculations.title') }}</h2>
            <article v-for="item in distance.recentCalculations" :key="item.createdAt" class="recent-calculation-item"><div class="recent-calculation-main"><strong>{{ item.routeLabel }}</strong><span>{{ t('distance.recentCalculations.summary', { distance: item.totalDistanceNm.toFixed(2), eca: item.totalEcaDistanceNm.toFixed(2), days: item.sailingDays.toFixed(2), speed: item.speed }) }}</span></div><ion-button fill="clear" size="small" @click="copyRecentCalculation(item)">{{ t('common.copy') }}</ion-button></article>
          </section>
          <div v-if="distance.portPoints.length" class="result-panel-content">
            <ion-list class="port-list" lines="full">
              <ion-item v-for="(row, index) in distance.portPoints" :key="`${row.port.portId}-${index}`">
                <ion-label class="port-label"><span class="port-name" :class="{ 'route-point-name': row.port.isWayPoint }">{{ row.port.portName }}<small v-if="countryCode(row.port)">{{ countryCode(row.port) }}</small></span></ion-label>
                <ion-buttons v-if="!distance.hasDistanceResult" slot="end"><ion-button :disabled="index === 0" :aria-label="t('distance.route.moveUp')" @click="distance.movePort(index, 'up')"><ChevronUp :size="18" /></ion-button><ion-button :disabled="index === distance.portPoints.length - 1" :aria-label="t('distance.route.moveDown')" @click="distance.movePort(index, 'down')"><ChevronDown :size="18" /></ion-button><ion-button color="danger" :aria-label="t('distance.route.remove')" @click="distance.removePort(index)"><Trash2 :size="18" /></ion-button></ion-buttons>
                <ion-note v-else-if="index > 0" slot="end" class="segment-total">{{ t('distance.route.segment', { distance: row.distance.toFixed(2), days: segmentDays(row.distance) }) }}</ion-note>
                <ion-note v-else slot="end" class="segment-origin">{{ t('distance.route.originPort') }}</ion-note>
              </ion-item>
            </ion-list>
            <section v-if="distance.hasDistanceResult" class="distance-summary-card" :aria-label="t('distance.summary.ariaLabel')">
              <div><span>{{ t('distance.summary.totalDistance') }}</span><strong>{{ distance.totalDistanceNm.toFixed(2) }}<small>{{ t('common.unit.nauticalMile') }}</small></strong></div>
              <div><span>{{ ecaRateLabel }}</span><strong>{{ distance.totalEcaDistanceNm.toFixed(2) }}<small>{{ t('common.unit.nauticalMile') }}</small></strong></div>
              <div><span>{{ t('distance.summary.sailingTime') }}</span><strong>{{ distance.sailingDays.toFixed(2) }}<small>{{ t('common.unit.day') }}</small></strong></div>
            </section>
            <section v-if="distance.hasDistanceResult" class="schedule-card" :aria-label="t('distance.schedule.ariaLabel')">
              <div class="schedule-row">
                <div class="time-block">
                  <div class="time-line">
                    <strong class="time-value">{{ departureDisplay }}</strong>
                    <button class="time-action" type="button" :aria-label="t('distance.schedule.editDeparture')" @click="departureEditorOpen = true"><SquarePen :size="15" /></button>
                  </div>
                  <small v-if="showDepartureZone" class="time-zone">{{ departureZoneDisplay }}</small>
                </div>
                <ArrowRight class="time-arrow" :size="18" aria-hidden="true" />
                <div class="time-block">
                  <div class="time-line"><strong class="time-value">{{ arrivalBaseDisplay }}</strong></div>
                  <small v-if="showArrivalZone" class="time-zone">{{ arrivalZoneDisplay }}</small>
                </div>
                <button class="time-action settings" :class="{ active: timeZonePanelOpen }" type="button" :aria-label="t('distance.schedule.timeZoneSettings')" @click="timeZonePanelOpen = !timeZonePanelOpen"><Settings2 :size="15" /></button>
              </div>
              <div v-if="timeZonePanelOpen" class="timezone-settings">
                <ion-select :value="departureTimeZone" :label="t('distance.schedule.departureTimeZone')" fill="outline" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="setTimeZone('departure', $event)"><ion-select-option v-for="timeZone in timeZones" :key="`departure-${timeZone.value}`" :value="timeZone.value">{{ timeZone.label }}</ion-select-option></ion-select>
                <ion-select :value="arrivalTimeZone" :label="t('distance.schedule.arrivalTimeZone')" fill="outline" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="setTimeZone('arrival', $event)"><ion-select-option v-for="timeZone in timeZones" :key="`arrival-${timeZone.value}`" :value="timeZone.value">{{ timeZone.label }}</ion-select-option></ion-select>
              </div>
            </section>
            <section v-if="distance.hasDistanceResult" class="share-panel"><div class="share-toolbar"><ion-button fill="clear" @click="copyResult">{{ t('distance.share.copyResult') }}</ion-button><ion-button fill="clear" @click="router.push('/tabs/map')">{{ t('distance.share.viewMap') }}</ion-button><ion-button fill="clear" @click="share">{{ t('common.share') }}</ion-button></div><ion-button expand="block" class="budget-action" @click="createBudget"><Calculator :size="18" />{{ t('distance.share.budgetAction') }}</ion-button></section>
          </div>
          <p v-if="distance.error" class="inline-error">{{ distance.error }}</p>
        </section>
      </main>
    </ion-content>

    <ion-modal :is-open="departureEditorOpen" @did-dismiss="departureEditorOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('distance.schedule.departureTime') }}</ion-title><ion-buttons slot="end"><ion-button @click="departureEditorOpen = false">{{ t('common.done') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="coordinate-modal-content"><ion-datetime class="departure-datetime" presentation="date-time" :locale="locale" :value="departurePickerValue" @ion-change="updateDepartureTime" /></ion-content>
    </ion-modal>

    <ion-modal :is-open="coordinateOpen" @did-dismiss="coordinateOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('distance.coordinate.title') }}</ion-title><ion-buttons slot="end"><ion-button @click="coordinateOpen = false">{{ t('common.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="coordinate-modal-content">
        <section class="coordinate-section">
          <h2 class="coordinate-section-title">{{ t('distance.coordinate.modeDecimal') }}</h2>
          <ion-list inset>
            <ion-item><ion-input :value="coordinate.longitude" :label="t('distance.coordinate.longitude')" fill="outline" label-placement="floating" type="number" inputmode="decimal" :placeholder="t('distance.coordinate.longitudePlaceholder')" @ion-input="updateDecimal('longitude', $event)" /></ion-item>
            <ion-item><ion-input :value="coordinate.latitude" :label="t('distance.coordinate.latitude')" fill="outline" label-placement="floating" type="number" inputmode="decimal" :placeholder="t('distance.coordinate.latitudePlaceholder')" @ion-input="updateDecimal('latitude', $event)" /></ion-item>
          </ion-list>
        </section>
        <section class="coordinate-section">
          <h2 class="coordinate-section-title">{{ t('distance.coordinate.modeDms') }}</h2>
          <h3 class="dms-axis">{{ t('distance.coordinate.longitude') }}</h3>
          <div class="dms-row">
            <ion-input :value="dms.longitude.degree" :label="t('distance.coordinate.degree')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.longitudeDegreePlaceholder')" @ion-input="updateDms('longitude', 'degree', $event)" />
            <ion-input :value="dms.longitude.minute" :label="t('distance.coordinate.minute')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.minutePlaceholder')" @ion-input="updateDms('longitude', 'minute', $event)" />
            <ion-input :value="dms.longitude.second" :label="t('distance.coordinate.second')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.secondPlaceholder')" @ion-input="updateDms('longitude', 'second', $event)" />
            <ion-select :value="dms.longitude.direction" :label="t('distance.coordinate.direction')" fill="outline" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateDirection('longitude', $event)"><ion-select-option value="east">{{ t('distance.coordinate.east') }}</ion-select-option><ion-select-option value="west">{{ t('distance.coordinate.west') }}</ion-select-option></ion-select>
          </div>
          <h3 class="dms-axis">{{ t('distance.coordinate.latitude') }}</h3>
          <div class="dms-row">
            <ion-input :value="dms.latitude.degree" :label="t('distance.coordinate.degree')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.latitudeDegreePlaceholder')" @ion-input="updateDms('latitude', 'degree', $event)" />
            <ion-input :value="dms.latitude.minute" :label="t('distance.coordinate.minute')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.minutePlaceholder')" @ion-input="updateDms('latitude', 'minute', $event)" />
            <ion-input :value="dms.latitude.second" :label="t('distance.coordinate.second')" fill="outline" label-placement="floating" type="number" inputmode="numeric" :placeholder="t('distance.coordinate.secondPlaceholder')" @ion-input="updateDms('latitude', 'second', $event)" />
            <ion-select :value="dms.latitude.direction" :label="t('distance.coordinate.direction')" fill="outline" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateDirection('latitude', $event)"><ion-select-option value="north">{{ t('distance.coordinate.north') }}</ion-select-option><ion-select-option value="south">{{ t('distance.coordinate.south') }}</ion-select-option></ion-select>
          </div>
        </section>
        <p v-if="coordinateError" class="inline-error coordinate-error">{{ coordinateError }}</p>
        <div class="coordinate-actions"><ion-button fill="outline" @click="coordinateOpen = false">{{ t('common.cancel') }}</ion-button><ion-button @click="addCoordinate">{{ t('common.confirm') }}</ion-button></div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { IonButton, IonButtons, IonChip, IonContent, IonDatetime, IonHeader, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar, onIonViewWillEnter, toastController } from '@ionic/vue'
import { ArrowRight, Calculator, ChevronDown, ChevronUp, Navigation, Send, Settings2, SquarePen, Trash2, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDistanceStore, type RecentDistanceCalculation } from '@/stores/distance'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import { useMapStore } from '@/stores/map'
import type { PortInfo } from '@/types'
import { copyText, shareText } from '@/utils/share'

type CoordinateAxis = 'longitude' | 'latitude'
type DmsPart = 'degree' | 'minute' | 'second'
type TimeZoneTarget = 'departure' | 'arrival'
type ValueEvent = { detail: { value?: unknown } }

interface DateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
}

/** Voyage times are entered as China time; the time zone pickers only reformat the same instant. */
const defaultTimeZone = 'Asia/Shanghai'
const timeZones = [{ value: 'UTC', label: 'UTC (GMT+0)' }, { value: 'Asia/Shanghai', label: 'China (GMT+8)' }, { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' }, { value: 'Asia/Tokyo', label: 'Japan (GMT+9)' }, { value: 'Europe/London', label: 'UK (GMT+0)' }, { value: 'Europe/Paris', label: 'Europe (GMT+1)' }, { value: 'America/New_York', label: 'US East (GMT-5)' }, { value: 'America/Los_Angeles', label: 'US West (GMT-8)' }, { value: 'Australia/Sydney', label: 'Australia (GMT+10)' }, { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' }]
/** Fallback offsets keep the conversion working on WebViews without full time zone data. */
const fallbackTimeZoneOffsets: Record<string, number> = { UTC: 0, 'Asia/Shanghai': 8, 'Asia/Singapore': 8, 'Asia/Tokyo': 9, 'Europe/London': 0, 'Europe/Paris': 1, 'America/New_York': -5, 'America/Los_Angeles': -8, 'Australia/Sydney': 10, 'Asia/Dubai': 4 }

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
const timeZonePanelOpen = ref(false)
const departureDate = ref(dateValueInZone(new Date(), defaultTimeZone))
const departureClock = ref(clockValueInZone(new Date(), defaultTimeZone))
const departureTimeZone = ref(defaultTimeZone)
const arrivalTimeZone = ref(defaultTimeZone)
const coordinate = reactive({ latitude: '', longitude: '' })
const dms = reactive({ longitude: { degree: '', minute: '', second: '', direction: 'east' }, latitude: { degree: '', minute: '', second: '', direction: 'north' } })
const showSuggestions = computed(() => searchFocused.value && Boolean(keyword.value.trim()) && !distance.hasDistanceResult)
const showRecentPorts = computed(() => searchFocused.value && !keyword.value.trim() && !distance.hasDistanceResult)
const departureAt = computed(() => zonedDateTimeToUtc(departureDate.value, departureClock.value, defaultTimeZone))
const arrivalAt = computed(() => new Date(departureAt.value.getTime() + distance.sailingDays * 86_400_000))
const departurePickerValue = computed(() => `${departureDate.value}T${departureClock.value}:00`)
const departureDisplay = computed(() => formatTimeInZone(departureAt.value, defaultTimeZone))
const arrivalBaseDisplay = computed(() => formatTimeInZone(arrivalAt.value, defaultTimeZone))
const showDepartureZone = computed(() => departureTimeZone.value !== defaultTimeZone)
const showArrivalZone = computed(() => arrivalTimeZone.value !== defaultTimeZone)
const departureZoneDisplay = computed(() => `${formatTimeInZone(departureAt.value, departureTimeZone.value)} (${zoneShortName(departureTimeZone.value)})`)
const arrivalZoneDisplay = computed(() => `${formatTimeInZone(arrivalAt.value, arrivalTimeZone.value)} (${zoneShortName(arrivalTimeZone.value)})`)
const ecaRateLabel = computed(() => t('distance.summary.ecaWithRate', { rate: ecaRatePercent() }))

onIonViewWillEnter(() => { void distance.restoreRecents() })
watch(() => distance.hasDistanceResult, (hasResult) => {
  timeZonePanelOpen.value = false
  departureEditorOpen.value = false
  if (!hasResult) return
  keyword.value = ''
  searchFocused.value = false
  const now = new Date()
  departureDate.value = dateValueInZone(now, defaultTimeZone)
  departureClock.value = clockValueInZone(now, defaultTimeZone)
})
function textValue(event: ValueEvent) { return String(Array.isArray(event.detail.value) ? event.detail.value[0] || '' : event.detail.value || '') }
function onSearchFocus() { if (!distance.hasDistanceResult) searchFocused.value = true }
function onSearchBlur() { window.setTimeout(() => { searchFocused.value = false }, 160) }
function closeRecentPorts() { searchFocused.value = false }
function onSearchInput(event: ValueEvent) { keyword.value = textValue(event); void distance.searchPorts(keyword.value) }
function selectPort(port: PortInfo) { if (distance.hasDistanceResult) return; distance.addPort(port); keyword.value = ''; searchFocused.value = false }
function setSpeed(event: ValueEvent) { distance.setSpeed(Number(event.detail.value || 0)) }
async function calculate() { await distance.calculate() }
function clearRoute() { distance.clearResult(); timeZonePanelOpen.value = false; departureEditorOpen.value = false }
function segmentDays(value: number) { return (distance.speed > 0 ? value / distance.speed / 24 : 0).toFixed(2) }
function formatPortLabel(port: PortInfo) { return String(port.portName || port.fullName || port.portId || '').trim() }
function formatSuggestLabel(port: PortInfo) { const name = formatPortLabel(port); const country = String(port.countryCode || '').trim(); return country ? `${name}, ${country.toUpperCase()}` : name }
function countryCode(port: PortInfo) { if (port.isCoordinate || port.isWayPoint) return ''; const code = String(port.countryCode || '').trim(); return /^[A-Za-z]{2}$/.test(code) ? `[${code.toUpperCase()}]` : '' }
function isPortInRoute(port: PortInfo) { return distance.portPoints.some((row) => String(row.port.portId) === String(port.portId)) }
function ecaRatePercent() { const total = Number(distance.totalDistanceNm || 0); if (total <= 0) return '0.0'; return ((Number(distance.totalEcaDistanceNm || 0) / total) * 100).toFixed(1) }
function resultText() { const routeLabel = distance.portPoints.map((row) => `${row.port.portName}${countryCode(row.port)}`).filter(Boolean).join(' -> '); const distanceLine = distance.totalEcaDistanceNm > 0 ? t('distance.share.distanceLineWithEca', { distance: distance.totalDistanceNm.toFixed(2), eca: distance.totalEcaDistanceNm.toFixed(2) }) : t('distance.share.distanceLine', { distance: distance.totalDistanceNm.toFixed(2) }); return [t('distance.share.routeLine', { route: routeLabel }), distanceLine, t('distance.share.timeLine', { days: distance.sailingDays.toFixed(2), speed: distance.speed })].join('\n') }
async function copyResult() { if (await copyText(resultText())) await presentToast(t('distance.share.copied')) }
async function copyRecentCalculation(item: RecentDistanceCalculation) { const text = [t('distance.share.routeLine', { route: item.routeLabel }), t('distance.share.recentDistanceLine', { distance: item.totalDistanceNm.toFixed(2), eca: item.totalEcaDistanceNm.toFixed(2) }), t('distance.share.timeLine', { days: item.sailingDays.toFixed(2), speed: item.speed })].join('\n'); if (await copyText(text)) await presentToast(t('distance.share.copied')) }
async function share() { await shareText(t('distance.share.title'), resultText()) }
function createBudget() { if (!distance.hasDistanceResult || distance.portPoints.length < 2) return; estimation.initializeFromDistance(distance.portPoints, distance.speed, { rawRoutePoints: map.rawRoutePoints }); void router.push({ name: 'esti-deploy-editor', query: { fromDistance: '1' } }) }
function openCoordinateEditor() { coordinateError.value = ''; coordinateOpen.value = true }
function updateDecimal(axis: CoordinateAxis, event: ValueEvent) { coordinate[axis] = textValue(event); const value = Number(coordinate[axis]); if (Number.isFinite(value) && Math.abs(value) <= maxFor(axis)) setDmsFromDecimal(axis, value) }
function updateDms(axis: CoordinateAxis, part: DmsPart, event: ValueEvent) { dms[axis][part] = textValue(event); applyDmsToDecimal(axis) }
function updateDirection(axis: CoordinateAxis, event: ValueEvent) { dms[axis].direction = textValue(event); applyDmsToDecimal(axis) }
function setDmsFromDecimal(axis: CoordinateAxis, value: number) { const absolute = Math.abs(value); let degree = Math.floor(absolute); let minute = Math.floor((absolute - degree) * 60); let second = Math.round((absolute - degree - minute / 60) * 360000) / 100; if (second >= 60) { second = 0; minute += 1 }; if (minute >= 60) { minute = 0; degree += 1 }; dms[axis].degree = String(degree); dms[axis].minute = String(minute); dms[axis].second = String(second); dms[axis].direction = axis === 'longitude' ? (value < 0 ? 'west' : 'east') : (value < 0 ? 'south' : 'north') }
function applyDmsToDecimal(axis: CoordinateAxis) { const input = dms[axis]; if (!input.degree.trim()) return; const degree = Number(input.degree); const minute = Number(input.minute || 0); const second = Number(input.second || 0); if (!Number.isInteger(degree) || !Number.isFinite(minute) || !Number.isFinite(second) || degree < 0 || degree > maxFor(axis) || minute < 0 || minute >= 60 || second < 0 || second >= 60 || (degree === maxFor(axis) && (minute > 0 || second > 0))) return; const result = degree + minute / 60 + second / 3600; const negative = axis === 'longitude' ? input.direction === 'west' : input.direction === 'south'; coordinate[axis] = String(negative ? -result : result) }
function maxFor(axis: CoordinateAxis) { return axis === 'longitude' ? 180 : 90 }
function addCoordinate() { const latitude = Number(coordinate.latitude); const longitude = Number(coordinate.longitude); if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) { coordinateError.value = t('distance.coordinate.invalid'); return }; distance.addCoordinatePort(latitude, longitude); coordinateOpen.value = false; coordinate.latitude = ''; coordinate.longitude = ''; dms.longitude = { degree: '', minute: '', second: '', direction: 'east' }; dms.latitude = { degree: '', minute: '', second: '', direction: 'north' }; coordinateError.value = '' }
function updateDepartureTime(event: ValueEvent) { const raw = textValue(event).slice(0, 16); const [date, clock] = raw.split('T'); if (!date || !clock) return; if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(clock)) return; departureDate.value = date; departureClock.value = clock }
function setTimeZone(target: TimeZoneTarget, event: ValueEvent) { const value = textValue(event); if (!timeZones.some((timeZone) => timeZone.value === value)) return; if (target === 'departure') departureTimeZone.value = value; else arrivalTimeZone.value = value }
function twoDigits(value: number) { return value < 10 ? `0${value}` : String(value) }
function fallbackDateParts(date: Date, timeZone: string): DateTimeParts { const offset = typeof fallbackTimeZoneOffsets[timeZone] === 'number' ? fallbackTimeZoneOffsets[timeZone] : 0; const shifted = new Date(date.getTime() + offset * 3_600_000); return { year: String(shifted.getUTCFullYear()), month: twoDigits(shifted.getUTCMonth() + 1), day: twoDigits(shifted.getUTCDate()), hour: twoDigits(shifted.getUTCHours()), minute: twoDigits(shifted.getUTCMinutes()) } }
function datePartsInZone(date: Date, timeZone: string): DateTimeParts { try { if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return fallbackDateParts(date, timeZone); const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }); if (typeof formatter.formatToParts !== 'function') return fallbackDateParts(date, timeZone); const values: Partial<DateTimeParts> = {}; formatter.formatToParts(date).forEach((part) => { if (part.type === 'year' || part.type === 'month' || part.type === 'day' || part.type === 'hour' || part.type === 'minute') values[part.type] = part.value }); if (values.year && values.month && values.day && values.hour && values.minute) return values as DateTimeParts } catch { /* fall back to the fixed offset table below */ } return fallbackDateParts(date, timeZone) }
/** Fixed `YYYY/MM/DD HH:mm` numeric pattern so the value reads the same in every language. */
function formatTimeInZone(date: Date, timeZone: string) { const parts = datePartsInZone(date, timeZone); return `${parts.year}/${parts.month}/${parts.day} ${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` }
function dateValueInZone(date: Date, timeZone: string) { const parts = datePartsInZone(date, timeZone); return `${parts.year}-${parts.month}-${parts.day}` }
function clockValueInZone(date: Date, timeZone: string) { const parts = datePartsInZone(date, timeZone); return `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` }
function zonedDateTimeToUtc(dateText: string, timeText: string, timeZone: string) { const [year, month, day] = dateText.split('-').map(Number); const [hour, minute] = timeText.split(':').map(Number); const localAsUtc = Date.UTC(year, month - 1, day, hour, minute); const values = datePartsInZone(new Date(localAsUtc), timeZone); const zonedAsUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour) % 24, Number(values.minute)); return new Date(localAsUtc - (zonedAsUtc - localAsUtc)) }
function zoneShortName(timeZone: string) { const parts = timeZone.split('/'); return (parts[parts.length - 1] || timeZone).replace(/_/g, ' ') }
async function presentToast(message: string) { const toast = await toastController.create({ message, color: 'success', duration: 1500, position: 'top' }); await toast.present() }
</script>

<style scoped>
.distance-tab-content { --padding-top: 0; --padding-bottom: 0; }
/* 底部 tab bar 已预留安全区，页面不能再叠加，否则结果面板与底栏之间会留出空隙 */
.distance-page { display: flex; flex-direction: column; min-height: 100%; padding: calc(10px + var(--ion-safe-area-top, 0px)) 10px 0; background: #eef3f8; }

/* 搜索区：搜索框与按钮等高；面板浮层化，不再挤压结果区 */
.top-search-area { position: relative; z-index: 4; }
.search-row { display: flex; align-items: stretch; gap: 8px; }
.port-search { flex: 1; min-width: 0; height: 50px; margin: 0; padding: 0; --background: #fff; --border-radius: 8px; --box-shadow: 0 0 0 1px #d6e2ef; --icon-color: #1d4b7f; --placeholder-color: #8491a1; --color: #172b3a; }
.coordinate-trigger { flex: 0 0 50px; width: 50px; height: 50px; margin: 0; --border-color: #cfdded; --border-width: 1px; --border-style: solid; --color: #1d4b7f; --border-radius: 8px; --padding-start: 0; --padding-end: 0; }
.floating-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 6; margin: 0; overflow: hidden; border: 1px solid #d9e4ed; border-radius: 8px; background: #fff; box-shadow: 0 8px 20px rgba(26, 48, 66, .14); }
.search-popover { max-height: 260px; overflow-y: auto; }
.search-popover ion-item { --min-height: 44px; --padding-start: 14px; --padding-end: 14px; }
.suggest-label { overflow: hidden; color: #243748; font-size: 14px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.recent-port-panel { padding: 8px 10px 10px; }
.recent-port-head { display: flex; align-items: center; justify-content: space-between; color: #64748b; font-size: 12px; font-weight: 600; }
.recent-port-ops { display: flex; align-items: center; gap: 10px; }
.recent-port-ops ion-button { width: 28px; min-width: 28px; height: 28px; margin: 0; --color: #64748b; --padding-start: 0; --padding-end: 0; }
.recent-port-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.recent-port-chips ion-chip { height: 26px; margin: 0; padding: 0 9px; border: 1px solid #d6e2ef; --background: #fff; --color: #334155; font-size: 12px; }
.recent-port-chips ion-chip ion-label { font-size: 12px; }
.recent-port-chips ion-chip.selected { --background: #e7f3fb; --color: #005f88; border-color: #9dc9df; }
.empty-note { margin: 6px 0 0; color: #8a99a7; font-size: 13px; }

/* 结果面板 */
.result-panel { display: flex; flex: 1; flex-direction: column; min-height: 0; margin-top: 8px; overflow: hidden; border: 1px solid #dce6ef; border-radius: 8px; background: #fff; }
.result-panel-header { display: flex; align-items: center; justify-content: space-between; min-height: 46px; padding: 6px 8px 6px 10px; border-bottom: 1px solid #e6edf3; }
.speed-box { display: flex; align-items: center; width: 84px; min-height: 32px; border: 1px solid #d6e2ef; border-radius: 6px; background: #f8fbfd; color: #526579; font-size: 13px; }
.speed-box ion-input { min-width: 0; --padding-top: 2px; --padding-bottom: 2px; --padding-start: 7px; --padding-end: 2px; font-size: 16px; }
.speed-box ion-input::part(native) { text-align: left; }
.speed-box span { padding-right: 7px; white-space: nowrap; }
.result-panel-ops { display: flex; align-items: center; gap: 6px; }
.result-panel-ops ion-button { min-height: 34px; margin: 0; --padding-start: 12px; --padding-end: 12px; font-size: 14px; }
.calculate-button, .clear-result-button { --border-radius: 6px; }
.clear-result-button { --background: #dbeef6; --color: #1c5878; }
.panel-empty { display: grid; flex: 1; min-height: 240px; place-items: center; align-content: center; gap: 12px; padding: 24px; color: #94a3b8; text-align: center; }
.panel-empty p { margin: 0; font-size: 14px; }
.result-panel-content { flex: 1; }
.port-list { margin: 0; }
.port-list ion-item { --min-height: 52px; --padding-start: 12px; --padding-end: 12px; --inner-padding-end: 0; }
.port-name { display: block; overflow: hidden; color: #243748; font-size: 15px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.port-name small { margin-left: 4px; color: #6e8192; font-size: 11px; font-weight: 400; }
.port-name.route-point-name { color: #315c7b; font-style: italic; }
.segment-total { color: #111827; font-size: 13px; white-space: nowrap; }
.segment-origin { color: #94a3b8; font-size: 13px; white-space: nowrap; }
.port-list ion-button { margin: 0; --padding-start: 4px; --padding-end: 4px; }
.port-list ion-button[color='danger'] { --color: #cf8179; }

/* 汇总：数值字重降低，单位小一号 */
.distance-summary-card { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 8px 4px 0; background: transparent; }
.distance-summary-card > div { min-width: 0; padding: 10px 4px; text-align: center; }
.distance-summary-card span, .distance-summary-card strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.distance-summary-card span { color: #6c7e8d; font-size: 12px; font-weight: 400; }
.distance-summary-card strong { margin-top: 4px; color: #173447; font-size: 16px; font-weight: 500; }
.distance-summary-card strong small { margin-left: 3px; color: #4b5f70; font-size: 12px; font-weight: 400; }

/* 航程时间：去掉 label，保留「日期编辑 + 时区设置」两个按钮 */
.schedule-card { margin: 0; padding: 8px 10px; border: 0; border-top: 1px solid #e2eaf0; border-radius: 0; background: #f5f9fb; }
.schedule-row { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto; align-items: center; gap: 6px; }
.time-block { min-width: 0; }
.time-line { display: flex; align-items: center; gap: 5px; }
.time-value { overflow: hidden; color: #111827; font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.time-action { display: grid; flex: none; width: 26px; height: 26px; padding: 0; place-items: center; border: 1px solid #d6e2ef; border-radius: 6px; background: #fff; color: #315c7b; }
.time-action.settings { justify-self: end; }
.time-action.settings.active { border-color: #005f88; background: #005f88; color: #fff; }
.time-zone { display: block; margin-top: 3px; overflow: hidden; color: #718293; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.time-arrow { color: #94a3b8; }
.timezone-settings { display: grid; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #d7e3ec; }
.departure-datetime { display: block; margin: 0 auto; }

/* 分享 */
.share-panel { margin: 0 10px 12px; }
.share-toolbar { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.share-toolbar ion-button { min-height: 40px; margin: 0; --color: #275b80; --padding-start: 2px; --padding-end: 2px; font-size: 14px; }
.budget-action { margin: 10px 0 0; --border-radius: 7px; --background: #0058a2; font-weight: 700; }

/* 最近航程 */
.recent-calculations-panel { padding: 12px; border-top: 1px solid #e8eef5; background: #fbfdff; }
.recent-calculations-panel h2 { margin: 0 0 6px; color: #64748b; font-size: 12px; }
.recent-calculation-item { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-top: 1px solid #edf2f7; }
.recent-calculation-item:first-of-type { border-top: 0; }
.recent-calculation-main { min-width: 0; flex: 1; }
.recent-calculation-main strong, .recent-calculation-main span { display: block; overflow: hidden; text-overflow: ellipsis; }
.recent-calculation-main strong { color: #334155; font-size: 13px; }
.recent-calculation-main span { margin-top: 4px; color: #64748b; font-size: 11px; line-height: 1.4; }
.recent-calculation-item ion-button { margin: 0; --color: #0058a2; font-size: 12px; }

/* 弹窗：出发时间 / 坐标输入 */
.coordinate-modal-content { --padding-top: 12px; --padding-bottom: calc(16px + env(safe-area-inset-bottom)); --padding-start: 10px; --padding-end: 10px; }
.coordinate-section-title { margin: 4px 0 8px; color: #334155; font-size: 15px; font-weight: 700; }
.coordinate-section + .coordinate-section { margin-top: 18px; }
.dms-axis { margin: 10px 0 6px; color: #475569; font-size: 13px; font-weight: 500; }
.dms-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 1.05fr; gap: 8px; }
.coordinate-error { margin: 10px 0 0; }
.coordinate-actions { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; margin-top: 14px; }
.coordinate-actions ion-button { margin: 0; }
@media (min-width: 620px) { .distance-page { max-width: 680px; margin: 0 auto; } }
</style>
