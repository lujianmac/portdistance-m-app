import { t } from '@/i18n'

export const TIMEZONE_FEATURE_SERVICE_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/World_TimeZones/FeatureServer/0/query'

export interface TimezoneLayerMetadata {
  name: string
  shortName: string
  source: string
  version: string
}

// 时区图层元信息在调用时取文案，保证语言切换后名称/来源/版本同步更新。
export function timezoneLayerMetadata(): TimezoneLayerMetadata {
  return {
    name: t('map.layers.timezone.name'),
    shortName: t('map.layers.timezone.shortName'),
    source: t('map.layers.timezone.source'),
    version: t('map.layers.timezone.version'),
  }
}

export interface TimezoneFeatureProperties {
  UTC_offset_ST?: string
  UTC_offset_DST?: string
}
