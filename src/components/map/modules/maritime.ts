import { t } from '@/i18n'

export type MaritimeLayerId = 'territorial-sea' | 'sea-areas' | 'jwc'

export interface MaritimeLayerOption {
  id: MaritimeLayerId
  name: string
  shortName: string
  source: string
  version: string
  kind: 'wms' | 'jwc'
  wmsLayers?: string
  wmsSldBody?: string
  wmsCqlFilter?: string
  color: string
  fillColor: string
  fillOpacity: number
}

export interface SeaAreaLabel {
  name: string
  longitude: number
  latitude: number
  minZoom: number
}

export const MARINE_REGIONS_WMS_URL = 'https://geo.vliz.be/geoserver/MarineRegions/wms'

function buildPolygonSld(
  layerName: string,
  color: string,
  fillColor: string,
  fillOpacity: number,
  strokeWidth: number,
): string {
  return `<sld:StyledLayerDescriptor version="1.0.0" xmlns:sld="http://www.opengis.net/sld"><sld:NamedLayer><sld:Name>${layerName}</sld:Name><sld:UserStyle><sld:FeatureTypeStyle><sld:Rule><sld:PolygonSymbolizer><sld:Fill><sld:CssParameter name="fill">${fillColor}</sld:CssParameter><sld:CssParameter name="fill-opacity">${fillOpacity}</sld:CssParameter></sld:Fill><sld:Stroke><sld:CssParameter name="stroke">${color}</sld:CssParameter><sld:CssParameter name="stroke-width">${strokeWidth}</sld:CssParameter></sld:Stroke></sld:PolygonSymbolizer></sld:Rule></sld:FeatureTypeStyle></sld:UserStyle></sld:NamedLayer></sld:StyledLayerDescriptor>`
}

const JWC_NAMED_COUNTRIES = [
  'Benin',
  'Djibouti',
  'Eritrea',
  'Libya',
  'Nigeria',
  'Federal Republic of Somalia',
  'Sudan',
  'Togo',
  'Bahrain',
  'Iran',
  'Iraq',
  'Israel',
  'Kuwait',
  'Lebanon',
  'Oman',
  'Qatar',
  'Saudi Arabia',
  'Syria',
  'United Arab Emirates',
  'Yemen',
  'Russia',
  'Venezuela',
]

export const JWC_COUNTRY_CQL_FILTER = `territory1 IN (${JWC_NAMED_COUNTRIES.map((name) => `'${name}'`).join(',')})`

// 海事图层清单在调用时取文案，保证语言切换后名称/来源/版本同步更新。
export function maritimeLayerOptions(): MaritimeLayerOption[] {
  return [
    {
      id: 'territorial-sea',
      name: t('map.layers.maritime.territorialSea'),
      shortName: t('map.layers.maritime.territorialSeaShort'),
      source: t('map.layers.maritime.territorialSeaSource'),
      version: t('map.layers.maritime.territorialSeaVersion'),
      kind: 'wms',
      wmsLayers: 'MarineRegions:eez_12nm',
      wmsSldBody: buildPolygonSld('eez_12nm', '#005ea8', '#ffffff', 0, 1.25),
      color: '#005ea8',
      fillColor: '#ffffff',
      fillOpacity: 0,
    },
    {
      id: 'sea-areas',
      name: t('map.layers.maritime.seaAreas'),
      shortName: t('map.layers.maritime.seaAreasShort'),
      source: t('map.layers.maritime.seaAreasSource'),
      version: t('map.layers.maritime.seaAreasVersion'),
      kind: 'wms',
      wmsLayers: 'MarineRegions:iho',
      wmsSldBody: buildPolygonSld('iho', '#006c67', '#ffffff', 0, 1),
      color: '#006c67',
      fillColor: '#ffffff',
      fillOpacity: 0,
    },
    {
      id: 'jwc',
      name: t('map.layers.maritime.jwc'),
      shortName: t('map.layers.maritime.jwcShort'),
      source: t('map.layers.maritime.jwcSource'),
      version: t('map.layers.maritime.jwcVersion'),
      kind: 'jwc',
      wmsLayers: 'MarineRegions:eez_12nm',
      wmsSldBody: buildPolygonSld('eez_12nm', '#8f1d14', '#d94b3d', 0.18, 1.5),
      wmsCqlFilter: JWC_COUNTRY_CQL_FILTER,
      color: '#8f1d14',
      fillColor: '#d94b3d',
      fillOpacity: 0.18,
    },
  ]
}

