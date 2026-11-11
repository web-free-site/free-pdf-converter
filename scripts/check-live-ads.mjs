import { chromium } from 'playwright';

const url =
  process.env.CHECK_URL || 'https://free-pdf-converter.web-free.site/merge-pdf';

async function check(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page
    .waitForSelector('[data-ad-slot] iframe', { timeout: 30000 })
    .catch(() => null);
  await page.waitForTimeout(4000);
  const data = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('[data-ad-slot]')].map(
      (el) => ({
        slot: el.dataset.adSlot,
        iframes: el.querySelectorAll('iframe').length,
        height: el.offsetHeight,
        hasAdChildren: el.children.length > 0,
      })
    );
    const native = document.getElementById('adsterra-native-host');
    const smart = document.querySelector('[data-smartlink-slot]');
    return {
      slots,
      popunder: Boolean(document.querySelector('script[data-fpc-popunder]')),
      social: Boolean(document.querySelector('script[data-fpc-social]')),
      nativeFilled: Boolean(
        native?.querySelector('[id^="container-"]')?.childElementCount
      ),
      smartHref: smart?.getAttribute('href') || '',
      title: document.title,
    };
  });
  await browser.close();
  return { label, ...data, errors: errors.slice(0, 8) };
}

const desktop = await check({ width: 1280, height: 900 }, 'desktop');
const mobile = await check({ width: 390, height: 844 }, 'mobile');
console.log(JSON.stringify({ desktop, mobile }, null, 2));
