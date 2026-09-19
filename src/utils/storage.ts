import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const memory = new Map<string, string>()
let initialized = false
let initialization: Promise<void> | null = null

function browserStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

async function persist(key: string, value: string) {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value })
    return
  }
  if (browserStorageAvailable()) window.localStorage.setItem(key, value)
}

async function erase(key: string) {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key })
    return
  }
  if (browserStorageAvailable()) window.localStorage.removeItem(key)
}

export const appStorage = {
  async init() {
    if (initialized) return
    if (initialization) return initialization

    initialization = (async () => {
      if (Capacitor.isNativePlatform()) {
        const { keys } = await Preferences.keys()
        const entries = await Promise.all(keys.map(async (key) => [key, (await Preferences.get({ key })).value] as const))
        entries.forEach(([key, value]) => {
          if (value !== null) memory.set(key, value)
        })
      } else if (browserStorageAvailable()) {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index)
          if (!key) continue
          const value = window.localStorage.getItem(key)
          if (value !== null) memory.set(key, value)
        }
      }
      initialized = true
    })().catch(() => {
      initialized = true
    }).finally(() => {
      initialization = null
    })

    return initialization
  },

  getSync(key: string) {
    return memory.get(key) ?? null
  },

  async get(key: string) {
    await this.init()
    return memory.get(key) ?? null
  },

  setValue(key: string, value: string) {
    memory.set(key, value)
    void persist(key, value).catch(() => undefined)
  },

  async set(key: string, value: string) {
    memory.set(key, value)
    await persist(key, value).catch(() => undefined)
  },

  removeValue(key: string) {
    memory.delete(key)
    void erase(key).catch(() => undefined)
  },

  async remove(key: string) {
    memory.delete(key)
    await erase(key).catch(() => undefined)
  },
}
