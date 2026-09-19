/* eslint-disable prefer-const */
// @ts-nocheck
/**
 * 与ECA计算相关的函数
 */
import { buildLinePoints, getCrossPoint, greatCircleDist, } from './distanceUtil'
import { cloneDeep } from '@/utils/common'
import { ecaAreaArrs, ecaPolysArr } from './eca-converted'

const webMercatorUtils = {
  lngLatToXY(lon, lat) {
    return latLng2WebMercator(lon, lat)
  },
  webMercatorToGeographic(point) {
    const [longitude, latitude] = webMercator2LngLat(point.x, point.y)
    return { x: longitude, y: latitude }
  }
}

let ecaPolyArrs: any[] = []
let pgnArr: any[] = []
export const dealEcaPolyArr = () => {
  // ecaPolyArrs = []
  for (let o of ecaPolysArr) {
    ecaPolyArrs.push(buildECAPolyData(o.data))
  }
  return ecaPolyArrs
}

//创建ECA区域
export const dealEcaAreaArr = () => {
  pgnArr = []
  for (let a of ecaAreaArrs) {
    pgnArr.push(buildECAPolyData(a.data))
  }
  return pgnArr
}

export const buildECAPolyData = (sArr) => {
  // let ecaArr: any[] = []
  // for (let n of sArr) {
  //   let o: any = new Object()
  //   o.wt = n.wt
  //   o.lon = transLatLng(n.lon)
  //   o.lat = transLatLng(n.lat)
  //   ecaArr.push(o)
  // }
  let newEcaArr: any[] = buildLinePoints(sArr)
  let arr: any[] = []

  for (let v of newEcaArr) {
    let p = webMercatorUtils.lngLatToXY(v.lon, v.lat)
    arr.push(p)
  }
  return arr
}

export const buildRoutePointsWithECA = (ecaArea, routePoints) => {
  let arr: any[] = []
  let newArr: any[] = []
  for (let r = 0; r < routePoints.length; r++) {
    // arr = await reBuildRoutePointWithECA(ecaArea, routePoints[r])
    arr = reBuildRoutePointWithECA(ecaArea, routePoints[r])
    for (let v of arr) {
      newArr.push(v)
    }
  }
  return newArr
}

export const reBuildRoutePointWithECA = (ecaArea, routePoint) => {
  let newArr: any[] = []
  let route = routePoint['route']
  let copyRoute = cloneDeep(route)
  let isEca = false
  let prePoint: any = null
  let num = 0
  let startIdx = 0
  for (let i = 0; i < route.length; i++) {
    let webPoint = webMercatorUtils.lngLatToXY(Number(route[i]['lon']), Number(route[i]['lat']))
    let p = {
      x: webPoint[0],
      y: webPoint[1]
    }
    if ((isInside(ecaArea, p) && !isEca) || (!isInside(ecaArea, p) && isEca)) {
      //如果转变，说明有交界
      if (i > 0) {
        //获取交界的点，并加入航线中
        let crossPoint = getCrossPointWithECA(p, prePoint)
        if (crossPoint) {
          let pp = {
            x: crossPoint.x,
            y: crossPoint.y
          }
          let o: any = new Object()
          let latLon: any = webMercatorUtils.webMercatorToGeographic(pp)

          o.gVal = 0
          o.lat = latLon.y
          o.lon = latLon.x
          o.wt = '1'
          o.wn = 'eca'

          copyRoute.splice(i + num, 0, o) // splice方法会改变原数组
          let arr = copyRoute.slice(startIdx, i + num + 1)
          if (arr) {
            calcRoutePointDistanceVal(arr)
            newArr.push({
              distance: arr[arr.length - 1].gVal,
              eca: isEca,
              route: arr
            })
            startIdx = i + num
            num += 1
          }
        }
      }
      if (isInside(ecaArea, p)) {
        isEca = true
      } else {
        isEca = false
      }
    }
    prePoint = p
  }
  if (startIdx < copyRoute.length - 1) {
    let arr1 = copyRoute.slice(startIdx, copyRoute.length)
    if (arr1) {
      calcRoutePointDistanceVal(arr1)
      newArr.push({
        distance: arr1[arr1.length - 1].gVal,
        eca: isEca,
        route: arr1
      })
    }
  }
  return newArr
}

export const calcRoutePointDistanceVal = (arr) => {
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    if (i == 0) arr[i].gVal = 0
    else
      arr[i].gVal =
        sum +
        greatCircleDist(
          Number(arr[i - 1]['lon']),
          Number(arr[i - 1]['lat']),
          Number(arr[i]['lon']),
          Number(arr[i]['lat'])
        )
    sum = arr[i].gVal
  }
}

// 获取与ECA区域边线的交点
export const getCrossPointWithECA = (p1, p2) => {
  let prePoint: any = null
  let currPoint: any = null
  for (let j = 0; j < ecaPolyArrs.length; j++) {
    let arr: any[] = ecaPolyArrs[j]
    for (let i = 0; i < arr.length; i++) {
      currPoint = {
        x: arr[i][0],
        y: arr[i][1]
      }
      if (i > 0) {
        let p: any = getCrossPoint(prePoint, currPoint, p1, p2)
        if (p) {
          return {
            x: p.x,
            y: p.y
          }
        }
      }
      prePoint = {
        x: arr[i][0],
        y: arr[i][1]
      }
    }
  }
  return null
}

/**
 * 经纬度转墨卡托
 */
export const latLng2WebMercator = (lng, lat) => {
  let earthRad = 6378137.0
  let x = ((lng * Math.PI) / 180) * earthRad
  let a = (lat * Math.PI) / 180
  let y = (earthRad / 2) * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)))
  return [x, y]
}

/**
 * 墨卡托转经纬度
 */
export const webMercator2LngLat = (x, y) => {
  let lng = (x / 20037508.34) * 180
  let lat = (y / 20037508.34) * 180
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2)
  return [lng, lat]
}

/**
 *  用于判断是否在ECA区域
 *  @param area 多边形坐标集合
 *  @param p 点坐标
 *  返回true为真，false为假
 **/
export const judgeInEca = (area, p) => {
  let webPoint = latLng2WebMercator(Number(p.x), Number(p.y))
  return isInside(area, { x: webPoint[0], y: webPoint[1] })
}

/**
 *  判断一个点是否在多边形内部
 *  @param areas 多边形坐标集合
 *  @param point 测试点坐标
 *  返回true为真，false为假
 *  */
export const insidePolygon = (area, point) => {
  /* let x = point[0],
        y = point[1]; */
  let x = point.x,
    y = point.y
  let inside = false
  for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
    let xi = area[i][0],
      yi = area[i][1]
    let xj = area[j][0],
      yj = area[j][1]

    let intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export const isInside = (areas, point) => {
  let inside: any[] = []
  // let p = latLng2WebMercator(point.x, point.y);
  for (let i = 0; i < areas.length; i++) {
    // inside.push(insidePolygon(areas[i], p));
    inside.push(insidePolygon(areas[i], point))
  }
  return inside.includes(true)
}
