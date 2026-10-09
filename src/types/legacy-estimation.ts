/**
 * Voyage estimation payloads stored in `contentStr`.
 *
 * Two shapes exist and the field names are mirrored verbatim (the payload keys are
 * data, never renamed):
 *
 * - the *normal* estimation (`cargoArr` / `rotationOrderArr` / `rotationTopVO` /
 *   `fuelVO` / `incomeVO` / `costVO` / `resultVO`), written by the old app's normal
 *   estimation editor and rendered by its `EstimationView.vue`;
 * - the *version-2 old* estimation (`cargoData` / `portData` / `vesselData` /
 *   `resultData`), written by the even older editor, kept here as the fallback
 *   rendering for rows whose payload has none of the normal keys.
 */

export interface LegacyEstimationListItem {
  id: string | number
  title?: string
  shipName?: string
  createTime?: string | number
  updateTime?: string | number
  version?: string | number
}

export interface LegacyEstimationDetail extends LegacyEstimationListItem {
  contentStr?: string
}

/* ------------------------------------------------------------------ *
 * Version-2 old payload (`EstimationOldVersionView.vue` shape)         *
 * Only used as the fallback rendering when the normal keys are absent. *
 * ------------------------------------------------------------------ */

/** One row of `cargoData`. */
export interface LegacyCargoItem {
  Cargo?: string
  From?: string
  FromName?: string
  To?: string
  ToName?: string
  Quantity?: string | number
  Freight?: string | number
  Income?: string | number
  AddComm?: string | number
  AddCommRate?: string | number
  Brokerage?: string | number
  BrokerageRate?: string | number
  FrtTax?: string | number
  FrtTaxRate?: string | number
}

/** One row of `portData.portOrder`. */
export interface LegacyPortOrderItem {
  cargoUid?: string | number
  TaskType?: string | number
  TaskTypeName?: string
  taskTypeName?: string
  PortID?: string
  PortName?: string
  PortLon?: string | number
  PortLat?: string | number
  lon?: string | number
  lat?: string | number
  Distance?: string | number
  SeaDays?: string | number
  PortIdleDays?: string | number
  PortWorkDays?: string | number
  PortCharge?: string | number
  ArrivalDate?: string
  DepartureDate?: string
}

/** `portData` — rotation totals plus the per-port sequence. */
export interface LegacyPortData {
  txtTTLDays?: string | number
  marginSeaDays?: string | number
  marginIdleDays?: string | number
  marginWorkDays?: string | number
  portOrder?: LegacyPortOrderItem[]
}

/** `vesselData` — daily consumption of the vessel the estimate was made for. */
export interface LegacyVesselData {
  ShipName?: string
  FOBallast?: string | number
  FOLaden?: string | number
  FOPortIdle?: string | number
  FOPortWork?: string | number
  DOSea?: string | number
  DOPortIdle?: string | number
  DOPortWork?: string | number
}

/** `resultData` — prices, expenses and the final estimation results. */
export interface LegacyResultData {
  /** Rotation totals; the legacy screen read these from `resultData`, not `portData`. */
  SeaDays?: string | number
  PortIdleDays?: string | number
  PortWorkDays?: string | number
  FOPrice?: string | number
  FOConsumption?: string | number
  FOExpense?: string | number
  DOPrice?: string | number
  DOConsumption?: string | number
  DOExpense?: string | number
  HirePerDay?: string | number
  HireDay?: string | number
  HireComm?: string | number
  HireCommPercent?: string | number
  Demurrage?: string | number
  Dispatch?: string | number
  ILOHC?: string | number
  BallastBonus?: string | number
  OpOther?: string | number
  CEV?: string | number
  AddComm?: string | number
  Brokerage?: string | number
  FreightTax?: string | number
  PortCharge?: string | number
  HireLevelPerDay?: string | number
  TTLRevenue?: string | number
  getOpExpense?: string | number
  OpProfit?: string | number
  TTLExpense?: string | number
  Profit?: string | number
}

/** Parsed `contentStr` of a version-2 old estimation (fallback shape). */
export interface LegacyEstimationContent {
  cargoData?: LegacyCargoItem[]
  portData?: LegacyPortData
  vesselData?: LegacyVesselData
  resultData?: LegacyResultData
  /** Kept for completeness; the legacy detail screen did not read it. */
  hireData?: Record<string, unknown>
}

/* ------------------------------------------------------------------ *
 * Normal estimation payload (`EstimationView.vue` shape)               *
 * ------------------------------------------------------------------ */

/** Port reference stored inside `cargoArr[].LoadPort` / `rotationOrderArr[].port`. */
export interface LegacyNormalPortRef {
  portId?: string
  portName?: string
  fullName?: string
  countryCode?: string
  longitude?: string | number
  latitude?: string | number
  isCoordinate?: boolean
}

