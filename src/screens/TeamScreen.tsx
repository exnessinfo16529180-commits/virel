import { useState } from 'react'
import type { FlowState } from '../types/flow'
import styles from './TeamScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type TeamId = 'econom' | 'balanced' | 'premium'

interface TeamOption {
  id: TeamId
  title: string
  description: string
  duration: string
  control: string
  costTag: string
  costTagClass: string
}

const TEAMS: TeamOption[] = [
  {
    id: 'econom',
    title: 'Эконом бригада',
    description:
      'Частная бригада без прораба. Подходит для типового ремонта при постоянном контроле заказчика.',
    duration: '2–3 мес на 50 м²',
    control: 'самостоятельно',
    costTag: 'эконом',
    costTagClass: styles.tagNeutral,
  },
  {
    id: 'balanced',
    title: 'Сбалансированная',
    description:
      'Бригада с прорабом, еженедельная отчётность. Разумное сочетание цены и управляемости.',
    duration: '3–4 мес на 50 м²',
    control: 'прораб + отчёты',
    costTag: 'баланс',
    costTagClass: styles.tagGold,
  },
  {
    id: 'premium',
    title: 'Премиум команда',
    description:
      'Компания с проектным менеджером, авторским надзором дизайнера и письменной гарантией.',
    duration: '4–5 мес на 50 м²',
    control: 'менеджер + надзор',
    costTag: 'высокий',
    costTagClass: styles.tagNeutral,
  },
]

export function TeamScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<TeamId | undefined>(
    initialState?.teamPackage,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 12 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Команда ремонта</h1>
          <p className={styles.description}>Тип подрядчика для вашего проекта</p>
        </div>

        <div className={styles.cards} role="group" aria-label="Выберите команду">
          {TEAMS.map(({ id, title, description, duration, control, costTag, costTagClass }) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
              >
                {/* Top row: title + tag + dot */}
                <div className={styles.cardTop}>
                  <span className={`${styles.title} ${isSelected ? styles.titleSelected : ''}`}>
                    {title}
                  </span>
                  <div className={styles.cardTopRight}>
                    <span className={`${styles.costTag} ${costTagClass}`}>{costTag}</span>
                    <div
                      className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Description */}
                <p className={styles.desc}>{description}</p>

                {/* Meta rows */}
                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Срок</span>
                    <span className={styles.metaVal}>{duration}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Контроль</span>
                    <span className={styles.metaVal}>{control}</span>
                  </div>
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
          onClick={() => selected && onNext({ teamPackage: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
