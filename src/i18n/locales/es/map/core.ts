// Map workspace
export default {
  workspace: {
    distanceRequired: 'Primero calcula la distancia de la travesía',
    routeEditHint: 'Toca un punto de ruta para configurarlo',
    routeLoadFailed: 'No se pudieron cargar los puntos de ruta',
    turnEditHint: '1. Toca un punto de giro para arrastrarlo a la posición deseada\n2. Toca dos veces un punto de giro para editarlo o eliminarlo\n3. Toca la línea de ruta para añadir un punto de giro',
    recalcFailed: 'No se pudo recalcular la distancia',
    turnUpdateFailed: 'No se pudo actualizar el punto de giro',
    noEditableRoutePoint: 'No se encontraron puntos de ruta editables',
    clearTitle: 'Borrar ruta',
    clearMessage: 'Se borrarán los puertos, la ruta y los resultados del cálculo actual.',
  },
  // Route point editor
  routePoint: {
    title: 'Ajustes de puntos de ruta',
    optionRequired: 'Paso obligatorio',
    optionAllowed: 'Paso permitido',
    optionForbidden: 'Paso prohibido',
    prePortLabel: 'Seleccionar puerto anterior',
    prePortPlaceholder: 'Selecciona un puerto',
  },
  // Turn point editor
  turnPoint: {
    createTitle: 'Añadir punto de giro',
    editTitle: 'Editar punto de giro',
    longitude: 'Longitud',
    latitude: 'Latitud',
    invalidCoordinate: 'Introduce una longitud y una latitud válidas',
    deleteLockedHint: 'Solo puedes eliminar los puntos de giro que hayas añadido',
  },
}
