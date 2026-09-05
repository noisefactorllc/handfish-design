# Utilities

Tooltips, the global escape handler, and toast helpers — the three cross-cutting utilities every handfish app uses.

## Tooltips: `class="tooltip"` + `data-title` + `initializeTooltips()`

Handfish has one tooltip mechanism. There is no `<tooltip>` component, no per-element wrapper. The activation requires **two** things on the target element:

1. The element must have `class="tooltip"` (or be inside an element that does — the handler uses `closest('.tooltip')`).
2. The element must have `data-title="..."` (or `aria-label` as fallback) for the tooltip text.

Plus, call `initializeTooltips()` once at app startup.

```js
import { initializeTooltips } from 'handfish'
initializeTooltips()
```

```html
<button class="tooltip" data-title="Save the current document">
    <span class="material-symbols">save</span>
</button>

<toggle-switch class="tooltip" data-title="Enable dark mode" id="darkModeToggle"></toggle-switch>
```

If you forget the `tooltip` class, no tooltip appears even though `data-title` is set — the most common mistake. The class is the trigger. `data-title` is just the message source.

Internally, `initializeTooltips()` registers `pointerover`/`pointerout`/`pointerdown`/`focusin`/`focusout` handlers on `document` (plus `scroll`/`resize` for repositioning) that all do `event.target.closest('.tooltip')` to find the tooltipped element. A single `<div id="hf-tooltip-layer">` is reused across the page — there's no per-element DOM cost.

Handfish avoids extra wrapper structures around each tooltip target. It handles thousands of targets with one DOM node and one event listener.

### When to use `data-title` vs `aria-label`

- **`data-title`** — visible tooltip for sighted users. Use for icon-only buttons and other UI where a short label adds clarity.
- **`aria-label`** — the accessible name for screen readers. Use it when an interactive element has no visible text. Tooltips use it as fallback text when `data-title` is absent. The attributes have different purposes. Set both when one string serves both purposes:

```html
<button class="tooltip" aria-label="Save" data-title="Save the current document (Ctrl+S)">
    <span class="material-symbols">save</span>
</button>
```

The button is accessibly named "Save". The visible tooltip provides extra context (the keyboard shortcut). The `tooltip` class is still required to activate the hover layer. `aria-label` only provides the message text as a fallback when `data-title` is missing.

### Customizing tooltip appearance

The tooltip layer reads from `--hf-*` tokens for fonts, colors, and borders. To override appearance for an entire app, redefine the relevant tokens. There are no per-tooltip customization hooks.

### Don't reach for a third-party tooltip library

The reasons handfish has its own:

- It uses `--hf-*` tokens, so it themes correctly with the rest of the design system.
- It's already loaded — adding another library adds bytes and a second source of truth.
- It uses `data-title`, which is a one-attribute idiom that doesn't pollute markup with wrappers.

For rich content, interactive elements, or custom positioning beyond handfish's tooltips, use `<dialog>` or a popover. Do not add another tooltip library.

## The escape handler: closing modals/menus on Esc

Handfish maintains a global stack of "escapeable" elements. When the user presses Escape, the topmost one closes. This means modals, dropdowns, popovers, and dialogs nest naturally — open three things, press Escape three times, they close in reverse order.

```js
import { registerEscapeable, unregisterEscapeable, initEscapeHandler } from 'handfish'

initEscapeHandler()  // call once at startup
```

After init, components can register themselves when opened:

```js
class MyModal extends HTMLElement {
    open() {
        this.hidden = false
        registerEscapeable(this, () => this.close())
    }

    close() {
        this.hidden = true
        unregisterEscapeable(this)
    }
}
```

`<dropdown-menu>`, `<menu-bar>`, `<seance-dialog>`, and `<join-session-dialog>` register on the escape stack. `<color-picker>` and `AboutDialog` use native `<dialog>` elements, which the browser closes independently on Escape. Thus, `hasOpenEscapeables()` returns `false` for an open color picker or About dialog even though Escape closes it. Both collaboration dialogs use the stack and native `<dialog>`.

To check all overlays, include native dialogs separately: `document.querySelectorAll('dialog[open]').length > 0 || hasOpenEscapeables()`.

### How the stack interacts with `<dropdown-menu>`

Open a `<dropdown-menu>`, then open a custom modal you've registered with the stack. The modal goes on top. Escape closes the modal first. Another Escape closes the menu. The order is LIFO — most recently registered closes first.

A custom escapeable outside the stack can close at the wrong time, or remain open, among stack-registered elements. Use `registerEscapeable` for custom UI that should follow the same Escape ordering.

### When to call `initEscapeHandler()`

Once, at app startup. The handler attaches a `keydown` listener to `document` — but it does NOT guard against double-registration. Calling `initEscapeHandler()` twice attaches two listeners, and a single Escape press will close two stacked items at once (or otherwise corrupt the close ordering). If you forget to call it at all, registered escapeables won't close on Esc and the bug will look like "Esc doesn't work."

A safe pattern: put `initializeTooltips()` and `initEscapeHandler()` together in your app's bootstrap module so neither is missed *and* neither runs twice.

