const puppeteer = require('puppeteer-core');
(async () => {
  const url = process.argv[2];
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox']});
  const page = await browser.newPage();
  const logs=[]; page.on('console', m=>logs.push(`[${m.type()}] ${m.text().slice(0,250)}`));
  page.on('requestfailed', r=>logs.push(`[reqfail] ${r.url().slice(0,120)} ${r.failure()?.errorText}`));
  page.on('response', r=>{ const u=r.url(); if(!u.includes('workers.dev')) logs.push(`[resp] ${r.status()} ${u.slice(0,140)}`)});
  await page.setViewport({width:1280,height:900});
  await page.goto(url,{waitUntil:'networkidle2',timeout:45000}).catch(e=>logs.push('goto '+e.message));
  await new Promise(r=>setTimeout(r,8000));
  for (const f of page.frames()) { let h=''; try{ h = await f.evaluate(()=>document.body? document.documentElement.outerHTML.slice(0,1500):'nobody'); }catch(e){h='ERR '+e.message} console.log('FRAME', f.url().slice(0,100), '=>', h.replace(/\s+/g,' ')); }
  console.log(logs.join('\n'));
  await page.screenshot({path:process.argv[3]});
  await browser.close();
})();
