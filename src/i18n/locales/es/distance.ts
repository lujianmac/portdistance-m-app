// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: 'Cálculo de distancia',
  },
  // Port search
  search: {
    portPlaceholder: 'Buscar puerto',
    noSuggestions: 'Sin sugerencias',
  },
  // Recently entered ports
  recentPorts: {
    title: 'Puertos recientes',
    ariaLabel: 'Puertos introducidos recientemente',
    clear: 'Borrar puertos recientes',
    close: 'Cerrar puertos recientes',
    empty: 'Sin puertos recientes',
  },
  // Speed and route actions
  route: {
    speedLabel: 'Velocidad',
    calculating: 'Calculando…',
    getDistance: 'Obtener distancia',
    clearDistance: 'Borrar ruta',
    clearAll: 'Borrar todo',
    emptyHint: 'Introduce un puerto en el buscador de arriba para iniciar el cálculo de la travesía',
    moveUp: 'Subir puerto',
    moveDown: 'Bajar puerto',
    remove: 'Eliminar puerto',
    originPort: 'Origen',
  },
  // Recent calculations
  recentCalculations: {
    title: 'Cálculos recientes',
    summary: 'Total (ECA) {distance} ({eca}) NM · Navegación {days} días ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: 'Total (ECA) {distance} ({eca}) NM · {days} días ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: 'Resumen de distancia',
    totalDistance: 'TTL Distance',
    eca: 'ECAs',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: ' días ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: 'Tiempo de travesía',
    departureTime: 'Hora de salida',
    arrivalTime: 'Hora de llegada',
    editDeparture: 'Definir hora de salida',
    timeZoneSettings: 'Ajustes de zona horaria',
    setTimeZone: 'Definir zona horaria',
    modalTitle: 'Ajustes de tiempo de travesía',
    departureTimeZone: 'Zona horaria de salida',
    arrivalTimeZone: 'Zona horaria de llegada',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: 'Copiar resultado',
    copyImage: 'Copiar imagen',
    imageCopied: 'Imagen copiada',
    viewMap: 'Ver mapa',
    budgetAction: 'Crear una estimación de viaje',
    copied: 'Resultado del cálculo copiado',
    cardSketchNote: 'Esquema de ruta, solo como referencia',
    cardTagline: 'Cálculo de distancia · Estimación de viaje',
    title: 'PortDistance',
    routeLine: 'Ruta: {route}',
    distanceLine: 'Distancia: {distance} NM',
    distanceLineWithEca: 'Distancia: {distance} NM (ECA: {eca})',
    recentDistanceLine: 'Distancia: {distance} (ECA: {eca}) NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: 'Navegación: {days} días ({speed} kn)',
  },
  // Coordinate input
  coordinate: {
    title: 'Introducir coordenadas',
    modeDecimal: 'Grados decimales',
    modeDms: 'Grados, minutos y segundos',
    longitude: 'Longitud',
    latitude: 'Latitud',
    longitudePlaceholder: '-180 a 180',
    latitudePlaceholder: '-90 a 90',
    degree: 'Grad',
    minute: 'Min',
    second: 'Seg',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: 'Dir',
    east: 'Este',
    west: 'Oeste',
    north: 'Norte',
    south: 'Sur',
    invalid: 'Introduce una longitud y una latitud válidas.',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: 'El resultado de la ruta no coincide con la secuencia de puertos',
    noRoutePoints: 'El cálculo de distancia no devolvió una ruta válida',
    calculateFailed: 'No se pudo calcular la distancia',
  },
}
