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
 * if your layout differs, and --output to write somewhere else:
 *   node scripts/regenerate-canonical-api.js --input /path/to/component-api.json
 *
 * --check regenerates in memory and compares against the file on disk without
 * writing, exiting non-zero if they differ. That is the drift alarm: handfish
 * ships components on its own cadence, and nothing else notices when this
 * plugin's canonical reference falls behind.
 *
 * The output is deterministic — the same input always produces byte-identical
 * output — so an empty diff genuinely means nothing changed. Provenance comes
 * from git rather than a wall clock for exactly this reason.
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
 *   5. Add any new tags to the `description` frontmatter in SKILL.md
 *   6. npm test — confirms both drift checks are clean
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const args = process.argv.slice(2)
let inputPath = resolve(repoRoot, '..', 'handfish', 'docs', 'component-api.json')
let outputPath = join(repoRoot, 'skills', 'handfish-design', 'references', 'api-canonical.md')
let checkOnly = false

// Parsed strictly. A tolerated typo would silently fall back to the defaults
// and overwrite the real reference, which is the failure mode this whole
// change exists to prevent.
for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--check') {
        checkOnly = true
    } else if (arg === '--input' || arg === '--output') {
        const value = args[i + 1]
        if (!value || value.startsWith('--')) {
            console.error(`${arg} needs a path`)
            process.exit(2)
        }
        if (arg === '--input') inputPath = resolve(value)
        else outputPath = resolve(value)
        i++
    } else {
        console.error(`Unrecognised argument: ${arg}`)
        console.error('Usage: regenerate-canonical-api.js [--input <json>] [--output <md>] [--check]')
        process.exit(2)
    }
}

if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    console.error(`Generate it first by running: node scripts/generate-component-api.js (in the handfish repo)`)
    process.exit(1)
}

const data = JSON.parse(readFileSync(inputPath, 'utf8'))

// The JSON itself is deterministic (no timestamps, no commit hash), and this
// file emits no timestamp of its own. Provenance is recovered from the
// surrounding git checkout: the last commit that touched the JSON is when it
// was last regenerated. That, and only that, is what makes the output
// reproducible enough to check.
const handfishRoot = dirname(dirname(inputPath))

