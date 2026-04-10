import { useState } from 'react'
import type { FlowState, InteriorStyle } from '../types/flow'
import styles from './StyleScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const OPTIONS: {
  value: InteriorStyle
  label: string
  sub: string
  gradientClass: string
}[] = [
  {
    value: 'modern',
    label: 'Современный',
    sub: 'Сталь, бетон и живой свет',
    gradientClass: styles.swatchModern,
  },
  {
    value: 'scandi',
    label: 'Сканди',
    sub: 'Береза, лён и природная зелень',
    gradientClass: styles.swatchScandi,
  },
  {
    value: 'minimal',
    label: 'Минимализм',
    sub: 'Только необходимое, ничего лишнего',
    gradientClass: styles.swatchMinimal,
  },
  {
    value: 'neoclassic',
    label: 'Неоклассика',
    sub: 'Слоновая кость, золото, тёмный орех',
    gradientClass: styles.swatchNeoclassic,
  },
]

export function StyleScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<InteriorStyle | undefined>(
    initialState?.style,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 6 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Стиль интерьера</h1>
          <p className={styles.description}>Направление, которое вам близко</p>
        </div>

        <div
          className={styles.grid}
          role="group"
          aria-label="Выберите стиль интерьера"
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
          onClick={() => selected && onNext({ style: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
