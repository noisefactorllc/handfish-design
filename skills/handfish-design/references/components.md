# Components

The handfish catalog: 14 custom elements plus a small set of helper APIs (toasts, tooltips, escape handler, About dialog). Each entry covers the tag (or import), the attributes you'll set, the events you'll listen for, and form-association behavior.

> **Authoritative source:** `api-canonical.md` (sibling file) is mechanically generated from the handfish source on every release. If this file and `api-canonical.md` disagree on an attribute name, event type, event detail keys, or form-association status, **`api-canonical.md` wins** — this file is hand-written prose and may drift; that one cannot.
>
> Use this file for: how to use each component, examples, when to reach for what, gotchas, anti-patterns.
> Use `api-canonical.md` for: verifying you're reading the right attribute, listening for the right event, expecting the right `event.detail` keys.

## How handfish components work

Every component is a custom element defined via `customElements.define()`. Importing the class is what registers the element — you don't need to call `define()` yourself:

```js
import { ToggleSwitch } from 'handfish'  // ← side effect: <toggle-switch> now works
```

After import, the tag works in HTML:

```html
<toggle-switch checked></toggle-switch>
```

Or programmatically:

```js
const toggle = document.createElement('toggle-switch')
toggle.checked = true
document.body.appendChild(toggle)
```

A few conventions show up across the catalog, but they are not universal — verify per component:

- **Attribute / property parity is common but not guaranteed.** Most components reflect their `observedAttributes` to JS properties; a few don't, or use a different name (e.g., `<color-swatch>` uses `color` as the attribute, exposes `.color` and not `.value`). Prefer reading via the property after setting via the attribute, or just stick to attributes.
- **`input` and `change` semantics vary per component.** The convention "input for continuous, change for committed" is the design intent, but several components (notably `<slider-value>`) fire both on every change. The catalog notes any deviations per entry; default to consulting the per-component section before assuming `change` is debounced.
- **Event payloads vary.** Some components dispatch plain `Event` objects with no `detail` — to get the value, read `el.value` after the event fires. Others dispatch `CustomEvent` with `event.detail`. The catalog notes which.
- **Form-associated where it makes sense.** Components that hold a value participate in `<form>` submission via `attachInternals()`. `FormData` picks them up by their `name` attribute just like a native `<input>`. Not every component is form-associated — see the per-entry notes.
- **`disabled` is honored everywhere** that has it as an attribute.

## The catalog

### `<toggle-switch>` — boolean toggle

```js
import { ToggleSwitch } from 'handfish'
```

Slider-style replacement for `<input type="checkbox">`.

| Attribute | Type | Notes |
|-----------|------|-------|
| `checked` | boolean | Initial / current state |
| `disabled` | boolean | |

Events: `change` — fires on flip. Plain `Event` with no `detail`; read `el.checked`.

Form-associated: **no.** ToggleSwitch does not declare `formAssociated` and has no `name` attribute. To use it inside a form, mirror its `checked` state into a hidden `<input type="checkbox" name="...">` on `change`, or just read `el.checked` directly when the form submits.

```html
<toggle-switch checked></toggle-switch>
<script type="module">
    document.querySelector('toggle-switch').addEventListener('change', (e) => {
        console.log('now', e.target.checked)
    })
</script>
```

### `<slider-value>` — numeric range with editable display

```js
import { SliderValue } from 'handfish'
```

A range slider plus a value display that the user can also click to type into. Uses `display: contents` so the slider and value occupy separate cells when nested in a parent grid.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | number | Current value |
| `min` | number | Default 0 |
| `max` | number | Default 100 |
| `step` | number | Default `0.01` (NOT `1`) |
| `disabled` | boolean | |
| `name` | string | For form serialization |
| `type` | string | Optional — formatting hint |
| `format` | string | Optional — display format |

Events: `input` and `change` — both fire on **every** value change (drag, keypress, programmatic set). There is no commit/release distinction in this component; the `_dispatchChange` method fires both events together. If you need debouncing for an expensive handler (network save, etc.), do it in your own listener — don't expect `change` to fire less often than `input`. Both are plain `Event` objects with no `detail`; read `el.value`.

Form-associated: yes.

```html
<slider-value name="opacity" min="0" max="1" step="0.01" value="0.5"></slider-value>
```

### `<select-dropdown>` — searchable dropdown

