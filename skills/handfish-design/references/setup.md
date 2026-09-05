# Setup

How to add Handfish to a brand-new web app, choose a CDN pin level, and avoid font-loading FOUC.

## CDN base

`https://handfish.noisefactor.io` serves all handfish assets. The recommended distribution is the CDN, which supplies ES modules over HTTPS. The npm package `@noisedeck/handfish` supports handfish development tools and apps that bundle source. Handfish declares it in `package.json`.

`scripts/bundle.js` builds `dist/handfish.esm.min.js` from `src/index.js`. The CDN contains this published bundle and stylesheets. Its file list does not mirror `src/`.

The bare specifier `'handfish'` (used in `import` statements throughout these docs) only resolves because of the importmap shown below. If your app pulls handfish from npm instead, the import name is `'@noisedeck/handfish'`.

Three URL prefixes (pin levels) are exposed. Pick the one that matches how much drift you tolerate:

| URL prefix | What it tracks | When to use |
|------------|----------------|-------------|
| `/0` | Latest within major version 0. Picks up every minor and patch automatically. Freezes if a `1.0` ever ships. | Default. Most apps. No code change needed for backward-compatible upgrades. |
| `/0.10` | Latest patch within `0.10.x`. Stays put even when `0.11` ships. | When you want patches but want to opt into minor upgrades explicitly. |
| `/0.10.1` | Exact, immutable. Contents never change once published. | Reproducible builds, frozen deployments, regression isolation. |

The same prefix applies to every asset:

```
https://handfish.noisefactor.io/0/handfish.esm.min.js
https://handfish.noisefactor.io/0/styles/index.css
https://handfish.noisefactor.io/0/styles/themes/cyberpunk.css
```

If the app needs the unbundled source for some reason (debugging, custom build), the same paths exist without `.min` and as individual files.

## Minimum viable setup

Three things are needed in `<head>`:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>

    <!-- 1. Base stylesheet (tokens, base styles, forms, dialogs, menus) -->
    <link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/index.css">

    <!-- 2. Importmap so `import x from 'handfish'` resolves to the CDN -->
    <script type="importmap">
    { "imports": { "handfish": "https://handfish.noisefactor.io/0/handfish.esm.min.js" } }
    </script>
</head>
<body>
    <!-- 3. Your modules -->
    <script type="module">
        import { ToggleSwitch, SliderValue, initializeTooltips } from 'handfish'
        initializeTooltips()
    </script>
</body>
</html>
```

Importing a class such as `ToggleSwitch` registers its custom element when the file loads. No further registration is necessary for `<toggle-switch>`.

## Stylesheet structure

`styles/index.css` is the recommended single import. It re-imports:

- `tokens.css` — every `--hf-*` variable plus light/dark mode + the Nunito, Noto Sans Mono, **and Material Symbols** `@font-face` declarations, and the `.hf-icon` base mapping
- `forms.css` — base form control styles
- `tags-and-tabs.css` — tag pill and tab styles
- `menus-and-toolbars.css` — menu, toolbar, and `.hf-icon-btn` styles (used by `<menu-bar>` and `<tempo-bar>`)
- `dialogs.css` — `<dialog>` and modal base styles

If the app only needs tokens (no base/utility styles), import `tokens.css` directly. This is rare — most apps want the utility classes (`.hf-flex`, `.hf-btn`, `.hf-text-bright`, etc.) that come with `index.css`.

`industrial.css` is **not** imported by `index.css` — it's a separate opt-in. It provides the "industrial" **typeface language** (Atkinson Hyperlegible, an instrument-panel alternative to the default Nunito), plus the `.hf-logotype` wordmark and `.hf-topbar` / `.hf-topbar-cluster` chrome. It's orthogonal to the color theme: activate it by setting `data-language="industrial"` on `<html>` and loading the stylesheet. Because it swaps a font, preload the Atkinson Hyperlegible "Blank" placeholder to avoid a flash of fallback text:

```html
<html data-theme="neutral-dark" data-language="industrial">
<head>
    <link rel="preload" as="font" type="font/woff2" crossorigin
          href="https://fonts.noisefactor.io/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Blank.woff2">
    <link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/index.css">
    <link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/industrial.css">
