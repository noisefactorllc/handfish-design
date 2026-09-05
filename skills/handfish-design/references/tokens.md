# Design Tokens

The full `--hf-*` token catalog. Every visual choice in handfish — color, spacing, radius, shadow, font, transition — comes from one of these.

## Why tokens, not literals

When a token like `--hf-accent-3` is used in CSS, the value resolves at runtime based on the active theme. If the user switches from `dark` to `cyberpunk`, every element that used `var(--hf-accent-3)` recolors automatically. Every element that hardcoded `#a5b8ff` does not.

Handfish themes redefine about 30 primitive variables. The rest of the system follows those values. Hardcoded values interrupt that propagation and cause silent visual errors in other themes.

Use tokens for visual values: color, size, weight, and motion. Dynamic user data is an exception, such as a selected color or drag position. Calculate these values for inline use. They do not require theming.

## Color: the primitive layer

The base palette is seven neutrals plus four accents, all defined in OKLCH:

```
--hf-color-1   /* darkest neutral (in dark mode) */
--hf-color-2
--hf-color-3
--hf-color-4
--hf-color-5
--hf-color-6
--hf-color-7   /* lightest neutral */

--hf-accent-1   /* darkest accent */
--hf-accent-2
--hf-accent-3   /* the main "accent" — buttons, focus rings, highlights */
--hf-accent-4   /* lightest accent */
```

Plus four semantic colors:

```
--hf-red       /* error, destructive */
--hf-green     /* success */
--hf-yellow    /* warning */
--hf-blue      /* info, links */
```

These are the *primitives*. They get redefined by every theme. App code rarely references them directly — instead, it references the *semantic aliases* below, which point to the primitives.

## Color: the semantic layer

Semantic aliases are stable names that resolve to a primitive. They're what app code should use most of the time:

| Token | Default value | Use for |
|-------|---------------|---------|
| `--hf-bg-base` | `--hf-color-1` | Page background, the "lowest" surface |
| `--hf-bg-surface` | `--hf-color-2` | Cards, panels, raised surfaces |
| `--hf-bg-elevated` | `--hf-color-3` | Inputs, controls, surfaces above panels |
| `--hf-bg-muted` | `--hf-color-4` | Hovered/pressed states |
| `--hf-titlebar-bg` | `--hf-color-3` | Title bars, headers |
| `--hf-text-muted` | `--hf-color-4` | Disabled / placeholder text |
| `--hf-text-dim` | `--hf-color-5` | Secondary / supporting text |
| `--hf-text-normal` | `--hf-color-6` | Primary body text |
| `--hf-text-bright` | `--hf-color-7` | Headings, emphasized text |
| `--hf-accent` | `--hf-accent-3` | Primary accent (buttons, focus, highlights) |
| `--hf-accent-hover` | `--hf-accent-4` | Hovered accent |
| `--hf-accent-bg` | `--hf-accent-1` | Tinted accent background (e.g., button bg) |
| `--hf-border` | `25%` of `--hf-accent-3` | Default borders |
| `--hf-border-subtle` | `--hf-color-4` | Quiet borders (between rows, sections) |
| `--hf-border-hover` | `40%` of `--hf-accent-3` | Hover state for bordered elements |
| `--hf-border-focus` | `--hf-accent-3` | Focus state for bordered elements |
| `--hf-link-color` | `--hf-accent` | Link text |
| `--hf-link-hover` | `--hf-accent-hover` | Hovered link text |

Reach for the semantic alias whenever one fits. Reach for the primitive only when none does. If neither does, that's the cue to add a new semantic alias to `tokens.css` rather than hardcoding.

## Spacing scale

```
--hf-space-0   /* 0 */
--hf-space-1   /* 0.25rem (4px) */
--hf-space-2   /* 0.5rem  (8px) */
--hf-space-3   /* 0.75rem (12px) */
--hf-space-4   /* 1rem    (16px) */
--hf-space-5   /* 1.25rem (20px) */
--hf-space-6   /* 1.5rem  (24px) */
--hf-space-8   /* 2rem    (32px) */
--hf-space-10  /* 2.5rem  (40px) */
--hf-space-12  /* 3rem    (48px) */
```

