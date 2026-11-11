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

K_WC={'728x90': '0d6df8563c5d8a624e0d31b45c4c4c1f', '320x50': 'e70a1500095921322b36beed5e0d2f21', '160x300': 'ab0903299c7bc11fd8411ffc068cfd0d', '160x600': 'bcc336dd9890ecce12790dfe47f053ac', '300x250': 'e0900dbae2d68e0f3bd1242b5277d897', '468x60': '27d547760dd32bb4722eead7a1e6f713'}
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

K_QR={'728x90': '554caa81b537454383b512e8c3ef5eb5', '160x600': '85e8a3d16d136647176693c7dcfe7ee8', '160x300': 'c0f7ac05ed1ab1a096e7fd67d00581a7', '300x250': '920434e478abde19bbcb22cb49437906', '468x60': '43e928c9c5d63bed41a481f9bffdb981', '320x50': '75b9d701d102e29d9e1c47330ff98220'}
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

K_PDF={'728x90': '5283bd2b5651ed29b740fd9cc6cf0829', '468x60': 'f0847b970c8514cd6550c2d89245dbb2', '300x250': 'f21ee4f8302fc794390db577916f71e5', '160x600': 'c18fdea92b0e33241b2a8a519eb6065c', '160x300': 'af38b71c65d63202d6cf8841527a1861', '320x50': '10ca6c2fb83967a7598a2680f98fdadc'}
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

K_CALC={"728x90":"d733edfba583cf4e20028e73075fc4ac","468x60":"90864cbda48c48ef45197597f212fb7c","300x250":"b8f5da038e70124dbbd97c603afe4d7c","160x600":"f620e6537d3643eb71e3884af17257a8","160x300":"3ba66119743e526fddb5646c29d7127e","320x50":"8e36689e552091d18c8651794c88eba5"}
worker('free-online-calculator', {"reuse":True,"keys":K_CALC,"extra":[
  {"size":"160x600","cls":"adfix-rail adfix-rail-left"},
  {"size":"160x600","cls":"adfix-rail adfix-rail-right"}]}, r'''
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const a = adfixAsset(url); if (a) return a;
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

K_IMG={"728x90":"5318c4cbef8228f276629febacccaa24","468x60":"493bf3e75e071ce4fd2c79c9ad0f246c","300x250":"46dcac14381fabc3f7fd172aee974b9f","160x600":"5b936e44448bac2054bdfd748680c404","160x300":"a350d508eba443868807b8a57d67a148","320x50":"ff6628f6a49a22aecd6da0e0f3c324e9"}
worker('free-image-resizer', {"reuse":True,"keys":K_IMG,"extra":[
  {"size":"160x600","cls":"adfix-rail adfix-rail-left"},
  {"size":"160x600","cls":"adfix-rail adfix-rail-right"}]}, r'''
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const a = adfixAsset(url); if (a) return a;
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
print('built')

