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
/**
 * Locales are discovered from the directory tree, so adding a language cannot leave it
 * unvalidated. `en-US` is the reference tree (it is also the runtime fallback).
 */
const LOCALES = fs
  .readdirSync(localeDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(localeDir, entry.name, 'index.ts')))
  .map((entry) => entry.name)
  .sort((a, b) => (a === 'en-US' ? -1 : b === 'en-US' ? 1 : a.localeCompare(b)))
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

const en = messages['en-US']
const zh = messages['zh-CN']

/** Named placeholders must match across locales, otherwise interpolated values disappear. */
const placeholders = (value) => new Set([...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]))

if (en) {
  for (const locale of LOCALES) {
    const tree = messages[locale]
    if (!tree) continue

    // 1. every locale must expose exactly the en-US key paths
    for (const key of en.keys()) if (!tree.has(key)) problems.push(`${locale} is missing key: ${key}`)
    for (const key of tree.keys()) if (!en.has(key)) problems.push(`${locale} has a key that en-US does not: ${key}`)

    for (const [key, value] of tree) {
      if (typeof value !== 'string') problems.push(`${locale} value is not a string: ${key}`)
      else if (!value.trim()) problems.push(`${locale} value is empty: ${key}`)
      // A raw `|` is a vue-i18n plural separator and silently truncates the message.
      else if (value.includes('|') && !value.includes("{'|'}")) {
        problems.push(`${locale}:${key}: raw "|" in message — vue-i18n treats it as a plural separator, escape it as {'|'}`)
      }

      const reference = en.get(key)
      if (typeof value !== 'string' || typeof reference !== 'string') continue
      const translated = placeholders(value)
      const expected = placeholders(reference)
      for (const name of expected) if (!translated.has(name)) problems.push(`${locale}:${key} is missing placeholder {${name}}`)
      for (const name of translated) if (!expected.has(name)) problems.push(`${locale}:${key} has an extra placeholder {${name}}`)
    }
  }
}

const knownKeys = new Set(LOCALES.flatMap((locale) => [...(messages[locale]?.keys() ?? [])]))
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

console.log(`i18n check passed: ${en?.size ?? 0} keys × ${LOCALES.length} locales (${LOCALES.join(', ')}), ${usedKeys.size} keys referenced in src/.`)
