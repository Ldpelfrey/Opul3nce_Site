/* theme.js — shared source of truth for the site AND the admin preview.
   One face (Jost 400/500) and five fixed colours. The admin shows the same
   contrast maths the site uses, so a palette edit can't ship an unreadable pair. */
(function (root) {
  'use strict';

  var FONTS = {
    'jost': {
      label: 'Jost — geometric sans (400 / 500)',
      display: '"Jost", "Futura", "Century Gothic", system-ui, sans-serif',
      googleName: 'Jost:wght@400;500'
    }
  };

  var DEFAULT_PALETTE = {
    bone: '#ECE7DD',       // the page ground
    stone: '#B7AD9C',      // decorative only: never text
    deepStone: '#6E675C',  // the only accent-coloured text on bone (4.54:1)
    ink: '#151412',        // type, and the one dark section
    gold: '#A8936A'        // hairlines and the mark on bone (2.42:1); text only on ink (6.18:1)
  };

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
    if (r >= 7) return 'excellent: passes AAA';
    if (r >= 4.5) return 'good: passes AA everywhere';
    if (r >= need) return 'passes AA for large text only';
    return 'FAILS: do not use for text';
  }

  function hexA(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }

  /* Hairlines derive from their parents so a palette edit can't desynchronise them. */
  function applyTheme(theme, doc) {
    doc = doc || document;
    theme = theme || {};
    var p = Object.assign({}, DEFAULT_PALETTE, theme.palette || {});
    var fontId = theme.font && FONTS[theme.font] ? theme.font : 'jost';
    var root = doc.documentElement;
    root.style.setProperty('--bone', p.bone);
    root.style.setProperty('--stone', p.stone);
    root.style.setProperty('--deep', p.deepStone);
    root.style.setProperty('--ink', p.ink);
    root.style.setProperty('--gold', p.gold);
    root.style.setProperty('--sans', FONTS[fontId].display);
    root.style.setProperty('--rule', hexA(p.ink, 0.2));
    root.style.setProperty('--rule-ink', hexA(p.bone, 0.2));
    return fontId;
  }

  root.OPUL_THEME = {
    FONTS: FONTS, DEFAULT_PALETTE: DEFAULT_PALETTE,
    applyTheme: applyTheme, ratio: ratio, verdict: verdict, lum: lum
  };
})(window);