Use this scale instead of arbitrary pixel/rem values. Snap to the nearest step. `padding: 18px` should be `padding: var(--hf-space-4)` (16px) or `padding: var(--hf-space-5)` (20px). Picking a between-step value defeats the consistency the scale provides.

Utility classes wrap the most common cases: `.hf-p-4`, `.hf-px-3`, `.hf-py-2`, `.hf-mb-4`, `.hf-gap-2`. Use them in markup when convenient. Use `var(--hf-space-N)` in component CSS.

## Border radii

```
--hf-radius-none  /* 0 */
--hf-radius-sm    /* 0.25rem (4px) — inputs, small buttons */
--hf-radius-md    /* 0.375rem (6px) — odd one out, sits between sm and the unsuffixed default */
--hf-radius       /* 0.5rem  (8px) — default for cards, panels */
--hf-radius-lg    /* 0.75rem (12px) — large surfaces */
--hf-radius-xl    /* 1rem    (16px) */
--hf-radius-pill  /* 999px — pill buttons, toggle tracks */
--hf-radius-full  /* 50% — circles, dots, avatars */
```

Note the size oddity: `--hf-radius-md` (6px) is *smaller* than the unsuffixed `--hf-radius` (8px), even though the name suggests it'd be larger. The "md" naming is preserved for historical reasons. Treat the scale as `none < sm < md < <unsuffixed> < lg < xl`.

## Shadows

```
--hf-shadow-sm  /* 0 1px 2px — subtle hover lift */
--hf-shadow     /* 0 2px 4px — default surface shadow */
--hf-shadow-md  /* 0 4px 8px — popups, dropdowns */
--hf-shadow-lg  /* 0 8px 16px — modals, dialogs */
--hf-shadow-xl  /* 0 16px 32px — top-level overlays */
--hf-glow-accent  /* accent-colored glow for highlights */
```

Themes can override shadow opacity. The dark-mode defaults assume a black backdrop. Lighter themes typically reduce alpha.

## LED readout colors (industrial)

`<led-matrix>` reads these color values when painting its `<canvas>`. Each token has a built-in fallback if absent:

```
--hf-led-bg    /* readout background (near-black) */
--hf-led       /* lit pixel (cyan) */
--hf-led-dim   /* dim pixel / label */
--hf-led-hi    /* highlight pixel (near-white cyan) */
```

Override LED tokens globally or within a scope to change the readout, such as an amber-phosphor variant. Only canvas rendering reads these tokens directly. A theme must define them explicitly to change the LED appearance.

## Typography

```
--hf-font-family       /* Nunito, with 'Nunito Blank' fallback */
--hf-font-family-mono  /* Noto Sans Mono, with 'Noto Sans Mono Blank' fallback */
--hf-font-family-icon  /* Material Symbols Outlined */

--hf-size-xs    /* 0.625rem (10px) — labels, small captions */
--hf-size-sm    /* 0.75rem  (12px) — secondary text, controls */
--hf-size-base  /* 0.875rem (14px) — body text */
--hf-size-md    /* 1rem     (16px) — emphasized body */
--hf-size-lg    /* 1.125rem (18px) */
--hf-size-xl    /* 1.25rem  (20px) */
--hf-size-2xl   /* 1.5rem   (24px) — headings */

--hf-weight-normal    /* 400 */
--hf-weight-medium    /* 500 */
--hf-weight-semibold  /* 600 */
--hf-weight-bold      /* 700 */

--hf-leading-tight    /* 1.2 */
--hf-leading-normal   /* 1.5 */
--hf-leading-relaxed  /* 1.75 */

--hf-tracking-tight   /* -0.025em */
--hf-tracking-normal  /* 0 */
--hf-tracking-wide    /* 0.05em — used for labels, all-caps */
```

The **industrial** design language (opt-in: `industrial.css` + `data-language="industrial"` on `<html>`) overrides `--hf-font-family` with Atkinson Hyperlegible — a more utilitarian, instrument-panel typeface. It's a typeface layer, orthogonal to the color theme. See `theming.md` and `setup.md`.

