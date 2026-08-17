# Git → Hostinger (تلقائي)

كل **push** على `main` يشغّل GitHub Actions وينشر على:

**https://deepskyblue-ibis-463603.hostingersite.com**

## ما تم إعداده

- GitHub Actions workflow: `.github/workflows/deploy-hostinger.yml` (CI build + rsync + `hostinger-finish-deploy.sh` + health check)
- Secrets على GitHub: `HOSTINGER_SSH_*`
- Deploy key على الريبو للسيرفر (git pull أثناء post-deploy)
- متغيرات البيئة على السيرفر تُكتب تلقائيًا أثناء النشر

## سير العمل

```bash
git add .
git commit -m "تغيير"
git push origin main
```

راقب النشر: **GitHub → Actions → Deploy to Hostinger**

## ربط hPanel GitHub (اختياري)

Hostinger hPanel Git يحتاج OAuth يدوي. البديل الحالي (GitHub Actions + SSH) يحقق نفس الهدف: **push = deploy**.

لو حابب hPanel Git للـ API فقط:
- Root directory: `newsplus-API`
- Entry file: `server.js`
- Build: `build`
- Node: 20

## Secrets (موجودة)

| Secret | القيمة |
|--------|--------|
| HOSTINGER_SSH_HOST | 213.130.145.182 |
| HOSTINGER_SSH_USER | u358087675 |
| HOSTINGER_SSH_PORT | 65002 |
| HOSTINGER_SSH_KEY | مفتاح SSH |
