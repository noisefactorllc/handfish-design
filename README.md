# Handfish Design

A Claude Code plugin that turns Claude into an expert on the [Handfish Design System](https://handfish.noisefactor.io) — the Web Components + OKLCH design tokens that power Noisedeck, Tetra, and the rest of the Noise Factor product family.

When activated, it teaches Claude handfish's conventions (light-DOM style injection, `--hf-*` token discipline, form-associated components, the 17-theme system) and prevents the most common mistakes — hardcoded colors, `!important` overrides, Shadow DOM workarounds, missing event semantics.

## What it does

- **Loads handfish conventions on demand**: when you start working on a web app that imports `handfish` or references `--hf-*` variables, Claude pulls in the relevant references.
- **Enforces token discipline**: catches hardcoded colors, spacings, radii, and shadows; rewrites them to design tokens.
- **Knows the component catalog**: 21 custom elements plus the AboutDialog class and the toast / tooltip / escape / keyboard-shortcut utility families — with their tag names, events, attributes, and form-association behavior.
- **Guides theme switching**: 17 theme stylesheets covering 20 `data-theme` values (some files declare both dark/light variants), plus the two default modes. The skill knows how each one re-skins the token layer.
- **Models the styling layer correctly**: handfish injects styles into the document head — components participate in the global cascade. The skill teaches override-by-specificity instead of `!important` or Shadow DOM hacks.
- **Bridges color spaces**: when you need to convert between RGB / HSV / OkLab / OKLCH / hex, the skill points to the right utility instead of letting Claude reinvent it.
- **Walks contributors through adding a new component**: directory layout, style injection pattern, exports, examples page, visual regression baselines.

## Install

```
/plugin marketplace add noisefactorllc/handfish-design
/plugin install handfish-design@noisefactor
```

Or require it for your team by adding to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "noisefactor": {
      "source": {
        "source": "github",
        "repo": "noisefactorllc/handfish-design"
      }
    }
  },
  "enabledPlugins": {
    "handfish-design@noisefactor": true
  }
}
```

## When it activates

The skill triggers whenever Claude is doing web work that touches:

- Imports from `handfish` or `@noisedeck/handfish`
- `--hf-*` CSS variables in stylesheets or inline styles
- Any handfish custom element: `<toggle-switch>`, `<slider-value>`, `<select-dropdown>`, `<dropdown-menu>`, `<dropdown-item>`, `<color-picker>`, `<color-wheel>`, `<color-swatch>`, `<gradient-stops>`, `<vector2d-picker>`, `<vector3d-picker>`, `<justify-button-group>`, `<code-editor>`, `<image-magnifier>`, `<knob-dial>`, `<led-matrix>`, `<tempo-bar>`, `<menu-bar>`, `<seance-dialog>`, `<session-status>`, `<join-session-dialog>`
- The `AboutDialog` JS class (constructed with `new AboutDialog({...})`, then `.show()`)
- Toast helpers (`showToast`, `showSuccess`, `showError`, `showWarning`, `showInfo`)
- Tooltip initialization (`initializeTooltips`, `class="tooltip"` + `data-title` attribute)
- The escape stack (`registerEscapeable`, `unregisterEscapeable`, `initEscapeHandler`)
- Keyboard-shortcut formatting (`formatShortcut`, `isMacPlatform`)
- Color conversion utilities (`rgbToHex`, `parseHex`, `rgbToHsv`, OkLab/OKLCH math)
- Right-to-left / bidi work: `dir="rtl"` on a handfish page, `data-language="industrial"`, or overriding a component's built-in strings
- Frontend code in any Noisemaker-based app (Noisedeck, Tetra, Foundry, Polymorphic, Layers, Shade, Blaster, ShuffleSet, Sleeve, Remap, Handfish itself)

## Reference docs

The plugin includes domain-specific reference documents that Claude loads contextually:

| Reference | Covers |
|-----------|--------|
| `setup.md` | CDN URLs, importmap pattern, three pinning levels (`/0`, `/0.10`, `/0.10.1`), font preloading, base styles, the `industrial.css` typeface opt-in, RTL setup |
| `tokens.md` | The full `--hf-*` token catalog, OKLCH color format, semantic vs. primitive tokens, the `--hf-led-*` readout palette, why hardcoding breaks themes |
| `theming.md` | The 17 built-in themes, `data-theme` switching, building a custom theme, dark/light variants, preventing FOUC, and the theme / language / direction axes |
| `components.md` | Hand-written prose for the 21 custom elements + AboutDialog class + helper utility families: usage patterns, examples, gotchas, anti-patterns |
| **`api-canonical.md`** | **Machine-generated source-of-truth reference** — attribute names, event types, event detail payloads, form-association status, toast defaults. Regenerated from handfish source on every release; wins when it disagrees with `components.md`. |
| `styling.md` | Light-DOM style injection model, overriding component styles by specificity, logical vs. physical CSS for RTL, why `!important` and Shadow DOM workarounds are banned |
| `i18n.md` | Bidi/RTL readiness: setting `dir`, per-component overridable strings, logical CSS, `<bdi>` isolation — and the line between what handfish provides and what the app owns (translation) |
| `color.md` | Color conversion utilities (`rgbToHex`, `parseHex`, OkLab/OKLCH math), the 0–255 vs OKLCH conventions |
| `utilities.md` | Toasts (defaults, real options, `dismissLabel`), the stack-based escape handler, tooltip initialization (`class="tooltip"` + `data-title`), platform-aware shortcut formatting (`formatShortcut`) |
| `contributing.md` | Adding a new component to handfish itself + the canonical-reference regeneration workflow for skill maintainers |

## Source-of-truth anchor

This skill was last audited on **2026-08-12** against **handfish `0.10`** at HEAD commit [`9bbb287`](https://github.com/noisefactorllc/handfish/commit/9bbb287). That audit was a full-coverage pass bringing the skill up to date with the industrial components (`knob-dial`, `led-matrix`, `tempo-bar`), `menu-bar`, the Seance collaboration set (`seance-dialog`, `session-status`, `join-session-dialog`), the code-editor collaboration APIs, bidi/RTL readiness, and the `shortcuts` utilities. The machine-generated `references/api-canonical.md` carries its own provenance — its JSON was last regenerated at commit [`d8d350c`](https://github.com/noisefactorllc/handfish/commit/d8d350c) (2026-07-28), the commit that last changed the extracted API surface.

When handfish ships a new minor or major version:

1. In the handfish repo, run `node scripts/generate-component-api.js` to refresh `docs/component-api.json`.
2. In this repo, run `node scripts/regenerate-canonical-api.js` to refresh `references/api-canonical.md`.
3. Diff the result; update prose in `components.md` and other references for any API that changed (renamed attribute, removed event, etc.).
4. Bump the version + commit pin in this section.

See `skills/handfish-design/references/contributing.md` § "Maintaining this skill" for the full workflow.

## License

MIT
