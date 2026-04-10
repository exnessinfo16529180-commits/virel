import type { FlowState } from '../types/flow'
import styles from './SummaryScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

// ── Display label maps ────────────────────────────────────────────────────────

const PROJECT_TYPE_LABEL: Record<string, string> = {
  new_build:  'Новостройка',
  resale:     'Вторичное жильё',
  commercial: 'Коммерческое',
}

const SCOPE_LABEL: Record<string, string> = {
  full:        'Полный ремонт',
  partial:     'Частичный ремонт',
  design_only: 'Только дизайн',
}

const LAYOUT_LABEL: Record<string, string> = {
  upload: 'Загружу план',
  manual: 'Введу вручную',
  later:  'Пока нет плана',
}

const ATMOSPHERE_LABEL: Record<string, string> = {
  calm:     'Спокойная',
  warm:     'Тёплая',
  minimal:  'Минималистичная',
  contrast: 'Контрастная',
}

const PALETTE_LABEL: Record<string, string> = {
  neutral:  'Нейтральная',
  warm:     'Тёплая',
  cool:     'Холодная',
  contrast: 'Контрастная',
}

const STYLE_LABEL: Record<string, string> = {
  modern:     'Современный',
  scandi:     'Сканди',
  minimal:    'Минимализм',
  neoclassic: 'Неоклассика',
}

const BUDGET_LABEL: Record<string, string> = {
  under_5m: 'До 5 млн ₸',
  '5_10m':  '5–10 млн ₸',
  '10_20m': '10–20 млн ₸',
  '20_35m': '20–35 млн ₸',
  over_35m: '35+ млн ₸',
  unsure:   'Пока не определился',
}

const MATERIALS_LABEL: Record<string, string> = {
  basic:   'Базовый',
  optimal: 'Оптимальный',
  premium: 'Премиум',
}

const TEAM_LABEL: Record<string, string> = {
  econom:   'Эконом бригада',
  balanced: 'Сбалансированная',
  premium:  'Премиум команда',
}

function fmt(map: Record<string, string>, key?: string): string {
  if (!key) return 'Не выбрано'
  return map[key] ?? 'Не выбрано'
}

function fmtAmount(n?: number): string {
  if (!n) return 'Не выбрано'
  return n.toLocaleString('ru-RU') + '\u00a0₸'
}

// ── Row & Group components ────────────────────────────────────────────────────

function Row({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowKey}>{label}</span>
      <span className={`${styles.rowVal} ${dim ? styles.rowValDim : ''}`}>{value}</span>
    </div>
  )
}

interface Group {
  title: string
  rows: { label: string; value: string }[]
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SummaryScreen({ initialState = {}, onNext }: Props) {
  const s = initialState

  const groups: Group[] = [
    {
      title: 'Объект',
      rows: [
        { label: 'Тип проекта', value: fmt(PROJECT_TYPE_LABEL, s.projectType) },
        { label: 'Масштаб',     value: fmt(SCOPE_LABEL,        s.scope) },
        { label: 'Планировка',  value: fmt(LAYOUT_LABEL,       s.layoutSource) },
      ],
    },
    {
      title: 'Дизайн',
      rows: [
        { label: 'Атмосфера', value: fmt(ATMOSPHERE_LABEL, s.atmosphere) },
        { label: 'Палитра',   value: fmt(PALETTE_LABEL,    s.palette) },
        { label: 'Стиль',     value: fmt(STYLE_LABEL,      s.style) },
      ],
    },
    {
      title: 'Финансы',
      rows: [
        { label: 'Бюджет', value: fmt(BUDGET_LABEL, s.budgetRange) },
        { label: 'Смета',  value: fmtAmount(s.estimate?.total) },
      ],
    },
    {
      title: 'Исполнение',
      rows: [
        { label: 'Материалы', value: fmt(MATERIALS_LABEL, s.materialsPackage) },
        { label: 'Команда',   value: fmt(TEAM_LABEL,      s.teamPackage) },
      ],
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 13 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Резюме проекта</h1>
          <p className={styles.description}>Проверьте, всё ли соответствует ожиданиям</p>
        </div>

        <div className={styles.summaryCard}>
          {groups.map((group, gi) => (
            <div key={group.title} className={`${styles.group} ${gi > 0 ? styles.groupGap : ''}`}>
              <span className={styles.groupTitle}>{group.title}</span>
              {group.rows.map(({ label, value }) => (
                <Row
                  key={label}
                  label={label}
                  value={value}
                  dim={value === 'Не выбрано'}
                />
              ))}
            </div>
          ))}
        </div>

        <p className={styles.footnote}>
          Детали можно скорректировать на следующем шаге
        </p>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          onClick={() => onNext({})}
        >
          Перейти к договору
        </button>
      </footer>
    </div>
  )
}
