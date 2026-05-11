# Setup

How to add Handfish to a brand-new web app, choose a CDN pin level, and avoid font-loading FOUC.

## CDN base

All handfish assets are served from `https://handfish.noisefactor.io`. The recommended runtime distribution is the CDN — apps load handfish as ES modules over HTTPS. There is also an npm package (`@noisedeck/handfish`, declared in handfish's `package.json`) used by handfish's own dev tooling and by apps that prefer to bundle from source. The CDN serves the artifact at `dist/handfish.esm.min.js`, produced from `src/index.js` by `scripts/bundle.js` — the file list at the CDN does not mirror the `src/` tree, only the published bundle and the stylesheets.

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

That's the entire setup. Importing a class (e.g., `ToggleSwitch`) registers its custom element as a side effect of loading the file — you don't need to do anything else for `<toggle-switch>` to work in the markup.

## Stylesheet structure

`styles/index.css` is the recommended single import. It re-imports:

- `tokens.css` — every `--hf-*` variable plus light/dark mode + Nunito + Noto Sans Mono `@font-face` declarations
- `forms.css` — base form control styles
- `tags-and-tabs.css` — tag pill and tab styles
- `menus-and-toolbars.css` — menu and toolbar styles
- `dialogs.css` — `<dialog>` and modal base styles

If the app only needs tokens (no base/utility styles), import `tokens.css` directly. This is rare — most apps want the utility classes (`.hf-flex`, `.hf-btn`, `.hf-text-bright`, etc.) that come with `index.css`.

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

For Material Symbols icons (used by `.hf-icon` and `<dropdown-menu>`'s icon attribute), no preload is needed — `index.css` declares the `@font-face` itself.

## Common deviations from the default setup

- **Multiple themes available, runtime-switchable.** Load all the theme stylesheets you want available; switch by setting `document.documentElement.dataset.theme = 'cyberpunk'`. They're idle until activated by the matching selector. See `theming.md`.
- **Bundle handfish into a build pipeline.** Don't. The CDN with version pinning is the supported deployment model. If CDN reliability is the concern, set up edge caching, not duplication.
- **Self-host handfish on a different domain.** Possible (the source is MIT-licensed) but you give up automatic updates and you're now responsible for keeping the version in sync. Default to the CDN.
- **Use a single theme and never switch.** Skip loading other theme stylesheets and hardcode the `data-theme` attribute. Saves a few KB.

## Verification after setup

After wiring up handfish, before declaring setup done:

1. Open DevTools → Elements. Inspect `<html>`. Computed styles should show `--hf-color-1`, `--hf-bg-base`, etc., resolving to OKLCH values.
2. Drop a `<toggle-switch checked></toggle-switch>` into the page. It should render as a styled pill, not as plain text. If it's plain text, the importmap or the `import { ToggleSwitch } from 'handfish'` is missing.
3. View the page on a slow connection (DevTools → Network → throttle). The text should appear immediately in the metric-placeholder font, then swap to Nunito when it arrives. If the page goes blank instead, the preload links are missing.
4. Switch `data-theme` between two values via DevTools. The page should re-skin without reload. If only some elements re-skin, those that don't are using hardcoded values.
