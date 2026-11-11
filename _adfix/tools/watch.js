const puppeteer = require('puppeteer-core');
(async () => {
  const url=process.argv[2];
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:false, args:['--no-sandbox','--user-data-dir=/tmp/pp-w']});
  const page = await browser.newPage();
  const c = await page.createCDPSession(); await c.send('Network.enable');
  const reqs={};
  c.on('Network.requestWillBeSent', e=>{ if(e.request.url.includes('/watch.')) { console.log('REQ', e.type, e.request.url.slice(0,80), JSON.stringify(e.request.headers).slice(0,400)); if(e.redirectResponse) console.log('  REDIR status', e.redirectResponse.status, JSON.stringify(e.redirectResponse.headers).slice(0,500)); }});
  c.on('Network.responseReceived', e=>{ if(e.response.url.includes('/watch.')) console.log('RESP', e.response.status, e.response.url.slice(0,80), JSON.stringify(e.response.headers).slice(0,600)); });
  c.on('Network.requestWillBeSentExtraInfo', e=>{ if (e.headers && (e.headers[':path']||'').includes('watch')) console.log('EXTRA', JSON.stringify(e.headers).slice(0,500)); });
  c.on('Network.responseReceivedExtraInfo', e=>{ console.log('RXI', e.statusCode, JSON.stringify(e.headers).slice(0,400)); });
  await page.setViewport({width:1280,height:900});
  await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(()=>{});
  await new Promise(r=>setTimeout(r,6000));
  await browser.close();
})();
