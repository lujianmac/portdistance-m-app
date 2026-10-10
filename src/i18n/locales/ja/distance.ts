// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: '航程計算',
  },
  // Port search
  search: {
    portPlaceholder: '港を検索',
    noSuggestions: '候補がありません',
  },
  // Recently entered ports
  recentPorts: {
    title: '最近の入力',
    ariaLabel: '最近入力した港',
    clear: '最近の入力をクリア',
    close: '最近の入力を閉じる',
    empty: '最近の入力はありません',
  },
  // Speed and route actions
  route: {
    speedLabel: '速力',
    calculating: '計算中…',
    getDistance: '航程を取得',
    clearDistance: '航路をクリア',
    clearAll: 'すべてクリア',
    emptyHint: '上の検索ボックスに港名を入力して航程計算を開始してください',
    moveUp: '港を上へ移動',
    moveDown: '港を下へ移動',
    remove: '港を削除',
    originPort: '出発港',
  },
  // Recent calculations
  recentCalculations: {
    title: '最近の計算',
    summary: '合計 (ECA) {distance} ({eca}) NM · 航行 {days} 日 ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: '合計 (ECA) {distance} ({eca}) NM · {days} 日 ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: '航程サマリー',
    totalDistance: 'TTL Distance',
    eca: 'ECAs',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: ' 日 ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: '航程時間',
    departureTime: '出港時間',
    arrivalTime: '入港時間',
    editDeparture: '出港時間を設定',
    timeZoneSettings: 'タイムゾーン設定',
    setTimeZone: 'タイムゾーンを設定',
    modalTitle: '航程時間の設定',
    departureTimeZone: '出港地のタイムゾーン',
    arrivalTimeZone: '入港地のタイムゾーン',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: '結果をコピー',
    copyImage: '画像をコピー',
    imageCopied: '画像をコピーしました',
    viewMap: '地図を表示',
    budgetAction: '航海採算を作成',
    copied: '計算結果をコピーしました',
    cardSketchNote: '航路イメージ図（参考用）',
    cardTagline: '航程計算 · 航海採算',
    title: 'PortDistance',
    routeLine: '航路：{route}',
    distanceLine: '距離：{distance} NM',
    distanceLineWithEca: '距離：{distance} NM（ECA：{eca}）',
    recentDistanceLine: '距離：{distance}（ECA：{eca}）NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: '航行：{days} 日（{speed} kn）',
  },
  // Coordinate input
  coordinate: {
    title: '座標入力',
    modeDecimal: '十進度',
    modeDms: '度分秒',
    longitude: '経度',
    latitude: '緯度',
    longitudePlaceholder: '-180〜180',
    latitudePlaceholder: '-90〜90',
    degree: '度',
    minute: '分',
    second: '秒',
    longitudeDegreePlaceholder: '0〜180',
    latitudeDegreePlaceholder: '0〜90',
    minutePlaceholder: '0〜59',
    secondPlaceholder: '0〜59',
    direction: '方位',
    east: '東',
    west: '西',
    north: '北',
    south: '南',
    invalid: '有効な経度と緯度を入力してください。',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: '航程結果が寄港順と一致しません',
    noRoutePoints: '航程計算で有効な航路が返されませんでした',
    calculateFailed: '航程計算に失敗しました',
  },
}
