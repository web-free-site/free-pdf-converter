import json
JS=open('common/adfix.js').read(); CSS=open('common/adfix.css').read()
common = r'''
const ADFIX_JS = %s;
const ADFIX_CSS = %s;
const ADFIX_CFG = %s;
const HEAD_INJECT = '<link rel="stylesheet" href="/__adfix/adfix.css?v=3"/><script>window.__ADFIX=' + JSON.stringify(ADFIX_CFG) + '</script><script src="/__adfix/adfix.js?v=3" defer></script>';

function adfixAsset(url) {
  if (url.pathname === '/__adfix/adfix.js') return new Response(ADFIX_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  if (url.pathname === '/__adfix/adfix.css') return new Response(ADFIX_CSS, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  return null;
}
// Ask assets for a full response (no 304) so the injected version is always what the browser keeps.
function fresh(request) {
  const h = new Headers(request.headers); h.delete('if-none-match'); h.delete('if-modified-since');
  return new Request(request, { headers: h });
}
function withoutEtag(res) {
  const h = new Headers(res.headers); h.delete('etag'); h.delete('content-length');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
'''
def worker(name, cfg, body):
    src = '// %s worker — adds inline Adsterra banners (adfix). Backup of the previous version: /workspace/ad-sites-backup/%s/\n' % (name, name)
    src += common % (json.dumps(JS), json.dumps(CSS), json.dumps(cfg)) + body
    open(f'{name}/worker.js','w').write(src)

K_WC={"728x90":"5c9209a74e583647d1cf22533f4a67ec","320x50":"f1c44cf96bbc87227534c56600199bd6","160x300":"7e6d32ce6f43ab84081d3b432624aa85","160x600":"94ed6e50cbef67adf6251816ff0be2af","300x250":"6b8fcd5fd4bf0148d60c3df283add5b0","468x60":"78b9ee50f23ea9c2bdcf9fe8592c45b4"}
worker('free-word-counter', {"reuse":True,"keys":K_WC,"extra":[
  {"size":"160x600","cls":"adfix-rail adfix-rail-left"},
  {"size":"160x600","cls":"adfix-rail adfix-rail-right"}]}, r'''
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const a = adfixAsset(url); if (a) return a;
    // Old wrapper pages: Adsterra banners do not fill inside them, adfix renders the banners inline instead.
    if (url.pathname.startsWith('/ads/units/')) {
      return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
    }
    const res = await env.ASSETS.fetch(fresh(request));
    if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
    const out = new HTMLRewriter().on('head', { element(e) { e.append(HEAD_INJECT, { html: true }); } }).transform(res);
    return withoutEtag(out);
  },
};
''')

K_QR={"728x90":"ffd4b6797b163bf19094633187c70d21","160x600":"3fa6a2ec0ae111513980a5fd377ecf83","160x300":"9103448da4a6bf38e6aa0a129da7541f","300x250":"def55bcdb3d2fd936bcf60a66ab779e3","468x60":"3c78a587ae4716dfa0d5b5325d1ccc8e","320x50":"13b776b53cb4a8bb57ba08f3c3948b79"}
worker('free-qr-code-creator', {"reuse":True,"keys":K_QR,"extra":[
  {"size":"160x600","cls":"adfix-rail adfix-rail-left"},
  {"size":"160x600","cls":"adfix-rail adfix-rail-right"},
  {"anchor":"footer","where":"prepend","size":"728x90","cls":"adfix-footer adfix-footer-desktop"},
  {"anchor":"footer","where":"prepend","size":"320x50","cls":"adfix-footer adfix-footer-mobile"}]}, r'''
const BUNDLE_RE = /^\/assets\/index-[^/]+\.js$/;
const WRAPPER_INVOKE = '<script src="https://www.highrevenueformat.com/${d.key}/invoke.js"><\\/script>';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const a = adfixAsset(url); if (a) return a;
    const res = await env.ASSETS.fetch(fresh(request));
    const ct = res.headers.get('content-type') || '';
    if (BUNDLE_RE.test(url.pathname) && res.ok) {
      // the app's own wrapper iframe never fills; stop it from calling Adsterra (adfix shows the banner inline)
      const js = (await res.text()).split(WRAPPER_INVOKE).join('');
      const h = new Headers(res.headers); h.delete('etag'); h.delete('content-length');
      return new Response(js, { status: 200, headers: h });
    }
    if (!ct.includes('text/html')) return res;
    const out = new HTMLRewriter().on('head', { element(e) { e.append(HEAD_INJECT, { html: true }); } }).transform(res);
    return withoutEtag(out);
  },
};
''')

