# Canonical API Reference

> **Auto-generated** by `scripts/regenerate-canonical-api.js` from handfish's machine-extracted API metadata. **Do not edit by hand** — your changes will be overwritten on the next regeneration. Hand-written prose lives in `components.md`; this file is the source of truth for attribute names, event types, event detail payloads, form-association status, and toast helper defaults.

## Provenance

- **handfish version:** 0.10
- **handfish commit (last touched the JSON):** `d8d350c2` (2026-07-28T14:11:00-06:00)
- **This file regenerated:** deterministically from the commit above — run `git log` on this file for when.
- **Generator:** `handfish/scripts/generate-component-api.js` → JSON → `handfish-design/scripts/regenerate-canonical-api.js` → this file

When this file disagrees with `components.md` or another reference, **this file wins** — components.md may have drifted; this is mechanically derived from source.

## Custom elements

Total: **21** registered custom elements. Form-associated components are tagged accordingly.

### `<code-editor>`

- **Class:** `CodeEditor`
- **Source:** `src/components/code-editor/CodeEditor.js`
- **Form-associated:** no

> Code Editor Web Component

**Observed attributes:**

- `value`
- `spellcheck`
- `placeholder`
- `readonly`
- `disabled`
- `font-family`
- `font-size`
- `background-color`
- `background-opacity`
- `text-color`
- `text-bg-color`
- `caret-color`
- `selection-color`
- `line-numbers`

**Events:**

- `forceevalblock` — CustomEvent (detail not statically extractable; check source)
- `forcerecompile` — CustomEvent (detail not statically extractable; check source)
- `selectionchange` — CustomEvent, `event.detail = { start, end, direction, value }`
- `input` — CustomEvent, `event.detail = { value, previousValue, edit, source }`

### `<color-picker>`

- **Class:** `ColorPicker`
- **Source:** `src/components/color-picker/ColorPicker.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Color Picker Dropdown Component

**Observed attributes:**

- `value`
- `disabled`
- `name`
- `color-mode`

**Events:**

- `input` — Event (no `detail`; read `el.value` or relevant property)
- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<color-swatch>`

- **Class:** `ColorSwatch`
- **Source:** `src/components/color-swatch/ColorSwatch.js`
- **Form-associated:** no

> Color Swatch Component
> Single color display with selection and edit capabilities

**Observed attributes:**

- `color`
- `selected`
- `disabled`
- `editable`
- `size`
- `show-tooltip`

**Events:**

- `select` — CustomEvent, `event.detail = { color, rgb }`
- `edit` — CustomEvent, `event.detail = { color, rgb }`

### `<color-wheel>`

- **Class:** `ColorWheel`
- **Source:** `src/components/color-wheel/ColorWheel.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Color Wheel Web Component

**Observed attributes:**

- `value`
- `alpha`
- `mode`
- `disabled`
- `required`
- `name`

**Events:**

- `input` — Event (no `detail`; read `el.value` or relevant property)
- `colorinput` — CustomEvent (detail not statically extractable; check source)
- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<dropdown-item>`

Registered alongside `<dropdown-menu>` (importing the parent registers both). See the `<dropdown-menu>` entry for usage.

- **Class:** `DropdownItem`
- **Source:** `src/components/dropdown-menu/DropdownMenu.js`

### `<dropdown-menu>`

- **Class:** `DropdownMenu`
- **Source:** `src/components/dropdown-menu/DropdownMenu.js`
- **Form-associated:** no

> Dropdown Menu Web Component
> Provides a trigger button with dropdown menu functionality

**Observed attributes:**

- `label`
- `icon`
- `disabled`
- `align`
- `value`

**Events:**

- `change` — CustomEvent, `event.detail = { value, item }`

### `<gradient-stops>`

- **Class:** `GradientStops`
- **Source:** `src/components/gradient-stops/GradientStops.js`
- **Form-associated:** no

