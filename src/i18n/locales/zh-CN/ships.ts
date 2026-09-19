// 船舶规范
export default {
  // 列表页
  list: {
    title: '船舶规范',
    emptyTitle: '尚未添加船舶规范',
    emptyHint: '添加船型基础信息后，可以在航次预算中关联船舶。',
    meta: '{flag} · {type} · {year} 年',
    dimensions: 'DWT {dwt} t · {length} m × {breadth} m',
  },
  // 新增 / 编辑
  addTitle: '新增船舶规范',
  editTitle: '编辑船舶规范',
  basicInfo: '基本信息',
  shipName: '船名',
  shipNamePlaceholder: '请输入船名',
  flag: '船旗',
  flagPlaceholder: '例如：CN',
  shipType: '船型',
  shipTypePlaceholder: '请输入船型',
  buildYear: '建造年份',
  tonnage: '吨位与尺度',
  dwt: '载重吨 DWT（MT）',
  dwcc: '载货吨（MT）',
  grt: '总吨 GRT',
  nrt: '净吨 NRT',
  length: '船长（m）',
  breadth: '型宽（m）',
  depth: '型深（m）',
  draft: '满载吃水（m）',
  // 校验与提示
  nameRequired: '请输入船名',
  flagRequired: '请输入船旗',
  typeRequired: '请输入船型',
  buildYearInvalid: '请输入有效建造年份',
  dimensionsRequired: '请完整填写吨位与尺度',
  loadFailed: '船舶规范加载失败',
  saved: '船舶规范已保存',
}