## Controls (form elements)

```
--hf-control-height    /* default min-height for inputs/buttons */
--hf-control-padding   /* default padding for inputs/buttons */
--hf-border-width      /* default border width for controls */
--hf-focus-ring-width  /* outline width for :focus-visible */
--hf-focus-ring-color  /* outline color for :focus-visible */
--hf-focus-ring-offset /* outline-offset for :focus-visible */
```

When building a custom control, use these so it looks at home next to native handfish components.

## Transitions

```
--hf-transition-fast    /* ~100ms — cursor follow */
--hf-transition         /* ~150ms — default for color/bg/border */
--hf-transition-slow    /* ~300ms — page transitions */
--hf-transition-color   /* color: <default duration> */
--hf-transition-bg      /* background: <default duration> */
--hf-transition-border  /* border-color: <default duration> */
```

Combine the targeted ones for fewer style recomputations:
`transition: var(--hf-transition-color), var(--hf-transition-bg), var(--hf-transition-border);`

## Glassmorphism

Several handfish surfaces use glass blur:

```
--hf-glass-blur     /* blur(20px) — standard panel backdrop */
--hf-glass-blur-sm  /* blur(8px) — subtle */
--hf-glass-blur-lg  /* blur(32px) — heavy */
--hf-backdrop       /* shared overlay tint for modals */

--hf-surface-opacity      /* 92% — full surfaces */
--hf-surface-transparency /* 8% */
--hf-panel-opacity        /* 85% — panels */
--hf-panel-transparency   /* 15% */
--hf-header-opacity       /* 65% — title bars */
--hf-header-transparency  /* 35% */
```

The `.hf-surface`, `.hf-panel`, `.hf-card` utility classes apply these in the conventional combination. Reach for the utility class first. Fall back to composing the variables directly only if the layout calls for something custom.

## Z-index scale

```
--hf-z-base            /* 0    — baseline */
--hf-z-dropdown        /* 100  — dropdown menus */
--hf-z-sticky          /* 200  — sticky headers */
--hf-z-fixed           /* 300  — fixed-position UI */
--hf-z-modal-backdrop  /* 400  — overlay behind modals */
--hf-z-modal           /* 500  — dialogs, modals */
--hf-z-popover         /* 600  — popovers */
--hf-z-tooltip         /* 700  — top-most layer (tooltips) */
```

The values are deliberately small (100-spaced) so app-level overlays can interleave cleanly. Use the tokens for new overlays, or interleave at the gaps (e.g., `var(--hf-z-modal) + 1` for a confirm-dialog above your modal).

The live tooltip layer (`#hf-tooltip-layer`) hardcodes `z-index: 100000` instead of reading `--hf-z-tooltip`. In practice, app code cannot cover handfish tooltips. Use `--hf-z-tooltip` for your tooltip-level overlays. Your code remains correct if handfish later makes its layer use that token.

## OKLCH: the color format you'll see

Handfish colors are written in OKLCH (`oklch(lightness% chroma hue)`). OKLCH is perceptually uniform — equal numerical lightness changes look like equal visual lightness changes. RGB is not.

Why this matters in practice:

- **Hue families stay coherent.** A theme can use one hue across all neutrals, such as 264° for default dark. The colors then remain related. RGB has no single hue axis.
- **Chroma controls saturation independently of lightness.** You can dim a color without it shifting toward a different hue.
- **Color-mixing math behaves intuitively.** `color-mix(in srgb, ...)` with OKLCH-defined inputs produces clean blends.

You don't need to write OKLCH math by hand — `colorConversions.js` (see `color.md`) has helpers. But when you read a token's value in DevTools, expect `oklch(72.8% 0.051 264)`, not `#a5b8ff`. That's not a bug.

## Adding a new token

If no token fits a required value, usually add one instead of hardcoding it. Add it to `tokens.css`, or to the relevant theme file for a theme-specific value. Give it a semantic name such as `--hf-<category>-<purpose>`. Document its purpose. Use it everywhere, including overrides for themes where its value should differ.
