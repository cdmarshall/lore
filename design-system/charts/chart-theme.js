/*
 * Lore chart theme: ordered-dither styling for Chart.js.
 *
 * Gives every chart Lore draws the design-system look: parchment & ink,
 * Bayer-dither fills instead of flat color or gradients, square corners,
 * pixel-font labels, and no easing (things snap; see design-system/readme.md).
 *
 * Usage (Lore inlines this file, never links it, so outputs stay
 * self-contained):
 *   1. Load Chart.js (in Cowork artifacts, use the exact allowed CDN tag).
 *   2. Paste this file's contents into a <script> tag.
 *   3. LoreCharts.applyTheme(Chart);
 *   4. Style each series: Object.assign(dataset, LoreCharts.seriesStyle(i, 'dotted'))
 *      or pick explicitly: LoreCharts.seriesStyle('arcane', 'hatched').
 *
 * Variants: 'dotted' (40% Bayer dither, the default), 'dense' (60%),
 * 'hatched' (diagonal pixel stripes), 'solid'. There is deliberately no
 * bloom/glow variant: the design system bans blur.
 *
 * The pixel font ('Jersey 15') applies only if the page embeds it (the
 * artifact and brief templates show how); otherwise it falls back to
 * monospace, which still reads on-theme.
 *
 * Brand packs: when scripts/apply-brand.py brands a page that uses this
 * theme, it defines window.LORE_BRAND = { charts: {...} } before this script
 * runs. Its keys override the defaults below: colors (same shape as COLORS,
 * any subset), series (SERIES_ORDER), ink / inkSoft / inkFaint / paper /
 * rule, font (family string), fontSize, variant (default seriesStyle variant,
 * e.g. 'solid'; when set it overrides the variant each call asks for),
 * radius (bar corner radius) and tension (line curve).
 */
