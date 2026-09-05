---
name: handfish-design
description: Use this skill when building, modifying, debugging, or styling an application that uses the Handfish Design System (handfish.noisefactor.io). Handfish provides Web Components and OKLCH design tokens for Noisedeck, Tetra, and the Noise Factor product family. Use it for imports from `handfish` or `@noisedeck/handfish`, or references to `--hf-*` CSS variables. Use it for any handfish custom element. The catalog includes toggle-switch, slider-value, select-dropdown, dropdown-menu, dropdown-item, color-picker, color-wheel, color-swatch, gradient-stops, vector2d-picker, and vector3d-picker. It also includes code-editor, image-magnifier, justify-button-group, knob-dial, led-matrix, tempo-bar, menu-bar, seance-dialog, session-status, and join-session-dialog. Other triggers include AboutDialog and toast helpers (showToast, showSuccess, showError, showWarning, showInfo). Also use it for tooltip initialization (initializeTooltips, `.tooltip` plus `data-title`) and escape handling (registerEscapeable / initEscapeHandler). Use it for keyboard-shortcut helpers (formatShortcut, isMacPlatform) or color-conversion utilities (parseHex, rgbToHex, rgbToHsv, rgbToOklch, oklchToRgb, etc.). Theme switching through `data-theme`, the industrial typeface through `data-language`, and OKLCH math also trigger this skill. Use it for frontend work in Noisemaker-based apps. These include Noisedeck, Tetra, Foundry, Polymorphic, Layers, Shade, Blaster, ShuffleSet, Sleeve, Remap, and Handfish itself. Use it when overriding component styles or building custom themes. Use it for right-to-left (RTL) or bidi interfaces, setting `dir`, and localizing built-in component strings. Use it when integrating handfish with a `<form>` or adding a library component. Any stylesheet reference to `--hf-`, catalog custom element in HTML, or JS import from `handfish` requires this skill.
user-invocable: false
---

# Handfish Design System

Handfish is a Web Components and design-token library at `handfish.noisefactor.io`. It provides the shared UI layer for every Noise Factor product: Noisedeck, Tetra, Foundry, Polymorphic, Layers, Shade, Blaster, ShuffleSet, Sleeve, and Remap. These conventions apply when working in those apps or in handfish itself.

The library has three central design choices. Apply all three:

1. **No build step.** Source is vanilla ES modules and CSS. Components are imported via importmap from a CDN. There is no bundler in front of consumers.
2. **Light DOM, not Shadow DOM.** Components inject a single `<style>` block into `document.head` and render into the page's regular DOM. They participate in the global cascade. This is intentional — apps can override styles by specificity without piercing a shadow boundary.
3. **All design values come from `--hf-*` CSS variables.** Colors, spacing, radii, shadows, typography, transitions — all of it. Themes work by re-defining these variables under a `[data-theme="<name>"]` selector. The moment you hardcode a color or a spacing value, you've broken theme support for whatever you just wrote.

## Hard rules

These exist because each one corresponds to a class of bug that someone has already shipped:

