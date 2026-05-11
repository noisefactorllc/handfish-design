# Color Utilities

Color conversion functions exported from `handfish/utils/colorConversions.js` (re-exported from the package root). Use these instead of writing color math by hand or pulling in another library — they're already loaded and they share conventions with the design tokens.

## Conventions

The library uses two color representations consistently:

- **`{r, g, b}` with values 0–255 (integers)** for sRGB. This matches what `parseHex` produces and what `rgbToHex` consumes.
- **`{r, g, b}` with values 0–1 (floats)** for *linear* RGB, used internally as a bridge to OkLab/OKLCH. Functions named `linear*` use this scale.
- **`{l, a, b}` and `{l, c, h}` for OkLab and OKLCH** with `l` as a 0–1 lightness, `a/b` as unbounded color-opponent axes, and `c/h` as chroma (0+) and hue (0–360°).

Pay attention to which scale a function expects. Mixing 0–1 sRGB with the 0–255 functions silently produces near-black colors; mixing 0–255 linear with the 0–1 linear functions produces oversaturated junk. The function name's prefix is your guide.

## Function reference

### sRGB ↔ Linear sRGB

```js
import { sRGBToLinear, linearToSRGB, sRGBToLinearRGB, linearRGBToSRGB } from 'handfish'

sRGBToLinear(0.5)              // → 0.214 (component, 0-1 → 0-1)
linearToSRGB(0.214)            // → 0.5
sRGBToLinearRGB({r:128,g:128,b:128})  // → {r:0.214, g:0.214, b:0.214}
linearRGBToSRGB({r:0.214,g:0.214,b:0.214})  // → {r:128, g:128, b:128}
```

Use these when you need to do gamma-correct math (blending, blurring, gamut mapping). For most app code, the sRGB ↔ OKLCH helpers below are what you want.

### sRGB ↔ HSV

```js
import { rgbToHsv, hsvToRgb } from 'handfish'

rgbToHsv({r:255, g:128, b:0})   // → {h:30, s:100, v:100}
hsvToRgb({h:30, s:100, v:100})  // → {r:255, g:128, b:0}
```

HSV is intuitive for color pickers (the OG HSV triangle UI). It's not perceptually uniform — equal numerical changes in `v` don't look like equal lightness changes — so it's not a great choice for design tokens, but it is good for "pick a color" UIs.

### sRGB ↔ OkLab

```js
import { rgbToOklab, oklabToRgb } from 'handfish'

rgbToOklab({r:255, g:128, b:0})    // → {l:0.71, a:0.13, b:0.16}
oklabToRgb({l:0.71, a:0.13, b:0.16})  // → {r:255, g:128, b:0}
```

OkLab is a perceptually uniform color space. Use it when you need to compute color differences (`Δa²+Δb²+Δl²` is a good perceptual distance) or do arithmetic blending that respects perceived lightness.

### sRGB ↔ OKLCH

```js
import { rgbToOklch, oklchToRgb, oklchToRgbRaw } from 'handfish'

rgbToOklch({r:255, g:128, b:0})        // → {l:0.71, c:0.21, h:46.5}
oklchToRgb({l:0.71, c:0.21, h:46.5})   // → {r:255, g:128, b:0} (gamut-mapped)
oklchToRgbRaw({l:0.71, c:0.21, h:46.5})  // → {r:255, g:128, b:0} (NOT gamut-mapped)
```

OKLCH is the polar form of OkLab — same color space, but with chroma and hue as separate axes. This is what handfish's design tokens use, and it's the most useful representation for theme work because:

- Hue is a single number; you can rotate hues without affecting saturation or lightness.
- Chroma is a single number; you can desaturate without color shift.
- Lightness scales perceptually.

`oklchToRgb` does gamut mapping for you — if the OKLCH value is outside sRGB (some vivid neons are), it returns the closest in-gamut RGB. `oklchToRgbRaw` doesn't gamut-map — use it only when you specifically need the unbounded conversion (e.g., for further math).

### Hex ↔ RGB

```js
import { parseHex, rgbToHex, rgbToHexWithAlpha } from 'handfish'

parseHex('#ff8000')           // → {r:255, g:128, b:0}
parseHex('#FF8000')           // → {r:255, g:128, b:0}  (case-insensitive)
parseHex('#f80')              // → {r:255, g:136, b:0}  (3-digit shorthand)
parseHex('#ff80')             // → null  (4-digit not supported)
parseHex('#ff8000aa')         // → null  (8-digit not supported)
rgbToHex({r:255, g:128, b:0}) // → '#ff8000'
rgbToHexWithAlpha({r:255, g:128, b:0}, 0.5)  // → '#ff800080'
```

