// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: '거리 계산',
  },
  // Port search
  search: {
    portPlaceholder: '항구 검색',
    noSuggestions: '추천 항구 없음',
  },
  // Recently entered ports
  recentPorts: {
    title: '최근 입력 항구',
    ariaLabel: '최근 입력한 항구',
    clear: '최근 입력 항구 지우기',
    close: '최근 입력 항구 닫기',
    empty: '최근 입력한 항구가 없습니다',
  },
  // Speed and route actions
  route: {
    speedLabel: '속력',
    calculating: '계산 중…',
    getDistance: '거리 계산',
    clearDistance: '거리 지우기',
    clearAll: '전체 지우기',
    emptyHint: '위 검색창에 항구명을 입력하여 항해 거리 계산을 시작하세요',
    moveUp: '항구 위로 이동',
    moveDown: '항구 아래로 이동',
    remove: '항구 삭제',
    originPort: '출발항',
  },
  // Recent calculations
  recentCalculations: {
    title: '최근 항해 계산',
    summary: '전체(ECA) {distance} ({eca}) NM · 항해 {days}일 ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: '전체(ECA) {distance} ({eca}) NM · {days}일 ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: '거리 요약',
    totalDistance: 'TTL Distance',
    eca: 'ECA',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: '일 ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: '항해 시간',
    departureTime: '출항 시간',
    arrivalTime: '입항 시간',
    editDeparture: '출항 시간 설정',
    timeZoneSettings: '시간대 설정',
    setTimeZone: '시간대 설정',
    modalTitle: '항해 시간 설정',
    departureTimeZone: '출항 시간대',
    arrivalTimeZone: '입항 시간대',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: '결과 복사',
    copyImage: '이미지 복사',
    imageCopied: '이미지를 복사했습니다',
    viewMap: '지도 보기',
    budgetAction: '항차 예산 산출',
    copied: '계산 결과를 복사했습니다',
    cardSketchNote: '항로 개요도, 참고용',
    cardTagline: '항해 거리 · 항차 예산',
    title: 'PortDistance',
    routeLine: '항로: {route}',
    distanceLine: '거리: {distance} NM',
    distanceLineWithEca: '거리: {distance} NM (ECA: {eca})',
    recentDistanceLine: '거리: {distance} (ECA: {eca}) NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: '항해: {days}일 ({speed} kn)',
  },
  // Coordinate input
  coordinate: {
    title: '좌표 입력',
    modeDecimal: '십진수 도',
    modeDms: '도분초',
    longitude: '경도',
    latitude: '위도',
    longitudePlaceholder: '-180 ~ 180',
    latitudePlaceholder: '-90 ~ 90',
    degree: '도',
    minute: '분',
    second: '초',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: '방향',
    east: '동',
    west: '서',
    north: '북',
    south: '남',
    invalid: '올바른 경도와 위도를 입력하세요.',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: '항로 결과가 항구 순서와 일치하지 않습니다',
    noRoutePoints: '거리 계산에서 유효한 항로가 반환되지 않았습니다',
    calculateFailed: '거리 계산에 실패했습니다',
  },
}
