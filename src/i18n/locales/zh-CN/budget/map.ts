// 航次预算地图页
export default {
  // 页面标题
  title: {
    edit: '编辑预算航线',
    readonly: '预算航线地图',
  },
  // 空状态
  empty: {
    title: '尚未获取航程',
    description: '请先在预算编辑页完成港序与航程计算。',
    action: '编辑预算',
  },
  // 加载与提示
  updating: '正在更新预算航线...',
  updated: '预算航线已更新，请返回保存预算',
  geometryUpdated: '航线已更新，请返回保存预算',
  updateFailed: '预算航线更新失败',
  // 地图工作区提示
  workspace: {
    distanceRequired: '请先获取航程',
    routeEditHint: '点击路由点进行设置',
    routeLoadFailed: '路由点加载失败',
    turnEditHint: '拖动或点击转向点进行编辑',
    turnUpdateFailed: '转向点更新失败，请重新选择航线',
    turnDeleteNotAllowed: '该转向点不能删除',
    noEditableRoutePoint: '未加载到可编辑路由点',
  },
}
