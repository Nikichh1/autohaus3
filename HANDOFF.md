# Предаване на клиент — настройка на хостинга (Vercel Pro)

Това ръководство е за пускане на сайта на **акаунтите на клиента**, от нулата.
Стек: **Vercel** (хостинг) + **Neon** (PostgreSQL база) + **Cloudflare R2** (файлове).

> ⚠️ Vercel безплатният план (Hobby) е само за нетърговски проекти. Сайт за фирма
> е търговски → клиентът трябва **Vercel Pro** (~$20/мес). Останалите услуги
> (Neon, R2) се ползват в безплатните им планове.

---

## Какви акаунти прави клиентът

1. **GitHub** — за кода (безплатно).
2. **Vercel** — план **Pro** (търговски сайт).
3. **Neon** — база данни (безплатен план, 0.5 GB е предостатъчно — само текст).
4. **Cloudflare** — за R2 файлово хранилище (само ако ще качват **нови** снимки от
   админа; първоначалните 82 коли ползват външни снимки и не изискват R2).

---

## Стъпки

### 1. Код в GitHub
Качи кода в GitHub репо на клиента (ново репо → `git remote add` + `git push`),
или прехвърли съществуващото репо към неговия акаунт (Repo → Settings → Transfer).

### 2. База данни (Neon)
1. [neon.tech](https://neon.tech) → **Create project**.
2. Панел **Connect** → копирай два низа:
   - **Connection pooling ON** (хост с `-pooler`) → `DATABASE_URL`
   - **Connection pooling OFF** (без `-pooler`) → `DIRECT_URL`

### 3. Vercel
1. [vercel.com/new](https://vercel.com/new) → **Import** на репото (Next.js + pnpm
   се разпознават автоматично). Акаунтът трябва да е на **Pro** план.
2. **Settings → Environment Variables** (Production + Preview):

   | Име | Стойност |
   |---|---|
   | `DATABASE_URL` | pooled низ от Neon (`-pooler`) |
   | `DIRECT_URL` | direct низ от Neon |
   | `BETTER_AUTH_SECRET` | генерирай: `openssl rand -hex 32` |
   | `BETTER_AUTH_URL` | финалния URL на сайта |
   | `NEXT_PUBLIC_APP_URL` | същия URL |
   | `R2_*` (5 бр.) | по избор — виж README, раздел *File uploads (Cloudflare R2)* |

3. **Deploy**. Build командата (`vercel.json`) пуска `prisma migrate deploy` →
   таблиците се създават автоматично.
4. След първия деплой добави `BETTER_AUTH_URL` и `NEXT_PUBLIC_APP_URL` със
   същинския URL (или custom домейн) и **Redeploy**.

### 4. Зареждане на данни (еднократно, локално)
С `.env` сочещ към **Neon базата на клиента** (Node 22+ за seed скрипта):

```bash
pnpm install
pnpm db:seed:vehicles   # 82-те коли + снимки
pnpm db:seed:admin      # първи администратор
```

Админ по подразбиране (смени имейл/парола чрез `ADMIN_EMAIL` / `ADMIN_PASSWORD`):
- Имейл: `chavdarov08@gmail.com`
- Парола: `AutoHaus!Admin2026` → **смени я след първи вход**.

### 5. Домейн на клиента
Vercel → проекта → **Settings → Domains** → Add → въведи домейна и следвай DNS
инструкциите. После обнови `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` към новия
домейн и обнови `metadataBase` в `app/layout.tsx` (по желание, за SEO).

---

## Лимити на безплатните планове (за инфо)

| Услуга | Безплатно | Достатъчно? |
|---|---|---|
| Neon (база) | 0.5 GB | Да — само текстови данни |
| Cloudflare R2 (файлове) | 10 GB + без такси за трафик | Да — хиляди снимки |
| Vercel | **Pro ~$20/мес** (търговско) | — |

## Поддръжка след предаване
Клиентът работи само през **админ панела** (`/admin`) — добавя/редактира коли,
обработва запитвания. Не пипа кода. Промените се отразяват веднага на сайта.