```

The industrial *components* (`<knob-dial>`, `<led-matrix>`, `<tempo-bar>`) do not require this stylesheet — they inject their own styles and work with `index.css` alone. `industrial.css` is only for the typeface + topbar chrome.

## Right-to-left (RTL) apps

Handfish components are bidi-ready: because they live in the light DOM, they inherit `dir` from `<html>`. To run the whole UI right-to-left, set `dir="rtl"` (and the appropriate `lang`) on the root element:

```html
<html lang="ar" dir="rtl" data-theme="dark">
```

That single attribute flips every handfish component that uses logical CSS. The app still owns translation and locale — handfish only provides bidi readiness and overridable built-in strings. See `references/i18n.md` for the full story.

## Selecting a theme at load time

The default is dark mode (with auto light-mode override under `prefers-color-scheme: light`). To pin a specific theme, set `data-theme` on `<html>` and load that theme's stylesheet:

```html
<html data-theme="cyberpunk">
<head>
    <link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/index.css">
    <link rel="stylesheet" href="https://handfish.noisefactor.io/0/styles/themes/cyberpunk.css">
```

Order matters: load `index.css` first (which sets the default tokens), then the theme stylesheet (which overrides them under `[data-theme="..."]`). See `theming.md` for the full theme catalog and runtime switching.

## Font preloading (recommended)

Handfish uses Nunito (UI) and Noto Sans Mono (mono). Both are loaded via `@font-face` from `fonts.noisefactor.io`. To prevent FOIT (flash of invisible text), add preload links in `<head>` above the stylesheet:

```html
<link rel="preload" href="https://fonts.noisefactor.io/fonts/nunito/Nunito-Blank.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="https://fonts.noisefactor.io/fonts/noto-sans-mono/NotoSansMono-Blank.woff2" as="font" type="font/woff2" crossorigin>
```

The `Blank` variants are tiny (~1KB) invisible metric placeholders — they reserve the right space for the real font without blocking render. The real fonts swap in when ready (`font-display: swap`).

Material Symbols icons need no preload. `.hf-icon`, `<dropdown-menu>` icons, and industrial components use them. Their `@font-face` and `.hf-icon` mapping live in `tokens.css`, which `index.css` imports first. They moved from `index.css` so CSS subsets that import `tokens.css` also receive icons.

If icons display names such as `touch_app`, `restart_alt`, or `palette`, the page is missing `tokens.css` or its importing `index.css`.

## Common deviations from the default setup

- **Multiple themes available, runtime-switchable.** Load all the theme stylesheets you want available. Switch by setting `document.documentElement.dataset.theme = 'cyberpunk'`. They're idle until activated by the matching selector. See `theming.md`.
- **Bundle handfish into a build pipeline.** Don't. The CDN with version pinning is the supported deployment model. If CDN reliability is the concern, set up edge caching, not duplication.
- **Self-host handfish on a different domain.** The MIT license permits this. You lose automatic updates and must synchronize versions yourself. Default to the CDN.
- **Use a single theme and never switch.** Skip loading other theme stylesheets and hardcode the `data-theme` attribute. Saves a few KB.

## Verification after setup

After wiring up handfish, before declaring setup done:

1. Open DevTools → Elements. Inspect `<html>`. Computed styles should show `--hf-color-1`, `--hf-bg-base`, etc., resolving to OKLCH values.
2. Drop a `<toggle-switch checked></toggle-switch>` into the page. It should render as a styled pill, not as plain text. If it's plain text, the importmap or the `import { ToggleSwitch } from 'handfish'` is missing.
3. View the page on a slow connection (DevTools → Network → throttle). The text should appear immediately in the metric-placeholder font, then swap to Nunito when it arrives. If the page goes blank instead, the preload links are missing.
4. Switch `data-theme` between two values via DevTools. The page should re-skin without reload. If only some elements re-skin, those that don't are using hardcoded values.
