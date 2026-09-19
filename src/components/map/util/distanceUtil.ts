/* eslint-disable prefer-const */
// @ts-nocheck
/**
 * 与航程的计算相关的函数
 */
export const PARM = 0.0174532925
export const EARTH_WGS84_A = 6378137.0 //长轴半径
export const EARTH_WGS84_B = 6356752.3142 //短轴半径
export const EARTH_WGS84_E = 0.00669437999013 //偏心率的平方
export const EARTH_WGS84_MPM = 1852.0 //meters   per   nmile
export const EARTH_WGS84_FLATTENING = 298.257223563 //地球扁率
export const DEG2RAD = 0.0174532925 //pi / 180 degree(度数) to radian(弧度) Math.PI(3.1414926)/180
export const PI = 3.1414926

/**
 * 判断是否穿越180度
 * 返回值：-1 由西向东穿越 0 不穿越 1 由东向西穿越
 * */
export const judgeCrosses180Degrees = (preRoutePoint, currentRoutePoint) => {
  let result = 0
  if (preRoutePoint && currentRoutePoint) {
    let prevLon = preRoutePoint.lon
    let currentLon = currentRoutePoint.lon

    if (prevLon > 90 && prevLon <= 180 && currentLon >= -180 && currentLon < -60) result = 1
    else if (prevLon >= -180 && prevLon < -60 && currentLon > 90 && currentLon <= 180) result = -1
  }
  return result
}

export const reBuildLinePoint = (points) => {
  let newPoints: any[] = []
  for (let i = 0; i < points.length; i++) {
    newPoints.push({
      route: buildLinePoints(points[i]['route'])
    })
  }
  return newPoints
}

//重构航线的点
export const buildLinePoints = (points) => {
  let step = 1.0
  let newPoints: any[] = []
  //起步点先纳入列表
  newPoints.push(points[0])

  let num = points.length
  for (let i = 1; i < num; i++) {
    //rhumb line不需要插值
    if (points[i]['wt'] == '11' && points[i - 1]['wt'] == '11') {
      if (i > 1) newPoints.push(points[i - 1])
    } else {
      if (Math.abs(points[i]['lon']) == 180 && Math.abs(points[i - 1]['lon']) == 180) continue

      //如果在180点处需要略作偏移
      if (points[i]['lon'] == 180) points[i]['lon'] = 179.9999999
      else if (points[i]['lon'] == -180) points[i]['lon'] = -179.9999999

      //若两点间的经度差大于步幅
      if (
        Math.abs(points[i]['lon'] - points[i - 1]['lon']) > step &&
        Math.abs(points[i]['lon'] - points[i - 1]['lon']) < 359
      ) {
        let s = {
          lat: points[i - 1]['lat'],
          lon: points[i - 1]['lon']
        }
        let d = {
          lat: points[i]['lat'],
          lon: points[i]['lon']
        }
        let v = getVertex(s, d)
        //将两点间的大圆航线按给定的步幅分段，返回连接点数组
        let divPoints = divideRoute(points[i - 1], points[i], v, step)
        newPoints = newPoints.concat(divPoints)
      } else {
        if (i > 1) newPoints.push(points[i - 1])
      }
    }
  }
  //将终止点加入
  newPoints.push(points[num - 1])

  return newPoints
}