function git(command) {
    return execSync(command, { cwd: handfishRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function gitInfoForJson() {
    let shallow = false
    try {
        shallow = git('git rev-parse --is-shallow-repository') === 'true'
    } catch {
        // Not a git checkout at all — fall through to the unknown provenance
        // path below, which is a supported (if unhelpful) state.
    }
    if (shallow) {
        // `git log -1 -- <path>` on a shallow clone reports the grafted tip as
        // having created every file, so provenance here would be the wrong
        // commit stated with full confidence. Report it as unknown instead:
        // a stable, honest value that cannot be mistaken for a real SHA, and
        // one that keeps the output reproducible rather than varying with
        // however deep the surrounding clone happens to be.
        console.error(`Warning: shallow git checkout at ${handfishRoot} — provenance unavailable.`)
        console.error('  Fetch full history for a real commit (CI: actions/checkout with fetch-depth: 0).')
        return { sha: 'unknown', shortSha: 'unknown', date: 'unknown' }
    }
    try {
        const sha = git(`git log -1 --format=%H -- ${JSON.stringify(inputPath)}`)
        const date = git(`git log -1 --format=%cI -- ${JSON.stringify(inputPath)}`)
        if (!sha) return { sha: 'unknown', shortSha: 'unknown', date: 'unknown' }
        try {
            if (git(`git status --porcelain -- ${JSON.stringify(inputPath)}`)) {
                console.error(`Warning: ${inputPath} has uncommitted changes.`)
                console.error(`  Provenance will read ${sha.slice(0, 8)}, which is not the content being read.`)
                console.error('  Commit the JSON first, or expect this reference to go stale the moment it is.')
            }
        } catch { /* status is advisory; never block on it */ }
        return { sha, shortSha: sha.slice(0, 8), date }
    } catch {
        return { sha: 'unknown', shortSha: 'unknown', date: 'unknown' }
    }
}
const provenance = {
    handfishCommit: gitInfoForJson(),
}

// ----- Helpers --------------------------------------------------------------

function eventList(events) {
    if (!events || events.length === 0) {
        return '_No events dispatched._\n'
    }
    return events.map(e => {
        let line = `- \`${e.name}\` — ${e.type}`
        if (e.detailKeys && e.detailKeys.length > 0) {
            line += `, \`event.detail = { ${e.detailKeys.join(', ')} }\``
        } else if (e.type === 'CustomEvent') {
            line += `. Static extraction cannot determine the detail. Check the source.`
        } else {
            line += `. No \`detail\`. Read \`el.value\` or the relevant property.`
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
    if (!c.observedAttributes || c.observedAttributes.length === 0) {
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
    lines.push('- **Note:** plain JS class, NOT a custom element. Construct it with `new`. Then call its methods.')
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
    lines.push('Options for `showToast(msg, opts)`: `{ type, duration, dismissible, showProgress, dismissLabel }`. `dismissLabel` (default `\'Dismiss\'`) sets the close button\'s `aria-label`. Override it with translated text. There is no per-call `icon` option.')
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

// ----- Drift reporting ------------------------------------------------------

/**
 * Describe how the file on disk differs from what the generator produces.
 * A raw diff of a 400-line document buries the answer; what a maintainer
 * needs first is which elements appeared or vanished.
 */
function summariseDrift(onDisk, rendered) {
    const tagsIn = (text) => new Set([...text.matchAll(/^### `<([a-z0-9-]+)>`$/gm)].map(m => m[1]))
    const before = tagsIn(onDisk)
    const after = tagsIn(rendered)
    const added = [...after].filter(t => !before.has(t))
    const removed = [...before].filter(t => !after.has(t))

    const lines = []
    if (added.length) lines.push(`  elements added:   ${added.map(t => `<${t}>`).join(', ')}`)
    if (removed.length) lines.push(`  elements removed: ${removed.map(t => `<${t}>`).join(', ')}`)
    if (!lines.length) {
        const beforeLines = onDisk.split('\n')
        const afterLines = rendered.split('\n')
        const at = beforeLines.findIndex((l, i) => l !== afterLines[i])
        // findIndex misses the case where the file on disk is a strict prefix
        // of the generated one — a stripped trailing newline gets here.
        lines.push(at === -1
            ? `  no element added or removed. The file on disk is truncated (${beforeLines.length} lines on disk vs ${afterLines.length} generated)`
            : `  no element added or removed. First differing line: ${at + 1}`)
    }
    return lines.join('\n')
}

// ----- Compose document -----------------------------------------------------

const out = []
out.push('# Canonical API Reference')
out.push('')
out.push(`> \`scripts/regenerate-canonical-api.js\` generates this file from handfish's extracted API metadata. **Do not edit this file by hand.** Regeneration overwrites manual edits. Write explanatory prose in \`components.md\`. This file defines the authoritative attributes, event types, event detail payloads, form-association status, and toast helper defaults.`)
out.push('')
out.push('## Provenance')
out.push('')
out.push(`- **handfish version:** ${data.meta.handfish_version}`)
out.push(`- **handfish commit (last touched the JSON):** \`${provenance.handfishCommit.shortSha}\` (${provenance.handfishCommit.date})`)
out.push('- **This file regenerated:** deterministically from the commit above — run `git log` on this file for when.')
out.push(`- **Generator:** \`handfish/scripts/generate-component-api.js\` → JSON → \`handfish-design/scripts/regenerate-canonical-api.js\` → this file`)
out.push('')
out.push('When this file disagrees with `components.md` or another reference, **this file takes precedence**. Other references may have drifted. This file derives directly from source.')
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
out.push('Importing any of these via `import { X } from \'handfish\'` is the supported entry point. The list below is the complete set as of the handfish commit above.')
out.push('')
out.push(data.index_exports.map(e => `- \`${e}\``).join('\n'))
out.push('')

const rendered = out.join('\n') + '\n'

if (checkOnly) {
    if (!existsSync(outputPath)) {
        console.error(`Missing: ${outputPath}`)
        console.error('Run: node scripts/regenerate-canonical-api.js')
        process.exit(1)
    }
    const onDisk = readFileSync(outputPath, 'utf8')
    if (onDisk !== rendered) {
        console.error(`Stale: ${outputPath}`)
        console.error(summariseDrift(onDisk, rendered))
        console.error('Run: node scripts/regenerate-canonical-api.js')
        process.exit(1)
    }
    console.log(`✓ Up to date: ${outputPath}`)
    process.exit(0)
}

writeFileSync(outputPath, rendered)

console.log(`✓ Wrote ${outputPath}`)
console.log(`  ${data.custom_elements.length} custom elements`)
console.log(`  ${data.classes.length} non-element classes`)
console.log(`  ${data.toast_helpers.exports.length} toast helpers`)
console.log(`  ${Object.keys(data.utility_modules).length} utility modules`)
console.log(`  ${data.themes.count_files} theme files / ${data.themes.count_data_theme_values} data-theme values`)
console.log(`  Source: handfish ${data.meta.handfish_version} @ ${provenance.handfishCommit.shortSha}`)
