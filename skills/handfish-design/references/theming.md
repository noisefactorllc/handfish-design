# Theming

Handfish ships 17 theme stylesheets with 20 `data-theme` values. Some files define both dark and light variants. Two default modes apply without `data-theme`. Changing that attribute on `<html>` updates every styled element that uses the design tokens.

## How themes work

Themes are CSS files that redefine the primitive token layer (`--hf-color-1` through `--hf-color-7`, `--hf-accent-1` through `--hf-accent-4`, the four semantic colors) under a `[data-theme="<name>"]` selector. The semantic aliases (`--hf-bg-base`, `--hf-text-normal`, etc.) re-resolve automatically because they reference the primitives.

A theme file usually defines about 14 primitive colors. It may also override shadows, blurs, or radii. For example, `brutalist` removes radii and `cyberpunk` increases glow.

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

Default dark and light modes live in `tokens.css`. They apply without `data-theme`, with light mode controlled by `prefers-color-scheme: light`. Other themes require their attribute value.

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

Inactive theme selectors do not match until `data-theme` activates them. Loading extra themes adds only the initial download cost. Each file contains a few hundred bytes of CSS.

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

- **Single-hue themes** (default dark, cyberpunk, ocean) use one hue for neutrals and accents. Chroma typically decreases at lightness extremes. It is `0.010` at `13%` and `98%`, and peaks near `0.056` at `31.8%`. This avoids artificial tinting of the darkest and lightest tones.
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
2. **A token without a theme override.** Some secondary tokens, such as `--hf-titlebar-bg`, exist only in the default `:root`. They may look inconsistent in another theme. For an affected element, add a theme override or use a token that every theme redefines. `--hf-bg-elevated` is one such token, through the primitive layer.
3. **A `prefers-color-scheme` mismatch.** A media query activates default light mode. With `data-theme="dark"` and a light OS theme, both apply. The explicit attribute wins because it appears later in the cascade. A custom `@media (prefers-color-scheme: light)` rule can conflict. Prefer `[data-theme="..."]` selectors for conditional styles.
4. **Stylesheet load order.** If a theme stylesheet loads before `index.css`, its overrides are clobbered by the defaults. Theme stylesheets must come after `index.css`.

## Anti-patterns

- **Building app-specific theming on `[data-theme]`.** For page or section variations, scope token overrides to a class such as `<section class="hero">`. Do not add `data-theme` values for other purposes.
- **Switching themes by reloading the page.** Themes are designed to switch live — a reload is unnecessary and feels broken to users.
- **Hardcoding default-dark fallback colors.** If `index.css` fails to load, the page has problems beyond theming. Do not add literals for this case.
- **Conflating color, typeface, and direction.** These use three independent root attributes. Do not add a `data-theme` value to change the font or direction.

## Three orthogonal axes: theme, language, direction

Handfish separates three concerns onto three independent attributes on `<html>` — set them in any combination:

| Attribute | Controls | Values |
|-----------|----------|--------|
| `data-theme` | The **color** palette (the `--hf-*` primitive layer) | `dark`, `cyberpunk`, `neutral-light`, … (this file's catalog) |
| `data-language` | The **typeface** "design language" | *(unset)* = default Nunito. `industrial` = Atkinson Hyperlegible (requires `industrial.css`) |
| `dir` | Text **direction** (bidi) | `ltr` (default), `rtl` |

For example, `<html data-theme="neutral-dark" data-language="industrial" dir="rtl">` is a valid, fully-supported combination: neutral-dark colors, the industrial instrument typeface, laid out right-to-left. Each axis is orthogonal — changing one never forces a change in another. The industrial typeface layer is covered in `setup.md`. Direction/bidi in `i18n.md`.