`parseHex` accepts 3-digit shorthand (`#rgb`) and 6-digit (`#rrggbb`) forms only, with or without `#` and case-insensitive. It returns `null` for any other length — so 4-digit and 8-digit alpha-bearing hex strings need to be split apart manually before calling.

`rgbToHex` always emits 6-digit; `rgbToHexWithAlpha(rgb, alpha)` emits 8-digit (the alpha argument is `0–1`, output is `00–ff`).

### Gamut mapping

```js
import { isInGamut, gamutMapLinearRGB, getMaxChroma, getMaxAB } from 'handfish'

isInGamut({r:1.2, g:0.5, b:0.3})  // → false (red component > 1)
gamutMapLinearRGB({r:1.2, g:0.5, b:0.3}, originalLch)  // → in-gamut linear RGB
getMaxChroma(0.7, 30)   // max chroma at lightness 0.7, hue 30°
getMaxAB(0.7)           // max |a| or |b| at lightness 0.7
```

Use these when picking colors that should stay in sRGB. The color picker components use them internally to clamp the user's selection. App code rarely needs them directly unless you're building a custom picker.

### Helpers

```js
import { clamp, normalizeHue, roundTo } from 'handfish'

clamp(150, 0, 100)       // → 100
clamp(-5, 0, 100)        // → 0
normalizeHue(370)        // → 10 (wraps to 0-360)
normalizeHue(-30)        // → 330
roundTo(0.123456, 3)     // → 0.123
```

Generic enough to use beyond color, but exported here because the color functions use them internally.

## Common patterns

### Get a contrasting text color for an arbitrary background

```js
import { parseHex, rgbToOklch } from 'handfish'

function contrastingText(bgHex) {
    const rgb = parseHex(bgHex)
    const { l } = rgbToOklch(rgb)
    return l > 0.5 ? '#000000' : '#ffffff'
}
```

OKLCH lightness is perceptually uniform, so a 0.5 cutoff is a reasonable mid-point. For higher rigor (WCAG-compliant), compute relative luminance via `sRGBToLinear` and apply WCAG 2.1's contrast formula.

### Lighten or darken a color by a perceptually-equal amount

```js
import { parseHex, rgbToOklch, oklchToRgb, rgbToHex } from 'handfish'

function tone(hex, deltaL) {
    const lch = rgbToOklch(parseHex(hex))
    lch.l = clamp(lch.l + deltaL, 0, 1)
    return rgbToHex(oklchToRgb(lch))
}

tone('#a5b8ff', +0.1)  // perceptually 10% lighter
tone('#a5b8ff', -0.2)  // perceptually 20% darker
```

This produces visually consistent shifts. Doing the same in HSL/HSV produces uneven results — `+0.1` lightness on a yellow looks different from `+0.1` on a blue.

### Generate a complementary color

```js
import { parseHex, rgbToOklch, oklchToRgb, rgbToHex, normalizeHue } from 'handfish'

function complement(hex) {
    const lch = rgbToOklch(parseHex(hex))
    lch.h = normalizeHue(lch.h + 180)
    return rgbToHex(oklchToRgb(lch))
}
```

Rotates hue 180° in OKLCH, preserving lightness and chroma. Often more visually pleasing than HSV-based complements.

### Get the OKLCH value behind a `--hf-*` token

```js
import { parseHex, rgbToOklch } from 'handfish'

const hex = getComputedStyle(document.documentElement).getPropertyValue('--hf-accent-3')
// → "oklch(79.5% 0.103 264)"
```

Note: `--hf-*` tokens *are* OKLCH strings. You don't need to convert. Read them as-is via `getPropertyValue`. Convert only if you need the underlying RGB (e.g., to feed into a `<canvas>` API that doesn't accept OKLCH).

If you need to actually parse the OKLCH string, use the browser's `CSS.supports` + a regex, or use the platform's color parsing if available. Handfish doesn't include an OKLCH-string parser since the tokens are written by hand and the values are known.

## What NOT to do

- **Don't mix RGB scales.** A function that takes 0–255 and a function that takes 0–1 will both accept the wrong scale silently. Match the prefix.
- **Don't convert through HSL "because it's familiar."** HSL is not perceptually uniform; using it as an intermediate for color math (lightening, blending) produces visible artifacts. OKLCH is the right intermediate.
- **Don't reinvent these functions.** They're tested, gamut-aware, and consistent with the design system. Importing them is one line; reimplementing is bug-prone.
