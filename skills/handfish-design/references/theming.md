# Theming

Handfish ships 17 theme stylesheets covering 20 distinct `data-theme` values (some files declare both a dark and a light variant), plus the two default modes that apply when no `data-theme` is set. The whole system is built so that switching themes is a single attribute change on `<html>` and every styled element responds — *if* the styles followed the token discipline.

## How themes work

Themes are CSS files that redefine the primitive token layer (`--hf-color-1` through `--hf-color-7`, `--hf-accent-1` through `--hf-accent-4`, the four semantic colors) under a `[data-theme="<name>"]` selector. The semantic aliases (`--hf-bg-base`, `--hf-text-normal`, etc.) re-resolve automatically because they reference the primitives.

This means a theme file is small — usually just the ~14 primitive colors and maybe a few overrides for shadows, blurs, or radii if the theme has a distinctive personality (e.g., `brutalist` zeroes out radii, `cyberpunk` cranks up the glow).

The flow:

1. Page loads `index.css` → primitive defaults are set under `:root`
2. Page loads `themes/cyberpunk.css` → primitives are set under `[data-theme="cyberpunk"]`, idle until activated
3. JS sets `document.documentElement.dataset.theme = 'cyberpunk'` → the cascade switches, every `var(--hf-*)` resolves to the new value, and the page re-skins

Critically, app code does not need to participate in this. App stylesheets that use `var(--hf-*)` are themed for free. App stylesheets that hardcode hex values are not.

## The theme catalog

20 named `data-theme` values across 17 stylesheet files, plus the two defaults:

| Name | `data-theme` value | Personality |
|------|---------------------|-------------|
| Default Dark | `dark` (or omit attribute) | Soft purple-leaning blue, muted accents |
| Default Light | `light` (or `prefers-color-scheme: light` w/ no attribute) | Warm beige neutrals, deep accents |
| Brutalist | `brutalist` | Stark high-contrast, sharp corners |
| Corporate | `corporate` | Restrained blue/gray, professional |
| Cyberpunk | `cyberpunk` | Electric cyan/magenta, near-black, glowing accents |
| Dusk | `dusk` | Warm sunset oranges and purples |
| Earthy | `earthy` | Warm browns, greens, muted naturals |
| Gothic | `gothic` | Deep blacks and crimsons, ornate feel |
| Gray Dark | `gray-dark` | Mid-gray neutrals, low chroma |
| Gray Light | `gray-light` | Light mid-grays |
| High Contrast Dark | `high-contrast-dark` | Maximum legibility, accessibility-first |
| High Contrast Light | `high-contrast-light` | Maximum legibility, light variant |
| Kawaii | `kawaii` | Pastel pinks and lavenders, soft and friendly |
| Neutral Dark | `neutral-dark` | Pure grays, zero chroma — for design tools |
| Neutral Light | `neutral-light` | Pure light grays, zero chroma |
| Newspaper | `newspaper` | Off-white background, ink-black text, serif feel |
| Ocean | `ocean` | Deep teal and aqua, calming |
| Organic | `organic` | Sage greens and warm taupes |
| Rave | `rave` | Saturated electric pinks/purples, party energy |
| Sunset | `sunset` | Warm oranges and reds |
| Synthwave | `synthwave` | 80s neon — magenta, cyan, dark purple |
| Terminal | `terminal` | Phosphor green on near-black, monospace feel |

The "default dark" and "default light" themes are special: they live in `tokens.css` and apply when no `data-theme` is set (with light kicking in via `prefers-color-scheme: light`). All other themes are opt-in via the attribute.

A few themes ship paired dark/light variants (`gray-*`, `neutral-*`, `high-contrast-*`). Treat them as separate themes — they're not auto-paired.

## Loading themes

Each theme is a separate stylesheet under `/0/styles/themes/<name>.css`. Apps that want a single fixed theme load just that one. Apps with a runtime theme switcher load every theme they want users to be able to pick:

```html
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/index.css">
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/themes/cyberpunk.css">
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/themes/corporate.css">
<link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/themes/terminal.css">
<!-- ... etc -->
```

Loaded theme stylesheets that aren't currently active are dormant — their selectors don't match anything until `data-theme` activates them. There's no perf cost to loading more themes than are active beyond the initial download (which is small — each theme file is a few hundred bytes of CSS).

## Switching themes at runtime

```js
document.documentElement.dataset.theme = 'cyberpunk'
```

That's it. The browser re-resolves all `var(--hf-*)` references on the next paint. No JS to touch styled elements, no class swap, no full reload.

Persist the user's choice (localStorage is conventional) and reapply on page load to avoid a flash of the default theme:

```js
// Save when the user picks a theme
function setTheme(name) {
    document.documentElement.dataset.theme = name
    localStorage.setItem('handfish-theme', name)
}

// Restore on load — do this in <head>, before the body renders, to avoid FOUC
const saved = localStorage.getItem('handfish-theme')
if (saved) document.documentElement.dataset.theme = saved
```