```js
import { SelectDropdown } from 'handfish'
```

General-purpose dropdown for selecting one of N options. Supports keyboard navigation and type-ahead search. Children should be `<option>` tags (mimicking native `<select>`):

```html
<select-dropdown name="region">
    <option value="us-east">US East</option>
    <option value="us-west">US West</option>
    <option value="eu-central">EU Central</option>
</select-dropdown>
```

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Currently selected option's value |
| `disabled` | boolean | |
| `name` | string | |

Events: `change` — plain `Event`; read `el.value`.

Form-associated: yes.

### `<dropdown-menu>` + `<dropdown-item>` — menu / action picker

```js
import { DropdownMenu, DropdownItem } from 'handfish'
```

Menu with a button trigger and a list of items. Two modes:

- **Action mode** (default): items dispatch click-like events. Use for menus like "File / Edit / Help."
- **Selectable mode** (`selectable` attribute on the menu): tracks a `value`, marks the selected item visually. Use for theme switchers, mode pickers, etc.

```html
<dropdown-menu label="Actions" icon="more_vert">
    <dropdown-item value="save">Save</dropdown-item>
    <dropdown-item value="export">Export</dropdown-item>
    <dropdown-item value="delete">Delete</dropdown-item>
</dropdown-menu>

<dropdown-menu label="theme" icon="palette" small selectable value="dark">
    <dropdown-item value="dark">Dark</dropdown-item>
    <dropdown-item value="light">Light</dropdown-item>
    <dropdown-item value="cyberpunk">Cyberpunk</dropdown-item>
</dropdown-menu>
```

`<dropdown-menu>` observed (reactive) attributes — these update at runtime if changed in JS:

| Attribute | Type | Notes |
|-----------|------|-------|
| `label` | string | Button text |
| `icon` | string | Material Symbols icon name (e.g., `palette`, `menu`) |
| `align` | `left` \| `right` | Where the menu opens |
| `value` | string | Selected item value (selectable mode only) |
| `disabled` | boolean | |

