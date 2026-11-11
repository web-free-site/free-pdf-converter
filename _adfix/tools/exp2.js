const puppeteer = require('puppeteer-core');
(async () => {
  const base='https://free-word-counter.gentillenoir075.workers.dev';
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:false, args:['--no-sandbox','--user-data-dir=/tmp/pp-exp2']});
  const K='0d6df8563c5d8a624e0d31b45c4c4c1f';
  const pages = {
    '/t-inline/': `<!DOCTYPE html><html><body><h1>Test</h1><div id="slot"><script>atOptions={key:"${K}",format:"iframe",height:90,width:728,params:{}};</script><script src="https://www.highrevenueformat.com/${K}/invoke.js"></script></div><p>after</p></body></html>`,
    '/t-nested/': `<!DOCTYPE html><html><body><h1>Test</h1><iframe src="/ads/units/728x90/" width="728" height="90" style="border:0"></iframe><p>after</p></body></html>`,
    '/t-nested-sb/': `<!DOCTYPE html><html><body><h1>Test</h1><iframe src="/ads/units/728x90/" width="728" height="90" style="border:0" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe><p>after</p></body></html>`,
  };
  for (const [p,html] of Object.entries(pages)) {
    const page = await browser.newPage();
    const logs=[];
    page.on('console', m=>{ if(m.type()==='error') logs.push(m.text().slice(0,120))});
    await page.setRequestInterception(true);
    page.on('request', r => { if (r.url()===base+p) r.respond({status:200,contentType:'text/html',body:html}); else r.continue(); });
    await page.setViewport({width:1000,height:400});
    await page.goto(base+p,{waitUntil:'networkidle2',timeout:40000}).catch(()=>{});
    await new Promise(r=>setTimeout(r,9000));
    const info=[]; for (const f of page.frames()) info.push(f.url().slice(0,70));
    console.log(p, 'TOP', page.url().slice(0,80), 'frames', info.length, JSON.stringify(info), 'errors', logs.length, logs.filter(x=>x.includes('watch')).length);
    await page.screenshot({path:`../shots/exp2${p.replace(/\//g,'_')}.png`});
    await page.close();
  }
  await browser.close();
})();
