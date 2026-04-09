# Mobile Control Setup

Управление проектом Virel с телефона: GitHub + Vercel.

---

## 1. Branch Protection для `main`

**Путь:** GitHub → Settings → Branches → Add branch ruleset

| Настройка | Значение |
|-----------|---------|
| Branch name pattern | `main` |
| Restrict pushes | ✅ Enabled |
| Require pull request | ✅ Required |
| Required approvals | 1 (founder review) |
| Require status checks | ✅ `Build` (quality-gate.yml) |
| Block force pushes | ✅ Enabled |
| Require linear history | ✅ Recommended |

**Обязательный статус:** `Build` — это job из `.github/workflows/quality-gate.yml`.  
Lint и Type Check намеренно `continue-on-error: true` — не блокируют merge.

---

## 2. Подключение Vercel Preview Deploy

### Первичная настройка:
1. Войди на [vercel.com](https://vercel.com) → New Project
2. Import Git Repository → выбери `virel` репо
3. Framework: **Vite** (определится автоматически)
4. Root Directory: `/` (корень)
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Deploy → получишь `*.vercel.app` URL

### Preview на каждый PR:
- Vercel автоматически деплоит каждую ветку/PR
- Preview URL появится в комментарии к PR
- Комментарий: `✅ Preview deployed to https://virel-git-<branch>.vercel.app`

### Env variables в Vercel:
- Settings → Environment Variables
- Добавь `VITE_STITCH_API_KEY` (никогда не коммить в `.env` в репо!)
- Scope: Production + Preview + Development

---

## 3. Управление с телефона

### GitHub Mobile App
- Скачай: **GitHub** (App Store / Google Play)
- Возможности:
  - Просмотр и approve/reject PR
  - Просмотр CI статусов (Jobs → Build)
  - Merge PR (если build зелёный)
  - Создание issues и назначение задач
  - Code review с комментариями

**Workflow с телефона:**
1. Claude/Codex открывает PR
2. Пуш-уведомление на телефон
3. Открываешь PR → видишь Changes + CI статус
4. Смотришь Preview URL (Vercel бот в комментарии)
5. Approving → Merge

### Vercel Mobile
- Vercel нет отдельного мобильного приложения
- Используй браузер: [vercel.com](https://vercel.com) → отлично работает на мобильном
- Dashboard → Project → Deployments → статус каждого деплоя

### Telegram/Slack уведомления (опционально)
- GitHub → Settings → Notifications → можно настроить email
- Или: Vercel → Settings → Integrations → Slack

---

## 4. Быстрый Merge-чеклист с телефона

```
[ ] CI Build = ✅ green
[ ] Preview URL открывается нормально
[ ] Визуально всё ок на мобильном экране
[ ] Approve PR
[ ] Merge (Squash and merge — рекомендуется)
[ ] Убедись, что Vercel продакшн задеплоился
```

---

## 5. GitHub Secrets (для CI)

Если нужны secrets в CI:  
GitHub → Settings → Secrets and variables → Actions → New secret

| Secret | Значение |
|--------|---------|
| `VERCEL_TOKEN` | Из vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Из `.vercel/project.json` после первого деплоя |
| `VERCEL_PROJECT_ID` | Из `.vercel/project.json` |

Эти нужны только если хочешь деплоить через GitHub Actions (а не через Vercel Git Integration — которая проще).
