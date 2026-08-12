# Styling

How handfish components are styled, how to override them, and what patterns to avoid.

## The styling model

Handfish components inject a single `<style>` block into `document.head` the first time they're imported. Each component's style block has a stable ID like `hf-toggle-switch-styles` so it's only ever injected once even if the component is imported from multiple modules.

The styles target the component by tag name and its internal class names:

```css
toggle-switch { display: inline-block; }
toggle-switch .ts-track { background: ...; }
toggle-switch .ts-track.ts-checked { background: ...; }
```

There is no Shadow DOM. The component renders into the regular page DOM, and its styles live in the regular cascade alongside everything else. This is intentional — it's what makes theming work without ceremony, and it's what lets app code adjust component appearance without poking through encapsulation boundaries.

## Why no Shadow DOM

Shadow DOM gives you encapsulation: styles inside the shadow root can't leak out, and styles outside can't leak in (except via `::part()`, custom properties, and a few other narrow channels). That sounds appealing until you realize what it costs:

- **Token theming gets harder.** Custom properties do pierce shadow boundaries, so theming still works — but if you want to override anything else, you need `::part()` exposure declared by the component author, or you can't.
- **Selector overrides are impossible.** "Make the slider thumb 2px larger" is a one-line CSS change in light DOM. In shadow DOM it's either impossible or requires the component to expose a part for it.
- **Debugging is harder.** Computed styles for shadow elements are partially opaque in DevTools. Light DOM elements are fully inspectable.
- **The mental model is heavier.** Light DOM means "the page is the page." Shadow DOM means "the page contains pockets of separate documents."

For a design system that's used across many apps with different needs, the trade-off is clearly in favor of light DOM. App authors get full power; they pay for it with discipline.

That discipline is what this reference is about.

## Overriding component styles

When you need to change how a handfish component looks, work in this order:

### 1. Override at the token layer (preferred)

If the change is "I want a different color/size for this," the right move is usually to override the relevant `--hf-*` token in a scope that contains the component(s) you want to affect:

```css
/* All sliders inside .preview-panel use a green accent */
.preview-panel {
    --hf-accent: var(--hf-green);
    --hf-accent-3: var(--hf-green);
}
```

Custom properties cascade naturally, and this approach respects the design system: you're staying within the token vocabulary, just remapping it for a region. This is by far the cleanest override pattern.

### 2. Override at the selector layer (when tokens don't fit)

If you need a structural change — different layout, different dimensions, different states — write a regular CSS rule with enough specificity to win:

```css
/* App stylesheet */
.preview-panel toggle-switch {
    transform: scale(1.5);
}

.compact-toolbar slider-value .slider {
    height: 0.25rem;  /* override handfish's 0.5rem default */
}
```

The handfish style for `slider-value .slider` has selector specificity `(0,0,0,2)` (one element, one class). Adding any class context — like `.compact-toolbar slider-value .slider` — bumps you to `(0,0,1,2)` and you win. Specificity battles are mechanical: count elements/classes/IDs and outcount the rule you want to override.

### 3. Override at the attribute layer (when state matters)

Components expose state via attributes. Use them in selectors to scope overrides:

```css
toggle-switch[checked] .ts-track {
    background: var(--hf-green);  /* green when on, default when off */
}

slider-value[disabled] .value-display {
    text-decoration: line-through;
}
```

This is the cleanest way to react to component state from app CSS.

## What's banned

### `!important`

The legitimate uses of `!important` inside handfish are a few narrow, deliberate cases: the three declarations in the `prefers-reduced-motion` block of `index.css` (forcing `animation-duration`, `animation-iteration-count`, and `transition-duration` to ~0 when the user prefers reduced motion), the `[hidden]` visibility guards on `<menu-bar>` and `<seance-dialog>` (so an app `display` rule at any specificity can't resurrect a menu/dialog the component's JS has hidden), and `<code-editor>`'s reset of its native `<textarea>`'s `border` / `outline` / `box-shadow`. Each is a place where the component must win unconditionally. Don't add new `!important` rules in app CSS that targets handfish components. If your override isn't winning, it's because the selector isn't specific enough. `!important`:

- Makes the next person's override impossible (you have to outscore `!important` with another `!important`, which becomes a never-ending arms race).
- Hides selector specificity bugs that would be obvious otherwise.
- Spreads — once one `!important` is in the codebase, more follow because they're "needed" to override it.

When tempted to use `!important`, instead:

1. Look at the rule you're trying to override. Note its specificity.
2. Write a more specific selector. Adding a parent class is usually enough.
3. If it's already maximally specific (like `body.app toggle-switch[checked] .ts-track:focus-visible`), the right move is to override at the *token* layer instead. The component's own selector is locked because the component author optimized it; the token is the seam designed for customization.

### Shadow DOM workarounds

