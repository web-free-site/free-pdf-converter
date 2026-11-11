/* adfix.js — renders Adsterra banners inline (Adsterra banners do not fill when wrapped
   in an extra same-origin iframe). Loads one banner at a time because Adsterra reads the
   global atOptions. Config: window.__ADFIX = { keys: { "728x90": "<key>", ... }, reuse: bool } */
(function () {
  if (window.__adfixLoaded) return; window.__adfixLoaded = true;
  var C = window.__ADFIX || {}; var KEYS = C.keys || {};
  // Some ad scripts try to send the whole page to another site without any click (visitor loses the tool).
  // Block cross-site navigations of this tab that the visitor did not start. Clicked links still work,
  // and ads that open a new tab/window are not affected.
  if (C.guardNav !== false && window.navigation && navigation.addEventListener) {
    navigation.addEventListener('navigate', function (e) {
      try {
        if (e.userInitiated || !e.cancelable || e.navigationType === 'traverse' || e.navigationType === 'reload') return;
        var u = new URL(e.destination.url);
        if (u.origin !== location.origin) { e.preventDefault(); if (window.console) console.info('[adfix] blocked automatic redirect to ' + u.origin); }
      } catch (_) {}
    });
  }
  var used = {}; var queue = []; var busy = false;
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; }
  function sizeOf(el) {
    var s = el.getAttribute('data-adfix-size');
    if (s) return s;
    var m0 = (el.getAttribute('data-ad-slot') || '').match(/(\d+x\d+)/); if (m0) return m0[1];
    var f = el.querySelector('iframe'); if (!f) return null;
    var m = (f.getAttribute('src') || '').match(/\/ads\/units\/(\d+x\d+)/); if (m) return m[1];
    var w = f.getAttribute('width'), h = f.getAttribute('height'); return (w && h) ? (w + 'x' + h) : null;
  }
  function pump() {
    if (busy || !queue.length) return; busy = true;
    var job = queue.shift(); var wh = job.size.split('x'); var w = +wh[0], h = +wh[1];
    var holder = document.createElement('div');
    holder.className = 'adfix-holder';
    holder.style.cssText = 'width:' + w + 'px;height:' + h + 'px;max-width:100%;overflow:hidden;margin:0 auto;';
    job.el.appendChild(holder);
    window.atOptions = { key: job.key, format: 'iframe', height: h, width: w, params: {} };
    var s = document.createElement('script');
    s.src = 'https://www.highrevenueformat.com/' + job.key + '/invoke.js';
    // Sandbox the banner iframe that invoke.js creates, so a creative cannot redirect the whole page.
    var origCreate = document.createElement;
    if (C.sandbox !== false) {
      document.createElement = function (tag) {
        var el = origCreate.apply(document, arguments);
        if (String(tag).toLowerCase() === 'iframe') el.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms');
        return el;
      };
    }
    var done = function () { document.createElement = origCreate; setTimeout(function () { busy = false; pump(); }, 150); };
    s.onload = done; s.onerror = done; holder.appendChild(s);
  }
  function scan() {
    var nodes = document.querySelectorAll(C.selector || '.ad-slot, [data-adfix-size]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]; if (el.getAttribute('data-adfix') ) continue;
      var size = sizeOf(el); if (!size) continue;
      if (!visible(el)) continue;                    // only mount what the visitor can see
      // a horizontal banner wider than its slot (phones): use the largest horizontal size that fits
      var avail = el.getBoundingClientRect().width;
      var sw = +size.split('x')[0], sh = +size.split('x')[1];
      if (sw > avail + 1 && sw > sh) {
        var fits = ['728x90', '468x60', '320x50'].filter(function (z) { return +z.split('x')[0] <= avail + 1 && KEYS[z]; });
        if (fits.length) size = fits[0];
      }
      if (+size.split('x')[0] > avail + 1) { el.setAttribute('data-adfix', 'empty'); el.classList.add('adfix-empty'); continue; } // would be cut off
      var key = el.getAttribute('data-adfix-key') || KEYS[size];
      el.setAttribute('data-adfix', 'seen');
      var fr = el.querySelector('iframe');
      if (fr && !fr.classList.contains('adfix-keep')) { fr.style.display = 'none'; try { fr.src = 'about:blank'; } catch (e) {} }
      if (!key || (used[key] && !C.reuse)) {          // no free ad unit for this spot: collapse it
        el.setAttribute('data-adfix', 'empty'); el.classList.add('adfix-empty'); continue;
      }
      used[key] = (used[key] || 0) + 1; el.setAttribute('data-adfix', 'mounted');
      queue.push({ el: el, key: key, size: size });
    }
    pump();
  }
  var t = null; function later() { clearTimeout(t); t = setTimeout(scanAll, 300); }
  function addExtras() {
    (C.extra || []).forEach(function (x, i) {
      if (document.getElementById('adfix-x' + i)) return;
      var anchor = x.anchor ? document.querySelector(x.anchor) : document.body; if (!anchor) return;
      var d = document.createElement('div'); d.id = 'adfix-x' + i;
      d.className = 'adfix-slot ' + (x.cls || ''); d.setAttribute('aria-label', 'Advertisement');
      d.setAttribute('data-adfix-size', x.size); if (x.key) d.setAttribute('data-adfix-key', x.key);
      if (x.where === 'before') anchor.parentNode.insertBefore(d, anchor);
      else if (x.where === 'after') anchor.parentNode.insertBefore(d, anchor.nextSibling);
      else if (x.where === 'prepend') anchor.insertBefore(d, anchor.firstChild);
      else anchor.appendChild(d);
    });
  }
  function scanAll() { addExtras(); scan(); }
  function start() {
    setTimeout(scanAll, 800);
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', later);
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
