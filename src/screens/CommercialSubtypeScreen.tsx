import { useState } from 'react'
import type { FlowState, CommercialSubtype } from '../types/flow'
import { BackButton } from '../components/BackButton'
import styles from './CommercialSubtypeScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

const OPTIONS: { value: CommercialSubtype; label: string; sub: string }[] = [
  { value: 'office',     label: 'Офис',        sub: 'Рабочее пространство и переговорные' },
  { value: 'retail',     label: 'Ритейл',      sub: 'Магазин, шоурум, салон красоты' },
  { value: 'horeca',     label: 'HoReCa',      sub: 'Ресторан, кафе, отель, бар' },
  { value: 'industrial', label: 'Производство', sub: 'Склад, цех, мастерская' },
  { value: 'other',      label: 'Другое',       sub: 'Иной формат коммерческого помещения' },
]

export function CommercialSubtypeScreen({ initialState, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<CommercialSubtype | undefined>(
    initialState?.commercialSubtype,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {onBack && <BackButton onClick={onBack} />}
        <span className={styles.step}>Шаг 1б</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Тип бизнеса</h1>
          <p className={styles.description}>Уточните формат помещения</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите тип бизнеса">
          {OPTIONS.map(({ value, label, sub }) => {
            const isSelected = selected === value
            return (
              <button
                key={value}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(value)}
                aria-pressed={isSelected}
              >
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
          onClick={() => selected && onNext({ commercialSubtype: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
