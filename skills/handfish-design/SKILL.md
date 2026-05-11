---
name: handfish-design
description: Use whenever building, modifying, debugging, or styling a web application that uses the Handfish Design System (handfish.noisefactor.io) — the Web Components and OKLCH design-token library that powers Noisedeck, Tetra, and the Noise Factor product family. Triggers on imports from `handfish` or `@noisedeck/handfish`, references to `--hf-*` CSS variables, use of any handfish custom element (toggle-switch, slider-value, select-dropdown, dropdown-menu, dropdown-item, color-picker, color-wheel, color-swatch, gradient-stops, vector2d-picker, vector3d-picker, code-editor, image-magnifier, justify-button-group), the AboutDialog class, the toast helper functions (showToast, showSuccess, showError, showWarning, showInfo), tooltip initialization (initializeTooltips, the `.tooltip` class plus `data-title` attribute), the escape handler (registerEscapeable / initEscapeHandler), color-conversion utilities (parseHex, rgbToHex, rgbToHsv, rgbToOklch, oklchToRgb, etc.), theme switching via `data-theme`, OKLCH color math, or any frontend work in a Noisemaker-based app (Noisedeck, Tetra, Foundry, Polymorphic, Layers, Shade, Blaster, ShuffleSet, Sleeve, Remap, Handfish itself). Also use when overriding component styles, building a custom theme, integrating a handfish form into a `<form>`, or adding a new component to the handfish library. If a stylesheet references `--hf-`, if HTML contains a hyphenated custom element from the catalog above, or if a JS module imports from `handfish` — this skill applies.
user-invocable: false
---

# Handfish Design System

Handfish is a Web Components + design-token library served from `handfish.noisefactor.io`. It is the shared UI layer for every Noise Factor product (Noisedeck, Tetra, Foundry, Polymorphic, Layers, Shade, Blaster, ShuffleSet, Sleeve, Remap). When you are working in any of those apps — or in handfish itself — you are working with handfish, and the conventions in this skill apply.

The library has three load-bearing design choices. Internalize them; most mistakes come from forgetting one:

1. **No build step.** Source is vanilla ES modules and CSS. Components are imported via importmap from a CDN. There is no bundler in front of consumers.
2. **Light DOM, not Shadow DOM.** Components inject a single `<style>` block into `document.head` and render into the page's regular DOM. They participate in the global cascade. This is intentional — apps can override styles by specificity without piercing a shadow boundary.
3. **All design values come from `--hf-*` CSS variables.** Colors, spacing, radii, shadows, typography, transitions — all of it. Themes work by re-defining these variables under a `[data-theme="<name>"]` selector. The moment you hardcode a color or a spacing value, you've broken theme support for whatever you just wrote.

## Hard rules

These exist because each one corresponds to a class of bug that someone has already shipped:

- **Use `--hf-*` tokens for every color, spacing, radius, shadow, font, and transition.** Hardcoded values break theme switching silently — they look fine in the theme you wrote them in and wrong in every other one. If a token doesn't exist for what you need, that's a signal to add a token, not to inline a hex.
- **No `!important` for color, layout, or spacing overrides.** Handfish styles live in the global cascade. If your override isn't winning, your selector isn't specific enough — fix the selector. `!important` makes the next person's override impossible and propagates. The only legitimate uses inside handfish are the three `!important` declarations in the `prefers-reduced-motion` block of `index.css` (`animation-duration`, `animation-iteration-count`, `transition-duration`) that force motion to ~0; don't add new ones.
- **No Shadow DOM workarounds.** Components are deliberately in the light DOM so they can be themed and overridden. Don't wrap them in shadow roots, don't use `::part()`, don't reach for `:host()`. Style them like any other element.
- **No inline `style=""` for static values.** Inline styles outrank stylesheets and they fight token-driven theming. The exception is dynamic values that come from user data — a color the user picked, a position from a drag handle, a width computed at runtime. Static layout, color, spacing — always in CSS.
- **Components in HTML use the registered tag name, not the class name.** `<toggle-switch>`, not `<ToggleSwitch>`. The class is for `import` statements and instanceof checks.
- **Event semantics matter.** `input` fires continuously during a gesture (drag, type, slide). `change` fires once when the gesture commits. Wire the right one — using `change` for live preview produces a stutter; using `input` for save produces hundreds of writes.
- **Public API lives in `src/index.js`.** When you add or rename a component or utility in handfish itself, the export there is what consumers see. Forgetting it means CDN consumers can't import it even though the file exists.
- **The CDN is `handfish.noisefactor.io`.** Not unpkg, not jsDelivr, not a local copy bundled into each app. Three pinning levels exist (`/0`, `/0.10`, `/0.10.1`) — see `references/setup.md` for which to pick.

