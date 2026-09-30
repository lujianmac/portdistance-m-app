// 地图工作区
export default {
  workspace: {
    distanceRequired: '请先获取航程',
    routeEditHint: '点击路由点进行设置',
    routeLoadFailed: '路由点加载失败',
    turnEditHint: '1. 单击转向点，可以拖动转向点到指定位置\n2. 双击转向点，可以编辑或删除转向点\n3. 单击航线，可以添加转向点',
    recalcFailed: '航程重算失败',
    turnUpdateFailed: '转向点更新失败',
    noEditableRoutePoint: '未加载到可编辑路由点',
    clearTitle: '清除航程',
    clearMessage: '将清除港口、航线和本次计算结果。',
  },
  // 路由点编辑弹窗
  routePoint: {
    title: '路由点设置',
    optionRequired: '必须经过',
    optionAllowed: '允许经过',
    optionForbidden: '禁止经过',
    prePortLabel: '选择前置港口',
    prePortPlaceholder: '请选择港口',
  },
  // 转向点编辑弹窗
  turnPoint: {
    createTitle: '新增转向点',
    editTitle: '编辑转向点',
    longitude: '经度',
    latitude: '纬度',
    invalidCoordinate: '请输入有效的经纬度',
    deleteLockedHint: '只能删除自己新增的转向点',
  },
}
