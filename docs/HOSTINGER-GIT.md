# النشر على Hostinger عبر Git

الريبو: **https://github.com/Adhammansouri/NewsPulse-AI**

الموقع: **https://darkred-sparrow-645513.hostingersite.com**

---

## 1. ربط GitHub من hPanel (مرة واحدة)

1. افتح **Websites** → **darkred-sparrow-645513.hostingersite.com**
2. من **Deployments** (عمليات النشر) → القائمة **⋮** → **Connect to GitHub**
3. ثبّت **Hostinger GitHub App** واختر ريبو **NewsPulse-AI**
4. اضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| **Repository** | `Adhammansouri/NewsPulse-AI` |
| **Branch** | `main` |
| **Framework** | Fastify |
| **Node.js version** | 20 |
| **Root directory** | `newsplus-API` |
| **Build command** | `build` |
| **Output directory** | `dist` |
| **Entry file** | `server.js` |

5. اضغط **Deploy**

بعد الربط، كل **push** على `main` يشغّل build تلقائي بدل رفع `newsplus-api.zip` يدويًا.

---

## 2. متغيرات البيئة (hPanel → Environment variables)

| المتغير | القيمة |
|---------|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `CORS_ORIGIN` | `https://darkred-sparrow-645513.hostingersite.com` |
| `OPENAI_API_KEY` | *(مفتاحك — اختياري)* |

---

## 3. سير العمل اليومي

```bash
git add .
git commit -m "وصف التغيير"
git push origin main
```

Hostinger يسحب الكود، يشغّل `npm install` + `npm run build`، ويعيد تشغيل الـ API.

---

## 4. الواجهة (Frontend)

الواجهة static في `public_html`. تحديثها من Git يحتاج إما:

- **Redeploy static** من hPanel بعد `npm run build -w newsplus-front`، أو
- **GitHub Actions** (انظر `.github/workflows/deploy-hostinger.yml`)

الـ API وحده يتحدّث تلقائيًا بعد ربط Git.

---

## 5. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Build failed | راجع **Deployments** → logs |
| `ERR_REQUIRE_ASYNC_MODULE` | تأكد أن **Entry file** = `server.js` |
| الموقع قديم | **Redeploy** أو امسح cache |
| GitHub not connected | **Connect to GitHub** من القائمة ⋮ |
