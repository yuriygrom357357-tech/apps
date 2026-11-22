# Сервер ключів (Cloudflare Worker)

Видає ключ повної версії автоматично після оплати через Монобанк.

- `worker-bundle.js` — готовий файл для вставки в панель Cloudflare (Workers → Create → Edit code).
- Секрети (Settings → Variables and Secrets, тип Secret): `MONO_TOKEN` — токен еквайрингу Монобанку; `SIGN_SECRET` — секретний ключ підпису (НЕ публікувати).
- KV namespace з назвою прив'язки `ORDERS`.
- Змінна `STORE_URL` = `https://yuriygrom357357-tech.github.io/apps/`.

Секретні значення в цьому репозиторії не зберігаються.
