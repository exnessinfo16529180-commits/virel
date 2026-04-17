import { useState } from 'react'
import type { FlowState, BudgetRange } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './BudgetScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

interface BudgetOption {
  value: BudgetRange
  label: string
  sub: string
  fill: number // 0–100, width % of budget bar
}

const MAIN_OPTIONS: BudgetOption[] = [
  { value: 'under_5m', label: 'До 5 млн ₸',   sub: 'Базовое решение',      fill: 15 },
  { value: '5_10m',    label: '5–10 млн ₸',    sub: 'Оптимальный выбор',   fill: 35 },
  { value: '10_20m',   label: '10–20 млн ₸',   sub: 'Повышенный комфорт',  fill: 55 },
  { value: '20_35m',   label: '20–35 млн ₸',   sub: 'Премиум-сегмент',     fill: 75 },
  { value: 'over_35m', label: '35+ млн ₸',      sub: 'Exclusive',           fill: 95 },
]

export function BudgetScreen({ initialState, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<BudgetRange | undefined>(
    initialState?.budgetRange,
  )

  const handleSelect = (value: BudgetRange) =>
    setSelected(prev => (prev === value ? undefined : value))

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 7 / 16</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Бюджет</h1>
          <p className={styles.description}>Ориентировочный бюджет на ремонт</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите бюджет">
          {MAIN_OPTIONS.map(({ value, label, sub, fill }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => handleSelect(value)}
                aria-pressed={isSelected}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardText}>
                    <span className={styles.cardLabel}>{label}</span>
                    <div className={styles.barTrack} aria-hidden="true">
                      <div
                        className={`${styles.barFill} ${isSelected ? styles.barFillSelected : ''}`}
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                    <span className={styles.cardSub}>{sub}</span>
                  </div>
                  <div
                    className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Quiet secondary option */}
        <div className={styles.unsureWrap}>
          <button
            className={`${styles.unsureCard} ${selected === 'unsure' ? styles.unsureSelected : ''}`}
            onClick={() => handleSelect('unsure')}
            aria-pressed={selected === 'unsure'}
          >
            <span className={styles.unsureLabel}>Пока не уверен</span>
            <div
              className={`${styles.dot} ${selected === 'unsure' ? styles.dotSelected : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ budgetRange: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