// 标签使用 IHO S-23 海区的代表位置；按缩放级别分层显示，避免全球视图遮挡航线。
// 海区名称在调用时取文案，保证语言切换后标注同步更新。
export function majorSeaAreaLabels(): SeaAreaLabel[] {
  return [
    { name: t('map.layers.maritime.seaAreasLabels.pacific'), longitude: -150, latitude: 5, minZoom: 2 },
    { name: t('map.layers.maritime.seaAreasLabels.atlantic'), longitude: -35, latitude: 8, minZoom: 2 },
    { name: t('map.layers.maritime.seaAreasLabels.indian'), longitude: 80, latitude: -18, minZoom: 2 },
    { name: t('map.layers.maritime.seaAreasLabels.arctic'), longitude: 0, latitude: 78, minZoom: 2 },
    { name: t('map.layers.maritime.seaAreasLabels.southern'), longitude: 20, latitude: -58, minZoom: 2 },
    { name: t('map.layers.maritime.seaAreasLabels.mediterranean'), longitude: 18, latitude: 36, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.blackSea'), longitude: 34, latitude: 44, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.redSea'), longitude: 39, latitude: 20, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.arabianSea'), longitude: 64, latitude: 16, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.bayOfBengal'), longitude: 88, latitude: 15, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.southChinaSea'), longitude: 114, latitude: 14, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.seaOfJapan'), longitude: 136, latitude: 41, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.beringSea'), longitude: -172, latitude: 58, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.coralSea'), longitude: 154, latitude: -19, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.tasmanSea'), longitude: 155, latitude: -39, minZoom: 3 },
    { name: t('map.layers.maritime.seaAreasLabels.northSea'), longitude: 3, latitude: 56, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.balticSea'), longitude: 19, latitude: 58, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.persianGulf'), longitude: 52, latitude: 27, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.andamanSea'), longitude: 96, latitude: 10, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.eastChinaSea'), longitude: 125, latitude: 28, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.philippineSea'), longitude: 137, latitude: 20, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.seaOfOkhotsk'), longitude: 150, latitude: 53, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.caribbeanSea'), longitude: -75, latitude: 15, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.gulfOfMexico'), longitude: -89, latitude: 25, minZoom: 4 },
    { name: t('map.layers.maritime.seaAreasLabels.gulfOfGuinea'), longitude: 1, latitude: 0, minZoom: 4 },
  ]
}

interface JwcBoundaryProperties {
  name: string
  source: string
  note: string
}

// JWLA-034 定义线弹窗文案在每次取用时按当前语言解析（不能在模块加载时固化，
// 否则 locale 尚未初始化，会永久停在默认语言）。
export function jwcDefinedBoundaryGeoJson(): GeoJSON.FeatureCollection<GeoJSON.LineString, JwcBoundaryProperties> {
  return {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: t('map.layers.maritime.jwcBoundaries.azovBlackSeaName'),
        source: 'LMA JWLA-034',
        note: t('map.layers.maritime.jwcBoundaries.azovBlackSeaNote'),
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [29.7654833333, 45.1809666667],
          [29.8523333333, 45.18725],
          [29.9927166667, 45.1912333333],
          [30.0401333333, 45.0892333333],
          [30.9787, 44.7770833333],
          [31.17495, 44.7374],
          [31.4100333333, 44.04795],
          [31.3325666667, 43.4515166667],
          [40.0099833333, 43.3854333333],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: t('map.layers.maritime.jwcBoundaries.caboDelgadoNorthName'),
        source: 'LMA JWLA-034',
        note: t('map.layers.maritime.jwcBoundaries.caboDelgadoNorthNote'),
      },
      geometry: {
        type: 'LineString',
        coordinates: [[40.315, -10.3266666667], [40.574, -10.1716666667]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: t('map.layers.maritime.jwcBoundaries.caboDelgadoSouthName'),
        source: 'LMA JWLA-034',
        note: t('map.layers.maritime.jwcBoundaries.caboDelgadoSouthNote'),
      },
      geometry: {
        type: 'LineString',
        coordinates: [[40.5266666667, -13.5], [40.8283333333, -13.4995]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: t('map.layers.maritime.jwcBoundaries.gulfOfGuineaName'),
        source: 'LMA JWLA-034',
        note: t('map.layers.maritime.jwcBoundaries.gulfOfGuineaNote'),
      },
      geometry: {
        type: 'LineString',
        coordinates: [[1.2, 6.1125], [3, -0.6666666667], [8.7, -0.6666666667]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: t('map.layers.maritime.jwcBoundaries.indianOceanName'),
        source: 'LMA JWLA-034',
        note: t('map.layers.maritime.jwcBoundaries.indianOceanNote'),
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [65, 25.3208333333],
          [65, 10.8],
          [60.25, 10.8],
          [48.75, -6.75],
          [41.5666666667, -1.6666666667],
        ],
      },
    },
  ],
  }
}

export function getMaritimeLayerOption(id: MaritimeLayerId): MaritimeLayerOption {
  const option = maritimeLayerOptions().find((item) => item.id === id)
  if (!option) throw new Error(t('map.layers.maritime.unknownLayer', { id }))
  return option
}
