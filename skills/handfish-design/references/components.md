# Components

The handfish catalog: 21 custom elements plus a small set of helper APIs (toasts, tooltips, escape handler, keyboard-shortcut formatting, About dialog). Each entry covers the tag (or import), the attributes you'll set, the events you'll listen for, and form-association behavior.

> **Localizing built-in strings:** Several components provide English defaults that the app can override through attributes or configuration. These include `<select-dropdown>` placeholders, `<justify-button-group>` tooltips, `<seance-dialog>` collaboration labels, `AboutDialog` field labels, and toast dismiss `aria-label` values. The app provides translations. See `references/i18n.md` for bidi/RTL support and the override catalog.

> **Authoritative source:** Each release generates `api-canonical.md` from handfish source. It takes precedence for attribute names, event types, event detail keys, and form-association status. This file contains hand-written prose and may drift. The generated reference avoids that drift.
>
> Use this file for: how to use each component, examples, when to reach for what, gotchas, anti-patterns.
> Use `api-canonical.md` for: checking you're reading the right attribute, listening for the right event, expecting the right `event.detail` keys.

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

A few conventions show up across the catalog, but they are not universal — check per component:

- **Attribute / property parity is common but not guaranteed.** Most components reflect `observedAttributes` to JS properties. Some omit properties or use different names. For example, `<color-swatch>` exposes the `color` attribute and `.color` property, but no `.value`. Prefer reading the property after setting the attribute, or use attributes exclusively.
- **`input` and `change` semantics vary per component.** The design intent is continuous `input` and committed `change`. Several components, notably `<slider-value>`, fire both for every change. Check the relevant catalog entry before assuming that `change` is debounced.
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

Events: `change` — fires on flip. Plain `Event` with no `detail`. Read `el.checked`.

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

Events: `input` and `change` both fire on **every** value change, including drags, keypresses, and programmatic changes. `_dispatchChange` fires both events together, without a commit/release distinction. Debounce expensive handlers, such as network saves, in your listener. Do not expect `change` to fire less often. Both events are plain `Event` objects without `detail`. Read `el.value`.

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
| `placeholder` | string | Trigger text before a selection is made. Default `"Select..."` |
| `empty-text` | string | Shown in the dialog when there are no options. Default `"no options available"` |
| `dialog-title` | string | Heading of the option-picker dialog. Default `"select"` (or derived from a control label) |
| `dialog-label` | string | `aria-label` for the dialog. Default `"select option"` |
| `close-label` | string | `aria-label` for the dialog's close button. Default `"close"` |

The last five attributes exist so the built-in English strings can be localized — set them to translated text for non-English UIs. See `references/i18n.md`.

Events: `change` — plain `Event`. Read `el.value`.

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
| `align` | `left` \| `right` \| `start` \| `end` | Where the menu opens. `left`/`right` are physical (fixed regardless of direction). `start`/`end` are **logical** — they flip with text direction. Prefer `start`/`end` for RTL-ready UIs. Default `left`. |
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

Events: `input` (during interaction) and `change` (on commit). Both are plain `Event` objects with no `detail`. Read `el.value` for the hex string.

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
- `input` — plain `Event` during interaction. Read `el.value`.
- `change` — plain `Event` on commit. Read `el.value`.
- `colorinput` — `CustomEvent` during interaction with `event.detail` carrying the live color payload (richer than `input`).

### `<color-swatch>` — color preview / selectable tile

```js
import { ColorSwatch } from 'handfish'
```

Compact color tile, often used in palettes or recent-colors strips. Click selects the swatch. With `editable`, double-click dispatches an `edit` event so a parent can open a picker. The component does **not** include a built-in picker UI.

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

Both event details contain `rgb` as a `[r, g, b]` array of 0–1 floats. Other handfish color utilities use `{r, g, b}` objects with values from 0–255. Convert with `{ r: rgb[0]*255, g: rgb[1]*255, b: rgb[2]*255 }`.

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

Color changes use separate methods, with a picker for each stop. Track them through the picker's events. `<gradient-stops>` `change` events report position changes only.

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

Same value asymmetry as the 2D variant: HTML attribute is the string `"x,y,z"`. JS property is `{x, y, z}`. Read via `el.value.x` / `el.value.y` / `el.value.z`.

### `<justify-button-group>` — left/center/right segmented control

```js
import { JustifyButtonGroup } from 'handfish'
```

