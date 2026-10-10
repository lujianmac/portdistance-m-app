// Map workspace
export default {
  workspace: {
    distanceRequired: '먼저 거리 계산을 완료해 주세요',
    routeEditHint: '항로점을 탭하면 설정할 수 있습니다',
    routeLoadFailed: '항로점을 불러오지 못했습니다',
    turnEditHint: '1. 변침점을 탭하면 원하는 위치로 드래그할 수 있습니다\n2. 변침점을 더블 탭하면 편집하거나 삭제할 수 있습니다\n3. 항로를 탭하면 변침점을 추가할 수 있습니다',
    recalcFailed: '거리 재계산에 실패했습니다',
    turnUpdateFailed: '변침점 업데이트에 실패했습니다',
    noEditableRoutePoint: '편집할 수 있는 항로점이 없습니다',
    clearTitle: '항로 지우기',
    clearMessage: '항구, 항로 및 현재 계산 결과가 모두 지워집니다.',
  },
  // Route point editor
  routePoint: {
    title: '항로점 설정',
    optionRequired: '경유 필수',
    optionAllowed: '경유 허용',
    optionForbidden: '경유 금지',
    prePortLabel: '이전 항구 선택',
    prePortPlaceholder: '항구를 선택하세요',
  },
  // Turn point editor
  turnPoint: {
    createTitle: '변침점 추가',
    editTitle: '변침점 편집',
    longitude: '경도',
    latitude: '위도',
    invalidCoordinate: '올바른 경도와 위도를 입력하세요',
    deleteLockedHint: '직접 추가한 변침점만 삭제할 수 있습니다',
  },
}