The restore script must run synchronously in `<head>`, before any styled content paints. Putting it at the bottom of `<body>` will produce a one-frame flash of the default theme.

## Building a theme switcher

The `<dropdown-menu>` component is the standard pattern. Wire its `change` event to the swap:

```html
<dropdown-menu id="themeSwitcher" label="theme" icon="palette" small>
    <dropdown-item value="dark">Default Dark</dropdown-item>
    <dropdown-item value="light">Default Light</dropdown-item>
    <dropdown-item value="cyberpunk">Cyberpunk</dropdown-item>
    <dropdown-item value="corporate">Corporate</dropdown-item>
    <!-- ... -->
</dropdown-menu>
```

```js
const switcher = document.getElementById('themeSwitcher')
switcher.addEventListener('change', (e) => {
    const theme = e.detail.value
    document.documentElement.dataset.theme = theme
    switcher.setAttribute('label', theme)
    localStorage.setItem('handfish-theme', theme)
})
```

This is the exact pattern used in `examples/index.html` in the handfish repo — copy it for any app that wants the same UX.

## Building a custom theme

A custom theme is a stylesheet that defines the primitive tokens under `[data-theme="<your-name>"]`. The minimum looks like:

```css
[data-theme="my-theme"] {
    /* Neutrals — pick a hue (0-360°) and a lightness scale */
    --hf-color-1: oklch(13% 0.01 300);  /* darkest */
    --hf-color-2: oklch(20% 0.02 300);
    --hf-color-3: oklch(28% 0.04 300);
    --hf-color-4: oklch(35% 0.05 300);
    --hf-color-5: oklch(70% 0.04 300);
    --hf-color-6: oklch(85% 0.03 300);
    --hf-color-7: oklch(98% 0.01 300);  /* lightest */

    /* Accents — same hue or a contrasting one, higher chroma */
    --hf-accent-1: oklch(22% 0.04 300);
    --hf-accent-2: oklch(30% 0.06 300);
    --hf-accent-3: oklch(78% 0.12 300);
    --hf-accent-4: oklch(92% 0.04 300);

    /* Semantic colors — re-tune if the theme has different success/error vibes */
    --hf-red: oklch(69% 0.20 18);
    --hf-green: oklch(79% 0.20 145);
    --hf-yellow: oklch(89% 0.13 89);
    --hf-blue: oklch(61% 0.15 260);
}
```

Some patterns from the built-in themes:

- **Single-hue themes** (default dark, cyberpunk, ocean) use one hue across all neutrals and accents. The chroma typically tapers at the lightness extremes (`0.010` at `13%` and `98%`, peaking around `0.056` at `31.8%`) — this prevents the darkest/lightest tones from looking artificially tinted.
- **Two-hue themes** (sunset, dusk) use one hue for neutrals and a contrasting one for accents.
- **Zero-chroma themes** (neutral, gray) set all chroma values to 0 — pure grayscale.
- **Brutalist** also overrides `--hf-radius*` to `0` and softens `--hf-shadow*` for the sharp aesthetic.
- **Cyberpunk** boosts `--hf-glow-accent` for the neon look.

Once the theme file is in place, load it like any other:

```html
<link rel="stylesheet" href="/path/to/themes/my-theme.css">
```

Then activate: `document.documentElement.dataset.theme = 'my-theme'`. No code changes needed in components.

## Debugging "this looks wrong in theme X"

When something visually breaks under a specific theme, the cause is almost always one of:

1. **A hardcoded color/value somewhere.** Open DevTools → Elements → inspect the broken element → look at Computed styles. Anything that's a literal value (not `var(--hf-*)`) is a candidate. Trace it back to its stylesheet and replace with a token.
2. **A token that doesn't redefine in this theme.** A handful of secondary tokens (e.g., `--hf-titlebar-bg`) are set in the default `:root` but not redefined per theme — they look fine in default dark and may look off-brand under another theme that doesn't override them. If a broken element references one, either add a per-theme override or replace it with a token (like `--hf-bg-elevated`) that every theme already redefines via the primitive layer.
3. **A `prefers-color-scheme` mismatch.** The default `light` mode kicks in via media query. If `data-theme="dark"` is set but the OS is in light mode, both apply — the explicit `data-theme` wins because it's later in the cascade, but if a custom rule has `@media (prefers-color-scheme: light)`, it can fight. Prefer `[data-theme="..."]` selectors over media queries for conditional styling.
4. **Stylesheet load order.** If a theme stylesheet loads before `index.css`, its overrides are clobbered by the defaults. Theme stylesheets must come after `index.css`.

## Anti-patterns

- **Building app-specific theming on top of `[data-theme]`.** If you need a per-page or per-section variation, scope it to a class (`<section class="hero">`) and override tokens there. Don't add new `data-theme` values for non-theme purposes.
- **Switching themes by reloading the page.** Themes are designed to switch live — a reload is unnecessary and feels broken to users.
- **Hardcoding the default-dark colors as fallbacks "just in case the theme doesn't load."** If `index.css` doesn't load, theming is the least of the page's problems. Don't pollute the codebase with literals.
