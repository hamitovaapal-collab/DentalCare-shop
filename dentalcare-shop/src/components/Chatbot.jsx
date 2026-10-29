import { useEffect, useRef, useState } from 'react'; import { useNavigate } from 'react-router-dom'; import { useApp } from '../store'; import { waLink } from '../lib/wa';
const I = [
  { k: ['book', 'appoint', 'visit', 'запис', 'приём', 'прием', 'визит', 'жазыл'], l: '/booking', a: ["To book a visit open the Booking page, choose a service, date and time, and send the form. We confirm by phone.", "Чтобы записаться, откройте страницу «Запись», выберите услугу, дату и время и отправьте форму. Мы подтвердим по телефону.", "Жазылуу үчүн «Жазылуу» барагын ачып, кызмат, күн жана убакытты тандап, форманы жөнөтүңүз. Биз телефон аркылуу ырастайбыз."] },
  { k: ['order', 'buy', 'cart', 'deliver', 'заказ', 'купит', 'корзин', 'доставк', 'буйрутма', 'себет', 'сатып', 'жеткир'], l: '/shop', a: ["Add products to the cart, open Checkout, log in and send your order. We will contact you to confirm delivery.", "Добавьте товары в корзину, откройте оформление, войдите и отправьте заказ. Мы свяжемся для подтверждения доставки.", "Товарларды себетке кошуп, буйрутма бериңиз (кирүү керек). Жеткирүүнү ырастоо үчүн байланышабыз."] },
  { k: ['price', 'cost', 'pay', 'оплат', 'цена', 'цены', 'стоим', 'баа', 'төлөм'], l: '/shop', a: ["Prices are shown on every product card in KGS. Treatment prices are confirmed after a consultation.", "Цены указаны на карточках товаров в сомах. Стоимость лечения уточняется после консультации.", "Баалар товар карточкаларында сом менен көрсөтүлгөн. Дарылоо баасы кеңештен кийин такталат."] },
  { k: ['hour', 'open', 'schedule', 'график', 'часы', 'работ', 'иш убакт', 'саат', 'качан'], l: '/contact', a: ["We are open Monday–Saturday, 9:00–20:00. Sunday is closed.", "Мы работаем с понедельника по субботу, 9:00–20:00. Воскресенье — выходной.", "Дүйшөмбүдөн ишембиге чейин 9:00–20:00. Жекшемби — дем алыш."] },
  { k: ['where', 'address', 'location', 'адрес', 'где', 'дарек', 'кайда'], l: '/contact', a: ["Our sample address is 120 Chuy Avenue, Bishkek. See the Contact page for the map.", "Адрес: пр. Чуй, 120, Бишкек. Карта — на странице «Контакты».", "Дарек: Чүй проспектиси, 120, Бишкек. Карта «Байланыш» барагында."] },
  { k: ['whatsapp', 'telegram', 'phone', 'contact', 'связ', 'телефон', 'номер', 'байланыш'], l: '/contact', a: ["You can reach us on Telegram (+996 502 820 642) or WhatsApp. Details are on the Contact page.", "Пишите в Telegram (+996 502 820 642) или WhatsApp. Подробности — на странице «Контакты».", "Telegram (+996 502 820 642) же WhatsApp аркылуу жазыңыз. Толугу «Байланыш» барагында."] },
  { k: ['service', 'implant', 'whiten', 'braces', 'услуг', 'имплант', 'отбел', 'брекет', 'кызмат'], l: '/', a: ["We offer general and cosmetic dentistry, implants, whitening, orthodontics and preventive care. Open a service card on the Home page for details.", "Мы предлагаем терапию, эстетику, имплантацию, отбеливание, ортодонтию и профилактику. Подробности — в карточках услуг на главной.", "Жалпы жана эстетикалык стоматология, имплант, актоо, ортодонтия жана профилактика. Кененирээк — башкы беттеги карточкаларда."] },
  { k: ['product', 'shop', 'toothbrush', 'товар', 'магазин', 'щётк', 'щетк', 'дүкөн', 'щётка'], l: '/shop', a: ["Our shop has toothbrushes, whitening kits, irrigators and more. Use search and filters to find what you need.", "В магазине щётки, наборы для отбеливания, ирригаторы и другое. Используйте поиск и фильтры.", "Дүкөндө щёткалар, актоо топтомдору, ирригаторлор бар. Издөө жана чыпкаларды колдонуңуз."] }];
export default function Chatbot() {
  const { t, lang } = useApp(); const nav = useNavigate(); const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState([]); const [v, setV] = useState(''); const [busy, setBusy] = useState(false); const end = useRef(); const li = ['en', 'ru', 'ky'].indexOf(lang);
  useEffect(() => { if (open && !msgs.length) setMsgs([{ me: false, text: t('bot_hi') }]) }, [open]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy]);
  const ask = async q => {
    q = q.trim(); if (!q || busy) return; setMsgs(m => [...m, { me: true, text: q }]); setV(''); setBusy(true);
    try {
      await new Promise(r => setTimeout(r, 550)); const s = q.toLowerCase(); const h = I.find(x => x.k.some(k => s.includes(k)));
      setMsgs(m => [...m, h ? { me: false, text: h.a[li], link: h.l } : { me: false, text: t('bot_fb'), wa: true }])
    } catch { setMsgs(m => [...m, { me: false, text: t('bot_err'), wa: true }]) } setBusy(false)
  };
  const chips = [['q1', 'book'], ['q2', 'order'], ['q3', 'hours'], ['q4', 'contact']];
  return <>{open && <div className="bot" role="dialog" aria-label={t('bot_t')}><div className="bot-h"><b>{t('bot_t')}</b><button onClick={() => setOpen(false)} aria-label="Close">×</button></div>
    <div className="bot-m">{msgs.map((m, i) => <div key={i} className={`bm ${m.me ? 'me' : ''}`}>{m.text}{m.link && <button className="lnk" onClick={() => { nav(m.link); setOpen(false) }}>{t('open_page')} →</button>}{m.wa && <a className="lnk" href={waLink(t('wa_hi'))} target="_blank" rel="noopener noreferrer">WhatsApp →</a>}</div>)}
      {busy && <div className="bm typing"><i /><i /><i /></div>}<div ref={end} /></div>
    <div className="chips">{chips.map(([k, q]) => <button key={k} onClick={() => ask(t(k))}>{t(k)}</button>)}</div>
    <div className="bot-f"><input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(v)} placeholder={t('bot_ph')} aria-label={t('bot_ph')} /><button className="btn sm" onClick={() => ask(v)}>➤</button></div></div>}
    <button className="fab" onClick={() => setOpen(!open)} aria-label={t('bot_open')}>{open ? '×' : '💬'}</button></>
}