Three hardcoded buttons for `left` / `center` / `right` alignment, with Material Symbols icons. Not generic — there is no `options` attribute. Use it for justification UIs. For other 3-way enums, build a similar component yourself.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | `left` \| `center` \| `right` | Selected option (default `center`) |
| `disabled` | boolean | |
| `name` | string | |
| `left-label` | string | `title`/tooltip for the left button. Default `"Align left"` |
| `center-label` | string | `title`/tooltip for the center button. Default `"Align center"` |
| `right-label` | string | `title`/tooltip for the right button. Default `"Align right"` |

The three `*-label` attributes localize the buttons' hover/accessible text — the icons and `value` semantics (`left`/`center`/`right`) stay physical and unchanged. Note that in an RTL context the *icons* do not auto-mirror. The values remain literal left/center/right. See `references/i18n.md`.

Events:
- `change` — plain `Event` on selection. Read `el.value`.
- `input` — `CustomEvent` with `event.detail = { value }`. Fires on the same selection.

Form-associated: yes.

### `<code-editor>` — syntax-highlighted text editor

```js
import { CodeEditor, EDITOR_THEMES, THEME_KEYS, applyEditorTheme, applyEditorThemeGlobal, dslTokenizer } from 'handfish'
```

In-browser code editor with pluggable tokenizers. `dslTokenizer` is included. Supply your own for arbitrary languages.

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
- `input` — `CustomEvent` on every edit. `event.detail = { value, previousValue, edit, source }`. `edit` describes the applied splice as `{ start, end, text }`. `source` is `'user'` for typing. For `replaceRange`/`applyTextEdit`, it is the caller-supplied source, defaulting to `'api'`. Use `source` to avoid sending received remote edits again.
- `selectionchange` — `CustomEvent` when the caret/selection moves. `event.detail = { start, end, direction, value }`.
- `forcerecompile` — `CustomEvent` on **Ctrl/Cmd+Enter**. The signal to recompile/run the whole buffer. No `detail`. Read `el.value`.
- `forceevalblock` — `CustomEvent` on **Alt+Enter** (or Ctrl/Cmd+Shift+Enter). The signal to evaluate just the current block/line. No `detail`. The consumer decides what "block" means and reads `el.value` + `getSelectionRange()`.

Editor themes are independent from the page theme — they style syntax tokens specifically. Use `applyEditorTheme(editor, themeName)` to switch one editor, or `applyEditorThemeGlobal(themeName)` to switch every editor on the page. `THEME_KEYS` is the array of available editor theme names. `EDITOR_THEMES` is the keyed object.

**Collaboration API (remote cursors, programmatic edits, line flashing).** `<code-editor>` is transport-agnostic — it owns no networking. A collaboration host drives it through these methods and renders whatever it pushes:

- `replaceRange(start, end, text, opts)` / `applyTextEdit({start, end, text}, opts)` apply programmatic edits. Pass `{ emitInput: true, source: 'remote' }` to emit `input` with your source. You can then ignore that event when it returns. `opts.select`, default `'preserve'`, controls caret placement.
- `getSelectionRange()` / `setSelectionRange(start, end, direction)` — read/write the local selection.
- `setRemoteSelections([...])`, `setRemoteSelection(sel)`, `clearRemoteSelection(id)`, and `clearRemoteSelections()` render other users' cursors and selections. Each entry is `{ id, label, color, start, end }`. `color` is a CSS string, defaulting to `#5a7fdd`. The component calculates the cursor and selection palette internally. Do not pass a `palette`. Each selection shows a labeled remote caret.
- `flashLines(startLine, endLine, { tone })` — briefly highlight a 1-based line range. `tone` is `'eval'` (default), `'error'`, or `'remote'`. Use it to flash an evaluated block or a collaborator's applied edit.
- `setTokenizer(fn)`, `getTextarea()`, `getDisplay()` — swap the tokenizer at runtime / reach the underlying nodes.

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

## Industrial components

Three instrument-style controls for utilitarian / hardware-like UIs (mixers, sequencers, MIDI tooling). They inject their own styles like every other component and work with `index.css` alone. They read `--hf-*` tokens, so they theme normally. `<led-matrix>` additionally reads a small `--hf-led-*` palette (with built-in fallbacks).

The industrial "design language" is a separate typeface layer. It adds Atkinson Hyperlegible, `.hf-topbar`, and `.hf-logotype` through `industrial.css`. Activate it with `data-language="industrial"` on `<html>`. The typeface layer and industrial components work independently. See `references/setup.md`.

