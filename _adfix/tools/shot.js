const puppeteer = require('puppeteer-core');
(async () => {
  const [,, url, tag, outdir] = process.argv;
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-dev-shm-usage']});
  const res = {};
  for (const w of [1280, 390]) {
    const page = await browser.newPage();
    const logs = [];
    page.on('console', m => { if (['error','warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
    await page.setViewport({width:w, height: w===390?844:900, isMobile: w===390, deviceScaleFactor:1});
    await page.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
    await page.setUserAgent(w===390?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36');
    try { await page.goto(url, {waitUntil:'networkidle2', timeout:45000}); } catch(e){ logs.push('[goto] '+e.message); }
    await new Promise(r=>setTimeout(r,6000));
    const frames = []; for (const f of page.frames()) { try { frames.push(f.url().slice(0,90)+' => '+(await f.evaluate(()=>document.body?document.body.innerHTML.replace(/\s+/g,' ').slice(0,160):''))); } catch(e){ frames.push(f.url().slice(0,90)+' => (cross-origin)'); } }
    const slots = await page.evaluate(() => [...document.querySelectorAll('[data-ad-slot], .ad-container, [id^=container-]')].map(e => { const r=e.getBoundingClientRect(); return `${e.getAttribute('data-ad-slot')||e.id||e.className} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} vis=${getComputedStyle(e).display!=='none' && r.width>0}`; }));
    await page.screenshot({path:`${outdir}/${tag}-${w}.png`, fullPage:true});
    res[w] = {logs, slots, frames};
    await page.close();
  }
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})();
