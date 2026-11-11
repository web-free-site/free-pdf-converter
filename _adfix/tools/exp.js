const puppeteer = require('puppeteer-core');
(async () => {
  const [,,url,mode,out]=process.argv;
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:false, args:['--no-sandbox','--user-data-dir=/tmp/pp-exp-'+mode]});
  const page = await browser.newPage();
  const logs=[];
  page.on('console', m=>{ if(m.type()==='error') logs.push(`[${m.type()}] ${m.text().slice(0,160)}`)});
  await page.setRequestInterception(true);
  page.on('request', async r => {
    if (r.url()===url && mode!=='orig') {
      const resp = await fetch(url); let h = await resp.text();
      if (mode==='inline') h = h.replace(/<iframe title="Advertisement" src="\/ads\/units\/728x90\/"[^>]*><\/iframe>/, '<div id="inl"><script>atOptions={key:"5c9209a74e583647d1cf22533f4a67ec",format:"iframe",height:90,width:728,params:{}};<\/script><script src="https://www.highrevenueformat.com/5c9209a74e583647d1cf22533f4a67ec/invoke.js"><\/script></div>');
      if (mode==='nosandbox') h = h.replace(/ sandbox="[^"]*"/g,'');
      if (mode==='popups') h = h.replace(/ sandbox="[^"]*"/g,' sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"');
      r.respond({status:200, contentType:'text/html; charset=utf-8', body:h});
    } else r.continue();
  });
  await page.setViewport({width:1280,height:900});
  await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(e=>logs.push('goto '+e.message));
  await new Promise(r=>setTimeout(r,10000));
  for (const f of page.frames()) { let h=''; try{ h = await f.evaluate(()=>document.body? document.body.innerHTML.replace(/\s+/g,' ').slice(0,140):'nobody'); }catch(e){h='(xo)'} console.log('FRAME', f.url().slice(0,90), '=>', h); }
  console.log('TOP', page.url()); console.log(logs.join('\n'));
  await page.screenshot({path:out});
  await browser.close();
})();
