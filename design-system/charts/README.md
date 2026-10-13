# Lore charts: dithered data visuals

Whenever Lore is asked to build a chart, dashboard, report, or any data visual, it uses this theme so the output matches the design system out of the box: Bayer-dither fills instead of flat color, parchment and ink, pixel-font chrome, square corners, no easing, no blur. This borrows the visual language of dither-styled chart kits, rebuilt for Lore's world: single self-contained HTML files, no build step, no installs on the user's machine.

## The rule

**Any chart Lore draws uses `chart-theme.js`.** Inline the file's contents into the output (never `<script src>` a path; outputs must stay self-contained), load Chart.js, apply the theme, and style each series with `seriesStyle`.

In Cowork artifacts, Chart.js must be loaded with the exact allowed CDN tag (integrity + crossorigin; see the artifact tooling docs). In standalone report HTML the same tag works, or any Chart.js v4.

## Usage

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js" integrity="sha384-iU8HYtnGQ8Cy4zl7gbNMOhsDTTKX02BTXptVP/vqAWIaTfM7isw76iyZCsjL2eVi" crossorigin="anonymous"></script>
<script>
/* paste chart-theme.js contents here */
</script>
<script>
LoreCharts.applyTheme(Chart);
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      Object.assign({ label: 'Signups', data: [186, 240, 205] }, LoreCharts.seriesStyle(0, 'dotted')),
      Object.assign({ label: 'Activations',  data: [92, 130, 118] },  LoreCharts.seriesStyle(1, 'hatched'))
    ]
  }
});
</script>
```

## Palette and variants

- Series colors, in order: gold, arcane, info, success, warn, danger, ink. `seriesStyle(i, variant)` takes the index or an explicit name (`seriesStyle('arcane', 'dense')`).
- Variants: `dotted` (40% dither, the default), `dense` (60%, for emphasis or the "current" series), `hatched` (diagonal pixel stripes, good for contrast next to dotted), `solid` (use sparingly, e.g. a target line).
- Deliberately absent: gradients, glow/bloom, rounded bars, eased animations. The design system bans blur and smooth motion; dither density is the only "gradient" and things snap rather than float.

## Beyond Chart.js

- **Static SVG charts** (briefs, PDFs, anything with no JS): same rules by hand. Fill shapes with the dither tiles from `design-system/assets/dither/` (as data URIs, `image-rendering: pixelated`), 1.5px ink borders, Jersey 15 labels at 14px+, square legend swatches.
- **Tables of numbers** are usually better than charts for under 5 data points; when in doubt, follow VOICE.md and lead with the number.
- The pixel font applies only where the page embeds it (templates show how); the monospace fallback still reads on-theme.

`demo.html` in this folder renders the theme across bar, line, and doughnut charts; open it in a browser to eyeball changes after editing the theme.
