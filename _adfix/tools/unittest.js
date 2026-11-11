const puppeteer = require('puppeteer-core');
(async () => {
  const [,,url,mode,out]=process.argv;
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox']});
  const page = await browser.newPage();
  const logs=[];
  page.on('console', m=>logs.push(`[${m.type()}] ${m.text().slice(0,200)}`));
  page.on('pageerror', e=>logs.push(`[pageerror] ${e.message}`));
  page.on('request', r=>logs.push(`[req] ${r.resourceType()} ${r.url().slice(0,130)}`));
  if (mode==='body') {
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (r.url()===url) {
        const k = url.match(/units\/(\d+)x(\d+)/);
        const keys={'728x90':'0d6df8563c5d8a624e0d31b45c4c4c1f'};
        const key=keys[k[1]+'x'+k[2]];
        r.respond({status:200, contentType:'text/html', body:`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"><script>atOptions={key:"${key}",format:"iframe",height:${k[2]},width:${k[1]},params:{}};</script><script src="https://www.highrevenueformat.com/${key}/invoke.js"></script></body></html>`});
      } else r.continue();
    });
  }
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'); await page.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
  await page.setViewport({width:800,height:200});
  await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(e=>logs.push('goto '+e.message));
  await new Promise(r=>setTimeout(r,8000));
  console.log(await page.evaluate(()=>document.documentElement.outerHTML.slice(0,2500)));
  console.log(logs.join('\n'));
  await page.screenshot({path:out});
  await browser.close();
})();
