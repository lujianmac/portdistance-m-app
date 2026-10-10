import { http } from '@/api/client'

/**
 * Reference data shared by the vessel-particulars screens (list / detail / editor).
 * The two endpoints are the same ones the legacy app used (`src/api/common.ts`).
 */

/** One row of `/portdist/dictionary/list` (ship types, fuel types, ...). */
export interface DictionaryItem {
  dictId: string | number
  dictName: string
  dictTypeId: string | number
}

/** One row of `/portdist/country/list`; the vessel's flag stores `countryCode`. */
export interface CountryItem {
  countryCode: string
}

/** Ship types are the dictionary rows whose `dictTypeId` is 16004 (legacy app convention). */
export const SHIP_TYPE_DICT_TYPE_ID = 16004

export function getDictionaryList() {
  return http.get<DictionaryItem[]>('/portdist/dictionary/list')
}

export function getCountryList() {
  return http.get<CountryItem[]>('/portdist/country/list')
}
