// 航程计算页、航程 store
export default {
  // 页面
  page: {
    title: '航程计算',
  },
  // 港口搜索
  search: {
    portPlaceholder: '输入港口名称',
    noSuggestions: '暂无建议',
  },
  // 最近输入港口
  recentPorts: {
    title: '最近输入',
    ariaLabel: '最近输入港口',
    clear: '清除最近输入',
    close: '关闭最近输入',
    empty: '暂无最近输入',
  },
  // 航速与航路操作
  route: {
    speedLabel: '航速',
    calculating: '计算中…',
    getDistance: '获取航程',
    clearDistance: '清除航线',
    clearAll: '清除所有',
    emptyHint: '从上方搜索框输入港口开始航程计算',
    moveUp: '上移港口',
    moveDown: '下移港口',
    remove: '删除港口',
    originPort: '起始港',
  },
  // 最近航程
  recentCalculations: {
    title: '最近航程',
    summary: '全部(ECA) {distance}({eca}) 海里 · 航行 {days} 天 ({speed} 节)',
    // 仅用于列表显示：去掉「航行」这个 label 避免换行，航行时间本身保留；复制出去的内容仍然完整
    summaryCompact: '全部(ECA) {distance}({eca}) 海里 · {days} 天 ({speed} 节)',
  },
  // 航程汇总
  summary: {
    ariaLabel: '航程汇总',
    totalDistance: '全部航程',
    eca: 'ECA',
    ecaRate: '(0.1%)',
    sailingTime: '航行时间',
    sailingTimeUnit: ' 天({speed} 节)',
  },
  // 航程时间
  schedule: {
    ariaLabel: '航程时间',
    departureTime: '离港时间',
    arrivalTime: '到港时间',
    editDeparture: '设置出发时间',
    timeZoneSettings: '时区设置',
    setTimeZone: '设置时区',
    modalTitle: '航程时间设置',
    departureTimeZone: '离港时区',
    arrivalTimeZone: '到港时区',
  },
  // 复制 / 分享 / 转预算
  share: {
    copyResult: '复制结果',
    copyImage: '复制图片',
    imageCopied: '图片已复制',
    viewMap: '查看地图',
    budgetAction: '去做个航次预算',
    copied: '计算结果已复制',
    cardSketchNote: '航线示意图，仅供参考',
    cardTagline: '航程计算 · 航次预算',
    title: 'PortDistance',
    routeLine: '航线: {route}',
    distanceLine: '距离: {distance} nm',
    distanceLineWithEca: '距离: {distance} nm (ECA: {eca})',
    recentDistanceLine: '距离: {distance} (ECA: {eca}) nm',
    // 仅用于复制/分享文本（不参与渲染）：label 用「航行」，所以单位写「天」而不是 days
    timeLine: '航行: {days} 天 ({speed} 节)',
  },
  // 坐标输入
  coordinate: {
    title: '输入坐标',
    modeDecimal: '十进制度',
    modeDms: '度分秒',
    longitude: '经度',
    latitude: '纬度',
    longitudePlaceholder: '-180 至 180',
    latitudePlaceholder: '-90 至 90',
    degree: '度',
    minute: '分',
    second: '秒',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: '方向',
    east: '东',
    west: '西',
    north: '北',
    south: '南',
    invalid: '请输入有效经纬度',
  },
  // 错误提示（distance store）
  errors: {
    legMismatch: '航程结果与港口序列不匹配',
    noRoutePoints: '航程计算未返回有效航线',
    calculateFailed: '航程计算失败',
  },
}
