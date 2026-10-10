// Budget route map page
export default {
  // Page titles
  title: {
    edit: 'Edit Estimation Route',
    readonly: 'Estimation Route Map',
  },
  // Empty state
  empty: {
    title: 'No voyage calculated yet',
    description: 'Complete the port rotation and voyage calculation in the estimation editor first.',
    action: 'Edit Estimation',
  },
  // Loading and notices
  updating: 'Updating the estimation route...',
  updated: 'Estimation route updated. Go back to save the estimation.',
  geometryUpdated: 'Route updated. Go back to save the estimation.',
  updateFailed: 'Failed to update the estimation route',
  // Map workspace notices
  workspace: {
    distanceRequired: 'Please complete the voyage calculation first',
    routeEditHint: 'Click a route point to edit',
    routeLoadFailed: 'Failed to load route points',
    turnEditHint: 'Drag or tap a turn point to edit',
    turnUpdateFailed: 'Failed to update the turn point. Select the route again.',
    turnDeleteNotAllowed: 'This turn point cannot be deleted',
    noEditableRoutePoint: 'No editable route points found',
  },
}
