// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: 'Distance calculation',
  },
  // Port search
  search: {
    portPlaceholder: 'Enter port name',
    noSuggestions: 'No suggestions',
  },
  // Recently entered ports
  recentPorts: {
    title: 'Recent ports',
    ariaLabel: 'Recently entered ports',
    clear: 'Clear recent ports',
    close: 'Close recent ports',
    empty: 'No recent ports',
  },
  // Speed and route actions
  route: {
    speedLabel: 'Speed',
    calculating: 'Calculating…',
    getDistance: 'Get Distance',
    clearDistance: 'Clear Distance',
    clearAll: 'Clear All',
    emptyHint: 'Start voyage calculation by entering port name in the search box above',
    moveUp: 'Move port up',
    moveDown: 'Move port down',
    remove: 'Remove port',
    originPort: 'Origin',
    segment: '{distance} nm · {days} days',
  },
  // Recent calculations
  recentCalculations: {
    title: 'Recent calculations',
    summary: 'Total (ECA) {distance} ({eca}) nm · Sailing {days} days ({speed} knots)',
  },
  // Distance summary
  summary: {
    ariaLabel: 'Distance summary',
    totalDistance: 'Total distance',
    eca: 'ECAs',
    ecaWithRate: 'ECAs ({rate}%)',
    sailingTime: 'Sailing time',
  },
  // Voyage time
  schedule: {
    ariaLabel: 'Voyage time',
    departureTime: 'Departure time',
    editDeparture: 'Set departure time',
    timeZoneSettings: 'Time zone settings',
    setTimeZone: 'Set time zone',
    modalTitle: 'Voyage Time Settings',
    departureTimeZone: 'Departure time zone',
    arrivalTimeZone: 'Arrival time zone',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: 'Copy Result',
    viewMap: 'View Map',
    budgetAction: 'Create a Voyage Estimation',
    copied: 'Calculation result copied',
    title: 'PortDistance Route',
    routeLine: 'Route: {route}',
    distanceLine: 'Distance: {distance} nm',
    distanceLineWithEca: 'Distance: {distance} nm (ECA: {eca})',
    recentDistanceLine: 'Distance: {distance} (ECA: {eca}) nm',
    timeLine: 'Time: {days} days at {speed} kn',
  },
  // Coordinate input
  coordinate: {
    title: 'Coordinate Input',
    modeDecimal: 'Decimal Degrees',
    modeDms: 'Degrees Minutes Seconds',
    longitude: 'Longitude',
    latitude: 'Latitude',
    longitudePlaceholder: '-180 to 180',
    latitudePlaceholder: '-90 to 90',
    degree: 'Deg',
    minute: 'Min',
    second: 'Sec',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: 'Dir',
    east: 'East',
    west: 'West',
    north: 'North',
    south: 'South',
    invalid: 'Enter a valid longitude and latitude.',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: 'Route result does not match the port sequence',
    noRoutePoints: 'The distance calculation did not return a valid route',
    calculateFailed: 'Distance calculation failed',
  },
}