### `<knob-dial>` — rotary knob / encoder

```js
import { KnobDial } from 'handfish'
```

A rotary knob with two interaction models, chosen per instance (a UI can mix both):

- **absolute** (default) — a bounded pot. Normalized value `0..1`, shown as a value-arc ring, a pointer, and the formatted value inside the cap. Drag / wheel / arrow keys set the value. Double-click resets to the default. Map `0..1` to real units with the `format` **property** (a function): `knob.format = v => String(Math.round(40 + v * 140))`.
- **endless** (`mode="endless"`) — a relative encoder. No fixed value: drag / wheel / arrows emit `turn` (signed detents). The app owns the state and sets the text inside the cap via the `display` attribute/property. The pointer free-rotates. There is no level ring.

Both modes: right-click or long-press emits `learn` (for MIDI-learn). A `cc` attribute shows a CC badge. A `selected` attribute draws the accent highlight. `label` sits below. `disabled` dims and disables.

| Attribute | Type | Notes |
|-----------|------|-------|
| `value` | number | Normalized `0..1` (absolute mode) |
| `label` | string | Caption under the knob |
| `unit` | string | Unit suffix shown with the value |
| `cc` | string | MIDI CC number. Shows a small CC badge |
| `mode` | `absolute` \| `endless` | Interaction model. Default `absolute` |
| `display` | string | Cap text in **endless** mode (app-owned) |
| `disabled` | boolean | |

Events (all `CustomEvent`):
- `input` — live, during a drag (absolute). `event.detail = { value }` (normalized).
- `change` — on commit (absolute). `event.detail = { value }`.
- `turn` — a detent step (endless). `event.detail = { delta, ctrl, shift }` (`delta` is the signed step count. `ctrl`/`shift` report modifier keys for fine/coarse handling).
- `press` — a click with no drag (endless). `event.detail = { ctrl }`.
- `lock` — a double-click (endless).
- `learn` — right-click / long-press (both modes). Wire it to MIDI-learn.

> **Canonical-reference caveat:** `api-canonical.md` lists only `lock`/`learn`/`turn`/`press` for `<knob-dial>`. Its generator cannot extract `input`/`change` because `_emit(type)` dispatches them indirectly. Source inspection confirms that both events exist. For these two events, this section is more complete than the generated reference. Use this section for knob-dial's `input`/`change`.

The `format` (absolute) and `display` (endless) hooks are how real-world units reach the cap — the component itself only knows about the normalized value. Form-associated: **no.**

### `<led-matrix>` — pixel inspector readout

```js
import { LedMatrix } from 'handfish'
```

The inspector renders a dense 128×32 monochrome pixel grid on a `<canvas>`, resembling a micro-OLED screen. It shows a label, large value, and optional Euclidean onset grid or bar gauge. At paint time, it reads CSS color properties with built-in fallbacks:

| Token | Meaning |
|-------|---------|
| `--hf-led-bg` | background (near-black) |
| `--hf-led` | lit pixel (cyan) |
| `--hf-led-dim` | dim pixel / label |
| `--hf-led-hi` | highlight pixel |

| Attribute | Type | Notes |
|-----------|------|-------|
| `label` | string | Small label line |
| `value` | string | Large value readout |
| `mode` | string | Preview mode (`value`, onset grid, bar gauge) |

Imperative API: `el.show({ label, value, mode, data, playhead })` applies a full descriptor. Use it for clock-driven updates because `data` and `playhead` have no attributes. The `label`, `value`, and `mode` attributes cover static use. The component emits no events. Form-associated: **no.**

### `<tempo-bar>` — transport tempo clock

```js
import { TempoBar, BeatScheduler, DIVIDER_OPTIONS, computeBarSeconds } from 'handfish'
```

A compact transport strip: tap-tempo button, editable BPM field, divider dropdown, four beat-indicator lights, and a phase-nudge slider — assembled from handfish primitives. It owns a `BeatScheduler` (a free-running beat clock) and, by default, starts it on connect.

| Attribute | Type | Notes |
|-----------|------|-------|
| `bpm` | number | Initial tempo. Default 120 |
| `divider` | number | Beats-per-bar divider. Default 4 |
| `min-bpm` / `max-bpm` | number | Clamp range. Default 40 / 300 |
| `storage-key` | string | If set, persists BPM/divider to `localStorage` under this key |
| `manual` | boolean | Skip auto-start. Call `el.start()` yourself |
| `no-divider` | boolean | Hide the divider dropdown |
| `no-phase` | boolean | Hide the phase-reset button and slider |

