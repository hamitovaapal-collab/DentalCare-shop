import { test, expect } from '@playwright/test';
const routes = ['/', '/about', '/services', '/shop', ...Array.from({length:8},(_,i)=>`/shop/p${i+1}`), '/booking', '/reviews', '/contact', '/cart', '/favorites', '/checkout', '/login', '/register', '/forgot', '/reset-password', '/profile', '/orders', '/admin', '/missing-page'];
for (const width of [1440, 1024, 820, 390, 360, 320]) {
  test(`all routes render without JS errors or overflow at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:844});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    for (const route of routes) {
      await page.goto(route); await expect(page.locator('main')).not.toBeEmpty();
      await expect(page.locator('header .logo')).toBeVisible();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      expect(overflow,route).toBe(false);
      const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete && !i.naturalWidth).map(i=>i.src));
      expect(broken,route).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}
for(const width of [1440,390]) {
 test(`shopping, quantity, favorites, checkout, reload at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844}); await page.goto('/shop');
  await expect(page.locator('.pc')).toHaveCount(8);
  await page.getByRole('searchbox').fill('Sonic'); await expect(page.locator('.pc')).toHaveCount(1);
  await page.getByRole('searchbox').fill('not-a-product'); await expect(page.locator('.pc')).toHaveCount(0);
  await page.getByRole('searchbox').fill('');
  for(const category of ['Daily care','Whitening','Kids','All']){await page.getByRole('button',{name:category,exact:true}).click();await expect(page.locator('.pc').first()).toBeVisible();}
  await page.getByRole('combobox').selectOption('asc');
  const prices=await page.locator('.pf > b').allTextContents();const numbers=prices.map(p=>Number(p.replace(/[^\d]/g,''))); expect(numbers).toEqual([...numbers].sort((a,b)=>a-b));
  await page.getByRole('combobox').selectOption('desc');
  for(let i=0;i<8;i++){
   const card=page.locator('.pc').nth(i); await card.getByRole('button',{name:'Favorites'}).click(); await expect(card.getByRole('button',{name:'Favorites'})).toHaveAttribute('aria-pressed','true');
   await card.getByRole('button',{name:'Add to cart',exact:true}).click();
  }
  await page.goto('/favorites');await expect(page.locator('.pc')).toHaveCount(8);
  await page.goto('/cart');await expect(page.locator('.row')).toHaveCount(8);
  const row=page.locator('.row').first();await row.getByRole('button',{name:'+',exact:true}).click();await expect(row.locator('.qty span')).toHaveText('2');
  await row.getByRole('button',{name:'−',exact:true}).click();await expect(row.locator('.qty span')).toHaveText('1');
  await page.reload();await expect(page.locator('.row')).toHaveCount(8);
  await page.getByRole('button',{name:'Checkout',exact:true}).click();await expect(page).toHaveURL(/checkout/);
  await expect(page.getByRole('button',{name:'Checkout',exact:true})).toBeDisabled();
  const wa=page.getByRole('link',{name:'Send via WhatsApp'});await wa.click();await expect(page.locator('input.bad')).toHaveCount(4);
  await page.locator('[name=name]').fill('Test Customer');await page.locator('[name=phone]').fill('+996500000000');await page.locator('[name=email]').fill('test@example.com');await page.locator('[name=address]').fill('Test address 123');
  expect(new URL(await wa.getAttribute('href')).searchParams.get('text')).toContain('Test Customer');
  await page.goto('/cart'); for(let i=0;i<8;i++)await page.locator('.row').first().getByRole('button',{name:'Remove'}).click();await expect(page.locator('.empty')).toContainText('Your cart is empty');
 });
 test(`home controls, modals, languages, theme and chat at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('/');
  await page.getByRole('button',{name:'Explore Services'}).click();await expect(page.locator('#services')).toBeInViewport();
  for(let i=0;i<6;i++){await page.locator('button.svc').nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.modal')).toHaveCount(0);}
  for(let i=0;i<4;i++){await page.locator('button.blogc').nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close',exact:true}).click();}
  for(let i=0;i<2;i++){await page.locator('.watch').nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');}
  const dots=page.locator('.dots button');for(let i=0;i<await dots.count();i++){await dots.nth(i).click();await expect(dots.nth(i)).toHaveClass('on');}
  if(width>820){await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Previous',exact:true}).click();}
  for(const [label,lang] of [['RU','ru'],['KG','ky'],['EN','en']]){await page.getByRole('button',{name:label,exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang',lang);}
  await page.getByRole('button',{name:'Night',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Day',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'Open chat',exact:true}).click();
  for(const name of ['How to book?','How to order?','Opening hours','Contacts']) {await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('.typing')).toHaveCount(0);}
  await page.getByRole('textbox',{name:'Type your question…'}).fill('unrecognized question');await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('.bot .lnk').last()).toHaveAttribute('href',/wa.me/);
  await page.locator('.bot-h button').click();
  await page.locator('footer .up').click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 });
 test(`booking, service CTA and contact links at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('/booking');await expect(page.locator('[name=service]')).toHaveValue('');
  await page.getByRole('link',{name:'Send via WhatsApp'}).click();await expect(page.locator('.bad')).toHaveCount(6);
  await page.goto('/');await page.locator('button.svc').nth(3).click();await page.locator('.modal .btn').click();await expect(page).toHaveURL(/booking\?service=3/);expect(await page.locator('[name=service]').inputValue()).not.toBe('');
  await page.locator('[name=name]').fill('Test Customer');await page.locator('[name=phone]').fill('+996500000000');await page.locator('[name=email]').fill('test@example.com');await page.locator('[name=date]').fill('2099-01-05');await page.locator('[name=time]').selectOption('10:00');
  const href=await page.getByRole('link',{name:'Send via WhatsApp'}).getAttribute('href');expect(new URL(href).searchParams.get('text')).toContain('2099-01-05 10:00');
  await page.goto('/contact');
  for(const a of await page.locator('a[href*="t.me"]').all()){expect(await a.getAttribute('href')).toBe('https://t.me/+996502820642');expect(await a.getAttribute('target')).toBe('_blank');}
  await page.getByRole('button',{name:'Send via WhatsApp'}).click();await expect(page.locator('.bad-msg')).toBeVisible();
 });
}
test('mobile menu closes on navigation, Escape and outside tap',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 for(const path of ['/about','/shop','/booking','/reviews','/contact','/favorites','/login','/']) {await page.getByRole('button',{name:'Menu',exact:true}).click();await page.locator(`#menu a[href="${path}"]`).first().click();await expect(page).toHaveURL(new RegExp(`${path.replace('/','\\/')}($|\\?)`));await expect(page.getByRole('button',{name:'Menu',exact:true})).toHaveAttribute('aria-expanded','false');}
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('#menu')).not.toBeVisible();
});
test('corrupt saved cart and favorites cannot crash the site',async({page})=>{await page.addInitScript(()=>{localStorage.setItem('cart','{}');localStorage.setItem('favs','42')});await page.goto('/cart');await expect(page.locator('.empty')).toBeVisible();});
test('external links actually open their configured destination without sending messages',async({page,context})=>{
 await context.route(/^https:\/\/(t\.me|wa\.me|www\.openstreetmap\.org)\//,route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Intercepted destination</title>'}));
 await page.goto('/contact');
 for(const selector of ['a[href*="t.me"]','a[href*="wa.me"]','a[href*="openstreetmap.org"]']){
  for(const link of await page.locator(selector).all()){
   const href=await link.getAttribute('href'); const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState();expect(popup.url()).toBe(href);await popup.close();
  }
 }
 await page.locator('textarea').fill('Test question — not sent');const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Send via WhatsApp'}).click();const popup=await popupPromise;await popup.waitForLoadState();expect(new URL(popup.url()).searchParams.get('text')).toContain('Test question');await popup.close();
});
test('all local anchor targets resolve to known routes and all email links retain configured contact',async({page})=>{
 for(const path of ['/','/about','/shop','/reviews','/contact','/booking']){
  await page.goto(path);for(const href of await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.getAttribute('href')))){
   if(href.startsWith('/')){const pathname=new URL(href,'http://localhost').pathname;expect(routes.includes(pathname),`${path}: ${href}`).toBeTruthy();}
   else if (!href.startsWith('#')) expect(href).toMatch(/^(https:\/\/|mailto:|tel:|tg:\/\/)/);
  }
 }
});
for(const width of [1440,390])test(`every product detail has working quantity, favorite and buy controls at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});
 for(let i=1;i<=8;i++){
  await page.goto(`/shop/p${i}`);await expect(page.getByRole('button',{name:'−',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'+',exact:true}).click();await expect(page.locator('.qty span')).toHaveText('2');await page.getByRole('button',{name:'−',exact:true}).click();
  await page.locator('main .cta').getByRole('button',{name:/Favorites/}).click();await page.getByRole('button',{name:'Add to cart',exact:true}).click();
  await page.getByRole('button',{name:'Buy now',exact:true}).click();await expect(page).toHaveURL(/cart/);await expect(page.locator('.row').last().locator('.qty span')).toHaveText('2');
 }
});
test('header, footer and product links navigate to every distinct local target',async({page})=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const links=await page.locator('a[href^="/"]').evaluateAll(as=>[...new Set(as.map(a=>a.getAttribute('href')))]);
 for(const href of links){await page.goto('/');const a=page.locator(`a[href=${JSON.stringify(href)}]:visible`).first();if(!await a.count())continue;await a.click();await expect(page).toHaveURL(new URL(href,'http://localhost:5173').href);}
 await page.goto('/shop');for(let i=1;i<=8;i++){await page.locator(`.pc a.im[href="/shop/p${i}"]`).click();await expect(page).toHaveURL(new RegExp(`/shop/p${i}$`));await page.getByRole('button',{name:'← Back',exact:true}).click();await expect(page).toHaveURL(/\/shop$/);}
});
for(const device of [{name:'iPhone size and touch',width:390,height:844},{name:'Android size and touch',width:393,height:851}])test(`Telegram opens configured web address with ${device.name}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:true,hasTouch:true});
 await context.route('https://t.me/**',route=>route.fulfill({contentType:'text/html',body:'<title>Telegram destination intercepted</title>'}));
 const page=await context.newPage();await page.goto('http://localhost:5173/contact');
 const popupPromise=page.waitForEvent('popup');await page.locator('main a[href="https://t.me/+996502820642"]').last().tap();const popup=await popupPromise;await popup.waitForLoadState();expect(popup.url()).toBe('https://t.me/+996502820642');
 await expect(page.locator('a[href="tg://resolve?phone=996502820642"]')).toBeVisible();
 await context.close();
});
