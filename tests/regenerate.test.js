import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')
const script = join(repoRoot, 'scripts', 'regenerate-canonical-api.js')
const fixture = join(here, 'fixtures', 'component-api.json')
const committedReference = join(repoRoot, 'skills', 'handfish-design', 'references', 'api-canonical.md')

/** Run the generator. Returns { status, stdout, stderr } and never throws on a non-zero exit. */
function run(args) {
    try {
        const stdout = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stderr: 'pipe' })
        return { status: 0, stdout, stderr: '' }
    } catch (err) {
        return { status: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
    }
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
        assert.match(result.stderr + result.stdout, /absent\.md/)
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

    const missing = tags.filter(tag => !description.includes(tag))
    assert.deepEqual(
        missing, [],
        `SKILL.md's activation description does not mention: ${missing.join(', ')}`,
    )
})

test('the committed reference is the one the generator writes by default', () => {
    assert.ok(existsSync(committedReference), 'the canonical reference must exist')
})
