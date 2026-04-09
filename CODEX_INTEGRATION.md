# Codex Integration

## Статус прямого подключения

**Прямое MCP/API подключение Codex → Antigravity: НЕДОСТУПНО**

На момент настройки (April 2026) OpenAI Codex не предоставляет MCP-совместимый сервер и не интегрируется напрямую в Claude Code окружение. Это не блокер — работает стабильный fallback-процесс.

---

## Fallback Process (Production-Ready)

```
┌─────────────────────────────────────────────────────────┐
│                    VIREL DEV LOOP                       │
│                                                         │
│  Founder определяет задачу                              │
│         ↓                                               │
│  Claude формирует TASK_CARD (по шаблону)                │
│         ↓                                               │
│  Founder передаёт TASK_CARD → Codex (вручную)           │
│  (ChatGPT / Codex CLI / VS Code Copilot)                │
│         ↓                                               │
│  Codex создаёт ветку codex/<task>                       │
│  Codex пушит PR в GitHub                                │
│         ↓                                               │
│  CI Build запускается автоматически                     │
│         ↓                                               │
│  Claude делает review PR (код + логика)                 │
│  Founder approves с телефона (визуал + preview)         │
│         ↓                                               │
│  Merge → Vercel production deploy                       │
└─────────────────────────────────────────────────────────┘
```

---

## Варианты запуска Codex

### Вариант A — ChatGPT (Web, рекомендуется для старта)
1. Открой ChatGPT → выбери модель с Codex/o3
2. Вставь TASK_CARD целиком
3. Попроси создать diff или полные файлы
4. Применяй патч вручную или через `git apply`

### Вариант B — Codex CLI
```bash
# Если доступен codex CLI:
codex --task task_card.md --output patch.diff
git apply patch.diff
git checkout -b codex/<task-name>
git add -p   # интерактивно, только scope файлы
git commit -m "feat: <task>"
git push origin codex/<task-name>
# Открой PR на GitHub
```

### Вариант C — GitHub Copilot / VS Code
1. Открой нужные файлы из Scope
2. Вставь TASK_CARD в Copilot Chat
3. Применяй предложения файл за файлом
4. Commit + push + PR

---

## Скорость без прямой интеграции

Потеря скорости минимальна при дисциплине:

| Этап | Время |
|------|-------|
| Claude формирует TASK_CARD | ~2 мин |
| Передача Codex + выполнение | ~10-20 мин |
| PR + CI | ~5 мин |
| Review + merge | ~3 мин |

**Итого: 20-30 мин на задачу** — приемлемо для isolated UI tasks.

---

## Когда появится прямая интеграция

Следи за:
- [OpenAI Agents SDK](https://platform.openai.com/docs) — может появиться MCP-сервер
- Claude Code MCP marketplace — могут добавить Codex коннектор
- Antigravity updates — спроси в поддержке Antigravity

При появлении — обновить этот файл и настроить MCP сервер в `.claude/settings.local.json`.
