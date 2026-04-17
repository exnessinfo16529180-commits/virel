import { useEffect, useRef, useState } from 'react'
import type { FlowState } from '../types/flow'
import styles from './PreFinalizationScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
  onBack?: () => void
}

const STEPS = [
  'Анализ параметров проекта',
  'Расчёт объёмов работ',
  'Подбор расценок',
  'Формирование сметы',
] as const

const STEP_MS = 1100

export function PreFinalizationScreen({ onNext }: Props) {
  const [completed, setCompleted] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (completed >= STEPS.length) return
    const t = setTimeout(() => setCompleted(n => n + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [completed])

  const isDone = completed >= STEPS.length

  // Auto-advance once all steps done
  useEffect(() => {
    if (!isDone) return
    if (started.current) return
    started.current = true
    const t = setTimeout(() => onNext({}), 600)
    return () => clearTimeout(t)
  }, [isDone, onNext])

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.orbWrap} aria-hidden="true">
          <div className={`${styles.orb} ${isDone ? styles.orbDone : ''}`}>
            <div className={styles.orbRing} />
            <div className={styles.orbCore} />
          </div>
        </div>

        <div className={styles.intro}>
          <h1 className={styles.headline}>
            {isDone ? 'Смета готова' : 'Готовим смету'}
          </h1>
          <p className={styles.description}>
            {isDone
              ? 'Детальный расчёт сформирован'
              : 'Рассчитываем финальные показатели вашего проекта'}
          </p>
        </div>

        <ol className={styles.steps} aria-label="Этапы расчёта">
          {STEPS.map((label, i) => {
            const done = i < completed
            const active = i === completed && !isDone
            return (
              <li
                key={label}
                className={`${styles.stepItem} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
              >
                <span className={styles.stepIcon} aria-hidden="true">
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7.25" stroke="#e9c176" strokeWidth="1.5" />
                      <path d="M4.5 8L7 10.5L11.5 5.5" stroke="#e9c176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <span className={styles.activePulse} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7.25" stroke="rgba(209,197,180,0.2)" strokeWidth="1.5" />
                    </svg>
                  )}
                </span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            )
          })}
        </ol>
      </main>
    </div>
  )
}