Properties: `scheduler` (the `BeatScheduler`), `bpm`, `divider`. Methods: `start()`, `stop()`, `tap()`, `resetPhase()`, `barSeconds()`, `showBeat(beatInBar)` (drive the lights from an external clock).

Events (all `CustomEvent`):
- `change` — BPM changed from any source. `event.detail = { bpm }`.
- `dividerchange` — divider changed. `event.detail = { divider }`.
- `beat` — fires each beat. `event.detail = { bpm, beatIndex, beatInBar, barIndex, isDownbeat }`.

To slave other UI to the transport, listen for `beat`. To drive the lights from an *external* clock instead of the internal scheduler, set `manual` and call `showBeat()`. `BeatScheduler` and `computeBarSeconds` are exported for headless use. Form-associated: **no.**

## Application chrome

### `<menu-bar>` — application menu bar

```js
import { MenuBar } from 'handfish'
```

The unified top menu bar (File / Edit / View …) shared across the Noise Factor apps. Its styling lives in `menus-and-toolbars.css`, which `index.css` already imports — no extra stylesheet needed.

**Configure through the `.config` property.** Assign a configuration object instead of nesting elements. It defines menus, items, and inline controls across left, center, and right regions. Dynamic fields accept a value or a zero-argument function. These fields include labels, `checked`, `disabled`, `hidden`, icons, tooltips, text, `pressed`, `active`, and `interactive`. Functions run when a menu opens, after each activation, and on `refresh()` / `update()`.

`update(id, patch)` applies overrides that persist until another patch.

```js
const bar = document.querySelector('menu-bar')
bar.config = {
    left: [
        { id: 'file', label: 'File', items: [
            { id: 'open', label: 'Open…', shortcut: 'Mod+O' },
            { id: 'save', label: 'Save', shortcut: 'Mod+S', disabled: () => !isDirty() },
        ]},
    ],
}
bar.addEventListener('menu-select', (e) => handle(e.detail.id))
```

| Attribute | Type | Notes |
|-----------|------|-------|
| `floating` | boolean | Fixed top-left "island" placement (≈590px, safe-area aware) |
| `hover-switch` | string | Set to `"off"` to disable hover-switching between open menus |
| `bar-label` | string | Accessible label for the bar. Default `"Application menu"` |

Events (all `CustomEvent`):
- `menu-select` — an item or control was activated. `event.detail = { id, menuId, controlType, itemType, checked }`.
- `menu-open` — a dropdown opened. `event.detail = { menuId }`.
- `menu-close` — a dropdown closed. `event.detail = { menuId }`.

> **Security:** Configuration must be **trusted developer input**, as with `AboutDialog`. The component inserts item `html` as HTML. It applies `attrs` and `classes` verbatim. Never build configuration fields from user-controlled strings. See the handfish repo's `examples/index.html` for a full example.

`<menu-bar>` registers on the escape stack and uses logical CSS throughout, so it is already RTL-ready. Shortcut hints render as plain text (use the `formatShortcut` helper — see `references/utilities.md` — to stay platform-correct). Form-associated: **no.**

## Collaboration (Seance)

Three components for "Seance" real-time collaboration. All are **stateless with respect to networking** — the app owns the session lifecycle and reflects it back through attributes (`state`, `session-id`, `session-url`). The components only emit *intent* events. Every user-facing string is an overridable attribute (see `references/i18n.md`).

### `<seance-dialog>` — collaboration session dialog

```js
import { SeanceDialog, SEANCE_LOGO_SVG } from 'handfish'
```

This modal manages going online, joining by session id, and the live session's indicator, share URL, copy action, and offline action. Its layout follows the About dialog. The Seance logo uses the host theme through `currentColor`. `SEANCE_LOGO_SVG` lets trigger buttons display a matching graphic.

| Attribute | Notes |
|-----------|-------|
| `heading` | Dialog heading |
| `state` | App-reflected session state: `offline` \| `connecting` \| `online` \| `readonly` |
| `session-id` / `session-url` | The live session's id and shareable URL |
| `copy` | Body copy |
| `take-label`, `join-label`, `join-label-text`, `join-placeholder`, `copy-label`, `offline-label`, `offline-status-label`, `connecting-label`, `online-label`, `url-label` | Overridable strings for every control and status line — localize these |

Open and close it imperatively: **`el.show()`** opens the modal (a native `<dialog>` via `showModal()` under the hood), **`el.hide()`** closes it (`el.hide({ emitCancel: true })` also fires `cancel`). It's `hidden` until shown.