> Gradient Stops Component
> Draggable color stop handles for positioning colors in a gradient
> Inspired by Photoshop's gradient editor

**Observed attributes:**

- `disabled`

**Events:**

- `select` — CustomEvent, `event.detail = { index }`
- `input` — CustomEvent, `event.detail = { index, position, positions }`
- `change` — CustomEvent, `event.detail = { index, positions }`
- `delete` — CustomEvent, `event.detail = { index, positions, colors }`

### `<image-magnifier>`

- **Class:** `ImageMagnifier`
- **Source:** `src/components/image-magnifier/ImageMagnifier.js`
- **Form-associated:** no

> Image Magnifier Web Component

**Observed attributes:**

- `active`
- `zoom`
- `size`

**Events:**

_No events dispatched._

### `<join-session-dialog>`

- **Class:** `JoinSessionDialog`
- **Source:** `src/components/join-session-dialog/JoinSessionDialog.js`
- **Form-associated:** no

> Join Session Dialog Component

**Observed attributes:**

- `title`
- `copy`
- `join-label`
- `cancel-label`
- `session-id`

**Events:**

- `cancel` — CustomEvent (detail not statically extractable; check source)
- `join-session` — CustomEvent, `event.detail = { sessionId }`

### `<justify-button-group>`

- **Class:** `JustifyButtonGroup`
- **Source:** `src/components/justify-button-group/JustifyButtonGroup.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Justify Button Group Web Component

**Observed attributes:**

- `value`
- `disabled`
- `name`
- `left-label`
- `center-label`
- `right-label`

**Events:**

- `change` — Event (no `detail`; read `el.value` or relevant property)
- `input` — CustomEvent, `event.detail = { value }`

### `<knob-dial>`

- **Class:** `KnobDial`
- **Source:** `src/components/knob-dial/KnobDial.js`
- **Form-associated:** no

**Observed attributes:**

- `value`
- `label`
- `unit`
- `cc`
- `disabled`
- `mode`
- `display`

**Events:**

- `lock` — CustomEvent (detail not statically extractable; check source)
- `learn` — CustomEvent (detail not statically extractable; check source)
- `turn` — CustomEvent (detail not statically extractable; check source)
- `press` — CustomEvent (detail not statically extractable; check source)

### `<led-matrix>`

- **Class:** `LedMatrix`
- **Source:** `src/components/led-matrix/LedMatrix.js`
- **Form-associated:** no

**Observed attributes:**

- `label`
- `value`
- `mode`

**Events:**

_No events dispatched._

### `<menu-bar>`

- **Class:** `MenuBar`
- **Source:** `src/components/menu-bar/MenuBar.js`
- **Form-associated:** no

> Application menu bar web component

**Observed attributes:**

- `floating`
- `hover-switch`
- `bar-label`

**Events:**

- `menu-open` — CustomEvent, `event.detail = { menuId }`
- `menu-close` — CustomEvent, `event.detail = { menuId }`
- `menu-select` — CustomEvent, `event.detail = { id, menuId, controlType, itemType, checked }`

### `<seance-dialog>`

- **Class:** `SeanceDialog`
- **Source:** `src/components/seance-dialog/SeanceDialog.js`
- **Form-associated:** no

> Seance Dialog Component

**Observed attributes:**

- `heading`
- `state`
- `session-id`
- `session-url`
- `copy`
- `take-label`
- `join-label`
- `join-label-text`
- `join-placeholder`
- `copy-label`
- `offline-label`
- `offline-status-label`
- `connecting-label`
- `online-label`
- `url-label`

**Events:**

- `cancel` — CustomEvent (detail not statically extractable; check source)
- `join-session` — CustomEvent, `event.detail = { sessionId }`
- `take-online` — CustomEvent (detail not statically extractable; check source)
- `copy-url` — CustomEvent, `event.detail = { sessionUrl }`
- `go-offline` — CustomEvent (detail not statically extractable; check source)

### `<select-dropdown>`

- **Class:** `SelectDropdown`
- **Source:** `src/components/select-dropdown/SelectDropdown.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Select Dropdown Web Component