- **Use `--hf-*` tokens for every color, spacing, radius, shadow, font, and transition.** Hardcoded values look correct in the original theme and wrong in others. If the required token does not exist, add one.
- **No `!important` for color, layout, or spacing overrides.** Handfish uses the global cascade. If an override loses, increase selector specificity. `!important` prevents later overrides and encourages more `!important` rules. Handfish permits a few internal exceptions: reduced-motion rules in `index.css`, `[hidden]` guards on `<menu-bar>` and `<seance-dialog>`, and `<code-editor>` textarea border/outline resets. The visibility guards prevent app styles from revealing menus or dialogs that JS hides. Do not add new `!important` rules in app CSS.
- **No Shadow DOM workarounds.** Components are deliberately in the light DOM so they can be themed and overridden. Don't wrap them in shadow roots, don't use `::part()`, don't reach for `:host()`. Style them like any other element.
- **No inline `style=""` for static values.** Inline styles outrank stylesheets and interfere with token-based themes. Dynamic user data is an exception, including a selected color, drag position, or width calculated at runtime. Put static layout, color, and spacing in CSS.
- **Components in HTML use the registered tag name, not the class name.** `<toggle-switch>`, not `<ToggleSwitch>`. The class is for `import` statements and instanceof checks.
- **Event semantics matter.** `input` fires continuously during a gesture such as dragging, typing, or sliding. `change` fires once when the gesture commits. Choose the event for the action. Using `change` for live preview causes stutter. Using `input` for saving causes hundreds of writes.
- **Public API lives in `src/index.js`.** When you add or rename a component or utility in handfish itself, the export there is what consumers see. Forgetting it means CDN consumers can't import it even though the file exists.
- **The CDN is `handfish.noisefactor.io`.** Not unpkg, not jsDelivr, not a local copy bundled into each app. Three pinning levels exist (`/0`, `/0.10`, `/0.10.1`) — see `references/setup.md` for which to pick.
- **Check the catalog before creating or substituting a component.** Handfish ships **21** custom elements, and the catalog grows. Consult `references/api-canonical.md` before creating a control, substituting another element, or claiming that a component does not exist. Existing controls include `knob-dial`, `tempo-bar`, `menu-bar`, `seance-dialog`, `session-status`, `join-session-dialog`, and `led-matrix`. Recreating them fragments the design system and omits their accessibility and theme support. Check the authoritative list even if you do not remember the component.
- **Do not hardcode user-facing strings or physical left/right CSS in a localizable / RTL app.** Use built-in string overrides. These include `placeholder`/`empty-text`/`dialog-title` for `<select-dropdown>` and `left/center/right-label` for `<justify-button-group>`. Collaboration dialogs use `*-label`, `AboutDialog` uses `labels`, and toasts use `dismissLabel`. For layout, use logical CSS such as `margin-inline`, `inset-inline`, `text-align: start`, and `align`=`start`/`end`. The UI then reverses when the app sets `dir="rtl"` on `<html>`. Handfish provides bidi support. The app provides translation. See `references/i18n.md`.

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
| Authoritative attributes, event details, or form-association status when prose seems incorrect or outdated | `references/api-canonical.md` (generated from handfish source, takes precedence) |
| Overriding the appearance of a handfish component, fighting a specificity battle, or wondering why your CSS isn't taking effect | `references/styling.md` |
| RTL / bidi interfaces, `dir`, translated component strings, or layout that follows text direction | `references/i18n.md` |
| Converting between RGB / HSV / OkLab / OKLCH / hex, picking a contrasting color, or doing any color math | `references/color.md` |
| Showing a toast, hooking up the escape key for a custom modal, or initializing tooltips | `references/utilities.md` |
| Adding a new component to the handfish library itself, or porting one in from Tetra / Noisedeck (e.g. "remap `--color-*` to `--hf-color-*`", "drop the Shadow DOM wrapper") | `references/contributing.md` |

When `components.md` and `api-canonical.md` disagree, **`api-canonical.md` takes precedence**. Each regeneration derives it from handfish source, avoiding drift in hand-written prose. Use `components.md` for explanations, examples, and common mistakes. Use `api-canonical.md` to check attribute names, event types, and event detail payloads.

If you don't know which applies, read `references/components.md` first — most consumer questions start there and it links out to the others.

## Working in an existing handfish app

When you join an app that already imports handfish, before touching styles or markup:

1. **Find the import surface.** `grep -r "from 'handfish'" src/` and `grep -r "handfish.noisefactor.io" .` together show every entry point. Note which pin level the app is on (`/0`, `/0.10`, `/0.10.1`) — that determines what API surface is available.
2. **Find the active theme.** Look for `data-theme` on `<html>` (in HTML, in JS that sets it, or in a settings store). The theme determines what every `--hf-*` variable resolves to. If you're debugging a "wrong color" issue, the theme is the first thing to check.
3. **Find local token overrides.** Search the app for `--hf-` outside `node_modules` and the handfish CDN. Apps can legitimately override tokens in their stylesheets. DevTools values may therefore differ from handfish defaults.
4. **Check the cascade.** Open the page. Inspect a handfish element. Check whether the expected styles come from its injected `<style>` block, such as `hf-toggle-switch-styles`. App CSS that overrides handfish may be intentional or a bug.

This 30-second orientation prevents the most common debugging dead-end: editing handfish source when the actual problem is a local override or a stale theme.

## Pre-flight before any visual change

Before you commit a change that affects what users see:

