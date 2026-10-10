// PDF 航次预算报告（区块/字段与微信小程序 budgetPdf.ts 对齐）
export default {
  // 报告标题 / 页眉 / 分享标题
  title: 'PortDistance 航次预算',
  subtitle: '航次预算报告',
  shareTitle: 'PortDistance 航次预算',

  // 区块标题（顺序：货物 → 日油耗与航速 → 港序 → 油价与油耗 → 费用 → 预算结果）
  section: {
    cargo: '货物',
    fuelSpeed: '日油耗与航速',
    rotation: '港序',
    fuelPrices: '油价与油耗',
    cost: '费用',
    result: '预算结果',
  },

  // 页眉信息行
  field: {
    budgetName: '预算名称：{name}',
    shipName: '船舶：{name}',
    generatedAt: '生成时间：{value}',
  },

  // 货物
  cargo: {
    item: '货物 {index}',
    route: '装卸港',
    routeValue: '{load} -> {discharge}',
    quantityRateIncome: '数量 / 运价 / 收入',
    quantityValue: '{value} t',
    freightValue: '{value} /t',
    charges: '回扣 / 经纪 / 税费',
    chargeValue: '{rate}% · {amount}',
    demurrageDispatch: '滞期费 / 速遣费',
    subtotal: '货物小计',
    income: '收入',
    addComm: '回扣',
    brokerage: '经纪',
    tax: '税费',
    demurrage: '滞期费',
    dispatch: '速遣费',
  },

  // 日油耗与航速
  fuelSpeed: {
    mainLaden: '满载主机',
    mainBallast: '空载主机',
    seaAuxiliary: '航行辅机',
    portIdle: '在港闲置',
    portWorking: '在港作业',
    ballastFull: '空载全速',
    ballastEco: '空载经济',
    ladenFull: '满载全速',
    ladenEco: '满载经济',
    tonnesPerDayValue: '{value} t/天',
    knotsValue: '{value} 节',
  },

  // 港序
  rotation: {
    route: '航线',
    startAt: '起始时间',
    summary: '航程汇总',
    summaryDistance: '总距离 {value} NM',
    summaryEcaDistance: 'ECA距离 {value} NM',
    summarySeaDays: '航行天数 {value}',
    summaryEcaDays: 'ECA天数 {value}',
    summaryPortDays: '在港天数 {value}',
    summaryVoyageDays: '航次天数 {value}',
    margin: '整体在港余量',
    marginIdle: '等泊 {value} 天',
    marginWorking: '作业 {value} 天',
    marginExtra: '额外 LSDO/MGO {value} t',
    port: '第 {index} 港',
    waypoint: '航路点',
    laden: '满载',
    ballast: '压载',
    eco: '经济',
    full: '全速',
    leg: '航程',
    legDistance: '{value} NM',
    legSeaDays: '航行天数 {value}',
    legEcaDistance: 'ECA距离 {value} NM',
    legEcaSeaDays: 'ECA航行天数 {value}',
    legWeatherMargin: '抗风浪余量 {value} 天',
    portFuel: '本港油耗',
    legFuel: '本航段油耗',
    fuelPortIdle: 'LSDO/MGO(闲置) {value} t',
    fuelPortWorking: 'LSDO/MGO(作业) {value} t',
    fuelLegMain: '{type} {value} t',
    fuelLegEca: 'LSDO/MGO(ECA) {value} t',
    fuelLegAuxiliary: 'LSDO/MGO(辅机) {value} t',
    fuelLegPort: 'LSDO/MGO(在港) {value} t',
    portStay: '在港',
    stayIdle: '闲置 {value} 天',
    stayWorking: '作业 {value} 天',
    stayCharge: '使费 {value}',
    etaEtd: 'ETA / ETD',
    etaEtdValue: '{eta} / {etd}',
  },

  // 油价与油耗
  fuelPrices: {
    lsfo: 'LSFO 单价',
    hsfo: 'HSFO 单价',
    mgo: 'LSDO/MGO 单价',
    unitPriceValue: '{value} /t',
    mainConsumption: '{type} 燃耗',
    consumptionValue: '{value} t',
    mgoEca: 'LSDO/MGO(ECA)',
    mgoAuxiliary: 'LSDO/MGO(辅机)',
    mgoPort: 'LSDO/MGO(在港)',
    total: '总燃耗',
  },

  // 费用
  cost: {
    fuelCost: '燃油费用',
    portCharge: '港口使费',
    holdCleaning: '扫舱费',
    cev: '通讯娱乐伙补',
    inspection: '检验费用',
    otherOperating: '其他营运费用',
    hirePerDay: '日租金',
    hire: '租金',
    hireCommPercent: '租金佣金(%)',
    hireCost: '租金成本',
    fixedCost: '固定成本',
  },

  // 预算结果
  result: {
    totalIncome: '总收入',
    netIncome: '净收入',
    operatingCost: '营运成本',
    totalExpense: '总费用',
    operatingProfit: '经营利润',
    netProfit: '净利润',
    hirePerDayLevel: '日租金水平',
    dailyProfit: '日均利润',
  },

  // 港口任务类型
  task: {
    ballast: '空载',
    load: '装货',
    discharge: '卸货',
    bunker: '加油',
    canal: '过运河',
    pass: '通过',
    routing: '航路',
    snug: '避风',
    repair: '修船',
    transit: '过港',
  },

  // 兜底文案
  fallback: {
    budgetName: '未命名航次预算',
    cargoName: '未命名货物',
    noCargo: '未设置货物',
    noPorts: '未设置港口',
    portName: '未命名港口',
    portNotSelected: '未选择',
  },

  // 错误提示
  error: {
    canvas: '当前设备无法创建 PDF 报告画布',
  },
}
