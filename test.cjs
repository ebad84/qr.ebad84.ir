const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
(async () => {
const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: {width:1280,height:1000}, acceptDownloads:true });
const page = await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const network=[];page.on('request',r=>network.push(r.url()));
await page.goto('http://127.0.0.1:8765');
await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.locator('#st-status').innerText(),'READY');
assert.equal(await page.locator('#qr-branding').isChecked(),true);
fs.mkdirSync('/data/qr-project/qa',{recursive:true});
await page.screenshot({path:'/data/qr-project/qa/desktop-on.png',fullPage:true});
async function snapshot(name,expected) {
 const data = await page.evaluate(async()=>{
  const canvas=document.querySelector('#qr-canvas-wrap canvas');
  const ctx=canvas.getContext('2d');
  const alpha=[[0,0],[canvas.width-1,0],[0,canvas.height-1],[canvas.width-1,canvas.height-1]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);
  const svg=lastSVGData;
  const img=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});
  const raster=document.createElement('canvas');raster.width=img.width;raster.height=img.height;
  raster.getContext('2d').drawImage(img,0,0);URL.revokeObjectURL(url);
  return {width:canvas.width,height:canvas.height,alpha,png:canvas.toDataURL(),svg,svgPng:raster.toDataURL(),branded:document.getElementById('qr-branding').checked,status:document.getElementById('st-size').textContent};
 });
 assert.deepEqual(data.alpha,[0,0,0,0],name+' transparent corners');
 assert.equal(data.status,`${data.width}×${data.height}`);
 assert.equal(data.svg.includes('>qr.ebad84.ir\u{1F375}\u{1F4BB}</text>'),data.branded);
 assert.equal(data.height>data.width,data.branded);
 for(const [key,suffix] of [['png','png'],['svgPng','svg.png']]) fs.writeFileSync(`/data/qr-project/qa/${name}.${suffix}`,Buffer.from(data[key].split(',')[1],'base64'));
 fs.writeFileSync(`/data/qr-project/qa/${name}.svg`,data.svg);
 return {name,expected,width:data.width,height:data.height};
}
const cases=[];
for (const size of ['128','256','384','512','1024']) {
 await page.selectOption('#qr-size',size);
 for(const margin of ['4','8']) {
  await page.selectOption('#qr-margin',margin);
  for(const brand of [true,false]) {
   await page.locator('#qr-branding').setChecked(brand);
   cases.push(await snapshot(`url-${size}-m${margin}-${brand?'on':'off'}`,'https://example.com'));
  }
 }
}
await page.selectOption('#qr-size','256');await page.selectOption('#qr-margin','4');
for(const ecl of ['L','Q','H']){
 await page.selectOption('#qr-ecl',ecl);cases.push(await snapshot(`ecl-${ecl}`,'https://example.com'));
}
await page.selectOption('#qr-ecl','M');
for(const [type,fields,expected] of [
 ['text',{'qr-content':'Hello QR 2026'},'Hello QR 2026'],
 ['text',{'qr-content':'سلام محمدرضا'},'سلام محمدرضا'],
 ['text',{'qr-content':'Hello سلام 👋'},'Hello سلام 👋'],
 ['email',{'qr-content':'test@example.com','qr-email-subject':'Hello world'},'mailto:test@example.com?subject=Hello%20world'],
 ['phone',{'qr-content':'+989121234567'},'tel:+989121234567'],
 ['wifi',{'qr-wifi-ssid':'LabNetwork','qr-wifi-pass':'sample-test-password'},'WIFI:T:WPA;S:LabNetwork;P:sample-test-password;;']
]){
 await page.selectOption('#qr-type',type);
 for(const [id,value] of Object.entries(fields))await page.fill('#'+id,value);
 for(const brand of [true,false]){await page.locator('#qr-branding').setChecked(brand);cases.push(await snapshot(`${type}-${cases.length}`,expected));}
}
await page.selectOption('#qr-type','url');await page.fill('#qr-content','https://qr.ebad84.ir');await page.locator('#qr-branding').check();
// Actual downloads must match the preview, including rounded alpha corners.
let download=page.waitForEvent('download');await page.click('#btn-dl-png');await (await download).saveAs('/data/qr-project/qa/download.png');
assert.equal(fs.readFileSync('/data/qr-project/qa/download.png').toString('base64'),await page.evaluate(()=>document.querySelector('#qr-canvas-wrap canvas').toDataURL().split(',')[1]));
download=page.waitForEvent('download');await page.click('#btn-dl-svg');await (await download).saveAs('/data/qr-project/qa/download.svg');
assert.equal(fs.readFileSync('/data/qr-project/qa/download.svg','utf8'),await page.evaluate(()=>lastSVGData));
// Copy uses the same finished card, and print does not re-add branding when off.
await context.grantPermissions(['clipboard-write','clipboard-read']);
await page.click('#btn-copy');await page.waitForFunction(()=>document.getElementById('btn-copy').textContent==='COPIED!');
const copied=await page.evaluate(async()=>{const items=await navigator.clipboard.read();const b=await items[0].getType('image/png');return b.size;});
assert.ok(copied>0);
await page.locator('#qr-branding').uncheck();
const popupPromise=page.waitForEvent('popup');await page.click('#btn-print');const popup=await popupPromise;
await popup.waitForLoadState();assert.equal(await popup.locator('p').count(),0);assert.equal(await popup.locator('img').count(),1);await popup.close();
// Empty/error states invalidate both exports instead of keeping an old SVG.
await page.fill('#qr-content','');assert.equal(await page.locator('#st-status').innerText(),'WAITING');
assert.equal(await page.evaluate(()=>lastSVGData),'');assert.equal(await page.locator('#qr-canvas-wrap canvas').count(),0);
await page.screenshot({path:'/data/qr-project/qa/empty.png',fullPage:true});
await page.fill('#qr-content','x'.repeat(4000));assert.equal(await page.locator('#st-status').innerText(),'ERROR');assert.equal(await page.evaluate(()=>lastSVGData),'');
await page.screenshot({path:'/data/qr-project/qa/error.png',fullPage:true});
await page.fill('#qr-content','https://example.com');await page.locator('#qr-branding').check();
await page.setViewportSize({width:390,height:844});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.screenshot({path:'/data/qr-project/qa/mobile-on.png',fullPage:true});
await page.locator('#qr-branding').uncheck();await page.screenshot({path:'/data/qr-project/qa/mobile-off.png',fullPage:true});
await page.click('#theme-toggle');await page.waitForTimeout(500);await page.screenshot({path:'/data/qr-project/qa/mobile-dark.png',fullPage:true});
await page.selectOption('#qr-size','1024');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
assert.equal(errors.length,0,errors.join('\n'));
assert.equal(network.some(x=>!x.startsWith('http://127.0.0.1:8765')&&!x.startsWith('data:')&&!x.startsWith('blob:')),false);
fs.writeFileSync('/data/qr-project/qa/cases.json',JSON.stringify(cases));
console.log(JSON.stringify({browserCases:cases.length,pngSvgDownloads:'pass',copy:'pass',print:'pass',emptyAndError:'pass',mobileOverflow:false,externalRequests:false,browserErrors:errors}));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
