// «Новітні технології — додатки»: сервер автоматичної видачі ключів після оплати через Монобанк.
// Маршрути:
//   GET /buy?app=moya-lyubov&lang=uk  → створює рахунок у Монобанку і перенаправляє на сторінку оплати
//   GET /key?ref=XXXX                → перевіряє оплату; якщо успішно — повертає підписаний ключ
//   POST /mono-webhook               → (необов'язково) Монобанк повідомляє про зміну статусу
// Секрети (wrangler secret put): MONO_TOKEN, SIGN_SECRET
// Змінні (wrangler.toml): STORE_URL, MONO_API
import nacl from './nacl.js';

const CATALOG = {
  'moya-lyubov': {
    title: { uk: '«Моя Любов» — повна версія', en: '«My Love» — full version' },
    price: 19900, // копійки = 199 ₴
    appUrl: 'https://yuriygrom357357-tech.github.io/moya-lyubov/'
  }
};

const b64 = u8 => btoa(String.fromCharCode(...u8));
const b64url = u8 => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return b64url(a); };

function cors(env, res) {
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Cache-Control', 'no-store');
  return new Response(res.body, { status: res.status, headers: h });
}
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8' } });

async function mono(env, path, init = {}) {
  const r = await fetch((env.MONO_API || 'https://api.monobank.ua') + path, { ...init, headers: { 'X-Token': env.MONO_TOKEN, 'content-type': 'application/json', ...(init.headers || {}) } });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!r.ok) throw new Error('mono ' + r.status + ' ' + t.slice(0, 200));
  return j;
}

export function makeKey(secretB64, id, name) {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const msg = new TextEncoder().encode(`${id}|${String(name).replace(/\|/g, ' ').slice(0, 60)}|${d}`);
  const sig = nacl.sign.detached(msg, fromB64(secretB64));
  return `ML1.${b64url(msg)}.${b64url(sig)}`;
}

async function buy(req, env) {
  const u = new URL(req.url);
  const app = CATALOG[u.searchParams.get('app')];
  const lang = u.searchParams.get('lang') === 'uk' ? 'uk' : 'en';
  if (!app) return json({ error: 'unknown app' }, 400);
  if (!env.MONO_TOKEN) return json({ error: 'payments not configured' }, 503);
  const ref = rid();
  const store = env.STORE_URL || 'https://yuriygrom357357-tech.github.io/apps/';
  const inv = await mono(env, '/api/merchant/invoice/create', { method: 'POST', body: JSON.stringify({
    amount: app.price, ccy: 980,
    merchantPaymInfo: { reference: ref, destination: app.title.uk },
    redirectUrl: `${store}thanks.html?ref=${ref}&app=${u.searchParams.get('app')}&lang=${lang}`,
    webHookUrl: new URL('/mono-webhook', req.url).toString(),
    validity: 3600
  }) });
  await env.ORDERS.put('ref:' + ref, JSON.stringify({ invoiceId: inv.invoiceId, app: u.searchParams.get('app'), t: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 });
  return Response.redirect(inv.pageUrl, 302);
}

async function key(req, env) {
  const ref = new URL(req.url).searchParams.get('ref') || '';
  const o = await env.ORDERS.get('ref:' + ref, 'json');
  if (!o) return json({ status: 'unknown' }, 404);
  const st = await mono(env, '/api/merchant/invoice/status?invoiceId=' + encodeURIComponent(o.invoiceId));
  if (st.status !== 'success') return json({ status: st.status || 'processing' });
  const pan = st.paymentInfo?.maskedPan ? 'картка •' + String(st.paymentInfo.maskedPan).slice(-4) : 'Монобанк';
  const k = makeKey(env.SIGN_SECRET, o.invoiceId, pan);
  const app = CATALOG[o.app];
  return json({ status: 'success', key: k, link: app.appUrl + '#key=' + k, owner: pan });
}

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    try {
      if (req.method === 'OPTIONS') return cors(env, new Response(null, { status: 204 }));
      if (p === '/buy') return await buy(req, env);
      if (p === '/key') return cors(env, await key(req, env));
      if (p === '/mono-webhook') return new Response('ok'); // статус перевіряємо напряму через /key
      if (p === '/health') return cors(env, json({ ok: true, configured: !!env.MONO_TOKEN && !!env.SIGN_SECRET }));
      return new Response('Not found', { status: 404 });
    } catch (e) { return cors(env, json({ error: String(e.message || e) }, 502)); }
  }
};
