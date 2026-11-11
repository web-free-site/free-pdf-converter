const SECURITY_HEADERS = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url.origin);
      response = await env.ASSETS.fetch(
        new Request(indexUrl.toString(), request)
      );
    }

    if (url.pathname.startsWith('/libreoffice-wasm/')) {
      const upstream = new URL(
        url.pathname + url.search,
        'https://www.bentopdf.com'
      );
      response = await fetch(upstream.toString(), {
        headers: { 'User-Agent': 'FreePDFConverter-Worker/1.0' },
      });
    }

    return withSecurityHeaders(response);
  },
};
