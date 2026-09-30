// Map workspace
export default {
  workspace: {
    distanceRequired: 'Please complete the voyage calculation first',
    routeEditHint: 'Click a route point to edit',
    routeLoadFailed: 'Failed to load route points',
    turnEditHint: '1. Tap a turn point to drag it to the required position\n2. Double-tap a turn point to edit or delete it\n3. Tap the route line to add a turn point',
    recalcFailed: 'Failed to recalculate the distance',
    turnUpdateFailed: 'Failed to update the turn point',
    noEditableRoutePoint: 'No editable route points found',
    clearTitle: 'Clear route',
    clearMessage: 'This will clear the ports, the route and the current calculation results.',
  },
  // Route point editor
  routePoint: {
    title: 'Route point settings',
    optionRequired: 'Must pass',
    optionAllowed: 'Pass allowed',
    optionForbidden: 'Pass prohibited',
    prePortLabel: 'Select previous port',
    prePortPlaceholder: 'Select a port',
  },
  // Turn point editor
  turnPoint: {
    createTitle: 'Add turn point',
    editTitle: 'Edit turn point',
    longitude: 'Longitude',
    latitude: 'Latitude',
    invalidCoordinate: 'Enter a valid longitude and latitude',
    deleteLockedHint: 'Only turn points you added can be deleted',
  },
}
