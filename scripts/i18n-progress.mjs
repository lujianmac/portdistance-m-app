/**
 * Translation progress per locale.
 *
 * New languages start as a copy of `en-US` and are translated namespace by namespace,
 * so "how much is still English" is the useful progress metric. A value counts as
 * translated when it differs from the `en-US` value at the same key path.
 *
 * Run: `npm run i18n:progress`
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const localesDir = path.join(root, 'src/i18n/locales')

/** Flatten a locale namespace file into `path -> value` by indentation. */
function flatten(file) {
  const out = new Map()
  if (!fs.existsSync(file)) return out
  const stack = []
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.replace(/\/\/.*$/, '')
    const open = /^(\s*)([A-Za-z0-9_]+):\s*\{\s*$/.exec(line)
    if (open) {
      const depth = open[1].length / 2
      stack.length = depth
      stack[depth] = open[2]
      continue
    }
    const leaf = /^(\s*)([A-Za-z0-9_]+):\s*'((?:[^'\\]|\\.)*)',?\s*$/.exec(line)
    if (!leaf) continue
    const depth = leaf[1].length / 2
    const keyPath = [...stack.slice(0, depth), leaf[2]].filter(Boolean).join('.')
    out.set(keyPath, leaf[3])
  }
  return out
}

function namespaces(locale) {
  const dir = path.join(localesDir, locale)
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts' && entry.name !== 'meta.ts') files.push(entry.name)
    if (entry.isDirectory()) {
      for (const nested of fs.readdirSync(path.join(dir, entry.name))) {
        if (nested.endsWith('.ts') && nested !== 'index.ts') files.push(`${entry.name}/${nested}`)
      }
    }
  }
  return files.sort()
}

const locales = fs.readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(localesDir, entry.name, 'index.ts')))
  .map((entry) => entry.name)
  .filter((locale) => locale !== 'en-US')

const base = new Map()
for (const ns of namespaces('en-US')) for (const [key, value] of flatten(path.join(localesDir, 'en-US', ns))) base.set(`${ns}#${key}`, value)

let exitCode = 0
console.log(`en-US baseline: ${base.size} keys\n`)
const totals = []
for (const locale of locales) {
  const rows = []
  let translated = 0
  let total = 0
  for (const ns of namespaces(locale)) {
    const values = flatten(path.join(localesDir, locale, ns))
    let nsTranslated = 0
    for (const [key, value] of values) {
      const reference = base.get(`${ns}#${key}`)
      if (reference === undefined) continue
      total += 1
      if (value !== reference) nsTranslated += 1
    }
    translated += nsTranslated
    rows.push({ ns, nsTranslated, nsTotal: values.size })
  }
  const pct = total ? Math.round((translated / total) * 1000) / 10 : 0
  console.log(`${locale}: ${translated}/${total} (${pct}%)`)
  const done = rows.filter((row) => row.nsTranslated > 0 && row.nsTranslated < row.nsTotal)
  const finished = rows.filter((row) => row.nsTranslated === row.nsTotal && row.nsTotal > 0)
  if (finished.length) console.log(`   complete: ${finished.map((row) => row.ns).join(', ')}`)
  if (done.length) console.log(`   partial : ${done.map((row) => `${row.ns} ${row.nsTranslated}/${row.nsTotal}`).join(', ')}`)
  console.log(`   untouched: ${rows.filter((row) => row.nsTranslated === 0).map((row) => row.ns).join(', ')}\n`)
  totals.push({ locale, translated, total })
}

const sumTranslated = totals.reduce((sum, row) => sum + row.translated, 0)
const sumTotal = totals.reduce((sum, row) => sum + row.total, 0)
console.log(`all locales: ${sumTranslated}/${sumTotal} strings localised`)
if (!sumTotal) exitCode = 0
process.exit(exitCode)
