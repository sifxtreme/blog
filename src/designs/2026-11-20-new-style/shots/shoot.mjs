import { chromium } from 'playwright';
const base='/Users/asifahmed/code/blog/src/designs/2026-11-20-new-style';
const dirs=['1-776-family','2-seal-forward','3-receipt-ledger','3b-ledger-navy-gold'];
const b=await chromium.launch();
for(const d of dirs)for(const p of ['home','post'])for(const [n,w,h] of [['desktop',1280,900],['phone',390,844]]){
 const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 await pg.goto(`file://${base}/${d}/${p}.html`);await pg.waitForTimeout(400);
 await pg.screenshot({path:`${base}/shots/${d.startsWith('3b')?'3b':d.split('-')[0]}-${p}-${n}.png`,fullPage:true,...(n==='desktop'&&p==='home'?{}:{})});
 await pg.close();}
await b.close();
