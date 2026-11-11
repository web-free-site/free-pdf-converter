const puppeteer = require('puppeteer-core');
(async () => {
  const url=process.argv[2];
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:false, args:['--no-sandbox','--user-data-dir=/tmp/pp-who-'+Date.now()]});
  const page = await browser.newPage();
  const c = await page.createCDPSession(); await c.send('Network.enable');
  c.on('Network.requestWillBeSent', e=>{ if(e.request.url.includes('aqml.org')) { const fr=(e.initiator.stack&&e.initiator.stack.callFrames||[]).map(f=>f.url.slice(0,90)); let p=e.initiator.stack&&e.initiator.stack.parent; while(p){ fr.push(...p.callFrames.map(f=>'^'+f.url.slice(0,90))); p=p.parent;} console.log('AQML', e.request.url.slice(0,60), 'frame', e.frameId.slice(0,6), JSON.stringify([...new Set(fr)]).slice(0,600)); } });
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36');
  console.log('main frame', page.mainFrame()._id.slice(0,6));
  await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(()=>{});
  await new Promise(r=>setTimeout(r,8000)); console.log('TOP', page.url().slice(0,80));
  await browser.close();
})();
