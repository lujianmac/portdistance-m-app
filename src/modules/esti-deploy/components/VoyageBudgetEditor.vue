<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :aria-label="t('budget.editor.header.back')" @click="requestEditorExit">
            <ChevronLeft :size="22" aria-hidden="true" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ store.editorMode === 'edit' ? t('budget.editor.header.editTitle') : t('budget.editor.header.newTitle') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="budget-editor-content">
      <main class="budget-editor" :aria-label="t('budget.editor.header.editorLabel')">
        <section v-if="initializing" class="editor-state">
          <ion-spinner name="crescent" color="primary" />
          <span>{{ t('budget.editor.draft.loading') }}</span>
        </section>

        <template v-else>
          <section class="editor-section" :aria-label="t('budget.editor.basic.heading')">
            <ion-list lines="full" class="editor-list basic-list">
              <ion-item>
                <ion-input v-model.trim="store.name" :label="t('budget.editor.basic.name')" label-placement="floating" :maxlength="80" :placeholder="t('budget.editor.basic.namePlaceholder')" />
              </ion-item>
              <div class="ship-field">
                <ion-item lines="full" class="ship-item">
                  <ion-select :value="store.shipId" :label="t('budget.editor.basic.ship')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :placeholder="t('budget.editor.basic.shipPlaceholder')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectShip">
                    <ion-select-option value="">{{ t('budget.editor.basic.shipNone') }}</ion-select-option>
                    <ion-select-option v-for="ship in store.vessels" :key="ship.id" :value="ship.id">{{ ship.shipName }}</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-button fill="outline" size="small" :aria-label="t('budget.editor.basic.shipInfoTitle')" @click="showShipInfo">
                  <Info :size="18" aria-hidden="true" />
                </ion-button>
                <ion-button fill="outline" size="small" :aria-label="t('budget.editor.basic.manageShip')" @click="openShipSettings">
                  <ShipWheel :size="18" aria-hidden="true" />
                </ion-button>
              </div>
            </ion-list>
          </section>

          <section class="editor-section" aria-labelledby="fuel-speed-heading">
            <div class="section-heading">
              <h2 id="fuel-speed-heading">{{ t('budget.editor.fuel.heading') }}</h2>
            </div>
            <div class="template-row">
              <ion-item lines="full" class="template-item">
                <ion-select :value="store.document.fuelTemplateId || ''" :label="t('budget.editor.fuel.template')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :placeholder="t('budget.editor.fuel.templatePlaceholder')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectFuelTemplate">
                  <ion-select-option value="">{{ t('budget.editor.fuel.templateNone') }}</ion-select-option>
                  <ion-select-option v-for="template in store.fuelTemplates" :key="template.id" :value="String(template.id)">{{ template.name }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-button fill="outline" size="small" :aria-label="t('budget.editor.fuel.manageTemplate')" @click="openTemplateManager">
                <Settings2 :size="18" aria-hidden="true" />
              </ion-button>
            </div>
            <h3>{{ t('budget.editor.fuel.dailyHeading') }}</h3>
            <div class="field-grid two-column fuel-grid">
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.seaLadenFuel)" :label="t('budget.editor.fuel.seaLadenFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaLadenFuel', $event)" /></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.seaBallastFuel)" :label="t('budget.editor.fuel.seaBallastFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaBallastFuel', $event)" /></ion-item>
              <div class="field-tip fuel-tip">{{ t('budget.editor.fuel.ecaNote') }}</div>
              <ion-item lines="full" class="fuel-aux-item"><ion-input :value="numberText(store.document.fuel.seaAuxFuel)" :label="t('budget.editor.fuel.seaAuxFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaAuxFuel', $event)" /></ion-item>
            </div>
            <div class="field-grid two-column fuel-port-grid">
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.portIdleFuel)" :label="t('budget.editor.fuel.portIdleFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portIdleFuel', $event)" /></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.portWorkingFuel)" :label="t('budget.editor.fuel.portWorkingFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portWorkingFuel', $event)" /></ion-item>
            </div>
            <h3>{{ t('budget.editor.fuel.speedHeading') }}</h3>
            <div class="field-grid speed-grid">
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ballastFullSpeed)" :label="t('budget.editor.fuel.ballastFullSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastFullSpeed', $event)" /></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ballastEcoSpeed)" :label="t('budget.editor.fuel.ballastEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastEcoSpeed', $event)" /></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ladenFullSpeed)" :label="t('budget.editor.fuel.ladenFullSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenFullSpeed', $event)" /></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ladenEcoSpeed)" :label="t('budget.editor.fuel.ladenEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenEcoSpeed', $event)" /></ion-item>
            </div>
            <div class="template-save-row">
              <ion-item lines="full" class="template-name-item"><ion-input v-model.trim="newTemplateName" :label="t('budget.editor.fuel.templateName')" label-placement="floating" :placeholder="t('budget.editor.fuel.templateNamePlaceholder')" /></ion-item>
              <ion-button fill="outline" size="small" :disabled="!newTemplateName.trim()" @click="saveCurrentAsTemplate">{{ t('budget.editor.fuel.setAsTemplate') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="port-sequence-heading">
            <div class="section-heading">
              <h2 id="port-sequence-heading">{{ t('budget.editor.ports.heading') }}</h2>
              <ion-button v-if="store.document.ports.length > 0" class="heading-add-button" fill="clear" size="small" :disabled="store.hasCalculatedRoute" @click="openPortPicker">
                <Plus :size="19" aria-hidden="true" /><span>{{ t('budget.editor.ports.add') }}</span>
              </ion-button>
            </div>

            <div v-if="!store.document.ports.length" class="section-empty port-empty">
              <ion-button expand="block" class="empty-add-button" @click="openPortPicker">
                <Plus :size="18" aria-hidden="true" /> {{ t('budget.editor.ports.add') }}
              </ion-button>
            </div>

            <article v-for="(port, index) in store.document.ports" :key="port.id" class="port-block" :class="{ 'routing-port': isRoutingPort(port) }">
              <div class="port-heading">
                <div class="port-title">
                  <strong>{{ portName(port) }}</strong>
                  <span v-if="port.port.fullName && port.port.fullName !== port.port.portName">{{ port.port.fullName }}</span>
                </div>
                <div class="port-actions">
                  <ion-button v-if="store.document.ports.length > 1 && index > 0" fill="clear" size="small" :aria-label="t('budget.editor.ports.moveUp')" :disabled="store.hasCalculatedRoute" @click="store.movePort(index, 'up')"><ChevronUp :size="17" /></ion-button>
                  <ion-button v-if="store.document.ports.length > 1 && index < store.document.ports.length - 1" fill="clear" size="small" :aria-label="t('budget.editor.ports.moveDown')" :disabled="store.hasCalculatedRoute" @click="store.movePort(index, 'down')"><ChevronDown :size="17" /></ion-button>
                  <ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.editor.ports.remove')" :disabled="store.hasCalculatedRoute" @click="confirmRemovePort(index)"><Trash2 :size="17" /></ion-button>
                </div>
              </div>

              <div v-if="!isRoutingPort(port)" class="field-grid port-mode-grid">
                <ion-item lines="full" class="port-task-item"><ion-select :value="port.taskType" :label="t('budget.editor.ports.task')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortTask(index, $event)"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="index < store.document.ports.length - 1" lines="full"><ion-select :value="port.isLaden ? 'laden' : 'ballast'" :label="t('budget.editor.ports.nextLeg')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortLaden(index, $event)"><ion-select-option value="laden">{{ t('budget.editor.ports.laden') }}</ion-select-option><ion-select-option value="ballast">{{ t('budget.editor.ports.ballast') }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="index < store.document.ports.length - 1" lines="full"><ion-select :value="port.speedMode" :label="t('budget.editor.ports.speedMode')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortSpeedMode(index, $event)"><ion-select-option value="full">{{ t('budget.editor.ports.full') }}</ion-select-option><ion-select-option value="eco">{{ t('budget.editor.ports.eco') }}</ion-select-option></ion-select></ion-item>
              </div>

              <div v-if="!isRoutingPort(port) || store.hasCalculatedRoute" class="sailing-panel">
                <div v-if="store.hasCalculatedRoute && index > 0" class="route-leg-summary">
                  <div><span>{{ t('budget.editor.ports.distanceNm') }}</span><strong>{{ numberText(port.distanceNm) }}</strong></div>
                  <div><span>{{ t('budget.editor.ports.seaDays') }}</span><strong>{{ numberText(port.seaDays) }}</strong></div>
                  <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaDistance') }}</span><strong>{{ numberText(port.ecaDistanceNm) }}</strong></div>
                  <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaSeaDays') }}</span><strong>{{ numberText(port.ecaSeaDays) }}</strong></div>
                </div>

                <div v-if="store.hasCalculatedRoute && !isRoutingPort(port)" class="fuel-leg-summary">
                  <span>{{ index === 0 ? t('budget.editor.ports.portFuel') : t('budget.editor.ports.legFuel') }}</span>
                  <div v-if="index === 0" class="fuel-leg-values"><span>{{ t('budget.editor.ports.lsdoIdle', { value: amount(port.idleDays * store.document.fuel.portIdleFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoWork', { value: amount(port.workDays * store.document.fuel.portWorkingFuel) }) }}</span></div>
                  <div v-else class="fuel-leg-values"><span>{{ t('budget.editor.ports.northAmericaMainFuel', { name: mainFuelForLeg(index), value: amount(fuelLeg(port.id)?.nonEcaMainFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoEca', { value: amount(fuelLeg(port.id)?.ecaMainFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoAux', { value: amount(fuelLeg(port.id)?.auxiliaryFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoPort', { value: amount(fuelLeg(port.id)?.portFuel) }) }}</span></div>
                </div>

                <div v-if="!isRoutingPort(port)" class="field-grid port-operation-grid">
                  <ion-item lines="full"><ion-input :value="numberText(port.idleDays)" :label="t('budget.editor.ports.idleDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'idleDays', $event)" /></ion-item>
                  <ion-item lines="full"><ion-input :value="numberText(port.workDays)" :label="t('budget.editor.ports.workDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'workDays', $event)" /></ion-item>
                  <ion-item lines="full"><ion-input :value="numberText(port.portCharge)" :label="t('budget.editor.ports.portCharge')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'portCharge', $event)" /></ion-item>
                </div>

                <div v-if="!isRoutingPort(port)" class="schedule-times">
                  <div class="schedule-time-item">
                    <span>{{ t('budget.editor.ports.eta') }}</span>
                    <strong>{{ formatDateTime(port.eta, '--') }}</strong>
                  </div>
                  <div class="schedule-time-item">
                    <span>{{ t('budget.editor.ports.etd') }}</span>
                    <!-- Departure date is plain text; only the first port can edit the voyage start. -->
                    <div class="schedule-date">
                      <strong>{{ formatDateTime(port.etd, '--') }}</strong>
                      <ion-button v-if="index === 0" fill="clear" size="small" class="schedule-edit-button" :aria-label="t('budget.editor.ports.editEtd')" @click="startAtEditorOpen = true"><Pencil :size="15" aria-hidden="true" /></ion-button>
                    </div>
                  </div>
                </div>

                <div v-if="index > 0 && !isRoutingPort(port)" class="weather-margin">
                  <span>{{ t('budget.editor.ports.weatherMargin') }}</span>
                  <ion-segment :value="weatherPreset(port)" @ion-change="setWeatherPreset(index, $event)">
                    <ion-segment-button value="none"><ion-label>{{ t('budget.editor.ports.weatherNone') }}</ion-label></ion-segment-button>
                    <ion-segment-button value="5"><ion-label>5%</ion-label></ion-segment-button>
                    <ion-segment-button value="10"><ion-label>10%</ion-label></ion-segment-button>
                    <ion-segment-button value="custom"><ion-label>{{ t('budget.editor.ports.weatherCustom') }}</ion-label></ion-segment-button>
                  </ion-segment>
                  <div v-if="weatherPreset(port) === 'custom'" class="weather-custom-row">
                    <ion-item lines="full"><ion-select :value="port.weatherMarginMode" :label="t('budget.editor.ports.weatherMode')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateWeatherMode(index, $event)"><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option></ion-select></ion-item>
                    <ion-item lines="full"><ion-input :value="numberText(port.weatherMarginValue)" :label="t('budget.editor.ports.weatherValue')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'weatherMarginValue', $event)" /></ion-item><span class="field-unit">{{ port.weatherMarginMode === 'percent' ? t('common.unit.percent') : t('common.unit.day') }}</span>
                  </div>
                  <small v-if="store.hasCalculatedRoute && port.weatherMarginMode !== 'none'">{{ t('budget.editor.ports.weatherAdded', { value: numberText(port.weatherMarginDays) }) }}</small>
                </div>
              </div>
            </article>

            <section v-if="store.hasCalculatedRoute" class="overall-margin">
              <h3>{{ t('budget.editor.ports.overallHeading') }}</h3>
              <div class="field-grid two-column">
                <ion-item lines="full"><ion-select :value="store.document.margins.portIdleMode" :label="t('budget.editor.ports.idleMargin')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portIdleMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(store.document.margins.portIdleValue)" :label="store.document.margins.portIdleMode === 'percent' ? t('budget.editor.ports.idleMarginPercent') : t('budget.editor.ports.idleMarginDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portIdleValue', $event)" /></ion-item>
                <ion-item lines="full"><ion-select :value="store.document.margins.portWorkingMode" :label="t('budget.editor.ports.workingMargin')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portWorkingMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(store.document.margins.portWorkingValue)" :label="store.document.margins.portWorkingMode === 'percent' ? t('budget.editor.ports.workingMarginPercent') : t('budget.editor.ports.workingMarginDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portWorkingValue', $event)" /></ion-item>
              </div>
              <small>{{ t('budget.editor.ports.marginSummary', { idle: numberText(store.document.margins.portIdleDays), working: numberText(store.document.margins.portWorkingDays) }) }}</small>
            </section>

            <section v-if="store.hasCalculatedRoute" class="route-summary-panel">
              <div class="route-summary-grid">
                <div><span>{{ t('budget.editor.ports.totalDistance') }}</span><strong>{{ amount(store.document.results.totalDistanceNm) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.totalEcaDistance') }}</span><strong>{{ amount(store.document.results.totalEcaDistanceNm) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.totalSeaDays') }}</span><strong>{{ amount(store.document.results.totalSeaDays) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.totalEcaSeaDays') }}</span><strong>{{ amount(store.document.results.totalEcaSeaDays) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.totalPortDays') }}</span><strong>{{ amount(store.document.results.totalIdleDays + store.document.results.totalWorkDays) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.totalVoyageDays') }}</span><strong>{{ amount(store.document.results.totalVoyageDays) }}</strong></div>
              </div>
              <div class="route-fuel-summary">
                <h3>{{ t('budget.editor.ports.fuelSummary') }}</h3>
                <div class="route-fuel-grid">
                  <div><span>{{ mainFuelType }}</span><strong>{{ amount(store.document.results.seaMainFuel) }} t</strong></div>
                  <div><span>{{ t('budget.editor.ports.fuelEca') }}</span><strong>{{ amount(store.document.results.ecaMainFuel) }} t</strong></div>
                  <div><span>{{ t('budget.editor.ports.fuelSub') }}</span><strong>{{ amount(store.document.results.seaAuxFuel) }} t</strong></div>
                  <div><span>{{ t('budget.editor.ports.fuelPort') }}</span><strong>{{ amount(store.document.results.portFuel) }} t</strong></div>
                  <div><span>{{ t('budget.editor.ports.totalFuel') }}</span><strong>{{ amount(store.document.results.totalFuel) }} t</strong></div>
                </div>
              </div>
            </section>

            <div class="section-actions">
              <ion-button v-if="store.document.ports.length > 0 && !store.hasCalculatedRoute" fill="outline" @click="openPortPicker"><Plus :size="17" /> {{ t('budget.editor.actions.addPort') }}</ion-button>
              <ion-button v-if="store.document.ports.length > 1" :disabled="!store.hasCalculatedRoute && !store.canCalculateRoute" @click="toggleRoute">{{ store.hasCalculatedRoute ? t('budget.editor.actions.cancelRoute') : store.calculatingRoute ? t('budget.editor.actions.calculating') : t('budget.editor.actions.calculateRoute') }}</ion-button>
              <ion-button v-if="store.hasCalculatedRoute" fill="outline" @click="openBudgetMap"><Map :size="17" /> {{ t('budget.editor.actions.viewMap') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="cargo-heading">
            <div class="section-heading">
              <h2 id="cargo-heading">{{ t('budget.editor.cargo.heading') }}</h2>
              <ion-button class="heading-add-button" fill="clear" size="small" :disabled="cargoPorts.length < 2" @click="openNewCargo"><Plus :size="19" aria-hidden="true" /><span>{{ t('budget.editor.cargo.add') }}</span></ion-button>
            </div>
            <p v-if="cargoPorts.length < 2" class="section-note">{{ t('budget.editor.cargo.portOrderNote') }}</p>
            <p v-else-if="!store.document.cargos.length" class="section-note">{{ t('budget.editor.cargo.empty') }}</p>
            <article v-for="(cargo, index) in store.document.cargos" :key="cargo.id" class="cargo-row">
              <div class="cargo-heading"><div><strong>{{ cargo.name || t('budget.editor.cargo.unnamed') }}</strong><span>{{ cargoPortName(cargo.loadPortId) }} → {{ cargoPortName(cargo.dischargePortId) }}</span></div><div><ion-button fill="clear" size="small" :aria-label="t('budget.editor.cargo.edit')" @click="openCargo(index)"><Pencil :size="16" /></ion-button><ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.editor.cargo.remove')" @click="confirmRemoveCargo(index)"><Trash2 :size="16" /></ion-button></div></div>
              <!-- Cargo panel mirrors the detail page cargo column: every value is plain text (same size, not bold); commissions show rate and amount on one line. -->
              <div class="cargo-metrics">
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.quantityShort') }}</span><strong>{{ amount(cargo.quantity) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.freightShort') }}</span><strong>{{ amount(cargo.freight) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.incomeShort') }}</span><strong>{{ amount(cargo.income) }}</strong></div>
              </div>
              <div class="cargo-metrics">
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.addCommShort') }}</span><strong>{{ amount(cargo.addCommRate) }}% {{ amount(cargoChargeAmount(cargo, 'addCommRate')) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.brokerageShort') }}</span><strong>{{ amount(cargo.brokerageRate) }}% {{ amount(cargoChargeAmount(cargo, 'brokerageRate')) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.taxShort') }}</span><strong>{{ amount(cargo.frtTaxRate) }}% {{ amount(cargoChargeAmount(cargo, 'frtTaxRate')) }}</strong></div>
              </div>
              <div class="cargo-metrics two-column-cargo">
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.demurrageShort') }}</span><strong>{{ amount(cargo.demurrage) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.dispatchShort') }}</span><strong>{{ amount(cargo.dispatch) }}</strong></div>
              </div>
            </article>
            <div v-if="store.document.cargos.length > 1" class="cargo-subtotal">
              <strong>{{ t('budget.editor.cargo.subtotal') }}</strong>
              <div class="cargo-metrics">
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.incomeShort') }}</span><strong>{{ amount(cargoTotals.income) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.addCommShort') }}</span><strong>{{ amount(cargoTotals.addComm) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.brokerageShort') }}</span><strong>{{ amount(cargoTotals.brokerage) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.taxShort') }}</span><strong>{{ amount(cargoTotals.tax) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.demurrageShort') }}</span><strong>{{ amount(cargoTotals.demurrage) }}</strong></div>
                <div class="cargo-metric"><span>{{ t('budget.editor.cargo.dispatchShort') }}</span><strong>{{ amount(cargoTotals.dispatch) }}</strong></div>
              </div>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="prices-heading">
            <div class="section-heading"><h2 id="prices-heading">{{ t('budget.editor.prices.heading') }}</h2></div>
            <div class="price-heading"><h3>{{ t('budget.editor.prices.unitPrice') }}</h3><ion-segment :value="mainFuelType" @ion-change="setMainFuelType"><ion-segment-button value="LSFO"><ion-label>LSFO</ion-label></ion-segment-button><ion-segment-button value="HSFO"><ion-label>HSFO</ion-label></ion-segment-button></ion-segment></div>
            <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(mainFuelPrice)" :label="mainFuelType" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice(mainFuelPriceField, $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.prices.mgoPrice)" label="LSDO/MGO" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('mgoPrice', $event)" /></ion-item></div>
            <small class="section-note">{{ t('budget.editor.prices.defaultNote') }}</small>
            <div v-if="store.hasCalculatedRoute" class="fuel-cost-summary"><h3>{{ t('budget.editor.prices.fuelCostHeading') }}</h3><div><span>{{ t('budget.editor.prices.mainFuelCost', { name: mainFuelType }) }}</span><strong>{{ amount(store.document.results.nonEcaFuelCost) }}</strong><small>{{ t('budget.editor.prices.mainFuelFormula', { name: mainFuelType, fuel: amount(store.document.results.seaMainFuel), price: amount(mainFuelPrice) }) }}</small></div><div><span>{{ t('budget.editor.prices.mgoFuelCost') }}</span><strong>{{ amount(mgoFuelCost) }}</strong><small>{{ t('budget.editor.prices.mgoFuelNote', { price: amount(store.document.prices.mgoPrice) }) }}</small></div><p>{{ t('budget.editor.prices.fuelCostTotal', { value: amount(store.document.results.totalFuelCost) }) }}</p></div>
          </section>

          <section class="editor-section" aria-labelledby="cost-heading">
            <div class="section-heading"><h2 id="cost-heading">{{ t('budget.editor.costs.heading') }}</h2><span>{{ t('budget.editor.costs.autoSummary') }}</span></div>
            <div class="cost-readonly"><span>{{ t('budget.editor.costs.fuelCost') }}</span><strong>{{ amount(store.document.results.totalFuelCost) }}</strong><span>{{ t('budget.editor.costs.portCharge') }}</span><strong>{{ amount(store.document.results.totalPortCharge) }}</strong></div>
            <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.ilohc)" :label="t('budget.editor.costs.holdCleaning')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('ilohc', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.cev)" :label="t('budget.editor.costs.cev')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('cev', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.inspection)" :label="t('budget.editor.costs.inspection')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('inspection', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.opOther)" :label="t('budget.editor.costs.opOther')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('opOther', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hirePerDay)" :label="t('budget.editor.costs.hirePerDay')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hirePerDay', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hireCommPercent)" :label="t('budget.editor.costs.hireCommPercent')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hireCommPercent', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.fixedCost)" :label="t('budget.editor.costs.fixedCost')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('fixedCost', $event)" /></ion-item></div>
            <div class="cost-formula"><span>{{ t('budget.editor.costs.hireAmount', { value: amount(hireAmount) }) }}</span><span>{{ t('budget.editor.costs.hireCost', { value: amount(hireCost) }) }}</span></div>
          </section>

          <section class="editor-section result-section" aria-labelledby="result-heading">
            <div class="section-heading"><h2 id="result-heading">{{ t('budget.editor.results.heading') }}</h2><ion-button fill="clear" size="small" :aria-label="t('budget.editor.results.formula')" @click="formulaOpen = true"><Info :size="18" /></ion-button></div>
            <div class="result-grid"><div v-for="item in resultItems" :key="item.label"><span>{{ item.label }}</span><strong :class="item.value < 0 ? 'profit-negative' : 'profit-positive'">{{ amount(item.value) }}</strong></div></div>
          </section>

          <!-- Save actions live at the end of the page (the toolbar keeps navigation only). -->
          <section class="editor-actions">
            <ion-button v-if="store.currentId" expand="block" fill="outline" :disabled="store.saving" @click="confirmSaveAs">{{ t('budget.editor.actions.saveAs') }}</ion-button>
            <ion-button expand="block" :disabled="store.saving" @click="saveBudget">{{ store.saving ? t('budget.editor.actions.saving') : t('budget.editor.actions.save') }}</ion-button>
          </section>
        </template>
      </main>

      <!-- Floating save button: stays in thumb reach while scrolling. -->
      <ion-fab v-if="!initializing" slot="fixed" vertical="bottom" horizontal="end" class="save-fab">
        <ion-fab-button :disabled="store.saving" :aria-label="t('budget.editor.header.saveBudget')" @click="saveBudget">
          <Save :size="22" aria-hidden="true" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-modal :is-open="startAtEditorOpen" :keep-contents-mounted="true" @did-dismiss="startAtEditorOpen = false">
      <ion-datetime id="budget-start-at" presentation="date-time" :locale="locale" :value="store.document.startAt" :show-default-buttons="true" :done-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateStartAt" />
    </ion-modal>

    <ion-modal :is-open="portPickerOpen" @did-dismiss="closePortPicker">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.editor.ports.add') }}</ion-title><ion-buttons slot="end"><ion-button @click="closePortPicker">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <ion-list lines="full" class="modal-list">
          <ion-item><ion-select :value="newPortTask" :label="t('budget.editor.ports.taskType')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="setNewPortTask"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
        </ion-list>
        <ion-item lines="none" class="search-field">
          <Search slot="start" :size="18" aria-hidden="true" />
          <ion-input :value="portKeyword" :placeholder="t('budget.editor.ports.searchPort')" :aria-label="t('budget.editor.ports.searchPort')" type="text" inputmode="search" enterkeyhint="search" @ion-input="searchPort" />
          <button v-if="portKeyword" slot="end" class="search-clear" type="button" :aria-label="t('common.clear')" @click="clearPortKeyword"><X :size="16" /></button>
        </ion-item>
        <ion-list lines="full" class="modal-list port-results">
          <ion-item v-if="store.searchingPorts"><ion-label color="medium">{{ t('common.searching') }}</ion-label></ion-item>
          <ion-item v-else-if="portKeyword && !store.portSuggestions.length"><ion-label color="medium">{{ t('budget.editor.ports.searchEmpty') }}</ion-label></ion-item>
          <ion-item v-for="port in store.portSuggestions" :key="String(port.portId)" button :detail="false" @click="addSelectedPort(port)"><ion-label><strong>{{ formatPortSuggestion(port) }}</strong></ion-label></ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="cargoEditorOpen" @did-dismiss="cancelCargoEditor">
      <ion-header><ion-toolbar><ion-title>{{ newCargoPending ? t('budget.editor.cargo.modalAddTitle') : t('budget.editor.cargo.modalEditTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="cancelCargoEditor">{{ t('common.cancel') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <template v-if="activeCargo">
          <ion-list lines="full" class="modal-list">
            <ion-item><ion-input :value="activeCargo.name" :label="t('budget.editor.cargo.name')" label-placement="floating" :maxlength="100" :placeholder="t('budget.editor.cargo.namePlaceholder')" @ion-input="updateCargoText('name', $event)" /></ion-item>
          </ion-list>
          <p class="section-note cargo-port-hint">{{ t('budget.editor.cargo.portOrderNote') }}</p>
          <div class="field-grid two-column modal-grid">
            <ion-item lines="full"><ion-select :value="activeCargo.loadPortId" :label="t('budget.editor.cargo.loadPort')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateCargoText('loadPortId', $event)"><ion-select-option v-for="port in cargoPorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item>
            <ion-item lines="full"><ion-select :value="activeCargo.dischargePortId" :label="t('budget.editor.cargo.dischargePort')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateCargoText('dischargePortId', $event)"><ion-select-option v-for="port in cargoPorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item>
          </div>
          <div class="field-grid two-column modal-grid">
            <ion-item lines="full"><ion-input :value="numberText(activeCargo.quantity)" :label="t('budget.editor.cargo.quantity')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('quantity', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(activeCargo.freight)" :label="t('budget.editor.cargo.freight')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('freight', $event)" /></ion-item>
          </div>
          <div class="cargo-calculated"><span>{{ t('budget.editor.cargo.income') }}</span><strong>{{ amount(activeCargo.income) }}</strong></div>
          <div class="field-grid three-column modal-grid">
            <div class="charge-field">
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.addCommRate)" :label="t('budget.editor.cargo.addCommRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('addCommRate', $event)" /></ion-item>
              <div class="charge-calculated"><span>{{ t('budget.editor.cargo.addCommAmount') }}</span><strong>{{ amount(cargoCommission('addCommRate')) }}</strong></div>
            </div>
            <div class="charge-field">
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.brokerageRate)" :label="t('budget.editor.cargo.brokerageRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('brokerageRate', $event)" /></ion-item>
              <div class="charge-calculated"><span>{{ t('budget.editor.cargo.brokerageAmount') }}</span><strong>{{ amount(cargoCommission('brokerageRate')) }}</strong></div>
            </div>
            <div class="charge-field">
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.frtTaxRate)" :label="t('budget.editor.cargo.taxRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('frtTaxRate', $event)" /></ion-item>
              <div class="charge-calculated"><span>{{ t('budget.editor.cargo.taxAmount') }}</span><strong>{{ amount(cargoCommission('frtTaxRate')) }}</strong></div>
            </div>
          </div>
          <div class="field-grid two-column modal-grid">
            <ion-item lines="full"><ion-input :value="numberText(activeCargo.demurrage)" :label="t('budget.editor.cargo.demurrage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('demurrage', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(activeCargo.dispatch)" :label="t('budget.editor.cargo.dispatch')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('dispatch', $event)" /></ion-item>
          </div>
        </template>
        <div class="modal-submit"><ion-button expand="block" @click="finishCargoEditor">{{ t('budget.editor.actions.confirm') }}</ion-button></div>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="templateManagerOpen" @did-dismiss="closeTemplateManager">
      <ion-header><ion-toolbar><ion-buttons slot="start"><ion-button v-if="!templateDraft" :aria-label="t('budget.editor.templates.add')" @click="openNewTemplate"><Plus :size="20" /></ion-button><ion-button v-else @click="templateDraft = null">{{ t('budget.editor.actions.back') }}</ion-button></ion-buttons><ion-buttons slot="end"><ion-button @click="closeTemplateManager">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <ion-list v-if="!templateDraft" lines="full" class="modal-list">
          <ion-item v-if="!store.fuelTemplates.length"><ion-label color="medium">{{ t('budget.editor.templates.empty') }}</ion-label></ion-item>
          <ion-item v-for="template in store.fuelTemplates" :key="template.id">
            <ion-label><strong>{{ template.name }}</strong><p>{{ t('budget.editor.templates.summary', { laden: template.seaLadenFuel, ballast: template.seaBallastFuel, aux: template.seaAuxFuel }) }}</p></ion-label>
            <ion-buttons slot="end"><ion-button @click="applyTemplate(template)">{{ t('budget.editor.templates.apply') }}</ion-button><ion-button :aria-label="t('budget.editor.templates.edit')" @click="editTemplate(template)"><Pencil :size="17" /></ion-button><ion-button color="danger" :aria-label="t('budget.editor.templates.remove')" @click="confirmRemoveTemplate(template.id)"><Trash2 :size="17" /></ion-button></ion-buttons>
          </ion-item>
        </ion-list>
        <template v-else>
          <ion-list lines="full" class="modal-list">
            <ion-item><ion-input :value="templateDraft.name" :label="t('budget.editor.templates.name')" label-placement="floating" :maxlength="80" @ion-input="updateTemplateName" /></ion-item>
          </ion-list>
          <h3>{{ t('budget.editor.fuel.dailyHeading') }}</h3>
          <div class="field-grid two-column modal-grid">
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.seaLadenFuel)" :label="t('budget.editor.templates.seaLadenFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaLadenFuel', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.seaBallastFuel)" :label="t('budget.editor.templates.seaBallastFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaBallastFuel', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.seaAuxFuel)" :label="t('budget.editor.templates.seaAuxFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaAuxFuel', $event)" /></ion-item>
          </div>
          <div class="field-grid two-column modal-grid">
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.portIdleFuel)" :label="t('budget.editor.templates.portIdleFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('portIdleFuel', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.portWorkingFuel)" :label="t('budget.editor.templates.portWorkingFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('portWorkingFuel', $event)" /></ion-item>
          </div>
          <h3>{{ t('budget.editor.fuel.speedHeading') }}</h3>
          <div class="field-grid speed-grid modal-grid">
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.ballastFullSpeed)" :label="t('budget.editor.templates.ballastFullSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ballastFullSpeed', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.ballastEcoSpeed)" :label="t('budget.editor.templates.ballastEcoSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ballastEcoSpeed', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.ladenFullSpeed)" :label="t('budget.editor.templates.ladenFullSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ladenFullSpeed', $event)" /></ion-item>
            <ion-item lines="full"><ion-input :value="numberText(templateDraft.ladenEcoSpeed)" :label="t('budget.editor.templates.ladenEcoSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ladenEcoSpeed', $event)" /></ion-item>
          </div>
        </template>
        <div v-if="templateDraft" class="modal-submit"><ion-button expand="block" @click="saveTemplateDraft">{{ t('budget.editor.templates.save') }}</ion-button></div>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="formulaOpen" @did-dismiss="formulaOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.editor.results.formulaTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="formulaOpen = false">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content"><ion-list inset><ion-item><ion-label><strong>{{ t('budget.editor.results.netIncome') }}</strong><p>{{ t('budget.editor.results.formulaNetIncome') }}</p></ion-label></ion-item><ion-item><ion-label><strong>{{ t('budget.editor.results.operatingCost') }}</strong><p>{{ t('budget.editor.results.formulaOperatingCost') }}</p></ion-label></ion-item><ion-item><ion-label><strong>{{ t('budget.editor.results.totalExpense') }}</strong><p>{{ t('budget.editor.results.formulaTotalExpense') }}</p></ion-label></ion-item><ion-item><ion-label><strong>{{ t('budget.editor.results.netProfit') }}</strong><p>{{ t('budget.editor.results.formulaNetProfit') }}</p></ion-label></ion-item></ion-list></ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Map,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShipWheel,
  Trash2,
  X,
} from 'lucide-vue-next'
import {
  alertController,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
  onIonViewWillLeave,
  toastController,
} from '@ionic/vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { formatAmount, formatDateTime } from '@/i18n/format'
import { useEstiDeployStore } from '@/stores/esti-deploy'
import type {
  BudgetCargo,
  BudgetCosts,
  BudgetFuelInput,
  BudgetFuelPrices,
  BudgetMargins,
  BudgetPort,
  BudgetPortTask,
  BudgetSpeedProfile,
  DailyFuelTemplate,
  MainFuelType,
  PortInfo,
} from '@/types'

type FuelField = Exclude<keyof BudgetFuelInput, 'ladenFuelType' | 'ballastFuelType'>
type CargoNumberField = 'quantity' | 'freight' | 'addCommRate' | 'brokerageRate' | 'frtTaxRate' | 'demurrage' | 'dispatch'
type PortNumberField = 'idleDays' | 'workDays' | 'portCharge' | 'weatherMarginValue'
type TemplateNumberField = Exclude<keyof DailyFuelTemplate, 'id' | 'name'>

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const store = useEstiDeployStore()
const initializing = ref(false)
const portPickerOpen = ref(false)
const portKeyword = ref('')
const newPortTask = ref<BudgetPortTask>('load')
const cargoEditorOpen = ref(false)
const activeCargoIndex = ref(-1)
const newCargoPending = ref(false)
const cargoSnapshot = ref<BudgetCargo | null>(null)
const templateManagerOpen = ref(false)
const templateDraft = ref<DailyFuelTemplate | null>(null)
const newTemplateName = ref('')
const formulaOpen = ref(false)
const startAtEditorOpen = ref(false)
const initialized = ref(false)
const loadedId = ref('')
let skipAutomaticDraft = false
let allowEditorExit = false
let childNavigation = false
let confirmingExit = false

// ion-select 弹层：浮动标签下 Ionic 默认用 size:'cover' 撑满屏幕并截断选项文字，
// 这里复用 app.css 的 tz-select-popover（跟随内容宽度）并显式声明自适应尺寸。
const selectInterfaceOptions = { cssClass: 'tz-select-popover', size: 'auto' }

const taskOptions = computed<Array<{ value: BudgetPortTask; label: string }>>(() => [
  { value: 'ballast', label: t('budget.editor.ports.taskBallast') },
  { value: 'load', label: t('budget.editor.ports.taskLoad') },
  { value: 'discharge', label: t('budget.editor.ports.taskDischarge') },
  { value: 'bunker', label: t('budget.editor.ports.taskBunker') },
  { value: 'canal', label: t('budget.editor.ports.taskCanal') },
  { value: 'pass', label: t('budget.editor.ports.taskPass') },
  { value: 'routing', label: t('budget.editor.ports.taskRouting') },
  { value: 'snug', label: t('budget.editor.ports.taskSnug') },
  { value: 'repair', label: t('budget.editor.ports.taskRepair') },
  { value: 'transit', label: t('budget.editor.ports.taskTransit') },
])

const activeCargo = computed(() => store.document.cargos[activeCargoIndex.value] || null)
const cargoPorts = computed(() => store.document.ports.filter((port) => port.taskType !== 'routing'))
const mainFuelType = computed<MainFuelType>(() => store.document.fuel.ladenFuelType === 'HSFO' || store.document.fuel.ballastFuelType === 'HSFO' ? 'HSFO' : 'LSFO')
const mainFuelPriceField = computed<keyof BudgetFuelPrices>(() => mainFuelType.value === 'HSFO' ? 'hsfoPrice' : 'lsfoPrice')
const mainFuelPrice = computed(() => store.document.prices[mainFuelPriceField.value])
const mgoFuelCost = computed(() => store.document.results.ecaFuelCost + store.document.results.seaAuxFuelCost + store.document.results.portFuelCost)
const hireAmount = computed(() => store.document.costs.hirePerDay * store.document.results.totalVoyageDays)
const hireCost = computed(() => hireAmount.value - hireAmount.value * store.document.costs.hireCommPercent / 100)
const resultItems = computed(() => [
  { label: t('budget.editor.results.totalIncome'), value: store.document.results.totalIncome },
  { label: t('budget.editor.results.netIncome'), value: store.document.results.netIncome },
  { label: t('budget.editor.results.operatingCost'), value: store.document.results.operatingCost },
  { label: t('budget.editor.results.totalExpense'), value: store.document.results.totalExpense },
  { label: t('budget.editor.results.operatingProfit'), value: store.document.results.operatingProfit },
  { label: t('budget.editor.results.netProfit'), value: store.document.results.netProfit },
  { label: t('budget.editor.results.hirePerDayLevel'), value: store.document.results.hirePerDayLevel },
  { label: t('budget.editor.results.dailyProfit'), value: store.document.results.dailyProfit },
])
const cargoTotals = computed(() => store.document.cargos.reduce((total, cargo) => {
  const income = numberOf(cargo.income)
  return {
    income: total.income + income,
    addComm: total.addComm + income * numberOf(cargo.addCommRate) / 100,
    brokerage: total.brokerage + income * numberOf(cargo.brokerageRate) / 100,
    tax: total.tax + income * numberOf(cargo.frtTaxRate) / 100,
    demurrage: total.demurrage + numberOf(cargo.demurrage),
    dispatch: total.dispatch + numberOf(cargo.dispatch),
  }
}, { income: 0, addComm: 0, brokerage: 0, tax: 0, demurrage: 0, dispatch: 0 }))

onIonViewWillEnter(() => {
  allowEditorExit = false
  childNavigation = false
  void initializeEditor()
})

onIonViewWillLeave(() => {
  if (!skipAutomaticDraft && !allowEditorExit && !childNavigation && store.hasUnsavedEditorState && !store.saving) {
    void store.saveLocalDraft().catch(() => undefined)
  }
})

onBeforeRouteLeave(async () => {
  if (allowEditorExit || childNavigation || skipAutomaticDraft || store.saving || !store.hasUnsavedEditorState) return true
  // 询问对话框只在「新增预算且航程已计算」时出现：编辑既有预算或尚未计算航程时静默离开
  // （离开页面的本地草稿自动保存由 onIonViewWillLeave 负责，不受此处影响）。
  if (store.currentId || !store.document.routeCalculated) return true
  if (confirmingExit) return false

  confirmingExit = true
  try {
    const alert = await alertController.create({
      header: t('budget.editor.share.exitTitle'),
      message: t('budget.editor.share.exitMessage'),
      buttons: [
        { text: t('budget.editor.share.continueEditing'), role: 'cancel' },
        { text: t('budget.editor.share.discard'), role: 'discard', cssClass: 'alert-button-danger', handler: () => store.resetDraft() },
        { text: t('budget.editor.share.saveDraft'), role: 'save' },
      ],
    })
    await alert.present()
    const result = await alert.onDidDismiss()
    if (result.role === 'discard') {
      allowEditorExit = true
      return true
    }
    if (result.role === 'save') {
      try {
        await store.saveLocalDraft()
        allowEditorExit = true
        await showToast(t('budget.editor.draft.saved'), 'success')
        return true
      } catch (cause) {
        await showToast(messageOf(cause, t('budget.editor.draft.saveFailed')), 'danger')
      }
    }
    return false
  } finally {
    confirmingExit = false
  }
})

async function requestEditorExit() {
  // 询问对话框只对「新增预算且航程已计算」出现；编辑既有预算或尚未计算航程时直接离开
  // （本地草稿仍由 onIonViewWillLeave 自动保存）。
  if (allowEditorExit || skipAutomaticDraft || store.saving || !store.hasUnsavedEditorState || store.currentId || !store.document.routeCalculated) {
    allowEditorExit = true
    await router.replace('/tabs/esti-deploy')
    return
  }

  const alert = await alertController.create({
    header: t('budget.editor.share.exitTitle'),
    message: t('budget.editor.share.exitMessage'),
    buttons: [
      { text: t('budget.editor.share.continueEditing'), role: 'cancel' },
      { text: t('budget.editor.share.discard'), role: 'discard', cssClass: 'alert-button-danger' },
      { text: t('budget.editor.share.saveDraft'), role: 'save' },
    ],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role === 'discard') {
    store.resetDraft()
    allowEditorExit = true
    await router.replace('/tabs/esti-deploy')
    return
  }
  if (result.role === 'save') {
    try {
      await store.saveLocalDraft()
      allowEditorExit = true
      await router.replace('/tabs/esti-deploy')
      await showToast(t('budget.editor.draft.saved'), 'success')
    } catch (cause) {
      await showToast(messageOf(cause, t('budget.editor.draft.saveFailed')), 'danger')
    }
  }
}

async function initializeEditor() {
  skipAutomaticDraft = false
  initializing.value = true
  try {
    await Promise.all([
      store.loadFuelTemplates().catch(() => undefined),
      store.loadVessels().catch(() => undefined),
    ])
    const id = String(route.query.id || '')
    if (id && id !== loadedId.value) {
      await store.loadDetail(Number(id))
      loadedId.value = id
    } else if (!id && !initialized.value && !preservesCurrentDocument()) {
      store.resetDraft()
    }
    initialized.value = true
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.draft.loadFailed')), 'danger')
  } finally {
    initializing.value = false
  }
}

function preservesCurrentDocument() {
  return route.query.fromDistance === '1' || route.query.fromDraft === '1' || route.query.fromDetail === '1'
}

function inputValue(event: any) {
  const value = event?.detail?.value
  return Array.isArray(value) ? String(value[0] || '') : String(value || '')
}

function numberOf(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function numberText(value: unknown) {
  return String(numberOf(value))
}

function amount(value: unknown) {
  return formatAmount(numberOf(value))
}

function portName(port: BudgetPort) {
  return String(port.port.portName || port.port.fullName || t('budget.editor.ports.unnamedPort'))
}

function isRoutingPort(port: BudgetPort) {
  return port.taskType === 'routing' || Boolean(port.port.isWayPoint)
}

function selectShip(event: any) {
  const id = inputValue(event)
  store.shipId = id
  store.shipName = store.vessels.find((ship) => ship.id === id)?.shipName || ''
}

async function showShipInfo() {
  const alert = await alertController.create({
    header: t('budget.editor.basic.shipInfoTitle'),
    message: t('budget.editor.basic.shipInfoMessage'),
    buttons: [{ text: t('budget.editor.basic.shipInfoConfirm'), role: 'confirm' }],
  })
  await alert.present()
}

function updateStartAt(event: any) {
  const value = inputValue(event)
  if (!Number.isNaN(new Date(value).getTime())) store.updateStartAt(value)
}

function updateFuel(field: FuelField, event: any) {
  store.updateFuel({ [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetFuelInput>)
}

function updateSpeed(field: keyof BudgetSpeedProfile, event: any) {
  store.updateSpeeds({ [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetSpeedProfile>)
}

function selectFuelTemplate(event: any) {
  const id = inputValue(event)
  const template = store.fuelTemplates.find((item) => String(item.id) === id)
  if (template) store.applyFuelTemplate(template)
  else store.setFuelTemplateId()
}

async function saveCurrentAsTemplate() {
  const name = newTemplateName.value.trim()
  if (!name) return
  const saved = await saveTemplate({
    id: '',
    name,
    seaLadenFuel: store.document.fuel.seaLadenFuel,
    seaBallastFuel: store.document.fuel.seaBallastFuel,
    seaAuxFuel: store.document.fuel.seaAuxFuel,
    portIdleFuel: store.document.fuel.portIdleFuel,
    portWorkingFuel: store.document.fuel.portWorkingFuel,
    ballastFullSpeed: store.document.speeds.ballastFullSpeed,
    ballastEcoSpeed: store.document.speeds.ballastEcoSpeed,
    ladenFullSpeed: store.document.speeds.ladenFullSpeed,
    ladenEcoSpeed: store.document.speeds.ladenEcoSpeed,
  })
  if (saved) newTemplateName.value = ''
}

function openTemplateManager() {
  templateDraft.value = null
  templateManagerOpen.value = true
  void store.loadFuelTemplates().catch(() => undefined)
}

function closeTemplateManager() {
  templateManagerOpen.value = false
  templateDraft.value = null
}

function openNewTemplate() {
  templateDraft.value = {
    id: '', name: '', seaLadenFuel: 0, seaBallastFuel: 0, seaAuxFuel: 0, portIdleFuel: 0, portWorkingFuel: 0,
    ballastFullSpeed: 12, ballastEcoSpeed: 12, ladenFullSpeed: 12, ladenEcoSpeed: 12,
  }
}

function editTemplate(template: DailyFuelTemplate) {
  templateDraft.value = { ...template }
}

function updateTemplateName(event: any) {
  if (templateDraft.value) templateDraft.value.name = inputValue(event)
}

function updateTemplateNumber(field: TemplateNumberField, event: any) {
  if (templateDraft.value) templateDraft.value[field] = Math.max(0, numberOf(inputValue(event)))
}

async function saveTemplateDraft() {
  if (!templateDraft.value) return
  const saved = await saveTemplate(templateDraft.value)
  if (saved) templateDraft.value = null
}

async function saveTemplate(template: DailyFuelTemplate) {
  try {
    await store.saveFuelTemplate(template)
    await store.loadFuelTemplates()
    await showToast(t('budget.editor.templates.saved'), 'success')
    return true
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.templates.saveFailed')), 'danger')
    return false
  }
}

function applyTemplate(template: DailyFuelTemplate) {
  store.applyFuelTemplate(template)
  closeTemplateManager()
}

async function confirmRemoveTemplate(id: string | number) {
  const alert = await alertController.create({
    header: t('budget.editor.templates.removeTitle'),
    message: t('budget.editor.templates.removeMessage'),
    buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'confirm', cssClass: 'alert-button-danger' }],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role !== 'confirm') return
  try {
    await store.removeFuelTemplate(id)
    await showToast(t('budget.editor.templates.removed'), 'success')
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.templates.removeFailed')), 'danger')
  }
}

function openPortPicker() {
  const previousTask = store.document.ports.at(-1)?.taskType
  newPortTask.value = previousTask === 'load' ? 'discharge' : 'load'
  portKeyword.value = ''
  void store.searchPorts('')
  portPickerOpen.value = true
}

function closePortPicker() {
  portPickerOpen.value = false
  portKeyword.value = ''
  void store.searchPorts('')
}

function setNewPortTask(event: any) {
  const value = inputValue(event)
  if (taskOptions.value.some((task) => task.value === value)) newPortTask.value = value as BudgetPortTask
}

function searchPort(event: any) {
  portKeyword.value = inputValue(event)
  void store.searchPorts(portKeyword.value)
}

function clearPortKeyword() {
  portKeyword.value = ''
  void store.searchPorts('')
}

function formatPortSuggestion(port: PortInfo) {
  const name = String(port.portName || port.fullName || '').trim()
  const country = String(port.countryCode || '').trim()
  return country ? `${name}, ${country.toUpperCase()}` : name
}

function addSelectedPort(port: PortInfo) {
  store.addPort(port, newPortTask.value)
  closePortPicker()
}

function updatePortTask(index: number, event: any) {
  const value = inputValue(event)
  if (taskOptions.value.some((task) => task.value === value)) store.updatePort(index, { taskType: value as BudgetPortTask })
}

function updatePortLaden(index: number, event: any) {
  store.updatePort(index, { isLaden: inputValue(event) === 'laden' })
}

function updatePortSpeedMode(index: number, event: any) {
  store.updatePort(index, { speedMode: inputValue(event) === 'eco' ? 'eco' : 'full' })
}

function updatePortNumber(index: number, field: PortNumberField, event: any) {
  store.updatePort(index, { [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetPort>)
}

function weatherPreset(port: BudgetPort) {
  if (port.weatherMarginMode === 'none') return 'none'
  if (port.weatherMarginMode === 'percent' && numberOf(port.weatherMarginValue) === 5) return '5'
  if (port.weatherMarginMode === 'percent' && numberOf(port.weatherMarginValue) === 10) return '10'
  return 'custom'
}

function setWeatherPreset(index: number, event: any) {
  const value = inputValue(event)
  if (value === 'none') store.updatePort(index, { weatherMarginMode: 'none', weatherMarginValue: 0 })
  else if (value === '5' || value === '10') store.updatePort(index, { weatherMarginMode: 'percent', weatherMarginValue: Number(value) })
  else store.updatePort(index, { weatherMarginMode: 'percent', weatherMarginValue: 0 })
}

function updateWeatherMode(index: number, event: any) {
  const value = inputValue(event)
  store.updatePort(index, { weatherMarginMode: value === 'days' ? 'days' : 'percent' })
}

function updateMarginMode(field: 'portIdleMode' | 'portWorkingMode', event: any) {
  store.updateMargins({ [field]: inputValue(event) === 'percent' ? 'percent' : 'days' } as Partial<BudgetMargins>)
}

function updateMarginValue(field: 'portIdleValue' | 'portWorkingValue', event: any) {
  store.updateMargins({ [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetMargins>)
}

function fuelLeg(portId: string) {
  return store.fuelLegDetails.find((detail) => detail.arrivalPortId === portId)
}

function mainFuelForLeg(index: number) {
  const departurePort = store.document.ports[index - 1]
  return departurePort?.isLaden ? store.document.fuel.ladenFuelType : store.document.fuel.ballastFuelType
}

async function confirmRemovePort(index: number) {
  const alert = await alertController.create({
    header: t('budget.editor.share.removePortTitle'),
    message: t('budget.editor.share.removePortMessage'),
    buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'confirm', cssClass: 'alert-button-danger' }],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role === 'confirm') store.removePort(index)
}

async function toggleRoute() {
  try {
    if (store.hasCalculatedRoute) {
      store.resetRoute()
      return
    }
    const calculated = await store.calculateRoute()
    if (!calculated) throw new Error(t('budget.editor.errors.routeFailed'))
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.errors.routeFailed')), 'danger')
  }
}

function openBudgetMap() {
  if (!store.hasCalculatedRoute) return
  childNavigation = true
  void router.push('/esti-deploy/map')
}

function openShipSettings() {
  childNavigation = true
  void router.push('/ships')
}

function openNewCargo() {
  if (!store.addCargo()) {
    void showToast(t('budget.editor.errors.portMinRequired'), 'danger')
    return
  }
  activeCargoIndex.value = store.document.cargos.length - 1
  newCargoPending.value = true
  cargoSnapshot.value = null
  cargoEditorOpen.value = true
}

function openCargo(index: number) {
  const cargo = store.document.cargos[index]
  if (!cargo) return
  activeCargoIndex.value = index
  newCargoPending.value = false
  cargoSnapshot.value = JSON.parse(JSON.stringify(cargo)) as BudgetCargo
  cargoEditorOpen.value = true
}

function updateCargoText(field: 'name' | 'loadPortId' | 'dischargePortId', event: any) {
  if (activeCargoIndex.value < 0) return
  store.updateCargo(activeCargoIndex.value, { [field]: inputValue(event) } as Partial<BudgetCargo>)
}

function updateCargoNumber(field: CargoNumberField, event: any) {
  if (activeCargoIndex.value < 0) return
  store.updateCargo(activeCargoIndex.value, { [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetCargo>)
}

function cargoChargeAmount(cargo: BudgetCargo, field: 'addCommRate' | 'brokerageRate' | 'frtTaxRate') {
  return numberOf(cargo.income) * numberOf(cargo[field]) / 100
}

function cargoCommission(field: 'addCommRate' | 'brokerageRate' | 'frtTaxRate') {
  const cargo = activeCargo.value
  if (!cargo) return 0
  return cargoChargeAmount(cargo, field)
}

function closeCargoEditor() {
  cargoEditorOpen.value = false
  activeCargoIndex.value = -1
  newCargoPending.value = false
  cargoSnapshot.value = null
}

function cancelCargoEditor() {
  const index = activeCargoIndex.value
  if (index >= 0) {
    if (newCargoPending.value) store.removeCargo(index)
    else if (cargoSnapshot.value) store.updateCargo(index, cargoSnapshot.value)
  }
  closeCargoEditor()
}

async function finishCargoEditor() {
  const cargo = activeCargo.value
  if (!cargo) return
  if (!cargo.name.trim()) return showToast(t('budget.editor.errors.cargoNameRequired'), 'danger')
  if (!(numberOf(cargo.quantity) > 0)) return showToast(t('budget.editor.errors.cargoQuantityRequired'), 'danger')
  if (!(numberOf(cargo.freight) > 0)) return showToast(t('budget.editor.errors.cargoFreightRequired'), 'danger')
  if (!cargo.loadPortId || !cargo.dischargePortId || cargo.loadPortId === cargo.dischargePortId) return showToast(t('budget.editor.errors.cargoPortsRequired'), 'danger')
  closeCargoEditor()
}

async function confirmRemoveCargo(index: number) {
  const alert = await alertController.create({
    header: t('budget.editor.share.removeCargoTitle'),
    message: t('budget.editor.share.removeCargoMessage'),
    buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('common.delete'), role: 'confirm', cssClass: 'alert-button-danger' }],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role === 'confirm') store.removeCargo(index)
}

function cargoPortName(portId: string) {
  return cargoPorts.value.find((port) => port.id === portId)?.port.portName || t('budget.editor.cargo.noPort')
}

function setMainFuelType(event: any) {
  const value = inputValue(event)
  if (value === 'LSFO' || value === 'HSFO') store.updateFuel({ ladenFuelType: value, ballastFuelType: value })
}

function updatePrice(field: keyof BudgetFuelPrices, event: any) {
  store.updatePrices({ [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetFuelPrices>)
}

function updateCost(field: keyof BudgetCosts, event: any) {
  store.updateCosts({ [field]: Math.max(0, numberOf(inputValue(event))) } as Partial<BudgetCosts>)
}

async function saveBudget() {
  try {
    const id = await store.save()
    if (!id) return
    skipAutomaticDraft = true
    allowEditorExit = true
    await showToast(t('budget.editor.share.budgetSaved'), 'success')
    await router.replace(`/esti-deploy/detail/${id}`)
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.errors.saveFailed')), 'danger')
  }
}

async function confirmSaveAs() {
  const alert = await alertController.create({
    header: t('budget.editor.share.saveAsTitle'),
    message: t('budget.editor.share.saveAsMessage'),
    buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('budget.editor.share.saveAsConfirm'), role: 'confirm' }],
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role !== 'confirm') return
  store.prepareSaveAs()
  await saveBudget()
}

async function showToast(message: string, color: 'success' | 'warning' | 'danger') {
  const toast = await toastController.create({ message, color, duration: 1800, position: 'top' })
  await toast.present()
}

function messageOf(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback
}
</script>

<style scoped>
.budget-editor { min-height: 100%; padding: 14px 12px 20px; background: #eef3f8; }
.editor-state, .section-empty { display: grid; min-height: 42vh; place-items: center; align-content: center; gap: 12px; color: #6b7c8d; text-align: center; }
.section-empty p { margin: 0; }
.editor-section { margin: 0 0 12px; padding: 14px; border: 1px solid #dce6ef; border-radius: 8px; background: #fff; }
.section-heading { display: flex; align-items: center; justify-content: space-between; min-height: 34px; gap: 8px; }
.section-heading h2 { margin: 0; color: #173447; font-size: 16px; }
.section-heading > span { color: #718293; font-size: 12px; }
.section-heading ion-button { margin: -8px -8px -8px 0; --color: #005f88; }
.section-heading-actions { display: flex; min-width: 0; align-items: center; }
.compact-select { max-width: 132px; color: #005f88; font-size: 13px; }

/* 区块标题右侧的「添加港口 / 添加货物」：图标与文字各放大 1px（small 按钮默认 13px），并在两者之间留一点空隙 */
.heading-add-button { font-size: 14px; }
.heading-add-button svg { margin-inline-end: 4px; }

.editor-list { margin: 8px 0 0; }

/* 这三个字段原先直接裸露在网格/表头里，补上 ion-item 后收紧内边距，保持原布局 */
.template-name-item { flex: 1 1 auto; min-width: 0; --min-height: 68px; --padding-start: 0; --inner-padding-end: 0; }
.weather-custom-row ion-item { min-width: 0; --min-height: 68px; }
.field-unit { flex: none; align-self: center; margin-inline-start: 5px; padding-inline-end: 2px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }

/* 所有输入控件左边不留内边距：文字与 item 下划线左端对齐（弹层内 item 自身保留 12px 缩进，
   输入控件的 --padding-start 仍归零，所以文字与下划线仍然对齐） */
.editor-list ion-item, .field-grid ion-item, .modal-list ion-item,
.template-row ion-item, .template-save-row ion-item, .weather-custom-row ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
}
.editor-list ion-item::part(native), .field-grid ion-item::part(native), .modal-list ion-item::part(native),
.template-row ion-item::part(native), .template-save-row ion-item::part(native), .weather-custom-row ion-item::part(native) {
  padding-inline-start: 0;
  padding-inline-end: 0;
}

/* ===== 浮动标签（label-placement="floating"）统一间距 =====
   Ionic 的浮动 label 用 translateY(50%) scale(.75) 贴到控件顶部，数值文本在
   .native-wrapper（flex-grow: 1）里垂直居中。控件自身高度不够时这段剩余空间为 0，
   label 和数值就挤在一起；所以统一抬高控件 min-height，把多出来的高度让给数值文本，
   --padding-top/--padding-bottom 都收小，数值才会落在控件中下部、单行控件不偏心。 */
ion-input.input-label-placement-floating,
ion-select.select-label-placement-floating {
  min-height: 68px;
  --padding-top: 6px;
  --padding-bottom: 4px;
  --padding-start: 0;
  --padding-end: 0;
}

.editor-section h3 { margin: 17px 0 8px; color: #344d60; font-size: 13px; }
.field-grid { display: grid; gap: 8px; }
.two-column { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.field-grid ion-item { min-width: 0; --min-height: 68px; }
.field-grid ion-input, .field-grid ion-select { min-width: 0; --padding-top: 6px; --padding-bottom: 4px; --padding-start: 0; --padding-end: 0; font-size: 13px; }
.field-tip, .section-note { align-self: center; color: #748697; font-size: 12px; line-height: 1.45; }

/* ===== 与小程序对齐的排版（预算编辑页面 1.4.1 / 1.4.2 / 1.4.3） ===== */

/* 基本信息：无标题，船舶选择与说明/规范设置按钮同一行（参考小程序 BudgetBasicInfoPanel.vue） */
.basic-list { margin-top: 0; }
.ship-field { display: flex; align-items: center; gap: 6px; }
.ship-field .ship-item { flex: 1 1 auto; min-width: 0; --min-height: 68px; }
.ship-field ion-button { flex: none; height: 38px; margin: 0; --padding-start: 10px; --padding-end: 10px; }

/* 日油耗与航速：模板选择/设置另起一行紧随标题；油耗三行、辅机单独一行；4 个航速同一行
   （参考小程序 BudgetDailyFuelSpeedPanel.vue） */
.template-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.template-row .template-item { flex: 1 1 auto; min-width: 0; --min-height: 68px; }
.template-row ion-button { flex: none; margin: 0; --padding-start: 10px; --padding-end: 10px; }
.fuel-tip { grid-column: 1 / -1; }
/* 日油耗三行之间收紧行距（原先 8px 显得松散） */
.fuel-grid { row-gap: 4px; }
.fuel-port-grid { margin-top: 4px; }
.speed-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.speed-grid ion-item { --min-height: 68px; }
/* 4 个航速输入：label 比原来（11px）大一号，仍保持不换行 */
.speed-grid ion-input :deep(.label-text-wrapper) { font-size: 13px; letter-spacing: -0.2px; white-space: nowrap; }

/* 港序：空态整宽主按钮；航段面板；到离港时间；航程与油耗汇总
   （参考小程序 BudgetPortSequencePanel.vue） */
.port-empty { min-height: 150px; }
.empty-add-button { width: 100%; margin: 0; --background: #005f88; --background-hover: #00527a; --color: #fff; }
.sailing-panel { display: grid; gap: 10px; margin-top: 10px; padding: 12px 9px; border-radius: 6px; background: #f7fafc; }
.sailing-panel .route-leg-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; overflow: visible; margin-top: 0; border: 0; border-radius: 0; background: transparent; }
.sailing-panel .route-leg-summary > div { padding: 0; background: transparent; }
.port-operation-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 0; }
.schedule-times { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.schedule-time-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; color: #667085; font-size: 11px; }
.schedule-time-item strong { overflow: hidden; color: #1d2939; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
/* 首个港口的离港日期：日期文字 + 右侧小号修改按钮（替换原先过大的 ion-datetime-button） */
.schedule-date { display: flex; align-items: center; gap: 2px; min-width: 0; }
.schedule-date strong { flex: 1 1 auto; min-width: 0; }
.schedule-edit-button { flex: none; width: 28px; min-width: 28px; height: 28px; margin: 0 -6px 0 0; --padding-start: 0; --padding-end: 0; --color: #005f88; }
.route-summary-panel { margin-top: 12px; padding: 12px 10px; border-radius: 6px; background: #edf7f3; }
.route-summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.route-summary-grid > div, .route-fuel-grid > div { min-width: 0; }
.route-summary-grid span, .route-summary-grid strong, .route-fuel-grid span, .route-fuel-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-summary-grid span, .route-fuel-grid span { color: #667085; font-size: 11px; }
.route-summary-grid strong, .route-fuel-grid strong { margin-top: 4px; color: #1d2939; font-size: 13px; font-weight: 700; }
.route-fuel-summary { margin-top: 10px; padding-top: 10px; border-top: 1px solid #c9e5d9; }
.route-fuel-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
.template-save-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.template-save-row ion-input { min-width: 0; }
.template-save-row ion-button { flex: none; margin: 0; font-size: 12px; }
.port-block, .cargo-row { padding: 13px 0; border-top: 1px solid #e7edf2; }
.port-block:first-of-type { margin-top: 8px; }
.port-heading, .cargo-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.port-title, .cargo-heading > div:first-child { min-width: 0; }
.port-title strong, .port-title span, .cargo-heading strong, .cargo-heading span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.port-title strong, .cargo-heading strong { color: #273f51; font-size: 14px; }
.port-title span, .cargo-heading span { margin-top: 4px; color: #718293; font-size: 12px; }
.routing-port .port-title strong { color: #315d7b; font-style: italic; }
.port-actions, .cargo-heading > div:last-child { display: flex; flex: none; }
.port-actions ion-button, .cargo-heading ion-button { width: 30px; min-width: 30px; height: 32px; margin: -6px 0 0; --padding-start: 0; --padding-end: 0; }
/* 任务下拉文字较长：单独占一行，不再和「下一航段 / 航速模式」挤在 1/3 宽度里换行 */
.port-mode-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 10px; }
.port-mode-grid .port-task-item { grid-column: 1 / -1; }
.route-leg-summary, .route-summary, .result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; margin-top: 10px; border: 1px solid #dce7ee; border-radius: 6px; background: #dce7ee; }
.route-leg-summary > div, .route-summary > div, .result-grid > div { min-width: 0; padding: 9px; background: #f8fbfd; }
.route-leg-summary span, .route-leg-summary strong, .route-summary span, .route-summary strong, .result-grid span, .result-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-leg-summary span, .route-summary span, .result-grid span { color: #748697; font-size: 11px; }
.route-leg-summary strong, .route-summary strong, .result-grid strong { margin-top: 4px; color: #28475c; font-size: 13px; }
.fuel-leg-summary { margin-top: 10px; padding: 10px; border-radius: 6px; background: #edf7f3; color: #4c6675; font-size: 12px; }
.fuel-leg-values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; margin-top: 7px; }
.fuel-leg-values span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.port-operation-grid { margin-top: 10px; }
.port-time { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 3px 7px; padding: 8px; color: #748697; font-size: 11px; }
.port-time strong { overflow: hidden; color: #40586a; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.weather-margin { margin-top: 10px; }
.weather-margin > span { display: block; margin-bottom: 6px; color: #526879; font-size: 12px; }
.weather-margin ion-segment { --background: #f2f6f8; }
.weather-margin ion-segment-button { min-height: 32px; --color: #617688; --color-checked: #005f88; --indicator-color: #fff; font-size: 11px; }
.weather-custom-row { display: grid; grid-template-columns: .8fr 1fr auto; gap: 8px; margin-top: 8px; }
.weather-margin small { display: block; margin-top: 6px; color: #607789; font-size: 11px; }
.overall-margin { margin-top: 12px; padding: 10px; border-radius: 6px; background: #f8fbfd; }
.overall-margin h3 { margin: 0 0 8px; }
.overall-margin small { display: block; margin-top: 8px; color: #6d8192; font-size: 11px; }
.section-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.section-actions ion-button { margin: 0; }

/* 货物展示：格式对齐详情页货物栏 —— 所有数值同字号且不加粗；数量/运价/收入与小计
   标签一行、数值单独一行；回扣佣金/经纪佣金/税费的费率与金额同一行。 */
.cargo-row { padding-inline: 2px; }
.cargo-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px; margin-top: 9px; }
.cargo-metrics.two-column-cargo { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cargo-metric { min-width: 0; }
.cargo-metric > span, .cargo-metric > strong { display: block; }
.cargo-metric > span { color: #6b7d8c; font-size: 12px; }
.cargo-metric > strong { margin-top: 3px; overflow: hidden; color: #29485d; font-size: 14px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.cargo-subtotal { margin-top: 12px; padding: 10px; border-radius: 6px; background: #f2f7fc; }
.cargo-subtotal > strong { display: block; color: #314d61; font-size: 13px; }
.cargo-subtotal .cargo-metrics { margin-top: 8px; }
.cargo-subtotal .cargo-metric > span { color: #607a8c; }

.price-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.price-heading h3 { margin-top: 14px; }
.price-heading ion-segment { width: 142px; --background: #eff5f8; }
.price-heading ion-segment-button { min-height: 32px; font-size: 12px; }
.fuel-cost-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.fuel-cost-summary h3, .fuel-cost-summary p { grid-column: 1 / -1; }
.fuel-cost-summary h3 { margin: 0; }
.fuel-cost-summary > div { min-width: 0; padding: 10px; border-radius: 6px; background: #f7fafc; }
.fuel-cost-summary span, .fuel-cost-summary strong, .fuel-cost-summary small { display: block; }
.fuel-cost-summary span, .fuel-cost-summary small { color: #6e8192; font-size: 11px; line-height: 1.4; }
.fuel-cost-summary strong { margin: 4px 0; color: #26495f; font-size: 14px; }
.fuel-cost-summary p { margin: 0; padding: 9px 0 0; color: #005f88; font-size: 12px; font-weight: 700; }
.cost-readonly { display: grid; grid-template-columns: repeat(2, auto); justify-content: start; gap: 4px 10px; margin: 10px 0; color: #6d8192; font-size: 12px; }
.cost-readonly strong { color: #334f62; }
.cost-formula { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 10px; color: #587185; font-size: 12px; }
.result-section { background: #f8fcff; }
.result-grid { margin-top: 10px; }
.result-grid strong.profit-positive { color: #087443 !important; }
.result-grid strong.profit-negative { color: #b42318 !important; }

/* 保存/另存：页面最下方整宽按钮；底部留出悬浮保存按钮的位置与安全区 */
.editor-actions { display: grid; gap: 10px; padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px)); }
.editor-actions ion-button { margin: 0; }

/* 悬浮保存按钮：贴右下角，避开底部安全区 */
.save-fab { margin-bottom: env(safe-area-inset-bottom, 0px); }
.save-fab ion-fab-button { --background: #005f88; --background-activated: #00496b; --color: #fff; --box-shadow: 0 6px 16px rgba(0, 95, 136, .3); }

.modal-content { --padding-top: 12px; --padding-bottom: calc(20px + env(safe-area-inset-bottom)); --padding-start: 12px; --padding-end: 12px; }
.modal-content ion-list ion-item,
.modal-content .field-grid ion-item { --padding-start: 12px; --inner-padding-end: 12px; --background: transparent; }
.modal-content ion-list ion-item::part(native),
.modal-content .field-grid ion-item::part(native) { padding-inline-start: 12px; padding-inline-end: 12px; }
.modal-content ion-list ion-input, .modal-content ion-list ion-select,
.modal-content .field-grid ion-input, .modal-content .field-grid ion-select { --padding-start: 0; --padding-end: 0; }
.modal-content h3 { margin: 14px 0 8px; color: #344d60; font-size: 13px; }
.modal-list { margin: 0; }
.modal-grid { margin-top: 10px; }
.three-column { grid-template-columns: repeat(3, minmax(0, 1fr)); }
/* 底部确认/保存按钮与上方输入区之间留一行空隙 */
.modal-submit { margin-top: 16px; padding: 4px 0 12px; }

/* 港口选择：用 ion-item + ion-input 代替 ion-searchbar（后者在 iOS 高度固定 36px） */
.search-field { width: 100%; height: 56px; margin-top: 10px; --min-height: 56px; --background: #fff; --border-radius: 8px; --padding-start: 12px; --inner-padding-end: 4px; --inner-border-width: 0; border: 1px solid #d6e2ef; border-radius: 8px; }
.search-field svg { flex: none; color: #1d4b7f; }
.search-field ion-input { min-width: 0; --padding-top: 0; --padding-bottom: 0; --padding-start: 8px; --padding-end: 4px; }
.search-clear { display: grid; flex: none; width: 26px; height: 26px; margin-right: 4px; padding: 0; place-items: center; border: 0; border-radius: 50%; background: #eef3f8; color: #64748b; }
.port-results { margin-top: 10px; border-top: 1px solid #edf1f5; }

/* 货物编辑：货物收入行 + 三列佣金金额行（参考小程序 BudgetCargoEditorSheet.vue） */
.cargo-port-hint { margin: 8px 0 0; }
.cargo-calculated { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding: 8px 10px; border-radius: 4px; background: #f2f7fc; }
.cargo-calculated span { color: #475467; font-size: 13px; }
.cargo-calculated strong { color: #0058a2; font-size: 15px; font-weight: 700; }
.charge-field { min-width: 0; }
.charge-calculated { display: flex; align-items: center; justify-content: space-between; gap: 3px; min-height: 27px; margin-top: 6px; padding: 0 5px; border-radius: 3px; background: #f2f7fc; }
.charge-calculated span { overflow: hidden; color: #667085; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.charge-calculated strong { color: #0058a2; font-size: 13px; font-weight: 700; }

@media (min-width: 640px) {
  .budget-editor { max-width: 760px; margin: 0 auto; }
  .sailing-panel .route-leg-summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .route-leg-summary, .route-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .result-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