//将两点间插入分割点，step为经度步长
export const divideRoute = (sPoint, ePoint, v, step) => {
  let newPoints: any = []

  /* if (ePoint['lon'] == -180) {
        return (ePoint['lon']);
    } */
  //起始点和终止点不同号
  if (Math.abs(sPoint['lon'] + ePoint['lon']) < Math.abs(sPoint['lon'] - ePoint['lon'])) {
    let tmp
    //起始点和终止点不同号由180度分割
    if (Math.abs(sPoint['lon'] - ePoint['lon']) > 180) tmp = calcPoint(180, v)
    //起始点和终止点不同号由0度分割
    else tmp = calcPoint(0, v)

    let s = {
      gVal: 0,
      wn: '',
      lat: tmp.lat,
      lon: tmp.lon,
      wt: '19'
    }

    if (sPoint['lon'] < 0 && Math.abs(s['lon']) == 180) {
      s['lon'] = -1 * s['lon']
    }

    if (Math.abs(sPoint['lon'] - s['lon']) > step) newPoints = divideRoute(sPoint, s, v, step)
    else newPoints.push(sPoint)

    s['lon'] = Math.abs(s['lon'])
    if (ePoint['lon'] < 0 && Math.abs(s['lon']) == 180) s['lon'] = -1 * s['lon']

    if (Math.abs(ePoint['lon'] - s['lon']) > step) {
      newPoints = newPoints.concat(divideRoute(s, ePoint, v, step))
    } else newPoints.push(s)

    return newPoints
  } else {
    //起始点和终止点同号
    let n = Math.floor(Math.abs(ePoint['lon'] - sPoint['lon']) / step)
    let tmp
    newPoints.push(sPoint)
    if (ePoint['lon'] > sPoint['lon']) {
      for (let i = 1; i < n; i++) {
        tmp = calcPoint(sPoint['lon'] + i * step, v)
        newPoints.push({
          gVal: 0,
          wn: '',
          lat: tmp.lat,
          lon: tmp.lon,
          wt: '11'
        })
      }
    } else {
      for (let i = 1; i < n; i++) {
        tmp = calcPoint(sPoint['lon'] - i * step, v)
        newPoints.push({
          gVal: 0,
          wn: '',
          lat: tmp.lat,
          lon: tmp.lon,
          wt: '11'
        })
      }
    }
    return newPoints
  }
}

//获取两点间顶点的经纬度
export const getVertex = (sP, eP) => {
  let isVert = false
  let sPoint
  let ePoint
  if (sP.lat < 0) {
    sPoint = {
      lat: -1 * sP.lat,
      lon: sP.lon
    }
    ePoint = {
      lat: -1 * eP.lat,
      lon: eP.lon
    }
    isVert = true
  } else {
    sPoint = {
      lat: sP.lat,
      lon: sP.lon
    }
    ePoint = {
      lat: eP.lat,
      lon: eP.lon
    }
  }

  let dE = Math.abs(ePoint.lon - sPoint.lon)

  let Cs = Math.atan(
    Math.sin(dE * PARM) /
      (Math.tan(ePoint.lat * PARM) * Math.cos(sPoint.lat * PARM) -
        Math.cos(dE * PARM) * Math.sin(sPoint.lat * PARM))
  )
  if (Cs < 0) Cs = 180 * PARM + Cs

  let newPoint: any = {}
  newPoint.lat = Math.acos(Math.cos(sPoint.lat * PARM) * Math.sin(Cs)) / PARM

  let dNv = Math.atan(1 / (Math.sin(sPoint.lat * PARM) * Math.tan(Cs))) / PARM

  //	newPoint.lon=sPoint.lon+dNv;
  if (sPoint.lon > ePoint.lon) {
    newPoint.lon = sPoint.lon - dNv
  } else newPoint.lon = sPoint.lon + dNv

  if (newPoint.lon > 180) newPoint.lon -= 360
  if (newPoint.lon < -180) newPoint.lon += 360

  if (isVert) newPoint.lat *= -1

  return newPoint
}

//计算分割点的坐标
export const calcPoint = (longitude, v) => {
  return {
    lon: longitude,
    lat: Math.atan(Math.cos((longitude - v.lon) * PARM) * Math.tan(v.lat * PARM)) / PARM
  }
}

//计算两直线的交点位置
/**
 * 获取相交点
 * A：线段一的起点
 * B：线段一的终点
 * E：线段二的起点
 * F：线段二的终点
 * as_seg：是否获取线段延长线的相交点（true 不判断， false 判断）
 */
export const getCrossPoint = (A, B, E, F, as_seg = true) => {
  let ip: any = null
  let a1 = B.y - A.y
  let b1 = A.x - B.x
  let c1 = B.x * A.y - A.x * B.y
  let a2 = F.y - E.y
  let b2 = E.x - F.x
  let c2 = F.x * E.y - E.x * F.y

  let denom = a1 * b2 - a2 * b1
  if (denom == 0) {
    return null
  }
  ip = {
    x: (b1 * c2 - b2 * c1) / denom,
    y: (a2 * c1 - a1 * c2) / denom
  }

  //---------------------------------------------------
  //Do checks to see if intersection to endpoints
  //distance is longer than actual Segments.
  //Return null if it is with any.
  //---------------------------------------------------
  if (as_seg) {
    if (
      Math.pow(ip.x - B.x, 2) + Math.pow(ip.y - B.y, 2) >
      Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2)
    ) {
      return null
    }
    if (
      Math.pow(ip.x - A.x, 2) + Math.pow(ip.y - A.y, 2) >
      Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2)
    ) {
      return null
    }

    if (
      Math.pow(ip.x - F.x, 2) + Math.pow(ip.y - F.y, 2) >
      Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2)
    ) {
      return null
    }
    if (
      Math.pow(ip.x - E.x, 2) + Math.pow(ip.y - E.y, 2) >
      Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2)
    ) {
      return null
    }
  }
  return ip
}

