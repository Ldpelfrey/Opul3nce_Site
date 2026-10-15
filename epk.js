/* epk.js — cross-property safety net. Kept deliberately generic; no-ops when
   the hooks are absent. Two jobs only:
     1. offscreen video autoplay (browsers won't START a muted-autoplay video
        outside the viewport; iOS Low Power Mode blocks it entirely — hence the
        touchstart fallback and the requirement that every hero carries a poster)
     2. [data-nav-toggle] / [data-nav-menu] mobile navigation
   This build has no video today. The video half stays so a hero reel can be
   dropped into content.json later without re-solving a bug the portfolio has
   already paid for three times. */
(function () {
  'use strict';

  function initVideo() {
    var vids = document.querySelectorAll('video[autoplay]');
    if (!vids.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                 (navigator.connection && navigator.connection.saveData);
    if (reduce) {                       // drop every loop to its poster
      vids.forEach(function (v) { try { v.pause(); v.removeAttribute('autoplay'); } catch (e) {} });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) v.play().catch(function () {});
        else if (!v.hasAttribute('data-hero')) v.pause();   // ONLY the hero carries data-hero
      });
    }, { rootMargin: '100px', threshold: 0.05 });
    vids.forEach(function (v) { io.observe(v); });

    // iOS Low Power Mode blocks autoplay outright; a single user gesture lifts it.
    window.addEventListener('touchstart', function once() {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      window.removeEventListener('touchstart', once);
    }, { once: true, passive: true });
  }

  function initNav() {
    var btn = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-nav-menu]');
    if (!btn || !menu) return;
    function close() { menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); });
  }

  function boot() { initVideo(); initNav(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
