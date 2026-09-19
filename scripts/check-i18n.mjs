#!/usr/bin/env node
/**
 * i18n guard script (`npm run i18n:check`).
 *
 * 1. Loads both locale message trees (TS is bundled with rolldown, no build step needed).
 * 2. Verifies zh-CN and en-US expose exactly the same key paths.
 * 3. Verifies every literal `t('...')` key used in `src/` exists in the messages.
 * 4. Verifies no user-facing Chinese text is left in `src/` outside the locale files.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rolldown } from 'rolldown'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')
const localeDir = path.join(srcDir, 'i18n', 'locales')
const LOCALES = ['zh-CN', 'en-US']
const HAN = /[\u4e00-\u9fff]/

/** Bundle a TS module and return its default export. */
async function loadDefaultExport(entry) {
  const bundle = await rolldown({ input: entry, logLevel: 'silent' })
  const { output } = await bundle.generate({ format: 'cjs', exports: 'default' })
  await bundle.close()
  const module = { exports: {} }
  const require = () => {
    throw new Error('unexpected external require')
  }
  new Function('module', 'exports', 'require', output[0].code)(module, module.exports, require)
  return module.exports && module.exports.default !== undefined ? module.exports.default : module.exports
}

/** Flatten a nested message object into `a.b.c` -> value. */
function flatten(value, prefix = '', out = new Map()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out)
    }
    return out
  }
  out.set(prefix, value)
  return out
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(vue|ts)$/.test(entry.name)) out.push(full)
  }
  return out
}

/** Remove comments and <style> blocks so only shipped text is inspected. */
function stripComments(source, isVue) {
  let text = isVue ? source.replace(/<style[\s\S]*?<\/style>/g, '') : source
  text = text.replace(/\/\*[\s\S]*?\*\//g, '')
  text = text.replace(/(^|[^:"'`])\/\/[^\n]*/gm, '$1')
  return text
}

const problems = []
const messages = {}

for (const locale of LOCALES) {
  const entry = path.join(localeDir, locale, 'index.ts')
  if (!fs.existsSync(entry)) {
    problems.push(`missing locale entry: ${path.relative(root, entry)}`)
    continue
  }
  messages[locale] = flatten(await loadDefaultExport(entry))
}

const [zh, en] = LOCALES.map((locale) => messages[locale])

if (zh && en) {
  for (const key of zh.keys()) if (!en.has(key)) problems.push(`en-US is missing key: ${key}`)
  for (const key of en.keys()) if (!zh.has(key)) problems.push(`zh-CN is missing key: ${key}`)
  for (const [key, value] of zh) {
    if (typeof value !== 'string') problems.push(`zh-CN value is not a string: ${key}`)
    else if (!value.trim()) problems.push(`zh-CN value is empty: ${key}`)
  }
  for (const [key, value] of en) {
    if (typeof value !== 'string') problems.push(`en-US value is not a string: ${key}`)
    else if (!value.trim()) problems.push(`en-US value is empty: ${key}`)
  }

  // Named placeholders must match across locales, otherwise interpolated values disappear.
  const placeholders = (value) => new Set([...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]))
  for (const [key, value] of zh) {
    if (typeof value !== 'string' || typeof en.get(key) !== 'string') continue
    const zhParams = placeholders(value)
    const enParams = placeholders(en.get(key))
    for (const name of zhParams) if (!enParams.has(name)) problems.push(`en-US:${key} is missing placeholder {${name}} used by zh-CN`)
    for (const name of enParams) if (!zhParams.has(name)) problems.push(`zh-CN:${key} is missing placeholder {${name}} used by en-US`)
  }

  // A raw `|` is a vue-i18n plural separator and silently truncates the message.
  for (const [key, value] of [...zh, ...en]) {
    if (typeof value === 'string' && value.includes('|') && !value.includes("{'|'}")) {
      problems.push(`${key}: raw "|" in message — vue-i18n treats it as a plural separator, escape it as {'|'}`)
    }
  }
}

const knownKeys = new Set([...(zh?.keys() ?? []), ...(en?.keys() ?? [])])
const usedKeys = new Map()

for (const file of walk(srcDir)) {
  const relative = path.relative(root, file)
  const isLocaleFile = file.startsWith(localeDir)
  const raw = fs.readFileSync(file, 'utf8')
  const code = stripComments(raw, file.endsWith('.vue'))

  // 3. literal translation keys
  const keyPattern = /(?:\bt|\btranslate|i18n\.global\.t)\(\s*'([^']+)'/g
  for (const match of code.matchAll(keyPattern)) {
    const key = match[1]
    if (!key.includes('.')) continue
    if (!knownKeys.has(key)) problems.push(`${relative}: unknown translation key "${key}"`)
    usedKeys.set(key, relative)
  }

  // 4. leftover Chinese text (locale files legitimately contain Chinese)
  if (isLocaleFile) continue
  code.split('\n').forEach((line, index) => {
    if (HAN.test(line)) problems.push(`${relative}:${index + 1} untranslated Chinese text: ${line.trim().slice(0, 120)}`)
  })

  // 5. hardcoded locales in formatting calls
  const hardcoded = code.match(/toLocaleString\(\s*'[a-zA-Z-]+'|toLocaleDateString\(\s*'[a-zA-Z-]+'|toLocaleTimeString\(\s*'[a-zA-Z-]+'/g)
  if (hardcoded) problems.push(`${relative}: hardcoded locale in ${[...new Set(hardcoded)].join(', ')} — use @/i18n/format helpers`)
}

if (problems.length) {
  console.error(`i18n check failed with ${problems.length} problem(s):\n`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`i18n check passed: ${zh.size} keys per locale, ${usedKeys.size} keys referenced in src/.`)