(function (global) {
  'use strict';

  // 8x8 Bayer ordered-dither matrix (same family as design-system/assets/dither/)
  var BAYER8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  // Design-system tokens (keep in sync with design-system/tokens/colors.css)
  var COLORS = {
    gold:    { main: '#a9862f', deep: '#856a22', soft: '#f4edd8' },
    arcane:  { main: '#6b4f8e', deep: '#5a4278', soft: '#efe7f4' },
    info:    { main: '#3a5878', deep: '#2e4660', soft: '#e9eff6' },
    success: { main: '#3f6b52', deep: '#325542', soft: '#e5f0ea' },
    warn:    { main: '#b06f2a', deep: '#8d5922', soft: '#f6ead6' },
    danger:  { main: '#a4432f', deep: '#833626', soft: '#f4e2dc' },
    ink:     { main: '#26221c', deep: '#26221c', soft: '#f3f0e8' }
  };
  var INK = '#26221c', INK_SOFT = '#514a3e', INK_FAINT = '#8c8577';
  var PAPER = '#faf9f6', RULE = '#e3ddce';

  // Series pick up colors in this order when styled by index.
  var SERIES_ORDER = ['gold', 'arcane', 'info', 'success', 'warn', 'danger', 'ink'];

  // Brand pack overrides (see header). Unbranded pages leave all of this alone.
  var BRAND = (global.LORE_BRAND && global.LORE_BRAND.charts) || null;
  var FONT = "'Jersey 15', 'Courier New', monospace", FONT_SIZE = 14, VARIANT = 'dotted';
  if (BRAND) {
    Object.keys(BRAND.colors || {}).forEach(function (k) { COLORS[k] = BRAND.colors[k]; });
    if (BRAND.series) SERIES_ORDER = BRAND.series;
    INK = BRAND.ink || INK; INK_SOFT = BRAND.inkSoft || INK_SOFT; INK_FAINT = BRAND.inkFaint || INK_FAINT;
    PAPER = BRAND.paper || PAPER; RULE = BRAND.rule || RULE;
    FONT = BRAND.font || FONT; FONT_SIZE = BRAND.fontSize || FONT_SIZE; VARIANT = BRAND.variant || VARIANT;
  }

  function colorOf(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      return SERIES_ORDER[((nameOrIndex % SERIES_ORDER.length) + SERIES_ORDER.length) % SERIES_ORDER.length];
    }
    return COLORS[nameOrIndex] ? nameOrIndex : 'gold';
  }

  // A repeating canvas pattern of ordered-dither pixels.
  // density 0..1; px is the size of each "pixel" (2 = chunky, on-brand).
  function ditherPattern(nameOrIndex, density, px, bgColor) {
    var name = colorOf(nameOrIndex);
    var c = COLORS[name];
    density = (density == null ? 0.4 : density);
    px = px || 2;
    var size = 8 * px;
    var canvas = global.document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor || c.soft;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = c.main;
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        if (BAYER8[y][x] / 64 < density) ctx.fillRect(x * px, y * px, px, px);
      }
    }
    return ctx.createPattern(canvas, 'repeat');
  }

  // Diagonal pixel-stripe fill (the "hatched" variant).
  function hatchPattern(nameOrIndex, px) {
    var name = colorOf(nameOrIndex);
    var c = COLORS[name];
    px = px || 2;
    var size = 8 * px;
    var canvas = global.document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = c.soft;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = c.main;
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        if ((x + y) % 4 < 2) ctx.fillRect(x * px, y * px, px, px);
      }
    }
    return ctx.createPattern(canvas, 'repeat');
  }

  // Ready-to-merge dataset styling. i = series index (or a color name).
  // variant: 'dotted' | 'dense' | 'hatched' | 'solid'
  function seriesStyle(i, variant) {
    var name = colorOf(typeof i === 'number' ? i : i);
    var c = COLORS[name];
    var fill;
    switch ((BRAND && BRAND.variant) || variant || VARIANT) { // a brand's variant wins: brands don't dither
      case 'solid':   fill = c.main; break;
      case 'hatched': fill = hatchPattern(name); break;
      case 'dense':   fill = ditherPattern(name, 0.6); break;
      default:        fill = ditherPattern(name, 0.4); break;
    }
    return {
      backgroundColor: fill,
      borderColor: c.main,
      borderWidth: 1.5,
      pointBackgroundColor: c.main,
      pointBorderColor: INK,
      hoverBackgroundColor: ditherPattern(name, 0.75),
      hoverBorderColor: c.deep
    };
  }

  // Global Chart.js defaults: pixel chrome, square everything, no easing.
  function applyTheme(Chart) {
    var d = Chart.defaults;
    d.font.family = FONT;
    d.font.size = FONT_SIZE;
    d.font.weight = 400; // pixel faces ship one weight; never bold them
    d.color = INK_SOFT;
    d.borderColor = RULE;
    d.animation = false; // stepped world: charts appear, they don't ease in

    d.elements.point.pointStyle = 'rect';
    d.elements.point.radius = 4;
    d.elements.line.tension = (BRAND && BRAND.tension) || 0; // straight segments unless a brand curves them
    d.elements.line.borderWidth = 2;
    d.elements.bar.borderWidth = 1.5;
    if (BRAND && BRAND.radius) d.elements.bar.borderRadius = BRAND.radius;
    d.elements.arc.borderColor = INK;
    d.elements.arc.borderWidth = 1.5;

    d.plugins.legend.labels.boxWidth = 12;
    d.plugins.legend.labels.boxHeight = 12;
    d.plugins.legend.labels.color = INK_SOFT;

    d.plugins.tooltip.backgroundColor = INK;
    d.plugins.tooltip.titleColor = PAPER;
    d.plugins.tooltip.bodyColor = '#ece7db';
    d.plugins.tooltip.cornerRadius = (BRAND && BRAND.radius) || 0; // square unless a brand rounds them
    d.plugins.tooltip.padding = 10;
    d.plugins.tooltip.boxWidth = 10;
    d.plugins.tooltip.boxHeight = 10;

    if (d.scales && d.scales.category) d.scales.category.grid = d.scales.category.grid || {};
    d.scale = d.scale || {};
  }

  global.LoreCharts = {
    COLORS: COLORS,
    SERIES_ORDER: SERIES_ORDER,
    INK: INK, INK_SOFT: INK_SOFT, INK_FAINT: INK_FAINT, PAPER: PAPER, RULE: RULE,
    ditherPattern: ditherPattern,
    hatchPattern: hatchPattern,
    seriesStyle: seriesStyle,
    applyTheme: applyTheme
  };
})(typeof window !== 'undefined' ? window : this);
