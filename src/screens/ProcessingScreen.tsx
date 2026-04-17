import { useEffect, useRef, useState } from 'react'
import type { FlowState } from '../types/flow'
import { generateConceptImages } from '../services/conceptImages'
import type { GenerationResult } from '../services/conceptImages'
import styles from './ProcessingScreen.module.css'

interface Props {
  initialState?: FlowState
  onNext: (update: Partial<FlowState>) => void
}

const STAGE_LABELS = [
  'Анализ планировки',
  'Подбор атмосферы и палитры',
  'Расчёт ориентировочного бюджета',
  'Формирование концептов',
] as const

const STAGE_DURATION_MS = 1200

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9.25" stroke="#e9c176" strokeWidth="1.5" />
      <path
        d="M6.5 10.25L8.9 12.9L13.5 7.5"
        stroke="#e9c176"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9.25" stroke="rgba(209,197,180,0.3)" strokeWidth="1.5" />
    </svg>
  )
}

export function ProcessingScreen({ initialState, onNext }: Props) {
  const [completedCount, setCompletedCount] = useState(0)
  const [generationDone, setGenerationDone] = useState(false)
  const generationResultRef = useRef<GenerationResult | null>(null)
  const generationStarted = useRef(false)

  // Stage timer — deterministic 1200ms per stage
  useEffect(() => {
    if (completedCount >= STAGE_LABELS.length) return
    const timer = setTimeout(() => {
      setCompletedCount(prev => prev + 1)
    }, STAGE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [completedCount])

  // Start image generation immediately on mount — runs in parallel with stages
  useEffect(() => {
    if (generationStarted.current) return
    generationStarted.current = true

    generateConceptImages(initialState ?? {}).then(result => {
      generationResultRef.current = result
      setGenerationDone(true)
    }).catch(() => {
      // generateConceptImages never rejects — this is a safety net
      generationResultRef.current = null
      setGenerationDone(true)
    })
  }, [initialState])

  const stagesDone = completedCount >= STAGE_LABELS.length
  const isDone = stagesDone && generationDone
  const activeIndex = stagesDone ? -1 : completedCount

  const ctaLabel = !stagesDone
    ? 'Продолжить'
    : !generationDone
      ? 'Генерируем изображения…'
      : 'Смотреть концепты'

  const handleNext = () => {
    if (!isDone) return
    const result = generationResultRef.current
    const update: Partial<FlowState> = {
      processingDone:  true,
      processingStage: 4,
    }
    if (result) {
      update.conceptImages = result.images
      if (result.debug) update.conceptGenerationDebug = result.debug
    }
    onNext(update)
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.step}>Шаг 8 / 13</span>
      </header>

      <main className={styles.main}>
        {/* Pulsing orb */}
        <div className={styles.orbWrap} aria-hidden="true">
          <div className={`${styles.orb} ${isDone ? styles.orbDone : ''}`}>
            <div className={styles.orbRing} />
            <div className={styles.orbCore} />
          </div>
        </div>

        {/* Headline */}
        <div className={styles.intro}>
          <h1 className={styles.headline}>
            {isDone ? 'Концепция готова' : 'Готовим концепцию'}
          </h1>
          <p className={styles.description}>
            {isDone
              ? 'Ваши визуальные варианты сформированы'
              : 'Анализируем ваши решения и собираем визуальные варианты'}
          </p>
        </div>

        {/* Stage list */}
        <ol className={styles.stages} aria-label="Этапы обработки">
          {STAGE_LABELS.map((label, i) => {
            const done   = i < completedCount
            const active = i === activeIndex
            return (
              <li
                key={label}
                className={`${styles.stage} ${done ? styles.stageDone : ''} ${active ? styles.stageActive : ''}`}
              >
                <span className={styles.stageIcon}>
                  {done ? (
                    <CheckIcon />
                  ) : active ? (
                    <span className={styles.activeDot} aria-hidden="true" />
                  ) : (
                    <PendingIcon />
                  )}
                </span>
                <span className={styles.stageLabel}>{label}</span>
              </li>
            )
          })}
        </ol>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.cta}
          disabled={!isDone}
          onClick={handleNext}
        >
          {ctaLabel}
        </button>
      </footer>
    </div>
  )
}