Set-once-in-HTML attributes (work via CSS attribute selectors, but won't react if toggled at runtime):

| Attribute | Type | Notes |
|-----------|------|-------|
| `small` | boolean | Compact sizing |
| `compact-mobile` | boolean | Hide label text on small screens |
| `selectable` | boolean | Enable selectable mode |

Events: `change` — `CustomEvent` with `event.detail = { value, item }`. Fires when an item is picked.

The `<dropdown-menu>` registers `<dropdown-item>` automatically when imported. `dropdown-menu > dropdown-item` is hidden via FOUC-prevention CSS until the menu's JS renders the items into the menu surface.

### `<color-picker>` — full color picker

```js
import { ColorPicker } from 'handfish'
```

Comprehensive picker with HSV/OKLCH spaces, hex input, alpha, and recent-colors. Form-associated.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Hex color (`#rrggbb`). The property setter additionally accepts a `[r, g, b]` array of 0–1 floats. |
| `color-mode` | `rgb` \| `hsv` \| `oklab` \| `oklch` | Picker UI mode. Default: `rgb`. |
| `disabled` | boolean | |
| `name` | string | |

Events: `input` (during interaction) and `change` (on commit). Both are plain `Event` objects with no `detail`; read `el.value` for the hex string.

Form-associated: yes.

### `<color-wheel>` — visual color picker

```js
import { ColorWheel } from 'handfish'
```

Three modes for color selection:

- HSV — traditional hue wheel + saturation/value triangle
- OkLab — perceptually uniform AB plane
- OKLCH — perceptually uniform with explicit chroma

Form-associated. Use when you want spatial color selection without the rest of `<color-picker>`'s UI.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Hex color |
| `mode` | `hsv` \| `oklab` \| `oklch` | Default `hsv` |
| `alpha` | number | 0–1, alpha channel value |
| `disabled` | boolean | |
| `required` | boolean | Mark as required for form validation |
| `name` | string | |

Events:
- `input` — plain `Event` during interaction; read `el.value`.
- `change` — plain `Event` on commit; read `el.value`.
- `colorinput` — `CustomEvent` during interaction with `event.detail` carrying the live color payload (richer than `input`).

### `<color-swatch>` — color preview / selectable tile

```js
import { ColorSwatch } from 'handfish'
```

Compact color tile, often used in palettes or recent-colors strips. Click selects the swatch; with `editable`, double-click dispatches an `edit` event so a parent can open a picker. The component does **not** include a built-in picker UI.

| Attribute | Type | Notes |
|-----------|------|-------|
| `color` | string | Hex color (note: NOT `value`) |
| `selected` | boolean | Marked-as-selected visual state |
| `disabled` | boolean | |
| `editable` | boolean | Enables `dblclick` → `edit` event so the consumer can open its own picker |
| `size` | string | Visual size (e.g., `1.5rem`) |
| `show-tooltip` | boolean | Show the color hex on hover |

Events:
- `select` — `CustomEvent` on click (or Enter/Space when focused). `event.detail = { color, rgb }`.
- `edit` — `CustomEvent` on **double-click** when `editable` is set. `event.detail = { color, rgb }`. The consumer must open its own picker in response — no picker is built in.

The `rgb` value in both event details is a `[r, g, b]` array of 0–1 floats — note this is different from the `{r, g, b}` 0–255 format used by handfish's other color utilities. To round-trip into the standard format, use `{ r: rgb[0]*255, g: rgb[1]*255, b: rgb[2]*255 }`.

Form-associated: no. Pair with a hidden input or read `el.color` directly when serializing.

### `<gradient-stops>` — gradient editor

```js
import { GradientStops } from 'handfish'
```

Multi-stop gradient editor. Users add, remove, drag, and recolor stops along a horizontal track. Useful for shader uniforms, palette editors, anything gradient-driven.

| Attribute | Type | Notes |
|-----------|------|-------|
| `disabled` | boolean | |

The component is configured via JS, not attributes. Use `el.setStops(colors, positions)` where:

- `colors` is an array of `[r, g, b]` arrays of 0–1 floats — for example `[[1, 0, 0], [0, 0, 1]]` for a red-to-blue gradient. Hex strings will not work — convert first via `parseHex` then divide each component by 255.
- `positions` is an array of 0–1 floats. If shorter than `colors`, missing positions are interpolated evenly.

Events (all `CustomEvent`):

- `select` — when a stop becomes active. `event.detail = { index }`.
- `input` — during a position drag. `event.detail = { index, position, positions }`.
- `change` — on drag commit. `event.detail = { index, positions }` (note: no top-level `position`).
- `delete` — when the user removes a stop. `event.detail = { index, positions, colors }` (the remaining stops, useful for re-rendering the consumer's gradient preview).

Note that color changes happen via separate methods (the user opens a picker per stop); track them by listening for the picker's events, not by listening for `change` on `<gradient-stops>` (which is position-only).

### `<vector2d-picker>` — 2D vector input

```js
import { Vector2dPicker } from 'handfish'
```

Two-axis pad for picking a 2D vector. Form-associated.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Comma-separated `"x,y"` (set in HTML) |
| `min` | number | Shared minimum for both axes |
| `max` | number | Shared maximum for both axes |
| `step` | number | |
| `normalized` | boolean | If set, the value is in the 0–1 normalized range |
| `disabled` | boolean | |
| `name` | string | |

Events: `input` (during drag) and `change` (on release). Both are plain `Event` objects with no `detail`.

The `value` attribute (HTML) is a `"x,y"` string, but the `value` *property* (JS) is an `{x, y}` object. Read it via `el.value.x` / `el.value.y`. There are no separate `el.x` / `el.y` getters.

### `<vector3d-picker>` — 3D vector input

```js
import { Vector3dPicker } from 'handfish'
```

Three-axis controls for a 3D vector (x, y, z). Form-associated. Often used for shader uniforms (camera rotation, light direction).

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Comma-separated `"x,y,z"` (set in HTML) |
| `min` | number | Shared minimum across axes |
| `max` | number | Shared maximum across axes |
| `step` | number | |
| `normalized` | boolean | |
| `disabled` | boolean | |
| `name` | string | |

Events: `input` and `change` — plain `Event` objects with no `detail`.

Same value asymmetry as the 2D variant: HTML attribute is the string `"x,y,z"`; JS property is `{x, y, z}`. Read via `el.value.x` / `el.value.y` / `el.value.z`.

### `<justify-button-group>` — left/center/right segmented control

```js
import { JustifyButtonGroup } from 'handfish'
```

Three hardcoded buttons for `left` / `center` / `right` alignment, with Material Symbols icons. Not generic — there is no `options` attribute. Use it for justification UIs; for other 3-way enums, build a similar component yourself.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | `left` \| `center` \| `right` | Selected option (default `center`) |
| `disabled` | boolean | |
| `name` | string | |

Events:
- `change` — plain `Event` on selection. Read `el.value`.
- `input` — `CustomEvent` with `event.detail = { value }`. Fires on the same selection.

Form-associated: yes.

### `<code-editor>` — syntax-highlighted text editor

```js
import { CodeEditor, EDITOR_THEMES, THEME_KEYS, applyEditorTheme, applyEditorThemeGlobal, dslTokenizer } from 'handfish'
```

In-browser code editor with pluggable tokenizers. `dslTokenizer` is included; supply your own for arbitrary languages.

Observed attributes:

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | string | Editor contents |
| `placeholder` | string | |
| `readonly` | boolean | |
| `disabled` | boolean | |
| `spellcheck` | boolean | |
| `font-family`, `font-size` | string | Editor typography |
| `background-color`, `background-opacity`, `text-color`, `text-bg-color`, `caret-color`, `selection-color` | string | Per-editor color overrides (escape hatch from theme tokens) |
| `line-numbers` | boolean | Show line-number gutter |

Events:
- `input` — `CustomEvent` on edit. `event.detail = { value }`.
- `forcerecompile` — `CustomEvent` when consumers want to signal a recompile (Cmd+Enter / Ctrl+Enter). `event.detail` carries the current value.

Editor themes are independent from the page theme — they style syntax tokens specifically. Use `applyEditorTheme(editor, themeName)` to switch one editor, or `applyEditorThemeGlobal(themeName)` to switch every editor on the page. `THEME_KEYS` is the array of available editor theme names; `EDITOR_THEMES` is the keyed object.

Form-associated: no (custom value handling).

### `<image-magnifier>` — canvas-attached loupe

```js
import { ImageMagnifier } from 'handfish'
```

A magnifier that attaches to an existing `<canvas>` element. It does not render an image itself — pass it a canvas and it provides hover-following zoom into that canvas's pixels.

```html
<canvas id="myCanvas" width="400" height="300"></canvas>
<image-magnifier id="mag"></image-magnifier>
<script type="module">
    const canvas = document.getElementById('myCanvas')
    const mag = document.getElementById('mag')
    mag.attach(canvas)  // ← required: bind to a canvas
    // ...later:
    // mag.detach()
</script>
```

Observed attributes:

| Attribute | Type | Notes |
|-----------|------|-------|
| `active` | boolean | **Read-only state** reflected by the component when the cursor enters/leaves the bound canvas. Setting it from JS does not show/hide the overlay. |
| `zoom` | number | Magnification factor |
| `size` | number | Magnifier diameter in px |

API: `magnifier.attach(canvas)` to bind, `magnifier.detach()` to release, `magnifier.active` (boolean getter) to query whether the cursor is currently over the canvas. Show/hide is driven by mouseenter/mouseleave on the bound canvas, not by toggling the `active` attribute. Events not currently dispatched.

### `AboutDialog` — programmatic "about" modal

```js
import { AboutDialog } from 'handfish'
```

Note: `AboutDialog` is a JS class, **not** a custom element. There is no `<about-dialog>` tag. Construct it and call methods.

```js
const about = new AboutDialog({
    name: 'My App',                    // required
    version: '1.2.0',                  // optional
    logo: '<svg>...</svg>',             // optional, raw SVG markup
    tagline: 'A thing that does stuff', // optional
    copyright: '2026',                  // optional, defaults to current year
    repo: 'https://github.com/...',     // optional, link to repo
    ecosystem: 'Built on Noisemaker',   // optional, fine print
    titleFont: 'Custom-Font, sans-serif' // optional, override title typography
})

about.show()       // open the modal
about.hide()       // close it
about.destroy()    // remove from DOM (call when done)

// Optional: populate build / engine info in the dialog
about.setBuild({ hash: 'abc1234', deployed: '2026-01-15T12:00:00Z' })
about.setNoisemaker({ version: '0.20', hash: 'def5678', deployed: 1700000000 })
about.setNoisemakerFromUrl('https://shaders.noisedeck.app/deployment-meta.json')
about.setEcosystem('Some footer text')
```

The dialog uses a native `<dialog>` element internally and follows handfish's escape-key conventions (Escape closes it).

## Helper APIs (not custom elements)

### Toast helpers — non-modal notifications

```js
import { showToast, showSuccess, showError, showWarning, showInfo } from 'handfish'
```

Functions, not tags. Each shows a toast in the bottom-right corner that auto-dismisses.

```js
showSuccess('Saved!')
showError('Failed to load: ' + err.message)
showInfo('Connected to server')
showWarning('Unsaved changes')
showToast('Custom message', { type: 'info', duration: 5000 })
```

See `references/utilities.md` for the full options table and durations.

### Tooltips — `class="tooltip"` + `data-title` + `initializeTooltips()`

```js
import { initializeTooltips } from 'handfish'
initializeTooltips()
```

After init, any element with **both** `class="tooltip"` and `data-title="..."` (or `aria-label` as fallback for the text) gets a hover tooltip via a single shared `<div>` layer. The class is the activation trigger; `data-title` is just the message source. Forgetting the class is the most common mistake — `data-title` alone produces nothing. See `references/utilities.md`.

### Escape stack — `registerEscapeable` / `unregisterEscapeable`

```js
import { initEscapeHandler, registerEscapeable, unregisterEscapeable } from 'handfish'
initEscapeHandler()
```

Handfish maintains a global LIFO stack of escapeable elements. The topmost one closes on Escape. Built-in components register themselves; custom modals can opt in via `registerEscapeable(el, () => el.close())`. See `references/utilities.md`.

### Color conversion utilities

Two dozen functions for RGB / HSV / OkLab / OKLCH / hex conversion and gamut mapping. See `references/color.md`.

## Form integration

Form-associated components (`<slider-value>`, `<select-dropdown>`, `<color-picker>`, `<color-wheel>`, `<vector2d-picker>`, `<vector3d-picker>`, `<justify-button-group>`) participate in native `<form>` submission via `attachInternals()`. Inside a `<form>`:

```html
<form id="settings">
    <slider-value name="brightness" min="0" max="1" step="0.01" value="0.7"></slider-value>
    <select-dropdown name="region">
        <option value="us-east">US East</option>
        <option value="eu-central">EU Central</option>
    </select-dropdown>
    <color-picker name="accent" value="#a5b8ff"></color-picker>
    <button type="submit">Save</button>
</form>

<script type="module">
    document.getElementById('settings').addEventListener('submit', (e) => {
        e.preventDefault()
        const data = new FormData(e.target)
        save(Object.fromEntries(data))
    })
</script>
```

Components that are **not** form-associated (`<toggle-switch>`, `<color-swatch>`, `<dropdown-menu>`, `<gradient-stops>`, `<code-editor>`, `<image-magnifier>`) won't appear in `FormData`. Mirror their values into hidden inputs or read them directly when submitting.

## Programmatic instantiation

When components are added to the DOM dynamically (e.g., from a render function in a framework), `connectedCallback` runs and the component initializes. There's no explicit "ready" event — the component is functional as soon as it's in the DOM.

For attributes set before the element is in the DOM:

```js
const slider = document.createElement('slider-value')
slider.setAttribute('min', '0')
slider.setAttribute('max', '100')
slider.setAttribute('value', '50')
slider.setAttribute('name', 'volume')
document.body.appendChild(slider)  // ← attributes apply here
slider.addEventListener('change', (e) => save(e.target.value))
```

For attributes set after, the component's `attributeChangedCallback` propagates them — but only for attributes in `observedAttributes`. Toggling a non-observed attribute (e.g., `selectable` on `<dropdown-menu>`) at runtime won't re-render the component.

## Reading values

Most components expose `el.value` as a getter that returns the current value (typed). For the components whose value-attribute is named differently (e.g., `<color-swatch>`'s `color`), use the matching property (`el.color`).

Equivalent ways to read for form-associated components:

```js
const value = el.value                          // property
const value = el.getAttribute('value')          // attribute (string only)
const value = new FormData(form).get(el.name)   // via form
```

When a component dispatches a plain `Event` with no `detail`, the listener pattern is:

```js
el.addEventListener('change', (e) => {
    const v = e.target.value  // ← read from the element, not the event
})
```

This is intentional — handfish components keep event payloads minimal so they're cheap to dispatch and forward; the source of truth is the element's own state.
