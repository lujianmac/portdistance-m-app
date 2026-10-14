<template>
  <ion-page ref="editorPage">
    <ion-header class="editor-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <!-- Back control: the chevron stays an ion-button (not ion-back-button) so the click
               handler remains the single owner of the exit flow; the label is the same i18n key. -->
          <ion-button class="editor-back-button" :aria-label="t('budget.editor.header.back')" @click="requestEditorExit">
            <ChevronLeft :size="24" aria-hidden="true" />
            <span class="editor-back-text">{{ t('budget.editor.header.back') }}</span>
          </ion-button>
        </ion-buttons>
        <!-- No title while editing an existing budget (product decision); "New" only when creating. -->
        <ion-title v-if="store.editorMode !== 'edit'">{{ t('budget.editor.header.newTitle') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="budget-editor-content">
      <main class="budget-editor" :aria-label="t('budget.editor.header.editorLabel')">
        <section v-if="initializing" class="editor-state">
          <ion-spinner name="crescent" color="primary" />
          <span>{{ t('budget.editor.draft.loading') }}</span>
        </section>

        <template v-else>
          <section class="editor-section basic-section" :aria-label="t('budget.editor.basic.heading')">
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

          <section class="editor-section fuel-section" aria-labelledby="fuel-speed-heading">
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
            <!-- Saving / editing a fuel template has exactly one entry point per state:
                 - no template selected -> "template name + set as template", and the button needs
                   all four daily-fuel fields except the sea-auxiliary one to be filled (> 0);
                 - template selected -> the whole row is hidden (no name input, no button) and is
                   replaced by the "modified + save changes to template" row only while the current
                   fuel/speed values differ from the selected template.
                 The row's own visibility is gated on the fuel values only (NOT on canSetAsTemplate),
                 because the template name is typed inside this very row - gating on the name would
                 deadlock: no name -> no row -> no way to type the name. -->
            <div v-if="showsTemplateSaveRow" class="template-save-row">
              <ion-item lines="full" class="template-name-item"><ion-input v-model.trim="newTemplateName" :label="t('budget.editor.fuel.templateName')" label-placement="floating" :placeholder="t('budget.editor.fuel.templateNamePlaceholder')" /></ion-item>
              <ion-button fill="outline" :disabled="!canSetAsTemplate" @click="saveCurrentAsTemplate">{{ t('budget.editor.fuel.setAsTemplate') }}</ion-button>
            </div>
            <div v-else-if="templateDirty" class="template-dirty-row">
              <span class="template-dirty-hint">{{ t('budget.editor.fuel.templateDirty') }}</span>
              <ion-button fill="clear" size="small" class="template-update-button" @click="updateTemplateFromDocument">{{ t('budget.editor.fuel.updateTemplate') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="port-sequence-heading">
            <div class="section-heading">
              <h2 id="port-sequence-heading">{{ t('budget.editor.ports.heading') }}</h2>
              <ion-button v-if="store.document.ports.length > 0" class="heading-add-button port-add-button" fill="clear" size="small" :disabled="store.hasCalculatedRoute" @click="openPortPicker">
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
                  <!-- Port name + 2-letter country code: same two-part treatment as the distance route list. -->
                  <strong>{{ portName(port) }}<small v-if="portCountryCode(port.port)">[{{ portCountryCode(port.port) }}]</small></strong>
                  <span v-if="port.port.fullName && port.port.fullName !== port.port.portName">{{ port.port.fullName }}</span>
                </div>
                <div class="port-actions">
                  <ion-button v-if="store.document.ports.length > 1 && index > 0" fill="clear" size="small" :aria-label="t('budget.editor.ports.moveUp')" :disabled="store.hasCalculatedRoute" @click="store.movePort(index, 'up')"><ChevronUp :size="17" /></ion-button>
                  <ion-button v-if="store.document.ports.length > 1 && index < store.document.ports.length - 1" fill="clear" size="small" :aria-label="t('budget.editor.ports.moveDown')" :disabled="store.hasCalculatedRoute" @click="store.movePort(index, 'down')"><ChevronDown :size="17" /></ion-button>
                  <ion-button fill="clear" size="small" color="danger" :aria-label="t('budget.editor.ports.remove')" :disabled="store.hasCalculatedRoute" @click="confirmRemovePort(index)"><Trash2 :size="17" /></ion-button>
                </div>
              </div>

              <!-- Task / laden-ballast / speed mode share one row without visible labels (aria-label keeps them accessible). -->
              <div v-if="!isRoutingPort(port)" class="field-grid port-mode-grid">
                <ion-item lines="full" class="port-task-item"><ion-select :value="port.taskType" :aria-label="t('budget.editor.ports.task')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortTask(index, $event)"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="showsLegOptions(index)" lines="full"><ion-select :value="port.isLaden ? 'laden' : 'ballast'" :aria-label="t('budget.editor.ports.nextLeg')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortLaden(index, $event)"><ion-select-option value="laden">{{ t('budget.editor.ports.laden') }}</ion-select-option><ion-select-option value="ballast">{{ t('budget.editor.ports.ballast') }}</ion-select-option></ion-select></ion-item>
                <ion-item v-if="showsLegOptions(index)" lines="full"><ion-select :value="port.speedMode" :aria-label="t('budget.editor.ports.speedMode')" label-placement="floating" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updatePortSpeedMode(index, $event)"><ion-select-option value="full">{{ t('budget.editor.ports.full') }}</ion-select-option><ion-select-option value="eco">{{ t('budget.editor.ports.eco') }}</ion-select-option></ion-select></ion-item>
              </div>

              <div v-if="!isRoutingPort(port) || store.hasCalculatedRoute" class="sailing-panel">
                <div v-if="store.hasCalculatedRoute && index > 0" class="route-leg-summary">
                  <div><span>{{ t('budget.editor.ports.distanceNm') }}</span><strong>{{ numberText(port.distanceNm) }}</strong></div>
                  <div><span>{{ t('budget.editor.ports.seaDays') }}</span><strong>{{ numberText(port.seaDays) }}</strong></div>
                  <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaDistance') }}</span><strong>{{ numberText(port.ecaDistanceNm) }}</strong></div>
                  <div v-if="!isRoutingPort(port)"><span>{{ t('budget.editor.ports.ecaSeaDays') }}</span><strong>{{ numberText(port.ecaSeaDays) }}</strong></div>
                </div>

                <div v-if="store.hasCalculatedRoute && !isRoutingPort(port)" class="fuel-leg-summary">
                  <span class="fuel-leg-title">{{ index === 0 ? t('budget.editor.ports.portFuel') : t('budget.editor.ports.legFuel') }}</span>
                  <!-- One label line per fuel, then the tonnage on its own line, matching the summary grids. -->
                  <div v-if="index === 0" class="fuel-leg-values"><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.lsdoIdle') }}</span><strong>{{ amount(port.idleDays * store.document.fuel.portIdleFuel) }} t</strong></div><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.lsdoWork') }}</span><strong>{{ amount(port.workDays * store.document.fuel.portWorkingFuel) }} t</strong></div></div>
                  <div v-else class="fuel-leg-values"><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.northAmericaMainFuel', { name: mainFuelForLeg(index) }) }}</span><strong>{{ amount(fuelLeg(port.id)?.nonEcaMainFuel) }} t</strong></div><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.lsdoEca') }}</span><strong>{{ amount(fuelLeg(port.id)?.ecaMainFuel) }} t</strong></div><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.lsdoAux') }}</span><strong>{{ amount(fuelLeg(port.id)?.auxiliaryFuel) }} t</strong></div><div class="fuel-leg-item"><span>{{ t('budget.editor.ports.lsdoPort') }}</span><strong>{{ amount(fuelLeg(port.id)?.portFuel) }} t</strong></div></div>
                </div>

                <div v-if="!isRoutingPort(port)" class="field-grid port-operation-grid">
                  <ion-item lines="full"><ion-input :value="numberText(port.idleDays)" :label="t('budget.editor.ports.idleDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'idleDays', $event)" /></ion-item>
                  <ion-item lines="full"><ion-input :value="numberText(port.workDays)" :label="t('budget.editor.ports.workDays')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'workDays', $event)" /></ion-item>
                  <ion-item lines="full"><ion-input :value="numberText(port.portCharge)" :label="t('budget.editor.ports.portCharge')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'portCharge', $event)" /></ion-item>
                </div>

                <div v-if="!isRoutingPort(port)" class="schedule-times">
                  <div class="schedule-time-item">
                    <span>{{ t('budget.editor.ports.eta') }}</span>
                    <!-- The first port's arrival time is the voyage start (store.document.startAt), so only it can be edited. -->
                    <div class="schedule-date">
                      <strong>{{ formatDateTime(port.eta, '--') }}</strong>
                      <ion-button v-if="index === 0" fill="clear" size="small" class="schedule-edit-button" :aria-label="t('budget.editor.ports.editEta')" @click="startAtEditorOpen = true"><Pencil :size="16" aria-hidden="true" /></ion-button>
                    </div>
                  </div>
                  <div class="schedule-time-item">
                    <span>{{ t('budget.editor.ports.etd') }}</span>
                    <!-- Departure time is derived from the arrival time plus the port days, so it stays read-only. -->
                    <strong>{{ formatDateTime(port.etd, '--') }}</strong>
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
                  <!-- Custom margin: the value input comes first, the percent/days mode is a switch next to it. -->
                  <div v-if="weatherPreset(port) === 'custom'" class="weather-custom-row">
                    <!-- Percent mode shows the same non-editable "%" unit as the overall-margin rows. -->
                    <ion-item lines="full"><ion-input :value="numberText(port.weatherMarginValue)" :label="t('budget.editor.ports.weatherValue')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updatePortNumber(index, 'weatherMarginValue', $event)" /><span v-if="port.weatherMarginMode === 'percent'" class="field-unit margin-unit">%</span></ion-item>
                    <ion-segment :value="port.weatherMarginMode" @ion-change="updateWeatherMode(index, $event)">
                      <ion-segment-button value="percent"><ion-label>{{ t('budget.editor.ports.weatherPercent') }}</ion-label></ion-segment-button>
                      <ion-segment-button value="days"><ion-label>{{ t('budget.editor.ports.weatherDays') }}</ion-label></ion-segment-button>
                    </ion-segment>
                  </div>
                  <small v-if="store.hasCalculatedRoute && port.weatherMarginMode !== 'none'">{{ t('budget.editor.ports.weatherAdded', { value: numberText(port.weatherMarginDays) }) }}</small>
                </div>
              </div>
            </article>

            <section v-if="store.hasCalculatedRoute" class="overall-margin">
              <h3>{{ t('budget.editor.ports.overallHeading') }}</h3>
              <!-- Overall margins: the idle and the working group share one row, each a title row
                   plus an unlabelled mode select and value input stacked underneath.
                   The value inputs are keyed by their mode so Ionic re-reads the host aria-label
                   (it inherits aria attributes only once, on load) and keeps the unit announced. -->
              <div class="overall-groups">
              <div class="overall-group" role="group" :aria-label="t('budget.editor.ports.idleMargin')">
                <span class="overall-group-title">{{ t('budget.editor.ports.idleMargin') }}</span>
                <div class="field-grid overall-grid">
                  <ion-item lines="full"><ion-select :value="store.document.margins.portIdleMode" :aria-label="t('budget.editor.ports.idleMargin')" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portIdleMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                  <!-- Percent mode shows a plain "%" unit next to the value: a non-editable span,
                       same construction as the commission rows of the cargo sheet. -->
                  <ion-item lines="full"><ion-input :key="`idle-value-${store.document.margins.portIdleMode}`" :value="numberText(store.document.margins.portIdleValue)" :aria-label="store.document.margins.portIdleMode === 'percent' ? t('budget.editor.ports.idleMarginPercent') : t('budget.editor.ports.idleMarginDays')" type="number" inputmode="decimal" @ion-input="updateMarginValue('portIdleValue', $event)" /><span v-if="store.document.margins.portIdleMode === 'percent'" class="field-unit margin-unit">%</span></ion-item>
                </div>
              </div>
              <div class="overall-group" role="group" :aria-label="t('budget.editor.ports.workingMargin')">
                <span class="overall-group-title">{{ t('budget.editor.ports.workingMargin') }}</span>
                <div class="field-grid overall-grid">
                  <ion-item lines="full"><ion-select :value="store.document.margins.portWorkingMode" :aria-label="t('budget.editor.ports.workingMargin')" interface="popover" :interface-options="selectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateMarginMode('portWorkingMode', $event)"><ion-select-option value="days">{{ t('budget.editor.ports.weatherDays') }}</ion-select-option><ion-select-option value="percent">{{ t('budget.editor.ports.weatherPercent') }}</ion-select-option></ion-select></ion-item>
                  <ion-item lines="full"><ion-input :key="`working-value-${store.document.margins.portWorkingMode}`" :value="numberText(store.document.margins.portWorkingValue)" :aria-label="store.document.margins.portWorkingMode === 'percent' ? t('budget.editor.ports.workingMarginPercent') : t('budget.editor.ports.workingMarginDays')" type="number" inputmode="decimal" @ion-input="updateMarginValue('portWorkingValue', $event)" /><span v-if="store.document.margins.portWorkingMode === 'percent'" class="field-unit margin-unit">%</span></ion-item>
                </div>
              </div>
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
              <ion-button v-if="store.document.ports.length > 0 && !store.hasCalculatedRoute" class="port-outline-button" fill="outline" @click="openPortPicker"><Plus :size="17" /> {{ t('budget.editor.actions.addPort') }}</ion-button>
              <ion-button v-if="store.document.ports.length > 1" :disabled="!store.hasCalculatedRoute && !store.canCalculateRoute" @click="toggleRoute">{{ store.hasCalculatedRoute ? t('budget.editor.actions.cancelRoute') : store.calculatingRoute ? t('budget.editor.actions.calculating') : t('budget.editor.actions.calculateRoute') }}</ion-button>
              <ion-button v-if="store.hasCalculatedRoute" fill="outline" @click="openBudgetMap"><Map :size="17" /> {{ t('budget.editor.actions.viewMap') }}</ion-button>
            </div>
          </section>

          <section class="editor-section" aria-labelledby="cargo-heading">
            <div class="section-heading">
              <h2 id="cargo-heading">{{ t('budget.editor.cargo.heading') }}</h2>
              <ion-button class="heading-add-button cargo-add-button" fill="clear" size="small" :disabled="cargoPorts.length < 2" @click="openNewCargo"><Plus :size="20" aria-hidden="true" /><span>{{ t('budget.editor.cargo.add') }}</span></ion-button>
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
            <div v-if="store.hasCalculatedRoute" class="fuel-cost-summary"><h3>{{ t('budget.editor.prices.fuelCostHeading') }}</h3><div><span>{{ t('budget.editor.prices.mainFuelCost', { name: mainFuelType }) }}</span><strong>{{ amount(store.document.results.nonEcaFuelCost) }}</strong><small>{{ t('budget.editor.prices.mainFuelFormula', { name: mainFuelType, fuel: amount(store.document.results.seaMainFuel), price: amount(mainFuelPrice), cost: amount(store.document.results.nonEcaFuelCost) }) }}</small></div><div><span>{{ t('budget.editor.prices.mgoFuelCost') }}</span><strong>{{ amount(mgoFuelCost) }}</strong><small>{{ t('budget.editor.prices.mgoFuelCostFormula', { eca: amount(store.document.results.ecaMainFuel), aux: amount(store.document.results.seaAuxFuel), port: amount(store.document.results.portFuel), price: amount(store.document.prices.mgoPrice), cost: amount(mgoFuelCost) }) }}</small></div><p>{{ t('budget.editor.prices.fuelCostTotalFormula', { name: mainFuelType, main: amount(store.document.results.nonEcaFuelCost), mgo: amount(mgoFuelCost), total: amount(store.document.results.totalFuelCost) }) }}</p></div>
          </section>

          <section class="editor-section" aria-labelledby="cost-heading">
            <div class="section-heading"><h2 id="cost-heading">{{ t('budget.editor.costs.heading') }}</h2><span>{{ t('budget.editor.costs.autoSummary') }}</span></div>
            <div class="cost-readonly"><span>{{ t('budget.editor.costs.fuelCost') }}</span><strong>{{ amount(store.document.results.totalFuelCost) }}</strong><span>{{ t('budget.editor.costs.portCharge') }}</span><strong>{{ amount(store.document.results.totalPortCharge) }}</strong></div>
            <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.ilohc)" :label="t('budget.editor.costs.holdCleaning')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('ilohc', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.cev)" :label="t('budget.editor.costs.cev')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('cev', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.inspection)" :label="t('budget.editor.costs.inspection')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('inspection', $event)" /></ion-item><ion-item lines="full"><ion-input :value="numberText(store.document.costs.opOther)" :label="t('budget.editor.costs.opOther')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('opOther', $event)" /></ion-item></div>
            <div class="cost-calculation-group">
              <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hirePerDay)" :label="t('budget.editor.costs.hirePerDay')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hirePerDay', $event)" /></ion-item><div class="cost-group-value"><span>{{ t('budget.editor.costs.hireLabel') }}</span><strong>{{ amount(hireAmount) }}</strong></div></div>
              <small class="cost-formula-hint">{{ t('budget.editor.costs.hireFormula', { hirePerDay: amount(store.document.costs.hirePerDay), days: amount(store.document.results.totalVoyageDays), hire: amount(hireAmount) }) }}</small>
            </div>
            <div class="cost-calculation-group">
              <div class="field-grid two-column"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.hireCommPercent)" :label="t('budget.editor.costs.hireCommPercent')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('hireCommPercent', $event)" /></ion-item><div class="cost-group-value"><span>{{ t('budget.editor.costs.hireCostLabel') }}</span><strong>{{ amount(hireCost) }}</strong></div></div>
              <small class="cost-formula-hint">{{ t('budget.editor.costs.hireCostFormula', { hire: amount(hireAmount), commission: amount(store.document.costs.hireCommPercent), hireCost: amount(hireCost) }) }}</small>
            </div>
            <div class="field-grid two-column cost-fixed-grid"><ion-item lines="full"><ion-input :value="numberText(store.document.costs.fixedCost)" :label="t('budget.editor.costs.fixedCost')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCost('fixedCost', $event)" /></ion-item></div>
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

    <!-- Voyage start (first port ETA) picker: a bottom sheet so the calendar never slides under the status bar.
         The datetime is intentionally NOT kept mounted: while the sheet is closed the component measures
         0x0 (its month strip has scrollWidth 0), and ion-datetime only reveals the calendar grid
         (.calendar-body opacity 0 -> 1) and re-centres the month strip when its own "datetime-ready"
         transition runs on the visible element. Mounting it per presentation makes that transition
         (IntersectionObserver + the component's 100ms ensureReadyIfVisible fallback) always run while
         the sheet is on screen, so the date grid can never stay invisible with only the weekday
         header and the time row showing. -->
    <ion-modal
      class="start-at-sheet"
      :is-open="startAtEditorOpen"
      :breakpoints="START_AT_SHEET_BREAKPOINTS"
      :initial-breakpoint="START_AT_SHEET_INITIAL_BREAKPOINT"
      @did-dismiss="startAtEditorOpen = false"
    >
      <ion-datetime id="budget-start-at" presentation="date-time" :locale="locale" :value="store.document.startAt" :show-default-buttons="true" :done-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="updateStartAt" />
    </ion-modal>

    <ion-modal :is-open="portPickerOpen" @did-dismiss="closePortPicker">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.editor.ports.add') }}</ion-title><ion-buttons slot="end"><ion-button @click="closePortPicker">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <ion-list lines="full" class="modal-list">
          <ion-item><ion-select :value="newPortTask" :label="t('budget.editor.ports.taskType')" label-placement="floating" interface="popover" :interface-options="taskSelectInterfaceOptions" :ok-text="t('common.ok')" :cancel-text="t('common.cancel')" @ion-change="setNewPortTask"><ion-select-option v-for="task in taskOptions" :key="task.value" :value="task.value">{{ task.label }}</ion-select-option></ion-select></ion-item>
        </ion-list>
        <ion-item lines="none" class="search-field">
          <Search slot="start" :size="18" aria-hidden="true" />
          <ion-input :value="portKeyword" :placeholder="t('budget.editor.ports.searchPort')" :aria-label="t('budget.editor.ports.searchPort')" type="text" inputmode="search" enterkeyhint="search" @ion-input="searchPort" />
          <button v-if="portKeyword" slot="end" class="search-clear" type="button" :aria-label="t('common.clear')" @click="clearPortKeyword"><X :size="16" /></button>
        </ion-item>
        <!-- Results panel is mounted only while searching or while the field has input: with an empty
             keyword it is a zero-content 1px-outlined box whose top and bottom borders stack into one
             stray divider line right under the search field. -->
        <ion-list v-if="portResultPanelVisible" lines="full" class="modal-list port-results">
          <ion-item v-if="store.searchingPorts"><ion-label color="medium">{{ t('common.searching') }}</ion-label></ion-item>
          <ion-item v-else-if="portKeyword && !store.portSuggestions.length"><ion-label color="medium">{{ t('budget.editor.ports.searchEmpty') }}</ion-label></ion-item>
          <ion-item v-for="port in store.portSuggestions" :key="String(port.portId)" button :detail="false" @click="addSelectedPort(port)"><ion-label class="suggest-label">{{ suggestPortName(port) }}<small v-if="portCountryName(port)">[{{ portCountryName(port) }}]</small></ion-label></ion-item>
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
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.addCommRate)" :label="t('budget.editor.cargo.addCommRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('addCommRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
              <div class="charge-calculated"><span>{{ t('budget.editor.cargo.addCommAmount') }}</span><strong>{{ amount(cargoCommission('addCommRate')) }}</strong></div>
            </div>
            <div class="charge-field">
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.brokerageRate)" :label="t('budget.editor.cargo.brokerageRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('brokerageRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
              <div class="charge-calculated"><span>{{ t('budget.editor.cargo.brokerageAmount') }}</span><strong>{{ amount(cargoCommission('brokerageRate')) }}</strong></div>
            </div>
            <div class="charge-field">
              <ion-item lines="full"><ion-input :value="numberText(activeCargo.frtTaxRate)" :label="t('budget.editor.cargo.taxRate')" label-placement="floating" type="number" inputmode="decimal" @ion-input="updateCargoNumber('frtTaxRate', $event)" /><span class="field-unit">{{ t('common.unit.percent') }}</span></ion-item>
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
      <!-- One shared toolbar for both daily-fuel-template views (list / template editor):
           adds the same centred title route pages use, and gives the header its own class so the
           scoped rules below can pin this toolbar to the app's 44px flat page header (item 1.1-f).
           The start slot only carries the "new template" entry of the list view; the template
           editor has no back button at all (owner 2.2), the close button is the single way out. -->
      <ion-header class="template-manager-header"><ion-toolbar><ion-buttons slot="start"><ion-button v-if="!templateDraft" :aria-label="t('budget.editor.templates.add')" @click="openNewTemplate"><Plus :size="22" /></ion-button></ion-buttons><ion-title>{{ templateDraft ? t('budget.editor.templates.editTitle') : t('budget.editor.templates.managerTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="closeTemplateManager">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content">
        <ion-list v-if="!templateDraft" lines="full" class="modal-list template-list">
          <ion-item v-if="!store.fuelTemplates.length"><ion-label color="medium">{{ t('budget.editor.templates.empty') }}</ion-label></ion-item>
          <ion-item v-for="template in store.fuelTemplates" :key="template.id">
            <ion-label><strong>{{ template.name }}</strong><p>{{ t('budget.editor.templates.summary', { laden: template.seaLadenFuel, ballast: template.seaBallastFuel, aux: template.seaAuxFuel }) }}</p></ion-label>
            <ion-buttons slot="end"><ion-button class="template-apply-button" @click="applyTemplate(template)">{{ t('budget.editor.templates.apply') }}</ion-button><ion-button :aria-label="t('budget.editor.templates.edit')" @click="editTemplate(template)"><Pencil :size="17" /></ion-button><ion-button color="danger" :aria-label="t('budget.editor.templates.remove')" @click="confirmRemoveTemplate(template.id)"><Trash2 :size="17" /></ion-button></ion-buttons>
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
        <!-- Empty template list: the same "new template" action as the toolbar "+" as a full-width
             block button under the list, so the action is reachable without the header icon.
             It stays AFTER the v-else block on purpose: an element between a v-if and its v-else
             would take over the v-else binding. -->
        <div v-if="!templateDraft && !store.fuelTemplates.length" class="modal-submit template-empty-actions">
          <ion-button expand="block" class="template-block-button" @click="openNewTemplate"><Plus :size="18" aria-hidden="true" /> {{ t('budget.editor.templates.add') }}</ion-button>
        </div>
        <div v-if="templateDraft" class="modal-submit"><ion-button expand="block" class="template-block-button" @click="saveTemplateDraft">{{ t('budget.editor.templates.save') }}</ion-button></div>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="formulaOpen" @did-dismiss="formulaOpen = false">
      <ion-header><ion-toolbar><ion-title>{{ t('budget.editor.results.formulaSheetTitle') }}</ion-title><ion-buttons slot="end"><ion-button @click="formulaOpen = false">{{ t('budget.editor.actions.close') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
      <ion-content class="modal-content result-formula-content">
        <p class="result-formula-subtitle">{{ t('budget.editor.results.formulaSheetSubtitle') }}</p>
        <div class="result-formula-list"><article v-for="item in resultFormulaItems" :key="item.label" class="result-formula-item"><div class="result-formula-head"><strong>{{ item.label }}</strong><span>{{ amount(item.value) }}</span></div><p class="result-formula-expression">{{ item.expression }}</p><p class="result-formula-detail">{{ item.detail }}</p></article></div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance } from 'vue'
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
import { getSuggestPortList } from '@/api/distance'
import { DEFAULT_SPEED } from '@/config/runtime'
import { formatAmount, formatDateTime } from '@/i18n/format'
import { portCountryCode, portCountryName } from '@/utils/port'
import { mergePortSuggestions, portQueryVariants } from '@/utils/port-search'
import { isQuotaExhaustedError } from '@/utils/quota'
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
/** 编辑器根节点（ion-page 渲染出来的 div.ion-page）：用于判断右滑返回手势是否已经把页面隐藏。 */
const editorPage = ref<ComponentPublicInstance | null>(null)
let skipAutomaticDraft = false
let allowEditorExit = false
let childNavigation = false
let confirmingExit = false

/**
 * 新增预算（store.currentId 为空）时禁止「右滑返回」和「系统返回键」直接退出：
 * 唯一的出口是页内返回按钮（requestEditorExit，保留原来的 继续编辑 / 放弃 / 保存草稿 询问）。
 * 编辑既有预算时两个守卫都不生效，行为与之前完全一致。
 */
function exitBlocked() {
  return !store.currentId
}

/** ion-router-outlet 暴露的 swipeHandler 结构（@ionic/core 的 SwipeGestureHandler）。 */
type EditorSwipeHandler = {
  canStart: () => boolean
  onStart?: () => unknown
  onEnd?: (shouldContinue: boolean) => void
}

let swipeOutlet: (HTMLElement & { swipeHandler?: EditorSwipeHandler }) | null = null
let swipeHandlerOriginal: EditorSwipeHandler | null = null
let swipeHandlerWrapped: EditorSwipeHandler | null = null

/**
 * iOS 右滑返回：@ionic/vue 在 outlet 挂载时把 { canStart, onStart, onEnd } 赋给
 * ion-router-outlet 的 swipeHandler；swipe-back 手势在「按下并开始横移」时实时调用
 * this.swipeHandler.canStart()。所以只要给 canStart 包一层，就能在手势开始之前拦下它。
 *
 * 为什么必须拦在手势之前：手势是「先转场、后路由」，等它翻完页再在路由守卫里返回 false
 * 会把 ion-router-outlet 卡在中间态（详见 gestureHidEditorPage 的注释），所以这里不能用守卫兜底。
 * 选点的理由：赋值 swipeHandler 只会触发 swipeHandlerChanged() → updateGestureEnabled()，
 * 它只是 gesture.enable(...)，不会重建手势对象，因此替换 handler 不会打断进行中的手势；
 * 页面用 closest('ion-router-outlet') 找到自己所属的那个 outlet，嵌套 outlet（tabs）下也不会认错。
 * 失败模式：@ionic/vue 只在 outlet 元素首次就绪时写一次 swipeHandler，如果将来它再次整体赋值，
 * 我们的包装会被覆盖而静默失效（不会崩、不会卡死）；还原时只在 outlet 上仍是我们的包装对象时才写回。
 */
function installSwipeGuard() {
  if (swipeHandlerOriginal) return
  const page = editorPage.value?.$el
  if (!(page instanceof HTMLElement)) return
  const outlet = page.closest('ion-router-outlet') as (HTMLElement & { swipeHandler?: EditorSwipeHandler }) | null
  const original = outlet?.swipeHandler
  if (!outlet || !original || typeof original.canStart !== 'function') return
  const wrapped: EditorSwipeHandler = {
    ...original,
    canStart: () => (exitBlocked() ? false : original.canStart()),
  }
  swipeOutlet = outlet
  swipeHandlerOriginal = original
  swipeHandlerWrapped = wrapped
  outlet.swipeHandler = wrapped
}

function removeSwipeGuard() {
  if (swipeOutlet && swipeHandlerOriginal && swipeOutlet.swipeHandler === swipeHandlerWrapped) {
    swipeOutlet.swipeHandler = swipeHandlerOriginal
  }
  swipeOutlet = null
  swipeHandlerOriginal = null
  swipeHandlerWrapped = null
}

/**
 * Android 系统返回键：Ionic 把原生 backbutton 转成 document 上的 ionBackButton 事件，
 * 各处理器用 event.detail.register(priority, handler) 注册，优先级最高的那个被调用；
 * 只要它不调用 processNextHandler，后面的处理器（路由返回等）就不会执行 —— 也就是「吞掉」这次返回。
 * 弹层/菜单的优先级是 99/100，高于这里的 10，所以弹层打开时仍然是先关弹层。
 * 只在「新增预算」期间注册，编辑既有预算或离开页面时移除。
 */
const BACK_BUTTON_GUARD_PRIORITY = 10
let backButtonGuardInstalled = false
let editorVisible = false

function onEditorBackButton(event: Event) {
  const detail = (event as CustomEvent<{ register?: (priority: number, handler: () => void) => void }>).detail
  if (typeof detail?.register !== 'function') return
  detail.register(BACK_BUTTON_GUARD_PRIORITY, () => undefined)
}

function syncBackButtonGuard() {
  const wanted = editorVisible && exitBlocked()
  if (wanted === backButtonGuardInstalled) return
  if (wanted) document.addEventListener('ionBackButton', onEditorBackButton)
  else document.removeEventListener('ionBackButton', onEditorBackButton)
  backButtonGuardInstalled = wanted
}

/** 进入页面（onMounted / ionViewWillEnter）时装守卫，离开时（ionViewWillLeave / unmounted）拆掉。 */
function installEditorGuards() {
  editorVisible = true
  installSwipeGuard()
  syncBackButtonGuard()
}

function removeEditorGuards() {
  editorVisible = false
  removeSwipeGuard()
  syncBackButtonGuard()
}

// currentId 会在 initializeEditor（resetDraft / loadDetail）或保存成功后变化，跟着它开关返回键守卫。
watch(exitBlocked, syncBackButtonGuard)
onMounted(installEditorGuards)
onUnmounted(removeEditorGuards)

// ion-select 弹层：浮动标签下 Ionic 默认用 size:'cover' 撑满屏幕并截断选项文字，这里显式声明自适应尺寸。
// cssClass 改用本页自己的 editor-select-popover：弹层挂在 document 上、scoped 样式够不到，
// 对应规则写在文件末尾（用 :global() 包裹，只命中本页的弹层）。
// app.css 里全局共享的 .tz-select-popover 保持不变——航程计算页的时区下拉还在用它。
const selectInterfaceOptions = { cssClass: 'editor-select-popover', size: 'auto' }
// 「添加港口」弹层的任务类型下拉：只有这一个用 editor-select-popover-lg（选项字号 15 → 16px），
// 其余编辑器下拉（船舶 / 油耗模板 / 满载 / 航速 / 整体余量）保持 15px 不动。
const taskSelectInterfaceOptions = { ...selectInterfaceOptions, cssClass: 'editor-select-popover editor-select-popover-lg' }

/**
 * 航次开始时间（第一港到港时间）用底部 sheet 弹层：
 * 普通全屏 ion-modal 会把日历顶到状态栏下面；0 = 关闭、0.5 = 半屏、0.9 = 展开，
 * initialBreakpoint 必须是 breakpoints 里的值。
 */
const START_AT_SHEET_BREAKPOINTS: number[] = [0, 0.5, 0.9]
const START_AT_SHEET_INITIAL_BREAKPOINT = 0.9

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
// 港口建议面板：空关键词且不在搜索时整块不渲染（否则它是个只有上下两条 1px 边框的零高盒子，
// 在搜索框下方显示成一条多余的分割线）；有输入就有「搜索中 / 无结果 / 结果行」要展示。
const portResultPanelVisible = computed(() => store.searchingPorts || portKeyword.value.length > 0)
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

/**
 * Result formula sheet: the same eight rows as the mini program's
 * `BudgetResultFormulaPanel.vue` (label + value + symbolic expression + substituted arithmetic),
 * in the same order and with the same operands.
 */
const resultFormulaItems = computed(() => {
  const { costs, results } = store.document
  const fuelCost = numberOf(results.totalFuelCost)
  const portCharge = numberOf(results.totalPortCharge)
  const holdCleaning = numberOf(costs.ilohc)
  const cev = numberOf(costs.cev)
  const opOther = numberOf(costs.opOther)
  const inspection = numberOf(costs.inspection)
  const expenseParts = {
    fuel: amount(fuelCost),
    portCharge: amount(portCharge),
    holdCleaning: amount(holdCleaning),
    cev: amount(cev),
    opOther: amount(opOther),
    inspection: amount(inspection),
  }
  return [
    {
      label: t('budget.editor.results.totalIncome'),
      value: results.totalIncome,
      expression: t('budget.editor.results.exprTotalIncome'),
      detail: t('budget.editor.results.detailTotalIncome', { income: amount(results.totalIncome) }),
    },
    {
      label: t('budget.editor.results.netIncome'),
      value: results.netIncome,
      expression: t('budget.editor.results.exprNetIncome'),
      detail: t('budget.editor.results.detailNetIncome', {
        total: amount(results.totalIncome),
        addComm: amount(cargoTotals.value.addComm),
        brokerage: amount(cargoTotals.value.brokerage),
        tax: amount(cargoTotals.value.tax),
        demurrage: amount(cargoTotals.value.demurrage),
        dispatch: amount(cargoTotals.value.dispatch),
      }),
    },
    {
      label: t('budget.editor.results.operatingCost'),
      value: results.operatingCost,
      expression: t('budget.editor.results.exprOperatingCost'),
      detail: t('budget.editor.results.detailOperatingCost', expenseParts),
    },
    {
      label: t('budget.editor.results.totalExpense'),
      value: results.totalExpense,
      expression: t('budget.editor.results.exprTotalExpense'),
      detail: t('budget.editor.results.detailTotalExpense', {
        hireCost: amount(hireCost.value),
        fixedCost: amount(costs.fixedCost),
        ...expenseParts,
      }),
    },
    {
      label: t('budget.editor.results.operatingProfit'),
      value: results.operatingProfit,
      expression: t('budget.editor.results.exprOperatingProfit'),
      detail: t('budget.editor.results.detailOperatingProfit', {
        netIncome: amount(results.netIncome),
        operatingCost: amount(results.operatingCost),
      }),
    },
    {
      label: t('budget.editor.results.netProfit'),
      value: results.netProfit,
      expression: t('budget.editor.results.exprNetProfit'),
      detail: t('budget.editor.results.detailNetProfit', {
        netIncome: amount(results.netIncome),
        totalExpense: amount(results.totalExpense),
      }),
    },
    {
      label: t('budget.editor.results.hirePerDayLevel'),
      value: results.hirePerDayLevel,
      expression: t('budget.editor.results.exprHirePerDayLevel'),
      detail: t('budget.editor.results.detailHirePerDayLevel', {
        operatingProfit: amount(results.operatingProfit),
        days: amount(results.totalVoyageDays),
      }),
    },
    {
      label: t('budget.editor.results.dailyProfit'),
      value: results.dailyProfit,
      expression: t('budget.editor.results.exprDailyProfit'),
      detail: t('budget.editor.results.detailDailyProfit', {
        netProfit: amount(results.netProfit),
        days: amount(results.totalVoyageDays),
      }),
    },
  ]
})

onIonViewWillEnter(() => {
  allowEditorExit = false
  childNavigation = false
  installEditorGuards()
  void initializeEditor()
})

onIonViewWillLeave(() => {
  removeEditorGuards()
  if (!skipAutomaticDraft && !allowEditorExit && !childNavigation && store.hasUnsavedEditorState && !store.saving) {
    void store.saveLocalDraft().catch(() => undefined)
  }
})

onBeforeRouteLeave(async () => {
  if (allowEditorExit || childNavigation || skipAutomaticDraft || store.saving) return true
  // 右滑返回（iOS swipe-to-go-back）会先把当前页隐藏、把上一页显示出来，之后才跑路由守卫，
  // 此时一旦中止导航就会把 ion-router-outlet 卡在中间态（详见 gestureHidEditorPage 注释），
  // 所以手势已经翻页时不再询问，直接退出——本地草稿仍由 onIonViewWillLeave 自动保存。
  if (gestureHidEditorPage()) return true
  // 新增预算：右滑和系统返回都不放行，只能走页内返回按钮（见 requestEditorExit）。
  // 手势已经在 canStart 就被拦下（installSwipeGuard），这里兜住 popstate / history.back 等
  // 非手势入口——它们不会启动 outlet 的转场，返回 false 只是把 URL 还原，不会留下坏状态。
  if (exitBlocked()) return false
  if (!store.hasUnsavedEditorState) return true
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

/** 退出目标：从详情页点「修改」进来的回到该预算详情，其余情况回预算列表。 */
function exitTarget() {
  const id = store.currentId
  return route.query.fromDetail === '1' && id ? `/esti-deploy/detail/${id}` : '/tabs/esti-deploy'
}

/**
 * 右滑返回手势是否已经把编辑器页面翻掉了。
 *
 * swipe-to-go-back 是「先转场、后路由」：手势结束时 IonRouterOutlet 已经 commit 过视觉动画
 * （当前页被写成 display:none、上一页显示出来），随后才调用 handleNavigateBack() 触发路由守卫。
 * 此时如果守卫返回 false 中止导航，就会同时留下两处坏状态：
 * 1. 路由还停在编辑器上，编辑器页面却已经被隐藏 —— 再点「新增」是同路由的重复导航，
 *    路由器直接判定 duplicated 什么都不做，页面永远出不来；
 * 2. 手势在 outlet 内部留下的 skipTransition 标记没有被消费，之后每一次导航的 transition()
 *    都会提前返回、不再 commit，新页面停在 ion-page-invisible（opacity:0），整个应用像卡死一样。
 * 这两处都在 @ionic/vue 内部，应用层无法回滚，所以只能在这里放行。
 */
function gestureHidEditorPage() {
  const el = editorPage.value?.$el
  if (!(el instanceof HTMLElement)) return false
  return el.classList.contains('ion-page-hidden') || getComputedStyle(el).display === 'none'
}

async function requestEditorExit() {
  // 询问对话框只对「新增预算且航程已计算」出现；编辑既有预算或尚未计算航程时直接离开
  // （本地草稿仍由 onIonViewWillLeave 自动保存）。
  if (allowEditorExit || skipAutomaticDraft || store.saving || !store.hasUnsavedEditorState || store.currentId || !store.document.routeCalculated) {
    allowEditorExit = true
    await router.replace(exitTarget())
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
  const id = String(route.query.id || '')
  const numericId = Number(id)
  /**
   * store 已经持有同一份预算（刚从地图 / 详情页 / 分享弹窗返回）时直接复用内存文档：
   * 1) 不再把 initializing 置 true —— 否则整页会被 loading 占位符替换、ion-content 的滚动位置归零，
   *    用户看到的就是「从地图回来页面刷新了一下」（即使一个接口都没请求）；
   * 2) 不再重复请求油耗模板 / 船舶列表（这两个列表在首次进入本页时已经加载过）。
   * 首次进入本页（initialized 还是 false）或换了一个 id 时照旧走完整初始化。
   * 判定条件与详情页 holdsBudget() 一致：document 既来自该 id 的服务端详情，当前编辑对象也仍是它。
   */
  const holdsBudget = Number.isFinite(numericId) && numericId > 0
    && store.detailLoadedId === numericId && store.currentId === numericId
  if (holdsBudget && initialized.value && loadedId.value === id) return
  // 防御性合并：同一次进入实测只会调用一次 initializeEditor（onMounted 只装守卫），
  // 这里共用同一个在途 Promise，万一 Ionic 连续派发两次生命周期也不会重复请求同一份详情。
  if (initializationTask) return initializationTask
  initializationTask = runInitialization(id, numericId, holdsBudget).finally(() => {
    initializationTask = null
  })
  return initializationTask
}

let initializationTask: Promise<void> | null = null

async function runInitialization(id: string, numericId: number, holdsBudget: boolean) {
  initializing.value = true
  try {
    await Promise.all([
      store.loadFuelTemplates().catch(() => undefined),
      store.loadVessels().catch(() => undefined),
    ])
    if (id && id !== loadedId.value) {
      if (!holdsBudget) await store.loadDetail(numericId)
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

/**
 * 满载/空载与航速模式这两个下拉描述的是「本港 → 下一港」的航段：
 * 只有「港序里多于一个港口、且本港是最后一个」时才隐藏，只留任务类型。
 * 港序里只有一个港口时它既是首港也是末港，这两个下拉照常显示
 * （用户反馈：新增预算只加一个港口时看不到满载/航速）。
 */
function showsLegOptions(index: number) {
  const count = store.document.ports.length
  return count === 1 || index < count - 1
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

/* ===== 日油耗模板：设为模板的门槛 + 已选模板的「已修改」判定（用户 1.1）=====
   1)「已填写」用 > 0 判定，不用「非空」：store 的 numberValue()（store.ts:64）把空串/NaN
     一律归一成 0，recalculate/PDF 也把 0 当「没有」——0 吨/天的主机会让该航段燃油费用直接为 0，
     所以空值与 0 在业务上等价；这里沿用同一口径。航行辅机（seaAuxFuel）是唯一允许缺失的项，
     不参与判定（用户明确要求：「日油耗除航行辅机其他都有填写才可以设为模版」）。
   2)「已修改」= 再 apply 一次当前模板会不会改变现在的值。比较时模板侧按 applyFuelTemplate 的
     归一方式取值（航速 numberValue(x) || DEFAULT_SPEED，见 store.ts:934-939），文档侧取原值：
     这样「刚选完模板」必然不脏（apply 写进去的就是模板归一后的值），
     而用户把某个值改成 0 也算改过（0 ≠ 模板归一后的 12），不会漏报。
     模板覆盖的字段 = DailyFuelTemplate 的全部字段：5 个日油耗 + 4 个航速（id/name 除外）。
   3) epsilon = 1e-6：两侧都只做「解析 → 比较」，没有浮点运算，同一个十进制数解析结果按位相同；
     用户最多输到 2~3 位小数（相邻可输入值差 ≥ 1e-3），1e-6 只用来兜住 JSON 往返可能出现的浮点尾巴，
     不可能把真实改动吞掉。 */
const TEMPLATE_FUEL_FIELDS = ['seaLadenFuel', 'seaBallastFuel', 'seaAuxFuel', 'portIdleFuel', 'portWorkingFuel'] as const
const TEMPLATE_SPEED_FIELDS = ['ballastFullSpeed', 'ballastEcoSpeed', 'ladenFullSpeed', 'ladenEcoSpeed'] as const
const TEMPLATE_REQUIRED_FUEL_FIELDS = ['seaLadenFuel', 'seaBallastFuel', 'portIdleFuel', 'portWorkingFuel'] as const
const TEMPLATE_EPSILON = 1e-6

/** 是否已选中一个模板（选中后模板名称 + 设为模板整行隐藏）。 */
const templateSelected = computed(() => Boolean(store.document.fuelTemplateId))
/** 模板覆盖的四个日油耗是否都已填（> 0，航行辅机除外）——只看数值，不含模板名称。 */
const requiredFuelFilled = computed(() => TEMPLATE_REQUIRED_FUEL_FIELDS.every((field) => numberOf(store.document.fuel[field]) > 0))
/** 「设为模板」可点：要有模板名称，且四个日油耗字段都 > 0（航行辅机除外）。 */
const canSetAsTemplate = computed(() => Boolean(newTemplateName.value.trim()) && requiredFuelFilled.value)
/**
 * 「模板名称 + 设为模板」整行是否出现（业主 2.2：默认不出现，只有「不选模板 + 日油耗填够」才出现）。
 * 为什么门控用 requiredFuelFilled 而不是 canSetAsTemplate：模板名称输入框就在这一行里，
 * 若整行依赖 canSetAsTemplate（= 有名称 && 有油耗），就会出现「没有名称 → 整行不显示 →
 * 没地方输入名称」的死锁；所以整行只按油耗判断，名称只用来控制按钮的 disabled。
 * 按钮的 disabled 仍然保持 canSetAsTemplate，因此名称没填时按钮是灰的。
 * 选中模板时整行不显示（沿用 v-else-if 的「已修改 + 保存变动到模板」行，行为不变）。
 */
const showsTemplateSaveRow = computed(() => !templateSelected.value && requiredFuelFilled.value)
/** 当前选中的模板对象（列表还没加载到 / 已被删除时为 null）。 */
const selectedFuelTemplate = computed(() => store.fuelTemplates.find((item) => String(item.id) === String(store.document.fuelTemplateId)) || null)
/** 用户是否改动过模板覆盖的值（5 个日油耗 + 4 个航速）。 */
const templateDirty = computed(() => {
  const template = selectedFuelTemplate.value
  if (!template || !templateSelected.value) return false
  const fuelChanged = TEMPLATE_FUEL_FIELDS.some((field) => Math.abs(numberOf(store.document.fuel[field]) - numberOf(template[field])) > TEMPLATE_EPSILON)
  const speedChanged = TEMPLATE_SPEED_FIELDS.some((field) => Math.abs(numberOf(store.document.speeds[field]) - (numberOf(template[field]) || DEFAULT_SPEED)) > TEMPLATE_EPSILON)
  return fuelChanged || speedChanged
})

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

/**
 * 「保存变动到模板」：把当前日油耗 + 航速写回选中的模板。
 * 复用既有的 saveTemplate → store.saveFuelTemplate（store.ts:958，id 存在即走
 * updateDailyFuelTemplate，是既有 upsert，无需给 store 加新 action），
 * 名字与 id 原样带过去，所以只改值不改名。saveTemplate 内部已经
 * loadFuelTemplates() 重新拉列表：成功后 templateDirty 立刻变回 false（提示消失），
 * 并弹出既有的「日油耗模板已保存」toast。
 */
async function updateTemplateFromDocument() {
  const template = selectedFuelTemplate.value
  if (!template) return
  await saveTemplate({
    ...template,
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
  resetPortSearch()
  portPickerOpen.value = true
}

function closePortPicker() {
  portPickerOpen.value = false
  portKeyword.value = ''
  resetPortSearch()
}

function setNewPortTask(event: any) {
  const value = inputValue(event)
  if (taskOptions.value.some((task) => task.value === value)) newPortTask.value = value as BudgetPortTask
}

/* ===== 港口搜索：查询串与结果合并（本轮）=====
   查询串规则与航程计算页共用 src/utils/port-search（同一份 portQueryVariants）。
   之前这里把「去掉全部空白与撇号」的归一化串发给接口，本意是宽容误打空格（"band ar" →
   "Bandar"），但用户**主动**打的空格也被吃掉："dalia f" 变成 "daliaf"，接口就再也匹配不到
   "Dalia FPSO" 这类名字里本身带空格/多词的港口。
   现在按 portQueryVariants 依次请求：原样串（保留主动空格）在前，归一化串兜底；两份结果按
   portId 去重合并，原样串的结果排在前面。没有空白时只有一次请求，行为与之前完全一致。
   不复用 store.searchPorts：它一次只接收一个查询串，内部令牌会让第二个串把第一个串的
   响应作废掉，合并只能在组件里做；因此请求令牌也由组件自己持有（portSearchRequestVersion）。 */
/** 与航程计算页一致的 280ms 防抖：够合并连续输入，又不影响单次输入的响应。 */
const PORT_SEARCH_DEBOUNCE_MS = 280
let portSearchTimer: number | null = null
/**
 * 建议列表请求令牌：每次发起 / 作废搜索都自增。只有持有最新令牌的响应能写进 store，
 * 迟到的响应（含两次请求循环里的第一次）一律丢弃，绝不会覆盖更新的搜索结果。
 */
let portSearchRequestVersion = 0

function cancelPortSearch() {
  if (portSearchTimer !== null) {
    window.clearTimeout(portSearchTimer)
    portSearchTimer = null
  }
}

/** 只作废在途请求、不动列表：选中港口后用，迟到的响应不能把刚关掉的弹层重新填上结果。 */
function invalidatePortSearch() {
  cancelPortSearch()
  portSearchRequestVersion += 1
}

/** 清空建议列表并作废所有在途请求（清空输入 / 开关弹层时用）。 */
function resetPortSearch() {
  invalidatePortSearch()
  // store 自己的令牌也要推进：其它入口（港口页）发起的在途请求同样不能回填已关闭的弹层。
  // searchPorts('') 会在第一个 await 之前同步清空列表，所以这里不用再赋值一次。
  void store.searchPorts('')
  // 之前只清列表不复位这个标志：作废掉的那次请求不会再走 finally，搜索中会一直挂着。
  store.searchingPorts = false
}

async function runPortSearch(keyword: string) {
  cancelPortSearch()
  const requestVersion = ++portSearchRequestVersion
  const queries = portQueryVariants(keyword)
  if (!queries.length) {
    void store.searchPorts('')
    store.searchingPorts = false
    return
  }
  store.searchingPorts = true
  try {
    let merged: PortInfo[] = []
    for (const query of queries) {
      const result = await getSuggestPortList(query)
      // 令牌变了说明用户又输入了 / 选中了港口 / 关掉了弹层：立刻放弃，旧结果不能覆盖新结果
      if (requestVersion !== portSearchRequestVersion) return
      merged = mergePortSuggestions(merged, Array.isArray(result) ? result : [])
    }
    store.portSuggestions = merged
  } catch {
    if (requestVersion === portSearchRequestVersion) store.portSuggestions = []
  } finally {
    if (requestVersion === portSearchRequestVersion) store.searchingPorts = false
  }
}

function searchPort(event: any) {
  portKeyword.value = inputValue(event)
  cancelPortSearch()
  portSearchTimer = window.setTimeout(() => {
    portSearchTimer = null
    void runPortSearch(portKeyword.value)
  }, PORT_SEARCH_DEBOUNCE_MS)
}

function clearPortKeyword() {
  portKeyword.value = ''
  void runPortSearch('')
}

// 建议面板的港口名：与航程计算页一致（portName → fullName → portId），国家名由 portCountryName 给出
function suggestPortName(port: PortInfo) {
  return String(port.portName || port.fullName || port.portId || '').trim()
}

function addSelectedPort(port: PortInfo) {
  // 选中后作废挂起的搜索，避免弹层刚关又被一次迟到的查询重新填上结果
  invalidatePortSearch()
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
    // 当天次数用完已经由全局对话框提示（store 里触发），这里不再弹 danger toast。
    if (isQuotaExhaustedError(cause)) return
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
/* 「添加货物」的字体与图标比「添加港口」再大一号（15px / 20px 图标，见模板里的 :size="20"） */
.section-heading ion-button.cargo-add-button { font-size: 15px; }

/* ===== 「添加港口 / 添加货物」两个强调色（用户 2.1）=====
   原来两者都用区块标题的蓝色 #005f88，和页面里其它蓝色按钮混在一起。现在：
   - 添加港口用深绿 #0b6b45（色相约 152°）；
   - 添加货物用深紫 #6d28d9（色相约 262°），两者色相相距足够远，不会看成一个颜色；
   两者在白卡上的对比度分别为 6.6:1 / 7.1:1，都满足 WCAG AA（4.5:1）。
   港口动作的三个入口（标题栏 clear、空态整宽 solid、底部 outline）统一用深绿，保证动作色一致；
   fill="clear" 的按压/悬停底色本来就是透明的，只需改 --color；
   fill="outline" 按下时会用 --background-activated 反白，所以连它一起改，否则按下会闪回蓝色。 */
.section-heading ion-button.port-add-button { --color: #0b6b45; }
.section-heading ion-button.cargo-add-button { --color: #6d28d9; }
/* 空态整宽按钮的深绿写在它自己的规则里（.empty-add-button 在文件下方、会覆盖同特异性的声明） */
.section-actions ion-button.port-outline-button { --color: #0b6b45; --border-color: #0b6b45; --background-activated: #0b6b45; --color-activated: #fff; }

.editor-list { margin: 8px 0 0; }

/* 这三个字段原先直接裸露在网格/表头里，补上 ion-item 后收紧内边距，保持原布局 */
.template-name-item { flex: 1 1 auto; min-width: 0; --min-height: 64px; --padding-start: 0; --inner-padding-end: 0; }
.weather-custom-row ion-item { min-width: 0; --min-height: 64px; }
.field-unit { flex: none; align-self: center; margin-inline-start: 5px; padding-inline-end: 2px; color: #6b7c8d; font-size: 12px; white-space: nowrap; }
/* 整体在港余量：百分比模式下数值右侧的「%」单位（纯文本，不可编辑）。
   宽度只有 1 个字符，给 item 右端留 2px，避免贴着卡片边缘。 */
.margin-unit { margin-inline-start: 2px; padding-inline-end: 2px; font-size: 14px; }

/* ===== 编辑页工具栏：返回图标 + 文字、标题小一号（本轮）=====
   返回控件仍是 ion-button（不是 ion-back-button）：
   - ion-back-button 自己会按 default-href / 路由历史做一次返回，本页的出口必须经过
     requestEditorExit（新增预算时还有 继续编辑 / 放弃 / 保存草稿 的确认弹窗），两条返回
     路径会互相打架；ion-button 的 @click 是唯一出口，行为一行都不用改。
   - ion-back-button 的图标尺寸只能通过 --icon-font-size / backButtonIcon 配置间接调，
     而 ios 与 md 的按钮内边距、文字最小宽度又各有一套；ion-button + lucide 图标 +
     span 在两个模式下渲染完全一致，方便精确量到像素。
   图标 22 → 24px：chevron 的墨迹只占视图框的一半（实测 22px 框里只有 6×12px 的笔画），
   24px 让笔画长到约 13px，与 15px 的文字大写高度相当；再大就会顶到 44px 工具栏的上下留白
   （44 − 24 = 20，上下各 10px），再小则和原来 22px 看不出差别。
   文字 15px：比本页标题（16px）小 1px，保持「标题 > 返回」的层级；同时消掉 Ionic 自带的
   模式差（实测 md 按钮 14px / ios 17px，同一个控件在两种模式下字重感完全不同）。 */
.editor-header .editor-back-button { --padding-start: 6px; --padding-end: 8px; }
.editor-header .editor-back-text { margin-inline-start: 2px; font-size: 15px; font-weight: 500; letter-spacing: 0; }
/* 标题 17 → 16px：app.css 的
   `html.md .ion-page:not(.ion-delegate-host) > ion-header > ion-toolbar > ion-title`
   特异性到 (0,3,4)，scoped 规则（.editor-header ion-title[data-v-x]）只有 (0,2,1) 压不过，
   所以字号用 !important 锁住；居中、600 字重、12px 内边距仍由 app.css 提供，不重复声明。
   只挂在 .editor-header 上：弹层自己的 header 标题不受影响。 */
.editor-header ion-title { font-size: 16px !important; }

/* ===== 输入框下划线再深一号 + 加粗 0.5px（本轮）=====
   Ionic 给 ion-item 的下划线两种模式各有一个默认灰：ios #c8c7cc、md rgba(0,0,0,.13)
   （md 的叠加到白底上等于 #dedede）。这里「各深一档」而不是合并成同一个颜色：
   按上一轮同一把尺子再减一档，ios #b0afb4 → #9a99a1（每通道 −22/−22/−19），
   md rgba(0,0,0,.22) → rgba(0,0,0,.30)（叠到白底 #c7c7c7 → #b3b3b3，≈ −21/255），
   两轮合计比 Ionic 默认深 ≈43/255（≈17%），两种模式各自的视觉重量和深浅关系保持不变。
   模式判定用 ion-item 宿主自己的 ios / md class（Ionic 会把当前模式写到组件宿主上），
   这样整条规则仍然是本组件的 scoped 选择器，不会漏到别的页面。
   选择器只覆盖编辑器自己的四个面：主表单 .budget-editor + 三个弹层 .modal-content
   （油耗模板 / 添加港口 / 货物编辑），header、toolbar 的下边框由 app.css 维护，不受影响。
   下划线画在 ion-item 的 shadow DOM 里（实测两种模式都是 .item-native 的 border-* 取
   --border-width / --border-color，.item-inner 的 --inner-border-width 是 0），
   而 light DOM 的声明优先级高于 :host，所以在这里改这两个变量就能生效。
   加粗 0.5px 走 item 自己的 --border-width：ios .55px → 1px、md 1px → 1.5px。
   宽度规则要排除「无下划线」的 item：Ionic 的 lines 是 Vue prop，不落到 DOM 属性上
   （实测所有 item 的 lines 属性都是 null），它只把结果写成宿主 class
   item-lines-none / item-lines-full / item-lines-default，所以这里按 class 排除。
   这些 item 现在是 --border-width: 0（实测添加港口弹层的搜索框就是这样），
   无条件覆盖会凭空多出一条下划线；颜色规则保持原样覆盖全部 item，
   因为宽度为 0 时颜色不参与绘制。 */
.budget-editor ion-item.ios, .modal-content ion-item.ios { --border-color: #9a99a1; }
.budget-editor ion-item.md, .modal-content ion-item.md { --border-color: rgba(0, 0, 0, .30); }
.budget-editor ion-item.ios:not(.item-lines-none), .modal-content ion-item.ios:not(.item-lines-none) { --border-width: 0 0 1px 0; }
.budget-editor ion-item.md:not(.item-lines-none), .modal-content ion-item.md:not(.item-lines-none) { --border-width: 0 0 1.5px 0; }

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

/* ===== 浮动标签（label-placement="floating"）统一度量 =====
   Ionic 把浮动 label 和数值放在同一个 .input-control 列里，数值在剩下的 .native-wrapper
   中垂直居中，--padding-top 在列外（只是把整列往下推）。所以：
   - label ↔ 数值的间距由控件总高 + 浮起 label 的上移量决定；
   - 数值 ↔ 下划线的间距 = 控件底部留白 + item 居中多出来的空隙（item 的 --min-height
     高于控件时，多出的高度上下各一半）。

   本轮（1.4.x）用户要求「label ↔ 值 +2px、值 ↔ 下划线 −2px」，推导：
   - 控件 62 → 58px：数值在控件里居中，控件底边因此上移 2px → 值 ↔ 下划线 −2px；
   - 行   68 → 64px：slack 保持 (64−58)/2 = 3px，与原来 (68−62)/2 一致，
     所以 item 余量不会把刚压下去的下间距又涨回来；
   - 浮起 label 上移 4 → 8px（translateY(calc(50% - 8px))）：该位移只改 label 的绘制位置、
     不参与布局 → label ↔ 值 +2px，控件高度与数值位置都不动。
   实测基线（390pt 宽、Avenir Next，真实 Ionic + app.css）：控件 62 / 行 68 / 上移 4 时
   label↔值 12.18px、值↔下划线 13.69px；按上面三条改完应为 14.18px / 11.69px。

   min-height 必须 !important：Ionic 自带的
   .input-label-placement-floating.sc-ion-input-md-h { min-height: 56px } 特异性高于
   ion-input.input-label-placement-floating，否则高度被压回 56px，item 里空出来的 6px
   会平摊到数值上下，正好把「下划线间距偏大」留在原处。
   字号同样要 !important：app.css 用 ion-input / ion-select / input { font-size: 16px !important }
   锁死 16px；这里统一 +1px，label 文字继承宿主字号，数值要单独命中（见下一条）。 */
ion-input.input-label-placement-floating,
ion-select.select-label-placement-floating {
  min-height: 58px !important;
  --padding-top: 6px;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
  font-size: 17px !important;
}
/* Ionic 9 的 ion-input 内部是 light DOM（scoped）而非 shadow DOM，::part(native) 命中不了，
   数值文本必须用 :deep()；ion-select 的数值在 shadow DOM 里，用 ::part(text)。 */
ion-input.input-label-placement-floating :deep(input),
ion-select.select-label-placement-floating::part(text) {
  font-size: 17px !important;
}
/* label ↔ 数值 +2px：Ionic 把浮动 label 定位成 translateY(50%) scale(.75)（50% 是 label
   自身高度的一半），这个位移只改 label 的绘制位置、不参与布局，所以把它再往上抬 4px
   （4 → 8px）就只是把 label ↔ 值拉开 2px，数值位置、控件高度、item 余量全都不动。
   反例（上一轮实测）：控件与 item 各 +8px 时 label↔值 8.18→12.18（+4，符合预期），
   但数值↔下划线 13.69→17.69（+4）——数值在控件里居中，控件变高会把它相对控件底边也往下推；
   而 item 高度必须 ≥ 控件高度，那 4px 无法靠 item 余量抵掉（数学上无解）。
   ion-input 内部是 light DOM，label 用 :deep() 命中；ion-select 的 label 在 shadow DOM 里，
   用 Ionic 暴露的 ::part(label)。两边都加 !important：Ionic 的
   .label-floating.sc-ion-input-md-h .label-text-wrapper 是运行时注入文档的，普通规则
   在特异性/顺序上都可能被它压过。只在 .label-floating（已浮起）时生效，空值/未聚焦时
   label 仍在数值位置（Ionic 的 translateY(100%) scale(1)）不受影响。 */
ion-input.input-label-placement-floating.label-floating :deep(.label-text-wrapper),
ion-select.select-label-placement-floating.label-floating::part(label) {
  transform: translateY(calc(50% - 8px)) scale(0.75) !important;
}

.editor-section h3 { margin: 17px 0 8px; color: #344d60; font-size: 13px; }
/* 日油耗 / 常用航速两个小标题：加粗，且与下方输入区之间再收紧 8px（8 → 0） */
.editor-section.fuel-section h3 { margin-bottom: 0; font-weight: 700; }
.field-grid { display: grid; gap: 8px; }
.two-column { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.field-grid ion-item { min-width: 0; --min-height: 64px; }
/* 各网格不再各自设置内边距/字号：间距与字号统一由上面的浮动标签规则给出，
   否则每日油耗、航速等分组会比别处更小（用户反馈的问题根因）。 */
.field-grid ion-input, .field-grid ion-select { min-width: 0; }
.field-tip, .section-note { align-self: center; color: #748697; font-size: 12px; line-height: 1.45; }

/* ===== 与小程序对齐的排版（预算编辑页面 1.4.1 / 1.4.2 / 1.4.3） ===== */

/* 基本信息：无标题，船舶选择与说明/规范设置按钮同一行（参考小程序 BudgetBasicInfoPanel.vue） */
.basic-list { margin-top: 0; }
/* 2.1 预算名称上方的留白 −16px（实测 390pt：卡片上边缘 → 名称行 23px → 7px）。
   23px = 卡片 1px 边框 + 14px 卡片内边距 + ion-list（md）自带 8px 上下内边距；
   这里把该列表的 8px 上内边距归零、只给基本信息卡片 6px 上内边距：
   1 + 6 + 0 = 7px。列表下内边距保持 Ionic 默认，名称行与船舶行之间不受影响。 */
.basic-section { padding-top: 6px; }
.basic-section .basic-list { padding-top: 0; }
.ship-field { display: flex; align-items: center; gap: 6px; }
.ship-field .ship-item { flex: 1 1 auto; min-width: 0; --min-height: 64px; }
.ship-field ion-button { flex: none; height: 38px; margin: 0; --padding-start: 10px; --padding-end: 10px; }

/* 日油耗与航速：模板选择/设置另起一行紧随标题；油耗三行、辅机单独一行；4 个航速同一行
   （参考小程序 BudgetDailyFuelSpeedPanel.vue） */
/* 标题与油耗模板之间再收紧 6px：标题行是 flex 居中容器，改它的 min-height 只能挪一半
   （居中后上下平分），所以直接把这一行的 margin-top 由 4px 调到 −2px，位移 1:1。 */
.template-row { display: flex; align-items: center; gap: 6px; margin-top: -2px; }
.template-row .template-item { flex: 1 1 auto; min-width: 0; --min-height: 64px; }
/* 齿轮按钮与下拉框垂直居中：与 .ship-field 的按钮同样给固定高度，再由 flex 居中 */
.template-row ion-button { flex: none; align-self: center; height: 38px; margin: 0; --padding-start: 10px; --padding-end: 10px; }
.fuel-tip { grid-column: 1 / -1; }
/* 日油耗三行之间再收紧 6px（原先 8px → 4px 行距后仍显松散）：
   item 由 64px 缩到与控件等高的 58px，行内上下各 3px 的余量归零，
   相邻两行之间只剩 .fuel-grid 的 4px 行距（视觉上 10px → 4px）；
   .fuel-port-grid 与上面一格相接处同样少了 2×3px，因此 margin-top 保持 4px。 */
.fuel-grid { row-gap: 4px; }
.fuel-grid ion-item, .fuel-port-grid ion-item { --min-height: 58px; }
.fuel-port-grid { margin-top: 4px; }
.speed-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.speed-grid ion-item { --min-height: 64px; }
/* 4 个航速输入不再单独缩小 label：统一 17px（Ionic 的 .label-text 自带 nowrap + 省略号），
   原先这里的 13px 覆盖正是「航速那一块 label 比别处小」的原因。 */

/* 港序：空态整宽主按钮；航段面板；到离港时间；航程与油耗汇总
   （参考小程序 BudgetPortSequencePanel.vue） */
.port-empty { min-height: 150px; }
/* 空态整宽「添加港口」：与标题栏那个 clear 按钮同一个深绿强调色（见文件上方 2.1 的说明） */
.empty-add-button { width: 100%; margin: 0; --background: #0b6b45; --background-hover: #095538; --background-activated: #084b31; --color: #fff; }
.sailing-panel { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; margin-top: 10px; padding: 12px 9px; border-radius: 6px; background: #f7fafc; }
.sailing-panel .route-leg-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; overflow: visible; margin-top: 0; border: 0; border-radius: 0; background: transparent; }
.sailing-panel .route-leg-summary > div { padding: 0; background: transparent; }
.port-operation-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 0; }
/* 到港 / 离港时间：等泊列仍是 3fr:2fr，但离港列的下限抬到自己的 min-content（时间戳是
   一整个不可断行的值）。未加这个下限时，360px 下第 2 列只有 (288−8)×2/5 = 112px，
   而「2025/11/13 08:00」实测 121px → 被省略号截掉 9px（390px 下第 2 列 124px ≥ 121px，
   不受影响，仍与原来完全一致）。这个下限只在空间不够时生效：360px 下实测 159px : 121px，
   到港列需要「121px 文本 + 2px 间隙 + 28px 修改按钮 = 151px」，159px 仍然放得下。 */
.schedule-times { display: grid; grid-template-columns: minmax(0, 3fr) minmax(min-content, 2fr); gap: 8px; }
.schedule-time-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; color: #667085; font-size: 11px; }
/* 到港/离港时间 +1px（13 → 14px）：这两个值是这一行真正要看的信息 */
.schedule-time-item strong { overflow: hidden; color: #1d2939; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
/* 到港 / 离港两列的值行给同一个 28px 行高（= 首个港口那个 28×28 日期设置按钮的高度）：
   两列的行盒等高、文字都在 28px 行盒里垂直居中，两列的文字中心线才落在同一条水平线上
   （实测差 4.5px → 0）。行高写在 strong 上而不是给 strong 加 display:flex，是因为
   display:flex 会把文字包成匿名 flex item，外面那层 strong 的 text-overflow:ellipsis 会失效。
   第一港（有按钮）和后续港（无按钮）的到港时间共用这条规则，所以两种情况都能对齐。 */
.schedule-time-item strong { line-height: 28px; }
.schedule-time-item > strong { min-height: 28px; }
/* 首个港口的到港时间：日期文字 + 右侧小号修改按钮（该时间就是 store 里的 document.startAt）。
   按钮沿用航程计算页 .time-action 的 28px 带框样式（6px 圆角 + 白底），选中态的蓝色仍由 --color 给出。
   本轮两处调整：
   1) 描边 #d6e2ef（白底对比度 1.24:1，几乎看不见）→ #005f88（编辑器主色，白底 7.0:1）；
      图标 #005f88 → #00496b（同一个主色的深色档，本文件 .save-fab 的 --background-activated
      也是这个值；白底 9.7:1），16px 线性图标配 1.5px 描边更实、不再发灰。
   2) 右边距 -6px → 0：原来按钮整体向右越界 6px，它的右边框离「离港时间」的值只剩 2px（看着黏在一起）；
      改成 0 后按钮完整落在到港列内，右边框离离港列 8px（实测 2px → 8px）。
      不能再大：360px + en-US 下到港列只有 155.7px，日期「11/10/2025, 08:00」+ 2px 间隙 + 28px 按钮
      已占 154.3px，右边距给到 2px 就会把日期挤成省略号（只剩 1.4px 余量），所以 0 是能加的最大右边距。 */
.schedule-date { display: flex; align-items: center; gap: 2px; min-width: 0; }
.schedule-date strong { flex: 1 1 auto; min-width: 0; }
.schedule-edit-button { flex: none; width: 28px; min-width: 28px; height: 28px; margin: 0; --padding-start: 0; --padding-end: 0; --color: #00496b; border: 1px solid #005f88; border-radius: 6px; background: #fff; }
.route-summary-panel { margin-top: 12px; padding: 12px 10px; border-radius: 6px; background: #edf7f3; }
.route-summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.route-summary-grid > div, .route-fuel-grid > div { min-width: 0; }
.route-summary-grid span, .route-summary-grid strong, .route-fuel-grid span, .route-fuel-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-summary-grid span, .route-fuel-grid span { color: #667085; font-size: 12px; }
.route-summary-grid strong, .route-fuel-grid strong { margin-top: 4px; color: #1d2939; font-size: 14px; font-weight: 700; }
.route-fuel-summary { margin-top: 10px; padding-top: 10px; border-top: 1px solid #c9e5d9; }
/* 汇总的油耗一行只放 2 列（原来是 3 列，最后一格单独占一行显得空） */
.route-fuel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
/* 「模板名称 + 设为模板」：输入框与按钮垂直居中；按钮升一档（去掉 size="small" 用默认尺寸，
   字号 12 → 13px），整行与上方内容再收紧 4px（12 → 8px）。 */
.template-save-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.template-save-row ion-input { min-width: 0; }
.template-save-row ion-button { flex: none; align-self: center; margin: 0; font-size: 13px; }
/* ===== 「已修改 + 保存变动到模板」行（用户 1.1）=====
   占位与 .template-save-row 相同（同一区块的最后一行），所以行高向 64px 的 item 对齐；
   提示靠左用琥珀色：这是「模板有未保存改动」的提醒，不是错误（红）也不是成功（绿），
   #b45309 在白底上对比度 4.8:1，满足 WCAG AA；文字按钮靠右，用 fill="clear"（模板里给的），
   这里只收内边距并把颜色对齐到本页主色 #005f88，与上方「设为模板」同为 13px。 */
.template-dirty-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; margin-top: 8px; }
.template-dirty-hint { color: #b45309; font-size: 12px; font-weight: 600; }
.template-dirty-row ion-button.template-update-button { flex: none; align-self: center; height: 34px; margin: 0; --padding-start: 8px; --padding-end: 8px; --color: #005f88; font-size: 13px; }
.port-block, .cargo-row { padding: 13px 0; border-top: 1px solid #e7edf2; }
.port-block:first-of-type { margin-top: 8px; }
.port-heading, .cargo-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.port-title, .cargo-heading > div:first-child { min-width: 0; }
.port-title strong, .port-title span, .cargo-heading strong, .cargo-heading span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.port-title strong, .cargo-heading strong { color: #273f51; font-size: 14px; }
/* 港口名比原来大 2 号（14 → 16px）：与航程计算页港口列表的 .port-name 同字号 */
.port-title strong { font-size: 16px; }
/* 国家缩写比港口名轻一号：沿用航程计算页 .port-name small 的度量（11px / #54697a / 缩进 3px） */
.port-title strong small { margin-left: 3px; color: #54697a; font-size: 11px; font-weight: 400; }
.port-title span, .cargo-heading span { margin-top: 4px; color: #718293; font-size: 12px; }
.routing-port .port-title strong { color: #315d7b; font-style: italic; }
.port-actions, .cargo-heading > div:last-child { display: flex; flex: none; }
.port-actions ion-button, .cargo-heading ion-button { width: 30px; min-width: 30px; height: 32px; margin: -6px 0 0; --padding-start: 0; --padding-end: 0; }
/* 任务 / 满载空载 / 航速模式三个下拉同一行、不显示 label（label 已从模板移除，
   aria-label 保留可访问性）；只有「港序多于一个港口且本港是最后一个」时只剩任务可选
   （showsLegOptions），grid 天然只占 1/3 宽、其余留空。 */
.port-mode-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 4px; }
/* 无 label 的三个下拉：字号 17 → 16px（−1px），值 ↔ 下划线 −6px。
   浮动 label 的下拉里数值在控件内居中，值到下划线的距离 = (行高 − 上内边距)/2 + 余量，
   即 (行 --min-height − --padding-top)/2：原来 (64 − 6)/2 = 29px，
   把行 --min-height 64 → 52、控件 min-height 58 → 52（行内上下各 3px 余量归零）后 (52 − 6)/2 = 23px。 */
.port-mode-grid ion-item { --min-height: 52px; }
.port-mode-grid ion-select { min-height: 52px !important; font-size: 16px !important; }
.port-mode-grid ion-select::part(text) { font-size: 16px !important; }
.route-leg-summary, .route-summary, .result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; margin-top: 10px; border: 1px solid #dce7ee; border-radius: 6px; background: #dce7ee; }
.route-leg-summary > div, .route-summary > div, .result-grid > div { min-width: 0; padding: 9px; background: #f8fbfd; }
.route-leg-summary span, .route-leg-summary strong, .route-summary span, .route-summary strong, .result-grid span, .result-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.route-leg-summary span, .route-summary span, .result-grid span { color: #748697; font-size: 11px; }
.route-leg-summary strong, .route-summary strong, .result-grid strong { margin-top: 4px; color: #28475c; font-size: 13px; }
/* 航段汇总的四个数值（距离/航行时间/ECA距离/ECA航行）+1px（13 → 14px），标签仍 11px；
   只加这一条覆盖，上面的 .route-summary / .result-grid 保持 13px 不变。 */
.route-leg-summary strong { font-size: 14px; }
.fuel-leg-summary { margin-top: 10px; padding: 10px; border-radius: 6px; background: #edf7f3; color: #4c6675; font-size: 12px; }
.fuel-leg-values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; margin-top: 7px; }
/* 油品标签一行、油耗值另起一行（与其它汇总网格的「标签在上、数值在下」一致） */
.fuel-leg-item { min-width: 0; }
.fuel-leg-item span, .fuel-leg-item strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fuel-leg-item span { color: #667085; font-size: 12px; }
/* 分段油耗的数值不用粗体：字号 / 颜色不动，只把 <strong> 的默认加粗压回 400 */
.fuel-leg-item strong { margin-top: 3px; color: #1d2939; font-size: 14px; font-weight: 400; }
.port-operation-grid { margin-top: 6px; }
.port-time { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 3px 7px; padding: 8px; color: #748697; font-size: 11px; }
.port-time strong { overflow: hidden; color: #40586a; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
/* ===== 抗风浪余量分段控件在窄屏（360 / 390）内的收敛（本轮布局修复）=====
   实测（390px、md）：这一行 `.weather-margin` 是 .sailing-panel 的网格项，宽 360px，
   比面板内容区（318px）宽 42px、比面板右边线（357）超出 33px；360px 下超出 63px，
   并且把 .sailing-panel 的单列轨道一起撑到 360px —— 同一港块里的航段汇总 / 作业 /
   到离港 / 分段油耗都跟着变宽（opGrid 318 → 360、schedule 318 → 360、fuelLeg 298 → 340），
   整个页面出现 36px 横向滚动。这正是「第二个港口开始部分信息超出屏幕」的根因：
   第一个港口不渲染 .weather-margin（模板里 `index > 0`），所以只有第二港起才被撑破。
   360px 这个数字来自 Ionic 自身：md 的 ion-segment-button 带 min-width: 90px（ios 70px），
   4 个选项 × 90 = 360px 就是这一行的最小内容宽度，远大于可用的 286–318px。
   三处一起收，字号 / 按钮高度 / 选中态配色都不动：
   1) .sailing-panel 的单列显式写成 minmax(0, 1fr)：任何子项的 min-content 都不能再撑宽轨道；
   2) ion-segment 的 grid-auto-columns 从 Ionic 的 minmax(auto, 360px) 改成 minmax(0, 1fr)：
      四列仍然等宽（保持原来的视觉关系），但允许被压缩；
   3) ion-segment-button 的 min-width 归零（覆盖 md 90 / ios 70），左右内边距 16/13 → 6px：
      这两项只影响「放不下时的最小宽度」，空间够时文字依旧居中，视觉不变。
   收完实测四个选项各 79.5px（390）/ 72px（360），中文「自定义」35px、英文 Custom 均不被截断；
   自定义行里那个 150px 的两段切换同理（2 × 75px 等宽列，英文 Percent 57px 放得下）。 */
.weather-margin { margin-top: 10px; min-width: 0; }
.weather-margin > span { display: block; margin-bottom: 6px; color: #526879; font-size: 12px; }
.weather-margin ion-segment { --background: #f2f6f8; min-width: 0; grid-auto-columns: minmax(0, 1fr); }
/* ===== 选中「条」改深色（本轮 1-a）=====
   实测（390px、md、真实构建）：md 模式下 ion-segment 的指示器不是整块药丸，而是贴在按钮
   底部的 2px 细条（Ionic md 的 .segment-button-indicator：left/right 0、bottom 0，
   --indicator-height: 2px），颜色取 --indicator-color。原来是 #fff —— 白条画在 #f2f6f8 的
   浅色轨道上，对比度只有 1.09:1，等于看不见（截图里四项完全一样，只有文字颜色在提示选中）。
   现在把 --indicator-color 改成主色深蓝 #005f88，理由：
   1) 它本来就是这一行的 --color-checked，条与选中文字同色，不引入新色；
   2) 也是本页主色（.schedule-edit-button 描边、.fuel-cost-summary p、.result-formula-head span）；
   3) 与 #f2f6f8 轨道的对比度 6.46:1（白色只有 1.09:1），远超 WCAG 对非文字控件的 3:1 要求。
   文字颜色按模式分开：md 只有那条 2px 细条，文字必须继续用 #005f88（改白会在浅轨道上消失）；
   ios 的指示器是整高药丸（--indicator-height: 100%），深底上文字必须反过来用白色，
   所以只给 .ios 覆盖 --color-checked（Ionic 会把当前模式写成组件宿主上的类，md 实测为
   "md in-segment ... segment-button-checked"）。
   自定义行里的天数/百分比切换是本行的后代，同一组规则自动生效，两个分段控件保持一致。 */
.weather-margin ion-segment-button { min-height: 32px; min-width: 0; --padding-start: 6px; --padding-end: 6px; --color: #617688; --color-checked: #005f88; --indicator-color: #005f88; font-size: 11px; }
.weather-margin ion-segment-button.ios { --color-checked: #fff; }
/* 自定义余量：输入框在前、百分比/天数切换在后，两者垂直居中（单位由切换按钮本身表达）。
   切换用固定宽度（150px = 两个按钮各 75px，放得下英文 Percent / Days）：
   ion-segment 自身是 width:100%，放在 auto 列里会把整行占满、把输入框挤成 0 宽
   （与 .price-heading ion-segment 的既有写法一致，那里是 142px）。 */
.weather-custom-row { display: grid; grid-template-columns: minmax(0, 1fr) 150px; gap: 8px; align-items: center; margin-top: 8px; }
.weather-custom-row ion-segment { width: 100%; }
/* 自定义余量的「%」单位（本轮 1-b）：只在百分比模式渲染，span 与类名跟整体余量行完全一致
   （.field-unit.margin-unit，纯文本不可编辑）。这一行的输入带浮动 label：数值盒 28px 贴在
   58px 控件底部，而行高 64px（上下各多 3px 余量），所以「%」的 margin-bottom 要比整体余量行
   多那 3px。实测（390px、md，量到像素）：margin-bottom: 8px 时「%」墨迹 528–537、数值墨迹
   527–538，两者中心重合（与改动前「两个控件同心」的观感一致）；9px 会让「%」高 1px。
   对齐不能靠默认的 align-self: center：item 64px 高、数值贴在底部，居中会把「%」留在行中间。 */
.weather-custom-row .margin-unit { align-self: flex-end; margin-bottom: 8px; }
/* 加了「%」之后，flex 行里多了一个不可压缩的兄弟节点：原生 input 的自动最小宽度
   （size 默认 20 字符）在 360px + en-US 下实测 119.48px，加上「%」的 2 + 13.67px 比 item 的
   130px 宽 5.16px，「%」会越出 item 右边缘压到 8px 列间距里（zh 的 input 是 114.33px，刚好
   卡满 130px，所以只有 en 会露）。给输入框 min-width: 0 让它可以被压到 min-content 以下：
   实测 360 en 的 input 119.48 → 114.33px，「%」右边缘回到 166px = item 右边缘，与 zh 一致。
   天数模式没有这个 span，输入框照旧占满整行。 */
.weather-custom-row ion-item ion-input { min-width: 0; }
/* 本航段增加的天数 / 整体余量合计：计算提示统一绿色粗体 */
.weather-margin small { display: block; margin-top: 6px; color: #087443; font-size: 11px; font-weight: 700; }
.overall-margin { margin-top: 12px; padding: 10px; border-radius: 6px; background: #f8fbfd; }
.overall-margin h3 { margin: 0 0 8px; }
.overall-margin small { display: block; margin-top: 8px; color: #087443; font-size: 11px; font-weight: 700; }
/* 整体余量：等泊 / 作业两组并排成一行（组标题 + 模式下拉 + 数值输入，三行一组），组间 16px。
   为什么组内不再把「模式下拉 + 数值输入」并排成两列（实测 360/390 × zh-CN/en-US）：
   .overall-margin 的内容宽 360px → 286px、390px → 316px；两组并排、组间 16px 后每组只有
   135px / 150px，组内再分两列每列仅 63.5px / 71px。而下拉显示「百分比 / Percent」时，
   17px 文字本身就有 51.0px（百分比）/ 57.7px（Percent），加上下拉箭头那一档（文字框左侧固定 17px）
   后需要约 75px —— 实测两列方案在 360 下把「百分比」截掉 4px（文字 51 放进 47 的框），
   在 en 下把 Percent 截掉 11px（54 放进 47），390 en 也还差 4px。
   控件竖排后每个控件都是整组宽（135px / 150px），标题（最长 "Working margin" 12px 粗体 94.5px）
   与两种下拉文字都完整显示，而且整块还更矮：实测整个 .overall-margin 高度 360px 下
   229.6px → 208.6px、390px 下 226.6px → 206.6px（两组各占 141px 高，靠并排省掉一层）。 */
.overall-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 16px; }
.overall-group { min-width: 0; }
.overall-group-title { display: block; margin: 0 0 2px; color: #526879; font-size: 12px; font-weight: 700; }
.overall-grid { grid-template-columns: minmax(0, 1fr); gap: 4px; }
/* 2.2：模式下拉与数值输入之间的行距 8 → 4px；两行各缩 8px（56 → 48px），
   内容在行内垂直居中，因此「内容 ↔ 下划线」的间距同步由 16px → 12px
   （下拉文字 24px 高，控件宿主 44px 居中：10px + 行内余量 6 → 2px）。
   48px 仍是 ≥44px 的触摸目标，控件本身（Ionic 默认 min-height 44px）不会被压扁或裁切。 */
/* 2.5（本轮 1-c）：这两行的「数值 ↔ 下划线」仍比页面其它输入框大 7px，再收一次。
   实测（390px、md、真实构建，量到像素，口径＝数值墨迹下沿 → item 下划线首行）：
   - 参考行（日油耗满载主机、在港闲置，浮动 label，控件 58px / 数值盒 28px 贴行底）= 10px；
   - 基本信息「预算名称」= 5px（那是 "Verify Budget" 的 y/g 下伸部，同口径的参考值是 10px）；
   - 改前整体余量行：行 48px、控件 44px 且无 label，数值在 44px 里居中 → 17px。
   控件高度降不动（Ionic 默认 min-height 44px，再小就不是触摸目标），所以改为「把数值压到控件底部」：
   给原生 input 加 padding-top: 14px —— 内容盒 44 − 14 = 30px，23px 行盒在 30px 里居中，
   文字整体下移 14 / 2 = 7px，17px 正好变成 10px（实测 17 → 10，与参考行逐像素一致）。
   padding 写在原生 input 上而不是 ion-input 的 --padding-top：后者会把控件盒子缩到 30px，
   行顶 14px 变成点不到的死区；写在原生 input 上时输入框仍是整行 44px 高，点击区域不变。
   item 的 --min-height 48 → 44：控件与行高相等，居中余量（上下各 2px）归零，下划线正好落在
   数值盒底边（再省 2px）；44px 仍是 ≥44px 的触摸目标，行高只矮 4px。
   同一行的下拉一起处理（--padding-top: 14px）：否则一组里「百分比」会比「0」高 7px，
   两个控件自己先不齐。下拉文字盒 24px、内容盒 30px，实测文字墨迹下沿到线 8px（同样板子下
   数字是 10px，差在中文字形的下伸，基线位置一致）。
   md 下「%」单位是行内的 span，原本跟数值同心（看着是齐的）；数值下移后必须跟着下移，
   故 align-self: flex-end + margin-bottom: 5px：实测「%」墨迹 735–744 与「0」墨迹 735–746
   中心重合，与改动前「两者同心」的观感一致（6px 会让「%」整体上移 1px）。 */
.overall-margin .overall-grid ion-item { --min-height: 44px; }
.overall-margin .overall-grid ion-input :deep(input) { padding-top: 14px; }
.overall-margin .overall-grid ion-select { --padding-top: 14px; }
.overall-margin .overall-grid .margin-unit { align-self: flex-end; margin-bottom: 5px; }
/* 这两组控件不再带 label，因此不会命中上面的浮动标签规则（那条同时把控件字号 16 → 17px）；
   这里把 17px 补回来，数值/下拉文字与编辑器其它输入框保持同一号。 */
.overall-margin ion-input, .overall-margin ion-select { font-size: 17px !important; }
.overall-margin ion-input :deep(input), .overall-margin ion-select::part(text) { font-size: 17px !important; }
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
/* 货物小计：label 与值都比货物明细再大一号 */
.cargo-subtotal .cargo-metric > span { color: #607a8c; font-size: 13px; }
.cargo-subtotal .cargo-metric > strong { font-size: 15px; }

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
.fuel-cost-summary small { overflow-wrap: anywhere; }
.cost-readonly { display: grid; grid-template-columns: repeat(2, auto); justify-content: start; gap: 4px 10px; margin: 10px 0; color: #6d8192; font-size: 12px; }
.cost-readonly strong { color: #334f62; }
.cost-formula { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 10px; color: #587185; font-size: 12px; }
/* 费用计算组：输入 + 只读结果同一行，下面一行是代入数值的计算式（对齐小程序 .cost-calculation-group / .cost-formula-hint） */
/* 2.4 去掉「检验费行下方」与「日租金行下方」那两条淡色分割线。
   实测这两条线是本组的 border-top（1px rgb(231,238,244)，卡片整宽 27→363）：
   第一条在检验费用/其他营运费用那一排之下 12px，第二条在日租金行 + 代入算式之下 12px
   —— 正是业主指的两条淡色分割线（输入行自身的下划线是 rgba(0,0,0,.30)，颜色更深，不是「淡色」）。
   这是整组共用的整宽边框，无法只删半截，所以按组去掉：两条线恰好分别属于「日租金组」和
   「租金佣金组」。去线时 margin/padding 曾原样保留（当时只求「去线后间距不变」），
   本轮 1-d 才把这两处多余的纵向留白一起收掉（见下条）；各输入行自己的下划线（含检验费用、
   日租金、其他营运费用、固定成本）全部保持原状。 */
/* 2.5（本轮 1-d）：检验费用行 → 固定成本之间比上面几行松。
   实测（390px、md、真实构建）各行的 item 盒间距：2×2 网格内第一行 → 第二行 8px（=.field-grid
   的 gap），而第二行（检验费用/其他营运费用）→ 日租金行 24px、日租金算式 → 租金佣金行 24px、
   租金佣金算式 → 固定成本行 12px —— 多出来的正是两个 .cost-calculation-group 的
   margin-top: 12px + padding-top: 12px（那 12px 是上一轮去 border-top 时留下的：当时只为
   「去线后间距不变」而保留，去线后它纯粹是空白），以及 .cost-fixed-grid 的 margin-top: 12px。
   现在全部对齐到网格行距这一个值：8px（这一段的唯一基准，上面几行就是它）。
   实测 before → after：8（网格内）→ 8；24 → 8；24 → 8；12 → 8；
   算式提示本身与它上面那一行的 8px 间距不变（.cost-formula-hint 的 margin-top: 8px）。
   margin/padding 之外没有别的间距来源，两列网格的行对齐不受影响（只改纵向留白）。 */
.cost-calculation-group { margin-top: 8px; padding-top: 0; }
.cost-group-value { display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 0 2px; }
.cost-group-value span { color: #748697; font-size: 12px; }
.cost-group-value strong { margin-top: 4px; overflow: hidden; color: #334f62; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.cost-formula-hint { display: block; margin-top: 8px; color: #587185; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
.cost-fixed-grid { margin-top: 8px; }
.result-section { background: #f8fcff; }
.result-grid { margin-top: 10px; }
.result-grid strong.profit-positive { color: #087443 !important; }
.result-grid strong.profit-negative { color: #b42318 !important; }
/* 预算结果计算说明（弹层）：8 项，每项 = 标签 + 数值 + 表达式 + 代入明细（对齐小程序 BudgetResultFormulaPanel.vue） */
/* 2.3 说明弹层左右留白加大：内容内边距 12 → 20px（弹层其它视图仍按 .modal-content 的 12px）。
   实测 390pt 下标题/每项/明细的左边缘 12 → 20px、右边缘 378 → 370px，360pt 下内容宽 320 → 304px，
   不产生横向溢出（明细块自身 9px 内边距仍在，长公式 overflow-wrap: anywhere 不截断）。
   选择器必须带上 ion-content 与 .modal-content：.modal-content 在源码里更靠后、
   特异性相同（都是单类），只写 .result-formula-content 会被它盖回 12px。 */
ion-content.modal-content.result-formula-content { --padding-start: 20px; --padding-end: 20px; }
.result-formula-subtitle { margin: 0 0 10px; color: #718293; font-size: 12px; line-height: 1.45; }
.result-formula-item { padding: 10px 0; border-bottom: 1px solid #e7eef4; }
.result-formula-item:last-child { border-bottom: 0; }
.result-formula-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.result-formula-head strong { color: #273f51; font-size: 14px; }
.result-formula-head span { flex: none; color: #005f88; font-size: 14px; font-weight: 700; }
.result-formula-expression { margin: 6px 0 0; color: #54697a; font-size: 12px; line-height: 1.5; }
.result-formula-detail { margin: 6px 0 0; padding: 7px 9px; border-radius: 6px; background: #f1f6fa; color: #6e8192; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }

/* ===== 本页弹层标题栏在 Android（md）下扁平化 =====
   app.css 的扁平化规则只认「路由页面」的 div.ion-page（弹层是带 .ion-delegate-host 的
   delegate host，被显式排除），所以「添加港口」「货物编辑」「油耗模板」「预算结果公式」
   这些弹层在 md 下仍是 Material 的 56px 高 + 立体阴影、标题 20px/500 左对齐。
   这里按页面同款扁平化：44px、无阴影、标题 17px/600 居中。
   运行期 Ionic 会把弹层内容搬进 delegate host（上方实测 ion-header 的父节点是
   div.ion-delegate-host.ion-page，不再是 ion-modal），所以选择器锚在 .ion-delegate-host 上；
   真正限定「只作用于本组件弹层」的是 scoped 属性（它只会出现在本组件模板渲染的元素上）。 */
html.md .ion-delegate-host > ion-header.header-md,
html.md .ion-delegate-host > ion-header.header-md > ion-toolbar {
  box-shadow: none;
}

html.md .ion-delegate-host > ion-header > ion-toolbar {
  --min-height: 44px;
}

html.md .ion-delegate-host > ion-header > ion-toolbar > ion-title {
  padding-inline: 12px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0;
  text-align: center;
}

/* ===== 油耗模板弹层（列表视图 / 模板编辑视图）标题栏：本项 1.1 自己的扁平化锚点 =====
   上面那条按 .ion-delegate-host 的规则覆盖了本组件所有弹层（含油耗模板这两个视图），
   值与本块完全相同；这里再按「油耗模板」自己的 header class 锚一次，理由：
   1. 1.1 的验收只要求（也只允许）作用于油耗模板弹层，锚在自有 class 上，
      将来上面那条若被收窄（例如别的弹层要恢复 Material 头部），本弹层仍然满足；
   2. 值相同、且选择器特异性不低于上面那条（html.md + .md/.template-manager-header/.header-md +
      scoped 属性），同值时按源码顺序后者生效，不会出现「半扁平」（44px 但留着阴影）的中间态。
   数值来源：app.css 的 `html.md .ion-page:not(.ion-delegate-host) > ion-header...` 一段
   （44px / 无阴影 / 标题 17px·600·居中·左右 12px 内边距），未改动 app.css。 */
html.md ion-modal .template-manager-header.header-md,
html.md ion-modal .template-manager-header.header-md > ion-toolbar {
  box-shadow: none;
}

html.md ion-modal .template-manager-header > ion-toolbar {
  --min-height: 44px;
}

html.md ion-modal .template-manager-header > ion-toolbar > ion-title {
  padding-inline: 12px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0;
  text-align: center;
}

/* 保存/另存：页面最下方整宽按钮；底部留出悬浮保存按钮的位置与安全区 */
.editor-actions { display: grid; gap: 10px; padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px)); }
.editor-actions ion-button { height: 52px; margin: 0; --padding-top: 0; --padding-bottom: 0; }

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
/* 模板管理弹层里的小标题（日油耗 / 常用航速）：与页面版一致加粗，且与下方输入区收紧 8px。
   h3 的 margin-bottom 会与 .modal-grid 的 margin-top（10px）发生外边距合并，
   只把 margin-bottom 归零间距仍是 max(0,10)=10px，所以紧跟小标题的那一格网格单独收到 2px。 */
.modal-content h3 { margin: 14px 0 0; color: #344d60; font-size: 13px; font-weight: 700; }
.modal-content h3 + .field-grid { margin-top: 2px; }
/* 模板管理弹层里的 4 个航速：换成统一 17px 后，4 列 + 弹层 12px 内缩只剩约 70px 可用宽度，
   放不下 Ballast(Full)/Ballast(Eco)（约 85px），会被省略号截断，所以改为两列。 */
.modal-content .speed-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.modal-list { margin: 0; }
/* 油耗模板列表：右侧按钮组离容器右边界再近 16px。
   行内右侧留白原本是 native 12px（.modal-content ion-list ion-item::part(native)）
   + item-inner 12px（--inner-padding-end）= 24px；这里把 item-inner 那一段归零、
   native 收成 8px，合计 8px，即整体 −16px，按钮组仍不贴边（末位按钮自带 2px 外边距）。
   两条选择器都比共用的 .modal-content ion-list ion-item 多一个类，只命中模板列表。 */
.modal-content ion-list.template-list ion-item { --inner-padding-end: 0; }
.modal-content ion-list.template-list ion-item::part(native) { padding-inline-end: 8px; }
/* 「应用」按钮比两侧图标按钮大一号（13 → 14px）：宿主与原生按钮各写一次，
   避免 Ionic 内部的 .button-native 字号把宿主的字号吃掉。 */
.template-apply-button { font-size: 14px; }
.template-apply-button::part(native) { font-size: 14px; }
.modal-grid { margin-top: 10px; }
.three-column { grid-template-columns: repeat(3, minmax(0, 1fr)); }
/* 底部确认/保存按钮与上方输入区之间留一行空隙 */
.modal-submit { margin-top: 16px; padding: 4px 0 12px; }
/* 油耗模板弹层的整宽按钮（空态「新增模板」/ 编辑态「保存模板」）：高度与页面底部操作按钮
   （.editor-actions ion-button）一致的 52px，左右内边距也取页面按钮的实际值
   （实测 --padding-start/--padding-end: 1.1em → 原生按钮左右各 15.4px），
   「保存模板」原先只有 Ionic 默认的 36px 高。 */
.template-block-button {
  height: 52px;
  margin: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 1.1em;
  --padding-end: 1.1em;
}

/* 港口选择（「添加港口」弹层）：用 ion-item + ion-input 代替 ion-searchbar
   （后者在 iOS 高度固定 36px）。尺寸/描边/内边距与航程计算页的 .search-field 完全一致：
   46px 高、1px #cfdded 描边、8px 圆角、左内边距 12px、右侧 26px 圆形清空按钮。 */
.search-field { width: 100%; height: 46px; margin-top: 10px; --min-height: 46px; --background: #fff; --border-radius: 8px; --padding-start: 12px; --inner-padding-end: 4px; --inner-border-width: 0; border: 1px solid #cfdded; border-radius: 8px; }
.search-field svg { flex: none; color: #1d4b7f; }
.search-field ion-input { min-width: 0; --padding-top: 0; --padding-bottom: 0; --padding-start: 8px; --padding-end: 4px; }
.search-clear { display: grid; flex: none; width: 26px; height: 26px; margin-right: 4px; padding: 0; place-items: center; border: 0; border-radius: 50%; background: #eef3f8; color: #64748b; }
/* 建议列表：行度量与航程计算页的 .search-popover 一致（48px 行高、左右 14px 内边距），
   面板同样给一层 1px #d9e4ed 描边 + 8px 圆角白底。
   字号写在 item 上：Ionic 运行时注入的 `.item .sc-ion-label-ios-h { font-size: inherit }`
   与 .suggest-label[data-v-…] 同特异性、但注入时机更晚，会把 label 自己的字号盖掉
   （实测：无论 label 规则写 15 还是 16px，渲染出来的都是 item 继承来的 16px），
   所以真正的调节点是 item 的字号 —— 16 → 17px（+1）。 */
.port-results { margin-top: 10px; overflow: hidden; border: 1px solid #d9e4ed; border-radius: 8px; background: #fff; }
.modal-content ion-list.port-results ion-item { --min-height: 48px; --padding-start: 14px; --padding-end: 14px; font-size: 17px; }
.modal-content ion-list.port-results ion-item::part(native) { padding-inline-start: 14px; padding-inline-end: 14px; }
/* 建议行：港口名 + [国家名] 两段式，取航程计算页 .suggest-label / .suggest-label small 的同一套度量；
   港口名与 item 同步 +1px（16 → 17px），国家名保持 14px 的「轻一档」对比关系不变。 */
.suggest-label { overflow: hidden; color: #243748; font-size: 17px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.suggest-label small { margin-left: 4px; color: #6e8192; font-size: 14px; font-weight: 400; }

/* 货物编辑：货物收入行 + 三列佣金金额行（参考小程序 BudgetCargoEditorSheet.vue） */
.cargo-port-hint { margin: 8px 0 0; }
.cargo-calculated { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding: 8px 10px; border-radius: 4px; background: #f2f7fc; }
.cargo-calculated span { color: #475467; font-size: 13px; }
.cargo-calculated strong { color: #0058a2; font-size: 15px; font-weight: 700; }
.charge-field { min-width: 0; }
.charge-calculated { display: flex; align-items: center; justify-content: space-between; gap: 3px; min-height: 27px; margin-top: 6px; padding: 0 5px; border-radius: 3px; background: #f2f7fc; }
.charge-calculated span { overflow: hidden; color: #667085; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.charge-calculated strong { color: #0058a2; font-size: 13px; font-weight: 700; }
/* 三列佣金/税费输入：% 已经从 label 移到 item 内的单位槽位（与 EstiDeployCargoPage 写法一致），
   窄列里 label 不再被省略号截断；单位跟随输入框垂直居中。 */
.modal-grid .charge-field .field-unit { margin-inline-start: 4px; padding-inline-end: 0; font-size: 13px; }

/* 到港时间（航次开始时间）底部 sheet：顶部 5px 处有抓手（.modal-handle），
   给日历留出一点上边距，避免月份标题压到状态栏。
   高度预算（实测，854/667/640 三档视口 × zh-CN/en-US × md/ios × +8% 字号）：
   sheet 可见高度 = breakpoint 0.9 × (视口 − 安全区 − 10px) → 844 下 750.6px、667 下 591.3px、
   640 下 567px；ion-datetime 自身内容高度 md 456px / ios 350px，en-US 且字号 +8% 时 md 504px。
   最紧的一档（640 视口 + en-US + 字号 +8%）仍有 63px 余量，日历网格（.calendar-body）在各档
   实测都是 260px(md)/165px(ios)、从未被压缩，所以这里的 10px 上边距可以保留；
   真正会导致「只有星期和时间、没有日期」的是组件自身的 ready/滚动条状态，见模板里 sheet 的注释。 */
.start-at-sheet ion-datetime { padding-top: 10px; }

/* ===== ion-select 弹层（本页自己的 cssClass，见 script 里的 selectInterfaceOptions）=====
   弹层挂在 document 上、不在组件 DOM 子树里，scoped 的属性选择器命中不到，
   所以整条选择器用 :global() 包住；只认 .editor-select-popover，
   app.css 里全局共享的 .tz-select-popover（航程计算页时区下拉）保持原样不动。
   选项字号 13 → 15px（+2），并保留 tz 版本「跟随内容宽度 + 不省略」的行为。 */
:global(.editor-select-popover) { --max-width: 92vw; }
:global(.editor-select-popover ion-item) { --min-height: 40px; font-size: 15px; }
:global(.editor-select-popover ion-label) { overflow: visible; font-size: 15px; text-overflow: clip; white-space: nowrap; }

/* 「添加港口」弹层里的任务类型下拉：选项字号 15 → 16px。
   只有这一个下拉带 editor-select-popover-lg（见 script 里的 taskSelectInterfaceOptions），
   规则写在共享规则之后，同特异性下后者生效，其余编辑器下拉仍是 15px。 */
:global(.editor-select-popover.editor-select-popover-lg ion-item) { --min-height: 42px; font-size: 16px; }
:global(.editor-select-popover.editor-select-popover-lg ion-label) { font-size: 16px; }

/* 选中项：Ionic 给选中行加 .item-radio-checked（ios / md 都一样），但默认选中行与未选中行的
   文字颜色完全相同（实测都是 --color: #172b3a），只能靠右侧那个小圆点区分。这里把选中行的
   文字与勾选图标一起换成编辑器主色 #005f88 并加粗：在弹层底色 #f5f7fa 上对比度 6.6:1，
   比未选中行更醒目，也不会被底色吃掉。 */
:global(.editor-select-popover .select-interface-option.item-radio-checked) { --color: #005f88; font-weight: 600; }
:global(.editor-select-popover .select-interface-option.item-radio-checked),
:global(.editor-select-popover .select-interface-option.item-radio-checked ion-label) { color: #005f88; }
:global(.editor-select-popover .select-interface-option.item-radio-checked ion-radio) { --color-checked: #005f88; }

@media (min-width: 640px) {
  .budget-editor { max-width: 760px; margin: 0 auto; }
  .sailing-panel .route-leg-summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .route-leg-summary, .route-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .result-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
