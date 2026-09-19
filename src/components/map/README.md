# Leaflet Map Module

`components/map` is the standalone Leaflet rendering module used by the mobile app. It owns map layers, measurement, coordinate conversion, route-point interaction, and turn-point interaction only.

It does not use Mini Program messaging, `postMessage`, WebSocket, or backend map-session state.

## Inputs

`PortDistanceMap` receives `ports`, `route-points`, `track-segments`, `turning-points`, optional `route-point-config`, and route/turn edit mode flags. It emits route-point, turn-point, clear-route, notice, and initialization events. The host owns all API calls and Pinia updates.

## App Hosts

- `src/components/MapWorkspace.vue` hosts the standalone map tab and connects it to the `distance` and `map` stores.
- `src/modules/esti-deploy/components/BudgetMapWorkspace.vue` hosts the budget route map and emits direct route geometry updates to the `esti-deploy` store.

Both hosts call `/portdist/distance/get` and `/portdist/distance/get-route-point` directly. No cross-WebView state synchronization is required.

## Store Boundary

- `src/stores/distance.ts`: port search and ordering, route API requests, totals, and recent calculations.
- `src/stores/map.ts`: raw route geometry, ECA geometry, draw segments, and standalone map edits.
- `src/modules/esti-deploy/store.ts`: budget-specific ports, route geometry, costs, income, drafts, and persistence.

## Lifecycle

Ionic tab pages are cached. Hosts expose `invalidateSize()` and invoke it after `onIonViewDidEnter` so Leaflet redraws correctly after returning to a map tab.

## Reference Layers

The module keeps the Leaflet reference layers used by the H5 map: WGS84/global, AMap GCJ-02, satellite, sea-area, JWC, and time-zone reference layers. These are informational only and are not navigation or legal-boundary products.
