import { useState } from 'react'
import type { FlowState, LayoutSource } from '../types/flow'
import styles from './LayoutScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Document outline */}
      <rect x="7" y="4" width="18" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 4V10H25" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <rect x="7" y="4" width="22" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      {/* Upload arrow */}
      <path d="M18 22V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 26L18 22L22 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ManualIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* 2×2 room grid */}
      <rect x="4" y="4" width="28" height="22" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="4" x2="18" y2="26" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="15" x2="32" y2="15" stroke="currentColor" strokeWidth="1.25"/>
      {/* Dimension marks top */}
      <line x1="4" y1="1.5" x2="18" y2="1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="4" y1="0.5" x2="4" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="18" y1="0.5" x2="18" y2="2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      {/* Pencil edit mark bottom-right */}
      <path d="M26 30L28 28L30 30L28 32L26 30Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="28" y1="28" x2="23" y2="33" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function LaterIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Document outline — dashed to suggest "unknown" */}
      <rect x="7" y="5" width="22" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2.5"/>
      {/* Question mark */}
      <path
        d="M15.5 14.5C15.5 12.567 17.067 11 19 11C20.933 11 22.5 12.567 22.5 14.5C22.5 16.433 19 18 19 20"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="19" cy="23" r="1" fill="currentColor"/>
    </svg>
  )
}

const OPTIONS: { value: LayoutSource; label: string; sub: string; Icon: React.FC }[] = [
  {
    value: 'upload',
    label: 'Загружу план',
    sub: 'Есть чертёж, фото или PDF с планировкой',
    Icon: UploadIcon,
  },
  {
    value: 'manual',
    label: 'Знаю планировку',
    sub: 'Введу площади и комнаты вручную',
    Icon: ManualIcon,
  },
  {
    value: 'later',
    label: 'Пока нет плана',
    sub: 'Определимся в процессе работы',
    Icon: LaterIcon,
  },
]

export function LayoutScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<LayoutSource | undefined>(
    initialState?.layoutSource,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 3 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Планировка</h1>
          <p className={styles.description}>Есть ли у вас план помещения</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите способ указания планировки">
          {OPTIONS.map(({ value, label, sub, Icon }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(value)}
                aria-pressed={isSelected}
              >
                <div className={styles.iconWrap}>
                  <Icon />
                </div>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{label}</span>
                  <span className={styles.cardSub}>{sub}</span>
                </div>
                <div
                  className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ layoutSource: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
