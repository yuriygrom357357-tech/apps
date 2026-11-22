// Налаштування магазину. Після підключення Cloudflare сюди вписується адреса сервера ключів.
window.STORE = {
  // Адреса сервера ключів (Cloudflare Worker). Порожньо = оплата ще не підключена, кнопка «Купити» відкриває лист.
  WORKER_URL: '',
  CONTACT: 'm-music@ukr.net',
  COMPANY: 'ТОВ «Новітні технології»',
  APPS: {
    'moya-lyubov': { price: { uk: '199 ₴', en: '199 UAH (~$5)' }, url: 'https://yuriygrom357357-tech.github.io/moya-lyubov/' }
  }
};