export const transLatLng = (s) => {
  let arr = s.split('-')
  if (arr.length < 4) return 0

  let r = Number(arr[0]) + Number(arr[1]) / 60.0 + Number(arr[2]) / 3600.0

  if (arr[3] == 'W' || arr[3] == 'S') r = -1 * r

  return r
}

/**
 * 计算两点距离，海里为单位，输入两点的经纬度(东经北纬) 大圆航线
 * @param lon1 double
 * @param lat1 double
 * @param lon2 double
 * @param lat2 double
 * @return double
 */
export const greatCircleDist = (lon1, lat1, lon2, lat2) => {
  //如果两个点在同一位置
  if (lon1 == lon2 && lat1 == lat2) return 0

  let result = 0.0
  let cos =
    Math.cos(lat1 * DEG2RAD) *
      Math.cos(lat2 * DEG2RAD) *
      Math.cos(lon1 * DEG2RAD - lon2 * DEG2RAD) +
    Math.sin(lat1 * DEG2RAD) * Math.sin(lat2 * DEG2RAD)
  let x = Math.acos(cos)
  result = (x * EARTH_WGS84_A) / EARTH_WGS84_MPM

  return result
}

/**
 * 计算两点距离，海里为单位，输入两点的经纬度(东经北纬) 恒向线
 * @param lon1 double
 * @param lat1 double
 * @param lon2 double
 * @param lat2 double
 * @return double
 */
export const rhumbLineDist = (lon1, lat1, lon2, lat2) => {
  let result = 0.0

  let dLat = (lat2 - lat1) * DEG2RAD
  let dLon = Math.abs(lon2 - lon1) * DEG2RAD

  let dPhi = Math.log(
    Math.tan((lat2 * DEG2RAD) / 2 + Math.PI / 4) / Math.tan((lat1 * DEG2RAD) / 2 + Math.PI / 4)
  )
  let q = !isNaN(dLat / dPhi) ? dLat / dPhi : Math.cos(lat1 * DEG2RAD)

  if (dLon > Math.PI) dLon = 2 * Math.PI - dLon

  let x = Math.sqrt(dLat * dLat + q * q * dLon * dLon)

  result = (x * EARTH_WGS84_A) / EARTH_WGS84_MPM

  return result
}

//获取180度的交界的点
export const get180Point = (sPoint, ePoint) => {
  let tmp
  let tmp2

  let s = {
    lat: sPoint['lat'],
    lon: sPoint['lon']
  }
  let d = {
    lat: ePoint['lat'],
    lon: ePoint['lon']
  }
  let v = getVertex(s, d)

  //起始点和终止点不同号
  if (Math.abs(sPoint['lon'] + ePoint['lon']) < Math.abs(sPoint['lon'] - ePoint['lon'])) {
    //起始点和终止点不同号由180度分割
    if (Math.abs(sPoint['lon'] - ePoint['lon']) > 180) {
      if (sPoint['lon'] > ePoint['lon']) {
        tmp = calcPoint(179.99999, v)
        tmp2 = calcPoint(-179.99999, v)
      } else {
        tmp2 = calcPoint(179.99999, v)
        tmp = calcPoint(-179.99999, v)
      }
    } //起始点和终止点不同号由0度分割
    else {
      if (sPoint['lon'] > ePoint['lon']) {
        tmp = calcPoint(0.00001, v)
        tmp2 = calcPoint(-0.00001, v)
      } else {
        tmp2 = calcPoint(0.00001, v)
        tmp = calcPoint(-0.00001, v)
      }
    }

    let ret: any[] = []
    ret.push({
      gVal: 0,
      wn: '',
      lat: tmp.lat,
      lon: tmp.lng,
      wt: '19'
    })
    ret.push({
      gVal: 0,
      wn: '',
      lat: tmp2.lat,
      lon: tmp2.lng,
      wt: '19'
    })

    return ret
  }

  return null
}
