# Contributing to Handfish

Use this reference when adding, porting, or modifying a component in the handfish repo. For app-side use of handfish, read the other references.

## Repo layout

```
handfish/
├── src/
│   ├── index.js                  # All public exports — every new component/utility lands here
│   ├── styles/
│   │   ├── tokens.css            # The --hf-* design tokens, fonts (incl. Material Symbols icon @font-face), light/dark defaults
│   │   ├── index.css             # Main stylesheet (imports tokens + forms + tags-and-tabs + menus-and-toolbars + dialogs)
│   │   ├── forms.css             # Form control base styles
│   │   ├── dialogs.css           # <dialog> base styles
│   │   ├── menus-and-toolbars.css # Menu/toolbar chrome + .hf-icon-btn (used by <menu-bar>, <tempo-bar>)
│   │   ├── tags-and-tabs.css
│   │   ├── industrial.css        # Opt-in "industrial" typeface language (NOT imported by index.css)
│   │   └── themes/               # 17 theme files: brutalist, corporate, cyberpunk, etc.
│   ├── fonts/                    # Nunito, Noto Sans Mono, Material Symbols metadata
│   ├── utils/
│   │   ├── colorConversions.js   # RGB / HSV / OkLab / OKLCH / hex
│   │   ├── escapeHandler.js      # Stack-based Escape key handler
│   │   ├── shortcuts.js          # Platform-aware keyboard-shortcut formatting (formatShortcut, isMacPlatform)
│   │   └── tooltips.js           # data-title hover tooltips
│   └── components/
│       └── <tag-name>/
│           └── <ClassName>.js    # Component class + customElements.define()
├── tests/
│   ├── visual.spec.js            # Playwright visual regression tests
│   └── snapshots/                # Baseline screenshots (dark + light per page)
├── examples/
│   └── index.html                # Comprehensive style guide / demo page
├── playwright.config.js
└── package.json
```

## Adding a new component

The end-to-end checklist:

### 1. Pick the tag and class names

Tag names are kebab-case and globally unique across the page (custom elements are global). Pick something specific enough that no app is likely to name a different element the same thing. Examples: `slider-value`, not `slider`. `gradient-stops`, not `stops`.

The class name is PascalCase and matches the directory: `slider-value/SliderValue.js`. The export from `index.js` uses the class name.

### 2. Create the component file

`src/components/<tag-name>/<ClassName>.js`. Start from the established pattern:

```js
/**
 * <Component Name>
 *
 * <One-paragraph description.>
 *
 * @module components/<tag-name>/<ClassName>
 */

const STYLES_ID = 'hf-<tag-name>-styles'
if (!document.getElementById(STYLES_ID)) {
    const style = document.createElement('style')
    style.id = STYLES_ID
    style.textContent = `
        <tag-name> {
            display: inline-block;
            /* Use --hf-* tokens, never hardcoded values */
        }
    `
    document.head.appendChild(style)
}

class <ClassName> extends HTMLElement {
    static formAssociated = true  // omit if the component doesn't hold a value

    static get observedAttributes() {
        return ['value', 'disabled', 'name']
    }

    constructor() {
        super()
        if (this.constructor.formAssociated) {
            this._internals = this.attachInternals?.()
        }
    }

    connectedCallback() {
        // render, attach listeners
    }

    disconnectedCallback() {
        // detach listeners, clean up
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // react to attribute changes
    }

    get value() { return this._value }
    set value(v) {
        this._value = v
        this.setAttribute('value', v)
        this._internals?.setFormValue(v)
    }
}

customElements.define('<tag-name>', <ClassName>)
export { <ClassName> }
```

Every component must use this style-injection pattern. It keeps DOM cost at one `<style>` block per component type, regardless of instance count.

### 3. Use only `--hf-*` tokens

In the injected `<style>` block, every visual value (color, spacing, radius, shadow, font, transition) must come from a token. If a value you need doesn't have a token, add the token to `tokens.css` rather than inline a literal. See `tokens.md` for the catalog.

Common pattern with safe fallbacks (used throughout existing components):

```css
<tag-name> .my-thumb {
    background: var(--hf-accent, #5a7fdd);  /* fallback for if tokens.css fails to load */
    border-radius: var(--hf-radius-sm, 0.25rem);
}
```

