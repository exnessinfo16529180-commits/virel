import { useState } from 'react'
import type { FlowState, Scope } from '../types/flow'
import styles from './ScopeScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

function FullRenovationIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Floor plan: 4 rooms, all marked */}
      <rect x="4" y="6" width="28" height="24" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="6" x2="18" y2="30" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="18" x2="32" y2="18" stroke="currentColor" strokeWidth="1.25"/>
      {/* Checkmarks in each quadrant */}
      <path d="M9 13L11 15L15 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 13L23 15L27 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 24L11 26L15 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 24L23 26L27 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PartialRenovationIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Floor plan: 4 rooms, 2 marked */}
      <rect x="4" y="6" width="28" height="24" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="6" x2="18" y2="30" stroke="currentColor" strokeWidth="1.25"/>
      <line x1="4" y1="18" x2="32" y2="18" stroke="currentColor" strokeWidth="1.25"/>
      {/* Active quadrants (top-left, bottom-right) */}
      <path d="M9 13L11 15L15 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 24L23 26L27 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Inactive quadrants (dashes) */}
      <line x1="22" y1="13" x2="26" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
      <line x1="10" y1="24" x2="14" y2="24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  )
}

function DesignOnlyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      {/* Pencil */}
      <path d="M8 28L10 22L22 10L26 14L14 26L8 28Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="20" y1="12" x2="24" y2="16" stroke="currentColor" strokeWidth="1.25"/>
      {/* Ruler */}
      <rect x="22" y="20" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.25" transform="rotate(-45 22 20)"/>
      {/* Tick marks on ruler */}
      <line x1="26" y1="22" x2="27.5" y2="23.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="28.5" y1="19.5" x2="30" y2="21" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

const OPTIONS: { value: Scope; label: string; sub: string; Icon: React.FC }[] = [
  {
    value: 'full',
    label: 'Полный ремонт',
    sub: 'Черновая + чистовая отделка, все помещения',
    Icon: FullRenovationIcon,
  },
  {
    value: 'partial',
    label: 'Частичный ремонт',
    sub: 'Отдельные комнаты или виды работ',
    Icon: PartialRenovationIcon,
  },
  {
    value: 'design_only',
    label: 'Только дизайн-проект',
    sub: 'Концепция и документация без строительства',
    Icon: DesignOnlyIcon,
  },
]

export function ScopeScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<Scope | undefined>(initialState?.scope)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 2 / 13</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Масштаб работ</h1>
          <p className={styles.description}>Что планируете сделать</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите масштаб работ">
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
          onClick={() => selected && onNext({ scope: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
