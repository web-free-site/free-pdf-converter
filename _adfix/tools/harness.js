// node harness.js <url> <tag> <injectfile.json> [widths]
const puppeteer = require('puppeteer-core'); const fs=require('fs');
(async () => {
  const [,,url,tag,inj,ws]=process.argv; const cfg = inj? JSON.parse(fs.readFileSync(inj,'utf8')):null;
  const widths=(ws||'1600,1280,390').split(',').map(Number);
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:false, args:['--no-sandbox','--user-data-dir=/tmp/pp-h-'+tag]});
  const out={};
  for (const w of widths) {
    const page = await browser.newPage(); const logs=[];
    page.on('console', m=>{ if(['error'].includes(m.type())) logs.push(m.text().slice(0,220))});
    page.on('pageerror', e=>logs.push('[pageerror] '+e.message.slice(0,200)));
    if (cfg) { await page.setRequestInterception(true);
      page.on('request', async r => { try {
        if (r.isNavigationRequest() && r.url().startsWith(url.split('/').slice(0,3).join('/')) && r.frame()===page.mainFrame()) {
          const resp = await fetch(r.url()); let h = await resp.text(); const hd={}; resp.headers.forEach((v,k)=>{ if(!['content-encoding','content-length'].includes(k)) hd[k]=v; });
          for (const [a,b] of cfg.replace) h = h.replace(new RegExp(a), b);
          if (cfg.csp) hd['content-security-policy']=cfg.csp;
          return r.respond({status:resp.status, headers:hd, body:h}); }
        if (cfg.files && cfg.files[new URL(r.url()).pathname]) { const f=cfg.files[new URL(r.url()).pathname]; return r.respond({status:200, contentType:f[0], body:fs.readFileSync(f[1],'utf8')}); }
        r.continue(); } catch(e){ try{r.continue()}catch{} } }); }
    { const c = await page.createCDPSession(); await c.send('Network.enable'); await c.send('Page.enable');
      c.on('Network.requestWillBeSent', e=>{ if(e.type==='Document' && e.frameId===page.mainFrame()._id && !e.request.url.includes('workers.dev')) logs.push('TOPNAV '+e.request.url.slice(0,80)+' initiator='+JSON.stringify(e.initiator).slice(0,700)); });
      c.on('Page.frameRequestedNavigation', e=>{ logs.push('FRN '+JSON.stringify(e).slice(0,300)); }); }
    await page.setViewport({width:w,height:w<500?844:1000, isMobile:w<500, hasTouch:w<500});
    if (w<500) await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36');
    await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(e=>logs.push('goto '+e.message));
    await new Promise(r=>setTimeout(r,12000));
    const slots = await page.evaluate(()=>[...document.querySelectorAll('.ad-slot,[data-adfix-size],.ad-container')].map(e=>{const r=e.getBoundingClientRect(); const f=e.querySelector('.adfix-holder iframe, [id^=container-] *'); return `${e.getAttribute('data-ad-slot')||e.getAttribute('data-adfix-size')||e.className.slice(0,30)} adfix=${e.getAttribute('data-adfix')} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} filled=${!!f}`}));
    await page.screenshot({path:`../shots/${tag}-${w}.png`, fullPage:true});
    out[w]={top:page.url(), slots, errors:logs};
    await page.close();
  }
  console.log(JSON.stringify(out,null,1)); await browser.close();
})();
