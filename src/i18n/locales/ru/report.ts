// PDF voyage budget report — English-based copy, translated values pending
export default {
  // Title / header / share title
  title: 'PortDistance Voyage Estimation',
  subtitle: 'Voyage Estimation Report',
  shareTitle: 'PortDistance Voyage Estimation',

  // Section headings (order: cargo → daily fuel consumption and speed → port rotation → fuel prices and consumption → expenses → estimation results)
  section: {
    cargo: 'Cargo',
    fuelSpeed: 'Daily fuel consumption and speed',
    rotation: 'Port rotation',
    fuelPrices: 'Fuel prices and fuel consumption',
    cost: 'Expenses',
    result: 'Estimation results',
  },

  // Header rows
  field: {
    budgetName: 'Estimation name: {name}',
    shipName: 'Vessel: {name}',
    generatedAt: 'Generated at: {value}',
  },

  // Cargo
  cargo: {
    item: 'Cargo {index}',
    route: 'Load / discharge ports',
    routeValue: '{load} -> {discharge}',
    quantityRateIncome: 'Quantity / Freight rate / Income',
    quantityValue: '{value} t',
    freightValue: '{value} /t',
    charges: 'Add. Comm / Brokerage / Freight tax',
    chargeValue: '{rate}% · {amount}',
    demurrageDispatch: 'Demurrage / Dispatch',
    subtotal: 'Cargo subtotal',
    income: 'Income',
    addComm: 'Add. Comm',
    brokerage: 'Brokerage',
    tax: 'Freight tax',
    demurrage: 'Demurrage',
    dispatch: 'Dispatch',
  },

  // Daily fuel consumption and speed
  fuelSpeed: {
    mainLaden: 'Main(Laden)',
    mainBallast: 'Main(Ballast)',
    seaAuxiliary: 'Sub',
    portIdle: 'Port Idle',
    portWorking: 'Port Work',
    ballastFull: 'Ballast(Full)',
    ballastEco: 'Ballast(Eco)',
    ladenFull: 'Laden(Full)',
    ladenEco: 'Laden(Eco)',
    tonnesPerDayValue: '{value} t/day',
    knotsValue: '{value} kn',
  },

  // Port rotation
  rotation: {
    route: 'Route',
    startAt: 'Start time',
    summary: 'Voyage summary',
    summaryDistance: 'Total distance {value} NM',
    summaryEcaDistance: 'ECA distance {value} NM',
    summarySeaDays: 'Sea(Days) {value}',
    summaryEcaDays: 'ECA Sea (Days) {value}',
    summaryPortDays: 'Port(I/W) Days {value}',
    summaryVoyageDays: 'Voyage days {value}',
    margin: 'Overall port margin',
    marginIdle: 'Waiting for berth {value} days',
    marginWorking: 'Working {value} days',
    marginExtra: 'Extra LSDO/MGO {value} t',
    port: 'Port {index}',
    waypoint: 'Waypoint',
    laden: 'Laden',
    ballast: 'Ballast',
    eco: 'Eco',
    full: 'Full',
    leg: 'Leg',
    legDistance: '{value} NM',
    legSeaDays: 'Sea(Days) {value}',
    legEcaDistance: 'ECA distance {value} NM',
    legEcaSeaDays: 'ECA Sea (Days) {value}',
    legWeatherMargin: 'Weather margin {value} days',
    portFuel: 'Fuel consumption at this port',
    legFuel: 'Fuel consumption on this leg',
    fuelPortIdle: 'LSDO/MGO(idle) {value} t',
    fuelPortWorking: 'LSDO/MGO(working) {value} t',
    fuelLegMain: '{type} {value} t',
    fuelLegEca: 'LSDO/MGO(ECA) {value} t',
    fuelLegAuxiliary: 'LSDO/MGO(Sub) {value} t',
    fuelLegPort: 'LSDO/MGO(in port) {value} t',
    portStay: 'In port',
    stayIdle: 'Idle {value} days',
    stayWorking: 'Working {value} days',
    stayCharge: 'Port charges {value}',
    etaEtd: 'ETA / ETD',
    etaEtdValue: '{eta} / {etd}',
  },

  // Fuel prices and fuel consumption
  fuelPrices: {
    lsfo: 'LSFO price',
    hsfo: 'HSFO price',
    mgo: 'LSDO/MGO price',
    unitPriceValue: '{value} /t',
    mainConsumption: '{type} consumption',
    consumptionValue: '{value} t',
    mgoEca: 'LSDO/MGO(ECA)',
    mgoAuxiliary: 'LSDO/MGO(Sub)',
    mgoPort: 'LSDO/MGO(in port)',
    total: 'Total fuel consumption',
  },

  // Expenses
  cost: {
    fuelCost: 'Fuel cost',
    portCharge: 'Port charges',
    holdCleaning: 'Hold cleaning',
    cev: 'Communication, entertainment and crew allowance',
    inspection: 'Inspection fees',
    otherOperating: 'Other operating expenses',
    hirePerDay: 'Hire per day',
    hire: 'Hire',
    hireCommPercent: 'Hire commission (%)',
    hireCost: 'Hire cost',
    fixedCost: 'Fixed cost',
  },

  // Estimation results
  result: {
    totalIncome: 'Total income',
    netIncome: 'Net income',
    operatingCost: 'Operating cost',
    totalExpense: 'Total expenses',
    operatingProfit: 'Operating profit',
    netProfit: 'Net profit',
    hirePerDayLevel: 'Hire level per day',
    dailyProfit: 'Average daily profit',
  },

  // Port task types
  task: {
    ballast: 'Ballast',
    load: 'Loading',
    discharge: 'Discharging',
    bunker: 'Bunker',
    canal: 'Canal',
    pass: 'Passing',
    routing: 'Routing',
    snug: 'Snug',
    repair: 'Repair',
    transit: 'Transit',
  },

  // Fallbacks
  fallback: {
    budgetName: 'Unnamed voyage estimation',
    cargoName: 'Unnamed cargo',
    noCargo: 'No cargo set',
    noPorts: 'No ports set',
    portName: 'Unnamed port',
    portNotSelected: 'Not selected',
  },

  // Errors
  error: {
    canvas: 'This device cannot create the PDF report canvas',
  },
}
