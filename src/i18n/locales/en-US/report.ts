// PDF voyage budget report
export default {
  // Title / header / share title
  title: 'PortDistance Voyage Estimation',
  subtitle: 'Voyage Estimation Report',
  shareTitle: 'PortDistance Voyage Estimation',

  // Section headings
  section: {
    rotation: 'Port Rotation & Voyage',
    cargo: 'Cargo & Income',
    fuel: 'Fuel & Expenses',
    result: 'Estimation Results',
    portDetail: 'Port Details',
  },

  // Field rows
  field: {
    budgetName: 'Estimation name: {name}',
    shipName: 'Vessel: {name}',
    generatedAt: 'Generated at: {value}',
    route: 'Route: {value}',
    totalDistance: 'Total distance: {value} nm',
    ecaDistance: 'ECA distance: {value} nm',
    sailingDays: 'Sailing days: {value} days',
    voyageDays: 'Voyage days: {value} days',
    mainEngineFuel: 'Main engine daily fuel consumption: laden {laden} t, ballast {ballast} t',
    fuelPrices: 'Fuel prices: LSFO {lsfo}, HSFO {hsfo}, MGO {mgo}',
    fuelCost: 'Fuel cost: {value}',
    portCharge: 'Port charges: {value}',
    hirePerDay: 'Hire per day: {value}',
    totalIncome: 'Total income: {value}',
    netIncome: 'Net income: {value}',
    operatingCost: 'Operating cost: {value}',
    totalExpense: 'Total expenses: {value}',
    operatingProfit: 'Operating profit: {value}',
    netProfit: 'Net profit: {value}',
    hirePerDayLevel: 'Hire level per day: {value}',
    dailyProfit: 'Average daily profit: {value}',
  },

  // Detail rows (`|` is escaped as a literal so it is not parsed as a plural separator)
  cargoLine: '{index}. {name}: {quantity} t x {freight} = {income}',
  portLine: "{index}. {name} {'|'} {task} {'|'} {distance} nm {'|'} {days} days",

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
    budgetName: 'Unnamed estimation',
    cargoName: 'Unnamed cargo',
    noCargo: 'No cargo set',
    generatedAt: 'Not recorded',
  },

  // Errors
  error: {
    canvas: 'This device cannot create the PDF report canvas',
  },
}
