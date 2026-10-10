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

## Pin Tool (continuous pinning)

- Tapping the `pin-trigger` button turns the tap mode on; it **stays on** until the button is tapped again, so several pins can be dropped in a row. Enabling it switches measuring, route editing, turn editing and the meteo query tool off, and any of those taking over switches it off again (pins already on the map stay).
- `PinController` owns the pin list: every pin gets an incremental `id` (two pins may share the same coordinates) and its own coordinate label. `onPinCountChange` drives the host's "clear all pins" button.
- The info box follows the pin the user last interacted with: the pin just dropped, or the pin that was tapped. That pin is drawn last, inside an extra highlight ring, and the box keeps showing its coordinates until it hides (4 s) or another pin is interacted with.
- `onPinPlaced` / `onPinClick` hand the whole `MapPin` (`id`, `lon`, `lat`) to the host. The host maps each pin id to the `portId`s it added to the port list (`addCoordinatePort` builds them as `${longitude}~${latitude}`), so "clear all pins" can look up and drop those rows with `removePort(index)`.
- Adding a pin to the port list closes the info box immediately and calls `markPinAdded(id)`. The host records the id in `pinsAddedToPorts`; `PinController` then stops drawing that pin's marker, coordinate label and highlight ring, because the port point now represents the same coordinate — the map shows one point, not two. The pin record and its invisible hit circle stay, so tapping that spot re-opens the box with "Add to port list" disabled (`pinAlreadyAdded`) while "Delete" keeps working.
- "Clear all pins" always removes every pin from the map and closes the box. It removes the port rows those pins created **only while `distance.hasDistanceResult` is false**; once a voyage result exists those rows fed the calculated route, so they are kept and the notice `pinClearKeptPorts` tells the user why.
- The info box delete button only drops the pin from the map (previous behaviour) and keeps its port rows; those rows are still removed later by "clear all pins", which walks every recorded port id. The "add to port list" button is disabled while the distance store already holds a voyage result.
