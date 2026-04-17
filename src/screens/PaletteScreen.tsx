import { useState } from 'react'
import type { FlowState, Palette } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './PaletteScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

interface PaletteOption {
  value: Palette
  label: string
  sub: string
  swatches: string[]
}

const OPTIONS: PaletteOption[] = [
  {
    value: 'neutral',
    label: 'Нейтральная',
    sub: 'Бежевый, грейдж, молочный',
    swatches: ['#F5F0E8', '#E8DDD0', '#C8B89A', '#A09080', '#7A6E64'],
  },
  {
    value: 'warm',
    label: 'Тёплая',
    sub: 'Песочный, терракота, янтарь',
    swatches: ['#F2D5A0', '#E8A87C', '#C86B3A', '#A0522D', '#7B3F1E'],
  },
  {
    value: 'cool',
    label: 'Холодная',
    sub: 'Серо-синий, графит, дымчатый',
    swatches: ['#B0BEC5', '#78909C', '#546E7A', '#37474F', '#263238'],
  },
  {
    value: 'contrast',
    label: 'Контрастная',
    sub: 'Глубокий тёмный и золотой акцент',
    swatches: ['#1A1A1A', '#2D2D2D', '#4A4035', '#C5A059', '#E9C176'],
  },
]

export function PaletteScreen({ initialState, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<Palette | undefined>(
    initialState?.palette,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 6 / 16</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Цветовая палитра</h1>
          <p className={styles.description}>Базовые цвета вашего интерьера</p>
        </div>

        <div
          className={styles.cards}
          role="group"
          aria-label="Выберите цветовую палитру"
        >
          {OPTIONS.map(({ value, label, sub, swatches }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(value)}
                aria-pressed={isSelected}
              >
                <div className={styles.swatchRow} aria-hidden="true">
                  {swatches.map((color) => (
                    <span
                      key={color}
                      className={styles.swatch}
                      style={{ background: color }}
                    />
                  ))}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardText}>
                    <span className={styles.cardLabel}>{label}</span>
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
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!selected}
          onClick={() => selected && onNext({ palette: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