The fallback should normally be unnecessary because `tokens.css` always loads. It prevents a completely broken render if stylesheet ordering fails.

### 4. Export from `src/index.js`

Add the export:

```js
export { <ClassName> } from './components/<tag-name>/<ClassName>.js'
```

Without this, CDN consumers can't import the component even though the file exists. The CDN bundle is generated from `index.js`.

### 5. Add a demo to `examples/index.html`

Find a logical section (or create a new one), add a labeled demo of the component covering its key states:

```html
<section>
    <h2><tag-name></h2>
    <p>One-line description.</p>
    <div class="demo-row">
        <<tag-name> value="default"></<tag-name>>
        <<tag-name> value="other-state"></<tag-name>>
        <<tag-name> disabled></<tag-name>>
    </div>
</section>
```

The examples page is the de facto component documentation — it ships at `https://handfish.noisefactor.io/examples/` and is what consumers look at to understand component behavior.

### 6. Run `node --check`

```bash
node --check src/components/<tag-name>/<ClassName>.js
```

Catches syntax errors before they hit the test suite.

### 7. Run visual regression

From the handfish repo:

```bash
npm test                # checks current snapshots
npm run test:update     # updates snapshots after intentional changes
```

For a new component, the baselines don't exist yet — `npm run test:update` creates them. Commit the new snapshot files alongside the code. For changes to existing components, `npm test` shows the visual diff. If the diff is intentional, `npm run test:update` to accept.

The tests run in both default themes (dark + light) — confirm both look right before committing.

### 8. Document the component

Update `AGENTS.md` in the handfish repo to add the new component to the component table. The table feeds the LLM-facing docs. Missing entries mean Claude doesn't know about new components and won't suggest them.

## Porting a component from another repo

When adopting a component from Noisedeck, Tetra, or another Noise Factor app, the work is:

1. **Copy the file** into `src/components/<tag-name>/<ClassName>.js`.
2. **Remap CSS variables.** Other repos use their own prefixes (`--color-1`, `--accent-3`, `--font-mono`). Search-and-replace each one to its `--hf-*` equivalent. Use the catalog in `tokens.md`. If a variable in the source doesn't have an `--hf-*` equivalent, either pick the closest semantic match or add a new token.
3. **Remap font imports.** `--font-mono` → `--hf-font-family-mono`. Same for any other typography tokens.
4. **Remap utility imports.** Replace source utility paths, such as `../../utils/colors.js`, with handfish equivalents. Use `../../utils/colorConversions.js` for color, `../../utils/escapeHandler.js` for the escape stack, and `../../utils/tooltips.js` for tooltips.
5. **Function rename pass.** Source repos sometimes have differently-named conversion functions. Match handfish's names: `rgbToHex`, `parseHex`, `rgbToHsv`, `rgbToOklch`, etc. (See `color.md`.)
6. **Drop incompatible features.** If the source uses Shadow DOM, refactor to light DOM with style injection (see step 2 of "Adding a new component"). Shadow DOM doesn't survive the port.
7. **Run all the steps from "Adding a new component" from step 4 onward** (export, demo, syntax check, visual baselines, AGENTS.md update).

## Modifying an existing component

The risk of modifying a shared component is regression in apps that depend on it. Before changing behavior:

1. **Check what apps consume the component.** `grep -r "<tag-name>" ~/platform/` finds every consumer in the platform workspace. Read those usages. Understand what they expect.
2. **Decide if it's a breaking change.** Adding a new optional attribute, new event, or new mode is non-breaking. Renaming an attribute, changing event detail structure, or changing default behavior *is* breaking.
3. **For breaking changes:** prefer adding a new attribute / mode that opts into the new behavior, and leave the old behavior as the default. Existing consumers don't break. New consumers opt in.
4. **For non-breaking changes:** make the change, run visual regression, update the demo if the new feature is visible.
5. **Run visual regression.** Always. Even small CSS changes can shift pixels in unintuitive ways. `npm test`. If the diff is intentional, `npm run test:update` and commit the new baselines.

## Anti-patterns when contributing

