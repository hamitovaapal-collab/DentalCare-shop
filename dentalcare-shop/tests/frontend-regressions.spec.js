import {test,expect} from '@playwright/test';
import {mockService} from './helpers/account.js';
async function openProductEditor(page) {
 await mockService(page,{loggedIn:true,admin:true,writeDelay:700});await page.goto('/admin');await page.locator('main .chips').getByRole('button',{name:'Shop',exact:true}).click();
}
test('one admin form attempt inserts one product even with duplicate submit events',async({page})=>{
 await openProductEditor(page);await page.locator('[name=name_en]').fill('Regression product');await page.locator('[name=price]').fill('123');await page.locator('main form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='products'&&x.op==='insert').length)).toBe(1);await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeEnabled();expect(await page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='products'&&x.op==='insert').length)).toBe(1);
});
test('pending product save cannot switch or discard the current edit',async({page})=>{
 await openProductEditor(page);await page.getByRole('button',{name:'Edit',exact:true}).first().click();await page.locator('[name=name_en]').fill('Pending edit');await page.getByRole('button',{name:'Save product',exact:true}).click();await expect(page.getByRole('button',{name:'Back',exact:true})).toBeDisabled();for(const edit of await page.getByRole('button',{name:'Edit',exact:true}).all())await expect(edit).toBeDisabled();await expect(page.locator('[name=name_en]')).toBeDisabled();await expect(page.locator('[name=name_en]')).toHaveValue('Pending edit');await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeEnabled();expect(await page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='products'&&x.op==='update').length)).toBe(1);
});
test('one review attempt inserts one review even with duplicate submit events',async({page})=>{
 await mockService(page,{loggedIn:true,writeDelay:700});await page.goto('/reviews');await page.getByRole('radio',{name:'5',exact:true}).click();await page.locator('.rvform textarea').fill('A complete regression review');await page.locator('.rvform').evaluate(form=>{form.requestSubmit();form.requestSubmit();});await expect(page.locator('.rvform button[type=submit]')).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='reviews'&&x.op==='insert').length)).toBe(1);await expect(page.locator('.rvform button[type=submit]')).toBeEnabled();expect(await page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='reviews'&&x.op==='insert').length)).toBe(1);
});
test('Russian Contacts chatbot shortcut returns contacts and opens Contact page',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('lang','ru'));await page.goto('/');await page.locator('.fab').click();await page.locator('.bot .chips').getByRole('button',{name:'Контакты',exact:true}).click();await expect(page.locator('.bot .bm').last()).toContainText('Telegram');await page.locator('.bot .lnk').click();await expect(page).toHaveURL(/\/contact$/);await expect(page.locator('.bot')).toHaveCount(0);
});

test('deleting the product being edited clears its draft and the next save creates a new product',async({page})=>{
 await openProductEditor(page);await page.getByRole('button',{name:'Edit',exact:true}).first().click();await expect(page.locator('[name=name_en]')).toHaveValue('Home Whitening Kit');await page.getByRole('button',{name:'Delete',exact:true}).first().click();await page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeDisabled();await expect(page.locator('[name=name_en]')).toBeDisabled();await expect(page.getByRole('button',{name:'Back',exact:true})).toBeDisabled();await expect(page.locator('[name=name_en]')).toHaveValue('');await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Back',exact:true})).toHaveCount(0);await page.locator('[name=name_en]').fill('Replacement product');await page.locator('[name=price]').fill('123');await page.getByRole('button',{name:'Save product',exact:true}).click();await expect(page.getByRole('button',{name:'Save product',exact:true})).toBeEnabled();expect(await page.evaluate(()=>window.fixture.writes.filter(x=>x.table==='products').map(x=>x.op))).toEqual(['delete','insert']);
});

test('chat access does not cover a product favorite on narrow screens',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390])for(const [label,theme] of [['Day','light'],['Night','dark']]){
  await page.setViewportSize({width,height:900});await page.goto('/shop');await page.getByRole('button',{name:label,exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  const favorite=page.locator('.pc .heart').nth(1);await favorite.scrollIntoViewIfNeeded();
  await expect.poll(()=>favorite.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  const before=await favorite.getAttribute('aria-pressed');await favorite.click();await expect(favorite).toHaveAttribute('aria-pressed',before==='true'?'false':'true');
  await page.locator('.fab').click();await expect(page.locator('.bot')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.bot')).toHaveCount(0);await expect(page.locator('.fab')).toBeFocused();
 }
});
