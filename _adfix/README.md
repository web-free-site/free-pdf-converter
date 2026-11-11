# ad-sites-fix (2026-11-11, Kigali)

Root cause, all 3 sites: Adsterra banners were wrapped in an extra same-origin iframe
(/ads/units/<size>/ on the word counter; srcdoc or document.write iframes on QR and PDF). Inside that wrapper,
invoke.js loads but never fills, so the slots stay empty. Inline in the page, the same keys fill. (Tested in a real Chrome.)

common/adfix.js + adfix.css: the client loader. It
 - mounts each visible slot's banner inline, one at a time (because of the global atOptions)
 - picks a smaller horizontal size on phones; hides slots that would be cut off
 - sandboxes the banner iframe
 - blocks automatic cross-site redirects of the tab, which happen without a click
   (seen in tests: banner invoke.js on mobile injects an aqml.org script that redirects the top page)
 - adds extra slots from config (side rails at >=1520px, QR footer)

<site>/worker.js: a Worker that serves /__adfix/*, injects the loader into <head> through HTMLRewriter, and removes
the wrapper's invoke.js. The PDF worker also replaces the CSP (adds https: to script/connect/img/frame/style/font,
plus wss: for connect) and moves the popunder script to the end of <body> (the appendChild-on-null fix).
Ad keys are in ADFIX_CFG at the top of each worker.js.

Needed assets config (wrangler.toml [assets]):
  word counter: run_worker_first = ["/*", "!/_next/*"], html_handling auto-trailing-slash, not_found none
  QR:           run_worker_first = ["/*","!/assets/qr-libs-*","!/assets/*.css","!/favicon.svg"], SPA
  PDF:          run_worker_first = true (unchanged), keep the existing _headers file
build.py regenerates worker.js from common/ (keys are inside it).
Tools/screens: tools/ (puppeteer scripts), shots/.
