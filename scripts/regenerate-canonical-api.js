#!/usr/bin/env node
/**
 * Read handfish/docs/component-api.json (the canonical machine-extracted API
 * surface, produced by handfish/scripts/generate-component-api.js) and
 * regenerate skills/handfish-design/references/api-canonical.md from it.
 *
 * Run from the handfish-design repo root:
 *   node scripts/regenerate-canonical-api.js
 *
 * By default it looks for the JSON at ../handfish/docs/component-api.json
 * (i.e. a sibling handfish checkout in ~/platform/). Override with --input
 * if your layout differs:
 *   node scripts/regenerate-canonical-api.js --input /path/to/component-api.json
 *
 * The output file (references/api-canonical.md) is the source-of-truth for
 * attribute names, event types, event detail payloads, form-association
 * status, and toast helper defaults. Hand-written prose in components.md
 * may drift; api-canonical.md is regenerated mechanically and cannot.
 *
 * The maintainer's workflow when handfish ships a new version:
 *   1. cd ~/platform/handfish && git pull && node scripts/generate-component-api.js
 *   2. cd ~/platform/handfish-design && node scripts/regenerate-canonical-api.js
 *   3. Review the diff in references/api-canonical.md
 *   4. Update prose in components.md if any attribute / event / API changed
 *   5. Bump the source-of-truth anchor in README.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const args = process.argv.slice(2)
let inputPath = resolve(repoRoot, '..', 'handfish', 'docs', 'component-api.json')
const inputFlag = args.indexOf('--input')
if (inputFlag !== -1 && args[inputFlag + 1]) {
    inputPath = resolve(args[inputFlag + 1])
}
const outputPath = join(repoRoot, 'skills', 'handfish-design', 'references', 'api-canonical.md')

if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    console.error(`Generate it first by running: node scripts/generate-component-api.js (in the handfish repo)`)
    process.exit(1)
}

const data = JSON.parse(readFileSync(inputPath, 'utf8'))

// The JSON itself is deterministic (no timestamps, no commit hash). Recover
// provenance from the surrounding git checkout: the last commit that touched
// the JSON file is when it was last regenerated, and the timestamp of THIS
// run is when this canonical-md was rebuilt.
const handfishRoot = dirname(dirname(inputPath))
function gitInfoForJson() {
    try {
        const sha = execSync(`git log -1 --format=%H -- ${JSON.stringify(inputPath)}`, {
            cwd: handfishRoot, encoding: 'utf8',
        }).trim()
        const date = execSync(`git log -1 --format=%cI -- ${JSON.stringify(inputPath)}`, {
            cwd: handfishRoot, encoding: 'utf8',
        }).trim()
        return { sha, shortSha: sha.slice(0, 8), date }
    } catch {
        return { sha: 'unknown', shortSha: 'unknown', date: 'unknown' }
    }
}
const provenance = {
    handfishCommit: gitInfoForJson(),
    regeneratedAt: new Date().toISOString(),
}

// ----- Helpers --------------------------------------------------------------

function attrTable(attrs, formAssociated) {
    if (!attrs || attrs.length === 0) {
        return '_No `observedAttributes`._\n'
    }
    const rows = attrs.map(a => `| \`${a}\` |`)
    let table = ''
    table += '| Observed attribute |\n'
    table += '|--------------------|\n'
    table += rows.join('\n') + '\n'
    return table
}

function eventList(events) {
    if (!events || events.length === 0) {
        return '_No events dispatched._\n'
    }
    return events.map(e => {
        let line = `- \`${e.name}\` — ${e.type}`
        if (e.detailKeys && e.detailKeys.length > 0) {
            line += `, \`event.detail = { ${e.detailKeys.map(k => `${k}`).join(', ')} }\``
        } else if (e.type === 'CustomEvent') {
            line += ` (detail not statically extractable; check source)`
        } else {
            line += ` (no \`detail\`; read \`el.value\` or relevant property)`
        }
        return line
    }).join('\n') + '\n'
}

function elementSection(c) {
    const lines = []
    lines.push(`### \`<${c.tag}>\``)
    lines.push('')
    if (c.registeredBy) {
        lines.push(`Registered alongside \`<${c.registeredBy}>\` (importing the parent registers both). See the \`<${c.registeredBy}>\` entry for usage.`)
        lines.push('')
        lines.push(`- **Class:** \`${c.className}\``)
        lines.push(`- **Source:** \`${c.sourceFile}\``)
        lines.push('')
        return lines.join('\n')
    }
    lines.push(`- **Class:** \`${c.className}\``)
    lines.push(`- **Source:** \`${c.sourceFile}\``)
    lines.push(`- **Form-associated:** ${c.formAssociated ? '**yes** (\`attachInternals()\`, participates in `<form>` + `FormData`)' : 'no'}`)
    lines.push('')
    if (c.description) {
        lines.push(`> ${c.description.split('\n').filter(l => l.trim()).join('\n> ')}`)
        lines.push('')
    }
    lines.push('**Observed attributes:**')
    lines.push('')
    if (c.observedAttributes.length === 0) {
        lines.push('_(none)_')
    } else {
        lines.push(c.observedAttributes.map(a => `- \`${a}\``).join('\n'))
    }
    lines.push('')
    lines.push('**Events:**')
    lines.push('')
    lines.push(eventList(c.events))
    return lines.join('\n')
}

function classSection(c) {
    const lines = []
    lines.push(`### \`${c.className}\``)
    lines.push('')
    lines.push(`- **Source:** \`${c.sourceFile}\``)
    if (c.extends) lines.push(`- **Extends:** \`${c.extends}\``)
    lines.push('- **Note:** plain JS class, NOT a custom element. Construct with `new` and call methods.')
    lines.push('')
    if (c.description) {
        lines.push(`> ${c.description.split('\n').filter(l => l.trim()).join('\n> ')}`)
        lines.push('')
    }
    lines.push('See `components.md` for constructor signature and method examples.')
    lines.push('')
    return lines.join('\n')
}

function toastSection(t) {
    const lines = []
    lines.push('### Toast helpers (functions, not custom elements)')
    lines.push('')
    lines.push(`- **Source:** \`${t.sourceFile}\``)
    lines.push('')
    lines.push('**Exports:**')
    lines.push('')
    for (const name of t.exports) {
        const def = t.defaults[name]
        const dur = def && def.duration != null ? ` — default duration: ${def.duration}ms` : ''
        lines.push(`- \`${name}\`${dur}`)
    }
    lines.push('')
    lines.push('Real options for `showToast(msg, opts)`: `{ type, duration, dismissible, showProgress }`. There is no per-call `icon` option.')
    lines.push('')
    return lines.join('\n')
}

function utilSection(name, mod) {
    const lines = []
    lines.push(`### \`utils/${name}.js\``)
    lines.push('')
    lines.push(`- **Source:** \`${mod.sourceFile}\``)
    lines.push('')
    lines.push('**Exports:**')
    lines.push('')
    lines.push(mod.exports.map(e => `- \`${e}\``).join('\n'))
    lines.push('')
    return lines.join('\n')
}

function themesSection(themes) {
    const lines = []
    lines.push(`### Themes`)
    lines.push('')
    lines.push(`- **Stylesheet files:** ${themes.count_files}`)
    lines.push(`- **Total \`data-theme\` values:** ${themes.count_data_theme_values} (some files declare both dark + light variants)`)
    lines.push('')
    lines.push('**Files and the `data-theme` values they declare:**')
    lines.push('')
    lines.push('| File | `data-theme` values |')
    lines.push('|------|---------------------|')
    for (const t of themes.entries) {
        const values = t.dataThemeValues.map(v => `\`${v}\``).join(', ') || '_(none)_'
        lines.push(`| \`${t.file}\` | ${values} |`)
    }
    lines.push('')
    lines.push('Plus the two default modes in `tokens.css`: `dark` (no attribute, or `data-theme="dark"`) and `light` (via `prefers-color-scheme: light` or `data-theme="light"`).')
    lines.push('')
    return lines.join('\n')
}

// ----- Compose document -----------------------------------------------------

const out = []
out.push('# Canonical API Reference')
out.push('')
out.push(`> **Auto-generated** by \`scripts/regenerate-canonical-api.js\` from handfish's machine-extracted API metadata. **Do not edit by hand** — your changes will be overwritten on the next regeneration. Hand-written prose lives in \`components.md\`; this file is the source of truth for attribute names, event types, event detail payloads, form-association status, and toast helper defaults.`)
out.push('')
out.push('## Provenance')
out.push('')
out.push(`- **handfish version:** ${data.meta.handfish_version}`)
out.push(`- **handfish commit (last touched the JSON):** \`${provenance.handfishCommit.shortSha}\` (${provenance.handfishCommit.date})`)
out.push(`- **This file regenerated:** ${provenance.regeneratedAt}`)
out.push(`- **Generator:** \`handfish/scripts/generate-component-api.js\` → JSON → \`handfish-design/scripts/regenerate-canonical-api.js\` → this file`)
out.push('')
out.push('When this file disagrees with `components.md` or another reference, **this file wins** — components.md may have drifted; this is mechanically derived from source.')
out.push('')
out.push('## Custom elements')
out.push('')
out.push(`Total: **${data.custom_elements.length}** registered custom elements. Form-associated components are tagged accordingly.`)
out.push('')
for (const c of data.custom_elements) {
    out.push(elementSection(c))
}

out.push('## Non-element classes')
out.push('')
for (const c of data.classes) {
    out.push(classSection(c))
}

out.push('## Toast helpers')
out.push('')
out.push(toastSection(data.toast_helpers))

out.push('## Utility modules')
out.push('')
for (const [name, mod] of Object.entries(data.utility_modules)) {
    out.push(utilSection(name, mod))
}

out.push('## Theming')
out.push('')
out.push(themesSection(data.themes))

out.push('## Public exports from `src/index.js`')
out.push('')
out.push('Importing any of these via `import { X } from \'handfish\'` is the supported entry point. The list below is the complete set as of the generation timestamp.')
out.push('')
out.push(data.index_exports.map(e => `- \`${e}\``).join('\n'))
out.push('')

writeFileSync(outputPath, out.join('\n') + '\n')

console.log(`✓ Wrote ${outputPath}`)
console.log(`  ${data.custom_elements.length} custom elements`)
console.log(`  ${data.classes.length} non-element classes`)
console.log(`  ${data.toast_helpers.exports.length} toast helpers`)
console.log(`  ${Object.keys(data.utility_modules).length} utility modules`)
console.log(`  ${data.themes.count_files} theme files / ${data.themes.count_data_theme_values} data-theme values`)
console.log(`  Source: handfish ${data.meta.handfish_version} @ ${provenance.handfishCommit.shortSha}`)
