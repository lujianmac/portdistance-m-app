// Map workspace
export default {
  workspace: {
    distanceRequired: 'Сначала выполните расчёт рейса',
    routeEditHint: 'Нажмите на точку маршрута, чтобы настроить её',
    routeLoadFailed: 'Не удалось загрузить точки маршрута',
    turnEditHint: '1. Нажмите на точку поворота и перетащите её в нужное место\n2. Дважды нажмите на точку поворота, чтобы изменить или удалить её\n3. Нажмите на линию маршрута, чтобы добавить точку поворота',
    recalcFailed: 'Не удалось пересчитать расстояние',
    turnUpdateFailed: 'Не удалось обновить точку поворота',
    noEditableRoutePoint: 'Не найдено точек маршрута, доступных для редактирования',
    clearTitle: 'Очистить маршрут',
    clearMessage: 'Будут удалены порты, маршрут и текущие результаты расчёта.',
  },
  // Route point editor
  routePoint: {
    title: 'Настройки точки маршрута',
    optionRequired: 'Проход обязателен',
    optionAllowed: 'Проход разрешён',
    optionForbidden: 'Проход запрещён',
    prePortLabel: 'Выберите предыдущий порт',
    prePortPlaceholder: 'Выберите порт',
  },
  // Turn point editor
  turnPoint: {
    createTitle: 'Добавить точку поворота',
    editTitle: 'Изменить точку поворота',
    longitude: 'Долгота',
    latitude: 'Широта',
    invalidCoordinate: 'Введите корректные значения долготы и широты',
    deleteLockedHint: 'Удалять можно только добавленные вами точки поворота',
  },
}
