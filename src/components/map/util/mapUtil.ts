/* eslint-disable prefer-const */
// @ts-nocheck
/**
 * 与航程的计算相关的 暂时从 store 搬过来
 */
import { cloneDeep, numeral, round } from '@/utils/common'
import { greatCircleDist, judgeCrosses180Degrees, reBuildLinePoint } from "./distanceUtil"
import { buildRoutePointsWithECA, calcRoutePointDistanceVal } from "./ecaUtil"

// 默认要排除路由点
export const defaultExcRoutePoint = <number[]>([-2, 19665, 53829, 13567, 25091, 22445, 61705]) 

// 形成画航线的路径数据
export const produceTrackPath = (routePoints: Array<any>, turningPoints: Array<any>) => { 
  let routePaths: any[] = [], routePathsECA: any[] = []  
  let tempArr: any[] = []
  for (let i = 0; i < routePoints.length; i++) { // 用的原始数据 routePoints
    const obj = routePoints[i]
    let arr: any[] = [] // 新产生的路线
    let ids: any[] = []
    let deltaDegree = 0
    let crosses180Direction = 0
    const route = cloneDeep(obj.route)
    for (let j = 0; j < route.length; j++) {
      if (j > 0) {
        // 同一位置的，跳过
        if (
          route[j - 1].lon == route[j].lon &&
          route[j - 1].lat == route[j].lat &&
          route[j - 1].wt != '0' &&
          route[j].wt != '0'
        )
          continue
        
        crosses180Direction = judgeCrosses180Degrees(route[j - 1], route[j])
        if (crosses180Direction == 1)
          // 由东向西
          deltaDegree += 360
        else if (crosses180Direction == -1)
          // 由西向东
          deltaDegree -= 360
        const lon = Number(route[j].lon) + deltaDegree
        if (route[j].wt == '11' || route[j].wt == '19' || route[j].wn == 'eca') {
          arr.push([lon, route[j].lat])
        }
        if (arr.length && route[j].wt != '11' && route[j].wt != '19') {
          arr.push([lon, route[j].lat])
          route[j].wn !== 'eca' ? ids.push(route[j].routeSeq) : ids.push(route[j].wn)
          if (ids[0] !== 'eca' && ids[1] == 'eca') { // 开始使用 turningPoints
            const no = turningPoints.findIndex((item) => {
              return item.routeSeq == ids[0]
            })
            ids = [turningPoints[no].routeSeq, turningPoints[no + 1].routeSeq]
            tempArr = ids
          }
          if ((ids[0] == 'eca' && ids[1] !== 'eca') || (ids[0] == 'eca' && ids[1] == 'eca')) {
            ids = tempArr
          }
          const temp = {
            distance: numeral(
              greatCircleDist(
                arr[0][0],
                arr[0][1],
                arr[arr.length - 1][0],
                arr[arr.length - 1][1]
              )
            ).format('0,0.00'),
            route: arr,
            idArr: ids
          }
          if (obj.eca) {
            routePathsECA.push(temp) // 
          } else {
            routePaths.push(temp) // 
          }
          arr = []
          ids = []
          arr.push([lon, route[j].lat])
          route[j].wn !== 'eca' ? ids.push(route[j].routeSeq) : ids.push(route[j].wn)
        }
      } else {
        arr.push([route[j].lon, route[j].lat])
        route[j].wn !== 'eca' ? ids.push(route[j].routeSeq) : ids.push(route[j].wn)
      }
    }
  }

  return {
    routePaths, routePathsECA
  }
} // end createTrackPath

// 创建航程计算结果
// 创建航程计算结果
export const calDistanceResult = (routePoints: Array<any>) => {
  let ttlDistance = 0, ttlEcaDistance = 0, distance = 0, ecaDistance = 0
  const portsDistanceArr: any[] = [] // 存放港口和港口间距离

  for (let i = 0; i < routePoints.length; i++) {
    const point = routePoints[i]
    const route = point.route
    ttlDistance += point.distance
    distance += point.distance
    if (point.eca) {
      ecaDistance += point.distance
      ttlEcaDistance += point.distance
    }

    for (let j = 0; j < route.length; j++) {
      // 加入港口间距离
      if (j == 0 && i == 0) {
        const startPortObj = cloneDeep(route[j])
        startPortObj.gVal = 0
        startPortObj.ecaVal = 0
        portsDistanceArr.push(startPortObj)
      } else if (j == route.length - 1) {
        if (route[j].wn == 'eca') continue

        const toPortObj = cloneDeep(route[j])
        toPortObj.gVal = distance
        toPortObj.ecaVal = ecaDistance

        portsDistanceArr.push(toPortObj)
        distance = ecaDistance = 0
      }
    }
  }

  return {
    portsDistanceArr,
    ttlDistance: round(ttlDistance, 2),
    ttlEcaDistance: round(ttlEcaDistance, 2)
  }
}

// 根据原始routePoints数据 重新加工 并设置 航线数据Seq 
export const setSeqRoutePoints = (routePoints) => {
  // 设置Seq
  let index = 0
  routePoints.forEach((point) => {
    point.distance && delete point.distance
    point.route.forEach((item) => {
      item.routeSeq = index
      index++
    })
  })
  return routePoints
}

export const buildNewRoutePoints = (isUseEca, ecaArea, routePoints) => {
  // 
  let route = reBuildLinePoint(routePoints)
  if (isUseEca) {
    route = buildRoutePointsWithECA(ecaArea, route)
  } else {
    route.forEach((item) => {
      calcRoutePointDistanceVal(item.route) // ecaUtil ??
      item.distance = item.route[item.route.length - 1].gVal
    })
  }

  return route
}

// 根据新的RoutePoints数据 生成TurningPoints
export const buildTurningPoints = (payload) => { //
  let points = []
  payload.forEach((item) => {
    points = points.concat(item.route)
  })
  points = points.filter((item) => {
    return Object.prototype.hasOwnProperty.call(item, 'routeSeq') 
      && (item as any).wn !== 'eca'
  })
  return points
}