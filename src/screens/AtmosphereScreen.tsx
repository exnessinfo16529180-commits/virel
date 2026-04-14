import { useState } from 'react'
import type { FlowState, Atmosphere } from '../types/flow'
import styles from './AtmosphereScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const OPTIONS: {
  value: Atmosphere
  label: string
  sub: string
  gradientClass: string
}[] = [
  {
    value: 'calm',
    label: 'Спокойная',
    sub: 'Сдержанность и природные оттенки',
    gradientClass: styles.swatchCalm,
  },
  {
    value: 'warm',
    label: 'Тёплая',
    sub: 'Уют, янтарь и живые текстуры',
    gradientClass: styles.swatchWarm,
  },
  {
    value: 'minimal',
    label: 'Минималистичная',
    sub: 'Чистота линий, ничего лишнего',
    gradientClass: styles.swatchMinimal,
  },
  {
    value: 'contrast',
    label: 'Контрастная',
    sub: 'Драма тёмного и золотого',
    gradientClass: styles.swatchContrast,
  },
]

export function AtmosphereScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<Atmosphere | undefined>(
    initialState?.atmosphere,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 4 / 13</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Атмосфера</h1>
          <p className={styles.description}>Какое настроение должен создавать интерьер</p>
        </div>

        <div
          className={styles.grid}
          role="group"
          aria-label="Выберите атмосферу интерьера"
        >
          {OPTIONS.map(({ value, label, sub, gradientClass }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(value)}
                aria-pressed={isSelected}
              >
                <div className={`${styles.swatch} ${gradientClass}`}>
                  {isSelected && (
                    <div className={styles.swatchCheck} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7.25" stroke="#e9c176" strokeWidth="1.5" />
                        <path
                          d="M5 8.2L7.1 10.5L11 6"
                          stroke="#e9c176"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.cardText}>
                  <span className={styles.cardLabel}>{label}</span>
                  <span className={styles.cardSub}>{sub}</span>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ atmosphere: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
