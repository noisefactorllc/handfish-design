import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')
const script = join(repoRoot, 'scripts', 'regenerate-canonical-api.js')
const fixture = join(here, 'fixtures', 'component-api.json')
const committedReference = join(repoRoot, 'skills', 'handfish-design', 'references', 'api-canonical.md')

/**
 * Run the generator. Returns { status, stdout, stderr } and never throws.
 *
 * spawnSync rather than execFileSync: several of these runs are expected to
 * fail, and execFileSync surfaces those as a throw whose success path has no
 * stderr at all — which quietly made a warning-on-success assertion
 * unfalsifiable. Both streams are captured, never forwarded, so a passing
 * suite does not print the failures it deliberately provokes.
 */
function run(args) {
    const result = spawnSync(process.execPath, [script, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (result.error) throw result.error
    return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

function withTempDir(fn) {
    const dir = mkdtempSync(join(tmpdir(), 'handfish-design-test-'))
    try {
        return fn(dir)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
}

test('the same input twice produces byte-identical output', () => {
    withTempDir((dir) => {
        const a = join(dir, 'a.md')
        const b = join(dir, 'b.md')
        assert.equal(run(['--input', fixture, '--output', a]).status, 0)
        assert.equal(run(['--input', fixture, '--output', b]).status, 0)
        assert.equal(
            readFileSync(a, 'utf8'),
            readFileSync(b, 'utf8'),
            'regenerating from unchanged input must not produce a diff — otherwise no drift check is possible',
        )
    })
})

test('--check succeeds when the reference on disk matches its input', () => {
    withTempDir((dir) => {
        const out = join(dir, 'ref.md')
        assert.equal(run(['--input', fixture, '--output', out]).status, 0)
        const result = run(['--input', fixture, '--output', out, '--check'])
        assert.equal(result.status, 0, `expected a clean check, got:\n${result.stdout}${result.stderr}`)
    })
})

test('--check fails and names the file when the reference is stale', () => {
    withTempDir((dir) => {
        const out = join(dir, 'ref.md')
        assert.equal(run(['--input', fixture, '--output', out]).status, 0)
        writeFileSync(out, '# hand-edited, now stale\n')

        const result = run(['--input', fixture, '--output', out, '--check'])
        assert.notEqual(result.status, 0, 'a stale reference must fail the check')
        assert.match(result.stderr + result.stdout, /ref\.md/, 'the failure must name the file that is stale')
    })
})

test('--check never writes', () => {
    withTempDir((dir) => {
        const out = join(dir, 'ref.md')
        const sentinel = '# untouched\n'
        writeFileSync(out, sentinel)
        run(['--input', fixture, '--output', out, '--check'])
        assert.equal(readFileSync(out, 'utf8'), sentinel, '--check must be read-only')
    })
})

test('--check reports a missing reference rather than crashing', () => {
    withTempDir((dir) => {
        const out = join(dir, 'absent.md')
        const result = run(['--input', fixture, '--output', out, '--check'])
        assert.notEqual(result.status, 0)
        assert.match(result.stderr, /^Missing: .*absent\.md$/m)
        // An uncaught ENOENT also exits non-zero and also mentions the path,
        // so asserting only that would pass with the guard deleted.
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('an unrecognised flag is rejected rather than silently ignored', () => {
    // Silent tolerance is how a test can pass for the wrong reason: a script
    // that ignores --output happily writes to the real reference instead.
    withTempDir((dir) => {
        const result = run(['--input', fixture, '--output', join(dir, 'x.md'), '--not-a-flag'])
        assert.notEqual(result.status, 0)
        assert.match(result.stderr + result.stdout, /--not-a-flag/)
    })
})

test('a missing input is reported, not thrown', () => {
    const result = run(['--input', join(tmpdir(), 'definitely-not-here.json')])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr + result.stdout, /not found/i)
})

test('malformed JSON input is reported, not thrown', () => {
    // A truncated or hand-corrupted component-api.json would otherwise die as
    // an uncaught SyntaxError pointing at this script instead of at the file
    // the maintainer has to regenerate.
    withTempDir((dir) => {
        const input = join(dir, 'corrupt.json')
        writeFileSync(input, '{"custom_elements": [')
        const result = run(['--input', input, '--output', join(dir, 'out.md')])
        assert.notEqual(result.status, 0)
        // includes rather than a regex: the temp path needs no escaping, and
        // the message must name the exact file.
        assert.ok((result.stderr + result.stdout).includes(`Invalid JSON: ${input}`))
        // An uncaught SyntaxError also exits non-zero and also mentions the
        // message, so the absence of a stack trace is the load-bearing assert:
        // it is what separates a reported condition from a crash.
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('input that does not match the component-api schema is reported, not thrown', () => {
    // handfish owns this JSON's schema. If its extractor ever changes shape,
    // the maintainer needs the section that drifted, not a TypeError from
    // `data.custom_elements.length` deep in rendering.
    withTempDir((dir) => {
        const input = join(dir, 'drifted.json')
        writeFileSync(input, JSON.stringify({ meta: { handfish_version: '0.10' } }))
        const result = run(['--input', input, '--output', join(dir, 'out.md')])
        assert.notEqual(result.status, 0)
        assert.match(result.stderr + result.stdout, /schema/)
        assert.match(result.stderr + result.stdout, /custom_elements/)
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('an unreadable input is reported, not thrown', () => {
    // existsSync passes for a directory, so `--input <dir>` used to reach
    // readFileSync and die as an uncaught EISDIR stack trace naming this
    // script instead of the path the maintainer must fix.
    withTempDir((dir) => {
        const result = run(['--input', dir, '--output', join(dir, 'out.md')])
        assert.notEqual(result.status, 0)
        assert.ok((result.stderr + result.stdout).includes(`Cannot read: ${dir}`))
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('an unwritable output is reported, not thrown', () => {
    // A missing parent directory and an output path that is itself a
    // directory both used to escape as uncaught ENOENT/EISDIR crashes after
    // the whole document had already rendered.
    withTempDir((dir) => {
        const missingParent = join(dir, 'no-such-dir', 'out.md')
        const result = run(['--input', fixture, '--output', missingParent])
        assert.notEqual(result.status, 0)
        assert.ok((result.stderr + result.stdout).includes(`Cannot write: ${missingParent}`))
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)

        const isDir = join(dir, 'actually-a-dir')
        mkdirSync(isDir)
        const into = run(['--input', fixture, '--output', isDir])
        assert.notEqual(into.status, 0)
        assert.ok((into.stderr + into.stdout).includes(`Cannot write: ${isDir}`))
        assert.doesNotMatch(into.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('--check with an unreadable reference is reported, not thrown', () => {
    // The --check guard tests existence only; a directory at the output path
    // passed it and crashed on read with a stack trace naming this script.
    withTempDir((dir) => {
        const isDir = join(dir, 'actually-a-dir')
        mkdirSync(isDir)
        const result = run(['--input', fixture, '--output', isDir, '--check'])
        assert.notEqual(result.status, 0)
        assert.ok((result.stderr + result.stdout).includes(`Cannot read: ${isDir}`))
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('a non-object input is reported, not thrown', () => {
    withTempDir((dir) => {
        const input = join(dir, 'scalar.json')
        writeFileSync(input, '42')
        const result = run(['--input', input, '--output', join(dir, 'out.md')])
        assert.notEqual(result.status, 0)
        assert.match(result.stderr + result.stdout, /top level: expected a JSON object/)
        assert.doesNotMatch(result.stderr, /at .*regenerate-canonical-api\.js/)
    })
})

test('a custom element missing its tag is rejected instead of rendering <undefined>', () => {
    // A missing `tag` would silently render `### <undefined>` — wrong output
    // that the determinism and --check tests would both happily bless. The
    // shape check must fail loudly on the exact element.
    withTempDir((dir) => {
        const api = JSON.parse(readFileSync(fixture, 'utf8'))
        delete api.custom_elements[0].tag
        const input = join(dir, 'untagged.json')
        writeFileSync(input, JSON.stringify(api))
        const result = run(['--input', input, '--output', join(dir, 'out.md')])
        assert.notEqual(result.status, 0)
        assert.match(result.stderr + result.stdout, /custom_elements\[0\]\.tag: expected a string/)
    })
})

test('nested sections the renderer dereferences are validated, not left to crash', () => {
    // Top-level validation alone is not enough: `themes.entries: [null]`
    // passes a top-level check and crashes at render time, as does malformed
    // nested event, utility, or class data. Each case below previously died
    // inside rendering.
    const cases = [
        {
            name: 'a null theme entry',
            mutate: (api) => { api.themes.entries = [null] },
            problem: /themes\.entries\[0\]: expected \{ file, dataThemeValues \}/,
        },
        {
            name: 'a theme entry missing dataThemeValues',
            mutate: (api) => { delete api.themes.entries[0].dataThemeValues },
            problem: /themes\.entries\[0\]\.dataThemeValues: expected an array of strings/,
        },
        {
            name: 'an event missing its type',
            mutate: (api) => { delete api.custom_elements[0].events[0].type },
            problem: /custom_elements\[0\]\.events\[0\]\.type: expected a string/,
        },
        {
            name: 'a non-string detailKeys entry',
            mutate: (api) => { api.custom_elements[0].events[0].detailKeys = [42] },
            problem: /custom_elements\[0\]\.events\[0\]\.detailKeys: expected an array of strings/,
        },
        {
            name: 'a utility module missing exports',
            mutate: (api) => { delete api.utility_modules[Object.keys(api.utility_modules)[0]].exports },
            problem: /utility_modules\.fixtureUtil\.exports: expected an array of strings/,
        },
        {
            name: 'a class missing sourceFile',
            mutate: (api) => { delete api.classes[0].sourceFile },
            problem: /classes\[0\]\.sourceFile: expected a string/,
        },
        {
            name: 'a non-numeric toast default duration',
            mutate: (api) => { api.toast_helpers.defaults.showToast.duration = 'slow' },
            problem: /toast_helpers\.defaults\.showToast\.duration: expected a finite number/,
        },
        {
            name: 'a non-finite toast default duration',
            // JSON's 1e999 parses to Infinity, which typeof calls a number;
            // JSON.stringify cannot emit it, so splice the raw text instead.
            mutateText: (text) => text.replace('"duration":2000', '"duration":1e999'),
            problem: /toast_helpers\.defaults\.showToast\.duration: expected a finite number/,
        },
        {
            name: 'a non-finite theme count',
            mutateText: (text) => text.replace('"count_files":2', '"count_files":1e999'),
            problem: /themes: expected \{ count_files, count_data_theme_values, entries \}/,
        },
        {
            name: 'a non-object toast default',
            mutate: (api) => { api.toast_helpers.defaults.showToast = 2000 },
            problem: /toast_helpers\.defaults\.showToast: expected an object/,
        },
        {
            name: 'a non-string index export',
            mutate: (api) => { api.index_exports[0] = 7 },
            problem: /index_exports: expected an array of strings/,
        },
    ]
    for (const { name, mutate, mutateText, problem } of cases) {
        withTempDir((dir) => {
            const api = JSON.parse(readFileSync(fixture, 'utf8'))
            if (mutate) mutate(api)
            let text = JSON.stringify(api)
            if (mutateText) text = mutateText(text)
            const input = join(dir, 'nested.json')
            writeFileSync(input, text)
            const result = run(['--input', input, '--output', join(dir, 'out.md')])
            assert.notEqual(result.status, 0, `${name} must fail the shape check`)
            assert.match(result.stderr + result.stdout, problem, name)
        })
    }
})

test('a shallow input checkout yields unknown provenance, not the wrong commit', () => {
    // `git log -1 -- <path>` on a shallow clone names the grafted tip as the
    // creator of every file, so provenance would be a plausible lie and the
    // output would differ from a full checkout's for no visible reason. This
    // is not hypothetical: it is what actions/checkout does by default.
    withTempDir((dir) => {
        const origin = join(dir, 'origin')
        const docs = join(origin, 'docs')
        mkdirSync(docs, { recursive: true })
        const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })

        git(['init', '-q', '-b', 'main'], origin)
        git(['config', 'user.email', 'test@example.invalid'], origin)
        git(['config', 'user.name', 'Test'], origin)
        copyFileSync(fixture, join(docs, 'component-api.json'))
        git(['add', '.'], origin)
        git(['commit', '-qm', 'the commit that actually touched the json'], origin)
        // A later commit touching something else: on a full clone provenance
        // resolves to the first commit, on a shallow clone to this one.
        writeFileSync(join(origin, 'unrelated.txt'), 'later\n')
        git(['add', '.'], origin)
        git(['commit', '-qm', 'unrelated'], origin)

        const shallow = join(dir, 'shallow')
        git(['clone', '-q', '--depth', '1', `file://${origin}`, shallow], dir)

        const out = join(dir, 'out.md')
        const result = run(['--input', join(shallow, 'docs', 'component-api.json'), '--output', out])
        assert.equal(result.status, 0)
        assert.match(result.stderr, /shallow/i, 'the degraded provenance must be announced')

        const provenance = readFileSync(out, 'utf8').match(/^- \*\*handfish commit.*$/m)[0]
        assert.match(provenance, /unknown/, 'provenance must be unknown, never a confidently wrong SHA')

        // The tip is what a shallow `git log -1 -- <path>` wrongly reports.
        const tip = git(['rev-parse', 'HEAD'], shallow).toString().trim()
        assert.doesNotMatch(provenance, new RegExp(tip.slice(0, 8)))

        // Deterministic despite the degradation: the same shallow input twice
        // must still render identically, or the drift check is unusable
        // anywhere a checkout happens to be shallow — CI included.
        const again = join(dir, 'again.md')
        assert.equal(run(['--input', join(shallow, 'docs', 'component-api.json'), '--output', again]).status, 0)
        assert.equal(readFileSync(out, 'utf8'), readFileSync(again, 'utf8'))
    })
})

// The drift alarm proper. Skipped when there is no sibling handfish checkout,
// so the suite still runs standalone.
const siblingApi = join(repoRoot, '..', 'handfish', 'docs', 'component-api.json')
test('the committed reference is current with the sibling handfish checkout', { skip: existsSync(siblingApi) ? false : 'no sibling handfish checkout' }, () => {
    const result = run(['--input', siblingApi, '--check'])
    assert.equal(
        result.status, 0,
        `skills/handfish-design/references/api-canonical.md is stale.\n` +
        `Run: node scripts/regenerate-canonical-api.js\n\n${result.stdout}${result.stderr}`,
    )
})

test('every element handfish registers is named in the skill activation description', { skip: existsSync(siblingApi) ? false : 'no sibling handfish checkout' }, () => {
    // The frontmatter `description` is what decides whether this skill loads
    // at all. A tag missing from it means someone working on that component
    // gets no handfish guidance — the same drift as a stale reference, on a
    // surface no generator touches.
    const skill = readFileSync(join(repoRoot, 'skills', 'handfish-design', 'SKILL.md'), 'utf8')
    const description = skill.match(/^description:\s*(.*)$/m)?.[1] ?? ''
    const tags = JSON.parse(readFileSync(siblingApi, 'utf8')).custom_elements.map(c => c.tag)

    // Whole-tag matching. Plain `includes` would let a future tag that is a
    // substring of an existing one (a bare `bar` against `menu-bar`) pass on
    // the surface that decides whether this skill loads at all.
    const mentions = (text, tag) => new RegExp(`(?<![a-z0-9-])${tag}(?![a-z0-9-])`).test(text)

    const missing = tags.filter(tag => !mentions(description, tag))
    assert.deepEqual(
        missing, [],
        `SKILL.md's activation description does not mention: ${missing.join(', ')}`,
    )

    // contributing.md tells maintainers to update the README trigger list too,
    // so check it rather than trusting the instruction to be followed.
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
    const missingFromReadme = tags.filter(tag => !mentions(readme, tag))
    assert.deepEqual(
        missingFromReadme, [],
        `README's trigger list does not mention: ${missingFromReadme.join(', ')}`,
    )
})

test('the generator writes the committed reference when given no --output', () => {
    // Asserting the file merely exists would be a tautology for a tracked
    // file. Render the same input to a temp path, then confirm the default
    // path is what a no-flag run reports writing.
    assert.ok(existsSync(committedReference), 'the canonical reference must exist')
    withTempDir((dir) => {
        const elsewhere = join(dir, 'elsewhere.md')
        assert.equal(run(['--input', fixture, '--output', elsewhere]).status, 0)
        assert.notEqual(
            readFileSync(elsewhere, 'utf8'), readFileSync(committedReference, 'utf8'),
            'fixture output must differ from the real reference, or this test proves nothing',
        )
        const check = run(['--input', fixture, '--check'])
        assert.notEqual(check.status, 0, 'the fixture is not what the committed reference holds')
        assert.match(
            check.stderr, new RegExp(`Stale: ${committedReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'),
            'a run with no --output must target the committed reference',
        )
    })
})
