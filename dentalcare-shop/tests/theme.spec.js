import {test, expect} from '@playwright/test';
const routes=['/','/about','/services','/shop',...Array.from({length:8},(_,i)=>`/shop/p${i+1}`),'/cart','/checkout','/favorites','/booking','/reviews','/contact','/login','/register','/forgot','/reset-password','/profile','/orders','/admin','/missing-page'];
for(const width of [320,768,1440])for(const theme of ['light','dark'])test(`all pages use a consistent ${theme} theme at ${width}px`,async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width,height:900});
 await page.addInitScript(({theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('lang','ru')},{theme});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 for(const route of routes){
  await page.goto(route);await expect(page.locator('main')).not.toBeEmpty();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  const state=await page.evaluate(()=>{const style=getComputedStyle(document.body);const root=getComputedStyle(document.documentElement);return {width:innerWidth,scroll:document.documentElement.scrollWidth,background:style.backgroundColor,color:style.color,colorScheme:root.colorScheme,primary:root.getPropertyValue('--primary').trim(),button:document.querySelector('main .btn:not(.ghost-d):not(.light-b):not(.whatsapp):not(.telegram):not(.ghost)')?getComputedStyle(document.querySelector('main .btn:not(.ghost-d):not(.light-b):not(.whatsapp):not(.telegram):not(.ghost)')).backgroundColor:null};});
  expect(state.scroll,route).toBeLessThanOrEqual(width);expect(state.colorScheme).toBe(theme);expect(state.background).toBe(theme==='dark'?'rgb(16, 30, 28)':'rgb(247, 249, 247)');expect(state.color).toBe(theme==='dark'?'rgb(237, 245, 239)':'rgb(24, 47, 42)');
  if(state.button)expect(state.button,route).toBe(theme==='dark'?'rgb(188, 225, 189)':'rgb(27, 97, 80)');
 }
 expect(errors).toEqual([]);
});
for(const width of [320,390,768,1440])test(`Day and Night are idempotent, persist and remain synchronized at ${width}px`,async({page,context})=>{
 await page.setViewportSize({width,height:844});await page.goto('/shop');
 for(const [label,value] of [['Day','light'],['Night','dark'],['Day','light']]){
  const control=page.getByRole('button',{name:label,exact:true});await control.click();await control.click();await expect(page.locator('html')).toHaveAttribute('data-theme',value);await expect(control).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>localStorage.getItem('theme'))).toBe(value);await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',value);await expect(control).toHaveAttribute('aria-pressed','true');
 }
 await page.goto('/contact');await page.getByRole('button',{name:'Night',exact:true}).click();await page.goto('/booking');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 const colors=await page.locator('main form, main input, main select, main textarea').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).backgroundColor));expect(colors.length).toBeGreaterThan(4);expect(colors.every(color=>color!=='rgb(255, 255, 255)')).toBe(true);
 await page.goto('/');await page.locator('button.svc').first().click();await expect(page.locator('.mbox')).toHaveCSS('background-color','rgb(24, 43, 39)');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Open chat',exact:true}).click();await expect(page.locator('.bot')).toHaveCSS('background-color','rgb(24, 43, 39)');
});
test('invalid stored theme falls back to the system preference',async({page})=>{await page.emulateMedia({colorScheme:'dark'});await page.addInitScript(()=>localStorage.setItem('theme','invalid-theme'));await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>localStorage.getItem('theme'))).toBe('dark');});
test('palette provides readable text and button contrast in both themes',async({page})=>{
 await page.goto('/shop');
 for(const [label,theme] of [['Day','light'],['Night','dark']]){
  await page.getByRole('button',{name:label,exact:true}).click();
  const colors=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--text','--muted','--bg','--surface','--surface-alt','--primary','--on-primary'].map(k=>[k,s.getPropertyValue(k).trim()]));});
  const luminance=hex=>{const values=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722};
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  for(const bg of ['--bg','--surface','--surface-alt'])for(const text of ['--text','--muted'])expect(contrast(colors[text],colors[bg]),`${theme} ${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors['--on-primary'],colors['--primary'])).toBeGreaterThanOrEqual(4.5);
 }
});
test('catalog deep links, search and filters survive reload and can be reset',async({page})=>{
 await page.goto('/shop?category=whitening&q=toothpaste&sort=asc');await expect(page.locator('.pc')).toHaveCount(1);await page.reload();await expect(page.locator('.pc')).toHaveCount(1);await page.getByRole('button',{name:'Reset filters',exact:true}).click();await expect(page.locator('.pc')).toHaveCount(8);
 await page.locator('.header-search input').fill('Sonic');await page.locator('.header-search button').click();await expect(page).toHaveURL(/q=Sonic/);await expect(page.locator('.pc')).toHaveCount(1);
});
test('services page opens every detail and links to the selected booking service',async({page})=>{
 await page.goto('/services');for(let i=0;i<6;i++){await page.locator('button.svc').nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');}await page.locator('button.svc').nth(4).click();await page.getByRole('dialog').getByRole('link').click();await expect(page).toHaveURL(/booking\?service=4/);expect(await page.locator('[name=service]').inputValue()).not.toBe('');
});
test('product image zoom is a working accessible modal',async({page})=>{await page.goto('/shop/p1');await page.getByRole('button',{name:'View image',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'View image',exact:true})).toBeFocused();});
test('unavailable product images show a clear fallback without breaking the page',async({page})=>{await page.route('**/images/s4.jpg',r=>r.abort());await page.goto('/shop/p1');await expect(page.locator('.product-image-button .image-placeholder')).toBeVisible();await expect(page.getByRole('button',{name:'Add to cart',exact:true})).toBeEnabled();});
for(const [theme,label] of [['light','Day'],['dark','Night']])test(`contact buttons retain readable hover states in ${theme}`,async({page})=>{
 await page.goto('/contact');await page.getByRole('button',{name:label,exact:true}).click();
 for(const button of await page.locator('main .btn').all()){
  await button.hover();const {foreground,background}=await button.evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
  const lum=rgb=>{const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
  const a=lum(foreground),b=lum(background);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05),await button.textContent()).toBeGreaterThanOrEqual(4.5);
 }
});
test('success notification never blocks immediate checkout on a phone',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/shop/p1');await page.getByRole('button',{name:'Buy now',exact:true}).click();await expect(page.locator('.toast')).toBeVisible();const toast=await page.locator('.toast').boundingBox();const checkout=page.getByRole('button',{name:'Checkout',exact:true});const button=await checkout.boundingBox();expect(toast.y+toast.height<=button.y||toast.y>=button.y+button.height).toBe(true);await checkout.click();await expect(page).toHaveURL(/checkout/);
});
test('manual review selection pauses autoplay until explicitly resumed',async({page})=>{test.setTimeout(20000);await page.goto('/');const dots=page.locator('.dots button');expect(await dots.count()).toBeGreaterThan(1);await dots.first().click();await expect(page.getByRole('button',{name:'Resume reviews',exact:true})).toBeVisible();await page.waitForTimeout(5200);await expect(dots.first()).toHaveClass('on');await page.getByRole('button',{name:'Resume reviews',exact:true}).click();await expect(dots.nth(1)).toHaveClass('on',{timeout:6500});await page.getByRole('button',{name:'Pause reviews',exact:true}).click();});