/** One row of `cargoArr`. */
export interface LegacyCargoItemVO {
  Cargo?: string
  LoadPort?: LegacyNormalPortRef
  DischargePort?: LegacyNormalPortRef
  Quantity?: string | number
  Freight?: string | number
  Income?: string | number
  AddComm?: string | number
  AddCommRate?: string | number
  Brokerage?: string | number
  BrokerageRate?: string | number
  /** Freight tax; the normal payload spells it `FrtTax`, not `FreightTax`. */
  FrtTax?: string | number
  FrtTaxRate?: string | number
  Demurrage?: string | number
  Dispatch?: string | number
  NetIncome?: string | number
}

/** One row of `rotationOrderArr`. */
export interface LegacyRotationOrderVO {
  taskType?: string | number
  /** An i18n key in the old app (`taskLoading`, `taskRouting`, …). */
  taskTypeName?: string
  port?: LegacyNormalPortRef
  distance?: string | number
  ecaDistance?: string | number
  speed?: string | number
  seaDays?: string | number
  ecaSeaDays?: string | number
  idleDays?: string | number
  workDays?: string | number
  portCharge?: string | number
  arrived?: string | number
  departed?: string | number
  isWayPoint?: boolean
  isLaden?: boolean
  prePortId?: string
}

/** `rotationTopVO` — rotation totals and weather margins. */
export interface LegacyRotationTopVO {
  ttlVoyDays?: string | number
  ttlSeaDays?: string | number
  ttlIdleDays?: string | number
  ttlWorkDays?: string | number
  marginSeaDays?: string | number
  marginIdleDays?: string | number
  marginWorkDays?: string | number
  isMarginPercent?: boolean
  marginSeaDaysIsLaden?: boolean
  /** When true the fuel section also renders the ECA (LSFO / LSDO) rows. */
  isUseEca?: boolean
}

/** `fuelVO` — consumption per phase and the matching fees. */
export interface LegacyFuelVO {
  foPrice?: string | number
  doPrice?: string | number
  lsfoPrice?: string | number
  lsdoPrice?: string | number
  atSeaFo?: string | number
  atPortIdleFo?: string | number
  atPortWorkFo?: string | number
  atSeaDo?: string | number
  atPortIdleDo?: string | number
  atPortWorkDo?: string | number
  atSeaEcaFo?: string | number
  atPortIdleLsfo?: string | number
  atPortWorkLsfo?: string | number
  atSeaEcaDo?: string | number
  atPortIdleLsdo?: string | number
  atPortWorkLsdo?: string | number
  totalFo?: string | number
  totalDo?: string | number
  totalEcaFo?: string | number
  totalEcaDo?: string | number
  foFee?: string | number
  doFee?: string | number
  lsfoFee?: string | number
  lsdoFee?: string | number
  totalFuelFee?: string | number
}

/** `incomeVO`. */
export interface LegacyIncomeVO {
  /** The normal payload spells freight income `frightIncome`. */
  frightIncome?: string | number
  addComm?: string | number
  brokerage?: string | number
  frtTax?: string | number
  demurrage?: string | number
  dispatch?: string | number
}

/** `costVO`. */
export interface LegacyCostVO {
  portCharge?: string | number
  ilohc?: string | number
  cev?: string | number
  inspection?: string | number
  opOther?: string | number
  hirePerDay?: string | number
  fixedCost?: string | number
  hire?: string | number
  hireCost?: string | number
  hireCommPercent?: string | number
  totalFuelFee?: string | number
  addComm?: string | number
  brokerageRate?: string | number
  frtTax?: string | number
  opCost?: string | number
}

/** `resultVO`. */
export interface LegacyResultVO {
  ttlIncome?: string | number
  netIncome?: string | number
  opExpense?: string | number
  ttlExpense?: string | number
  opProfit?: string | number
  netProfit?: string | number
  asHirePerDay?: string | number
  profitDayLevel?: string | number
}

/** Normal estimation payload, as read by `EstimationView.vue`. */
export interface LegacyNormalEstimationContent {
  cargoArr?: LegacyCargoItemVO[]
  rotationOrderArr?: LegacyRotationOrderVO[]
  rotationTopVO?: LegacyRotationTopVO
  fuelVO?: LegacyFuelVO
  incomeVO?: LegacyIncomeVO
  costVO?: LegacyCostVO
  resultVO?: LegacyResultVO
}

/** Any parsed `contentStr`: the normal shape plus the version-2 fallback keys. */
export type LegacyEstimationPayload = LegacyNormalEstimationContent & LegacyEstimationContent