## Quick start (for a brand-new app)

The minimum viable handfish setup is two `<link>` tags and an importmap. This goes in the `<head>`:

```html
<!-- Tokens, base styles, forms, dialogs, menus, tags -->
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/index.css">

<!-- Optional: pick a theme other than the default dark -->
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/themes/cyberpunk.css">

<script type="importmap">
{ "imports": { "handfish": "https://handfish.noisefactor.io/0/handfish.esm.min.js" } }
</script>
```

Then, in any module:

```js
import { ToggleSwitch, SliderValue, ColorPicker, initializeTooltips } from 'handfish'

initializeTooltips()  // once per page; tooltips appear on elements with class="tooltip" + data-title
```

To switch themes at runtime, set `data-theme` on `<html>`:

```js
document.documentElement.dataset.theme = 'cyberpunk'  // or 'neutral-dark', 'corporate', etc.
```

For anything beyond this — pinning policy, font preloading, FOUC prevention, custom themes — load the relevant reference below.

## Decision tree: which reference to load

Before doing the work, load the reference that matches what you're doing. They contain the details and traps that didn't fit here.

| If you're doing this... | Load |
|--------------------------|------|
| Setting up handfish in a new app, picking a CDN pin level, preloading fonts, importing the right stylesheets | `references/setup.md` |
| Reaching for a color, spacing, radius, shadow, font, or any other design value | `references/tokens.md` |
| Switching themes, building a custom theme, supporting both dark and light, or debugging a theme that "looks wrong" | `references/theming.md` |
| Using a handfish component (which tag, which attributes, which events, how to read the value, form integration) | `references/components.md` |
| **Need the authoritative attribute list / event detail / form-association status for any component** — when prose seems wrong or out of date | `references/api-canonical.md` (machine-generated from handfish source, wins ties) |
| Overriding the appearance of a handfish component, fighting a specificity battle, or wondering why your CSS isn't taking effect | `references/styling.md` |
| Converting between RGB / HSV / OkLab / OKLCH / hex, picking a contrasting color, or doing any color math | `references/color.md` |
| Showing a toast, hooking up the escape key for a custom modal, or initializing tooltips | `references/utilities.md` |
| Adding a new component to the handfish library itself, or porting one in from Tetra / Noisedeck (e.g. "remap `--color-*` to `--hf-color-*`", "drop the Shadow DOM wrapper") | `references/contributing.md` |

When `components.md` and `api-canonical.md` disagree, **`api-canonical.md` wins** — it's mechanically derived from the actual handfish source on every regeneration, so it cannot drift the way hand-written prose can. Use `components.md` for prose, examples, and gotchas; use `api-canonical.md` for the authoritative attribute name, event type, and event-detail-payload check.

If you don't know which applies, read `references/components.md` first — most consumer questions start there and it links out to the others.

## Working in an existing handfish app

When you join an app that already imports handfish, before touching styles or markup:

1. **Find the import surface.** `grep -r "from 'handfish'" src/` and `grep -r "handfish.noisefactor.io" .` together show every entry point. Note which pin level the app is on (`/0`, `/0.10`, `/0.10.1`) — that determines what API surface is available.
2. **Find the active theme.** Look for `data-theme` on `<html>` (in HTML, in JS that sets it, or in a settings store). The theme determines what every `--hf-*` variable resolves to. If you're debugging a "wrong color" issue, the theme is the first thing to check.
3. **Find any local token overrides.** Search the app for `--hf-` outside of `node_modules` and the handfish CDN. Apps occasionally override a token in their own stylesheet — this is legitimate, but it means the value you see in DevTools may not match the handfish default.
4. **Confirm the cascade.** Open the page, inspect a handfish element, and verify that the styles you expect are coming from the handfish injected `<style>` block (look for IDs like `hf-toggle-switch-styles`). If app CSS is shadowing handfish CSS, that may be intentional — or it may be a bug to fix.

This 30-second orientation prevents the most common debugging dead-end: editing handfish source when the actual problem is a local override or a stale theme.

## Pre-flight before any visual change

Before you commit a change that affects what users see:

- **Theme sweep.** Switch through at least two themes (e.g., the default dark, plus `corporate` or `cyberpunk` for high contrast difference). If anything you changed only looks right in one theme, you've hardcoded a value somewhere.
- **No new hardcoded colors.** `grep` your diff for hex codes (`#[0-9a-f]\{3,8\}`), `rgb(`, `rgba(`, `oklch(`, and `hsl(`. Each hit needs a justification — usually it should become a `--hf-*` reference.
- **No new `!important`.** `grep` your diff for `!important`. Each hit is a smell. There are no legitimate uses inside handfish or its consumers; if you find one, the right fix is selector specificity.
- **Component imports include everything used.** Every custom element you reference in HTML must have its class imported somewhere on the page — otherwise the tag renders as an unknown element with no behavior. Import from `'handfish'`; rely on the side effect of the file registering its custom element.
- **Visual regression baselines updated** (handfish itself only). If you're modifying handfish source, run `npm test` from the handfish repo. If the diff is intentional, run `npm run test:update` and commit the new snapshots alongside the code.

## Verification before declaring done

A handfish change is done when all of the following are true. If any are false, keep going:

- [ ] **It works in at least two themes.** Switch `data-theme` and verify the change still looks right.
- [ ] **No hardcoded colors / spacings / radii / shadows / fonts in the diff.** Everything is `var(--hf-*)`.
- [ ] **No `!important` in the diff.**
- [ ] **No inline `style=""` for static values in the diff.**
- [ ] **Tab-order and focus rings still work.** Handfish components support keyboard focus; an override that strips `:focus-visible` styling breaks accessibility.
- [ ] **Form components still associate with their parent `<form>`** (if applicable). `attachInternals()`-based components participate in `FormData` and validation — verify the form still serializes and submits correctly.
- [ ] **For handfish source changes:** the export is in `src/index.js`, the demo is in `examples/index.html`, the visual regression baseline is updated, and `node --check` on every modified `.js` file passes.

## Anti-patterns to refuse

If a request explicitly asks for one of these, push back with the alternative — don't just comply:

- **"Add `!important` to make this override work."** → Increase selector specificity. If you can't, the component's own selector is probably already maximally specific; in that case the right fix is to override at the `--hf-*` token level (e.g., redefine `--hf-accent-3` for the scope you want).
- **"Wrap this in a Shadow DOM so styles don't leak."** → Handfish styles don't leak in a way that's a problem; the global cascade is the contract. If a specific selector is too greedy, narrow it. Shadow DOM defeats the entire theming model.
- **"Just hardcode `#a5b8ff` for the accent here."** → Use `var(--hf-accent-3)` (or whichever semantic alias is appropriate). If no semantic alias fits, propose a new one in `tokens.css` rather than inlining.
- **"Copy this Tetra component into our app and rename `--color-*` to whatever."** → If it belongs in handfish, port it to handfish (see `references/contributing.md`). If it's app-specific, build it in the app but use `--hf-*` tokens for every value.
- **"Bundle handfish locally so we don't depend on the CDN."** → The CDN with version pinning is the supported deployment model. Bundling fragments the design system across apps and defeats the central-update story. If CDN reliability is the concern, the answer is monitoring/caching at the edge, not duplication.