Don't wrap handfish components in shadow roots. Don't reach for `::part()` (the handfish components don't define parts because they don't need to). Don't try to use `:host()` selectors on them.

If you find yourself wanting to "encapsulate" a handfish component to prevent style leakage, the fix is the opposite: make your selectors more specific so they don't accidentally apply to handfish elements you didn't mean to touch. `.my-section button` is greedy and will hit handfish's internal buttons. `.my-section > button` (direct child) or `.my-section .my-action-row > button` is safer.

### Inline styles for static values

Inline styles outrank stylesheet rules and they're invisible to theming. Don't write:

```html
<div style="color: #a5b8ff; padding: 16px; border: 1px solid #2a3450;">
```

Write:

```html
<div class="my-card">
```

```css
.my-card {
    color: var(--hf-accent);
    padding: var(--hf-space-4);
    border: var(--hf-border-width) solid var(--hf-border);
}
```

The exception is dynamic values that can only exist at runtime — a color the user picked, a width computed from drag input, a position calculated from container size. Those go inline because there's no stylesheet that could express them.

### Hardcoded colors / spacings / radii

`#a5b8ff`, `rgba(255, 255, 255, 0.08)`, `padding: 16px`, `border-radius: 8px` — none of these belong in handfish-aware code. Replace each with the corresponding `--hf-*` token. If no token fits, that's the cue to add one (see `tokens.md` → "Adding a new token") rather than inline.

The exception is values inside CSS that genuinely must be primitives — `0`, `100%`, `1fr`, `auto`. These are layout primitives, not design values, and they don't have token equivalents.

## Logical properties, not physical (RTL-readiness)

Handfish components live in the light DOM and inherit `dir` from `<html>`, so an app can go right-to-left with a single `dir="rtl"`. That only pays off if the CSS around them flips too. When you write app CSS or override component styles, reach for CSS **logical** properties instead of physical left/right ones — they resolve against text direction and flip for free in RTL:

| Physical (fixed) | Logical (flips with direction) |
|------------------|-------------------------------|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `left` / `right` (offsets) | `inset-inline-start` / `inset-inline-end` |
| `text-align: left` / `right` | `text-align: start` / `end` |

Handfish's own components (`<menu-bar>`, and the `start`/`end` alignment options on `<dropdown-menu>`) are already written this way. Two handfish utility classes cover the most common override — a divider border that flips:

```css
.hf-border-inline-start { border-inline-start: var(--hf-border-width) solid var(--hf-border); }
.hf-border-inline-end   { border-inline-end:   var(--hf-border-width) solid var(--hf-border); }
```

Physical properties aren't banned — sometimes you genuinely mean "the left edge regardless of direction" (a fixed hardware layout, a diagram). But default to logical; reach for physical only when the position is intentionally direction-independent. See `references/i18n.md` for the full bidi story, including isolating dynamic user-supplied strings with `<bdi>`.

## Verifying styling work

After making a styling change, before committing:

1. **Switch themes.** Rotate `data-theme` through at least three (e.g., `dark`, `cyberpunk`, `neutral-light`). The changes should look right in all of them. If they look right in only one, find the hardcoded value.
2. **Inspect specificity in DevTools.** Open the styled element. The rule you wrote should be in Computed → with no `!important` lighting it up. The rule's selector should outscore any handfish rule it's beating.
3. **Hover, focus, click, disable.** Component states have their own styles. Make sure your override doesn't drop the hover ring or the focus outline. Tab to the element and confirm the focus ring still appears.
4. **No new `!important`.** `git diff` and `grep` for `!important`. There should be none.
5. **No new hardcoded colors.** `git diff` and `grep` for hex codes (`#[0-9a-f]\{3,8\}`), `rgb(`, `rgba(`, `oklch(`, `hsl(`. Each hit either has a justification (genuinely dynamic) or needs to become a `var(--hf-*)`.

## Common debugging scenarios

**"My color isn't applying."** Open DevTools, inspect the element, look at Computed → the property in question. The "Computed" tab shows which rule won and where each rule lives. If the wrong rule is winning, it's almost always specificity. If the right rule is winning but the *value* is wrong, it's almost always a token resolving to something unexpected (often because of theme).

**"It's right in dark mode and wrong in light mode."** A hardcoded value somewhere on the path. `grep` your component for hex codes; trace each one to a token.

**"The component looks broken — text is unstyled, controls have no bg."** The handfish CSS isn't loading. Check the `<link rel="stylesheet" href=".../styles/index.css">` is present and the URL is reachable. Check the browser console for 404s.

**"The component renders as text, not as a styled control."** The custom element isn't registered. Check that the corresponding class is imported (`import { ToggleSwitch } from 'handfish'`) somewhere on the page. The import is what registers the element.

**"My override works, but only for new instances."** You're using a selector that targets a class set after construction. Check the component's source for when that class is added; you may need to listen for an event or use an attribute selector instead.
