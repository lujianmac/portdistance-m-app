import { t } from '@/i18n'

export interface BaseMapConfig {
  id: string
  name: string
  shortName: string
  urlTemplate: string
  overlayUrlTemplate?: string
  previewUrl: string
  attribution: string
  lineColor: string
  coordinateSystem: 'wgs84' | 'gcj02'
  maxZoom?: number
}

export interface MapInitState {
  basemap: BaseMapConfig
  center: [number, number]
  zoom: number
  constraints: {
    minZoom: number
    maxZoom: number
    rotationEnabled: boolean
  }
}

const DEFAULT_CENTER: [number, number] = [120, 30]
const DEFAULT_ZOOM = 4
const DOMESTIC_VECTOR_URL = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
const DOMESTIC_SATELLITE_URL = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
const DOMESTIC_LABEL_URL = 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
const TILE_SERVER_BASE = 'https://map.zsbunker.cn/mapserver/arcgis'
const TOPO_VECTOR_URL = `${TILE_SERVER_BASE}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`
const OCEAN_BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
const OCEAN_REFERENCE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}'

// 维护基础底图清单，统一不同底图源的瓦片 URL 与主题色。
export function basemaps(defaultMapSource = true): BaseMapConfig[] {
  const maps: BaseMapConfig[] = [
    {
      id: 'topo-vector',
      name: t('map.layers.basemap.default'),
      shortName: t('map.layers.basemap.defaultShort'),
      lineColor: '#a1443b',
      urlTemplate: TOPO_VECTOR_URL,
      previewUrl: `${TILE_SERVER_BASE}/World_Topo_Map/MapServer/tile/5/13/26`,
      attribution: '&copy; Esri, HERE, Garmin, USGS, FAO, OpenStreetMap contributors',
      coordinateSystem: 'wgs84',
      maxZoom: 19
    },
    {
      id: 'domestic',
      name: t('map.layers.basemap.domestic'),
      shortName: t('map.layers.basemap.domesticShort'),
      lineColor: '#a1443b',
      urlTemplate: DOMESTIC_VECTOR_URL,
      previewUrl: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x=26&y=13&z=5',
      attribution: t('map.layers.basemap.attributionDomestic'),
      coordinateSystem: 'gcj02',
      maxZoom: 18
    },
    {
      id: 'satellite',
      name: t('map.layers.basemap.satellite'),
      shortName: t('map.layers.basemap.satelliteShort'),
      lineColor: '#a1443b',
      urlTemplate: DOMESTIC_SATELLITE_URL,
      overlayUrlTemplate: DOMESTIC_LABEL_URL,
      previewUrl: 'https://webst01.is.autonavi.com/appmaptile?style=6&x=26&y=13&z=5',
      attribution: t('map.layers.basemap.attributionDomestic'),
      coordinateSystem: 'gcj02',
      maxZoom: 18
    },
    {
      id: 'ocean',
      name: t('map.layers.basemap.ocean'),
      shortName: t('map.layers.basemap.oceanShort'),
      lineColor: '#006c8c',
      urlTemplate: OCEAN_BASE_URL,
      overlayUrlTemplate: OCEAN_REFERENCE_URL,
      previewUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/5/13/26',
      attribution: '&copy; Esri, GEBCO, NOAA, National Geographic, DeLorme, NAVTEQ',
      coordinateSystem: 'wgs84',
      maxZoom: 13
    }
  ]
  return defaultMapSource ? maps : [...maps].reverse()
}

// 根据 basemapId 选择当前底图，找不到时回退到默认底图。
export function resolveBasemap(defaultMapSource = true, basemapId?: string): BaseMapConfig {
  const mapList = basemaps(defaultMapSource)
  if (!basemapId) return mapList[0]
  return mapList.find((item) => item.id === basemapId) || mapList[0]
}

// 生成地图初始化配置（底图、中心点、缩放和约束）。
export function createMapInitState(input: {
  defaultMapSource?: boolean
  basemapId?: string
  center?: [number, number]
  zoom?: number
} = {}): MapInitState {
  const defaultMapSource = input.defaultMapSource ?? true
  return {
    basemap: resolveBasemap(defaultMapSource, input.basemapId),
    center: input.center || DEFAULT_CENTER,
    zoom: input.zoom ?? DEFAULT_ZOOM,
    constraints: {
      minZoom: 2,
      maxZoom: 16,
      rotationEnabled: false
    }
  }
}

export function changeMapState(defaultMapSource: boolean, basemapId: string): BaseMapConfig {
  return resolveBasemap(defaultMapSource, basemapId)
}

export function resetMapRotation(): number {
  return 0
}