Events (all `CustomEvent`): `take-online`, `join-session` (`detail = { sessionId }`), `copy-url` (`detail = { sessionUrl }`), `go-offline`, `cancel`. The app performs the actual network action and then updates `state` / `session-id` / `session-url` to reflect the result. Registers on the escape stack (Escape closes it). Form-associated: **no.**

### `<session-status>` — live session indicator

```js
import { SessionStatus } from 'handfish'
```

A compact inline indicator (dot + id + copy / go-offline affordances) for showing an active session outside a modal — e.g., in a toolbar. Attributes: `state`, `session-id`, `session-url`, `copy-label`, `offline-label`. Events: `copy-url` (`detail = { sessionId, sessionUrl }`), `go-offline` (`detail = { sessionId }`). Form-associated: **no.**

### `<join-session-dialog>` — join-by-id dialog

```js
import { JoinSessionDialog } from 'handfish'
```

A focused modal for the single task of joining a session by id (a lighter-weight subset of `<seance-dialog>`). Attributes: `title`, `copy`, `join-label`, `cancel-label`, `session-id`. Events: `join-session` (`detail = { sessionId }`), `cancel`. Open/close it the same way as `<seance-dialog>`: `el.show()` / `el.hide()`. Reach for this when the app only needs "join," not the full online/offline lifecycle. Form-associated: **no.**

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
    titleFont: 'Custom-Font, sans-serif', // optional, override title typography
    labels: {                           // optional, localize the field labels
        version: 'Version', build: 'Build', deployed: 'Deployed',
        noisemakerEngine: 'Noisemaker Engine', local: 'local', unavailable: 'n/a',
    }
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

`labels` merges translated strings over the English defaults: `{ version, build, deployed, noisemakerEngine, local, unavailable }`. The dialog HTML-escapes dynamic build, version, and deployment values. It wraps them in `<bdi dir="auto">` to isolate mixed-direction content, such as an English hash in an Arabic UI.

The dialog inserts `name`, `tagline`, `ecosystem`, `logo`, and `copyright` as **trusted HTML**. These fields require developer-supplied content, including raw SVG in `logo`. Never build them from user-controlled strings. See `references/i18n.md`.

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

After initialization, elements with `class="tooltip"` and `data-title="..."` receive a hover tooltip through one shared `<div>`. `aria-label` supplies fallback text when `data-title` is absent. The class activates the tooltip. `data-title` alone does not. See `references/utilities.md`.

### Escape stack — `registerEscapeable` / `unregisterEscapeable`

```js
import { initEscapeHandler, registerEscapeable, unregisterEscapeable } from 'handfish'
initEscapeHandler()
```

Handfish maintains a global LIFO stack of escapeable elements. The topmost one closes on Escape. Built-in components register themselves. Custom modals can opt in via `registerEscapeable(el, () => el.close())`. See `references/utilities.md`.

### Color conversion utilities

Two dozen functions for RGB / HSV / OkLab / OKLCH / hex conversion and gamut mapping. See `references/color.md`.

### Keyboard-shortcut formatting — `formatShortcut` / `isMacPlatform`

```js
import { formatShortcut, isMacPlatform } from 'handfish'

formatShortcut('Mod+Shift+Z')  // '⇧⌘Z' on Mac, 'Ctrl+Shift+Z' elsewhere
```

Format a `+`-separated shortcut spec for display on the current platform. `Mod` maps to ⌘ on Mac and Ctrl elsewhere. Mac output uses canonical `⌃⌥⇧⌘` glyph order. Use it for menu shortcut hints (e.g. in a `<menu-bar>` config) so a single `'Mod+…'` spec stays platform-correct. See `references/utilities.md`.

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

Components without form association do not appear in `FormData`. These include `<toggle-switch>`, `<color-swatch>`, `<dropdown-menu>`, `<gradient-stops>`, `<code-editor>`, and `<image-magnifier>`. They also include every industrial, chrome, and collaboration component: `<knob-dial>`, `<led-matrix>`, `<tempo-bar>`, `<menu-bar>`, `<seance-dialog>`, `<session-status>`, and `<join-session-dialog>`. Mirror their values into hidden inputs or read them directly during submission. For `<knob-dial>`, read `el.value` or track `change`, even though it holds a value.

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

Handfish keeps event payloads small so dispatching and forwarding them costs little. The element's state is authoritative.
