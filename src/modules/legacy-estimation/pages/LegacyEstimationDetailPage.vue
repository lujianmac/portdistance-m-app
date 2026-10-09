<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <AppBackButton default-href="/legacy-estimation" />
        </ion-buttons>
        <ion-title>{{ t('legacy.detailTitle') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :aria-label="t('common.refresh')" :disabled="loading" @click="load">
            <RefreshCw :size="20" :class="{ spinning: loading }" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refreshFromPull">
        <ion-refresher-content />
      </ion-refresher>

      <section v-if="loading && !detail" class="empty-state">
        <ion-spinner name="crescent" color="primary" />
      </section>

      <section v-else-if="error" class="empty-state">
        <div class="empty-state-inner">
          <AlertCircle :size="34" color="#b42318" />
          <h2>{{ t('legacy.detailLoadFailed') }}</h2>
          <p>{{ error }}</p>
          <ion-button @click="load">{{ t('common.reload') }}</ion-button>
        </div>
      </section>

      <template v-else>
        <header class="detail-head">
          <h1>{{ detail?.title || t('legacy.unnamedBudget') }}</h1>
          <p class="detail-meta">
            <span v-if="detail?.shipName">{{ t('legacy.shipName', { value: detail.shipName }) }}</span>
            <span>{{ t('legacy.createdAt', { value: formatDateTime(detail?.createTime, t('legacy.noDate')) }) }}</span>
            <ion-badge v-if="isOldVersion" color="medium">{{ t('legacy.oldVersionBadge') }}</ion-badge>
          </p>
          <p class="detail-note">{{ t('legacy.viewOnly') }}</p>
        </header>

        <!-- Normal estimation document (old app's EstimationView sections) -->
        <ion-accordion-group v-if="hasNormalShape" :multiple="true" :value="normalSections">
          <!-- Cargo -->
          <ion-accordion value="cargo">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.cargo') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <p v-if="!cargoes.length" class="section-empty">{{ t('legacy.noCargoes') }}</p>
              <article v-for="(cargo, index) in cargoes" :key="index" class="cargo-item">
                <div class="field">
                  <small>{{ t('legacy.cargoName') }}</small>
                  <strong>{{ cargo.Cargo || t('legacy.cargoFallback', { index: index + 1 }) }}</strong>
                </div>
                <div class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.loadPort') }}</small>
                    <strong>{{ resultValue(cargo.LoadPort?.portName) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.dischargePort') }}</small>
                    <strong>{{ resultValue(cargo.DischargePort?.portName) }}</strong>
                  </div>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.quantityTon') }}</small>
                    <strong>{{ amount(cargo.Quantity) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.freightPerTon') }}</small>
                    <strong>{{ amount(cargo.Freight) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.income') }}</small>
                    <strong>{{ amount(cargo.Income) }}</strong>
                  </div>
                </div>
                <div class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.labels.demurrage') }}</small>
                    <strong>{{ amount(cargo.Demurrage) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.dispatch') }}</small>
                    <strong>{{ amount(cargo.Dispatch) }}</strong>
                  </div>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.labels.addCommRateLabel') }}</small>
                    <strong>{{ amount(cargo.AddComm) }} / {{ percent(cargo.AddCommRate) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.brokerageRateLabel') }}</small>
                    <strong>{{ amount(cargo.Brokerage) }} / {{ percent(cargo.BrokerageRate) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.frtTaxRateLabel') }}</small>
                    <strong>{{ amount(cargo.FrtTax) }} / {{ percent(cargo.FrtTaxRate) }}</strong>
                  </div>
                </div>
              </article>
            </div>
          </ion-accordion>

          <!-- Port rotation: totals, legs and weather margin -->
          <ion-accordion value="ports">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.portRotation') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="metric-grid">
                <div>
                  <small>{{ t('legacy.totalVoyageDays') }}</small>
                  <strong>{{ amount(rotationTop?.ttlVoyDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.seaDays') }}</small>
                  <strong>{{ amount(rotationTop?.ttlSeaDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.idleDays') }}</small>
                  <strong>{{ amount(rotationTop?.ttlIdleDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.workDays') }}</small>
                  <strong>{{ amount(rotationTop?.ttlWorkDays) }}</strong>
                </div>
              </div>

              <p v-if="!rotationOrder.length" class="section-empty">{{ t('legacy.noPorts') }}</p>
              <article v-for="(port, index) in rotationOrder" :key="index" class="port-item">
                <div class="port-head">
                  <span class="port-task">[{{ taskLabel(port) }}]</span>
                  <strong class="port-name">{{ resultValue(port.port?.portName) }}</strong>
                </div>

                <div v-if="port.isWayPoint" class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.distance') }}</small>
                    <strong>{{ amount(port.distance) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.seaDays') }}</small>
                    <strong>{{ amount(port.seaDays) }}</strong>
                  </div>
                </div>

                <template v-else>
                  <div v-if="index > 0" class="field-grid" :class="rotationTop?.isUseEca ? 'three' : 'two'">
                    <div class="field">
                      <small>{{ t('legacy.distance') }}</small>
                      <strong>{{ amount(port.distance) }}</strong>
                    </div>
                    <div v-if="rotationTop?.isUseEca" class="field">
                      <small>{{ t('legacy.labels.ecaDistance') }}</small>
                      <strong>{{ amount(port.ecaDistance) }}</strong>
                    </div>
                    <div class="field">
                      <small>{{ t('legacy.labels.seaDays') }}</small>
                      <strong>{{ amount(port.seaDays) }}</strong>
                    </div>
                  </div>
                  <div class="field-grid two">
                    <div class="field">
                      <small>{{ t('legacy.arrivalDate') }}</small>
                      <strong>{{ formatDateTime(port.arrived, '') }}</strong>
                    </div>
                    <div class="field">
                      <small>{{ t('legacy.departureDate') }}</small>
                      <strong>{{ formatDateTime(port.departed, '') }}</strong>
                    </div>
                  </div>
                  <div class="field-grid three">
                    <div class="field">
                      <small>{{ t('legacy.labels.idleDays') }}</small>
                      <strong>{{ amount(port.idleDays) }}</strong>
                    </div>
                    <div class="field">
                      <small>{{ t('legacy.labels.workDays') }}</small>
                      <strong>{{ amount(port.workDays) }}</strong>
                    </div>
                    <div class="field">
                      <small>{{ t('legacy.labels.portCharge') }}</small>
                      <strong>{{ amount(port.portCharge) }}</strong>
                    </div>
                  </div>
                </template>
              </article>

              <div class="margin-band">
                <strong>{{ t('legacy.margin') }}</strong>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.labels.seaDays') }}</small>
                    <strong>{{ amount(rotationTop?.marginSeaDays) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.idleDays') }}</small>
                    <strong>{{ amount(rotationTop?.marginIdleDays) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.workDays') }}</small>
                    <strong>{{ amount(rotationTop?.marginWorkDays) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Fuel: FO / DO rows and the ECA (LSFO / LSDO) rows when ECA is used -->
          <ion-accordion value="fuel">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.fuel') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <p v-if="!fuelRows.length" class="section-empty">{{ t('legacy.noFuel') }}</p>
              <div v-for="row in fuelRows" :key="row.key" class="fuel-block">
                <h3>{{ row.label }}</h3>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.fuelFields.atSea') }}</small>
                    <strong>{{ amount(row.atSea) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.fuelFields.atPortIdle') }}</small>
                    <strong>{{ amount(row.atPortIdle) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.fuelFields.atPortWork') }}</small>
                    <strong>{{ amount(row.atPortWork) }}</strong>
                  </div>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.pricePerTon') }}</small>
                    <strong>{{ amount(row.price) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.consumptionTons') }}</small>
                    <strong>{{ amount(row.total) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.costLabel') }}</small>
                    <strong>{{ amount(row.fee) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Income -->
          <ion-accordion value="income">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.income') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="field-grid two">
                <div v-for="field in normalIncomeFields" :key="field.label" class="field">
                  <small>{{ field.label }}</small>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Cost -->
          <ion-accordion value="cost">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.cost') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="field-grid two">
                <div v-for="field in normalCostFields" :key="field.label" class="field">
                  <small>{{ field.label }}</small>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Results -->
          <ion-accordion value="result">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.result') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="metric-grid">
                <div v-for="field in normalResultFields" :key="field.label">
                  <small>{{ field.label }}</small>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Fallback: version-2 payload with none of the normal estimation keys -->
        <ion-accordion-group v-else :multiple="true" :value="oldSections">
          <!-- Cargo -->
          <ion-accordion value="cargo">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.cargo') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <p v-if="!oldCargoes.length" class="section-empty">{{ t('legacy.noCargoes') }}</p>
              <article v-for="(cargo, index) in oldCargoes" :key="index" class="cargo-item">
                <div class="field">
                  <small>{{ t('legacy.cargoName') }}</small>
                  <strong>{{ cargo.Cargo || t('legacy.cargoFallback', { index: index + 1 }) }}</strong>
                </div>
                <div class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.loadPort') }}</small>
                    <strong>{{ resultValue(cargo.FromName) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.dischargePort') }}</small>
                    <strong>{{ resultValue(cargo.ToName) }}</strong>
                  </div>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.quantityTon') }}</small>
                    <strong>{{ amount(cargo.Quantity) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.freightPerTon') }}</small>
                    <strong>{{ amount(cargo.Freight) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.income') }}</small>
                    <strong>{{ amount(cargo.Income) }}</strong>
                  </div>
                </div>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.labels.addCommRate') }}</small>
                    <strong>{{ amount(cargo.AddComm) }} / {{ percent(cargo.AddCommRate) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.brokerageRate') }}</small>
                    <strong>{{ amount(cargo.Brokerage) }} / {{ percent(cargo.BrokerageRate) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.frtTaxRate') }}</small>
                    <strong>{{ amount(cargo.FrtTax) }} / {{ percent(cargo.FrtTaxRate) }}</strong>
                  </div>
                </div>
              </article>
            </div>
          </ion-accordion>

          <!-- Port rotation and route -->
          <ion-accordion value="ports">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.portRotation') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="metric-grid">
                <div>
                  <small>{{ t('legacy.totalVoyageDays') }}</small>
                  <strong>{{ resultValue(oldPortData?.txtTTLDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.seaDays') }}</small>
                  <strong>{{ amount(oldResultData?.SeaDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.idleDays') }}</small>
                  <strong>{{ amount(oldResultData?.PortIdleDays) }}</strong>
                </div>
                <div>
                  <small>{{ t('legacy.labels.workDays') }}</small>
                  <strong>{{ amount(oldResultData?.PortWorkDays) }}</strong>
                </div>
              </div>

              <div class="margin-band">
                <strong>{{ t('legacy.margin') }}</strong>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.labels.seaDays') }}</small>
                    <strong>{{ amount(oldPortData?.marginSeaDays) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.idleDays') }}</small>
                    <strong>{{ amount(oldPortData?.marginIdleDays) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.workDays') }}</small>
                    <strong>{{ amount(oldPortData?.marginWorkDays) }}</strong>
                  </div>
                </div>
              </div>

              <p v-if="!oldPortOrder.length" class="section-empty">{{ t('legacy.noPorts') }}</p>
              <article v-for="(port, index) in oldPortOrder" :key="index" class="port-item">
                <div class="port-head">
                  <span class="port-task">{{ port.taskTypeName || port.TaskTypeName || resultValue(port.TaskType) }}</span>
                  <strong class="port-name">{{ resultValue(port.PortName) }}</strong>
                </div>
                <div v-if="index > 0" class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.distance') }}</small>
                    <strong>{{ amount(port.Distance) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.seaDays') }}</small>
                    <strong>{{ amount(port.SeaDays) }}</strong>
                  </div>
                </div>
                <div class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.arrivalDate') }}</small>
                    <strong>{{ formatDateTime(port.ArrivalDate, '') }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.departureDate') }}</small>
                    <strong>{{ formatDateTime(port.DepartureDate, '') }}</strong>
                  </div>
                </div>
                <div class="field-grid two">
                  <div class="field">
                    <small>{{ t('legacy.labels.idleDays') }}</small>
                    <strong>{{ amount(port.PortIdleDays) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.labels.workDays') }}</small>
                    <strong>{{ amount(port.PortWorkDays) }}</strong>
                  </div>
                </div>
              </article>
            </div>
          </ion-accordion>

          <!-- Fuel consumption and consumption cost -->
          <ion-accordion value="fuel">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.fuel') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <p v-if="oldVesselData?.ShipName" class="ship-line">
                <span>{{ t('legacy.shipNameLabel') }}</span>
                <strong>{{ oldVesselData.ShipName }}</strong>
              </p>

              <div v-if="oldFuelConsumption.length" class="fuel-block">
                <h3>{{ t('legacy.dailyConsumption') }}</h3>
                <div class="field-grid four">
                  <div v-for="field in oldFuelConsumption" :key="field.label" class="field">
                    <small>{{ field.label }}</small>
                    <strong>{{ field.value }}</strong>
                  </div>
                </div>
              </div>

              <div class="fuel-block">
                <h3>{{ t('legacy.fo') }}</h3>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.pricePerTon') }}</small>
                    <strong>{{ resultValue(oldResultData?.FOPrice) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.consumptionTons') }}</small>
                    <strong>{{ resultValue(oldResultData?.FOConsumption) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.costLabel') }}</small>
                    <strong>{{ amount(oldResultData?.FOExpense) }}</strong>
                  </div>
                </div>
              </div>

              <div class="fuel-block">
                <h3>{{ t('legacy.do') }}</h3>
                <div class="field-grid three">
                  <div class="field">
                    <small>{{ t('legacy.pricePerTon') }}</small>
                    <strong>{{ resultValue(oldResultData?.DOPrice) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.consumptionTons') }}</small>
                    <strong>{{ resultValue(oldResultData?.DOConsumption) }}</strong>
                  </div>
                  <div class="field">
                    <small>{{ t('legacy.costLabel') }}</small>
                    <strong>{{ amount(oldResultData?.DOExpense) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Cost -->
          <ion-accordion value="cost">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.cost') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="field-grid two">
                <div v-for="field in oldCostFields" :key="field.label" class="field">
                  <small>{{ field.label }}</small>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Results -->
          <ion-accordion value="result">
            <ion-item slot="header" color="light">
              <ion-label>
                <strong>{{ t('legacy.sections.result') }}</strong>
              </ion-label>
            </ion-item>
            <div slot="content" class="section-body">
              <div class="metric-grid">
                <div v-for="field in oldResultFields" :key="field.label">
                  <small>{{ field.label }}</small>
                  <strong>{{ field.value }}</strong>
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
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import {
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getLegacyEstimation,
  hasNormalEstimationContent,
  isLegacyEstimationRow,
  parseLegacyEstimationContent,
  type LegacyEstimationDetail,
  type LegacyRotationOrderVO,
} from '@/api/legacy-estimation'
import { formatAmount, formatDateTime } from '@/i18n/format'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const route = useRoute()

const detail = ref<LegacyEstimationDetail | null>(null)
const loading = ref(true)
const error = ref('')
const normalSections = ['cargo', 'ports', 'fuel', 'income', 'cost', 'result']
const oldSections = ['cargo', 'ports', 'fuel', 'cost', 'result']

/** Only `version === 2` records are the old version; everything else is a normal one. */
const isOldVersion = computed(() => (detail.value ? isLegacyEstimationRow(detail.value) : false))

/** Parsed `contentStr`; an empty document when the payload is missing or corrupt. */
const payload = computed(() => parseLegacyEstimationContent(detail.value?.contentStr))
/**
 * Version-2 rows carry the much older `cargoData` document and expose none of the
 * normal estimation keys, which is what selects the fallback rendering below.
 */
const hasNormalShape = computed(() => hasNormalEstimationContent(payload.value))

/* ----- Normal estimation document (`EstimationView.vue` shape) ----- */

const cargoes = computed(() => payload.value.cargoArr ?? [])
const rotationOrder = computed(() => payload.value.rotationOrderArr ?? [])
const rotationTop = computed(() => payload.value.rotationTopVO)
const incomeVO = computed(() => payload.value.incomeVO)
const costVO = computed(() => payload.value.costVO)
const resultVO = computed(() => payload.value.resultVO)

/**
 * The payload stores `taskTypeName` as the old app's i18n key (`taskLoading`, …);
 * the earliest records stored the enum name instead. Unknown values are payload data
 * and are shown verbatim, exactly like the old app's `$t(item.taskTypeName)`.
 */
const TASK_LABEL_KEYS: Record<string, string> = {
  taskBallast: 'legacy.tasks.ballast',
  taskLoading: 'legacy.tasks.loading',
  taskDischarging: 'legacy.tasks.discharging',
  taskBunker: 'legacy.tasks.bunker',
  taskCanal: 'legacy.tasks.canal',
  taskPassing: 'legacy.tasks.passing',
  taskRouting: 'legacy.tasks.routing',
  taskSnug: 'legacy.tasks.snug',
  taskRepair: 'legacy.tasks.repair',
  Ballast: 'legacy.tasks.ballast',
  Loading: 'legacy.tasks.loading',
  Discharging: 'legacy.tasks.discharging',
  Bunker: 'legacy.tasks.bunker',
  Vunker: 'legacy.tasks.bunker',
  Canal: 'legacy.tasks.canal',
  Passing: 'legacy.tasks.passing',
  Routing: 'legacy.tasks.routing',
  Snug: 'legacy.tasks.snug',
  Repair: 'legacy.tasks.repair',
}

function taskLabel(item: LegacyRotationOrderVO) {
  if (item.isWayPoint) return t('legacy.tasks.routing')
  const raw = String(item.taskTypeName ?? '')
  if (!raw) return ''
  const key = TASK_LABEL_KEYS[raw]
  return key ? t(key) : raw
}

interface FuelRow {
  key: string
  label: string
  price?: string | number
  atSea?: string | number
  atPortIdle?: string | number
  atPortWork?: string | number
  total?: string | number
  fee?: string | number
}

/** The FO / DO rows the old screen always showed, plus LSFO / LSDO when ECA is used. */
const fuelRows = computed<FuelRow[]>(() => {
  const fuel = payload.value.fuelVO
  if (!fuel) return []
  const rows: FuelRow[] = [
    {
      key: 'fo',
      label: t('legacy.fo'),
      price: fuel.foPrice,
      atSea: fuel.atSeaFo,
      atPortIdle: fuel.atPortIdleFo,
      atPortWork: fuel.atPortWorkFo,
      total: fuel.totalFo,
      fee: fuel.foFee,
    },
    {
      key: 'do',
      label: t('legacy.do'),
      price: fuel.doPrice,
      atSea: fuel.atSeaDo,
      atPortIdle: fuel.atPortIdleDo,
      atPortWork: fuel.atPortWorkDo,
      total: fuel.totalDo,
      fee: fuel.doFee,
    },
  ]
  if (rotationTop.value?.isUseEca) {
    rows.push(
      {
        key: 'lsfo',
        label: t('legacy.lsfo'),
        price: fuel.lsfoPrice,
        atSea: fuel.atSeaEcaFo,
        atPortIdle: fuel.atPortIdleLsfo,
        atPortWork: fuel.atPortWorkLsfo,
        total: fuel.totalEcaFo,
        fee: fuel.lsfoFee,
      },
      {
        key: 'lsdo',
        label: t('legacy.lsdo'),
        price: fuel.lsdoPrice,
        atSea: fuel.atSeaEcaDo,
        atPortIdle: fuel.atPortIdleLsdo,
        atPortWork: fuel.atPortWorkLsdo,
        total: fuel.totalEcaDo,
        fee: fuel.lsdoFee,
      },
    )
  }
  return rows
})

const normalIncomeFields = computed(() => [
  { label: t('legacy.labels.frightIncome'), value: amount(incomeVO.value?.frightIncome) },
  { label: t('legacy.labels.addCommRate'), value: amount(incomeVO.value?.addComm) },
  { label: t('legacy.labels.brokerageRate'), value: amount(incomeVO.value?.brokerage) },
  { label: t('legacy.labels.frtTaxRate'), value: amount(incomeVO.value?.frtTax) },
  { label: t('legacy.labels.demurrage'), value: amount(incomeVO.value?.demurrage) },
  { label: t('legacy.labels.dispatch'), value: amount(incomeVO.value?.dispatch) },
])

const normalCostFields = computed(() => [
  { label: t('legacy.labels.portCharge'), value: amount(costVO.value?.portCharge) },
  { label: t('legacy.labels.ilohc'), value: amount(costVO.value?.ilohc) },
  { label: t('legacy.labels.cev'), value: amount(costVO.value?.cev) },
  { label: t('legacy.labels.inspectionFee'), value: amount(costVO.value?.inspection) },
  { label: t('legacy.labels.opOther'), value: amount(costVO.value?.opOther) },
  { label: t('legacy.labels.hirePerDay'), value: amount(costVO.value?.hirePerDay) },
  { label: t('legacy.labels.fixedCost'), value: amount(costVO.value?.fixedCost) },
  { label: t('legacy.labels.hireDay'), value: amount(costVO.value?.hire) },
  {
    label: t('legacy.labels.hireComm'),
    value: `${amount(costVO.value?.hireCost)} / ${percent(costVO.value?.hireCommPercent)}`,
  },
])

const normalResultFields = computed(() => [
  { label: t('legacy.metrics.totalIncome'), value: amount(resultVO.value?.ttlIncome) },
  { label: t('legacy.metrics.netIncome'), value: amount(resultVO.value?.netIncome) },
  { label: t('legacy.metrics.operatingCost'), value: amount(resultVO.value?.opExpense) },
  { label: t('legacy.metrics.totalCost'), value: amount(resultVO.value?.ttlExpense) },
  { label: t('legacy.metrics.operatingProfit'), value: amount(resultVO.value?.opProfit) },
  { label: t('legacy.metrics.netProfit'), value: amount(resultVO.value?.netProfit) },
  { label: t('legacy.metrics.hireLevelPerDay'), value: amount(resultVO.value?.asHirePerDay) },
  { label: t('legacy.metrics.profitDayLevel'), value: amount(resultVO.value?.profitDayLevel) },
])

/* ----- Version-2 old document (fallback rendering) ----- */

const oldCargoes = computed(() => payload.value.cargoData ?? [])
const oldPortData = computed(() => payload.value.portData)
const oldPortOrder = computed(() => oldPortData.value?.portOrder ?? [])
const oldVesselData = computed(() => payload.value.vesselData)
const oldResultData = computed(() => payload.value.resultData)

/** Daily consumption of the vessel, as shown by the version-2 dialog. */
const oldFuelConsumption = computed(() => {
  const vessel = oldVesselData.value
  if (!vessel) return []
  const fields = [
    { label: t('legacy.labels.foBallast'), value: vessel.FOBallast },
    { label: t('legacy.labels.foLaden'), value: vessel.FOLaden },
    { label: t('legacy.labels.foPortIdle'), value: vessel.FOPortIdle },
    { label: t('legacy.labels.foPortWork'), value: vessel.FOPortWork },
    { label: t('legacy.labels.doSea'), value: vessel.DOSea },
    { label: t('legacy.labels.doPortIdle'), value: vessel.DOPortIdle },
    { label: t('legacy.labels.doPortWork'), value: vessel.DOPortWork },
  ]
  return fields.filter((field) => field.value !== undefined && field.value !== null)
})

/** Expense rows, in the same order as the version-2 detail screen. */
const oldCostFields = computed(() => [
  { label: t('legacy.labels.hirePerDay'), value: amount(oldResultData.value?.HirePerDay) },
  { label: t('legacy.labels.hireDay'), value: amount(oldResultData.value?.HireDay) },
  {
    label: t('legacy.labels.hireComm'),
    value: `${amount(oldResultData.value?.HireComm)} / ${percent(oldResultData.value?.HireCommPercent)}`,
  },
  { label: t('legacy.labels.demurrage'), value: amount(oldResultData.value?.Demurrage) },
  { label: t('legacy.labels.dispatch'), value: amount(oldResultData.value?.Dispatch) },
  { label: t('legacy.labels.ilohc'), value: amount(oldResultData.value?.ILOHC) },
  { label: t('legacy.labels.ballastBonus'), value: amount(oldResultData.value?.BallastBonus) },
  { label: t('legacy.labels.opOther'), value: amount(oldResultData.value?.OpOther) },
  { label: t('legacy.labels.cev'), value: amount(oldResultData.value?.CEV) },
  { label: t('legacy.labels.addCommRate'), value: amount(oldResultData.value?.AddComm) },
  { label: t('legacy.labels.brokerageRate'), value: amount(oldResultData.value?.Brokerage) },
  { label: t('legacy.labels.frtTaxRate'), value: amount(oldResultData.value?.FreightTax) },
  { label: t('legacy.labels.portCharge'), value: amount(oldResultData.value?.PortCharge) },
])

const oldResultFields = computed(() => [
  { label: t('legacy.metrics.hireLevelPerDay'), value: amount(oldResultData.value?.HireLevelPerDay) },
  { label: t('legacy.metrics.totalRevenue'), value: amount(oldResultData.value?.TTLRevenue) },
  { label: t('legacy.metrics.operatingCost'), value: amount(oldResultData.value?.getOpExpense) },
  { label: t('legacy.metrics.operatingProfit'), value: amount(oldResultData.value?.OpProfit) },
  { label: t('legacy.metrics.totalExpenses'), value: amount(oldResultData.value?.TTLExpense) },
  { label: t('legacy.metrics.netProfit'), value: amount(oldResultData.value?.Profit) },
])

onIonViewWillEnter(() => {
  void load()
})

async function refreshFromPull(event: CustomEvent) {
  await load()
  event.detail.complete()
}

async function load() {
  const id = String(route.params.id || '')
  if (!id) {
    error.value = t('legacy.invalidId')
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    detail.value = await getLegacyEstimation(id)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('legacy.detailLoadFailed')
  } finally {
    loading.value = false
  }
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== ''
}

/** Amounts: an unset value shows as dashes instead of `0`. */
function amount(value: unknown) {
  if (!hasValue(value)) return '--'
  const parsed = Number(value)
  return Number.isFinite(parsed) ? formatAmount(parsed) : String(value)
}

/** Free text (port names, task names): dashes when unset. */
function resultValue(value: unknown) {
  return hasValue(value) ? String(value) : '--'
}

function percent(value: unknown) {
  return hasValue(value) ? `${amount(value)}%` : '--'
}
</script>

<style scoped>
.spinning {
  animation: spin 850ms linear infinite;
}

.detail-head {
  padding: 4px 4px 12px;
}

.detail-head h1 {
  margin: 0;
  color: #173447;
  font-size: 20px;
  line-height: 1.35;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: #6e8192;
  font-size: 12px;
}

.detail-note {
  margin: 6px 0 0;
  color: #6e8192;
  font-size: 12px;
  font-style: italic;
}

.section-body {
  padding: 10px 14px 14px;
  background: #ffffff;
}

.section-empty {
  margin: 0;
  color: #6e8192;
  font-size: 13px;
}

.cargo-item,
.port-item {
  padding: 12px 0;
  border-top: 1px solid #dce6ef;
}

.cargo-item:first-of-type,
.port-item:first-of-type {
  border-top: 0;
}

.field-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.field-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field-grid.four {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  min-width: 0;
}

.field small,
.field strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field small {
  color: #6e8192;
  font-size: 11px;
}

.field strong {
  margin-top: 4px;
  color: #173447;
  font-size: 14px;
  font-weight: 500;
}

.margin-band {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f9fb;
}

.margin-band > strong {
  color: #173447;
  font-size: 13px;
}

.port-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.port-task {
  color: #6e8192;
  font-size: 13px;
}

.port-name {
  color: #173447;
  font-size: 15px;
  font-weight: 700;
}

.ship-line {
  display: flex;
  gap: 8px;
  margin: 0 0 6px;
  color: #6e8192;
  font-size: 13px;
}

.ship-line strong {
  color: #173447;
}

.fuel-block + .fuel-block {
  margin-top: 12px;
}

.fuel-block h3 {
  margin: 0;
  color: #173447;
  font-size: 14px;
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 640px) {
  .field-grid.four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