**Observed attributes:**

- `value`
- `disabled`
- `name`
- `placeholder`
- `empty-text`
- `dialog-title`
- `dialog-label`
- `close-label`

**Events:**

- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<session-status>`

- **Class:** `SessionStatus`
- **Source:** `src/components/session-status/SessionStatus.js`
- **Form-associated:** no

> Session Status Component

**Observed attributes:**

- `state`
- `session-id`
- `session-url`
- `copy-label`
- `offline-label`

**Events:**

- `copy-url` — CustomEvent, `event.detail = { sessionId, sessionUrl }`
- `go-offline` — CustomEvent, `event.detail = { sessionId }`

### `<slider-value>`

- **Class:** `SliderValue`
- **Source:** `src/components/slider-value/SliderValue.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Slider Value Web Component

**Observed attributes:**

- `value`
- `min`
- `max`
- `step`
- `disabled`
- `name`
- `type`
- `format`

**Events:**

- `input` — Event (no `detail`; read `el.value` or relevant property)
- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<tempo-bar>`

- **Class:** `TempoBar`
- **Source:** `src/components/tempo-bar/TempoBar.js`
- **Form-associated:** no

**Observed attributes:**

_(none)_

**Events:**

- `change` — CustomEvent, `event.detail = { bpm }`
- `dividerchange` — CustomEvent, `event.detail = { divider }`
- `beat` — CustomEvent (detail not statically extractable; check source)

### `<toggle-switch>`

- **Class:** `ToggleSwitch`
- **Source:** `src/components/toggle-switch/ToggleSwitch.js`
- **Form-associated:** no

> Toggle Switch Web Component

**Observed attributes:**

- `checked`
- `disabled`

**Events:**

- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<vector2d-picker>`

