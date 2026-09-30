import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dealEcaAreaArr, dealEcaPolyArr } from '@/components/map/util/ecaUtil'
import {
  buildNewRoutePoints,
  buildTurningPoints,
  calDistanceResult,
  produceTrackPath,
  setSeqRoutePoints
} from '@/components/map/util/mapUtil'
import { buildLocalRouteGeometry, type LocalRouteGeometry } from '@/utils/route'
import { deepClone } from '@/utils/common'

const DEFAULT_SPEED = 12

export const useMapStore = defineStore('map', () => {
  const isUseEca = ref(true)
  const ecaArea = ref(dealEcaAreaArr())
  const routePointsOriginWithSeq = ref<any[]>([])
  const routePoints = ref<any[]>([])
  const turningPoints = ref<any[]>([])
  const routePaths = ref<any[]>([])
  const routePathsECA = ref<any[]>([])
  const rawRoutePoints = ref<Record<string, unknown>[]>([])

  // buildRoutePointsWithECA relies on this global edge cache, as does lite's map store.
  dealEcaPolyArr()

  function processRouteData(routePointsOrigin: any[], defaultSpeed = DEFAULT_SPEED) {
    void defaultSpeed
    routePointsOriginWithSeq.value = setSeqRoutePoints(routePointsOrigin || [])
    routePoints.value = buildNewRoutePoints(
      isUseEca.value,
      ecaArea.value,
      routePointsOriginWithSeq.value
    )
    turningPoints.value = buildTurningPoints(routePoints.value)

    const result = calDistanceResult(routePoints.value)
    const pathResult = produceTrackPath(routePoints.value, turningPoints.value)
    routePaths.value = pathResult.routePaths || []
    routePathsECA.value = pathResult.routePathsECA || []

    return result
  }

  function updateTurnPoint(routeSeq: number, lon: number, lat: number) {
    const target = findEditableRoutePoint(routeSeq)
    if (!target) return null
    target.point.lon = lon
    target.point.lat = lat
    return rebuildEditedRouteGeometry()
  }

  function addTurnPoint(anchorRouteSeq: number, lon: number, lat: number) {
    const target = findEditableRoutePoint(anchorRouteSeq, true)
    if (!target || target.index >= target.segment.route.length - 1) return null

    const nextRouteSeq = routePointsOriginWithSeq.value.reduce((maximum, segment) => {
      return Math.max(maximum, ...(segment.route || []).map((point: any) => Number(point.routeSeq) || 0))
    }, -1) + 1
    target.segment.route.splice(target.index + 1, 0, {
      lon,
      lat,
      routeSeq: nextRouteSeq,
      wt: '1',
      userAdded: true
    })
    return rebuildEditedRouteGeometry()
  }

  /**
   * A turn point the user added is always deletable. `findEditableRoutePoint`
   * additionally requires an interior point of a segment with at least three
   * points, which can reject a freshly inserted point; the fallback below looks
   * the point up by `userAdded` alone so the delete action never silently fails.
   */
  function findUserAddedTurnPoint(routeSeq: number) {
    for (const segment of routePointsOriginWithSeq.value) {
      const index = segment.route?.findIndex((point: any) => {
        return point.routeSeq === routeSeq && point.userAdded
      }) ?? -1
      if (index >= 0) return { segment, index, point: segment.route[index] }
    }
    return null
  }

  function deleteTurnPoint(routeSeq: number) {
    const target = findEditableRoutePoint(routeSeq) ?? findUserAddedTurnPoint(routeSeq)
    if (!target || !target.point.userAdded) return null
    target.segment.route.splice(target.index, 1)
    return rebuildEditedRouteGeometry()
  }

  function canDeleteTurnPoint(routeSeq: number) {
    return Boolean((findEditableRoutePoint(routeSeq) ?? findUserAddedTurnPoint(routeSeq))?.point.userAdded)
  }

  function findEditableRoutePoint(routeSeq: number, allowSegmentStart = false) {
    for (const segment of routePointsOriginWithSeq.value) {
      const index = segment.route?.findIndex((point: any) => point.routeSeq === routeSeq) ?? -1
      if (index < 0) continue
      const isEndpoint = index === 0 || index === segment.route.length - 1
      if (isEndpoint && !(allowSegmentStart && index === 0)) return null
      if (segment.route.length < 3 && !allowSegmentStart) return null
      return { segment, index, point: segment.route[index] }
    }
    return null
  }

  function clearMapPaths() {
    routePointsOriginWithSeq.value = []
    routePoints.value = []
    turningPoints.value = []
    routePaths.value = []
    routePathsECA.value = []
    rawRoutePoints.value = []
  }

  function setRouteGeometry(rawPoints: Record<string, unknown>[]): LocalRouteGeometry {
    const source = deepClone(rawPoints)
    const geometry = buildLocalRouteGeometry(source)
    rawRoutePoints.value = deepClone(rawPoints)
    routePointsOriginWithSeq.value = setSeqRoutePoints(deepClone(rawPoints))
    routePoints.value = geometry.routePoints
    turningPoints.value = geometry.turningPoints
    routePaths.value = geometry.routePaths
    routePathsECA.value = geometry.routePathsEca
    return geometry
  }

  function rebuildEditedRouteGeometry() {
    return setRouteGeometry(deepClone(routePointsOriginWithSeq.value))
  }

  function clearRouteGeometry() {
    clearMapPaths()
  }

  return {
    isUseEca,
    routePointsOriginWithSeq,
    routePoints,
    turningPoints,
    routePaths,
    routePathsECA,
    rawRoutePoints,
    processRouteData,
    updateTurnPoint,
    addTurnPoint,
    deleteTurnPoint,
    canDeleteTurnPoint,
    clearMapPaths,
    setRouteGeometry,
    clearRouteGeometry
  }
})