export const WA_NUMBER = "996502474860"; // WhatsApp (international format, digits only)
export const TG_PHONE = "+996502820642"; // Telegram contact shown on the site
export const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
export const tgLink = `https://t.me/${TG_PHONE}`;
