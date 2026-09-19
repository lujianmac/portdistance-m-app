#!/usr/bin/env node
/**
 * i18n runtime smoke test (`npm run i18n:smoke`).
 *
 * Bundles the real `src/i18n` + `src/stores/locale.ts` (locale files included) and
 * exercises them outside the browser:
 *   - message lookup, interpolation and locale switching;
 *   - device-language detection, preference persistence and `apiLanguage()`.
 *
 * Complements `scripts/check-i18n.mjs`, which only inspects static keys.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rolldown } from 'rolldown'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VIRTUAL_ENTRY = 'virtual:i18n-smoke'

const entryCode = `
export { useLocaleStore, detectDeviceLocale } from '@/stores/locale'
export { i18n, activeLocale, apiLanguage } from '@/i18n'
export { pinia } from '@/stores/pinia'
export { LOCALE_STORAGE_KEY } from '@/i18n/locales/meta'
`

async function loadModules() {
  const plugins = [
    {
      name: 'virtual-entry',
      resolveId(id) {
        return id === VIRTUAL_ENTRY ? VIRTUAL_ENTRY : null
      },
      load(id) {
        return id === VIRTUAL_ENTRY ? entryCode : null
      },
    },
    {
      name: 'resolve-at-alias',
      resolveId(id) {
        if (!id.startsWith('@/')) return null
        const base = path.join(root, 'src', id.slice(2))
        const candidates = [`${base}.ts`, `${base}.vue`, path.join(base, 'index.ts'), base]
        return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
      },
    },
    {
      // Node has no Vite env object: neutralise `import.meta.env.DEV` while bundling.
      name: 'neutralise-import-meta-env',
      transform(code) {
        return code.includes('import.meta.env') ? { code: code.replaceAll('import.meta.env.DEV', 'false') } : null
      },
    },
  ]

  const bundle = await rolldown({ input: VIRTUAL_ENTRY, logLevel: 'silent', plugins })
  const { output } = await bundle.generate({ format: 'cjs' })
  await bundle.close()

  const module = { exports: {} }
  new Function('module', 'exports', 'require', output[0].code)(module, module.exports, () => {
    throw new Error('unexpected external require')
  })
  return module.exports
}

const { i18n, activeLocale, apiLanguage, useLocaleStore, detectDeviceLocale, pinia, LOCALE_STORAGE_KEY } = await loadModules()

let failed = 0
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} -> ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

console.log('— messages —')
const cases = [
  ['common.save', undefined, 'zh-CN', '保存'],
  ['common.save', undefined, 'en-US', 'Save'],
  ['common.cancel', undefined, 'zh-CN', '取消'],
  ['common.cancel', undefined, 'en-US', 'Cancel'],
  ['common.unit.nauticalMile', undefined, 'zh-CN', '海里'],
  ['common.unit.nauticalMile', undefined, 'en-US', 'nautical miles'],
  ['tabs.tab.distance', undefined, 'en-US', 'Distance'],
  ['language.system', undefined, 'zh-CN', '跟随系统'],
  ['errors.requestFailedWithStatus', { status: 500 }, 'zh-CN', '请求失败（500）'],
  ['errors.requestFailedWithStatus', { status: 500 }, 'en-US', 'Request failed (500)'],
]
for (const [key, named, locale, expected] of cases) {
  i18n.global.locale.value = locale
  check(`[${locale}] ${key}`, named ? i18n.global.t(key, named) : i18n.global.t(key), expected)
}

i18n.global.locale.value = 'zh-CN'
const zh = i18n.global.t('common.cancel')
i18n.global.locale.value = 'en-US'
check('locale switch (取消 -> Cancel)', [zh, i18n.global.t('common.cancel')], ['取消', 'Cancel'])

console.log('— locale store —')
const setNavigator = (value) => Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })

setNavigator({ languages: ['zh-CN', 'en-US'], language: 'zh-CN' })
check('device zh-CN', detectDeviceLocale(), 'zh-CN')
setNavigator({ languages: ['en-GB'], language: 'en-GB' })
check('device en-GB -> en-US', detectDeviceLocale(), 'en-US')
setNavigator({ languages: ['fr-FR'], language: 'fr-FR' })
check('unsupported device -> default', detectDeviceLocale(), 'en-US')

const store = useLocaleStore(pinia)
store.initLocale()
check('default preference', store.preference, 'system')
store.setPreference('zh-CN')
check('i18n follows preference', activeLocale(), 'zh-CN')
check('translation follows preference', i18n.global.t('common.save'), '保存')
check('api language follows preference', apiLanguage(), 'zh')
check('language picker native name', store.option.nativeName, '简体中文')
store.setPreference('en-US')
check('api language for en-US', apiLanguage(), 'en')
check('storage key', LOCALE_STORAGE_KEY, 'pd.app.locale')

// Round-trip through `appStorage` (Capacitor Preferences on device): the choice must survive a restart.
store.setPreference('zh-CN')
store.initLocale()
check('preference restored from appStorage (zh-CN)', store.preference, 'zh-CN')
check('locale restored from appStorage (zh-CN)', activeLocale(), 'zh-CN')
store.setPreference('en-US')
store.initLocale()
check('preference restored from appStorage (en-US)', store.preference, 'en-US')

console.log(failed ? `i18n smoke FAILED (${failed} case(s))` : 'i18n smoke OK')
process.exit(failed ? 1 : 0)