- **Shadow DOM.** Don't reach for it. Light DOM with style injection is the model. Anything that breaks that breaks theming and overrides for every consumer.
- **Inline literal colors / spacings.** Use `--hf-*` tokens. If none fit, add a new one.
- **Dependencies.** Handfish has zero runtime dependencies. New components should not add any. If a library contains a required function, copy the relevant code with attribution where necessary.
- **Custom event names outside `input` / `change`.** Follow standard event semantics. If neither event describes the action, prefer a `CustomEvent` with a descriptive name such as `gradient-stop-added`. Do not reuse `input` / `change` for an unrelated action.
- **Big examples.** Demos in `examples/index.html` should show the *core* states of the component, not every possible configuration. If the component has dozens of permutations, link out to a separate doc page.
- **Skipping visual regression.** It's the only thing that catches "this looks fine in dev but is one pixel off in prod" before a release. Run it.

## CI / release flow

Handfish releases are version-bumped manually and published to the CDN by the scaffold deploy pipeline. Visual regression tests are part of CI. A failed snapshot check blocks merge. After merge to `main`, the CDN's `/0` rolling pin updates within minutes. The new version becomes available to every app on `/0`.

For risky changes, such as a large refactor or new theme logic, you can pin an app to a specific `0.10.x` version. After testing confirms correct behavior, you can return to `/0`. See `setup.md`.

## Maintaining this skill (handfish-design plugin)

This skill ships a hand-written reference set (`components.md`, `tokens.md`, etc.) plus one machine-generated reference (`api-canonical.md`) that captures the source-derived component APIs. Hand-written docs can drift. The canonical reference cannot. **When handfish ships a new minor or patch version, regenerate the canonical reference.**

`npm test` checks the canonical reference and the activation tag list in `SKILL.md`'s `description`. A weekly CI job runs these checks against handfish `main`. `npm run check` checks reference freshness without writing files.

### Regeneration workflow

```bash
# 1. Update handfish to the version you're documenting against
cd ~/platform/handfish && git pull --ff-only

# 2. Regenerate the canonical machine-extracted JSON
node scripts/generate-component-api.js
# → writes ~/platform/handfish/docs/component-api.json

# 3. Regenerate the human-readable canonical reference in this plugin
cd ~/platform/handfish-design
node scripts/regenerate-canonical-api.js
# → writes skills/handfish-design/references/api-canonical.md

# 4. Diff and review
git -C ~/platform/handfish-design diff skills/handfish-design/references/api-canonical.md

# 5. Confirm both drift checks are clean (this repo's suite, not handfish's)
npm test
```

The generator is deterministic: the same JSON always yields byte-identical
markdown, and provenance comes from git rather than a wall clock. So step 4
showing an empty diff genuinely means nothing changed — it is not a timestamp
churning.

### What to do after regeneration

Read the diff. For each change in `api-canonical.md`:

- **New attribute or event added.** Mention it in the corresponding `components.md` section if it's worth calling out for users (most are).
- **Attribute or event renamed or removed.** Search `components.md` for the old name and update the prose. Search the rest of the plugin (`grep -r '<oldname>' skills/`) for any examples that need updating.
- **Form-association status changed.** Update `components.md` and the form-integration table. Update SKILL.md if the change affects which components belong in the form-associated set.
- **Toast helper default duration changed.** Update `utilities.md` and the durations table.
- **New theme files or `data-theme` values.** Update the catalog table in `theming.md` and the count narrative in `README.md` / `plugin.json`.

- **New custom element registered.** Add its tag to `SKILL.md`'s `description`. Add it to the README trigger list. A missing description tag prevents the skill from activating for that component. `npm test` identifies missing tags.

The `api-canonical.md` provenance block records the source handfish commit. It needs no separate README anchor that maintainers must synchronize manually.

### Why two scripts, not one

The split mirrors the repo boundary:

- `handfish/scripts/generate-component-api.js` knows how to read handfish's source code and emit a stable JSON schema. It lives in handfish because it depends on handfish's internal layout.
- `handfish-design/scripts/regenerate-canonical-api.js` knows how to format the JSON as a markdown reference. It lives in handfish-design because it depends on this skill's documentation conventions.

If handfish's component patterns change, only the first script needs updating. If the skill's documentation format changes, only the second does.

### When to skip regeneration

Documentation-only edits, such as clarifying prose or adding an anti-pattern, do not require regeneration. Regenerate the canonical reference when handfish changes. Its provenance identifies the handfish version. Check that this matches the version you are documenting.
