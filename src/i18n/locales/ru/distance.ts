// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: 'Дистанция',
  },
  // Port search
  search: {
    portPlaceholder: 'Поиск порта',
    noSuggestions: 'Нет подсказок',
  },
  // Recently entered ports
  recentPorts: {
    title: 'Недавние порты',
    ariaLabel: 'Недавно введённые порты',
    clear: 'Очистить недавние порты',
    close: 'Закрыть недавние порты',
    empty: 'Нет недавних портов',
  },
  // Speed and route actions
  route: {
    speedLabel: 'Скорость',
    calculating: 'Расчёт…',
    getDistance: 'Рассчитать',
    clearDistance: 'Очистить расстояние',
    clearAll: 'Очистить всё',
    emptyHint: 'Чтобы начать расчёт рейса, введите название порта в строке поиска выше',
    moveUp: 'Переместить порт вверх',
    moveDown: 'Переместить порт вниз',
    remove: 'Удалить порт',
    originPort: 'Отправление',
  },
  // Recent calculations
  recentCalculations: {
    title: 'Недавние расчёты',
    summary: 'Всего (ECA) {distance} ({eca}) NM · В море {days} дн. ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: 'Всего (ECA) {distance} ({eca}) NM · {days} дн. ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: 'Сводка по расстоянию',
    totalDistance: 'TTL Distance',
    eca: 'ECAs',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: ' дн. ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: 'Время рейса',
    departureTime: 'Время отхода',
    arrivalTime: 'Время прихода',
    editDeparture: 'Задать время отхода',
    timeZoneSettings: 'Настройки часовых поясов',
    setTimeZone: 'Задать часовой пояс',
    modalTitle: 'Настройки времени рейса',
    departureTimeZone: 'Часовой пояс отхода',
    arrivalTimeZone: 'Часовой пояс прихода',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: 'Копировать результат',
    copyImage: 'Копировать изображение',
    imageCopied: 'Изображение скопировано',
    viewMap: 'Открыть карту',
    budgetAction: 'Создать бюджет рейса',
    copied: 'Результат расчёта скопирован',
    cardSketchNote: 'Схема маршрута, только для справки',
    cardTagline: 'Дистанция рейса · Бюджет рейса',
    title: 'PortDistance',
    routeLine: 'Маршрут: {route}',
    distanceLine: 'Расстояние: {distance} NM',
    distanceLineWithEca: 'Расстояние: {distance} NM (ECA: {eca})',
    recentDistanceLine: 'Расстояние: {distance} (ECA: {eca}) NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: 'В море: {days} дн. ({speed} kn)',
  },
  // Coordinate input
  coordinate: {
    title: 'Ввод координат',
    modeDecimal: 'Десятичные градусы',
    modeDms: 'Градусы, минуты, секунды',
    longitude: 'Долгота',
    latitude: 'Широта',
    longitudePlaceholder: 'от -180 до 180',
    latitudePlaceholder: 'от -90 до 90',
    degree: 'Град.',
    minute: 'Мин.',
    second: 'Сек.',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: 'Напр.',
    east: 'В',
    west: 'З',
    north: 'С',
    south: 'Ю',
    invalid: 'Введите корректные значения долготы и широты',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: 'Результат маршрута не соответствует последовательности портов',
    noRoutePoints: 'Расчёт расстояния не вернул корректный маршрут',
    calculateFailed: 'Не удалось рассчитать расстояние',
  },
}