K_PDF={"728x90":"f17e7fec53856143482f3c086d690966","468x60":"f8bc7baee828ab02f16244167db70b07","300x250":"e1f1cb70790649bec9ca312d1c1571f2","160x600":"6a59be84817ecba8896369c313a49deb","160x300":"de04c23e5816d9792eaa445e6fff0877","320x50":"6fbb89c053686b648340aab4a05842bb"}
CSP=open('pdf-csp-new.txt').read().strip()
worker('free-pdf-converter', {"reuse":True,"keys":K_PDF,"selector":".adsterra-slot[data-ad-slot], [data-adfix-size]"}, r'''
const SECURITY_HEADERS = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};
// Same policy as _headers "/*", plus https: (and wss:) on script/connect/img/frame/style/font so the
// rotating Adsterra domains are not blocked. WASM/CDN rules are kept as they were.
const SITE_CSP = %s;
const MAIN_RE = /^\/assets\/main-[^/]+\.js$/;
const WRAPPER_INVOKE = '<script src="https://www.highrevenueformat.com/${t.key}/invoke.js"><\\/script>';

function finish(response, url) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  if (!(url.pathname === '/docs' || url.pathname.startsWith('/docs/'))) headers.set('Content-Security-Policy', SITE_CSP);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const a = adfixAsset(url); if (a) return a;
    const isDocs = url.pathname === '/docs' || url.pathname.startsWith('/docs/');
    let response = await env.ASSETS.fetch(isDocs ? request : fresh(request));
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url.origin);
      response = await env.ASSETS.fetch(new Request(indexUrl.toString(), fresh(request)));
    }
    if (url.pathname.startsWith('/libreoffice-wasm/')) {
      const upstream = new URL(url.pathname + url.search, 'https://www.bentopdf.com');
      response = await fetch(upstream.toString(), { headers: { 'User-Agent': 'FreePDFConverter-Worker/1.0' } });
      return finish(response, url);
    }
    if (isDocs) return finish(response, url);
    if (MAIN_RE.test(url.pathname) && response.ok) {
      const js = await response.text();
      if (js.includes(WRAPPER_INVOKE)) {
        const h = new Headers(response.headers); h.delete('etag'); h.delete('content-length');
        response = new Response(js.split(WRAPPER_INVOKE).join(''), { status: 200, headers: h });
      } else {
        response = new Response(js, { status: response.status, headers: response.headers });
      }
      return finish(response, url);
    }
    if (!(response.headers.get('content-type') || '').includes('text/html')) return finish(response, url);
    // Popunder: load it at the end of <body> (in <head> it runs before document.body exists -> appendChild on null)
    let pop = null;
    const out = new HTMLRewriter()
      .on('head', { element(e) { e.append(HEAD_INJECT, { html: true }); } })
      .on('script[data-fpc-popunder]', { element(e) { pop = e.getAttribute('src'); e.remove(); } })
      .on('body', { element(e) { e.onEndTag((end) => { if (pop) end.before('<script src="' + pop + '" data-fpc-popunder="1"></script>', { html: true }); }); } })
      .transform(response);
    return finish(withoutEtag(out), url);
  },
};
''' % json.dumps(CSP))
print('built')
