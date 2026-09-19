export type BudgetPortTask =
  | "ballast"
  | "load"
  | "discharge"
  | "bunker"
  | "canal"
  | "pass"
  | "routing"
  | "snug"
  | "repair"
  | "transit";
export type MainFuelType = "LSFO" | "HSFO";

export interface BudgetPortRef {
  portId: string;
  portName: string;
  fullName?: string;
  countryCode?: string;
  longitude: string;
  latitude: string;
  isCoordinate?: boolean;
  isWayPoint?: boolean;
}

export interface BudgetCargo {
  id: string;
  name: string;
  loadPortId: string;
  dischargePortId: string;
  quantity: number;
  freight: number;
  income: number;
  addCommRate: number;
  brokerageRate: number;
  frtTaxRate: number;
  demurrage: number;
  dispatch: number;
}

export interface BudgetPort {
  id: string;
  port: BudgetPortRef;
  taskType: BudgetPortTask;
  isLaden: boolean;
  speedMode: BudgetSpeedMode;
  distanceNm: number;
  ecaDistanceNm: number;
  speed: number;
  seaDays: number;
  ecaSeaDays: number;
  idleDays: number;
  workDays: number;
  portCharge: number;
  weatherMarginMode: WeatherMarginMode;
  weatherMarginValue: number;
  weatherMarginDays: number;
  eta: string;
  etd: string;
}

export type WeatherMarginMode = "none" | "percent" | "days";
export type BudgetSpeedMode = "full" | "eco";

export interface BudgetSpeedProfile {
  ballastFullSpeed: number;
  ballastEcoSpeed: number;
  ladenFullSpeed: number;
  ladenEcoSpeed: number;
}

export interface BudgetFuelInput {
  ladenFuelType: MainFuelType;
  ballastFuelType: MainFuelType;
  seaLadenFuel: number;
  seaBallastFuel: number;
  seaAuxFuel: number;
  portIdleFuel: number;
  portWorkingFuel: number;
}

export interface BudgetFuelPrices {
  lsfoPrice: number;
  hsfoPrice: number;
  mgoPrice: number;
}

export interface BudgetCosts {
  hirePerDay: number;
  hireCommPercent: number;
  fixedCost: number;
  ilohc: number;
  cev: number;
  opOther: number;
  inspection: number;
}

export interface BudgetMargins {
  portIdleMode: BudgetMarginMode;
  portIdleValue: number;
  portWorkingMode: BudgetMarginMode;
  portWorkingValue: number;
  portIdleDays: number;
  portWorkingDays: number;
}

export type BudgetMarginMode = "days" | "percent";

export interface BudgetFuelLegDetail {
  arrivalPortId: string;
  portName: string;
  sailingDays: number;
  weatherMarginDays: number;
  nonEcaMainFuel: number;
  ecaMainFuel: number;
  auxiliaryFuel: number;
  portFuel: number;
  nonEcaMainFuelCost: number;
  ecaMainFuelCost: number;
  mainFuelCost: number;
  auxiliaryFuelCost: number;
}

export interface BudgetMapDistanceResult {
  resultVersion?: number | string;
  ports?: Array<{
    portId?: string;
    portCode?: string;
    distance?: number | string;
    ecaDistance?: number | string;
  }>;
  totals?: {
    distance?: number | string;
    ecaDistance?: number | string;
  };
}

export interface BudgetMapRoute {
  rawRoutePoints: Record<string, unknown>[];
  processedDistanceResult: BudgetMapDistanceResult;
}

export interface BudgetResults {
  totalDistanceNm: number;
  totalEcaDistanceNm: number;
  totalSeaDays: number;
  totalEcaSeaDays: number;
  totalIdleDays: number;
  totalWorkDays: number;
  totalVoyageDays: number;
  totalPortCharge: number;
  seaMainFuel: number;
  ecaMainFuel: number;
  seaAuxFuel: number;
  portIdleFuel: number;
  portWorkingFuel: number;
  portFuel: number;
  totalFuel: number;
  nonEcaFuelCost: number;
  ecaFuelCost: number;
  seaAuxFuelCost: number;
  portFuelCost: number;
  totalFuelCost: number;
  totalIncome: number;
  netIncome: number;
  operatingCost: number;
  totalExpense: number;
  operatingProfit: number;
  netProfit: number;
  hirePerDayLevel: number;
  dailyProfit: number;
}

export interface VoyageBudgetDocument {
  schemaVersion: 3;
  startAt: string;
  routeCalculated: boolean;
  mapRoute?: BudgetMapRoute;
  fuelTemplateId?: string;
  ports: BudgetPort[];
  cargos: BudgetCargo[];
  speeds: BudgetSpeedProfile;
  fuel: BudgetFuelInput;
  prices: BudgetFuelPrices;
  costs: BudgetCosts;
  margins: BudgetMargins;
  results: BudgetResults;
}

export interface VoyageBudgetLocalDraft {
  id: string;
  updatedAt: string;
  sourceDeployId?: number;
  name: string;
  shipId: string;
  deployDesc: string;
  document: VoyageBudgetDocument;
  mapRouteOmitted?: boolean;
}

export interface VoyageBudgetLocalDraftMeta {
  id: string;
  updatedAt: string;
  sourceDeployId?: number;
  name: string;
  routeSummary: string;
  mapRouteOmitted?: boolean;
}

export interface VoyageBudgetContent {
  schemaVersion: 3;
  dailyFuelSpeed: {
    fuel: BudgetFuelInput;
    speeds: BudgetSpeedProfile;
    templateId?: string;
  };
  portSequence: {
    startAt: string;
    routeCalculated: boolean;
    ports: BudgetPort[];
    margins: BudgetMargins;
    mapRoute?: BudgetMapRoute;
  };
  cargos: {
    cargos: BudgetCargo[];
  };
  fuelPrices: {
    prices: BudgetFuelPrices;
  };
  costs: {
    costs: BudgetCosts;
  };
}

export interface DailyFuelTemplate {
  id: number | string;
  name: string;
  seaLadenFuel: number | string;
  seaBallastFuel: number | string;
  seaAuxFuel: number | string;
  portIdleFuel: number | string;
  portWorkingFuel: number | string;
  ballastFullSpeed: number | string;
  ballastEcoSpeed: number | string;
  ladenFullSpeed: number | string;
  ladenEcoSpeed: number | string;
}

export interface VoyageBudgetListItem {
  id: number;
  name: string;
  shipId?: string;
  shipName?: string;
  deployDesc?: string;
  routeSummary?: string;
  ttlIncome?: number | string;
  ttlRevenue?: number | string;
  opCost?: number | string;
  opProfit?: number | string;
  ttlExpense?: number | string;
  netProfit?: number | string;
  hirePerDayLevel?: number | string;
  dailyProfit?: number | string;
  createTime?: string | number;
  updateTime?: string | number;
}
