// Спільна логіка магазину: мова, кнопка «Купити», сторінка «Дякуємо».
(function () {
  const EN = {
    store: 'New Technologies · Apps',
    heroH: 'Warm apps for the whole family',
    heroP: 'Made in Ukraine. Try free — pay once, use forever. No subscriptions.',
    ourApps: 'Our apps',
    mlSub: 'Fairy-tale baby photos for every milestone',
    more: 'Learn more',
    buy: 'Buy',
    tryFree: 'Try free',
    soonT: 'New apps coming soon',
    soonP: 'Follow us — more apps for families are on the way.',
    mlH: 'Baby photos for every milestone — like in a fairy tale',
    mlP: 'Remove the background in one tap, choose a world, add cute animals and fun props. Everything stays on your phone.',
    once: 'One payment — forever. No subscription.',
    whatH: 'What\'s inside',
    f1: '30 fairy-tale worlds', f1p: 'Starry sky, clouds, magic forest, undersea kingdom',
    f2: 'Nearly 180 backgrounds', f2p: 'Gentle pink, peach and mint tones',
    f3: '200+ animals and props', f3p: 'Heart glasses, bunny ears, kittens, chicks',
    f4: '30 effects', f4p: 'From soft pastel to a real hologram',
    f5: '31 figurines', f5p: 'Gold, porcelain, gummy, crochet — the face stays recognizable',
    f6: 'Baby fairy tale', f6p: 'A 4-page story starring your child',
    f7: '11 languages', f7p: 'Ukrainian, English, German, French, Spanish, Hebrew, Japanese and more',
    f8: 'Private', f8p: 'Photos are stored only on your device',
    shotsH: 'Screenshots',
    cmpH: 'Free and full version',
    cF: 'Free', cP: 'Full version',
    howH: 'How to buy — 4 steps',
    h1: 'Tap «Buy». The secure Monobank payment page opens, the amount is already filled in.',
    h2: 'Pay with a card, Apple Pay or Google Pay. We never see your card details.',
    h3: 'You come back to the «Thank you» page — your key is ready right there.',
    h4: 'Tap «Open full version» — everything unlocks forever on that phone. Save the link to use it on other devices.',
    installH: 'How to install on your phone',
    i1: 'iPhone: open the app in Safari → Share button → «Add to Home Screen».',
    i2: 'Android: open in Chrome → menu ⋮ → «Install app».',
    thanksH: 'Thank you for your purchase!',
    checking: 'Checking your payment…',
    paidOk: 'Payment received. Your full version is ready 💗',
    openFull: 'Open full version',
    keyL: 'Your key (save it):',
    copy: 'Copy key', copied: 'Copied ✓',
    saveTip: 'Tip: take a screenshot of this page or save the link — the key works forever on all your devices.',
    notPaid: 'The payment is not completed yet. If you paid, wait a minute and refresh the page.',
    errMsg: 'Something went wrong. Write to us and we will send the key manually:',
    notConfigured: 'Online payment is being connected. Write to us and we will send payment details and the key:',
    legalOferta: 'Public offer', legalPrivacy: 'Privacy policy', legalRefund: 'Refunds'
  };
  const UK = {};
  const UKX = {
    paidOk: 'Оплату отримано. Ваша повна версія готова 💗',
    notPaid: 'Оплата ще не завершилась. Якщо ви вже оплатили — зачекайте хвилинку й оновіть сторінку.',
    errMsg: 'Щось пішло не так. Напишіть нам — ми надішлемо ключ вручну:',
    notConfigured: 'Онлайн-оплата підключається. Напишіть нам — надішлемо реквізити й ключ:',
    copied: 'Скопійовано ✓'
  };
  let lang = (() => { try { const s = localStorage.getItem('store_lang'); if (s) return s; } catch {} const n = (navigator.language || 'uk').toLowerCase(); return (n.startsWith('uk') || n.startsWith('ru')) ? 'uk' : 'en'; })();
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(el => { const k = el.dataset.t; if (!(k in UK)) UK[k] = el.innerHTML; el.innerHTML = lang === 'en' && EN[k] ? EN[k] : UK[k]; });
    document.querySelectorAll('[data-price]').forEach(el => { const a = STORE.APPS[el.dataset.price]; if (a) el.textContent = a.price[lang] || a.price.uk; });
    document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === lang));
  }
  window.T = k => (lang === 'en' && EN[k]) ? EN[k] : (UKX[k] || UK[k] || EN[k] || k);
  document.addEventListener('click', e => {
    const lb = e.target.closest('.lang button'); if (lb) { lang = lb.dataset.l; try { localStorage.setItem('store_lang', lang); } catch {} apply(); return; }
    const bb = e.target.closest('[data-buy]'); if (bb) { e.preventDefault(); buy(bb.dataset.buy); }
  });
  function buy(app) {
    if (STORE.WORKER_URL) { location.href = STORE.WORKER_URL.replace(/\/$/, '') + '/buy?app=' + encodeURIComponent(app) + '&lang=' + lang; return; }
    const subj = encodeURIComponent((lang === 'en' ? 'Buy ' : 'Купити ') + '«Моя Любов»');
    const box = document.getElementById('buy-msg');
    if (box) { box.hidden = false; box.innerHTML = T('notConfigured') + ` <a href="mailto:${STORE.CONTACT}?subject=${subj}">${STORE.CONTACT}</a>`; box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else location.href = `mailto:${STORE.CONTACT}?subject=${subj}`;
  }
  // Сторінка «Дякуємо»: перевіряємо оплату і показуємо ключ
  async function thanks() {
    const root = document.getElementById('thanks'); if (!root) return;
    const q = new URLSearchParams(location.search); const ref = q.get('ref');
    if (q.get('lang')) { lang = q.get('lang') === 'uk' ? 'uk' : 'en'; apply(); }
    const st = root.querySelector('.status'), sp = root.querySelector('.spinner'), ok = root.querySelector('.ok');
    if (!ref || !STORE.WORKER_URL) { sp.hidden = true; st.innerHTML = T('errMsg') + ` <a href="mailto:${STORE.CONTACT}">${STORE.CONTACT}</a>`; return; }
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch(STORE.WORKER_URL.replace(/\/$/, '') + '/key?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
        const d = await r.json();
        if (d.status === 'success') {
          sp.hidden = true; st.textContent = T('paidOk'); ok.hidden = false;
          root.querySelector('[data-open]').href = d.link;
          root.querySelector('.keybox').textContent = d.key;
          root.querySelector('[data-copy]').onclick = async ev => {
            const btn = ev.currentTarget;
            try { await Promise.race([navigator.clipboard.writeText(d.key), new Promise((_, rj) => setTimeout(rj, 1200))]); }
            catch { const r = document.createRange(); r.selectNodeContents(root.querySelector('.keybox')); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); try { document.execCommand('copy'); } catch {} }
            btn.textContent = T('copied');
          };
          return;
        }
        if (d.status === 'unknown' || d.status === 'failure' || d.status === 'expired' || d.error) break;
      } catch {}
      await new Promise(r => setTimeout(r, 2500));
    }
    sp.hidden = true; st.innerHTML = T('notPaid') + '<br><br>' + T('errMsg') + ` <a href="mailto:${STORE.CONTACT}">${STORE.CONTACT}</a>`;
  }
  document.addEventListener('DOMContentLoaded', () => { apply(); thanks(); });
})();
