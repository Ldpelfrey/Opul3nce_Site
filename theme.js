/* theme.js — shared source of truth for the site AND the admin preview.
   Loaded by index.html and admin/index.html so the picker can never offer a font
   the site can't render, and the live preview can't drift from the real page. */
(function (root) {
  'use strict';

  var FONTS = {
    'bodoni-moda': {
      label: 'Bodoni Moda — high-contrast didone (current)',
      display: '"Bodoni Moda", "Didot", "Bodoni MT", Georgia, serif',
      googleName: 'Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900'
    },
    'instrument-serif': {
      label: 'Instrument Serif — softer editorial',
      display: '"Instrument Serif", Georgia, "Times New Roman", serif',
      googleName: 'Instrument+Serif:ital@0;1'
    },
    'cormorant': {
      label: 'Cormorant Garamond — lighter, older',
      display: '"Cormorant Garamond", Garamond, Georgia, serif',
      googleName: 'Cormorant+Garamond:ital,wght@0,300..700;1,300..700'
    },
    'fraunces': {
      label: 'Fraunces — warmer, more idiosyncratic',
      display: '"Fraunces", Georgia, serif',
      googleName: 'Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900'
    }
  };

  // Utility face is fixed — the display face is what the theme picker swaps.
  var UTILITY = '"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

  var DEFAULT_PALETTE = {
    bone:     '#EDE9E2',
    bone2:    '#E4DFD6',
    ink:      '#0E0E0D',
    ink2:     '#1A1A18',
    leaf:     '#7A5D1F',  // gold ON BONE  — 5.08:1 on bone, 4.64:1 on bone-2 (measured)
    leafLift: '#C9A227'   // gold ON INK   — 7.98:1 on ink, 7.20:1 on ink-2 (measured)
  };

  /* Relative luminance + WCAG ratio, used by the site's self-check and by the
     admin's live contrast readout. Kept here so both read identical numbers. */
  function srgb(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  }
  function ratio(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function verdict(r, large) {
    var need = large ? 3 : 4.5;
    if (r >= 7) return 'excellent — passes AAA';
    if (r >= 4.5) return 'good — passes AA everywhere';
    if (r >= need) return 'passes AA for large text only';
    return 'FAILS — do not ship';
  }

  /* Derived tokens stay in step with their parents, so a palette edit can't
     desynchronise the hairlines from the ink. */
  function applyTheme(theme, doc) {
    doc = doc || document;
    theme = theme || {};
    var p = Object.assign({}, DEFAULT_PALETTE, theme.palette || {});
    var fontId = theme.font && FONTS[theme.font] ? theme.font : 'bodoni-moda';
    var root = doc.documentElement;

    root.style.setProperty('--bone', p.bone);
    root.style.setProperty('--bone-2', p.bone2);
    root.style.setProperty('--ink', p.ink);
    root.style.setProperty('--ink-2', p.ink2);
    root.style.setProperty('--leaf', p.leaf);
    root.style.setProperty('--leaf-lift', p.leafLift);
    root.style.setProperty('--display', FONTS[fontId].display);
    root.style.setProperty('--utility', UTILITY);

    // derived — never authored by hand
    root.style.setProperty('--rule', hexA(p.ink, 0.18));
    root.style.setProperty('--rule-soft', hexA(p.ink, 0.10));
    root.style.setProperty('--rule-ink', hexA(p.bone, 0.16));
    root.style.setProperty('--muted', mix(p.ink, p.bone, 0.34));   // 0.42 measured 4.07:1 on bone-2 — failed AA
    root.style.setProperty('--muted-ink', mix(p.bone, p.ink, 0.30));  // 8.06:1 on ink, 7.27:1 on ink-2
    return fontId;
  }

  function hexA(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }
  function mix(a, b, t) {
    function p(h) { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    var A = p(a), B = p(b);
    return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join('');
  }

  root.OPUL_THEME = {
    FONTS: FONTS, UTILITY: UTILITY, DEFAULT_PALETTE: DEFAULT_PALETTE,
    applyTheme: applyTheme, ratio: ratio, verdict: verdict, lum: lum
  };
})(window);