```js
// app/init.js
import { initializeTooltips, initEscapeHandler } from 'handfish'
initializeTooltips()
initEscapeHandler()
```

### `closeTopmost()` and `hasOpenEscapeables()`

Two lower-level helpers, occasionally useful:

```js
import { closeTopmost, hasOpenEscapeables } from 'handfish'

// Programmatically close the top thing (e.g., from a Cancel button)
closeTopmost()

// Decide whether to do something based on overlay state
if (hasOpenEscapeables()) {
    // a modal is open — don't navigate away
}
```

Most app code doesn't need these. They exist because the global escape handler uses them internally and they're occasionally useful for custom navigation logic.

## Toasts: non-modal notifications

Five functions — pick by intent:

```js
import { showToast, showSuccess, showError, showWarning, showInfo } from 'handfish'

showSuccess('Saved!')
showError('Failed to load: ' + err.message)
showWarning('You have unsaved changes')
showInfo('Reconnected to server')
showToast('Custom', { type: 'success', duration: 5000 })
```

Toasts appear in the bottom-right corner and auto-dismiss. They stack — multiple toasts queue vertically. They share a single container DOM node that's lazy-created on the first `showToast` call.

| Function | Default duration | Use for |
|----------|-----------------|---------|
| `showSuccess(msg)` | 2000ms | Operation succeeded |
| `showError(msg)` | 6000ms | Operation failed (longer so the user can read it) |
| `showWarning(msg)` | 2000ms | Reversible problem, advisory |
| `showInfo(msg)` | 2000ms | Status update, neutral information |
| `showToast(msg, opts)` | 2000ms | Generic — lets you pass `type` explicitly |

### Options

```js
showToast('Hello', {
    type: 'info',           // 'success' | 'error' | 'warning' | 'info' (default 'info')
    duration: 5000,         // ms before auto-dismiss; 0 = sticky (manual close only)
    dismissible: true,      // show the X button; default true
    showProgress: false,    // render a draining progress bar; default false
    dismissLabel: 'Dismiss',// aria-label for the close button; override to localize
})
```

`dismissLabel`, default `'Dismiss'`, sets the close button's `aria-label`. It is the toast's only exposed user-facing string. Pass a translation for non-English UI so screen readers announce the correct name. See `references/i18n.md`.

`duration: 0` produces a sticky toast that requires the user to close it via the X button (provided `dismissible` is true). Use sparingly — sticky toasts that pile up are worse than no toasts at all. Reserve them for genuinely persistent state (e.g., "you're offline").

The icon is chosen from the `type` automatically — there's no per-call `icon` override. To customize the icon palette globally, modify the `ICONS` table in handfish's `Toast.js`.

### What NOT to use toasts for

- **Errors that block continuation.** A toast can be missed. If the user must respond, use a `<dialog>` modal instead.
- **Long-running progress.** Toasts have no progress affordance. Use a status bar or progress indicator.
- **Critical confirmations.** "Are you sure you want to delete?" is not a toast.
- **Repetitive status spam.** A loop that fires `showSuccess('saved')` once per keystroke creates a flood. Debounce or batch.

Toasts are for transient, advisory, dismissable feedback. If the message is important enough that missing it would be bad, it's not a toast.

### Toast and screen readers

The toast layer is a polite live region — assistive tech announces toast contents when they appear. Keep the messages short and meaningful for that reason. Long toast text is annoying for everyone but especially for screen reader users.

## Keyboard-shortcut formatting: `formatShortcut` / `isMacPlatform`

Menu-style UIs (notably `<menu-bar>`) show shortcut hints as plain text. Rather than branch on the platform yourself, write one `Mod+…` spec and let handfish render it correctly per platform:

```js
import { formatShortcut, isMacPlatform } from 'handfish'

formatShortcut('Mod+S')          // '⌘S' on Mac, 'Ctrl+S' elsewhere
formatShortcut('Mod+Shift+Z')    // '⇧⌘Z' on Mac, 'Ctrl+Shift+Z' elsewhere
formatShortcut('Alt+Enter')      // '⌥Enter' on Mac, 'Alt+Enter' elsewhere

if (isMacPlatform()) { /* … */ }
```

Rules:

- **`Mod`** is the meta key: ⌘ on Mac, `Ctrl` everywhere else. (`Cmd`/`Meta`/`Ctrl`/`Control`/`Alt`/`Option`/`Shift` are also recognized, case-insensitively.)
- On Mac, modifiers render as glyphs joined in canonical `⌃⌥⇧⌘` order with no separator. Elsewhere they keep the given order joined with `+`.
- Single-character keys are upper-cased. Longer key names (`F1`, `Space`, `Escape`, `Enter`) pass through unchanged.
- `formatShortcut(spec, { mac: true|false })` forces a platform — handy for tests or previewing the other platform's rendering.
- `isMacPlatform(nav?)` accepts an injectable `Navigator` for testing. It defaults to the global `navigator`.

Use it to build the `shortcut` fields in a `<menu-bar>` config so a single spec stays correct on every platform.
