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

If you forget the `tooltip` class, no tooltip appears even though `data-title` is set — the most common mistake. The class is the trigger; `data-title` is just the message source.

Internally, `initializeTooltips()` registers `mouseover`/`mouseout`/`mousemove`/`focusin`/`focusout` handlers on `document` that all do `event.target.closest('.tooltip')` to find the tooltipped element. A single `<div id="hf-tooltip-layer">` is reused across the page — there's no per-element DOM cost.

This is intentionally minimal. Tooltip libraries that wrap each tooltipped element in extra structure don't scale; handfish's approach handles thousands of tooltipped elements with one DOM node and one event listener.

### When to use `data-title` vs `aria-label`

- **`data-title`** — visible tooltip for sighted users. Use for icon-only buttons and other UI where a short label adds clarity.
- **`aria-label`** — accessibility name read by screen readers. Use whenever an interactive element doesn't have visible text. The tooltip system falls back to `aria-label` if `data-title` is absent, but the two have different semantics — set both when the same string serves both purposes:

```html
<button class="tooltip" aria-label="Save" data-title="Save the current document (Ctrl+S)">
    <span class="material-symbols">save</span>
</button>
```

The button is accessibly named "Save"; the visible tooltip provides extra context (the keyboard shortcut). The `tooltip` class is still required to activate the hover layer; `aria-label` only provides the message text as a fallback when `data-title` is missing.

### Customizing tooltip appearance

The tooltip layer reads from `--hf-*` tokens for fonts, colors, and borders. To override appearance for an entire app, redefine the relevant tokens. There are no per-tooltip customization hooks.

### Don't reach for a third-party tooltip library

The reasons handfish has its own:

- It uses `--hf-*` tokens, so it themes correctly with the rest of the design system.
- It's already loaded — adding another library adds bytes and a second source of truth.
- It uses `data-title`, which is a one-attribute idiom that doesn't pollute markup with wrappers.

If a tooltip needs more than handfish provides — rich content, interactive elements, custom positioning logic — reach for `<dialog>` or a popover instead, not a different tooltip library.

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

Only `<dropdown-menu>` registers itself on the escape stack. `<color-picker>` and `AboutDialog` use native `<dialog>` elements, which the browser closes on Escape independently of the stack. So `hasOpenEscapeables()` will return `false` for an open color picker or about dialog — that's the trade-off of leaning on native dialogs. If you need a unified "is anything overlay-y open?" check, treat dialogs separately (e.g., `document.querySelectorAll('dialog[open]').length > 0 || hasOpenEscapeables()`).

### How the stack interacts with `<dropdown-menu>`

Open a `<dropdown-menu>`, then open a custom modal you've registered with the stack. The modal goes on top. Escape closes the modal first; another Escape closes the menu. The order is LIFO — most recently registered closes first.

If you write a custom escapeable that does *not* use the stack, your element will close at the wrong time (or not at all) when nested with `<dropdown-menu>` and other stack-registered elements. Use `registerEscapeable` for any custom open-able UI that should participate in the same Esc-press ordering.

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
    type: 'info',         // 'success' | 'error' | 'warning' | 'info' (default 'info')
    duration: 5000,       // ms before auto-dismiss; 0 = sticky (manual close only)
    dismissible: true,    // show the X button; default true
    showProgress: false,  // render a draining progress bar; default false
})
```

`duration: 0` produces a sticky toast that requires the user to close it via the X button (provided `dismissible` is true). Use sparingly — sticky toasts that pile up are worse than no toasts at all. Reserve them for genuinely persistent state (e.g., "you're offline").

The icon is chosen from the `type` automatically — there's no per-call `icon` override. To customize the icon palette globally, modify the `ICONS` table in handfish's `Toast.js`.

### What NOT to use toasts for

- **Errors that block continuation.** A toast can be missed; if the user must respond, use a `<dialog>` modal instead.
- **Long-running progress.** Toasts have no progress affordance. Use a status bar or progress indicator.
- **Critical confirmations.** "Are you sure you want to delete?" is not a toast.
- **Repetitive status spam.** A loop that fires `showSuccess('saved')` once per keystroke creates a flood. Debounce or batch.

Toasts are for transient, advisory, dismissable feedback. If the message is important enough that missing it would be bad, it's not a toast.

### Toast and screen readers

The toast layer is a polite live region — assistive tech announces toast contents when they appear. Keep the messages short and meaningful for that reason; long toast text is annoying for everyone but especially for screen reader users.
