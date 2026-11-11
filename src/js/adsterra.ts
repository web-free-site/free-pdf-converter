declare const __SHOW_ADSTERRA__: boolean;

type BannerSpec = { key: string; width: number; height: number };

type AdsConfig = {
  popunderScript?: string;
  socialBarScript?: string;
  nativeInvokeScript?: string;
  nativeContainerId?: string;
  smartlinkUrl?: string;
  banners?: Record<string, BannerSpec>;
};

const BANNER_SIZES: Record<string, { w: number; h: number }> = {
  banner728x90: { w: 728, h: 90 },
  banner468x60: { w: 468, h: 60 },
  banner300x250: { w: 300, h: 250 },
  banner160x600: { w: 160, h: 600 },
  banner160x300: { w: 160, h: 300 },
  banner320x50: { w: 320, h: 50 },
};

function reservePlaceholder(el: HTMLElement, w: number, h: number) {
  el.style.minHeight = `${h}px`;
  el.style.maxWidth = '100%';
  el.style.width = `${Math.min(w, el.clientWidth || w)}px`;
  el.classList.add('adsterra-reserved');
}

function mountBannerIframe(
  container: HTMLElement,
  spec: BannerSpec,
  label: string
) {
  container.replaceChildren();
  reservePlaceholder(container, spec.width, spec.height);
  const iframe = document.createElement('iframe');
  iframe.title = label;
  iframe.width = String(spec.width);
  iframe.height = String(spec.height);
  iframe.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
  );
  iframe.setAttribute('loading', 'lazy');
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.style.marginInline = 'auto';
  iframe.style.maxWidth = '100%';
  container.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;
  const opts = JSON.stringify({
    key: spec.key,
    format: 'iframe',
    height: spec.height,
    width: spec.width,
    params: {},
  });
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;overflow:hidden"><script>atOptions=${opts};<\/script><script src="https://www.highrevenueformat.com/${spec.key}/invoke.js"><\/script></body></html>`
  );
  doc.close();
}

function mountNative(
  host: HTMLElement,
  nativeScript: string,
  containerId: string
) {
  if (host.dataset.mounted === '1') return;
  host.dataset.mounted = '1';
  const inner = document.createElement('div');
  inner.id = containerId;
  inner.className = 'adsterra-native-inner';
  host.appendChild(inner);
  const s = document.createElement('script');
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  s.src = nativeScript;
  s.setAttribute('data-fpc-ad', 'native');
  host.appendChild(s);
}

function wireSmartlink(url: string) {
  for (const el of document.querySelectorAll<HTMLAnchorElement>(
    '[data-smartlink-slot]'
  )) {
    el.href = url;
    el.textContent = 'Partner offer (opens in new tab)';
    el.target = '_blank';
    el.rel = 'sponsored noopener noreferrer';
  }
}

export async function initAdsterra(): Promise<void> {
  if (!__SHOW_ADSTERRA__) return;

  let config: AdsConfig = {};
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}ads.json`, {
      cache: 'no-cache',
    });
    config = (await res.json()) as AdsConfig;
  } catch {
    return;
  }

  const banners = config.banners ?? {};

  document.querySelectorAll<HTMLElement>('[data-ad-slot]').forEach((el) => {
    const slot = el.dataset.adSlot;
    if (!slot) return;
    const spec = banners[slot];
    const fallback = BANNER_SIZES[slot];
    if (fallback) reservePlaceholder(el, fallback.w, fallback.h);
    if (spec?.key) {
      mountBannerIframe(el, spec, 'Advertisement');
    }
  });

  if (config.smartlinkUrl) {
    wireSmartlink(config.smartlinkUrl);
  }

  const nativeHostExists = document.getElementById('adsterra-native-host');
  if (config.nativeInvokeScript && config.nativeContainerId) {
    if (nativeHostExists) {
      mountNative(
        nativeHostExists,
        config.nativeInvokeScript,
        config.nativeContainerId
      );
    } else {
      const attach = () => {
        const targets = [
          ...document.querySelectorAll('#results-area:not(.hidden)'),
          ...document.querySelectorAll('#download-btn:not(.hidden)'),
          ...document.querySelectorAll('[id^="download-"]:not(.hidden)'),
        ];
        const first = targets[0] as HTMLElement | undefined;
        if (!first || document.getElementById('adsterra-native-host')) return;
        const wrap = document.createElement('aside');
        wrap.id = 'adsterra-native-host';
        wrap.className = 'adsterra-native-results ad-container';
        wrap.setAttribute('aria-label', 'Sponsored');
        reservePlaceholder(wrap, 300, 250);
        const label = document.createElement('p');
        label.className = 'ad-sponsor-label';
        label.textContent = 'Sponsored';
        wrap.appendChild(label);
        first.parentElement?.insertBefore(wrap, first.nextSibling);
        mountNative(
          wrap,
          config.nativeInvokeScript!,
          config.nativeContainerId!
        );
      };
      attach();
      const obs = new MutationObserver(attach);
      obs.observe(document.body, {
        subtree: true,
        attributes: true,
        childList: true,
      });
    }
  }
}

if (typeof window !== 'undefined' && __SHOW_ADSTERRA__) {
  const boot = () => {
    void initAdsterra();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
