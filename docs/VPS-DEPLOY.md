# Newsplus على VPS (مستقل عن الاستضافة المشتركة)

نشر المشروع على VPS Hostinger باستخدام **Docker + Caddy** (HTTPS تلقائي).

## VPS الحالي

| | |
|---|---|
| **الدومين** | `srv1930800.hstgr.cloud` (دومين VPS المجاني من Hostinger) |
| **IP** | `148.230.124.124` |
| **النظام** | Ubuntu 24.04 with Docker |
| **الخطة** | KVM 2 (2 CPU / 8 GB RAM) |

## قبل النشر

1. **DNS**: الدومين `srv1930800.hstgr.cloud` يشير تلقائيًا لـ IP الـ VPS — لا حاجة لإعداد DNS يدوي.
2. **Firewall** (hPanel → VPS → Firewall): افتح المنافذ **80** و **443** (و **22** لـ SSH).
3. **SSH**: تأكد أنك تقدر تدخل على السيرفر كـ `root` (أو مستخدم بصلاحيات Docker).

## النشر السريع (على السيرفر)

```bash
ssh root@148.230.124.124

curl -fsSL https://raw.githubusercontent.com/Adhammansouri/NewsPulse-AI/main/scripts/deploy-vps.sh -o /tmp/deploy-vps.sh
chmod +x /tmp/deploy-vps.sh
NEWSPLUS_DOMAIN=srv1930800.hstgr.cloud bash /tmp/deploy-vps.sh
```

أو يدويًا:

```bash
git clone https://github.com/Adhammansouri/NewsPulse-AI.git /opt/newsplus
cd /opt/newsplus
cp .env.vps.example .env
# عدّل .env (JWT_SECRET، OPENAI_API_KEY، كلمة مرور المستخدم)
nano .env
docker compose up -d --build
```

## التحقق

```bash
curl -fsS https://srv1930800.hstgr.cloud/api/health
# {"status":"success","data":{"status":"ok",...}}
```

## إعادة النشر بعد تحديث الكود

```bash
cd /opt/newsplus
git pull origin main
docker compose up -d --build
```

## متغيرات البيئة (`.env`)

| المتغير | الوصف |
|---------|--------|
| `CORS_ORIGIN` | `https://srv1930800.hstgr.cloud` |
| `JWT_SECRET` | مفتاح عشوائي قوي (`openssl rand -hex 32`) |
| `OPENAI_API_KEY` | مفتاح OpenAI (اختياري) |
| `AUTH_SEED_*` | مستخدم أولي — غيّر كلمة المرور بعد أول دخول |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | مفاتيح Web Push (`npx web-push generate-vapid-keys`) |
| `VAPID_SUBJECT` | `mailto:` أو رابط HTTPS |
| `PUSH_STORE_PATH` | مسار ملف الاشتراكات — `/data/push-subscriptions.json` داخل Docker |

## البنية

```
Internet → Caddy (:443) → app (:3001)
                              ├── /api/*  Fastify API
                              └── /*      React static (public/)
```

- `Dockerfile`: بناء API + Frontend في صورة واحدة
- `docker-compose.yml`: `app` + `caddy` (شهادة Let's Encrypt تلقائية)
- `Caddyfile`: reverse proxy للدومين

## Hostinger Docker Manager (بدون SSH)

بعد دفع `docker-compose.yml` إلى `main` على GitHub:

1. hPanel → VPS → **Docker Manager**
2. **Create project** → اسم: `newsplus`
3. المصدر: `https://github.com/Adhammansouri/NewsPulse-AI`
4. أضف متغيرات البيئة من `.env.vps.example`

## استكشاف الأخطاء

```bash
cd /opt/newsplus
docker compose logs -f
docker compose ps
```

| المشكلة | الحل |
|---------|------|
| الموقع لا يفتح | تحقق من DNS و firewall (80/443) |
| شهادة SSL فاشلة | انتظر انتشار DNS أو تأكد أن A record صحيح |
| `JWT_SECRET is required` | أضف `JWT_SECRET` في `.env` |
| 502 من Caddy | `docker compose logs app` — غالبًا build فاشل أو `.env` ناقص |

## دومين الإنتاج

**https://srv1930800.hstgr.cloud** — الدومين الأساسي للمشروع.

`deepskyblue-ibis-463603.hostingersite.com` (استضافة مشتركة) **متوقف** ويعيد توجيه 301 للرابط أعلاه.

## الفرق عن الاستضافة المشتركة (قديم)
|---|---|---|
| النشر | GitHub Actions + Passenger | Docker Compose |
| SSL | Hostinger | Caddy + Let's Encrypt |
| المسار | `/home/u358087675/domains/...` | `/opt/newsplus` |
| الاستقلالية | مرتبط بـ hPanel shared | سيرفر كامل تحت سيطرتك |
