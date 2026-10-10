// Map workspace
export default {
  workspace: {
    distanceRequired: '先に航程を取得してください',
    routeEditHint: '航路点をタップして設定します',
    routeLoadFailed: '航路点の読み込みに失敗しました',
    turnEditHint: '1. 変針点をタップして、指定の位置までドラッグします\n2. 変針点をダブルタップすると、編集または削除できます\n3. 航路線をタップすると、変針点を追加できます',
    recalcFailed: '航程の再計算に失敗しました',
    turnUpdateFailed: '変針点の更新に失敗しました',
    noEditableRoutePoint: '編集可能な航路点が読み込まれませんでした',
    clearTitle: '航程をクリア',
    clearMessage: '港、航路、および今回の計算結果をクリアします。',
  },
  // Route point editor
  routePoint: {
    title: '航路点の設定',
    optionRequired: '必ず通過',
    optionAllowed: '通過可',
    optionForbidden: '通過不可',
    prePortLabel: '前の港を選択',
    prePortPlaceholder: '港を選択',
  },
  // Turn point editor
  turnPoint: {
    createTitle: '変針点を追加',
    editTitle: '変針点を編集',
    longitude: '経度',
    latitude: '緯度',
    invalidCoordinate: '有効な経度と緯度を入力してください',
    deleteLockedHint: '追加した変針点のみ削除できます',
  },
}
