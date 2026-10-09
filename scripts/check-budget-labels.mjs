/**
 * Voyage-budget terminology guard.
 *
 * The budget module's English/Chinese labels are a spec agreed with the product
 * owner (speed profiles, daily-fuel rows, port-rotation columns, commissions).
 * They are shared by three namespaces — `budget.detail`, `budget.editor` and
 * `budget.pages` — so a rename in one of them silently drifts away from the
 * others. This check fails when:
 *
 *   1. a canonical label is missing from a namespace that must carry it,
 *   2. wording that was explicitly replaced comes back,
 *   3. a unit lives in both the label and the value (`Sea(Days)` + `{value} days`),
 *   4. `航行时间` / `ECA航行` lose the `(天)` unit that replaced the value suffix.
 *
 * Run: `npm run i18n:labels`
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const NS = ['detail', 'editor', 'pages', 'list']
const read = (locale, ns) => {
  const file = path.join(root, 'src/i18n/locales', locale, 'budget', `${ns}.ts`)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}
const literals = (text) => [...text.matchAll(/(\w+):\s*'([^']*)'/g)].map(([, key, value]) => ({ key, value }))

let fails = 0
const fail = (msg) => { fails += 1; console.log(`FAIL  ${msg}`) }
const pass = (msg) => console.log(`PASS  ${msg}`)

/** canonical labels, checked across every budget namespace */
const REQUIRED = {
  'en-US': [
    'Ballast(Full)', 'Ballast(Eco)', 'Laden(Full)', 'Laden(Eco)',
    'Main(Laden)', 'Main(Ballast)', 'Sub', 'Idle', 'Work',
    'Sea(Days)', 'Port(I/W) Days', 'ECA Sea (Days)',
    'LSDO/MGO(Sub)', 'Add. Comm',
  ],
  'zh-CN': ['航行时间(天)', 'ECA航行(天)', '回扣佣金', '辅机油耗'],
}
/** labels a specific namespace must carry itself (they are rendered there) */
const REQUIRED_IN = [
  ['en-US', 'detail', ['Ballast(Full)', 'Main(Laden)', 'Sea(Days)', 'Port(I/W) Days', 'ECA Sea (Days)', 'LSDO/MGO(Sub)']],
  ['en-US', 'editor', ['Ballast(Full)', 'Main(Laden)', 'Sea(Days)', 'ECA Sea (Days)']],
  ['zh-CN', 'detail', ['航行时间(天)', 'ECA航行(天)']],
  ['zh-CN', 'editor', ['航行时间(天)', 'ECA航行(天)']],
]
/** superseded wording that must not come back */
const FORBIDDEN = [
  'Ballast full speed', 'Ballast eco speed', 'Laden full speed', 'Laden eco speed',
  'Laden main engine', 'Ballast main engine', 'Idle in port', 'Working in port',
  'Days in port', 'ECA sailing', 'Address commission', 'LSDO/MGO (',
]
/** day-count inputs legitimately keep their unit inside the value */
const VALUE_UNIT_KEYS = /^(idleDays|workDays|weatherMargin)|idle|work|demurrage|dispatch|port|hire|berth|weather|wait/i

for (const [locale, wanted] of Object.entries(REQUIRED)) {
  const all = NS.map((ns) => read(locale, ns)).join('\n')
  for (const label of wanted) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const found = all.includes(`'${label}'`)
      || new RegExp(`'${escaped}[^']*'`).test(all) // e.g. `Idle {value} days`, `Add. Comm {rate}%`
    if (!found) fail(`${locale}: canonical label '${label}' is missing from the budget namespaces`)
  }
  pass(`${locale}: canonical labels present (${wanted.length} checked)`)
}

for (const [locale, ns, wanted] of REQUIRED_IN) {
  const text = read(locale, ns)
  const missing = wanted.filter((label) => !new RegExp(`'${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^']*'`).test(text))
  if (missing.length) fail(`${locale}/budget/${ns}.ts is missing ${missing.map((m) => `'${m}'`).join(', ')}`)
  else pass(`${locale}/budget/${ns}.ts carries its own canonical labels`)
}

for (const locale of Object.keys(REQUIRED)) {
  const hits = []
  for (const ns of NS) {
    for (const { key, value } of literals(read(locale, ns))) {
      if (VALUE_UNIT_KEYS.test(key)) continue
      for (const old of FORBIDDEN) if (value.includes(old)) hits.push(`${ns}.ts ${key} -> '${value}'`)
    }
  }
  if (hits.length) fail(`${locale}: superseded wording is back -> ${hits.join(' | ')}`)
  else pass(`${locale}: no superseded budget wording`)
}

for (const ns of NS) {
  for (const { value } of literals(read('zh-CN', ns))) {
    for (const stem of ['航行时间', 'ECA航行']) {
      for (let at = value.indexOf(stem); at >= 0; at = value.indexOf(stem, at + 1)) {
        if (!value.startsWith('(天)', at + stem.length)) {
          fail(`zh-CN/budget/${ns}.ts: '${value}' uses ${stem} without the (天) unit`)
        }
      }
    }
  }
}
pass('zh-CN: 航行时间(天) / ECA航行(天) carry the unit')

for (const [locale, ns] of [['zh-CN', 'detail'], ['en-US', 'detail'], ['zh-CN', 'editor'], ['en-US', 'editor']]) {
  for (const { key, value } of literals(read(locale, ns))) {
    if (!value.includes('{value}') || VALUE_UNIT_KEYS.test(key)) continue
    const carriesUnit = locale === 'zh-CN' ? value.includes('天') : /\bdays?\b/i.test(value)
    if (carriesUnit) fail(`${locale}/budget/${ns}.ts: ${key} -> '${value}' repeats the unit the label now carries`)
  }
}
pass('detail/editor: sailing units live in the label, not in the value')

console.log(fails ? `\nbudget labels FAILED (${fails})` : '\nbudget labels OK')
process.exit(fails ? 1 : 0)