- **Theme sweep.** Switch through at least two themes (e.g., the default dark, plus `corporate` or `cyberpunk` for high contrast difference). If anything you changed only looks right in one theme, you've hardcoded a value somewhere.
- **No new hardcoded colors.** `grep` your diff for hex codes (`#[0-9a-f]\{3,8\}`), `rgb(`, `rgba(`, `oklch(`, and `hsl(`. Each hit needs a justification — usually it should become a `--hf-*` reference.
- **No new `!important`.** Search the diff for `!important` with `grep`. Do not add it in app CSS. The hard rules list handfish's internal exceptions. Fix selector specificity instead.
- **Component imports include everything used.** Import the class for each custom element in the page's HTML. Otherwise, the tag has no behavior. Import from `'handfish'`. Loading the file registers the custom element.
- **Visual regression baselines updated** (handfish itself only). If you're modifying handfish source, run `npm test` from the handfish repo. If the diff is intentional, run `npm run test:update` and commit the new snapshots alongside the code.

## Verification before declaring done

A handfish change is done when all of the following are true. If any are false, keep going:

- [ ] **It works in at least two themes.** Switch `data-theme` and check the change still looks right.
- [ ] **No hardcoded colors / spacings / radii / shadows / fonts in the diff.** Everything is `var(--hf-*)`.
- [ ] **No `!important` in the diff.**
- [ ] **No inline `style=""` for static values in the diff.**
- [ ] **Tab-order and focus rings still work.** Handfish components support keyboard focus. An override that strips `:focus-visible` styling breaks accessibility.
- [ ] **Form components still associate with their parent `<form>`** (if applicable). `attachInternals()`-based components participate in `FormData` and validation — check the form still serializes and submits correctly.
- [ ] **If the app targets RTL or multiple locales:** Check rendering under `dir="rtl"`. Translate placeholders, alignment tooltips, dialog titles, toast dismiss text, and `AboutDialog` labels. Isolate dynamic values with `<bdi>`. See `references/i18n.md`.
- [ ] **For handfish source changes:** Add the export to `src/index.js`. Add the demo to `examples/index.html`. Update the visual regression baseline. Run `node --check` on every modified `.js` file. All checks must pass.

## Anti-patterns to refuse

If a request explicitly asks for one of these, push back with the alternative — don't just comply:

- **"Add `!important` to make this override work."** → Increase selector specificity. If that is impossible, the selector is probably already maximally specific. Override the relevant `--hf-*` token instead, such as `--hf-accent-3` within the intended scope.
- **"Wrap this in a Shadow DOM so styles don't leak."** → The global cascade is the contract. Narrow any selector that matches unintended elements. Shadow DOM prevents the supported theming model.
- **"Just hardcode `#a5b8ff` for the accent here."** → Use `var(--hf-accent-3)` (or whichever semantic alias is appropriate). If no semantic alias fits, propose a new one in `tokens.css` rather than inlining.
- **"Copy this Tetra component into our app and rename `--color-*` to whatever."** → If it belongs in handfish, port it to handfish (see `references/contributing.md`). If it's app-specific, build it in the app but use `--hf-*` tokens for every value.
- **"Bundle handfish locally so we don't depend on the CDN."** → The CDN with version pinning is the supported deployment model. Bundling fragments the design system across apps and defeats the central-update story. If CDN reliability is the concern, the answer is monitoring/caching at the edge, not duplication.
- **"Just build a knob / tempo bar / menu bar / session dialog — handfish doesn't have one."** → It very likely does. The catalog has 21 elements and grows. Check `references/api-canonical.md` first. `<knob-dial>`, `<tempo-bar>`, `<menu-bar>`, `<led-matrix>`, `<seance-dialog>`, `<session-status>`, and `<join-session-dialog>` already include keyboard, ARIA, and theme support.
- **"That built-in label is hardcoded English, so localization / RTL isn't possible here."** → Almost always false. The string is an override attribute (`placeholder`, `empty-text`, `dialog-title`, `*-label`, `AboutDialog`'s `labels`, the toast `dismissLabel`). Set `dir="rtl"` on `<html>`, override the strings, and use logical CSS so the layout flips. Handfish is bidi-ready. The app owns the translations. See `references/i18n.md`.
