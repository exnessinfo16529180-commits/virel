import { useState } from 'react'
import type { FlowState, ProjectType } from '../types/flow'
import styles from './ProjectTypeScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

function NewBuildIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="6" y="14" width="24" height="18" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14L18 4L34 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="11" y="19" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="21" y="19" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="14" y="26" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  )
}

function ResaleIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="12" height="22" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="16" y="16" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 16L24 10L32 16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="19" y="20" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="26" y="20" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="7" y="15" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="7" y="22" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="21" y="26" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  )
}

function CommercialIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="8" y="4" width="20" height="28" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="10" x2="28" y2="10" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="8" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="8" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.25"/>
      <rect x="14" y="26" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="32" x2="32" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const OPTIONS: { value: ProjectType; label: string; sub: string; Icon: React.FC }[] = [
  {
    value: 'new_build',
    label: 'Новостройка',
    sub: 'Квартира в новом ЖК или строящемся доме',
    Icon: NewBuildIcon,
  },
  {
    value: 'resale',
    label: 'Вторичка',
    sub: 'Готовое жильё с историей',
    Icon: ResaleIcon,
  },
  {
    value: 'commercial',
    label: 'Коммерческое',
    sub: 'Офис, торговое или производственное помещение',
    Icon: CommercialIcon,
  },
]

export function ProjectTypeScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<ProjectType | undefined>(
    initialState?.projectType,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 1 / 13</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Тип проекта</h1>
          <p className={styles.description}>Что будем обновлять</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите тип проекта">
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
                <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ projectType: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
