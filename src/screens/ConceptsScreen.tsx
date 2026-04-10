import { useState } from 'react'
import type { FlowState } from '../types/flow'
import styles from './ConceptsScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

type ConceptId = 'concept_a' | 'concept_b' | 'concept_c'

interface Concept {
  id: ConceptId
  code: string
  title: string
  description: string
  tags: string[]
  previewClass: string
}

const CONCEPTS: Concept[] = [
  {
    id: 'concept_a',
    code: 'Концепт A',
    title: 'Тёплый минимализм',
    description: 'Натуральные материалы, янтарный свет, сдержанная роскошь',
    tags: ['Тёплая', 'Натуральный', 'Уют'],
    previewClass: styles.previewA,
  },
  {
    id: 'concept_b',
    code: 'Концепт B',
    title: 'Холодная элегантность',
    description: 'Сталь и стекло, холодный свет, графитовые плоскости',
    tags: ['Холодная', 'Современный', 'Контраст'],
    previewClass: styles.previewB,
  },
  {
    id: 'concept_c',
    code: 'Концепт C',
    title: 'Нейтральный баланс',
    description: 'Бежевые тона, природные текстуры, спокойная атмосфера',
    tags: ['Нейтральная', 'Сканди', 'Баланс'],
    previewClass: styles.previewC,
  },
]

function CheckBadge() {
  return (
    <div className={styles.badge} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path
          d="M2 5.5L4.2 8L9 3"
          stroke="#412d00"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Выбрано
    </div>
  )
}

export function ConceptsScreen({ initialState, onNext }: Props) {
  const [selected, setSelected] = useState<ConceptId | undefined>(
    initialState?.selectedConcept,
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 9 / 14</span>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.headline}>Ваши концепты</h1>
          <p className={styles.description}>Выберите направление, которое ближе всего</p>
        </div>

        <div
          className={styles.cards}
          role="group"
          aria-label="Выберите концепт"
        >
          {CONCEPTS.map(({ id, code, title, description, tags, previewClass }) => {
            const isSelected = selected === id
            return (
              <button
                key={id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
              >
                {/* Preview */}
                <div className={`${styles.preview} ${previewClass}`}>
                  {isSelected && <CheckBadge />}
                </div>

                {/* Body */}
                <div className={styles.body}>
                  <span className={`${styles.code} ${isSelected ? styles.codeSelected : ''}`}>
                    {code}
                  </span>
                  <span className={styles.title}>{title}</span>
                  <p className={styles.desc}>{description}</p>
                  <div className={styles.tags} aria-label="Теги концепта">
                    {tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
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
          onClick={() => selected && onNext({ selectedConcept: selected })}
        >
          Продолжить
        </button>
      </footer>
    </div>
  )
}