- **Class:** `Vector2dPicker`
- **Source:** `src/components/vector2d-picker/Vector2dPicker.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Vector2D Picker Component

**Observed attributes:**

- `value`
- `disabled`
- `name`
- `min`
- `max`
- `step`
- `normalized`

**Events:**

- `input` — Event (no `detail`; read `el.value` or relevant property)
- `change` — Event (no `detail`; read `el.value` or relevant property)

### `<vector3d-picker>`

- **Class:** `Vector3dPicker`
- **Source:** `src/components/vector3d-picker/Vector3dPicker.js`
- **Form-associated:** **yes** (`attachInternals()`, participates in `<form>` + `FormData`)

> Vector3D Picker Component

**Observed attributes:**

- `value`
- `disabled`
- `name`
- `min`
- `max`
- `step`
- `normalized`

**Events:**

- `input` — Event (no `detail`; read `el.value` or relevant property)
- `change` — Event (no `detail`; read `el.value` or relevant property)

## Non-element classes

### `AboutDialog`

- **Source:** `src/components/about-dialog/AboutDialog.js`
- **Note:** plain JS class, NOT a custom element. Construct with `new` and call methods.

See `components.md` for constructor signature and method examples.

## Toast helpers

### Toast helpers (functions, not custom elements)

- **Source:** `src/components/toast/Toast.js`

**Exports:**

- `showError` — default duration: 6000ms
- `showInfo` — default duration: 2000ms
- `showSuccess` — default duration: 2000ms
- `showToast` — default duration: 2000ms
- `showWarning` — default duration: 2000ms

Real options for `showToast(msg, opts)`: `{ type, duration, dismissible, showProgress, dismissLabel }`. `dismissLabel` (default `'Dismiss'`) sets the close button's `aria-label` — override it to localize. There is no per-call `icon` option.

## Utility modules

### `utils/colorConversions.js`

- **Source:** `src/utils/colorConversions.js`

**Exports:**

- `clamp`
- `gamutMapLinearRGB`
- `getMaxAB`
- `getMaxChroma`
- `hsvToRgb`
- `isInGamut`
- `linearRGBToOKLab`
- `linearRGBToSRGB`
- `linearToSRGB`
- `normalizeHue`
- `okLabToLinearRGB`
- `okLabToOKLCH`
- `oklabToRgb`
- `oklchToOKLab`
- `oklchToRgb`
- `oklchToRgbRaw`
- `parseHex`
- `rgbToHex`
- `rgbToHexWithAlpha`
- `rgbToHsv`
- `rgbToOklab`
- `rgbToOklch`
- `roundTo`
- `sRGBToLinear`
- `sRGBToLinearRGB`

### `utils/escapeHandler.js`

- **Source:** `src/utils/escapeHandler.js`

**Exports:**

- `closeTopmost`
- `hasOpenEscapeables`
- `initEscapeHandler`
- `registerEscapeable`
- `unregisterEscapeable`

### `utils/shortcuts.js`

- **Source:** `src/utils/shortcuts.js`

**Exports:**

- `formatShortcut`
- `isMacPlatform`

### `utils/tooltips.js`

- **Source:** `src/utils/tooltips.js`

**Exports:**

- `initializeTooltips`

## Theming

### Themes

- **Stylesheet files:** 17
- **Total `data-theme` values:** 20 (some files declare both dark + light variants)

**Files and the `data-theme` values they declare:**

| File | `data-theme` values |
|------|---------------------|
| `brutalist.css` | `brutalist` |
| `corporate.css` | `corporate` |
| `cyberpunk.css` | `cyberpunk` |
| `dusk.css` | `dusk` |
| `earthy.css` | `earthy` |
| `gothic.css` | `gothic` |
| `gray.css` | `gray-dark`, `gray-light` |
| `high-contrast.css` | `high-contrast-dark`, `high-contrast-light` |
| `kawaii.css` | `kawaii` |
| `neutral.css` | `neutral-dark`, `neutral-light` |
| `newspaper.css` | `newspaper` |
| `ocean.css` | `ocean` |
| `organic.css` | `organic` |
| `rave.css` | `rave` |
| `sunset.css` | `sunset` |
| `synthwave.css` | `synthwave` |
| `terminal.css` | `terminal` |

Plus the two default modes in `tokens.css`: `dark` (no attribute, or `data-theme="dark"`) and `light` (via `prefers-color-scheme: light` or `data-theme="light"`).

## Public exports from `src/index.js`

Importing any of these via `import { X } from 'handfish'` is the supported entry point. The list below is the complete set as of the handfish commit above.

- `AboutDialog`
- `BeatScheduler`
- `CodeEditor`
- `ColorPicker`
- `ColorSwatch`
- `ColorWheel`
- `DIVIDER_OPTIONS`
- `DropdownItem`
- `DropdownMenu`
- `EDITOR_THEMES`
- `GradientStops`
- `ImageMagnifier`
- `JoinSessionDialog`
- `JustifyButtonGroup`
- `KnobDial`
- `LedMatrix`
- `MenuBar`
- `SEANCE_LOGO_SVG`
- `SeanceDialog`
- `SelectDropdown`
- `SessionStatus`
- `SliderValue`
- `THEME_KEYS`
- `TempoBar`
- `ToggleSwitch`
- `Vector2dPicker`
- `Vector3dPicker`
- `applyEditorTheme`
- `applyEditorThemeGlobal`
- `closeTopmost`
- `computeBarSeconds`
- `dslTokenizer`
- `formatShortcut`
- `hasOpenEscapeables`
- `initEscapeHandler`
- `initializeTooltips`
- `isMacPlatform`
- `registerEscapeable`
- `showError`
- `showInfo`
- `showSuccess`
- `showToast`
- `showWarning`
- `unregisterEscapeable`

