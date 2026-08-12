# Contributing to Handfish

This reference is for changes to the handfish repo itself — adding a new component, porting one in from another Noise Factor app, or modifying an existing one. If you're consuming handfish in an app, you don't need this; see the other references.

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

The style-injection pattern is non-negotiable — every component does it the same way so the cumulative DOM cost stays small (one `<style>` block per component type, regardless of instance count).

### 3. Use only `--hf-*` tokens

In the injected `<style>` block, every visual value (color, spacing, radius, shadow, font, transition) must come from a token. If a value you need doesn't have a token, add the token to `tokens.css` rather than inline a literal. See `tokens.md` for the catalog.

Common pattern with safe fallbacks (used throughout existing components):

```css
<tag-name> .my-thumb {
    background: var(--hf-accent, #5a7fdd);  /* fallback for if tokens.css fails to load */
    border-radius: var(--hf-radius-sm, 0.25rem);
}
```

The fallback is a last-ditch safety net — it shouldn't matter in practice (tokens.css always loads), but it prevents a totally broken render if something goes wrong with stylesheet ordering.

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

For a new component, the baselines don't exist yet — `npm run test:update` creates them. Commit the new snapshot files alongside the code. For changes to existing components, `npm test` shows the visual diff; if the diff is intentional, `npm run test:update` to accept.

The tests run in both default themes (dark + light) — confirm both look right before committing.

### 8. Document the component

Update `AGENTS.md` in the handfish repo to add the new component to the component table. The table feeds the LLM-facing docs; missing entries mean Claude doesn't know about new components and won't suggest them.

## Porting a component from another repo

When adopting a component from Noisedeck, Tetra, or another Noise Factor app, the work is:

1. **Copy the file** into `src/components/<tag-name>/<ClassName>.js`.
2. **Remap CSS variables.** Other repos use their own prefixes (`--color-1`, `--accent-3`, `--font-mono`). Search-and-replace each one to its `--hf-*` equivalent. Use the catalog in `tokens.md`. If a variable in the source doesn't have an `--hf-*` equivalent, either pick the closest semantic match or add a new token.
3. **Remap font imports.** `--font-mono` → `--hf-font-family-mono`. Same for any other typography tokens.
4. **Remap utility imports.** If the source imports color helpers, escape handlers, or tooltip utils from a path like `../../utils/colors.js`, update to the handfish equivalents — `../../utils/colorConversions.js` for color, `../../utils/escapeHandler.js` for escape stack, `../../utils/tooltips.js` for tooltips.
5. **Function rename pass.** Source repos sometimes have differently-named conversion functions. Match handfish's names: `rgbToHex`, `parseHex`, `rgbToHsv`, `rgbToOklch`, etc. (See `color.md`.)
6. **Drop incompatible features.** If the source uses Shadow DOM, refactor to light DOM with style injection (see step 2 of "Adding a new component"). Shadow DOM doesn't survive the port.
7. **Run all the steps from "Adding a new component" from step 4 onward** (export, demo, syntax check, visual baselines, AGENTS.md update).

## Modifying an existing component

The risk of modifying a shared component is regression in apps that depend on it. Before changing behavior:

1. **Check what apps consume the component.** `grep -r "<tag-name>" ~/platform/` finds every consumer in the platform workspace. Read those usages; understand what they expect.
2. **Decide if it's a breaking change.** Adding a new optional attribute, new event, or new mode is non-breaking. Renaming an attribute, changing event detail structure, or changing default behavior *is* breaking.
3. **For breaking changes:** prefer adding a new attribute / mode that opts into the new behavior, and leave the old behavior as the default. Existing consumers don't break. New consumers opt in.
4. **For non-breaking changes:** make the change, run visual regression, update the demo if the new feature is visible.
5. **Run visual regression.** Always. Even small CSS changes can shift pixels in unintuitive ways. `npm test`; if the diff is intentional, `npm run test:update` and commit the new baselines.

## Anti-patterns when contributing

- **Shadow DOM.** Don't reach for it. Light DOM with style injection is the model. Anything that breaks that breaks theming and overrides for every consumer.
- **Inline literal colors / spacings.** Use `--hf-*` tokens. If none fit, add a new one.
- **Dependencies.** Handfish has zero runtime dependencies. New components shouldn't introduce any. If you need a function that exists in a popular library, copy the relevant piece in (with attribution if needed) rather than depending on the library.
- **Custom event names that don't follow `input` / `change`.** Stick with the standard event semantics. If the component genuinely fires something the standard names don't cover, prefer a new `CustomEvent` with a descriptive name (e.g., `gradient-stop-added`) over reusing `input` / `change` for it.
- **Big examples.** Demos in `examples/index.html` should show the *core* states of the component, not every possible configuration. If the component has dozens of permutations, link out to a separate doc page.
- **Skipping visual regression.** It's the only thing that catches "this looks fine in dev but is one pixel off in prod" before a release. Run it.

## CI / release flow

Handfish releases are version-bumped manually and published to the CDN by the scaffold deploy pipeline. Visual regression tests are part of CI; a failed snapshot check blocks merge. After merge to `main`, the CDN's `/0` rolling pin updates within minutes; the new version becomes available to every app on `/0`.

If a change is risky (large refactor, new theming logic), you can pin a specific version (`0.10.x`) for an app while testing it, then bump back to `/0` once you've confirmed it works. See `setup.md` for the pinning policy.

## Maintaining this skill (handfish-design plugin)

This skill ships a hand-written reference set (`components.md`, `tokens.md`, etc.) plus one machine-generated reference (`api-canonical.md`) that captures the source-derived component APIs. Hand-written docs can drift; the canonical reference cannot. **When handfish ships a new minor or patch version, regenerate the canonical reference.**

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
```

### What to do after regeneration

Read the diff. For each change in `api-canonical.md`:

- **New attribute or event added.** Mention it in the corresponding `components.md` section if it's worth calling out for users (most are).
- **Attribute or event renamed or removed.** Search `components.md` for the old name and update the prose. Search the rest of the plugin (`grep -r '<oldname>' skills/`) for any examples that need updating.
- **Form-association status changed.** Update `components.md` and the form-integration table. Update SKILL.md if the change affects which components belong in the form-associated set.
- **Toast helper default duration changed.** Update `utilities.md` and the durations table.
- **New theme files or `data-theme` values.** Update the catalog table in `theming.md` and the count narrative in `README.md` / `plugin.json`.

After updating, also bump the source-of-truth anchor in `README.md` to point at the new handfish version + commit SHA. That single line is what tells future readers (and Claude) when this skill was last audited.

### Why two scripts, not one

The split mirrors the repo boundary:

- `handfish/scripts/generate-component-api.js` knows how to read handfish's source code and emit a stable JSON schema. It lives in handfish because it depends on handfish's internal layout.
- `handfish-design/scripts/regenerate-canonical-api.js` knows how to format the JSON as a markdown reference. It lives in handfish-design because it depends on this skill's documentation conventions.

If handfish's component patterns change, only the first script needs updating. If the skill's documentation format changes, only the second does.

### When to skip regeneration

If you're shipping a documentation-only change to this skill (e.g., adding a new anti-pattern, clarifying prose), you don't need to regenerate. The canonical reference only needs regenerating when handfish itself changes. The provenance section at the top of `api-canonical.md` shows which handfish version it was generated from — if that matches the version you're documenting against, you're fine.
