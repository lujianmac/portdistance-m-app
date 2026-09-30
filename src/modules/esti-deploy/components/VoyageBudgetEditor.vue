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
        <ion-buttons slot="end">
          <ion-button :aria-label="t('budget.editor.header.saveDraft')" @click="saveDraft">
            <FileDown :size="20" aria-hidden="true" />
          </ion-button>
          <ion-button v-if="store.currentId" :aria-label="t('budget.editor.header.saveAsNew')" @click="confirmSaveAs">
            <CopyPlus :size="20" aria-hidden="true" />
          </ion-button>
          <ion-button :aria-label="t('budget.editor.header.saveBudget')" :disabled="store.saving" @click="saveBudget">
            <Save :size="20" aria-hidden="true" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="budget-editor-content">
      <main class="budget-editor" :aria-label="t('budget.editor.header.editorLabel')">
        <section v-if="initializing" class="editor-state">
          <ion-spinner name="crescent" color="primary" />
          <span>{{ t('budget.editor.draft.loading') }}</span>
        </section>

        <template v-else>
          <section class="editor-section" aria-labelledby="basic-info-heading">
            <div class="section-heading">
              <h2 id="basic-info-heading">{{ t('budget.editor.basic.heading') }}</h2>
              <ion-button fill="clear" size="small" :aria-label="t('budget.editor.basic.manageShip')" @click="openShipSettings">
                <ShipWheel :size="18" aria-hidden="true" />
              </ion-button>
            </div>
            <ion-list lines="full" class="editor-list">
              <ion-item>
                <ion-input v-model.trim="store.name" :label="t('budget.editor.basic.name')" label-placement="floating" :maxlength="80" :placeholder="t('budget.editor.basic.namePlaceholder')" />
              </ion-item>
              <ion-item>
                <ion-select :value="store.shipId" :label="t('budget.editor.basic.ship')" label-placement="floating" interface="popover" :placeholder="t('budget.editor.basic.shipPlaceholder')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectShip">
                  <ion-select-option value="">{{ t('budget.editor.basic.shipNone') }}</ion-select-option>
                  <ion-select-option v-for="ship in store.vessels" :key="ship.id" :value="ship.id">{{ ship.shipName }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label>{{ t('budget.editor.basic.startAt') }}</ion-label>
                <ion-datetime-button datetime="budget-start-at" />
              </ion-item>
              <ion-item>
                <ion-textarea v-model="store.deployDesc" :label="t('budget.editor.basic.deployDesc')" label-placement="floating" :auto-grow="true" :maxlength="300" :placeholder="t('budget.editor.basic.deployDescPlaceholder')" />
              </ion-item>
            </ion-list>
          </section>

          <section class="editor-section" aria-labelledby="fuel-speed-heading">
            <div class="section-heading">
              <h2 id="fuel-speed-heading">{{ t('budget.editor.fuel.heading') }}</h2>
              <div class="section-heading-actions">
                <ion-item lines="full" class="compact-select-item"><ion-select class="compact-select" :value="store.document.fuelTemplateId || ''" :label="t('budget.editor.fuel.template')" label-placement="floating" interface="popover" :placeholder="t('budget.editor.fuel.templatePlaceholder')" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="selectFuelTemplate">
                  <ion-select-option value="">{{ t('budget.editor.fuel.templateNone') }}</ion-select-option>
                  <ion-select-option v-for="template in store.fuelTemplates" :key="template.id" :value="String(template.id)">{{ template.name }}</ion-select-option>
                </ion-select></ion-item>
                <ion-button fill="clear" size="small" :aria-label="t('budget.editor.fuel.manageTemplate')" @click="openTemplateManager">
                  <Settings2 :size="18" aria-hidden="true" />
                </ion-button>
              </div>
            </div>
            <h3>{{ t('budget.editor.fuel.dailyHeading') }}</h3>
            <div class="field-grid two-column">
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.seaLadenFuel)" :label="t('budget.editor.fuel.seaLadenFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaLadenFuel', $event)" /><span class="field-unit">{{ t('common.unit.tonneShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.seaBallastFuel)" :label="t('budget.editor.fuel.seaBallastFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaBallastFuel', $event)" /><span class="field-unit">{{ t('common.unit.tonneShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.seaAuxFuel)" :label="t('budget.editor.fuel.seaAuxFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('seaAuxFuel', $event)" /><span class="field-unit">{{ t('common.unit.tonneShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.portIdleFuel)" :label="t('budget.editor.fuel.portIdleFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portIdleFuel', $event)" /><span class="field-unit">{{ t('common.unit.tonneShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.fuel.portWorkingFuel)" :label="t('budget.editor.fuel.portWorkingFuel')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateFuel('portWorkingFuel', $event)" /><span class="field-unit">{{ t('common.unit.tonneShort') }}</span></ion-item>
              <div class="field-tip">{{ t('budget.editor.fuel.ecaNote') }}</div>
            </div>
            <h3>{{ t('budget.editor.fuel.speedHeading') }}</h3>
            <div class="field-grid two-column speed-grid">
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ballastFullSpeed)" :label="t('budget.editor.fuel.ballastFullSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastFullSpeed', $event)" /><span class="field-unit">{{ t('common.unit.knotShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ballastEcoSpeed)" :label="t('budget.editor.fuel.ballastEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ballastEcoSpeed', $event)" /><span class="field-unit">{{ t('common.unit.knotShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ladenFullSpeed)" :label="t('budget.editor.fuel.ladenFullSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenFullSpeed', $event)" /><span class="field-unit">{{ t('common.unit.knotShort') }}</span></ion-item>
              <ion-item lines="full"><ion-input :value="numberText(store.document.speeds.ladenEcoSpeed)" :label="t('budget.editor.fuel.ladenEcoSpeed')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateSpeed('ladenEcoSpeed', $event)" /><span class="field-unit">{{ t('common.unit.knotShort') }}</span></ion-item>
            </div>
            <div class="template-save-row">
              <ion-item lines="full" class="template-name-item"><ion-input v-model.trim="newTemplateName" :label="t('budget.editor.fuel.templateName')" label-placement="floating" :placeholder="t('budget.editor.fuel.templateNamePlaceholder')" /></ion-item>
              <ion-button fill="outline" :disabled="!newTemplateName.trim()" @click="saveCurrentAsTemplate">{{ t('budget.editor.fuel.setAsTemplate') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="port-sequence-heading">
            <div class="section-heading">
              <h2 id="port-sequence-heading">{{ t('budget.editor.ports.heading') }}</h2>
              <ion-button fill="clear" size="small" :disabled="store.hasCalculatedRoute" @click="openPortPicker">
                <Plus :size="18" aria-hidden="true" /> {{ t('budget.editor.ports.add') }}
              </ion-button>
            </div>

            <div v-if="!store.document.ports.length" class="section-empty">
              <MapPin :size="28" aria-hidden="true" />
              <p>{{ t('budget.editor.ports.emptyHint') }}</p>
              <ion-button @click="openPortPicker"><Plus :size="18" aria-hidden="true" /> {{ t('budget.editor.ports.add') }}</ion-button>
            </div>

            <article v-for="(port, index) in store.document.ports" :key="port.id" class="port-block" :class="{ 'routing-port': isRoutingPort(port) }">
              <div class="port-heading">
                <div class="port-title">
                  <strong>{{ index + 1 }}. {{ portName(port) }}</strong>
                  <span v-if="port.port.fullName && port.port.fullName !== port.port.portName">{{ port.port.fullName }}</span>
                  <span v-else>{{ taskLabel(port.taskType) }}<template v-if="!isRoutingPort(port) && index < store.document.ports.length - 1"> · {{ port.isLaden ? t('budget.editor.ports.laden') : t('budget.editor.ports.ballast') }} · {{ port.speedMode === 'eco' ? t('budget.editor.ports.eco') : t('budget.editor.ports.full') }}</template></span>
                </div>
                <div class="port-actions">
                  <ion-button fill="clear" size="small" :aria-label="t('budget.editor.ports.moveUp')" :disabled="store.hasCalculatedRoute || index === 0" @click="store.movePort(index, 'up')"><ChevronUp :size="17" /></ion-button>
                  <ion-button fill="clear" size="small" :aria-label="t('budget.editor.ports.moveDown')" :disabled="store.hasCalculatedRoute || index === store.document.ports.length - 1" @click="store.movePort(index, 'down')"><ChevronDown :size="17" /></ion-button>
                  <ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.editor.ports.remove')" :disabled="store.hasCalculatedRoute" @click="confirmRemovePort(index)"><Trash2 :size="17" /></ion-button>
                </div>
              </div>

              <div v-if="!isRoutingPort(port)" class="field-grid port-mode-grid">
                <ion-item lines="full"><ion-select :value="port.taskType" :label="t('budget.editor.ports.task')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortTask(index, $event)"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="index < store.document.ports.length - 1" lines="full"><ion-select :value="port.isLaden ? 'laden' : 'ballast'" :label="t('budget.editor.ports.nextLeg')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortLaden(index, $event)"><ion-select-option value="laden">{{ t('budget.editor.ports.laden') }}</ion-select-option><ion-select-option value="ballast">{{ t('budget.editor.ports.ballast') }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="index < store.document.ports.length - 1" lines="full"><ion-select :value="port.speedMode" :label="t('budget.editor.ports.speedMode')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortSpeedMode(index, $event)"><ion-select-option value="full">{{ t('budget.editor.ports.full') }}</ion-select-option><ion-select-option value="eco">{{ t('budget.editor.ports.eco') }}</ion-select-option></ion-select></ion-item>
              </div>

              <div v-if="store.hasCalculatedRoute && index > 0" class="route-leg-summary">
                <div><span>{{ t('budget.editor.ports.distanceNm') }}</span><strong>{{ numberText(port.distanceNm) }}</strong></div>
                <div><span>{{ t('budget.editor.ports.seaDays') }}</span><strong>{{ t('budget.editor.ports.seaDaysValue', { value: numberText(port.seaDays) }) }}</strong></div>
                <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaDistance') }}</span><strong>{{ numberText(port.ecaDistanceNm) }}</strong></div>
                <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaSeaDays') }}</span><strong>{{ t('budget.editor.ports.seaDaysValue', { value: numberText(port.ecaSeaDays) }) }}</strong></div>
              </div>

              <div v-if="store.hasCalculatedRoute && !isRoutingPort(port)" class="fuel-leg-summary">
                <span>{{ index === 0 ? t('budget.editor.ports.portFuel') : t('budget.editor.ports.legFuel') }}</span>
                <div v-if="index === 0" class="fuel-leg-values"><span>{{ t('budget.editor.ports.lsdoIdle', { value: amount(port.idleDays * store.document.fuel.portIdleFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoWork', { value: amount(port.workDays * store.document.fuel.portWorkingFuel) }) }}</span></div>
                <div v-else class="fuel-leg-values"><span>{{ t('budget.editor.ports.northAmericaMainFuel', { name: mainFuelForLeg(index), value: amount(fuelLeg(port.id)?.nonEcaMainFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoEca', { value: amount(fuelLeg(port.id)?.ecaMainFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoAux', { value: amount(fuelLeg(port.id)?.auxiliaryFuel) }) }}</span><span>{{ t('budget.editor.ports.lsdoPort', { value: amount(fuelLeg(port.id)?.portFuel) }) }}</span></div>
              </div>

              <div v-if="!isRoutingPort(port)" class="field-grid two-column port-operation-grid">
                <ion-item lines="full"><ion-input :value="numberText(port.idleDays)" :label="t('budget.editor.ports.idleDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'idleDays', $event)" /></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(port.workDays)" :label="t('budget.editor.ports.workDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'workDays', $event)" /></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(port.portCharge)" :label="t('budget.editor.ports.portCharge')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'portCharge', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item>
                <div class="port-time"><span>ETA</span><strong>{{ formatDateTime(port.eta, '--') }}</strong><span>ETD</span><strong>{{ formatDateTime(port.etd, '--') }}</strong></div>
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
                  <ion-item lines="full"><ion-select :value="port.weatherMarginMode" :label="t('budget.editor.ports.weatherMode')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateWeatherMode(index, $event)"><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option></ion-select></ion-item>
                  <ion-item lines="full"><ion-input :value="numberText(port.weatherMarginValue)" :label="t('budget.editor.ports.weatherValue')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'weatherMarginValue', $event)" /></ion-item><span class="field-unit">{{ port.weatherMarginMode === 'percent' ? t('common.unit.percent') : t('common.unit.day') }}</span>
                </div>
                <small v-if="store.hasCalculatedRoute && port.weatherMarginMode !== 'none'">{{ t('budget.editor.ports.weatherAdded', { value: numberText(port.weatherMarginDays) }) }}</small>
              </div>
            </article>

            <section v-if="store.hasCalculatedRoute" class="overall-margin">
              <h3>{{ t('budget.editor.ports.overallHeading') }}</h3>
              <div class="field-grid two-column">
                <ion-item lines="full"><ion-select :value="store.document.margins.portIdleMode" :label="t('budget.editor.ports.idleMargin')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portIdleMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(store.document.margins.portIdleValue)" :label="store.document.margins.portIdleMode === 'percent' ? t('budget.editor.ports.idleMarginPercent') : t('budget.editor.ports.idleMarginDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portIdleValue', $event)" /></ion-item>
                <ion-item lines="full"><ion-select :value="store.document.margins.portWorkingMode" :label="t('budget.editor.ports.workingMargin')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portWorkingMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                <ion-item lines="full"><ion-input :value="numberText(store.document.margins.portWorkingValue)" :label="store.document.margins.portWorkingMode === 'percent' ? t('budget.editor.ports.workingMarginPercent') : t('budget.editor.ports.workingMarginDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateMarginValue('portWorkingValue', $event)" /></ion-item>
              </div>
              <small>{{ t('budget.editor.ports.marginSummary', { idle: numberText(store.document.margins.portIdleDays), working: numberText(store.document.margins.portWorkingDays) }) }}</small>
            </section>

            <section v-if="store.hasCalculatedRoute" class="route-summary">
              <div><span>{{ t('budget.editor.ports.totalDistance') }}</span><strong>{{ amount(store.document.results.totalDistanceNm) }}</strong></div>
              <div><span>{{ t('budget.editor.ports.totalEcaDistance') }}</span><strong>{{ amount(store.document.results.totalEcaDistanceNm) }}</strong></div>
              <div><span>{{ t('budget.editor.ports.totalSeaDays') }}</span><strong>{{ amount(store.document.results.totalSeaDays) }}</strong></div>
              <div><span>{{ t('budget.editor.ports.totalPortDays') }}</span><strong>{{ amount(store.document.results.totalIdleDays + store.document.results.totalWorkDays) }}</strong></div>
              <div><span>{{ t('budget.editor.ports.totalVoyageDays') }}</span><strong>{{ amount(store.document.results.totalVoyageDays) }}</strong></div>
              <div><span>{{ t('budget.editor.ports.totalFuel') }}</span><strong>{{ amount(store.document.results.totalFuel) }} t</strong></div>
            </section>

            <div class="section-actions">
              <ion-button v-if="!store.hasCalculatedRoute" fill="outline" @click="openPortPicker"><Plus :size="17" /> {{ t('budget.editor.actions.addPort') }}</ion-button>
              <ion-button v-if="store.document.ports.length > 1" :disabled="!store.hasCalculatedRoute && !store.canCalculateRoute" @click="toggleRoute">{{ store.hasCalculatedRoute ? t('budget.editor.actions.cancelRoute') : store.calculatingRoute ? t('budget.editor.actions.calculating') : t('budget.editor.actions.calculateRoute') }}</ion-button>
              <ion-button v-if="store.hasCalculatedRoute" fill="outline" @click="openBudgetMap"><Map :size="17" /> {{ t('budget.editor.actions.viewMap') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="cargo-heading">
            <div class="section-heading">
              <h2 id="cargo-heading">{{ t('budget.editor.cargo.heading') }}</h2>
              <ion-button fill="clear" size="small" :disabled="cargoPorts.length < 2" @click="openNewCargo"><Plus :size="18" /> {{ t('budget.editor.cargo.add') }}</ion-button>
            </div>
            <p v-if="cargoPorts.length < 2" class="section-note">{{ t('budget.editor.cargo.portOrderNote') }}</p>
            <p v-else-if="!store.document.cargos.length" class="section-note">{{ t('budget.editor.cargo.empty') }}</p>
            <article v-for="(cargo, index) in store.document.cargos" :key="cargo.id" class="cargo-row">
              <div class="cargo-heading"><div><strong>{{ cargo.name || t('budget.editor.cargo.unnamed') }}</strong><span>{{ cargoPortName(cargo.loadPortId) }} → {{ cargoPortName(cargo.dischargePortId) }}</span></div><div><ion-button fill="clear" size="small" :aria-label="t('budget.editor.cargo.edit')" @click="openCargo(index)"><Pencil :size="16" /></ion-button><ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.editor.cargo.remove')" @click="confirmRemoveCargo(index)"><Trash2 :size="16" /></ion-button></div></div>
              <div class="cargo-values"><span>{{ t('budget.editor.cargo.quantityShort', { value: amount(cargo.quantity) }) }}</span><span>{{ t('budget.editor.cargo.freightShort', { value: amount(cargo.freight) }) }}</span><span>{{ t('budget.editor.cargo.incomeShort', { value: amount(cargo.income) }) }}</span><span>{{ t('budget.editor.cargo.addCommShort', { value: amount(cargo.addCommRate) }) }}</span><span>{{ t('budget.editor.cargo.brokerageShort', { value: amount(cargo.brokerageRate) }) }}</span><span>{{ t('budget.editor.cargo.taxShort', { value: amount(cargo.frtTaxRate) }) }}</span><span>{{ t('budget.editor.cargo.demurrageShort', { value: amount(cargo.demurrage) }) }}</span><span>{{ t('budget.editor.cargo.dispatchShort', { value: amount(cargo.dispatch) }) }}</span></div>
            </article>
            <div v-if="store.document.cargos.length > 1" class="cargo-subtotal"><strong>{{ t('budget.editor.cargo.subtotal') }}</strong><span>{{ t('budget.editor.cargo.incomeShort', { value: amount(cargoTotals.income) }) }}</span><span>{{ t('budget.editor.cargo.addCommShort', { value: amount(cargoTotals.addComm) }) }}</span><span>{{ t('budget.editor.cargo.brokerageShort', { value: amount(cargoTotals.brokerage) }) }}</span><span>{{ t('budget.editor.cargo.taxShort', { value: amount(cargoTotals.tax) }) }}</span><span>{{ t('budget.editor.cargo.demurrageShort', { value: amount(cargoTotals.demurrage) }) }}</span><span>{{ t('budget.editor.cargo.dispatchShort', { value: amount(cargoTotals.dispatch) }) }}</span></div>
          </section>

          <section class="editor-section" aria-labelledby="prices-heading">
            <div class="section-heading"><h2 id="prices-heading">{{ t('budget.editor.prices.heading') }}</h2></div>
            <div class="price-heading"><h3>{{ t('budget.editor.prices.unitPrice') }}</h3><ion-segment :value="mainFuelType" @ion-change="setMainFuelType"><ion-segment-button value="LSFO"><ion-label>LSFO</ion-label></ion-segment-button><ion-segment-button value="HSFO"><ion-label>HSFO</ion-label></ion-segment-button></ion-segment></div>
            <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(mainFuelPrice)" :label="mainFuelType" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice(mainFuelPriceField, $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.prices.mgoPrice)" label="LSDO/MGO" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePrice('mgoPrice', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></div>
            <small class="section-note">{{ t('budget.editor.prices.defaultNote') }}</small>
            <div v-if="store.hasCalculatedRoute" class="fuel-cost-summary"><h3>{{ t('budget.editor.prices.fuelCostHeading') }}</h3><div><span>{{ t('budget.editor.prices.mainFuelCost', { name: mainFuelType }) }}</span><strong>{{ amount(store.document.results.nonEcaFuelCost) }}</strong><small>{{ t('budget.editor.prices.mainFuelFormula', { name: mainFuelType, fuel: amount(store.document.results.seaMainFuel), price: amount(mainFuelPrice) }) }}</small></div><div><span>{{ t('budget.editor.prices.mgoFuelCost') }}</span><strong>{{ amount(mgoFuelCost) }}</strong><small>{{ t('budget.editor.prices.mgoFuelNote', { price: amount(store.document.prices.mgoPrice) }) }}</small></div><p>{{ t('budget.editor.prices.fuelCostTotal', { value: amount(store.document.results.totalFuelCost) }) }}</p></div>
          </section>

          <section class="editor-section" aria-labelledby="cost-heading">
            <div class="section-heading"><h2 id="cost-heading">{{ t('budget.editor.costs.heading') }}</h2><span>{{ t('budget.editor.costs.autoSummary') }}</span></div>
            <div class="cost-readonly"><span>{{ t('budget.editor.costs.fuelCost') }}</span><strong>{{ amount(store.document.results.totalFuelCost) }}</strong><span>{{ t('budget.editor.costs.portCharge') }}</span><strong>{{ amount(store.document.results.totalPortCharge) }}</strong></div>
            <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.ilohc)" :label="t('budget.editor.costs.holdCleaning')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('ilohc', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.cev)" :label="t('budget.editor.costs.cev')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('cev', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.inspection)" :label="t('budget.editor.costs.inspection')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('inspection', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.opOther)" :label="t('budget.editor.costs.opOther')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('opOther', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hirePerDay)" :label="t('budget.editor.costs.hirePerDay')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hirePerDay', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hireCommPercent)" :label="t('budget.editor.costs.hireCommPercent')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hireCommPercent', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.fixedCost)" :label="t('budget.editor.costs.fixedCost')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('fixedCost', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></div>
            <div class="cost-formula"><span>{{ t('budget.editor.costs.hireAmount', { value: amount(hireAmount) }) }}</span><span>{{ t('budget.editor.costs.hireCost', { value: amount(hireCost) }) }}</span></div>
          </section>

          <section class="editor-section result-section" aria-labelledby="result-heading">
            <div class="section-heading"><h2 id="result-heading">{{ t('budget.editor.results.heading') }}</h2><ion-button fill="clear" size="small" :aria-label="t('budget.editor.results.formula')" @click="formulaOpen = true"><Info :size="18" /></ion-button></div>
            <div class="result-grid"><div v-for="item in resultItems" :key="item.label"><span>{{ item.label }}</span><strong :class="item.value < 0 ? 'profit-negative' : 'profit-positive'">{{ amount(item.value) }}</strong></div></div>
          </section>
        </template>
      </main>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="save-actions">
          <ion-button v-if="store.currentId" fill="outline" :disabled="store.saving" @click="confirmSaveAs">{{ t('budget.editor.actions.saveAs') }}</ion-button>
          <ion-button :disabled="store.saving" @click="saveBudget">{{ store.saving ? t('budget.editor.actions.saving') : t('budget.editor.actions.save') }}</ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>

    <ion-modal :keep-contents-mounted="true">
      <ion-datetime id="budget-start-at" presentation="date-time" :locale="locale" :value="store.document.startAt" @ion-change="updateStartAt" />
    </ion-modal>

    <ion-modal :is-open="portPickerOpen" @did-dismiss="closePortPicker">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.editor.ports.add') }}</ion-title><ion-buttons slot="end"><ion-button @click="closePortPicker">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content"><ion-list lines="full"><ion-item><ion-select :value="newPortTask" :label="t('budget.editor.ports.taskType')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="setNewPortTask"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item></ion-list><ion-searchbar :model-value="portKeyword" :debounce="280" :placeholder="t('budget.editor.ports.searchPort')" @ion-input="searchPort" /><ion-list inset><ion-item v-if="store.searchingPorts"><ion-label color="medium">{{ t('common.searching') }}</ion-label></ion-item><ion-item v-else-if="portKeyword && !store.portSuggestions.length"><ion-label color="medium">{{ t('budget.editor.ports.searchEmpty') }}</ion-label></ion-item><ion-item v-else-if="!portKeyword"><ion-label color="medium">{{ t('budget.editor.ports.searchHint') }}</ion-label></ion-item><ion-item v-for="port in store.portSuggestions" :key="String(port.portId)" button :detail="false" @click="addSelectedPort(port)"><ion-label><strong>{{ formatPortSuggestion(port) }}</strong></ion-label></ion-item></ion-list></ion-content>
    </ion-modal>

    <ion-modal :is-open="cargoEditorOpen" @did-dismiss="cancelCargoEditor">
      <ion-header><ion-toolbar><ion-title>{{ newCargoPending ? t('budget.editor.cargo.modalAddTitle') : t('budget.editor.cargo.modalEditTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="cancelCargoEditor">{{ t('common.cancel') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content"><ion-list v-if="activeCargo" lines="full"><ion-item><ion-input :value="activeCargo.name" :label="t('budget.editor.cargo.name')" label-placement="floating" :maxlength="100" :placeholder="t('budget.editor.cargo.namePlaceholder')" @ion-input="updateCargoText('name', $event)" /></ion-item><ion-item><ion-select :value="activeCargo.loadPortId" :label="t('budget.editor.cargo.loadPort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateCargoText('loadPortId', $event)"><ion-select-option v-for="port in cargoPorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item><ion-item><ion-select :value="activeCargo.dischargePortId" :label="t('budget.editor.cargo.dischargePort')" label-placement="floating" interface="popover" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateCargoText('dischargePortId', $event)"><ion-select-option v-for="port in cargoPorts" :key="port.id" :value="port.id">{{ port.port.portName }}</ion-select-option></ion-select></ion-item><ion-item><ion-input :value="numberText(activeCargo.quantity)" :label="t('budget.editor.cargo.quantity')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('quantity', $event)" /></ion-item><ion-item><ion-input :value="numberText(activeCargo.freight)" :label="t('budget.editor.cargo.freight')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('freight', $event)" /></ion-item><ion-item><ion-label>{{ t('budget.editor.cargo.income') }}</ion-label><ion-note slot="end">{{ amount(activeCargo.income) }}</ion-note></ion-item><ion-item><ion-input :value="numberText(activeCargo.addCommRate)" :label="t('budget.editor.cargo.addCommRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('addCommRate', $event)" /></ion-item><ion-item><ion-input :value="numberText(activeCargo.brokerageRate)" :label="t('budget.editor.cargo.brokerageRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('brokerageRate', $event)" /></ion-item><ion-item><ion-input :value="numberText(activeCargo.frtTaxRate)" :label="t('budget.editor.cargo.taxRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('frtTaxRate', $event)" /></ion-item><ion-item><ion-input :value="numberText(activeCargo.demurrage)" :label="t('budget.editor.cargo.demurrage')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('demurrage', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item><ion-item><ion-input :value="numberText(activeCargo.dispatch)" :label="t('budget.editor.cargo.dispatch')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('dispatch', $event)" /><span class="field-unit">{{ t('common.unit.usd') }}</span></ion-item></ion-list><div class="modal-submit"><ion-button expand="block" @click="finishCargoEditor">{{ t('budget.editor.actions.confirm') }}</ion-button></div></ion-content>
    </ion-modal>

    <ion-modal :is-open="templateManagerOpen" @did-dismiss="closeTemplateManager">
      <ion-header><ion-toolbar><ion-title>{{ templateDraft ? t('budget.editor.templates.editTitle') : t('budget.editor.templates.managerTitle') }}</ion-title><ion-buttons slot="end"><ion-button v-if="!templateDraft" :aria-label="t('budget.editor.templates.add')" @click="openNewTemplate"><Plus :size="20" /></ion-button><ion-button v-else @click="templateDraft = null">{{ t('budget.editor.actions.back') }}</ion-button><ion-button @click="closeTemplateManager">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content"><ion-list v-if="!templateDraft" inset><ion-item v-if="!store.fuelTemplates.length"><ion-label color="medium">{{ t('budget.editor.templates.empty') }}</ion-label></ion-item><ion-item v-for="template in store.fuelTemplates" :key="template.id"><ion-label><strong>{{ template.name }}</strong><p>{{ t('budget.editor.templates.summary', { laden: template.seaLadenFuel, ballast: template.seaBallastFuel, aux: template.seaAuxFuel }) }}</p></ion-label><ion-buttons slot="end"><ion-button @click="applyTemplate(template)">{{ t('budget.editor.templates.apply') }}</ion-button><ion-button :aria-label="t('budget.editor.templates.edit')" @click="editTemplate(template)"><Pencil :size="17" /></ion-button><ion-button color="danger" :aria-label="t('budget.editor.templates.remove')" @click="confirmRemoveTemplate(template.id)"><Trash2 :size="17" /></ion-button></ion-buttons></ion-item></ion-list><ion-list v-else lines="full"><ion-item><ion-input :value="templateDraft.name" :label="t('budget.editor.templates.name')" label-placement="floating" :maxlength="80" @ion-input="updateTemplateName" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.seaLadenFuel)" :label="t('budget.editor.templates.seaLadenFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaLadenFuel', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.seaBallastFuel)" :label="t('budget.editor.templates.seaBallastFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaBallastFuel', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.seaAuxFuel)" :label="t('budget.editor.templates.seaAuxFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('seaAuxFuel', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.portIdleFuel)" :label="t('budget.editor.templates.portIdleFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('portIdleFuel', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.portWorkingFuel)" :label="t('budget.editor.templates.portWorkingFuel')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('portWorkingFuel', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.ballastFullSpeed)" :label="t('budget.editor.templates.ballastFullSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ballastFullSpeed', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.ballastEcoSpeed)" :label="t('budget.editor.templates.ballastEcoSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ballastEcoSpeed', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.ladenFullSpeed)" :label="t('budget.editor.templates.ladenFullSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ladenFullSpeed', $event)" /></ion-item><ion-item><ion-input :value="numberText(templateDraft.ladenEcoSpeed)" :label="t('budget.editor.templates.ladenEcoSpeed')" label-placement="floating" type="number" @ion-input="updateTemplateNumber('ladenEcoSpeed', $event)" /></ion-item></ion-list><div v-if="templateDraft" class="modal-submit"><ion-button expand="block" @click="saveTemplateDraft">{{ t('budget.editor.templates.save') }}</ion-button></div></ion-content>
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
  CopyPlus,
  FileDown,
  Info,
  Map,
  MapPin,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShipWheel,
  Trash2,
} from 'lucide-vue-next'
import {
  alertController,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
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
const initialized = ref(false)
const loadedId = ref('')
let skipAutomaticDraft = false
let allowEditorExit = false
let childNavigation = false
let confirmingExit = false

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
  if (allowEditorExit || skipAutomaticDraft || store.saving || !store.hasUnsavedEditorState) {
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

function taskLabel(taskType: BudgetPortTask) {
  return taskOptions.value.find((item) => item.value === taskType)?.label || taskType
}

function isRoutingPort(port: BudgetPort) {
  return port.taskType === 'routing' || Boolean(port.port.isWayPoint)
}

function selectShip(event: any) {
  const id = inputValue(event)
  store.shipId = id
  store.shipName = store.vessels.find((ship) => ship.id === id)?.shipName || ''
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

async function saveDraft() {
  try {
    const draft = await store.saveLocalDraft()
    await showToast(draft ? t('budget.editor.draft.saved') : t('budget.editor.draft.empty'), draft ? 'success' : 'warning')
  } catch (cause) {
    await showToast(messageOf(cause, t('budget.editor.draft.saveFailed')), 'danger')
  }
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
.section-empty p { margin: 0; }.editor-section { margin: 0 0 12px; padding: 14px; border: 1px solid #dce6ef; border-radius: 8px; background: #fff; }.section-heading { display: flex; align-items: center; justify-content: space-between; min-height: 34px; gap: 8px; }.section-heading h2 { margin: 0; color: #173447; font-size: 16px; }.section-heading > span { color: #718293; font-size: 12px; }.section-heading ion-button { margin: -8px -8px -8px 0; --color: #005f88; }.section-heading-actions { display: flex; min-width: 0; align-items: center; }.compact-select { max-width: 132px; color: #005f88; font-size: 13px; }.editor-list { margin: 8px 0 0; }.editor-list ion-item, .field-grid ion-item { --padding-start: 0; --inner-padding-end: 0; --background: transparent; }.editor-list ion-item::part(native), .field-grid ion-item::part(native) { padding-inline-start: 0; padding-inline-end: 0; }.editor-section h3 { margin: 17px 0 8px; color: #344d60; font-size: 13px; }.field-grid { display: grid; gap: 8px; }.two-column { grid-template-columns: repeat(2, minmax(0, 1fr)); }.field-grid ion-item { min-width: 0; --min-height: 58px; }.field-grid ion-input, .field-grid ion-select { min-width: 0; --padding-top: 8px; --padding-bottom: 8px; --padding-start: 9px; --padding-end: 9px; font-size: 13px; }.field-tip, .section-note { align-self: center; color: #748697; font-size: 12px; line-height: 1.45; }.template-save-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }.template-save-row ion-input { min-width: 0; --padding-start: 10px; --padding-end: 10px; }.template-save-row ion-button { flex: none; margin: 0; }.port-block, .cargo-row { padding: 13px 0; border-top: 1px solid #e7edf2; }.port-block:first-of-type { margin-top: 8px; }.port-heading, .cargo-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }.port-title, .cargo-heading > div:first-child { min-width: 0; }.port-title strong, .port-title span, .cargo-heading strong, .cargo-heading span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.port-title strong, .cargo-heading strong { color: #273f51; font-size: 14px; }.port-title span, .cargo-heading span { margin-top: 4px; color: #718293; font-size: 12px; }.routing-port .port-title strong { color: #315d7b; font-style: italic; }.port-actions, .cargo-heading > div:last-child { display: flex; flex: none; }.port-actions ion-button, .cargo-heading ion-button { width: 30px; min-width: 30px; height: 32px; margin: -6px 0 0; --padding-start: 0; --padding-end: 0; }.port-mode-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }.port-mode-grid ion-select { font-size: 12px; }.route-leg-summary, .route-summary, .result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; margin-top: 10px; border: 1px solid #dce7ee; border-radius: 6px; background: #dce7ee; }.route-leg-summary > div, .route-summary > div, .result-grid > div { min-width: 0; padding: 9px; background: #f8fbfd; }.route-leg-summary span, .route-leg-summary strong, .route-summary span, .route-summary strong, .result-grid span, .result-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.route-leg-summary span, .route-summary span, .result-grid span { color: #748697; font-size: 11px; }.route-leg-summary strong, .route-summary strong, .result-grid strong { margin-top: 4px; color: #28475c; font-size: 13px; }.fuel-leg-summary { margin-top: 10px; padding: 10px; border-radius: 6px; background: #edf7f3; color: #4c6675; font-size: 12px; }.fuel-leg-values, .cargo-values, .cargo-subtotal { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; margin-top: 7px; }.fuel-leg-values span, .cargo-values span, .cargo-subtotal span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.port-operation-grid { margin-top: 10px; }.port-time { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 3px 7px; padding: 8px; color: #748697; font-size: 11px; }.port-time strong { overflow: hidden; color: #40586a; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.weather-margin { margin-top: 10px; }.weather-margin > span { display: block; margin-bottom: 6px; color: #526879; font-size: 12px; }.weather-margin ion-segment { --background: #f2f6f8; }.weather-margin ion-segment-button { min-height: 32px; --color: #617688; --color-checked: #005f88; --indicator-color: #fff; font-size: 11px; }.weather-custom-row { display: grid; grid-template-columns: .8fr 1fr auto; gap: 8px; margin-top: 8px; }.weather-custom-row ion-select, .weather-custom-row ion-input { --padding-start: 9px; --padding-end: 9px; }.weather-margin small { display: block; margin-top: 6px; color: #607789; font-size: 11px; }.overall-margin { margin-top: 12px; padding: 10px; border-radius: 6px; background: #f8fbfd; }.overall-margin h3 { margin: 0 0 8px; }.overall-margin small { display: block; margin-top: 8px; color: #6d8192; font-size: 11px; }.section-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 14px; }.section-actions ion-button { margin: 0; }.cargo-row { padding-inline: 2px; }.cargo-values { color: #516879; font-size: 12px; }.cargo-subtotal { margin-top: 12px; padding: 10px; border-radius: 6px; background: #f2f7fc; color: #486071; font-size: 12px; }.cargo-subtotal strong { grid-column: 1 / -1; color: #314d61; }.price-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.price-heading h3 { margin-top: 14px; }.price-heading ion-segment { width: 142px; --background: #eff5f8; }.price-heading ion-segment-button { min-height: 32px; font-size: 12px; }.fuel-cost-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }.fuel-cost-summary h3, .fuel-cost-summary p { grid-column: 1 / -1; }.fuel-cost-summary h3 { margin: 0; }.fuel-cost-summary > div { min-width: 0; padding: 10px; border-radius: 6px; background: #f7fafc; }.fuel-cost-summary span, .fuel-cost-summary strong, .fuel-cost-summary small { display: block; }.fuel-cost-summary span, .fuel-cost-summary small { color: #6e8192; font-size: 11px; line-height: 1.4; }.fuel-cost-summary strong { margin: 4px 0; color: #26495f; font-size: 14px; }.fuel-cost-summary p { margin: 0; padding: 9px 0 0; color: #005f88; font-size: 12px; font-weight: 700; }.cost-readonly { display: grid; grid-template-columns: repeat(2, auto); justify-content: start; gap: 4px 10px; margin: 10px 0; color: #6d8192; font-size: 12px; }.cost-readonly strong { color: #334f62; }.cost-formula { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 10px; color: #587185; font-size: 12px; }.result-section { background: #f8fcff; }.result-grid { margin-top: 10px; }.result-grid strong.profit-positive { color: #087443 !important; }.result-grid strong.profit-negative { color: #b42318 !important; }.save-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 7px 12px calc(7px + env(safe-area-inset-bottom)); }.save-actions ion-button { margin: 0; }.modal-content { --padding-top: 12px; --padding-bottom: calc(20px + env(safe-area-inset-bottom)); --padding-start: 12px; --padding-end: 12px; }.modal-submit { padding: 4px 12px 12px; }.modal-submit ion-button { margin: 0; }@media (min-width: 640px) { .budget-editor { max-width: 760px; margin: 0 auto; }.port-mode-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.route-leg-summary, .route-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }.result-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.compact-select, .field-grid ion-input, .field-grid ion-select, .port-mode-grid ion-select { font-size: 16px; }
.field-unit { flex: none; align-self: center; margin-inline-start: 5px; padding-inline-end: 2px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }

/* 下划线输入：清掉 md solid fill 的灰底与自带的底部边框，只保留 item 的下划线 */
ion-input,
ion-select,
ion-textarea {
  --background: transparent;
  --border-width: 0;
}

/* 这三个字段原先直接裸露在网格/表头里，补上 ion-item 后收紧内边距，保持原布局 */
.compact-select-item { flex: none; width: auto; max-width: 140px; --min-height: 40px; --padding-start: 0; --inner-padding-end: 0; }
.template-name-item { flex: 1 1 auto; min-width: 0; --min-height: 44px; --padding-start: 0; --inner-padding-end: 0; }
.weather-custom-row ion-item { min-width: 0; --min-height: 52px; --padding-start: 0; --inner-padding-end: 0; }
</style>