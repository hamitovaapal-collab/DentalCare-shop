import {test,expect} from '@playwright/test';
const routes=['/','/about','/services','/shop',...Array.from({length:8},(_,i)=>`/shop/p${i+1}`),'/cart','/checkout','/favorites','/booking','/reviews','/contact','/login','/register','/forgot','/reset-password','/profile','/orders','/admin','/missing-page'];
for(const width of [390,1440])for(const theme of ['light','dark'])test(`built production assets render all 26 routes at ${width}px in ${theme}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:900});await page.addInitScript(theme=>localStorage.setItem('theme',theme),theme);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 for(const route of routes){await page.goto(route);await expect(page.locator('main')).not.toBeEmpty();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth),route).toBeLessThanOrEqual(width);}
 expect(errors).toEqual([]);
});
test('production bundles and actual API share one origin',async({page,request})=>{
 await page.goto('/shop');const source=await page.content();expect(source).toContain('/assets/');expect(source).not.toContain('/@vite/client');
 const r=await request.get('/api/health');expect(r.status()).toBe(200);const body=await r.json();expect(body.ok).toBe(true);expect(Object.values(body.configuration).every(x=>typeof x==='boolean')).toBe(true);
 const bad=await request.post('/api/booking',{data:{}});expect(bad.status()).toBe(400);expect(await bad.json()).toEqual({error:'validation'});
 const missing=await request.get('/api/does-not-exist');expect(missing.status()).toBe(404);expect(await missing.json()).toEqual({error:'not_found'});
 const method=await request.get('/api/order');expect(method.status()).toBe(405);
 const asset=await request.get('/assets/does-not-exist.js');expect(asset.status()).toBe(404);
});
test('actual compiled UI can add, change, remove and enter checkout',async({page})=>{
 await page.goto('/shop/p1');await page.getByRole('button',{name:'Buy now',exact:true}).click();await expect(page).toHaveURL(/cart/);const row=page.locator('.row').first();await row.getByRole('button',{name:'+',exact:true}).click();await expect(row.locator('.qty span')).toHaveText('2');await row.getByRole('button',{name:'−',exact:true}).click();await expect(row.locator('.qty span')).toHaveText('1');await page.getByRole('button',{name:'Checkout',exact:true}).click();await expect(page).toHaveURL(/checkout/);await page.getByRole('link',{name:'Send via WhatsApp'}).click();await expect(page.locator('input.bad')).toHaveCount(4);await page.goto('/cart');await page.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.locator('.empty')).toContainText('Your cart is empty');
});
