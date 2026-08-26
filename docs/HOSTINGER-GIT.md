# Git → VPS (تلقائي)

كل **push** على `main` يشغّل GitHub Actions وينشر على:

**https://srv1930800.hstgr.cloud**

## ما تم إعداده

- Workflow: `.github/workflows/deploy-vps.yml` (SSH + `scripts/deploy-vps.sh` + health check)
- الاستضافة المشتركة `deepskyblue-ibis-463603.hostingersite.com` **متوقفة** — تعيد توجيه 301 للـ VPS
- Workflow القديم `.github/workflows/deploy-hostinger.yml` **معطّل** (يدوي فقط)

## Secrets المطلوبة على GitHub

| Secret | القيمة |
|--------|--------|
| `VPS_SSH_HOST` | `148.230.124.124` |
| `VPS_SSH_USER` | `root` |
| `VPS_SSH_PORT` | `22` |
| `VPS_SSH_KEY` | مفتاح SSH الخاص بالـ VPS |

## سير العمل

```bash
git add .
git commit -m "تغيير"
git push origin main
```

راقب النشر: **GitHub → Actions → Deploy to VPS**

## النشر اليدوي على السيرفر

```bash
ssh root@148.230.124.124
bash /opt/newsplus/scripts/deploy-vps.sh
```

راجع [VPS-DEPLOY.md](./VPS-DEPLOY.md) للتفاصيل.
