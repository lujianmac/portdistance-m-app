// PDF 航次预算报告
export default {
  // 报告标题 / 页眉 / 分享标题
  title: 'PortDistance 航次预算',
  subtitle: '航次预算报告',
  shareTitle: 'PortDistance 航次预算',

  // 区块标题
  section: {
    rotation: '港序与航程',
    cargo: '货物与收入',
    fuel: '燃油与费用',
    result: '预算结果',
    portDetail: '港口明细',
  },

  // 字段行
  field: {
    budgetName: '预算名称：{name}',
    shipName: '船舶：{name}',
    generatedAt: '生成时间：{value}',
    route: '航线：{value}',
    totalDistance: '总航程：{value} 海里',
    ecaDistance: 'ECA 航程：{value} 海里',
    sailingDays: '航行天数：{value} 天',
    voyageDays: '航次天数：{value} 天',
    mainEngineFuel: '主机日油耗：满载 {laden} 吨，空载 {ballast} 吨',
    fuelPrices: '油价：LSFO {lsfo}，HSFO {hsfo}，MGO {mgo}',
    fuelCost: '燃油费用：{value}',
    portCharge: '港口使费：{value}',
    hirePerDay: '日租金：{value}',
    totalIncome: '总收入：{value}',
    netIncome: '净收入：{value}',
    operatingCost: '营运成本：{value}',
    totalExpense: '总费用：{value}',
    operatingProfit: '经营利润：{value}',
    netProfit: '净利润：{value}',
    hirePerDayLevel: '日租金水平：{value}',
    dailyProfit: '日均利润：{value}',
  },

  // 明细行（`|` 用字面量插值转义，避免被当成复数分隔符）
  cargoLine: '{index}. {name}：{quantity} 吨 x {freight} = {income}',
  portLine: "{index}. {name} {'|'} {task} {'|'} {distance} 海里 {'|'} {days} 天",

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
    budgetName: '未命名预算',
    cargoName: '未命名货物',
    noCargo: '未设置货物',
    generatedAt: '未记录时间',
  },

  // 错误提示
  error: {
    canvas: '当前设备无法创建 PDF 报告画布',
  },
}
